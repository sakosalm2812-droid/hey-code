/**
 * HEY Delegation Plan.
 *
 * Turns a selection into a bounded DAG that a scheduler can execute. The rule that
 * matters: **a plan can never merge without verification.** Every plan this module
 * produces has a verifier node that depends on every executor node, and the only way
 * to get a plan without one is to ask for a proposal that has no verifier — which is
 * rejected as `missing-verifier`.
 *
 * Two entry modes:
 *   - `buildPlan({ task, agents, constraints })` selects agents (via
 *     `selectAgents`, with the verifier forced on) and lays them out;
 *   - `buildPlan({ agents, constraints: { proposedNodes, verifierId } })` validates a
 *     DAG proposed by a planner. This is the mode that can contain a cycle, an unknown
 *     agent or a verifier that does not depend on the work — and reporting those is
 *     the point of it.
 *
 * `invalid` values: `null` (valid), `cycle`, `missing-verifier`, `too-many-nodes`,
 * `unknown-agent`, `selection-refused`, `invalid-nodes`. The first four are the
 * contract; the last three are extensions needed to describe real failure.
 *
 * Pure: no I/O, no clock, no randomness, deterministic ordering.
 *
 * @module core/delegationPlan
 */

import { HARD_MAX_AGENTS, selectAgents } from './agentSelection.js';

/** Widest parallel fan-out a generated plan may use. */
export const DEFAULT_MAX_PARALLEL = 3;
export const HARD_MAX_PARALLEL = 3;

/** Total nodes (executors + verifier) a plan may contain. */
export const DEFAULT_MAX_NODES = 6;

const isPlainObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

function emptyPlan(invalid, reason, extra = {}) {
  return {
    nodes: [],
    verifierId: extra.verifierId ?? null,
    maxParallel: 0,
    estimatedSteps: 0,
    invalid,
    reason,
    executors: [],
  };
}

/**
 * Depth-first cycle detection over `dependsOn` edges.
 * @param {{ id: string, dependsOn: string[] }[]} nodes
 * @returns {{ id: string }[]|null} the first cycle found, or null
 */
export function findCycle(nodes) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const WHITE = 0;
  const GREY = 1;
  const BLACK = 2;
  const colour = new Map(nodes.map((node) => [node.id, WHITE]));
  const stack = [];

  const visit = (id) => {
    colour.set(id, GREY);
    stack.push(id);
    for (const dependency of byId.get(id)?.dependsOn ?? []) {
      if (!byId.has(dependency)) continue;
      const state = colour.get(dependency);
      if (state === GREY) {
        const start = stack.indexOf(dependency);
        return [...stack.slice(start), dependency];
      }
      if (state === WHITE) {
        const found = visit(dependency);
        if (found) return found;
      }
    }
    stack.pop();
    colour.set(id, BLACK);
    return null;
  };

  for (const node of nodes) {
    if (colour.get(node.id) === WHITE) {
      const found = visit(node.id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Structural validation of a plan. Independent of how the plan was produced.
 *
 * @param {object} plan
 * @param {object} [options]
 * @param {number} [options.maxNodes]
 * @param {boolean} [options.requireVerifier=true]
 * @returns {{ ok: boolean, errors: { code: string, message: string }[] }}
 */
export function validatePlan(plan, options = {}) {
  const errors = [];
  const push = (code, message) => errors.push({ code, message });
  if (!isPlainObject(plan) || !Array.isArray(plan.nodes)) {
    return { ok: false, errors: [{ code: 'invalid-nodes', message: 'plan.nodes must be an array' }] };
  }
  const maxNodes = options.maxNodes ?? DEFAULT_MAX_NODES;
  const requireVerifier = options.requireVerifier !== false;

  if (plan.nodes.length === 0) push('invalid-nodes', 'plan has no nodes');
  if (plan.nodes.length > maxNodes) push('too-many-nodes', `plan has ${plan.nodes.length} nodes, limit ${maxNodes}`);

  const ids = new Set();
  for (const node of plan.nodes) {
    if (!isPlainObject(node) || typeof node.id !== 'string' || typeof node.agentId !== 'string') {
      push('invalid-nodes', 'every node needs a string id and agentId');
      continue;
    }
    if (ids.has(node.id)) push('invalid-nodes', `duplicate node id "${node.id}"`);
    ids.add(node.id);
  }
  for (const node of plan.nodes) {
    for (const dependency of node.dependsOn ?? []) {
      if (!ids.has(dependency)) push('invalid-nodes', `node "${node.id}" depends on unknown node "${dependency}"`);
    }
  }

  const cycle = findCycle(plan.nodes);
  if (cycle) push('cycle', `dependency cycle: ${cycle.join(' -> ')}`);

  if (requireVerifier) {
    if (!plan.verifierId) {
      push('missing-verifier', 'plan has no verifier');
    } else {
      const verifierNode = plan.nodes.find((node) => node.agentId === plan.verifierId || node.id === plan.verifierId);
      if (!verifierNode) {
        push('missing-verifier', `verifier "${plan.verifierId}" is not a node in the plan`);
      } else {
        const executors = plan.nodes.filter((node) => node !== verifierNode);
        const dependencies = new Set(verifierNode.dependsOn ?? []);
        const missing = executors.filter((node) => !dependencies.has(node.id) && !dependencies.has(node.agentId));
        if (missing.length > 0) {
          push(
            'missing-verifier',
            `verifier does not depend on ${missing.map((node) => node.id).join(', ')} — the plan could merge unverified`
          );
        }
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

/** Topological order of node ids, or throws when the plan has a cycle. */
export function planOrder(plan) {
  const cycle = findCycle(plan.nodes ?? []);
  if (cycle) throw new Error(`cannot order a cyclic plan: ${cycle.join(' -> ')}`);
  const ordered = [];
  const placed = new Set();
  const remaining = [...(plan.nodes ?? [])];
  while (remaining.length > 0) {
    const ready = remaining.filter((node) => (node.dependsOn ?? []).every((dependency) => placed.has(dependency)));
    if (ready.length === 0) throw new Error('cannot order plan: unresolved dependencies');
    for (const node of ready) {
      ordered.push(node.id);
      placed.add(node.id);
    }
    for (const node of ready) remaining.splice(remaining.indexOf(node), 1);
  }
  return ordered;
}

/**
 * Build a delegation plan.
 *
 * @param {object} request
 * @param {object[]} request.agents agent records
 * @param {object} [request.task] forwarded to `selectAgents`
 * @param {object} [request.constraints]
 * @param {number} [request.constraints.maxParallel=3] capped at 3
 * @param {number} [request.constraints.maxNodes=6]
 * @param {{id?: string, agentId: string, dependsOn?: string[]}[]} [request.constraints.proposedNodes]
 *   validate this DAG instead of selecting agents
 * @param {string} [request.constraints.verifierId] required with `proposedNodes`
 * @returns {object} plan
 */
export function buildPlan({ agents, task, constraints } = {}) {
  const limits = isPlainObject(constraints) ? constraints : {};
  const requestedParallel = limits.maxParallel ?? DEFAULT_MAX_PARALLEL;
  if (!Number.isInteger(requestedParallel) || requestedParallel < 1) {
    return emptyPlan('invalid-nodes', 'maxParallel must be an integer >= 1');
  }
  const maxParallel = Math.min(requestedParallel, HARD_MAX_PARALLEL);
  const maxNodes = limits.maxNodes ?? DEFAULT_MAX_NODES;
  if (!Number.isInteger(maxNodes) || maxNodes < 2) {
    return emptyPlan('invalid-nodes', 'maxNodes must be an integer >= 2');
  }

  if (Array.isArray(limits.proposedNodes)) {
    return planFromProposal(limits.proposedNodes, limits.verifierId, agents, maxParallel, maxNodes);
  }

  // Selection always runs with a verifier: a plan that can merge unverified is not
  // a plan. `requireVerifier: false` from the caller is overridden deliberately.
  const selection = selectAgents({
    agents,
    task,
    constraints: { ...limits, requireVerifier: true, maxAgents: Math.min(limits.maxAgents ?? HARD_MAX_AGENTS, HARD_MAX_AGENTS) },
  });

  if (selection.refusedBecause) {
    const invalid = selection.refusedBecause === 'no-verifier' ? 'missing-verifier' : 'selection-refused';
    return emptyPlan(invalid, selection.reason, { verifierId: selection.verifier });
  }
  if (!selection.verifier) {
    return emptyPlan('missing-verifier', 'selection produced no verifier; refusing to plan an unverified merge');
  }

  const executorIds = selection.selectedIds;
  const nodes = executorIds.map((agentId, index) => ({
    id: agentId,
    agentId,
    dependsOn: [],
    parallelGroup: Math.floor(index / maxParallel) + 1,
    role: 'executor',
  }));
  nodes.push({
    id: `verify:${selection.verifier}`,
    agentId: selection.verifier,
    dependsOn: [...executorIds],
    parallelGroup: Math.ceil(executorIds.length / maxParallel) + 1,
    role: 'verifier',
  });

  const plan = {
    nodes,
    verifierId: selection.verifier,
    maxParallel: Math.min(maxParallel, Math.max(1, executorIds.length)),
    estimatedSteps: nodes.length,
    invalid: null,
    reason: `${executorIds.length} parallel executor(s), verifier ${selection.verifier} depends on all of them.`,
    executors: [...executorIds],
    selection,
  };

  const validation = validatePlan(plan, { maxNodes, requireVerifier: true });
  if (!validation.ok) {
    const first = validation.errors[0];
    return emptyPlan(first.code, first.message, { verifierId: plan.verifierId });
  }
  return plan;
}

function planFromProposal(proposedNodes, verifierId, agents, maxParallel, maxNodes) {
  if (proposedNodes.length === 0) return emptyPlan('invalid-nodes', 'proposedNodes is empty');
  if (proposedNodes.length > maxNodes) {
    return emptyPlan('too-many-nodes', `proposal has ${proposedNodes.length} nodes, limit ${maxNodes}`);
  }
  const known = new Set(
    (Array.isArray(agents) ? agents : []).map((agent) => (typeof agent === 'string' ? agent : agent?.id)).filter(Boolean)
  );
  const nodes = [];
  for (let index = 0; index < proposedNodes.length; index += 1) {
    const proposed = proposedNodes[index];
    if (!isPlainObject(proposed) || typeof proposed.agentId !== 'string') {
      return emptyPlan('invalid-nodes', `proposed node ${index} has no agentId`);
    }
    if (!known.has(proposed.agentId)) {
      return emptyPlan('unknown-agent', `proposed node ${index} names unknown agent "${proposed.agentId}"`);
    }
    nodes.push({
      id: proposed.id ?? proposed.agentId,
      agentId: proposed.agentId,
      dependsOn: Array.isArray(proposed.dependsOn) ? [...proposed.dependsOn] : [],
      parallelGroup: Number.isInteger(proposed.parallelGroup) ? proposed.parallelGroup : 1,
      role: proposed.agentId === verifierId ? 'verifier' : 'executor',
    });
  }

  const ids = new Set();
  for (const node of nodes) {
    if (ids.has(node.id)) return emptyPlan('invalid-nodes', `duplicate node id "${node.id}"`);
    ids.add(node.id);
  }
  for (const node of nodes) {
    for (const dependency of node.dependsOn) {
      if (!ids.has(dependency)) return emptyPlan('invalid-nodes', `node "${node.id}" depends on unknown node "${dependency}"`);
    }
  }

  const cycle = findCycle(nodes);
  if (cycle) return emptyPlan('cycle', `dependency cycle: ${cycle.join(' -> ')}`);

  if (!verifierId) return emptyPlan('missing-verifier', 'proposal has no verifierId');

  const plan = {
    nodes,
    verifierId,
    maxParallel,
    estimatedSteps: nodes.length,
    invalid: null,
    reason: `proposed plan validated: ${nodes.length} nodes.`,
    executors: nodes.filter((node) => node.agentId !== verifierId).map((node) => node.agentId),
  };
  const validation = validatePlan(plan, { maxNodes, requireVerifier: true });
  if (!validation.ok) {
    const first = validation.errors[0];
    return emptyPlan(first.code, first.message, { verifierId });
  }
  return plan;
}

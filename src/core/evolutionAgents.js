/**
 * HEY — The Three Evolution Agent Contracts (Part 5, Phase F).
 *
 * Definitions only. Nothing in this module runs, schedules, or calls anything.
 * Each contract states what its agent owns, what it may do, what it must never
 * do, and where a human has to sign. The `mayNotDo` list is the load-bearing
 * part: `assertWithinScope()` refuses any action that appears on it, and refuses
 * anything outside the declared scope even when it is not explicitly banned.
 *
 * Ownership is fixed by `docs/hey/AGENT-OWNERSHIP.md`: these three roles belong
 * to Part 5 and to no other part.
 *
 * Reused, not duplicated: `EVOLUTION_CADENCES` and `deepFreeze()` come from
 * `evolutionEngine.js`, so a cadence and a frozen contract mean the same thing
 * everywhere in the evolution layer.
 *
 * @module core/evolutionAgents
 */

import { EVOLUTION_CADENCES, deepFreeze } from "./evolutionEngine.js";

/**
 * @type {string}
 */
export const EVOLUTION_AGENT_SCHEMA = "hey.evolution-agent/v1";

/**
 * Every field a contract must declare.
 * @type {ReadonlyArray<string>}
 */
export const REQUIRED_AGENT_FIELDS = Object.freeze([
  "id",
  "name",
  "scope",
  "inputs",
  "outputs",
  "mayDo",
  "mayNotDo",
  "approvalBoundary",
  "cadence",
  "budgetCentsPerRun",
  "evaluationMetric",
]);

/** @param {unknown} value @returns {boolean} */
function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** @param {unknown} value @returns {boolean} */
function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * @param {unknown} value
 * @returns {value is string[]}
 */
function isNonEmptyStringArray(value) {
  return Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString);
}

/**
 * Normalises text for comparison: lowercase, words joined by hyphens.
 * @param {unknown} value
 * @returns {string}
 */
function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * @param {Record<string, any>} contract
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateEvolutionAgent(contract) {
  const errors = [];
  if (!isPlainObject(contract)) {
    return { ok: false, errors: ["An evolution agent contract must be a plain object."] };
  }

  for (const field of REQUIRED_AGENT_FIELDS) {
    if (!(field in contract)) errors.push(`${field} is required.`);
  }

  if (!isNonEmptyString(contract.id)) errors.push("id must be a non-empty string.");
  if (!isNonEmptyString(contract.name)) errors.push("name must be a non-empty string.");

  if (!isNonEmptyStringArray(contract.scope)) {
    errors.push("scope must be a non-empty array of strings; an agent that owns nothing owns everything.");
  } else if (new Set(contract.scope.map(normalize)).size !== contract.scope.length) {
    errors.push("scope must not repeat an entry.");
  }

  if (!isNonEmptyStringArray(contract.inputs)) errors.push("inputs must be a non-empty array of strings.");
  if (!isNonEmptyStringArray(contract.outputs)) errors.push("outputs must be a non-empty array of strings.");
  if (!isNonEmptyStringArray(contract.mayDo)) errors.push("mayDo must be a non-empty array of strings.");

  if (!Array.isArray(contract.mayNotDo)) {
    errors.push("mayNotDo is required: an agent with no explicit prohibition has no boundary.");
  } else if (!isNonEmptyStringArray(contract.mayNotDo)) {
    errors.push("mayNotDo must be a non-empty array of strings.");
  }

  if (!isNonEmptyString(contract.approvalBoundary)) {
    errors.push("approvalBoundary must state where a human must sign.");
  }
  if (!EVOLUTION_CADENCES.includes(contract.cadence)) {
    errors.push(
      `cadence must be one of: ${EVOLUTION_CADENCES.join(", ")}; received ${JSON.stringify(contract.cadence ?? null)}.`,
    );
  }
  if (!Number.isInteger(contract.budgetCentsPerRun) || contract.budgetCentsPerRun < 0) {
    errors.push("budgetCentsPerRun must be a non-negative integer number of cents.");
  }
  if (!isNonEmptyString(contract.evaluationMetric)) {
    errors.push("evaluationMetric must state how the agent's work is judged.");
  }

  return { ok: errors.length === 0, errors };
}

/**
 * @param {unknown} left
 * @param {unknown} right
 * @returns {boolean}
 */
function overlaps(left, right) {
  const a = normalize(left);
  const b = normalize(right);
  if (a.length < 4 || b.length < 4) return false;
  return a.includes(b) || b.includes(a);
}

/**
 * Decide whether an action belongs to an agent. Refuses anything on `mayNotDo`
 * first, then anything outside the declared scope.
 *
 * @param {Record<string, any>} contract
 * @param {string|{ id?: string, scope?: string, description?: string }} action
 * @returns {{ allowed: boolean, reason: string, rule?: string }}
 */
export function assertWithinScope(contract, action) {
  const validation = validateEvolutionAgent(contract);
  if (!validation.ok) {
    return {
      allowed: false,
      reason: `The contract is invalid and cannot authorise anything: ${validation.errors.join(" ")}`,
    };
  }

  const description =
    typeof action === "string"
      ? action
      : isPlainObject(action)
        ? [action.scope, action.id, action.description].filter(isNonEmptyString).join(" ")
        : "";
  if (!description) {
    return { allowed: false, reason: "An action must be named as a string or an object with scope, id or description." };
  }

  if (isPlainObject(action) && action.scope !== undefined) {
    const scope = normalize(action.scope);
    const declared = contract.scope.map(normalize);
    if (!declared.includes(scope)) {
      return {
        allowed: false,
        reason: `${contract.id} does not own the scope ${JSON.stringify(action.scope)}; it owns ${contract.scope.join(", ")}.`,
        rule: "scope",
      };
    }
  }

  // Prohibitions are matched against what the agent is being asked to do, never
  // against the scope name alone: a scope like "routing" appears inside a
  // prohibition sentence and would otherwise veto legitimate routing work.
  const tokens = isPlainObject(action)
    ? [action.id, action.description].filter(isNonEmptyString)
    : [description];

  for (const forbidden of contract.mayNotDo) {
    if (tokens.some((token) => overlaps(token, forbidden))) {
      return {
        allowed: false,
        reason: `${contract.id} must never ${JSON.stringify(forbidden)}.`,
        rule: forbidden,
      };
    }
  }

  if (isPlainObject(action) && isNonEmptyString(action.scope)) {
    return {
      allowed: true,
      reason: `${JSON.stringify(action.scope)} is inside the declared scope of ${contract.id}.`,
    };
  }

  const matchesScope = contract.scope.some((scope) => overlaps(description, scope));
  const matchesMayDo = contract.mayDo.some((entry) => overlaps(description, entry));
  if (!matchesScope && !matchesMayDo) {
    return {
      allowed: false,
      reason: `${contract.id} has no declared permission for ${JSON.stringify(description)}; an action must be in scope or in mayDo.`,
      rule: "scope",
    };
  }

  return {
    allowed: true,
    reason: `${JSON.stringify(description)} is inside the declared scope of ${contract.id}.`,
  };
}

/**
 * Model Evolution owns model choice, routing, evaluation and adaptation
 * research. It must never imply HEY trained weights.
 * @type {Readonly<Record<string, any>>}
 */
export const MODEL_EVOLUTION_AGENT = deepFreeze({
  schema: EVOLUTION_AGENT_SCHEMA,
  id: "agent.model-evolution",
  name: "Model Evolution Agent",
  scope: Object.freeze(["model-selection", "routing", "model-evaluation", "adaptation-research"]),
  inputs: Object.freeze([
    "recorded provider responses",
    "model registry snapshot",
    "cost governor envelope",
    "quality reports",
  ]),
  outputs: Object.freeze([
    "evaluation report",
    "routing recommendation",
    "cost comparison",
    "vault proposal",
  ]),
  mayDo: Object.freeze([
    "select a model for a declared task class",
    "propose a routing change with cost and quality evidence",
    "run evaluations against recorded fixtures",
    "write an evaluation report into the Vault",
  ]),
  mayNotDo: Object.freeze([
    "claim HEY trained weights because routing changed",
    "change production routing without an owner approval",
    "call a provider while evaluating",
    "delete an evaluation record",
  ]),
  approvalBoundary:
    "An owner (Sako or Amad) must approve before any routing change leaves Approved. The agent may never write routing policy itself.",
  cadence: "weekly",
  budgetCentsPerRun: 250,
  evaluationMetric:
    "Cost per verified answer at or above the quality floor, measured on recorded fixtures.",
});

/**
 * Capability Evolution owns features, workflows, integrations and UX. It must
 * never touch production or approve its own work.
 * @type {Readonly<Record<string, any>>}
 */
export const CAPABILITY_EVOLUTION_AGENT = deepFreeze({
  schema: EVOLUTION_AGENT_SCHEMA,
  id: "agent.capability-evolution",
  name: "Capability Evolution Agent",
  scope: Object.freeze(["features", "workflows", "integrations", "ux-improvements"]),
  inputs: Object.freeze([
    "capability contract",
    "Vault records",
    "usage and incident counts",
    "user requests",
  ]),
  outputs: Object.freeze([
    "capability proposal",
    "machine-readable change plan",
    "kill criteria",
    "cost estimate",
  ]),
  mayDo: Object.freeze([
    "draft a capability proposal with a change plan",
    "estimate per-use and worst-case cost",
    "propose kill criteria for an owner to register",
    "record shadow and test evidence",
  ]),
  mayNotDo: Object.freeze([
    "modify production code directly",
    "self-approve its own proposal",
    "grant itself or another agent a new permission",
    "promote a capability without three uses and zero incidents",
  ]),
  approvalBoundary:
    "A named owner (Sako or Amad) decides keep, delete or keep-with-changes. The agent may never approve, and may never promote.",
  cadence: "weekly",
  budgetCentsPerRun: 400,
  evaluationMetric:
    "Number of proposals that reach Released with their kill criteria intact and zero incidents in the first 30 days.",
});

/**
 * Agent Evolution owns roles, orchestration, tool reliability and coordination.
 * It must never widen its own authority.
 * @type {Readonly<Record<string, any>>}
 */
export const AGENT_EVOLUTION_AGENT = deepFreeze({
  schema: EVOLUTION_AGENT_SCHEMA,
  id: "agent.agent-evolution",
  name: "Agent Evolution Agent",
  scope: Object.freeze(["agent-roles", "orchestration", "tool-reliability", "coordination"]),
  inputs: Object.freeze([
    "agent registry snapshot",
    "delegation outcomes",
    "tool failure records",
    "verifier capacity report",
  ]),
  outputs: Object.freeze([
    "role proposal",
    "orchestration change proposal",
    "tool reliability report",
    "independent verification capacity proposal",
  ]),
  mayDo: Object.freeze([
    "propose a new agent role through the Vault",
    "propose an orchestration change with a rollback step",
    "record tool reliability findings",
    "propose additional independent verification capacity",
  ]),
  mayNotDo: Object.freeze([
    "grant itself new permissions",
    "edit the agent registry directly",
    "select a verifier identical to the implementer",
    "run an agent without a declared budget",
  ]),
  approvalBoundary:
    "A named owner (Sako or Amad) approves every role or orchestration change. Agent registry edits are Part 4's, never this agent's.",
  cadence: "monthly",
  budgetCentsPerRun: 150,
  evaluationMetric:
    "Share of delegated missions that complete with a verifier different from the implementer.",
});

/**
 * The three contracts, frozen as a set.
 * @type {ReadonlyArray<Readonly<Record<string, any>>>}
 */
export const EVOLUTION_AGENTS = Object.freeze([
  MODEL_EVOLUTION_AGENT,
  CAPABILITY_EVOLUTION_AGENT,
  AGENT_EVOLUTION_AGENT,
]);

/**
 * Look up one contract by id.
 * @param {string} id
 * @returns {Readonly<Record<string, any>>|null}
 */
export function getEvolutionAgent(id) {
  return EVOLUTION_AGENTS.find((agent) => agent.id === id) ?? null;
}

export default {
  EVOLUTION_AGENT_SCHEMA,
  REQUIRED_AGENT_FIELDS,
  MODEL_EVOLUTION_AGENT,
  CAPABILITY_EVOLUTION_AGENT,
  AGENT_EVOLUTION_AGENT,
  EVOLUTION_AGENTS,
  getEvolutionAgent,
  validateEvolutionAgent,
  assertWithinScope,
};

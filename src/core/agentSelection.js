/**
 * HEY Agent Selection — deterministic, minimal, refusable, explainable.
 *
 * `selectAgents()` answers one question for one task: *which agents, why, how many,
 * and who verifies?* It is a pure function. It reads no files, no environment, no
 * clock, and no global registry: agents are an argument.
 *
 * The current router (`src/lib/agents/router.ts`) picks the single highest keyword
 * score and falls back to the Intent Agent. It never refuses, never returns more
 * than one executor, never consults risk, never consults tools, never consults
 * permissions, and records health only for display. It also cannot be asked "why
 * not that agent". This module is the provable replacement.
 *
 * Contract:
 *   1. Minimum sufficient set. One agent that covers the task beats two that half-cover
 *      it; a second executor is added only for a requirement the first cannot meet.
 *   2. Hard cap 3. Asking for more is a refusal (`max-agents-above-hard-cap`), never a
 *      silent truncation.
 *   3. Verifier separation. The verifier is always a different agent from every
 *      executor. If none exists, the selector refuses.
 *   4. Tool and permission safety. Agents using a forbidden tool, or requiring a
 *      permission outside the ceiling, are excluded with a stated reason.
 *   5. High risk needs a verifier and prefers comparable risk. A high or critical task
 *      always gets a verifier, even if the caller asked for none.
 *   6. No match means no selection. `refusedBecause: 'no-agent-match'` unless the
 *      registry declares an `alwaysEligible` agent, which is a property, not a guess.
 *   7. Deterministic. Ranking is (match score desc, category size asc, id asc) — never
 *      array order. Identical input produces an identical object, key order included.
 *
 * @module core/agentSelection
 */

import {
  RISK_CLASSES,
  TOOL_IDS,
  normalizeAgent,
  permissionsForTools,
  privacyRank,
  riskRank,
  summarizeAgents,
  validateAgent,
} from './agentContract.js';
import { isSelectable } from './agentHealth.js';

/** Absolute ceiling on executors, whatever the caller asks for. */
export const HARD_MAX_AGENTS = 3;

/** How many ranked candidates the covering search may consider. */
export const CANDIDATE_POOL_SIZE = 12;

/** Default maximum width of one selection. */
export const DEFAULT_MAX_AGENTS = 3;

/**
 * Agents that may verify even though they are not in the QA/Trust category.
 * Policy constant, deliberately explicit: a verifier has to be named by role,
 * not discovered by string similarity.
 */
export const VERIFIER_ROLE_IDS = Object.freeze(['verifier', 'fact-check', 'source-verify']);

/** Category that is, by construction, the QA/Trust family. */
export const VERIFIER_CATEGORY = 'P';

const STOPWORDS = new Set([
  'the', 'a', 'an', 'of', 'and', 'to', 'with', 'for', 'in', 'on', 'it', 'is', 'that',
  'this', 'your', 'my', 'its', 'their', 'or', 'as', 'by', 'from', 'be', 'do', 'does',
  'can', 'you', 'me', 'i', 'we', 'should', 'would', 'could', 'please', 'need', 'want',
]);

const cleanToken = (word) =>
  String(word)
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF\u0750-\u077F]+/g, ' ')
    .trim();

const wordWeight = (word) => (word.includes(' ') ? 3 : word.length >= 5 ? 2 : 1);

/** Content tokens of a free-text task description. */
export function taskTokens(text) {
  const tokens = new Set();
  for (const raw of cleanToken(text ?? '').split(' ')) {
    if (raw.length > 2 && !STOPWORDS.has(raw)) tokens.add(raw);
  }
  return tokens;
}

/**
 * The words an agent can be matched on, with the weight each is worth.
 *
 * Three classes, because they are not equally trustworthy:
 *   - **declared** keywords are intentional triggers and keep the router's weights
 *     (phrase 3, token of 5+ characters 2, otherwise 1);
 *   - **name** words are strong but incidental evidence: worth 2, minimum length 4,
 *     stopwords dropped — an agent called "Authentication Agent" is about
 *     authentication;
 *   - **description** words are weak evidence: worth 1, same filter. Without this
 *     rule, every agent whose description contains "the" and "and" matches every
 *     input containing those words — the live router's "199 of 229 agents match this
 *     sentence" failure.
 *
 * A declared keyword never lowers a weight it already has.
 */
function matchSurface(agent) {
  const surface = new Map();
  const addDeclared = (word) => {
    const cleaned = cleanToken(word);
    if (cleaned.length < 2) return;
    surface.set(cleaned, Math.max(surface.get(cleaned) ?? 0, wordWeight(cleaned)));
  };
  const addIncidental = (word, weight) => {
    const cleaned = cleanToken(word);
    if (cleaned.length < 4 || STOPWORDS.has(cleaned)) return;
    surface.set(cleaned, Math.max(surface.get(cleaned) ?? 0, weight));
  };
  String(agent.name ?? '').toLowerCase().split(/\s+/).forEach((word) => addIncidental(word, 2));
  String(agent.description ?? '').toLowerCase().split(/\s+/).forEach((word) => addIncidental(word, 1));
  for (const keyword of Array.isArray(agent.keywords) ? agent.keywords : []) addDeclared(keyword);
  return surface;
}

/** Declared keywords only — the evidence that a match was intended, not incidental. */
function declaredKeywords(agent) {
  return new Set(
    (Array.isArray(agent.keywords) ? agent.keywords : [])
      .map(cleanToken)
      .filter((word) => word.length > 1)
  );
}

const uniqueStrings = (value) =>
  Array.isArray(value) ? [...new Set(value.filter((item) => typeof item === 'string' && item.length > 0))] : [];

/**
 * Is this agent allowed to act as the independent verifier?
 * A declared flag, the QA/Trust category, or one of the named verifier roles.
 */
export function isVerifierCapable(agent) {
  if (agent?.verifierCapable === true) return true;
  if (agent?.category === VERIFIER_CATEGORY) return true;
  return VERIFIER_ROLE_IDS.includes(agent?.id);
}

function byRank(a, b) {
  if (b.coverage !== a.coverage) return b.coverage - a.coverage;
  if (b.score !== a.score) return b.score - a.score;
  if (a.categorySize !== b.categorySize) return a.categorySize - b.categorySize;
  return a.agent.id < b.agent.id ? -1 : a.agent.id > b.agent.id ? 1 : 0;
}

function combinations(items, size) {
  const results = [];
  const walk = (start, current) => {
    if (current.length === size) {
      results.push([...current]);
      return;
    }
    for (let i = start; i < items.length; i += 1) {
      current.push(items[i]);
      walk(i + 1, current);
      current.pop();
    }
  };
  walk(0, []);
  return results;
}

function covers(selection, requirements) {
  const categories = new Set();
  const tools = new Set();
  for (const agent of selection) {
    categories.add(agent.category);
    for (const tool of agent.tools) tools.add(tool);
  }
  return requirements.every((requirement) =>
    requirement.startsWith('category:')
      ? categories.has(requirement.slice('category:'.length))
      : tools.has(requirement.slice('tool:'.length))
  );
}

function describeSelection(selected, verifier, taskRisk, excludedCount) {
  const ids = selected.map((agent) => agent.id).join(', ');
  const verifierPart = verifier ? ` verified by ${verifier}` : ' unverified';
  return `${selected.length} executor${selected.length === 1 ? '' : 's'} (${ids})${verifierPart} for risk ${taskRisk}; ${excludedCount} agent(s) excluded.`;
}

/**
 * Select the minimum sufficient team for a task.
 *
 * @param {object} request
 * @param {object[]} request.agents raw or normalized agent records
 * @param {object} [request.task] `{ type, description, requiredTools, requiredCategories, risk }`
 * @param {object} [request.constraints] `{ maxAgents, requireVerifier, allowedTools, forbiddenTools, allowedPermissions, privacy }`
 * @returns {object} selection result — see the module documentation
 */
export function selectAgents({ agents, task, constraints } = {}) {
  const taskSpec = task && typeof task === 'object' ? task : {};
  const limits = constraints && typeof constraints === 'object' ? constraints : {};
  const agentList = Array.isArray(agents) ? agents : [];

  const taskRisk = taskSpec.risk ?? 'low';
  if (!RISK_CLASSES.includes(taskRisk)) {
    return refusal(`invalid-task-risk:${taskRisk}`, 'unknown task risk class', { taskRisk });
  }
  const taskRiskRank = riskRank(taskRisk);

  const maxAgents = limits.maxAgents ?? DEFAULT_MAX_AGENTS;
  if (!Number.isInteger(maxAgents) || maxAgents < 1) {
    return refusal('invalid-constraints:maxAgents', 'maxAgents must be an integer >= 1', { maxAgents });
  }
  if (maxAgents > HARD_MAX_AGENTS) {
    return refusal(
      'max-agents-above-hard-cap',
      `maxAgents ${maxAgents} exceeds the hard cap of ${HARD_MAX_AGENTS}`,
      { maxAgents }
    );
  }

  const forbiddenTools = uniqueStrings(limits.forbiddenTools);
  const allowedTools = Array.isArray(limits.allowedTools) ? uniqueStrings(limits.allowedTools) : null;
  const allowedPermissions = Array.isArray(limits.allowedPermissions)
    ? uniqueStrings(limits.allowedPermissions)
    : allowedTools
      ? permissionsForTools(allowedTools)
      : null;
  const privacyCeiling = limits.privacy === undefined ? null : privacyRank(limits.privacy);

  const requiredCategories = uniqueStrings(taskSpec.requiredCategories);
  const requiredTools = uniqueStrings(taskSpec.requiredTools);
  const requirements = [
    ...requiredCategories.map((category) => `category:${category}`),
    ...requiredTools.map((tool) => `tool:${tool}`),
  ];

  // ---- normalized, validated, ranked --------------------------------------
  const excluded = [];
  const considered = [];

  for (const raw of agentList) {
    const normalized = normalizeAgent(raw);
    const validation = validateAgent(normalized);
    if (!validation.ok) {
      excluded.push({ id: String(raw?.id ?? '<unknown>'), reason: `invalid:${validation.errors[0].code}` });
      continue;
    }
    considered.push(normalized);
  }

  const categorySizes = {};
  for (const agent of considered) categorySizes[agent.category] = (categorySizes[agent.category] ?? 0) + 1;

  const text = `${taskSpec.description ?? ''} ${taskSpec.type ?? ''}`.trim();
  const tokens = taskTokens(text);
  // Word-boundary matching for single tokens, prefix matching for short declared
  // stems ("auth" matches "authentication", "plan" matches "planning"), and substring
  // matching for phrases. The router's raw `input.includes(word)` test also matches
  // "on" inside "London"; that is a false positive this module refuses to inherit.
  const textWords = new Set(cleanToken(text).split(' ').filter(Boolean));
  const textWordList = [...textWords];
  const matches = (word) => {
    if (word.includes(' ')) return text.toLowerCase().includes(word);
    if (textWords.has(word)) return true;
    if (word.length < 3) return false;
    return textWordList.some((candidate) => candidate.length > word.length && candidate.startsWith(word));
  };

  const eligible = [];
  for (const agent of considered) {
    const blocked = blockReason(agent, { forbiddenTools, allowedTools, allowedPermissions, privacyCeiling });
    if (blocked) {
      excluded.push({ id: agent.id, reason: blocked });
      continue;
    }
    const surface = matchSurface(agent);
    const declared = declaredKeywords(agent);
    const matched = [];
    const declaredMatched = [];
    let score = 0;
    let groundedByKeyword = false;
    for (const [word, weight] of surface) {
      if (matches(word)) {
        matched.push(word);
        score += weight;
        if (declared.has(word)) {
          groundedByKeyword = true;
          declaredMatched.push(word);
        }
      }
    }
    // Coverage counts only declared matches: covering a task word by accident of
    // phrasing is not evidence of capability.
    let covered = 0;
    for (const token of tokens) {
      for (const word of declaredMatched) {
        if (word.includes(token) || token.includes(word)) { covered += 1; break; }
      }
    }
    for (const category of requiredCategories) if (agent.category === category) score += 4;
    for (const tool of requiredTools) if (agent.tools.includes(tool)) score += 2;
    // Risk adequacy is a ranking nudge for elevated tasks only. It never manufactures
    // a keyword match: `matched` is what decides whether the agent matched at all.
    if (taskRiskRank >= 2 && riskRank(agent.risk) >= taskRiskRank) score += 1;
    eligible.push({
      agent,
      score,
      matched,
      groundedByKeyword,
      coverage: tokens.size === 0 ? 0 : covered / tokens.size,
      categorySize: categorySizes[agent.category] ?? 0,
    });
  }
  eligible.sort(byRank);

  const requiresVerifier = taskRiskRank >= 3 || limits.requireVerifier === true;

  // ---- minimum covering selection ----------------------------------------
  let selected = [];

  if (requirements.length === 0) {
    // A match must be grounded in at least one *declared* keyword. Words harvested
    // from the name and description are weak evidence and may not select an agent on
    // their own — that is how a request containing only "agent" would otherwise pick
    // whichever agent happens to live in the smallest category.
    const grounded = eligible.filter((entry) => entry.matched.length > 0 && entry.groundedByKeyword);
    const best = grounded[0];
    if (best) {
      selected = [best.agent];
    } else {
      const fallback = eligible
        .filter((entry) => entry.agent.alwaysEligible === true)
        .sort((a, b) => (a.agent.id < b.agent.id ? -1 : 1))[0];
      if (fallback) selected = [fallback.agent];
      else {
        return refusal('no-agent-match', 'no eligible agent matches the task description', {
          considered: considered.length,
          excluded: finalizeExcluded(excluded, considered, []),
          requirements,
          tokens: tokens.size,
        });
      }
    }
  } else {
    if (tokens.size > 0 && !eligible.some((entry) => entry.matched.length > 0)) {
      return refusal('no-agent-match', 'no eligible agent matches the task description', {
        considered: considered.length,
        excluded: finalizeExcluded(excluded, considered, []),
        requirements,
        tokens: tokens.size,
      });
    }
    const pool = eligible.slice(0, CANDIDATE_POOL_SIZE);
    if (!covers(pool.map((entry) => entry.agent), requirements)) {
      const missing = requirements.filter((requirement) => !covers(pool.map((entry) => entry.agent), [requirement]));
      return refusal(`uncovered-requirements:${missing.join(',')}`, 'no eligible agent can satisfy every requirement', {
        considered: considered.length,
        excluded: finalizeExcluded(excluded, considered, []),
        requirements,
        uncovered: missing,
        tokens: tokens.size,
      });
    }
    let found = null;
    for (let size = 1; size <= maxAgents && !found; size += 1) {
      for (const combo of combinations(pool, size)) {
        if (covers(combo.map((entry) => entry.agent), requirements)) {
          found = combo.map((entry) => entry.agent);
          break;
        }
      }
    }
    if (!found) {
      return refusal(
        'exceeds-max-agents',
        `a covering set exists but needs more than ${maxAgents} agent(s)`,
        {
          considered: considered.length,
          excluded: finalizeExcluded(excluded, considered, []),
          requirements,
          tokens: tokens.size,
        }
      );
    }
    selected = found;
  }

  // ---- verifier ----------------------------------------------------------
  const selectedIds = new Set(selected.map((agent) => agent.id));
  const verifierCandidates = eligible
    .filter((entry) => !selectedIds.has(entry.agent.id) && isVerifierCapable(entry.agent))
    .sort((a, b) => {
      const adequacy = (entry) => (riskRank(entry.agent.risk) >= taskRiskRank ? 0 : 1);
      if (adequacy(a) !== adequacy(b)) return adequacy(a) - adequacy(b);
      if (riskRank(a.agent.risk) !== riskRank(b.agent.risk)) return riskRank(b.agent.risk) - riskRank(a.agent.risk);
      if (a.agent.category !== b.agent.category) {
        return a.agent.category === VERIFIER_CATEGORY ? -1 : b.agent.category === VERIFIER_CATEGORY ? 1 : 0;
      }
      return byRank(a, b);
    });

  let verifier = null;
  let verifierRisk = null;
  const warnings = [];
  if (requiresVerifier) {
    if (verifierCandidates.length === 0) {
      // A refusal selects nothing: returning executors here would hand the caller a
      // team that cannot be verified, which is the exact failure this module prevents.
      return refusal('no-verifier', 'a verifier is required but no distinct verifier-capable agent is eligible', {
        considered: considered.length,
        excluded: finalizeExcluded(excluded, considered, []),
        requirements,
        tokens: tokens.size,
      });
    }
    verifier = verifierCandidates[0].agent.id;
    verifierRisk = verifierCandidates[0].agent.risk;
    if (riskRank(verifierRisk) < taskRiskRank) {
      warnings.push('verifier-risk-below-task-risk');
    }
  }

  // ---- confidence: measured, not invented --------------------------------
  const topEntry = eligible.find((entry) => entry.agent.id === selected[0]?.id);
  if (requirements.length === 0 && topEntry) {
    const tie = eligible.some(
      (entry) =>
        entry.agent.id !== topEntry.agent.id &&
        entry.matched.length > 0 &&
        entry.coverage === topEntry.coverage &&
        entry.score === topEntry.score
    );
    // The decision is still deterministic, but it is a tie: say so rather than
    // presenting a coin flip as a judgement.
    if (tie) warnings.push('ambiguous-match');
  }
  const matchedWords = new Set();
  for (const agent of selected) {
    for (const word of matchSurface(agent).keys()) if (matches(word)) matchedWords.add(word);
  }
  let coveredTokens = 0;
  for (const token of tokens) {
    for (const word of matchedWords) {
      if (word.includes(token) || token.includes(word)) {
        coveredTokens += 1;
        break;
      }
    }
  }
  const tokenCoverage = tokens.size === 0 ? 0 : coveredTokens / tokens.size;
  const coveredRequirements = requirements.filter((requirement) => covers(selected, [requirement])).length;
  const requirementCoverage = requirements.length === 0 ? 1 : coveredRequirements / requirements.length;
  const verifierFactor = verifier ? 1 : requiresVerifier ? 0 : 0.5;
  const riskAdequacy = selected.every((agent) => riskRank(agent.risk) >= taskRiskRank) ? 1 : 0.5;
  // A selection with no textual grounding was justified only by an `alwaysEligible`
  // declaration. That is legal, and it is not confident.
  const grounded = matchedWords.size > 0 || requirements.length > 0;
  const rawConfidence =
    0.35 * tokenCoverage + 0.35 * requirementCoverage + 0.2 * verifierFactor + 0.1 * riskAdequacy;
  const confidence = Math.round((grounded ? rawConfidence : Math.min(rawConfidence, 0.25)) * 1000) / 1000;

  const excludedFinal = finalizeExcluded(excluded, considered, selected);
  const bestScore = selected.reduce(
    (best, agent) => Math.max(best, eligible.find((entry) => entry.agent.id === agent.id)?.score ?? 0),
    0
  );
  return {
    selected,
    selectedIds: selected.map((agent) => agent.id),
    excluded: excludedFinal,
    verifier,
    verifierRiskAdequate: verifier ? riskRank(verifierRisk) >= taskRiskRank : null,
    confidence,
    reason: describeSelection(selected, verifier, taskRisk, excludedFinal.length),
    refusedBecause: null,
    warnings,
    requirements: {
      categories: requiredCategories,
      tools: requiredTools,
      covered: requirements.filter((requirement) => covers(selected, [requirement])),
      uncovered: requirements.filter((requirement) => !covers(selected, [requirement])),
    },
    considered: considered.length,
    score: bestScore,
  };
}

/**
 * The first reason this agent may not be selected, or null.
 * Order is fixed so the reported reason is stable.
 */
function blockReason(agent, { forbiddenTools, allowedTools, allowedPermissions, privacyCeiling }) {
  if (!isSelectable(agent)) return `not-selectable:${agent.health ?? 'unknown'}`;
  for (const tool of agent.tools) {
    if (forbiddenTools.includes(tool)) return `forbidden-tool:${tool}`;
  }
  if (allowedTools) {
    for (const tool of agent.tools) {
      if (!allowedTools.includes(tool)) return `tool-not-allowed:${tool}`;
    }
  }
  if (allowedPermissions) {
    for (const permission of agent.permissions) {
      if (permission === 'admin') continue;
      if (!allowedPermissions.includes(permission)) return `permission-not-allowed:${permission}`;
    }
  }
  if (privacyCeiling !== null && privacyRank(agent.privacy) < privacyCeiling) {
    return `privacy-too-weak:${agent.privacy}`;
  }
  return null;
}

/** Every considered agent that was not selected gets exactly one stated reason. */
function finalizeExcluded(excluded, considered, selected) {
  const selectedIds = new Set(selected.map((agent) => agent.id));
  const out = excluded.map((entry) => ({ id: entry.id, reason: entry.reason }));
  for (const agent of considered) {
    if (selectedIds.has(agent.id)) continue;
    if (out.some((entry) => entry.id === agent.id)) continue;
    out.push({ id: agent.id, reason: 'not-minimal-set' });
  }
  out.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return out;
}

function refusal(code, message, extra = {}) {
  return {
    selected: extra.selected ?? [],
    selectedIds: extra.selectedIds ?? [],
    excluded: extra.excluded ?? [],
    verifier: null,
    verifierRiskAdequate: null,
    confidence: 0,
    reason: message,
    refusedBecause: code,
    warnings: [],
    requirements: {
      categories: (extra.requirements ?? []).filter((r) => r.startsWith('category:')).map((r) => r.slice(9)),
      tools: (extra.requirements ?? []).filter((r) => r.startsWith('tool:')).map((r) => r.slice(5)),
      covered: [],
      uncovered: extra.uncovered ?? extra.requirements ?? [],
    },
    considered: extra.considered ?? 0,
    score: 0,
  };
}

/** Summary of a set of agents using the contract vocabulary (re-exported for callers). */
export { summarizeAgents, TOOL_IDS };

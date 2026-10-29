/**
 * HEY — Evolution Engine (Part 5, Phase C).
 *
 * The lifecycle state machine every evolution proposal and every Capability
 * Vault record must pass through. It exists for one reason:
 *
 *   HEY must never be able to skip from "we found something interesting" to
 *   "production changed".
 *
 * The skip is prevented structurally, not by convention: every transition in
 * `TRANSITIONS` names an explicit set of successors, and `transition()` refuses
 * anything outside that set, anything missing a gate's evidence, anything whose
 * approver is not a named owner, and any verifier that is the implementer.
 *
 * This module is pure. It imports nothing, reads no globals, performs no I/O,
 * starts no timer, and makes no network call. Time is injected (`now`) so every
 * test is deterministic.
 *
 * Reused concepts, not duplicated primitives:
 *  - `stableRecordBinding()` mirrors `stableExecutionBinding()` from
 *    `executionAuthorization.js`: an approval binds to an exact, canonicalised
 *    subject, so a later change to that subject invalidates the approval. That
 *    is the same idea as the binding key in `issueExecutionApproval`.
 *  - `TRANSITIONS` mirrors the table shape in `infinity/missionEngine.js`
 *    (`STATES` set + per-state successor list + refusal on an unlisted pair).
 *  - Risk vocabulary `R0`–`R4` comes from `capabilityContract.js`.
 *  - The owner-notification concept comes from `capabilityExpansionEngine.js`
 *    (`notifyOwners`). This module does not dispatch; it records what must be
 *    dispatched.
 *
 * @module core/evolutionEngine
 */

/**
 * Schema tag written into records this module produces.
 * @type {string}
 */
export const EVOLUTION_SCHEMA = "hey.evolution/v1";

/**
 * The only people who may approve anything. Either may approve independently;
 * both are always notified. Silence is never approval.
 * @type {ReadonlyArray<string>}
 */
export const OWNERS = Object.freeze(["Sako", "Amad"]);

/**
 * Cadences an evolution agent or research cycle may declare. A cadence is data
 * here; nothing in this repository executes it. Part 10 supplies the driver.
 * @type {ReadonlyArray<string>}
 */
export const EVOLUTION_CADENCES = Object.freeze([
  "on-demand",
  "daily",
  "weekly",
  "monthly",
  "quarterly",
]);

/**
 * The ten forward lifecycle states, in order.
 * @type {ReadonlyArray<string>}
 */
export const LIFECYCLE_STATES = Object.freeze([
  "Candidate",
  "Validated",
  "Reviewed",
  "Proposed",
  "Approved",
  "Shadow",
  "InImplementation",
  "Tested",
  "Verified",
  "Released",
]);

/**
 * The six terminal outcomes named by the specification. `Deferred`, `Blocked`
 * and `RolledBack` are parked: they may re-enter at `Candidate`, and re-entering
 * re-runs every gate. `Rejected` is final.
 * @type {ReadonlyArray<string>}
 */
export const TERMINAL_OUTCOMES = Object.freeze([
  "Rejected",
  "Deferred",
  "Superseded",
  "Blocked",
  "RolledBack",
  "Archived",
]);

/**
 * Two overlay states required by the Vault (spec §9.2 and §9.4). They are part
 * of the same machine so there is exactly one transition table in HEY.
 *
 * - `Held`    — an owner objected inside the 24h window; nothing may proceed.
 * - `Revoked` — the global kill switch; every user loses access.
 * @type {ReadonlyArray<string>}
 */
export const VAULT_OVERLAY_STATES = Object.freeze(["Held", "Revoked"]);

/**
 * Every state the machine recognises.
 * @type {ReadonlyArray<string>}
 */
export const STATES = Object.freeze([
  ...LIFECYCLE_STATES,
  ...TERMINAL_OUTCOMES,
  ...VAULT_OVERLAY_STATES,
]);

/**
 * States with no outgoing transitions at all. A record here is deep-frozen and
 * cannot be mutated by any later call.
 * @type {ReadonlyArray<string>}
 */
export const FROZEN_STATES = Object.freeze(["Rejected", "Archived", "Revoked"]);

/**
 * The complete transition table. Every legal pair is listed; a pair that is not
 * listed is refused. `any → Rejected` and `any → Blocked` from spec §7.2 are
 * written out explicitly rather than special-cased, so the table is the single
 * source of truth and can be counted.
 *
 * @type {Readonly<Record<string, ReadonlyArray<string>>>}
 */
export const TRANSITIONS = Object.freeze({
  Candidate: Object.freeze(["Validated", "Rejected", "Blocked", "Deferred", "Revoked"]),
  Validated: Object.freeze(["Reviewed", "Rejected", "Blocked", "Deferred", "Revoked"]),
  Reviewed: Object.freeze(["Proposed", "Held", "Rejected", "Blocked", "Deferred", "Revoked"]),
  Proposed: Object.freeze(["Approved", "Held", "Rejected", "Blocked", "Deferred", "Revoked"]),
  Approved: Object.freeze(["Shadow", "Held", "Rejected", "Blocked", "Revoked"]),
  Shadow: Object.freeze(["InImplementation", "Rejected", "Blocked", "Revoked"]),
  InImplementation: Object.freeze(["Tested", "Rejected", "Blocked", "Revoked"]),
  Tested: Object.freeze(["Verified", "Rejected", "Blocked", "Revoked"]),
  Verified: Object.freeze([
    "Released",
    "RolledBack",
    "Rejected",
    "Blocked",
    "Superseded",
    "Revoked",
  ]),
  Released: Object.freeze(["RolledBack", "Superseded", "Archived", "Revoked"]),
  Deferred: Object.freeze(["Candidate", "Rejected", "Archived", "Revoked"]),
  Blocked: Object.freeze(["Candidate", "Rejected", "Archived", "Revoked"]),
  RolledBack: Object.freeze(["Candidate", "Rejected", "Archived", "Revoked"]),
  Held: Object.freeze([
    "Reviewed",
    "Proposed",
    "Approved",
    "Rejected",
    "Blocked",
    "Archived",
    "Revoked",
  ]),
  Rejected: Object.freeze([]),
  Superseded: Object.freeze(["Archived"]),
  Archived: Object.freeze([]),
  Revoked: Object.freeze([]),
});

/**
 * Number of legal pairs in `TRANSITIONS`. Used by the proof pack so the claim is
 * measured rather than remembered.
 * @type {number}
 */
export const TRANSITION_COUNT = Object.freeze(
  Object.values(TRANSITIONS).reduce((total, targets) => total + targets.length, 0),
);

/**
 * Evidence a transition destination demands. `requiredEvidenceFor()` returns
 * these names; `transition()` enforces the same list in `gateFailures()`.
 * @type {Readonly<Record<string, ReadonlyArray<string>>>}
 */
export const EVIDENCE_REQUIREMENTS = Object.freeze({
  Validated: Object.freeze(["primarySource", "freshnessDate", "dedupeKey"]),
  Reviewed: Object.freeze(["flawHunterFindings", "solutionTwinRecommendation"]),
  Proposed: Object.freeze(["changePlan", "killCriteria", "costEstimate"]),
  Approved: Object.freeze(["ownerInOwners", "scope", "killCriteria"]),
  Held: Object.freeze(["objectingOwner", "objectionReason"]),
  Shadow: Object.freeze(["shadowPlan"]),
  InImplementation: Object.freeze(["shadowEvidenceOrOwnerWaiver"]),
  Tested: Object.freeze(["testEvidence"]),
  Verified: Object.freeze(["independentVerifier"]),
  Released: Object.freeze(["releaseGate"]),
});

/**
 * How far back one staleness demotion moves a state. `Released` has no target:
 * production can be rolled back, not silently demoted.
 * @type {Readonly<Record<string, string>>}
 */
export const DEMOTION_TARGETS = Object.freeze({
  Validated: "Candidate",
  Reviewed: "Validated",
  Proposed: "Reviewed",
  Approved: "Proposed",
  Shadow: "Approved",
  InImplementation: "Shadow",
  Tested: "InImplementation",
  Verified: "Tested",
});

/**
 * Default freshness window for a proposal, in days.
 * @type {number}
 */
export const DEFAULT_STALE_AFTER_DAYS = 30;

/**
 * Lifecycle fields an evidence payload may never overwrite.
 * @type {ReadonlySet<string>}
 */
const RESERVED_FIELDS = new Set([
  "schema",
  "id",
  "state",
  "history",
  "decisions",
  "createdAt",
  "schemaVersion",
]);

/** @param {unknown} value @returns {boolean} */
function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** @param {unknown} value @returns {boolean} */
function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

/** @param {unknown} value @returns {boolean} */
function isIsoDate(value) {
  return typeof value === "string" && value.length > 0 && !Number.isNaN(Date.parse(value));
}

/** @param {unknown} value @returns {boolean} */
function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Converts any accepted time input to epoch milliseconds. Refuses anything else
 * rather than silently using the wall clock.
 * @param {number|string|Date} now
 * @returns {number}
 */
export function toMilliseconds(now) {
  if (isFiniteNumber(now)) return now;
  if (typeof now === "string") {
    const parsed = Date.parse(now);
    if (!Number.isNaN(parsed)) return parsed;
  }
  if (now instanceof Date && !Number.isNaN(now.getTime())) return now.getTime();
  throw new TypeError("A valid timestamp (epoch ms, ISO string, or Date) is required.");
}

/**
 * @param {number|string|Date} now
 * @returns {string} ISO-8601 UTC string
 */
export function toIso(now) {
  return new Date(toMilliseconds(now)).toISOString();
}

/**
 * Structural clone that never shares references with its input, so a caller
 * cannot mutate a record through an alias.
 * @template T
 * @param {T} value
 * @returns {T}
 */
export function cloneRecord(value) {
  if (Array.isArray(value)) return value.map((item) => cloneRecord(item));
  if (isPlainObject(value)) {
    const out = {};
    for (const key of Object.keys(value)) out[key] = cloneRecord(value[key]);
    return out;
  }
  return value;
}

/**
 * Freezes a value and everything under it. This is what makes a terminal record
 * genuinely unchangeable rather than merely unchangeable-looking.
 * @template T
 * @param {T} value
 * @returns {T}
 */
export function deepFreeze(value) {
  if (value && typeof value === "object") {
    Object.freeze(value);
    for (const key of Object.keys(value)) deepFreeze(value[key]);
  }
  return value;
}

/**
 * Canonical JSON rendering of a value: keys sorted at every depth, array order
 * preserved. Two structurally equal values always render identically, which is
 * exactly what an approval needs to bind to.
 *
 * Mirrors `stableExecutionBinding()` in `executionAuthorization.js`.
 *
 * @param {unknown} value
 * @param {string} [path]
 * @returns {string}
 */
export function stableRecordBinding(value, path = "record") {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (isFiniteNumber(value)) return JSON.stringify(value);
  if (Array.isArray(value)) {
    const items = value.map((item, index) => stableRecordBinding(item, `${path}[${index}]`));
    return `[${items.join(",")}]`;
  }
  if (!isPlainObject(value)) {
    throw new TypeError(`${path} must contain only plain JSON values.`);
  }
  const keys = Object.keys(value).sort();
  const pairs = keys.map(
    (key) => `${JSON.stringify(key)}:${stableRecordBinding(value[key], `${path}.${key}`)}`,
  );
  return `{${pairs.join(",")}}`;
}

/**
 * Deterministic, non-cryptographic fingerprint (FNV-1a, 32-bit) of a canonical
 * binding. It is tamper-evidence against accidental drift and casual edits, not
 * a signature; the Vault never treats it as authentication.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function fingerprintOf(value) {
  const text = typeof value === "string" ? value : stableRecordBinding(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

/**
 * True when an owner is recognised. Comparison is exact and case-sensitive: a
 * near-miss such as `"sako"` is a different person and is refused.
 * @param {unknown} actor
 * @returns {boolean}
 */
export function isOwner(actor) {
  return typeof actor === "string" && OWNERS.includes(actor);
}

/**
 * Whether a pair is in the table. Unknown states are `false`, never a throw, so
 * this is safe to use in a guard expression.
 * @param {string} from
 * @param {string} to
 * @returns {boolean}
 */
export function canTransition(from, to) {
  const targets = TRANSITIONS[from];
  if (!targets) return false;
  return targets.includes(to);
}

/**
 * The evidence names a destination requires. Empty for states with no gate.
 * @param {string} to
 * @returns {string[]}
 */
export function requiredEvidenceFor(to) {
  return [...(EVIDENCE_REQUIREMENTS[to] || [])];
}

/**
 * @param {unknown} criteria
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateKillCriteria(criteria) {
  const errors = [];
  if (!isPlainObject(criteria)) {
    return { ok: false, errors: ["killCriteria must be an object with metric, baseline, threshold, windowDays and owner."] };
  }
  if (!isNonEmptyString(criteria.metric)) errors.push("killCriteria.metric must name the measurement.");
  if (!isFiniteNumber(criteria.baseline)) errors.push("killCriteria.baseline must be a number.");
  if (!isFiniteNumber(criteria.threshold)) errors.push("killCriteria.threshold must be a number.");
  if (!Number.isInteger(criteria.windowDays) || criteria.windowDays <= 0) {
    errors.push("killCriteria.windowDays must be a positive integer.");
  }
  if (!isOwner(criteria.owner)) errors.push(`killCriteria.owner must be one of ${OWNERS.join(", ")}.`);
  return { ok: errors.length === 0, errors };
}

/**
 * @param {unknown} plan
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateChangePlan(plan) {
  const fields = [
    "components",
    "newApis",
    "changedApis",
    "schemaChanges",
    "permissionChanges",
    "migrations",
    "rollbackSteps",
  ];
  const errors = [];
  if (!isPlainObject(plan)) {
    return { ok: false, errors: ["changePlan must be a machine-readable object with every declared field."] };
  }
  for (const field of fields) {
    if (!Array.isArray(plan[field])) {
      errors.push(`changePlan.${field} must be an array.`);
    } else if (field === "rollbackSteps" && plan[field].length === 0) {
      errors.push("changePlan.rollbackSteps must describe how to reverse the change.");
    }
  }
  return { ok: errors.length === 0, errors };
}

/**
 * @param {unknown} cost
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateCostEstimate(cost) {
  const errors = [];
  if (!isPlainObject(cost)) {
    return { ok: false, errors: ["cost must be an object with perUseCents and worstCaseCents."] };
  }
  if (!isFiniteNumber(cost.perUseCents) || cost.perUseCents < 0) {
    errors.push("cost.perUseCents must be a number >= 0.");
  }
  if (!isFiniteNumber(cost.worstCaseCents) || cost.worstCaseCents < 0) {
    errors.push("cost.worstCaseCents must be a number >= 0.");
  }
  return { ok: errors.length === 0, errors };
}

/**
 * @param {unknown} proposal
 * @returns {boolean}
 */
function hasPrimarySource(proposal) {
  return (
    Array.isArray(proposal.evidence) &&
    proposal.evidence.some(
      (entry) => isPlainObject(entry) && entry.kind === "primary" && isNonEmptyString(entry.url),
    )
  );
}

/**
 * The freshest traceable date a proposal can be judged against.
 * @param {unknown} proposal
 * @returns {string|null}
 */
export function freshnessAnchor(proposal) {
  if (!isPlainObject(proposal)) return null;
  if (isIsoDate(proposal.freshnessDate)) return proposal.freshnessDate;
  const retrieved = (Array.isArray(proposal.evidence) ? proposal.evidence : [])
    .map((entry) => (isPlainObject(entry) ? entry.retrievedAt : null))
    .filter(isIsoDate)
    .sort();
  if (retrieved.length > 0) return retrieved[retrieved.length - 1];
  if (isIsoDate(proposal.validatedAt)) return proposal.validatedAt;
  if (isIsoDate(proposal.createdAt)) return proposal.createdAt;
  return null;
}

/**
 * @param {unknown} findings
 * @returns {boolean}
 */
function hasFlawHunterFindings(findings) {
  if (!Array.isArray(findings) || findings.length === 0) return false;
  return findings.every(
    (finding) =>
      isPlainObject(finding) &&
      isNonEmptyString(finding.finding) &&
      isNonEmptyString(finding.severity),
  );
}

/**
 * @param {unknown} recommendation
 * @returns {boolean}
 */
function hasSolutionTwinRecommendation(recommendation) {
  return isPlainObject(recommendation) && isNonEmptyString(recommendation.recommendation);
}

/**
 * @param {unknown} plan
 * @returns {boolean}
 */
function hasShadowPlan(plan) {
  if (!isPlainObject(plan)) return false;
  if (!isNonEmptyString(plan.plan)) return false;
  return Array.isArray(plan.steps) && plan.steps.length > 0;
}

/**
 * @param {unknown} evidence
 * @returns {boolean}
 */
function hasShadowEvidence(evidence) {
  if (!isPlainObject(evidence)) return false;
  if (isNonEmptyString(evidence.evidenceId)) return true;
  return Number.isInteger(evidence.runs) && evidence.runs >= 1;
}

/**
 * @param {unknown} waiver
 * @returns {boolean}
 */
function hasOwnerWaiver(waiver) {
  return (
    isPlainObject(waiver) &&
    isOwner(waiver.ownerId) &&
    isNonEmptyString(waiver.reason) &&
    isIsoDate(waiver.at)
  );
}

/**
 * Returns every unmet gate for moving `proposal` to `to`. Empty means the
 * transition is allowed.
 *
 * @param {Record<string, any>} proposal  merged proposal under evaluation
 * @param {string} to
 * @param {{ actor: string, reason: string|null }} context
 * @returns {string[]}
 */
function gateFailures(proposal, to, context) {
  const failures = [];

  switch (to) {
    case "Validated": {
      if (!hasPrimarySource(proposal)) {
        failures.push("a primary source is required (evidence[] needs one entry with kind 'primary' and a url).");
      }
      if (!isIsoDate(freshnessAnchor(proposal))) {
        failures.push("a freshness date is required (freshnessDate or a retrievedAt on any evidence entry).");
      }
      if (!isNonEmptyString(proposal.dedupeKey)) {
        failures.push("a computed dedupe key is required.");
      }
      break;
    }
    case "Reviewed": {
      if (!hasFlawHunterFindings(proposal.flawHunterFindings)) {
        failures.push("Flaw Hunter findings are required (flawHunterFindings[] each with finding and severity).");
      }
      if (!hasSolutionTwinRecommendation(proposal.solutionTwinRecommendation)) {
        failures.push("a Solution Twin recommendation is required (solutionTwinRecommendation.recommendation).");
      }
      break;
    }
    case "Proposed": {
      const plan = validateChangePlan(proposal.changePlan);
      if (!plan.ok) failures.push(...plan.errors);
      const kill = validateKillCriteria(proposal.killCriteria);
      if (!kill.ok) failures.push(...kill.errors);
      const cost = validateCostEstimate(proposal.cost);
      if (!cost.ok) failures.push(...cost.errors);
      break;
    }
    case "Approved": {
      if (!isOwner(context.actor)) {
        failures.push(`the approving actor must be a named owner (${OWNERS.join(" or ")}); received ${JSON.stringify(context.actor ?? null)}.`);
      }
      const scope = proposal?.approval?.scope ?? proposal?.scope;
      if (!isNonEmptyString(scope)) {
        failures.push("an approval scope is required.");
      }
      const kill = validateKillCriteria(proposal.killCriteria);
      if (!kill.ok) failures.push(...kill.errors, "a record without kill criteria cannot be approved.");
      break;
    }
    case "Shadow": {
      if (!hasShadowPlan(proposal.shadowPlan)) {
        failures.push("a shadow plan is required (shadowPlan.plan and a non-empty shadowPlan.steps[]).");
      }
      break;
    }
    case "Held": {
      const hold = proposal.hold;
      if (!isPlainObject(hold) || !isOwner(hold.by)) {
        failures.push("a hold must name the owner who raised the objection.");
      }
      if (!isPlainObject(hold) || !isNonEmptyString(hold.reason)) {
        failures.push("a hold must carry the objection reason.");
      }
      if (!isNonEmptyString(proposal.heldFrom)) {
        failures.push("a hold must record which state it interrupted.");
      }
      break;
    }
    case "InImplementation": {
      if (!hasShadowEvidence(proposal.shadowEvidence) && !hasOwnerWaiver(proposal.ownerWaiver)) {
        failures.push("shadow evidence is required, or an explicit owner waiver with a reason.");
      }
      break;
    }
    case "Tested": {
      const tests = Array.isArray(proposal.testEvidence) ? proposal.testEvidence : [];
      if (tests.length === 0) {
        failures.push("a non-empty test evidence list is required.");
      }
      for (const [index, entry] of tests.entries()) {
        if (!isPlainObject(entry) || !isNonEmptyString(entry.id)) {
          failures.push(`testEvidence[${index}] must have an id.`);
          continue;
        }
        if (entry.result === "fail") {
          failures.push(`testEvidence[${index}] (${entry.id}) failed; a failing test cannot advance to Tested.`);
        }
      }
      break;
    }
    case "Verified": {
      const implementer = proposal?.implementer?.implementerId ?? proposal.implementerId;
      const verifier = proposal?.verifier?.verifierId ?? proposal.verifierId;
      if (!isNonEmptyString(implementer)) {
        failures.push("the implementer must be recorded; independence cannot be proven otherwise.");
      }
      if (!isNonEmptyString(verifier)) {
        failures.push("an independent verifier is required (verifier.verifierId).");
      }
      if (isNonEmptyString(implementer) && isNonEmptyString(verifier) && implementer === verifier) {
        failures.push("the verifier must be a different person from the implementer.");
      }
      break;
    }
    case "Released": {
      const gate = proposal.releaseGate;
      if (!isPlainObject(gate) || !isNonEmptyString(gate.gateId)) {
        failures.push("a release gate record is required (releaseGate.gateId).");
      } else if (!isOwner(gate.approvedBy)) {
        failures.push(`the release gate must be signed by a named owner (${OWNERS.join(" or ")}).`);
      }
      break;
    }
    default:
      break;
  }

  return failures;
}

/**
 * Which destinations require a human reason.
 * @type {ReadonlyArray<string>}
 */
export const REASON_REQUIRED_TARGETS = Object.freeze(["Rejected", "Blocked", "RolledBack"]);

/**
 * Move a proposal one step. Never mutates its input. Returns a new, deeply
 * cloned proposal on success, and `{ ok:false, reason }` on refusal.
 *
 * @param {Record<string, any>} proposal
 * @param {string} to
 * @param {{ actor?: string, evidence?: Record<string, any>, reason?: string, now?: number|string|Date }} [options]
 * @returns {{ ok: true, proposal: Record<string, any>, event: Record<string, any> } | { ok: false, reason: string, missing?: string[] }}
 */
export function transition(proposal, to, options = {}) {
  if (!isPlainObject(proposal)) {
    throw new TypeError("transition(proposal, to) needs a proposal object.");
  }
  if (!STATES.includes(to)) {
    throw new RangeError(`Unknown evolution state: ${JSON.stringify(to)}.`);
  }

  const from = proposal.state;
  if (!STATES.includes(from)) {
    return { ok: false, reason: `The proposal is in unknown state ${JSON.stringify(from)}.` };
  }

  const nowMs = toMilliseconds(options.now ?? Date.now());
  const at = new Date(nowMs).toISOString();

  if (FROZEN_STATES.includes(from)) {
    return {
      ok: false,
      reason: `A ${from} proposal is final and cannot be transitioned (attempted ${from} → ${to}).`,
    };
  }

  if (from === "Held") {
    const restoresTo = proposal.heldFrom;
    const isClosure =
      to === "Rejected" || to === "Archived" || to === "Blocked" || to === "Revoked";
    if (!isClosure && restoresTo && to !== restoresTo) {
      return {
        ok: false,
        reason: `A held record may only be resolved back to ${restoresTo}, not to ${to}.`,
      };
    }
  }

  if (!canTransition(from, to)) {
    return {
      ok: false,
      reason: `Illegal transition ${from} → ${to}: ${from} may only move to ${(TRANSITIONS[from] || []).join(", ") || "nothing"}.`,
    };
  }

  const actor = typeof options.actor === "string" ? options.actor.trim() : "";
  if (!actor) {
    return { ok: false, reason: "Every transition must name an actor." };
  }

  const reason = isNonEmptyString(options.reason) ? options.reason.trim() : null;
  if (REASON_REQUIRED_TARGETS.includes(to) && !reason) {
    return { ok: false, reason: `Moving to ${to} requires a written reason.` };
  }

  const merged = { ...cloneRecord(proposal) };
  if (isPlainObject(options.evidence)) {
    for (const [key, value] of Object.entries(options.evidence)) {
      if (!RESERVED_FIELDS.has(key)) merged[key] = cloneRecord(value);
    }
  }

  const failures = gateFailures(merged, to, { actor, reason });
  if (failures.length > 0) {
    return {
      ok: false,
      reason: `Cannot move ${from} → ${to}: ${failures.join(" ")}`,
      missing: failures,
    };
  }

  const history = Array.isArray(merged.history) ? merged.history : [];
  const event = {
    seq: history.length,
    type: "transition",
    from,
    to,
    actor,
    at,
    reason,
    schema: EVOLUTION_SCHEMA,
  };

  const next = {
    ...merged,
    state: to,
    updatedAt: at,
    history: [...history, event],
  };

  if (to === "Approved") {
    const scope = merged?.approval?.scope ?? merged.scope;
    next.approval = {
      ownerId: actor,
      scope: String(scope).trim(),
      at,
      state: "approved",
    };
  }

  if (to === "Validated") {
    next.validatedAt = at;
    next.freshnessDate = merged.freshnessDate ?? freshnessAnchor(merged);
  }

  if (to === "Verified") {
    next.verifier = {
      verifierId: merged?.verifier?.verifierId ?? merged.verifierId,
      method: merged?.verifier?.method ?? "recorded",
      at,
    };
    next.verifiedAt = at;
  }

  if (to === "Released") {
    next.releasedAt = at;
  }

  if (to === "Revoked") {
    next.revokedAt = at;
  }

  if (reason) next.lastReason = reason;

  if (FROZEN_STATES.includes(to)) deepFreeze(next);

  return { ok: true, proposal: next, event };
}

/**
 * One-step staleness demotion with a recorded decay event. Refuses when the
 * proposal is not stale, when the state has no demotion target, or when an
 * objection is open.
 *
 * @param {Record<string, any>} proposal
 * @param {number|string|Date} now
 * @param {number} [staleAfterDays]
 * @returns {{ ok: true, proposal: Record<string, any>, event: Record<string, any> } | { ok: false, reason: string }}
 */
export function demoteStale(proposal, now, staleAfterDays = DEFAULT_STALE_AFTER_DAYS) {
  if (!isPlainObject(proposal)) {
    throw new TypeError("demoteStale(proposal, now) needs a proposal object.");
  }
  const nowMs = toMilliseconds(now);
  if (!isStale(proposal, nowMs, staleAfterDays)) {
    return { ok: false, reason: `The ${proposal.state} proposal is still fresh by the ${staleAfterDays}-day rule.` };
  }
  if (proposal.state === "Held") {
    return { ok: false, reason: "A held record must be resolved before it can be demoted." };
  }
  const target = DEMOTION_TARGETS[proposal.state];
  if (!target) {
    return {
      ok: false,
      reason: `A ${proposal.state} proposal has no staleness demotion target; roll it back or revoke it instead.`,
    };
  }

  const anchor = freshnessAnchor(proposal);
  const daysElapsed = anchor ? (nowMs - Date.parse(anchor)) / 86_400_000 : null;
  const at = new Date(nowMs).toISOString();
  const history = Array.isArray(proposal.history) ? proposal.history : [];
  const event = {
    seq: history.length,
    type: "decay",
    from: proposal.state,
    to: target,
    actor: "staleness-decay",
    at,
    reason: "staleness",
    anchor,
    daysElapsed: daysElapsed === null ? null : Math.floor(daysElapsed),
    staleAfterDays,
    schema: EVOLUTION_SCHEMA,
  };

  const next = {
    ...cloneRecord(proposal),
    state: target,
    updatedAt: at,
    decayCount: (Number.isInteger(proposal.decayCount) ? proposal.decayCount : 0) + 1,
    history: [...history, event],
  };

  if (target === "Candidate" || target === "Validated" || target === "Reviewed" || target === "Proposed") {
    next.approval = null;
  }
  if (target !== "Tested" && target !== "Verified") {
    next.verifiedAt = null;
  }

  return { ok: true, proposal: next, event };
}

/**
 * Freshness test. Fail-safe: a proposal with no traceable date at all is stale.
 * A frozen or released proposal is never "stale" — production is governed by
 * incidents and rollback, not by decay.
 *
 * @param {Record<string, any>} proposal
 * @param {number|string|Date} now
 * @param {number} [staleAfterDays]
 * @returns {boolean}
 */
export function isStale(proposal, now, staleAfterDays = DEFAULT_STALE_AFTER_DAYS) {
  if (!isPlainObject(proposal)) return false;
  if (FROZEN_STATES.includes(proposal.state) || proposal.state === "Released") return false;
  if (!isFiniteNumber(staleAfterDays) || staleAfterDays < 0) {
    throw new TypeError("staleAfterDays must be a number >= 0.");
  }
  const anchor = freshnessAnchor(proposal);
  if (!anchor) return true;
  const elapsedDays = (toMilliseconds(now) - Date.parse(anchor)) / 86_400_000;
  return elapsedDays > staleAfterDays;
}

/**
 * Structural validation. This answers "is this a proposal at all", not "may it
 * advance" — the gates answer that.
 *
 * @param {unknown} proposal
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateProposal(proposal) {
  const errors = [];
  if (!isPlainObject(proposal)) {
    return { ok: false, errors: ["A proposal must be a plain object."] };
  }
  if (!isNonEmptyString(proposal.id)) errors.push("id is required.");
  if (!isNonEmptyString(proposal.title)) errors.push("title is required.");
  if (!STATES.includes(proposal.state)) {
    errors.push(`state must be one of: ${STATES.join(", ")}.`);
  }
  if (!isNonEmptyString(proposal.dedupeKey)) errors.push("dedupeKey is required.");
  if (!isIsoDate(proposal.createdAt)) errors.push("createdAt must be an ISO timestamp.");
  if (proposal.evidence !== undefined) {
    if (!Array.isArray(proposal.evidence)) {
      errors.push("evidence must be an array.");
    } else {
      for (const [index, entry] of proposal.evidence.entries()) {
        if (!isPlainObject(entry)) {
          errors.push(`evidence[${index}] must be an object.`);
        } else if (!isNonEmptyString(entry.url) || !isIsoDate(entry.retrievedAt) || !isNonEmptyString(entry.kind)) {
          errors.push(`evidence[${index}] needs url, retrievedAt and kind.`);
        }
      }
    }
  }
  if (proposal.killCriteria !== undefined && proposal.killCriteria !== null) {
    const kill = validateKillCriteria(proposal.killCriteria);
    if (!kill.ok) errors.push(...kill.errors);
  }
  if (proposal.changePlan !== undefined && proposal.changePlan !== null) {
    const plan = validateChangePlan(proposal.changePlan);
    if (!plan.ok) errors.push(...plan.errors);
  }
  if (proposal.cost !== undefined && proposal.cost !== null) {
    const cost = validateCostEstimate(proposal.cost);
    if (!cost.ok) errors.push(...cost.errors);
  }
  if (proposal.history !== undefined && !Array.isArray(proposal.history)) {
    errors.push("history must be an array.");
  }
  if (proposal.state === "Held" && !isOwner(proposal?.hold?.by)) {
    errors.push("a Held proposal must record which owner holds it.");
  }
  return { ok: errors.length === 0, errors };
}

export default {
  EVOLUTION_SCHEMA,
  EVOLUTION_CADENCES,
  OWNERS,
  STATES,
  LIFECYCLE_STATES,
  TERMINAL_OUTCOMES,
  VAULT_OVERLAY_STATES,
  FROZEN_STATES,
  TRANSITIONS,
  TRANSITION_COUNT,
  EVIDENCE_REQUIREMENTS,
  DEMOTION_TARGETS,
  DEFAULT_STALE_AFTER_DAYS,
  canTransition,
  transition,
  requiredEvidenceFor,
  isStale,
  demoteStale,
  validateProposal,
  validateKillCriteria,
  validateChangePlan,
  validateCostEstimate,
  freshnessAnchor,
  isOwner,
  stableRecordBinding,
  fingerprintOf,
  cloneRecord,
  deepFreeze,
  toIso,
  toMilliseconds,
};

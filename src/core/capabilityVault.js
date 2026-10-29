/**
 * HEY — Capability Vault (Part 5, Phase E).
 *
 * The only door a capability may come through. It holds records, not
 * capabilities: saving a record changes nothing in production, approving one
 * executes nothing, and this module has no side effect of any kind — no timer,
 * no network call, no import of anything that writes.
 *
 * Two owner rules govern everything:
 *
 *  - Owners are exactly `["Sako", "Amad"]`. Either may approve independently
 *    and both are always notified.
 *  - An objection inside the 24h window moves the record to `Held`, and neither
 *    owner may proceed until it is resolved. Silence is not consent: there is no
 *    code path from "nobody said anything" to "approved".
 *
 * The lifecycle itself is *not* reimplemented here. Every state change goes
 * through `transition()` in `evolutionEngine.js`, so HEY has one transition
 * table, not two.
 *
 * Reused, not duplicated:
 *  - `executionAuthorization.js` / `forgeEngine.js` bind an approval to a hash
 *    of exactly what was reviewed, and refuse when the artifact changed
 *    afterwards. This Vault keeps the same idea and the same names where they
 *    fit: `approval.subjectFingerprint`, recomputed by `promote()` and `revoke()`
 *    and compared, exactly as `forgeEngine.installArtifact` compares
 *    `approval.artifactHash`.
 *  - `capabilityExpansionEngine.js` already had the "notify both owners" idea
 *    (`notifyOwners`, event `hey:owner-notification`). The Vault records the
 *    notification intents with that event name; it does not dispatch them,
 *    because dispatching would be a side effect.
 *  - Risk levels `R0`–`R4` and the approval-risk set come from
 *    `capabilityContract.js` (Part 2), not from a new vocabulary here.
 *
 * @module core/capabilityVault
 */

import { CAPABILITY_RISK_LEVELS, APPROVAL_RISK_LEVELS } from "./capabilityContract.js";
import {
  DEFAULT_STALE_AFTER_DAYS,
  FROZEN_STATES,
  OWNERS,
  STATES,
  cloneRecord,
  deepFreeze,
  demoteStale,
  fingerprintOf,
  isOwner,
  isStale,
  toIso,
  toMilliseconds,
  transition,
  validateChangePlan,
  validateKillCriteria,
} from "./evolutionEngine.js";

/**
 * @type {string}
 */
export const VAULT_SCHEMA = "hey.capability-vault/v1";

/**
 * The owner-notification event name already used by
 * `capabilityExpansionEngine.js`. The Vault records it; it never dispatches it.
 * @type {string}
 */
export const OWNER_NOTIFICATION_EVENT = "hey:owner-notification";

/**
 * The three decisions an owner may take. Nothing else is a decision.
 * @type {ReadonlyArray<string>}
 */
export const VAULT_DECISIONS = Object.freeze(["keep", "delete", "keep-with-changes"]);

/**
 * The two levels of Keep.
 * @type {ReadonlyArray<string>}
 */
export const VAULT_LEVELS = Object.freeze(["keep-experimental", "keep-permanent"]);

/**
 * How long the other owner has to object after a decision.
 * @type {number}
 */
export const OBJECTION_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Uses required before an experimental capability can become permanent.
 * @type {number}
 */
export const PROMOTION_USES = 3;

/**
 * The record fields the specification names (§9.1), in order.
 * @type {ReadonlyArray<string>}
 */
export const RECORD_FIELDS = Object.freeze([
  "id",
  "title",
  "category",
  "problem",
  "intendedOutcome",
  "evidence",
  "dedupeKey",
  "staleAfter",
  "createdAt",
  "state",
  "risk",
  "changePlan",
  "killCriteria",
  "cost",
  "decisions",
  "usage",
  "shadow",
  "implementationRef",
  "verificationRef",
  "releaseRef",
]);

/**
 * Fields the two-owner protocol adds on top of the specification's shape.
 * @type {ReadonlyArray<string>}
 */
export const PROTOCOL_FIELDS = Object.freeze([
  "schema",
  "level",
  "approval",
  "decidedBy",
  "decidedAt",
  "changesRequested",
  "hold",
  "heldFrom",
  "resolution",
  "notifications",
  "revoked",
  "permanence",
  "history",
  "replacedBy",
  "replaces",
  "createdBy",
  "updatedAt",
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
function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

/** @param {unknown} value @returns {boolean} */
function isIsoDate(value) {
  return typeof value === "string" && value.length > 0 && !Number.isNaN(Date.parse(value));
}

/**
 * @param {string} text
 * @returns {string}
 */
function slugify(text) {
  const slug = String(text ?? "record")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "record";
}

/**
 * Guards the pure record operations against being called with a Vault where a
 * record is expected — a mistake that would silently look like a decision.
 * @param {unknown} value
 * @returns {boolean}
 */
function looksLikeVault(value) {
  return (
    isPlainObject(value) &&
    typeof value.getRecord === "function" &&
    typeof value.listRecords === "function"
  );
}

/**
 * Refuses a Vault where a record belongs. Passing the registry by mistake would
 * otherwise look like an operation on an empty record.
 * @param {unknown} record
 * @param {string} name
 * @param {string} hint
 */
function refuseVaultAsRecord(record, name, hint) {
  if (looksLikeVault(record)) {
    throw new TypeError(`${name}(record, …) takes a record; call ${hint} for a stored record.`);
  }
}

/**
 * The decision-relevant part of a record: everything an owner is approving.
 * Deliberately excludes state, decisions, usage and notifications, because those
 * change legitimately after approval.
 *
 * @param {Record<string, any>} record
 * @returns {Record<string, any>}
 */
export function approvalSubject(record) {
  return {
    id: record?.id ?? null,
    title: record?.title ?? null,
    category: record?.category ?? null,
    risk: record?.risk ?? null,
    changePlan: record?.changePlan ?? null,
    killCriteria: record?.killCriteria ?? null,
    cost: record?.cost ?? null,
    evidence: Array.isArray(record?.evidence) ? record.evidence : [],
  };
}

/**
 * The fingerprint an approval binds to. Recomputed before promotion and
 * revocation; a mismatch means the approved thing is not the thing on disk.
 *
 * @param {Record<string, any>} record
 * @returns {string}
 */
export function subjectFingerprint(record) {
  return fingerprintOf(approvalSubject(record));
}

/**
 * @param {ReadonlyArray<string>} ownerDecisionKind
 * @param {string} at
 * @param {string} actor
 * @param {string} note
 * @returns {Array<Record<string, any>>}
 */
function notificationBatch(ownerDecisionKind, at, actor, note) {
  return OWNERS.map((ownerId) => ({
    event: OWNER_NOTIFICATION_EVENT,
    kind: ownerDecisionKind,
    ownerId,
    actor,
    at,
    note: isNonEmptyString(note) ? note.trim() : null,
  }));
}

/**
 * Which owners have been notified of a given kind of event.
 * @param {Record<string, any>} record
 * @param {string} kind
 * @returns {string[]}
 */
export function notifiedOwners(record, kind) {
  const seen = new Set();
  for (const entry of Array.isArray(record?.notifications) ? record.notifications : []) {
    if (isPlainObject(entry) && entry.kind === kind && isOwner(entry.ownerId)) {
      seen.add(entry.ownerId);
    }
  }
  return [...seen].sort();
}

/**
 * Structural validation of a Vault record.
 * @param {unknown} record
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateRecord(record) {
  const errors = [];
  if (!isPlainObject(record)) {
    return { ok: false, errors: ["A Vault record must be a plain object."] };
  }

  for (const field of ["id", "title", "category", "problem", "intendedOutcome", "dedupeKey"]) {
    if (!isNonEmptyString(record[field])) errors.push(`${field} is required.`);
  }
  if (!STATES.includes(record.state)) {
    errors.push(`state must be one of: ${STATES.join(", ")}.`);
  }
  if (!CAPABILITY_RISK_LEVELS.includes(record.risk)) {
    errors.push(`risk must be one of: ${CAPABILITY_RISK_LEVELS.join(", ")}.`);
  }
  if (!Number.isInteger(record.staleAfter) || record.staleAfter <= 0) {
    errors.push("staleAfter must be a positive integer number of days.");
  }
  if (!isIsoDate(record.createdAt)) errors.push("createdAt must be an ISO timestamp.");

  if (!Array.isArray(record.evidence) || record.evidence.length === 0) {
    errors.push("evidence must be a non-empty array; a record with no source is not a record.");
  } else {
    for (const [index, entry] of record.evidence.entries()) {
      if (!isPlainObject(entry) || !isNonEmptyString(entry.url) || !isIsoDate(entry.retrievedAt) || !isNonEmptyString(entry.kind)) {
        errors.push(`evidence[${index}] needs url, retrievedAt and kind.`);
      }
    }
  }

  if (record.changePlan !== null && record.changePlan !== undefined) {
    const plan = validateChangePlan(record.changePlan);
    if (!plan.ok) errors.push(...plan.errors);
  }
  if (record.killCriteria !== null && record.killCriteria !== undefined) {
    const kill = validateKillCriteria(record.killCriteria);
    if (!kill.ok) errors.push(...kill.errors);
  }

  if (!isPlainObject(record.cost)) {
    errors.push("cost must be an object with perUseCents and worstCaseCents.");
  } else {
    if (!isFiniteNumber(record.cost.perUseCents) || record.cost.perUseCents < 0) {
      errors.push("cost.perUseCents must be a number >= 0.");
    }
    if (!isFiniteNumber(record.cost.worstCaseCents) || record.cost.worstCaseCents < 0) {
      errors.push("cost.worstCaseCents must be a number >= 0.");
    }
  }

  if (!isPlainObject(record.usage)) {
    errors.push("usage must be an object with count and incidents.");
  } else {
    if (!Number.isInteger(record.usage.count) || record.usage.count < 0) {
      errors.push("usage.count must be a non-negative integer.");
    }
    if (!Number.isInteger(record.usage.incidents) || record.usage.incidents < 0) {
      errors.push("usage.incidents must be a non-negative integer.");
    }
  }

  if (!isPlainObject(record.shadow)) {
    errors.push("shadow must be an object with runs, passes and failures.");
  } else {
    for (const field of ["runs", "passes", "failures"]) {
      if (!Number.isInteger(record.shadow[field]) || record.shadow[field] < 0) {
        errors.push(`shadow.${field} must be a non-negative integer.`);
      }
    }
  }

  if (!Array.isArray(record.decisions)) errors.push("decisions must be an append-only array.");
  if (record.history !== undefined && !Array.isArray(record.history)) {
    errors.push("history must be an array.");
  }
  if (record.level !== null && record.level !== undefined && !VAULT_LEVELS.includes(record.level)) {
    errors.push(`level must be null or one of: ${VAULT_LEVELS.join(", ")}.`);
  }
  for (const field of ["implementationRef", "verificationRef", "releaseRef"]) {
    const value = record[field];
    if (value !== null && value !== undefined && !isNonEmptyString(value)) {
      errors.push(`${field} must be null or a non-empty string.`);
    }
  }

  return { ok: errors.length === 0, errors };
}

/**
 * Build a normalised record. New records always enter at `Candidate`: there is
 * no constructor argument that starts a record further along.
 *
 * @param {Record<string, any>} [input]
 * @param {{ now?: number|string|Date }} [options]
 * @returns {Record<string, any>}
 */
export function buildRecord(input = {}, options = {}) {
  if (!isPlainObject(input)) {
    throw new TypeError("buildRecord(input) needs an object.");
  }
  const at = toIso(options.now ?? input.now ?? Date.now());
  const id = isNonEmptyString(input.id) ? input.id.trim() : `vault_${slugify(input.title)}`;

  return {
    schema: VAULT_SCHEMA,
    id,
    title: input.title ?? null,
    category: input.category ?? null,
    problem: input.problem ?? null,
    intendedOutcome: input.intendedOutcome ?? null,
    evidence: Array.isArray(input.evidence) ? cloneRecord(input.evidence) : [],
    dedupeKey: input.dedupeKey ?? null,
    staleAfter: input.staleAfter ?? DEFAULT_STALE_AFTER_DAYS,
    createdAt: input.createdAt ?? at,
    updatedAt: input.createdAt ?? at,
    state: "Candidate",
    risk: input.risk ?? "R0",
    changePlan: input.changePlan === undefined ? null : cloneRecord(input.changePlan),
    killCriteria: input.killCriteria === undefined ? null : cloneRecord(input.killCriteria),
    cost: {
      perUseCents: isFiniteNumber(input.cost?.perUseCents) ? input.cost.perUseCents : 0,
      worstCaseCents: isFiniteNumber(input.cost?.worstCaseCents) ? input.cost.worstCaseCents : 0,
    },
    decisions: [],
    usage: {
      count: Number.isInteger(input.usage?.count) ? input.usage.count : 0,
      incidents: Number.isInteger(input.usage?.incidents) ? input.usage.incidents : 0,
      lastUsedAt: input.usage?.lastUsedAt ?? null,
    },
    shadow: {
      runs: Number.isInteger(input.shadow?.runs) ? input.shadow.runs : 0,
      passes: Number.isInteger(input.shadow?.passes) ? input.shadow.passes : 0,
      failures: Number.isInteger(input.shadow?.failures) ? input.shadow.failures : 0,
    },
    implementationRef: input.implementationRef ?? null,
    verificationRef: input.verificationRef ?? null,
    releaseRef: input.releaseRef ?? null,
    level: null,
    approval: null,
    decidedBy: null,
    decidedAt: null,
    changesRequested: null,
    hold: null,
    heldFrom: null,
    resolution: null,
    notifications: [],
    revoked: null,
    permanence: null,
    history: [],
    replacedBy: null,
    createdBy: input.createdBy ?? null,
  };
}

/* -------------------------------------------------------------------------
 * Pure record operations. Each returns a new record or a refusal.
 * ---------------------------------------------------------------------- */

/**
 * An owner decides. Either owner alone is sufficient; both are notified.
 *
 * @param {Record<string, any>} record
 * @param {{ decision: string, ownerId: string, note?: string, changes?: string[], now?: number|string|Date }} [options]
 * @returns {{ ok: true, record: Record<string, any> } | { ok: false, reason: string }}
 */
export function decide(record, options = {}) {
  refuseVaultAsRecord(record, "decide", "vault.decide(id, options)");
  if (!isPlainObject(record)) {
    throw new TypeError("decide(record, options) needs a record object.");
  }
  const { decision, ownerId, note, changes = [], now } = options;
  const at = toIso(now ?? Date.now());

  if (!isOwner(ownerId)) {
    return {
      ok: false,
      reason: `Only ${OWNERS.join(" or ")} may decide; ${JSON.stringify(ownerId ?? null)} is not an owner.`,
    };
  }
  if (!VAULT_DECISIONS.includes(decision)) {
    return {
      ok: false,
      reason: `Unknown decision ${JSON.stringify(decision ?? null)}; expected one of ${VAULT_DECISIONS.join(", ")}.`,
    };
  }
  if (record.state === "Revoked" || isPlainObject(record.revoked)) {
    return { ok: false, reason: "This record was revoked; a revoked record has no decision path." };
  }
  if (FROZEN_STATES.includes(record.state)) {
    return { ok: false, reason: `A ${record.state} record is final and cannot be decided.` };
  }
  if (record.state === "Held") {
    return { ok: false, reason: "An objection is open; resolve it before any owner decides." };
  }
  if (record.level === "keep-permanent" && decision !== "delete") {
    return { ok: false, reason: "This record is permanent; only revocation changes it." };
  }

  const decisionEntry = (extra = {}) => ({
    seq: Array.isArray(record.decisions) ? record.decisions.length : 0,
    type: "decision",
    decision,
    ownerId,
    note: isNonEmptyString(note) ? note.trim() : null,
    at,
    ...extra,
  });

  if (decision === "keep-with-changes") {
    if (!Array.isArray(changes) || changes.length === 0) {
      return { ok: false, reason: "keep-with-changes must name at least one required change." };
    }
    if (record.state === "Approved") {
      return {
        ok: false,
        reason: "An approval cannot be made conditional after it was granted; object or revoke instead.",
      };
    }
    if (!["Reviewed", "Proposed"].includes(record.state)) {
      return { ok: false, reason: `keep-with-changes applies to a Reviewed or Proposed record; this one is ${record.state}.` };
    }
    return {
      ok: true,
      record: {
        ...cloneRecord(record),
        changesRequested: changes.map((change) => String(change)),
        notifications: [...(record.notifications ?? []), ...notificationBatch("decision", at, ownerId, note)],
        decisions: [...(record.decisions ?? []), decisionEntry({ changes })],
        updatedAt: at,
      },
    };
  }

  if (decision === "delete") {
    if (!isNonEmptyString(note)) {
      return { ok: false, reason: "Deleting a record needs a written reason; the audit trail keeps it." };
    }
    const prepared = {
      ...cloneRecord(record),
      level: null,
      decisions: [...(record.decisions ?? []), decisionEntry()],
      notifications: [...(record.notifications ?? []), ...notificationBatch("decision", at, ownerId, note)],
    };
    const moved = transition(prepared, "Rejected", { actor: ownerId, now: at, reason: note.trim() });
    return moved.ok ? { ok: true, record: moved.proposal } : moved;
  }

  // decision === "keep"
  const kill = validateKillCriteria(record.killCriteria);
  if (!kill.ok) {
    return {
      ok: false,
      reason: `A record without kill criteria cannot be approved. ${kill.errors.join(" ")}`,
    };
  }

  let approved = record;
  if (record.state !== "Approved") {
    const moved = transition(record, "Approved", {
      actor: ownerId,
      now: at,
      reason: isNonEmptyString(note) ? note.trim() : "owner keep decision",
      evidence: { approval: { ownerId, scope: "requesting-user" } },
    });
    if (!moved.ok) return moved;
    approved = moved.proposal;
  } else if (!isNonEmptyString(approved?.approval?.scope)) {
    return { ok: false, reason: "The existing approval has no recorded scope and cannot be extended." };
  }

  return {
    ok: true,
    record: {
      ...approved,
      level: "keep-experimental",
      approval: {
        ...(isPlainObject(approved.approval) ? approved.approval : {}),
        ownerId,
        decision,
        at,
        state: "decided",
        subjectFingerprint: subjectFingerprint(approved),
      },
      decidedBy: ownerId,
      decidedAt: at,
      notifications: [...(record.notifications ?? []), ...notificationBatch("decision", at, ownerId, note)],
      decisions: [...(record.decisions ?? []), decisionEntry({ level: "keep-experimental" })],
      updatedAt: at,
    },
  };
}

/**
 * One owner objects. Before a decision an objection is always open; after a
 * decision it must arrive inside the 24h window. Either way the record goes to
 * `Held` and nothing proceeds.
 *
 * @param {Record<string, any>} record
 * @param {{ ownerId: string, reason: string, now?: number|string|Date }} [options]
 * @returns {{ ok: true, record: Record<string, any> } | { ok: false, reason: string }}
 */
export function objection(record, options = {}) {
  refuseVaultAsRecord(record, "objection", "vault.objection(id, options)");
  if (!isPlainObject(record)) {
    throw new TypeError("objection(record, options) needs a record object.");
  }
  const { ownerId, reason, now } = options;
  const nowMs = toMilliseconds(now ?? Date.now());
  const at = new Date(nowMs).toISOString();

  if (!isOwner(ownerId)) {
    return { ok: false, reason: `Only ${OWNERS.join(" or ")} may object; ${JSON.stringify(ownerId ?? null)} is not an owner.` };
  }
  if (!isNonEmptyString(reason)) {
    return { ok: false, reason: "An objection needs a written reason." };
  }
  if (record.state === "Revoked") {
    return { ok: false, reason: "This record is revoked; there is nothing left to hold." };
  }
  if (record.state === "Held") {
    return { ok: false, reason: "This record is already on hold." };
  }
  if (FROZEN_STATES.includes(record.state)) {
    return { ok: false, reason: `A ${record.state} record cannot be held.` };
  }
  if (!["Reviewed", "Proposed", "Approved"].includes(record.state)) {
    return {
      ok: false,
      reason: `An objection applies to a Reviewed, Proposed or Approved record; this one is ${record.state}. Revoke or roll it back instead.`,
    };
  }

  const decidedAt = isIsoDate(record.decidedAt)
    ? record.decidedAt
    : record.state === "Approved" && isIsoDate(record.updatedAt)
      ? record.updatedAt
      : null;

  if (decidedAt) {
    const deadline = Date.parse(decidedAt) + OBJECTION_WINDOW_MS;
    if (nowMs > deadline) {
      return {
        ok: false,
        reason: `The 24h objection window closed at ${new Date(deadline).toISOString()}; revoke the capability instead of objecting.`,
      };
    }
  }

  const moved = transition(record, "Held", {
    actor: ownerId,
    now: at,
    reason: reason.trim(),
    evidence: {
      heldFrom: record.state,
      hold: {
        by: ownerId,
        reason: reason.trim(),
        at,
        decidedAt,
        expiresAt: decidedAt ? new Date(Date.parse(decidedAt) + OBJECTION_WINDOW_MS).toISOString() : null,
      },
    },
  });
  if (!moved.ok) return moved;

  return {
    ok: true,
    record: {
      ...moved.proposal,
      notifications: [...(record.notifications ?? []), ...notificationBatch("objection", at, ownerId, reason)],
      decisions: [
        ...(record.decisions ?? []),
        {
          seq: (record.decisions ?? []).length,
          type: "objection",
          ownerId,
          note: reason.trim(),
          at,
          heldFrom: record.state,
        },
      ],
      updatedAt: at,
    },
  };
}

/**
 * Resolve an open objection. Only an owner may resolve, the note is recorded
 * permanently, and the record returns to exactly the state the hold interrupted.
 *
 * @param {Record<string, any>} record
 * @param {{ ownerId: string, note: string, now?: number|string|Date }} [options]
 * @returns {{ ok: true, record: Record<string, any> } | { ok: false, reason: string }}
 */
export function resolve(record, options = {}) {
  refuseVaultAsRecord(record, "resolve", "vault.resolve(id, options)");
  if (!isPlainObject(record)) {
    throw new TypeError("resolve(record, options) needs a record object.");
  }
  const { ownerId, note, now } = options;
  const at = toIso(now ?? Date.now());

  if (!isOwner(ownerId)) {
    return { ok: false, reason: `Only ${OWNERS.join(" or ")} may resolve a hold; ${JSON.stringify(ownerId ?? null)} is not an owner.` };
  }
  if (record.state !== "Held") {
    return { ok: false, reason: `There is no hold to resolve; the record is ${record.state}.` };
  }
  if (!isNonEmptyString(note)) {
    return { ok: false, reason: "A resolution needs a written note; it is recorded permanently." };
  }

  const restoresTo = record.heldFrom;
  if (!["Reviewed", "Proposed", "Approved"].includes(restoresTo)) {
    return { ok: false, reason: `The hold does not record a restorable state (heldFrom=${JSON.stringify(restoresTo ?? null)}).` };
  }

  const moved = transition(record, restoresTo, {
    actor: ownerId,
    now: at,
    reason: note.trim(),
  });
  if (!moved.ok) return moved;

  return {
    ok: true,
    record: {
      ...moved.proposal,
      hold: null,
      heldFrom: null,
      resolution: {
        by: ownerId,
        note: note.trim(),
        at,
        restoresTo,
        objection: isPlainObject(record.hold) ? cloneRecord(record.hold) : null,
      },
      notifications: [...(record.notifications ?? []), ...notificationBatch("resolution", at, ownerId, note)],
      decisions: [
        ...(record.decisions ?? []),
        {
          seq: (record.decisions ?? []).length,
          type: "resolution",
          ownerId,
          note: note.trim(),
          at,
          restoresTo,
        },
      ],
      updatedAt: at,
    },
  };
}

/**
 * Promote an experimental capability to permanent. Refused unless every fact is
 * present: three or more recorded uses, zero incidents, a Verified state, fresh
 * evidence, and an approval that still binds to the record as it stands.
 *
 * @param {Record<string, any>} record
 * @param {{ count: number, incidents: number, lastUsedAt?: string }} usage
 * @param {{ now?: number|string|Date }} [options]
 * @returns {{ ok: true, record: Record<string, any> } | { ok: false, reason: string }}
 */
export function promote(record, usage, options = {}) {
  refuseVaultAsRecord(record, "promote", "vault.promote(id, usage, options)");
  if (!isPlainObject(record)) {
    throw new TypeError("promote(record, usage) needs a record object.");
  }
  const at = toIso(options.now ?? Date.now());

  if (record.state === "Revoked" || isPlainObject(record.revoked)) {
    return { ok: false, reason: "A revoked record cannot be promoted." };
  }
  if (record.state !== "Verified") {
    return { ok: false, reason: `Promotion requires a Verified record; this one is ${record.state}.` };
  }
  if (record.level !== "keep-experimental") {
    return {
      ok: false,
      reason:
        record.level === "keep-permanent"
          ? "This record is already permanent."
          : "Promotion requires an experimental keep first; no keep decision has been recorded.",
    };
  }
  if (!isPlainObject(usage)) {
    return { ok: false, reason: "Promotion requires recorded usage facts (count and incidents)." };
  }
  if (!Number.isInteger(usage.count) || usage.count < 0) {
    return { ok: false, reason: "usage.count must be a non-negative integer." };
  }
  if (!Number.isInteger(usage.incidents) || usage.incidents < 0) {
    return { ok: false, reason: "usage.incidents must be a non-negative integer." };
  }
  if (usage.count < PROMOTION_USES) {
    return {
      ok: false,
      reason: `Promotion requires at least ${PROMOTION_USES} recorded uses; this record has ${usage.count}.`,
    };
  }
  if (usage.incidents !== 0) {
    return {
      ok: false,
      reason: `Promotion requires zero incidents; this record has ${usage.incidents}.`,
    };
  }
  if (isStale(record, at, record.staleAfter)) {
    return { ok: false, reason: "The record is stale; re-validate the evidence before promoting it." };
  }
  const bound = record?.approval?.subjectFingerprint;
  if (!isNonEmptyString(bound)) {
    return { ok: false, reason: "The record has no approval fingerprint; it cannot be promoted on an unbound approval." };
  }
  if (bound !== subjectFingerprint(record)) {
    return {
      ok: false,
      reason: "The record changed after approval (change plan, kill criteria, cost, risk or evidence). Review it again.",
    };
  }

  return {
    ok: true,
    record: {
      ...cloneRecord(record),
      level: "keep-permanent",
      usage: {
        count: usage.count,
        incidents: usage.incidents,
        lastUsedAt: usage.lastUsedAt ?? record.usage?.lastUsedAt ?? at,
      },
      permanence: {
        grantedAt: at,
        basis: "usage-gate",
        uses: usage.count,
        incidents: usage.incidents,
        verifier: record?.verifier?.verifierId ?? null,
      },
      decisions: [
        ...(record.decisions ?? []),
        {
          seq: (record.decisions ?? []).length,
          type: "promotion",
          ownerId: null,
          decision: "keep-permanent",
          at,
          uses: usage.count,
          incidents: usage.incidents,
        },
      ],
      updatedAt: at,
    },
  };
}

/**
 * The global kill switch. Revoking is final: the record is deep-frozen, every
 * access check fails for every user, and the reason is kept forever.
 *
 * @param {Record<string, any>} record
 * @param {{ actor: string, reason: string, now?: number|string|Date }} [options]
 * @returns {{ ok: true, record: Record<string, any> } | { ok: false, reason: string }}
 */
export function revoke(record, options = {}) {
  refuseVaultAsRecord(record, "revoke", "vault.revoke(id, options)");
  if (!isPlainObject(record)) {
    throw new TypeError("revoke(record, options) needs a record object.");
  }
  const { actor, reason, now } = options;
  const at = toIso(now ?? Date.now());

  if (!isOwner(actor)) {
    return { ok: false, reason: `Only ${OWNERS.join(" or ")} may revoke; ${JSON.stringify(actor ?? null)} is not an owner.` };
  }
  if (!isNonEmptyString(reason)) {
    return { ok: false, reason: "Revocation needs a written reason; it is recorded permanently." };
  }
  if (record.state === "Revoked" || isPlainObject(record.revoked)) {
    return { ok: false, reason: "This record is already revoked." };
  }
  if (FROZEN_STATES.includes(record.state)) {
    return { ok: false, reason: `A ${record.state} record is already final and cannot be revoked.` };
  }

  const prepared = {
    ...cloneRecord(record),
    level: null,
    revoked: {
      by: actor,
      reason: reason.trim(),
      at,
      approvedFingerprint: record?.approval?.subjectFingerprint ?? null,
      currentFingerprint: subjectFingerprint(record),
    },
    decisions: [
      ...(record.decisions ?? []),
      {
        seq: (record.decisions ?? []).length,
        type: "revocation",
        ownerId: actor,
        note: reason.trim(),
        at,
      },
    ],
    notifications: [...(record.notifications ?? []), ...notificationBatch("revocation", at, actor, reason)],
  };

  const moved = transition(prepared, "Revoked", { actor, now: at, reason: reason.trim() });
  return moved.ok ? { ok: true, record: moved.proposal } : moved;
}
/**
 * Whether a user may use the capability this record describes. Never whether
 * they may *see* the record — audit visibility is separate from access.
 *
 * @param {Record<string, any>} record
 * @returns {{ allowed: boolean, scope: 'none'|'requesting-user'|'global', reason: string }}
 */
export function access(record) {
  if (!isPlainObject(record)) {
    return { allowed: false, scope: "none", reason: "No record." };
  }
  if (record.state === "Revoked" || isPlainObject(record.revoked)) {
    return { allowed: false, scope: "none", reason: "Revoked: every user loses access." };
  }
  if (["Rejected", "Archived", "Superseded"].includes(record.state)) {
    return { allowed: false, scope: "none", reason: `The record is ${record.state}.` };
  }
  if (record.state === "Held") {
    return { allowed: false, scope: "none", reason: "On hold: an objection is unresolved." };
  }
  if (record.level === "keep-permanent") {
    return { allowed: true, scope: "global", reason: "Permanent capability, gated on usage and zero incidents." };
  }
  if (record.level === "keep-experimental") {
    return { allowed: true, scope: "requesting-user", reason: "Experimental: available to the requesting user only." };
  }
  return { allowed: false, scope: "none", reason: "No keep decision has been made." };
}

/**
 * The complete audit trail: Vault decisions and lifecycle transitions, each in
 * append order, merged chronologically. The returned array is a frozen copy —
 * there is no API that removes an entry.
 *
 * @param {Record<string, any>} record
 * @returns {ReadonlyArray<Record<string, any>>}
 */
export function auditTrail(record) {
  if (!isPlainObject(record)) return deepFreeze([]);
  const decisions = (Array.isArray(record.decisions) ? record.decisions : []).map((entry, index) => ({
    ...cloneRecord(entry),
    source: "vault",
    order: index,
  }));
  const transitions = (Array.isArray(record.history) ? record.history : []).map((entry, index) => ({
    ...cloneRecord(entry),
    source: "lifecycle",
    order: decisions.length + index,
  }));
  const merged = [...decisions, ...transitions]
    .sort((left, right) => {
      const leftAt = Date.parse(left.at ?? 0) || 0;
      const rightAt = Date.parse(right.at ?? 0) || 0;
      if (leftAt !== rightAt) return leftAt - rightAt;
      return left.order - right.order;
    })
    .map(({ order, ...entry }) => entry);
  return deepFreeze(merged);
}

/**
 * A Vault: an in-memory, serialisable registry of records. Constructing one has
 * no side effects, and none of its methods touch anything outside the registry.
 *
 * @param {{ now?: () => number|string|Date }} [options]
 * @returns {Record<string, any>}
 */
export function createVault(options = {}) {
  const clock = typeof options.now === "function" ? options.now : () => options.now ?? Date.now();
  const records = new Map();

  const target = (recordOrId) => {
    if (typeof recordOrId === "string") return records.get(recordOrId) ?? null;
    if (isPlainObject(recordOrId) && isNonEmptyString(recordOrId.id)) {
      return records.get(recordOrId.id) ?? recordOrId;
    }
    return null;
  };

  const commit = (result) => {
    if (result.ok) records.set(result.record.id, result.record);
    return result;
  };

  const vault = {
    size() {
      return records.size;
    },

    addRecord(input = {}) {
      const record = buildRecord(input, { now: clock() });
      const validation = validateRecord(record);
      if (!validation.ok) {
        return { ok: false, errors: validation.errors, reason: validation.errors.join(" ") };
      }
      const existing = [...records.values()].find((item) => item.dedupeKey === record.dedupeKey);
      if (existing && !FROZEN_STATES.includes(existing.state)) {
        return {
          ok: false,
          reason: `Duplicate dedupe key ${record.dedupeKey}; it already belongs to ${existing.id} (${existing.state}).`,
        };
      }
      if (existing) {
        record.replaces = existing.id;
        records.set(
          existing.id,
          deepFreeze({ ...cloneRecord(existing), replacedBy: record.id }),
        );
      }
      const entry = {
        ...record,
        decisions: [
          {
            seq: 0,
            type: "created",
            ownerId: null,
            actor: record.createdBy,
            note: null,
            at: record.createdAt,
          },
        ],
      };
      records.set(entry.id, entry);
      return { ok: true, record: entry };
    },

    getRecord(id) {
      const found = records.get(String(id));
      return found ? found : null;
    },

    listRecords(filter = {}) {
      const { includeRevoked = false, state, category, risk, level } = filter ?? {};
      const states = state === undefined ? null : Array.isArray(state) ? state : [state];
      return [...records.values()]
        .filter((record) => (includeRevoked ? true : record.state !== "Revoked"))
        .filter((record) => (states ? states.includes(record.state) : true))
        .filter((record) => (category ? record.category === category : true))
        .filter((record) => (risk ? record.risk === risk : true))
        .filter((record) => (level === undefined ? true : record.level === level))
        .sort((left, right) => (left.id < right.id ? -1 : left.id > right.id ? 1 : 0));
    },

    decide(recordOrId, decisionOptions = {}) {
      const record = target(recordOrId);
      if (!record) return { ok: false, reason: "Unknown record." };
      return commit(decide(record, { now: clock(), ...decisionOptions }));
    },

    objection(recordOrId, objectionOptions = {}) {
      const record = target(recordOrId);
      if (!record) return { ok: false, reason: "Unknown record." };
      return commit(objection(record, { now: clock(), ...objectionOptions }));
    },

    resolve(recordOrId, resolveOptions = {}) {
      const record = target(recordOrId);
      if (!record) return { ok: false, reason: "Unknown record." };
      return commit(resolve(record, { now: clock(), ...resolveOptions }));
    },

    promote(recordOrId, usage, promoteOptions = {}) {
      const record = target(recordOrId);
      if (!record) return { ok: false, reason: "Unknown record." };
      return commit(promote(record, usage, { now: clock(), ...promoteOptions }));
    },

    revoke(recordOrId, revokeOptions = {}) {
      const record = target(recordOrId);
      if (!record) return { ok: false, reason: "Unknown record." };
      return commit(revoke(record, { now: clock(), ...revokeOptions }));
    },

    advance(recordOrId, to, advanceOptions = {}) {
      const record = target(recordOrId);
      if (!record) return { ok: false, reason: "Unknown record." };
      const moved = transition(record, to, { now: clock(), ...advanceOptions });
      if (!moved.ok) return moved;
      return commit({ ok: true, record: moved.proposal });
    },

    demoteStale(recordOrId, demoteOptions = {}) {
      const record = target(recordOrId);
      if (!record) return { ok: false, reason: "Unknown record." };
      const demoted = demoteStale(
        record,
        demoteOptions.now ?? clock(),
        demoteOptions.staleAfterDays ?? record.staleAfter,
      );
      if (!demoted.ok) return demoted;
      return commit({ ok: true, record: demoted.proposal });
    },

    auditTrail(recordOrId) {
      const record = target(recordOrId);
      return auditTrail(record ?? {});
    },

    access(recordOrId) {
      return access(target(recordOrId));
    },

    validateRecord(record) {
      return validateRecord(record);
    },

    serialize() {
      return JSON.stringify([...records.values()]);
    },

    restore(json) {
      let parsed;
      try {
        parsed = JSON.parse(json);
      } catch (error) {
        return { ok: false, reason: `Not valid JSON: ${error instanceof Error ? error.message : String(error)}` };
      }
      if (!Array.isArray(parsed)) return { ok: false, reason: "The serialised Vault must be an array." };
      const errors = [];
      const accepted = [];
      for (const candidate of parsed) {
        const validation = validateRecord(candidate);
        if (!validation.ok) {
          errors.push({ id: candidate?.id ?? null, errors: validation.errors });
          continue;
        }
        accepted.push(candidate);
      }
      if (errors.length > 0) {
        return { ok: false, reason: "Refusing to restore a Vault containing invalid records.", errors };
      }
      records.clear();
      for (const record of accepted) records.set(record.id, record);
      return { ok: true, restored: accepted.length };
    },
  };

  return vault;
}

/* ---------------------------------------------------------------- façade */

/**
 * @param {Record<string, any>} vault
 * @param {Record<string, any>} input
 * @returns {{ ok: boolean, record?: Record<string, any>, reason?: string, errors?: string[] }}
 */
export function addRecord(vault, input) {
  return vault.addRecord(input);
}

/**
 * @param {Record<string, any>} vault
 * @param {string} id
 */
export function getRecord(vault, id) {
  return vault.getRecord(id);
}

/**
 * @param {Record<string, any>} vault
 * @param {Record<string, any>} [filter]
 */
export function listRecords(vault, filter) {
  return vault.listRecords(filter);
}

export default {
  VAULT_SCHEMA,
  VAULT_DECISIONS,
  VAULT_LEVELS,
  RECORD_FIELDS,
  PROTOCOL_FIELDS,
  OBJECTION_WINDOW_MS,
  PROMOTION_USES,
  APPROVAL_RISK_LEVELS,
  createVault,
  addRecord,
  getRecord,
  listRecords,
  buildRecord,
  validateRecord,
  decide,
  objection,
  resolve,
  promote,
  revoke,
  access,
  auditTrail,
  approvalSubject,
  subjectFingerprint,
  notifiedOwners,
};

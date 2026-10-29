import assert from "node:assert/strict";
import test from "node:test";

import {
  OBJECTION_WINDOW_MS,
  PROMOTION_USES,
  PROTOCOL_FIELDS,
  RECORD_FIELDS,
  VAULT_DECISIONS,
  addRecord,
  approvalSubject,
  auditTrail,
  buildRecord,
  createVault,
  decide,
  getRecord,
  listRecords,
  notifiedOwners,
  objection,
  promote,
  resolve,
  revoke,
  subjectFingerprint,
  validateRecord,
} from "../src/core/capabilityVault.js";

const BASE = Date.parse("2026-10-20T12:00:00.000Z");
const MINUTE = 60_000;

function recordInput(overrides = {}) {
  return {
    id: "cap_stream_tools",
    title: "Stream tool output",
    category: "workflows",
    problem: "Long tool calls give no progress feedback.",
    intendedOutcome: "A user sees progress within one second of a tool call.",
    evidence: [
      {
        url: "https://example.org/advisory/42",
        retrievedAt: "2026-10-19T00:00:00.000Z",
        kind: "primary",
      },
    ],
    dedupeKey: "hey:research/v1|https://example.org/advisory/42|2|abc123",
    staleAfter: 30,
    risk: "R1",
    changePlan: {
      components: ["toolRegistry"],
      newApis: [],
      changedApis: ["executeTool"],
      schemaChanges: [],
      permissionChanges: [],
      migrations: [],
      rollbackSteps: ["turn the stream flag off"],
    },
    killCriteria: {
      metric: "tool error rate",
      baseline: 0.01,
      threshold: 0.02,
      windowDays: 14,
      owner: "Sako",
    },
    cost: { perUseCents: 0, worstCaseCents: 12 },
    createdBy: "capability-evolution-agent",
    ...overrides,
  };
}

function harness() {
  let current = BASE;
  const vault = createVault({ now: () => current });
  return {
    vault,
    now: () => current,
    setNow(ms) {
      current = ms;
    },
    tick(ms = MINUTE) {
      current += ms;
    },
    advance(id, to, options = {}) {
      const result = vault.advance(id, to, { actor: "capability-evolution-agent", ...options });
      if (result.ok) current += MINUTE;
      return result;
    },
  };
}

const TO_PROPOSED = [
  ["Validated", {}],
  [
    "Reviewed",
    {
      evidence: {
        flawHunterFindings: [{ finding: "Streaming hides partial failures.", severity: "high" }],
        solutionTwinRecommendation: { recommendation: "Ship behind a flag with a fallback." },
      },
    },
  ],
  ["Proposed", {}],
];

const TO_VERIFIED = [
  [
    "Shadow",
    { evidence: { shadowPlan: { plan: "Mirror 5% of tool calls", steps: ["enable", "compare"] } } },
  ],
  [
    "InImplementation",
    { evidence: { shadowEvidence: { runs: 12, passes: 12, failures: 0 } } },
  ],
  ["Tested", { evidence: { testEvidence: [{ id: "test:stream", result: "pass" }] } }],
  [
    "Verified",
    {
      evidence: {
        implementer: { implementerId: "agent:capability-evolution" },
        verifier: { verifierId: "agent:verifier", method: "replay-recorded-fixtures" },
      },
    },
  ],
];

/**
 * Adds a record, walks it to Proposed, takes a keep decision from `ownerId`,
 * then walks it to Verified.
 */
function verifiedRecord(options = {}) {
  const h = harness();
  const added = h.vault.addRecord(recordInput(options.input));
  assert.equal(added.ok, true, added.reason);
  const id = added.record.id;

  for (const [to, stepOptions] of TO_PROPOSED) {
    const step = h.advance(id, to, stepOptions);
    assert.equal(step.ok, true, `${to}: ${step.reason}`);
  }

  const decision = h.vault.decide(id, {
    decision: "keep",
    ownerId: options.ownerId ?? "Sako",
    note: "Worth three uses.",
  });
  assert.equal(decision.ok, true, decision.reason);

  for (const [to, stepOptions] of TO_VERIFIED) {
    const step = h.advance(id, to, stepOptions);
    assert.equal(step.ok, true, `${to}: ${step.reason}`);
  }

  const record = h.vault.getRecord(id);
  assert.equal(record.state, "Verified");
  return { h, id, record };
}

/* ------------------------------------------------------------ the shape */

test("a record carries every field the specification names plus the protocol fields", () => {
  const record = buildRecord(recordInput(), { now: BASE });
  for (const field of RECORD_FIELDS) {
    assert.ok(field in record, `record is missing the specified field ${field}`);
  }
  assert.equal(RECORD_FIELDS.length, 20);
  assert.equal(PROTOCOL_FIELDS.length, 17);
  assert.equal(new Set([...RECORD_FIELDS, ...PROTOCOL_FIELDS]).size, 37);
  assert.equal(record.state, "Candidate");
  assert.equal(record.level, null);
  assert.deepEqual(record.decisions, []);
});

test("validateRecord refuses a record that cannot be audited", () => {
  const valid = buildRecord(recordInput(), { now: BASE });
  assert.deepEqual(validateRecord(valid), { ok: true, errors: [] });

  const broken = validateRecord({
    id: "",
    title: "",
    category: "",
    problem: "",
    intendedOutcome: "",
    evidence: [],
    dedupeKey: "",
    staleAfter: 0,
    createdAt: "not-a-date",
    state: "Almost",
    risk: "R9",
    cost: {},
    usage: {},
    shadow: {},
    decisions: "nope",
  });
  assert.equal(broken.ok, false);
  assert.ok(broken.errors.length >= 12, `expected many errors, got ${broken.errors.length}`);
  assert.ok(broken.errors.some((error) => /risk must be one of/.test(error)));
  assert.ok(broken.errors.some((error) => /evidence must be a non-empty array/.test(error)));
});

test("the vault exposes the ten operations the specification requires", () => {
  const vault = createVault({ now: () => BASE });
  for (const name of [
    "addRecord",
    "getRecord",
    "listRecords",
    "decide",
    "objection",
    "resolve",
    "promote",
    "revoke",
    "auditTrail",
    "validateRecord",
  ]) {
    assert.equal(typeof vault[name], "function", `vault.${name} must exist`);
  }
  assert.deepEqual([...VAULT_DECISIONS], ["keep", "delete", "keep-with-changes"]);
});

/* ------------------------------------------------------- owner protocol */

test("only Sako or Amad may decide, object, resolve or revoke", () => {
  const h = harness();
  h.vault.addRecord(recordInput());
  const id = "cap_stream_tools";

  for (const actor of ["Mallory", "sako", "SAKO", "", null, "system"]) {
    assert.equal(h.vault.decide(id, { decision: "keep", ownerId: actor }).ok, false);
    assert.equal(h.vault.objection(id, { ownerId: actor, reason: "no" }).ok, false);
    assert.equal(h.vault.revoke(id, { actor, reason: "no" }).ok, false);
  }
});

test("either owner may approve alone, and both owners are notified", () => {
  const bySako = harness();
  bySako.vault.addRecord(recordInput({ id: "by_sako" }));
  for (const [to, options] of TO_PROPOSED) bySako.advance("by_sako", to, options);

  const sako = bySako.vault.decide("by_sako", { decision: "keep", ownerId: "Sako", note: "yes" });
  assert.equal(sako.ok, true, sako.reason);
  assert.equal(sako.record.state, "Approved");
  assert.equal(sako.record.level, "keep-experimental");
  assert.deepEqual(notifiedOwners(sako.record, "decision"), ["Amad", "Sako"]);
  assert.equal(sako.record.notifications.every((entry) => entry.event === "hey:owner-notification"), true);

  const byAmad = harness();
  byAmad.vault.addRecord(recordInput({ id: "by_amad" }));
  for (const [to, options] of TO_PROPOSED) byAmad.advance("by_amad", to, options);
  const amad = byAmad.vault.decide("by_amad", { decision: "keep", ownerId: "Amad", note: "yes" });
  assert.equal(amad.ok, true, amad.reason);
  assert.equal(amad.record.decidedBy, "Amad");
});

test("the second owner may confirm an existing approval without breaking it", () => {
  const h = harness();
  h.vault.addRecord(recordInput());
  for (const [to, options] of TO_PROPOSED) h.advance("cap_stream_tools", to, options);

  const first = h.vault.decide("cap_stream_tools", { decision: "keep", ownerId: "Sako", note: "yes" });
  assert.equal(first.ok, true, first.reason);
  const second = h.vault.decide("cap_stream_tools", { decision: "keep", ownerId: "Amad", note: "also yes" });
  assert.equal(second.ok, true, second.reason);
  assert.equal(second.record.state, "Approved");
  assert.equal(second.record.decisions.filter((entry) => entry.type === "decision").length, 2);
  assert.deepEqual(notifiedOwners(second.record, "decision"), ["Amad", "Sako"]);
});

test("an owner cannot approve a record that has not been proposed", () => {
  const h = harness();
  h.vault.addRecord(recordInput());
  const result = h.vault.decide("cap_stream_tools", { decision: "keep", ownerId: "Sako" });
  assert.equal(result.ok, false);
  assert.match(result.reason, /Illegal transition Candidate → Approved/);
  assert.equal(h.vault.getRecord("cap_stream_tools").state, "Candidate");
});

/* -------------------------------------------------------------- silence */

test("silence is not consent: time alone never approves anything", () => {
  const h = harness();
  h.vault.addRecord(recordInput());
  for (const [to, options] of TO_PROPOSED) h.advance("cap_stream_tools", to, options);

  h.setNow(BASE + 72 * 60 * MINUTE);
  const record = h.vault.getRecord("cap_stream_tools");
  assert.equal(record.state, "Proposed");
  assert.equal(record.level, null);
  assert.equal(record.decidedBy, null);
  assert.equal(record.approval, null);
  assert.equal(h.vault.access("cap_stream_tools").allowed, false);
  assert.match(h.vault.access("cap_stream_tools").reason, /No keep decision/);
});

/* ------------------------------------------------------------ objections */

test("an objection moves the record to HOLD and blocks both owners", () => {
  const h = harness();
  h.vault.addRecord(recordInput());
  for (const [to, options] of TO_PROPOSED) h.advance("cap_stream_tools", to, options);

  const kept = h.vault.decide("cap_stream_tools", { decision: "keep", ownerId: "Sako", note: "yes" });
  assert.equal(kept.ok, true, kept.reason);

  h.tick(5 * MINUTE);
  const held = h.vault.objection("cap_stream_tools", {
    ownerId: "Amad",
    reason: "The cost evidence is two releases old.",
  });
  assert.equal(held.ok, true, held.reason);
  assert.equal(held.record.state, "Held");
  assert.equal(held.record.heldFrom, "Approved");
  assert.equal(held.record.hold.by, "Amad");
  assert.deepEqual(notifiedOwners(held.record, "objection"), ["Amad", "Sako"]);
  assert.equal(h.vault.access("cap_stream_tools").allowed, false);
  assert.match(h.vault.access("cap_stream_tools").reason, /On hold/);

  for (const ownerId of ["Sako", "Amad"]) {
    const blocked = h.vault.decide("cap_stream_tools", { decision: "keep", ownerId });
    assert.equal(blocked.ok, false);
    assert.match(blocked.reason, /objection is open/);
  }
  assert.equal(h.vault.promote("cap_stream_tools", { count: 9, incidents: 0 }).ok, false);
});

test("an objection outside the 24h window is refused, and revoke remains available", () => {
  const h = harness();
  h.vault.addRecord(recordInput());
  for (const [to, options] of TO_PROPOSED) h.advance("cap_stream_tools", to, options);
  h.vault.decide("cap_stream_tools", { decision: "keep", ownerId: "Sako", note: "yes" });

  h.setNow(BASE + OBJECTION_WINDOW_MS + 10 * MINUTE);
  const late = h.vault.objection("cap_stream_tools", { ownerId: "Amad", reason: "too late" });
  assert.equal(late.ok, false);
  assert.match(late.reason, /objection window closed/);
  assert.equal(h.vault.getRecord("cap_stream_tools").state, "Approved");

  assert.equal(h.vault.revoke("cap_stream_tools", { actor: "Amad", reason: "after review" }).ok, true);
});

test("resolve clears the hold, restores the exact state and is recorded permanently", () => {
  const h = harness();
  h.vault.addRecord(recordInput());
  for (const [to, options] of TO_PROPOSED) h.advance("cap_stream_tools", to, options);
  h.vault.decide("cap_stream_tools", { decision: "keep", ownerId: "Sako", note: "yes" });
  h.tick();
  h.vault.objection("cap_stream_tools", { ownerId: "Amad", reason: "cost evidence is old" });
  h.tick();

  const resolved = h.vault.resolve("cap_stream_tools", {
    ownerId: "Amad",
    note: "Re-checked the 2026-10 price sheet; the cost is still 12 cents worst case.",
  });
  assert.equal(resolved.ok, true, resolved.reason);
  assert.equal(resolved.record.state, "Approved");
  assert.equal(resolved.record.hold, null);
  assert.equal(resolved.record.heldFrom, null);
  assert.equal(resolved.record.resolution.by, "Amad");
  assert.equal(resolved.record.resolution.restoresTo, "Approved");
  assert.equal(resolved.record.resolution.objection.reason, "cost evidence is old");
  assert.equal(
    resolved.record.decisions.some((entry) => entry.type === "resolution"),
    true,
  );
  assert.equal(h.vault.access("cap_stream_tools").allowed, true);
});

test("resolve needs a hold and a written note", () => {
  const h = harness();
  h.vault.addRecord(recordInput());
  assert.equal(h.vault.resolve("cap_stream_tools", { ownerId: "Sako", note: "nothing to resolve" }).ok, false);

  for (const [to, options] of TO_PROPOSED) h.advance("cap_stream_tools", to, options);
  h.vault.objection("cap_stream_tools", { ownerId: "Amad", reason: "hold it" });
  const noNote = h.vault.resolve("cap_stream_tools", { ownerId: "Sako", note: "" });
  assert.equal(noNote.ok, false);
  assert.match(noNote.reason, /needs a written note/);
});

/* --------------------------------------------------------------- levels */

test("keep-experimental is scoped to the requesting user and is access-checked", () => {
  const h = harness();
  h.vault.addRecord(recordInput());
  for (const [to, options] of TO_PROPOSED) h.advance("cap_stream_tools", to, options);
  h.vault.decide("cap_stream_tools", { decision: "keep", ownerId: "Sako" });

  const access = h.vault.access("cap_stream_tools");
  assert.equal(access.allowed, true);
  assert.equal(access.scope, "requesting-user");
  assert.equal(h.vault.getRecord("cap_stream_tools").level, "keep-experimental");
});

test("promotion requires an experimental keep, a Verified state, three uses and zero incidents", () => {
  const { h, id } = verifiedRecord();

  assert.equal(h.vault.promote(id, { count: 2, incidents: 0 }).ok, false);
  assert.match(h.vault.promote(id, { count: 2, incidents: 0 }).reason, /at least 3 recorded uses/);

  assert.equal(h.vault.promote(id, { count: 5, incidents: 1 }).ok, false);
  assert.match(h.vault.promote(id, { count: 5, incidents: 1 }).reason, /zero incidents/);

  assert.equal(h.vault.promote(id, { count: 3.5, incidents: 0 }).ok, false);
  assert.equal(h.vault.promote(id, {}).ok, false);

  const unverified = harness();
  unverified.vault.addRecord(recordInput({ id: "not_verified" }));
  for (const [to, options] of TO_PROPOSED) unverified.advance("not_verified", to, options);
  unverified.vault.decide("not_verified", { decision: "keep", ownerId: "Sako" });
  const tooEarly = unverified.vault.promote("not_verified", { count: 9, incidents: 0 });
  assert.equal(tooEarly.ok, false);
  assert.match(tooEarly.reason, /requires a Verified record/);
});

test("promotion succeeds only with every fact present, and then grants global access", () => {
  const { h, id } = verifiedRecord();
  const promoted = h.vault.promote(id, {
    count: PROMOTION_USES,
    incidents: 0,
    lastUsedAt: new Date(BASE + 3 * 60 * MINUTE).toISOString(),
  });
  assert.equal(promoted.ok, true, promoted.reason);
  assert.equal(promoted.record.level, "keep-permanent");
  assert.equal(promoted.record.permanence.uses, 3);
  assert.equal(promoted.record.permanence.verifier, "agent:verifier");
  assert.equal(h.vault.access(id).scope, "global");

  const again = h.vault.promote(id, { count: 4, incidents: 0 });
  assert.equal(again.ok, false);
  assert.match(again.reason, /already permanent/);
});

test("promotion is refused when the record changed after approval", () => {
  const { h, id } = verifiedRecord();
  const tampered = h.vault.advance(id, "Shadow", {
    evidence: {
      shadowPlan: { plan: "Mirror 5%", steps: ["one"] },
      killCriteria: { ...recordInput().killCriteria, threshold: 10 },
    },
  });
  // The record is already Verified, so this transition is illegal; the point is
  // that the approval fingerprint is what rejects the promotion.
  assert.equal(tampered.ok, false);
  assert.match(tampered.reason, /Illegal transition Verified → Shadow/);

  const record = h.vault.getRecord(id);
  const edited = { ...record, killCriteria: { ...record.killCriteria, threshold: 10 } };
  assert.notEqual(subjectFingerprint(edited), record.approval.subjectFingerprint);
  const result = promote(edited, { count: 3, incidents: 0 }, { now: h.now() });
  assert.equal(result.ok, false);
  assert.match(result.reason, /changed after approval/);
});

/* ------------------------------------------------------------ revocation */

test("revoke is a global kill switch: every user loses access, evidence is kept", () => {
  const { h, id } = verifiedRecord();
  h.vault.promote(id, { count: 3, incidents: 0 });
  assert.equal(h.vault.access(id).allowed, true);

  const revoked = h.vault.revoke(id, {
    actor: "Amad",
    reason: "incident #17: tool output leaked into a shared summary",
  });
  assert.equal(revoked.ok, true, revoked.reason);
  assert.equal(revoked.record.state, "Revoked");
  assert.equal(revoked.record.revoked.by, "Amad");
  assert.equal(revoked.record.level, null);

  assert.equal(h.vault.access(id).allowed, false);
  assert.equal(h.vault.access(id).scope, "none");
  assert.match(h.vault.access(id).reason, /every user loses access/);

  assert.equal(h.vault.listRecords().length, 0, "a revoked record disappears from normal listing");
  assert.equal(h.vault.listRecords({ includeRevoked: true }).length, 1);
  const kept = h.vault.getRecord(id);
  assert.notEqual(kept, null, "the record survives for audit");
  assert.equal(auditTrail(kept).some((entry) => entry.type === "revocation"), true);
  assert.equal(Object.isFrozen(kept), true);

  assert.equal(h.vault.decide(id, { decision: "keep", ownerId: "Sako" }).ok, false);
  assert.equal(h.vault.promote(id, { count: 99, incidents: 0 }).ok, false);
  assert.equal(h.vault.revoke(id, { actor: "Sako", reason: "again" }).ok, false);
});

test("revocation refuses an unknown actor or an empty reason", () => {
  const { h, id } = verifiedRecord();
  assert.equal(h.vault.revoke(id, { actor: "Mallory", reason: "because" }).ok, false);
  assert.equal(h.vault.revoke(id, { actor: "Sako", reason: "  " }).ok, false);
  assert.equal(h.vault.getRecord(id).state, "Verified");
});

/* ------------------------------------------------------- gate enforcement */

test("a record without kill criteria cannot be approved", () => {
  const h = harness();
  h.vault.addRecord(recordInput({ killCriteria: null }));
  for (const [to, options] of TO_PROPOSED) {
    const step = h.advance("cap_stream_tools", to, options);
    if (to === "Proposed") {
      assert.equal(step.ok, false, "a record without kill criteria cannot even be proposed");
      assert.match(step.reason, /killCriteria/);
    }
  }
});

test("a record without a change plan cannot be proposed", () => {
  const h = harness();
  h.vault.addRecord(recordInput({ changePlan: null }));
  h.advance("cap_stream_tools", "Validated");
  h.advance("cap_stream_tools", "Reviewed", {
    evidence: {
      flawHunterFindings: [{ finding: "no rollback", severity: "high" }],
      solutionTwinRecommendation: { recommendation: "write the plan first" },
    },
  });
  const proposed = h.advance("cap_stream_tools", "Proposed");
  assert.equal(proposed.ok, false);
  assert.match(proposed.reason, /changePlan/);
  assert.equal(h.vault.getRecord("cap_stream_tools").state, "Reviewed");
});

test("a stale record is demoted one step and can no longer be promoted", () => {
  const h = harness();
  h.vault.addRecord(recordInput());
  for (const [to, options] of TO_PROPOSED) h.advance("cap_stream_tools", to, options);

  h.setNow(BASE + 60 * 24 * 60 * MINUTE);
  const demoted = h.vault.demoteStale("cap_stream_tools");
  assert.equal(demoted.ok, true, demoted.reason);
  assert.equal(demoted.record.state, "Reviewed");
  assert.equal(demoted.record.decayCount, 1);
  assert.equal(auditTrail(demoted.record).some((entry) => entry.type === "decay"), true);
});

/* ------------------------------------------------------------- deletion */

test("delete keeps the audit evidence and closes the record", () => {
  const h = harness();
  h.vault.addRecord(recordInput());
  for (const [to, options] of TO_PROPOSED) h.advance("cap_stream_tools", to, options);

  const noReason = h.vault.decide("cap_stream_tools", { decision: "delete", ownerId: "Sako" });
  assert.equal(noReason.ok, false);
  assert.match(noReason.reason, /written reason/);

  const deleted = h.vault.decide("cap_stream_tools", {
    decision: "delete",
    ownerId: "Sako",
    note: "superseded by cap_stream_tools_v2",
  });
  assert.equal(deleted.ok, true, deleted.reason);
  assert.equal(deleted.record.state, "Rejected");
  assert.equal(deleted.record.level, null);
  assert.equal(h.vault.access("cap_stream_tools").allowed, false);

  const retained = h.vault.getRecord("cap_stream_tools");
  assert.notEqual(retained, null);
  assert.equal(auditTrail(retained).some((entry) => entry.type === "decision" && entry.decision === "delete"), true);
  assert.equal(h.vault.listRecords({ state: "Rejected" }).length, 1);
});

test("keep-with-changes names the changes and does not approve", () => {
  const h = harness();
  h.vault.addRecord(recordInput());
  for (const [to, options] of TO_PROPOSED) h.advance("cap_stream_tools", to, options);

  const empty = h.vault.decide("cap_stream_tools", {
    decision: "keep-with-changes",
    ownerId: "Amad",
  });
  assert.equal(empty.ok, false);
  assert.match(empty.reason, /at least one required change/);

  const changed = h.vault.decide("cap_stream_tools", {
    decision: "keep-with-changes",
    ownerId: "Amad",
    note: "keep it, but bound the buffer",
    changes: ["cap the stream buffer at 64 KiB", "add a timeout"],
  });
  assert.equal(changed.ok, true, changed.reason);
  assert.deepEqual(changed.record.changesRequested, ["cap the stream buffer at 64 KiB", "add a timeout"]);
  assert.equal(changed.record.level, null);
  assert.equal(changed.record.state, "Proposed");
  assert.equal(h.vault.access("cap_stream_tools").allowed, false);
});

test("keep-with-changes cannot be applied to an already approved record", () => {
  const h = harness();
  h.vault.addRecord(recordInput());
  for (const [to, options] of TO_PROPOSED) h.advance("cap_stream_tools", to, options);
  h.vault.decide("cap_stream_tools", { decision: "keep", ownerId: "Sako" });

  const conditional = h.vault.decide("cap_stream_tools", {
    decision: "keep-with-changes",
    ownerId: "Amad",
    changes: ["something"],
  });
  assert.equal(conditional.ok, false);
  assert.match(conditional.reason, /cannot be made conditional/);
});

/* ----------------------------------------------------------- audit trail */

test("the audit trail is append-only and returns a frozen copy", () => {
  const h = harness();
  h.vault.addRecord(recordInput());
  for (const [to, options] of TO_PROPOSED) h.advance("cap_stream_tools", to, options);
  h.vault.decide("cap_stream_tools", { decision: "keep", ownerId: "Sako" });

  const first = h.vault.auditTrail("cap_stream_tools");
  assert.ok(first.length >= 5);
  assert.equal(Object.isFrozen(first), true);
  assert.throws(() => {
    first.push({ type: "forged" });
  }, TypeError);
  assert.ok(first.every((entry) => ["vault", "lifecycle"].includes(entry.source)));

  h.tick();
  h.vault.objection("cap_stream_tools", { ownerId: "Amad", reason: "check the cost" });
  const second = h.vault.auditTrail("cap_stream_tools");
  assert.ok(second.length > first.length);
  assert.deepEqual(second.slice(0, first.length), first);
});

/* ----------------------------------------------------- identity and store */

test("a duplicate dedupe key is refused while the first record is live", () => {
  const h = harness();
  assert.equal(h.vault.addRecord(recordInput()).ok, true);
  const duplicate = h.vault.addRecord(recordInput({ id: "cap_stream_tools_copy" }));
  assert.equal(duplicate.ok, false);
  assert.match(duplicate.reason, /Duplicate dedupe key/);
  assert.equal(h.vault.size(), 1);
});

test("a rejected record releases its key, and the replacement records what it replaced", () => {
  const h = harness();
  h.vault.addRecord(recordInput());
  for (const [to, options] of TO_PROPOSED) h.advance("cap_stream_tools", to, options);
  h.vault.decide("cap_stream_tools", {
    decision: "delete",
    ownerId: "Sako",
    note: "wrong approach",
  });

  const replacement = h.vault.addRecord(recordInput({ id: "cap_stream_tools_v2" }));
  assert.equal(replacement.ok, true, replacement.reason);
  assert.equal(replacement.record.replaces, "cap_stream_tools");
  assert.equal(h.vault.getRecord("cap_stream_tools").replacedBy, "cap_stream_tools_v2");
});

test("the vault serialises and restores without inventing or losing a record", () => {
  const { h, id } = verifiedRecord();
  const json = h.vault.serialize();

  const restored = createVault({ now: () => BASE });
  const result = restored.restore(json);
  assert.equal(result.ok, true, result.reason);
  assert.equal(result.restored, 1);
  assert.equal(restored.getRecord(id).state, "Verified");
  assert.deepEqual(restored.auditTrail(id), h.vault.auditTrail(id));

  const bad = createVault();
  assert.equal(bad.restore("not json").ok, false);
  assert.equal(bad.restore(JSON.stringify([{ id: "broken" }])).ok, false);
});

test("module-level helpers read a vault without being able to change it", () => {
  const h = harness();
  h.vault.addRecord(recordInput());
  assert.equal(getRecord(h.vault, "cap_stream_tools").id, "cap_stream_tools");
  assert.equal(getRecord(h.vault, "nope"), null);
  assert.equal(listRecords(h.vault).length, 1);
  assert.equal(addRecord(h.vault, recordInput({ id: "x" })).ok, false);

  assert.throws(
    () => decide(h.vault, { decision: "keep", ownerId: "Sako" }),
    /takes a record; call vault\.decide/,
  );
});

test("the approval subject excludes state, usage and notifications by design", () => {
  const record = buildRecord(recordInput(), { now: BASE });
  const subject = approvalSubject(record);
  assert.deepEqual(Object.keys(subject).sort(), [
    "category",
    "changePlan",
    "cost",
    "evidence",
    "id",
    "killCriteria",
    "risk",
    "title",
  ]);
  assert.equal(subject.state, undefined);
  assert.equal(subjectFingerprint(record), subjectFingerprint({ ...record, state: "Verified" }));
  assert.notEqual(subjectFingerprint(record), subjectFingerprint({ ...record, risk: "R3" }));
});

test("objection, resolve, promote, revoke and decide all reject a vault where a record belongs", () => {
  const h = harness();
  const operations = [
    (vault) => decide(vault, { decision: "keep", ownerId: "Sako" }),
    (vault) => objection(vault, { ownerId: "Sako", reason: "x" }),
    (vault) => resolve(vault, { ownerId: "Sako", note: "x" }),
    (vault) => promote(vault, { count: 3, incidents: 0 }),
    (vault) => revoke(vault, { actor: "Sako", reason: "x" }),
  ];
  for (const operation of operations) {
    assert.throws(() => operation(h.vault), /takes a record; call vault\./);
  }
});

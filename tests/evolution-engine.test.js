import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_STALE_AFTER_DAYS,
  DEMOTION_TARGETS,
  EVOLUTION_SCHEMA,
  FROZEN_STATES,
  LIFECYCLE_STATES,
  OWNERS,
  STATES,
  TERMINAL_OUTCOMES,
  TRANSITIONS,
  TRANSITION_COUNT,
  VAULT_OVERLAY_STATES,
  canTransition,
  demoteStale,
  fingerprintOf,
  isStale,
  requiredEvidenceFor,
  stableRecordBinding,
  transition,
  validateProposal,
} from "../src/core/evolutionEngine.js";

const NOW = "2026-10-20T12:00:00.000Z";
const NOW_MS = Date.parse(NOW);

const EVIDENCE = [
  { url: "https://example.org/advisory/42", retrievedAt: "2026-10-19T00:00:00.000Z", kind: "primary" },
  { url: "https://example.org/discussion/42", retrievedAt: "2026-10-18T00:00:00.000Z", kind: "secondary" },
];

function proposal(overrides = {}) {
  return {
    schema: EVOLUTION_SCHEMA,
    id: "prop_1",
    title: "Adopt streaming tool output",
    state: "Candidate",
    dedupeKey: "hey:research/v1|https://example.org/advisory/42|2|-",
    createdAt: "2026-10-19T00:00:00.000Z",
    updatedAt: "2026-10-19T00:00:00.000Z",
    freshnessDate: "2026-10-19T00:00:00.000Z",
    evidence: EVIDENCE,
    scope: "account",
    flawHunterFindings: [
      { finding: "Streaming hides partial failures.", severity: "high" },
      { finding: "Backpressure is unspecified.", severity: "medium" },
    ],
    solutionTwinRecommendation: {
      recommendation: "Ship behind a flag with a non-streaming fallback.",
      alternative: "Queue the tool output and flush once.",
    },
    changePlan: {
      components: ["toolRegistry"],
      newApis: [],
      changedApis: ["executeTool"],
      schemaChanges: [],
      permissionChanges: [],
      migrations: [],
      rollbackSteps: ["turn the flag off"],
    },
    killCriteria: {
      metric: "tool error rate",
      baseline: 0.01,
      threshold: 0.02,
      windowDays: 14,
      owner: "Sako",
    },
    cost: { perUseCents: 0, worstCaseCents: 12 },
    implementer: { implementerId: "agent:capability-evolution" },
    verifier: { verifierId: "agent:verifier", method: "replay-recorded-fixtures" },
    shadowPlan: { plan: "Mirror 5% of tool calls", steps: ["enable mirror", "compare outputs"] },
    shadowEvidence: { runs: 40, passes: 39, failures: 1 },
    testEvidence: [
      { id: "test:tool-streaming", result: "pass", command: "node --test tests/tool-streaming.test.js" },
    ],
    releaseGate: { gateId: "gate_2026_10_20", approvedBy: "Amad", checks: ["tests", "build"] },
    history: [],
    ...overrides,
  };
}

function walk(start, steps) {
  let current = start;
  for (const [to, options] of steps) {
    const result = transition(current, to, { actor: "capability-evolution-agent", now: NOW, ...options });
    assert.equal(result.ok, true, `${current.state} → ${to} should be legal: ${result.reason}`);
    current = result.proposal;
  }
  return current;
}

const LADDER = [
  "Validated",
  "Reviewed",
  "Proposed",
  "Approved",
  "Shadow",
  "InImplementation",
  "Tested",
  "Verified",
  "Released",
];

const FULL_STEPS = LADDER.map((to) => (to === "Approved" ? [to, { actor: "Sako" }] : [to, {}]));

/* ------------------------------------------------------------------ table */

test("the lifecycle is exactly ten forward states plus six terminal outcomes plus two Vault overlays", () => {
  assert.equal(LIFECYCLE_STATES.length, 10);
  assert.equal(TERMINAL_OUTCOMES.length, 6);
  assert.equal(VAULT_OVERLAY_STATES.length, 2);
  assert.equal(STATES.length, 18);
  assert.deepEqual([...STATES], [...new Set(STATES)]);
  assert.ok(FROZEN_STATES.every((state) => STATES.includes(state)));
  assert.deepEqual([...OWNERS], ["Sako", "Amad"]);
});

test("every pair in the transition table is the table, and canTransition agrees with it", () => {
  let counted = 0;
  for (const from of STATES) {
    assert.ok(Array.isArray(TRANSITIONS[from]), `${from} must have a successor list`);
    for (const to of TRANSITIONS[from]) {
      assert.ok(STATES.includes(to), `${from} → ${to} targets a declared state`);
      assert.equal(canTransition(from, to), true);
      counted += 1;
    }
  }
  assert.equal(counted, TRANSITION_COUNT);
  assert.equal(TRANSITION_COUNT, 69);
});

test("canTransition answers false for unknown states instead of throwing", () => {
  assert.equal(canTransition("Candidate", "Released"), false);
  assert.equal(canTransition("Nirvana", "Candidate"), false);
  assert.equal(canTransition("Candidate", "Nirvana"), false);
  assert.equal(canTransition(undefined, undefined), false);
});

test("requiredEvidenceFor names the gate for every gated destination and nothing for ungated ones", () => {
  assert.deepEqual(requiredEvidenceFor("Validated"), ["primarySource", "freshnessDate", "dedupeKey"]);
  assert.deepEqual(requiredEvidenceFor("Reviewed"), ["flawHunterFindings", "solutionTwinRecommendation"]);
  assert.deepEqual(requiredEvidenceFor("Proposed"), ["changePlan", "killCriteria", "costEstimate"]);
  assert.deepEqual(requiredEvidenceFor("Approved"), ["ownerInOwners", "scope", "killCriteria"]);
  assert.deepEqual(requiredEvidenceFor("Held"), ["objectingOwner", "objectionReason"]);
  assert.deepEqual(requiredEvidenceFor("Verified"), ["independentVerifier"]);
  assert.deepEqual(requiredEvidenceFor("Released"), ["releaseGate"]);
  assert.deepEqual(requiredEvidenceFor("Rejected"), []);
  assert.deepEqual(requiredEvidenceFor("Revoked"), []);
});

/* ----------------------------------------------------------- legal path */

test("the full ten-state ladder is accepted end to end", () => {
  const released = walk(proposal(), FULL_STEPS);
  assert.equal(released.state, "Released");
  assert.equal(released.history.length, 9);
  assert.deepEqual(
    released.history.map((event) => event.to),
    LADDER,
  );
  assert.equal(released.approval.ownerId, "Sako");
  assert.equal(released.verifier.verifierId, "agent:verifier");
  assert.equal(typeof released.releasedAt, "string");
  assert.equal(released.history.every((event) => event.actor.length > 0), true);
});

test("terminal and parked states accept only their listed successors", () => {
  const deferred = transition(proposal({ state: "Deferred" }), "Candidate", {
    actor: "research-pipeline",
    now: NOW,
    reason: "budget returned",
  });
  assert.equal(deferred.ok, true);

  const superseded = transition(proposal({ state: "Superseded" }), "Archived", {
    actor: "sako",
    now: NOW,
  });
  assert.equal(superseded.ok, true);
  assert.equal(canTransition("Superseded", "Candidate"), false);
  assert.equal(canTransition("Archived", "Candidate"), false);
  assert.equal(canTransition("Revoked", "Approved"), false);
});

test("re-entering from a parked state re-runs every gate", () => {
  const revived = transition(proposal({ state: "Blocked" }), "Candidate", {
    actor: "research-pipeline",
    now: NOW,
  }).proposal;
  const withoutEvidence = transition({ ...revived, evidence: [] }, "Validated", {
    actor: "capability-evolution-agent",
    now: NOW,
  });
  assert.equal(withoutEvidence.ok, false);
  assert.match(withoutEvidence.reason, /primary source/);
});

/* ------------------------------------------------------- illegal pairs */

test("illegal transitions are refused with a reason, one test per mistake", () => {
  const refusals = [
    [proposal({ state: "Candidate" }), "Approved"],
    [proposal({ state: "Candidate" }), "Released"],
    [proposal({ state: "Candidate" }), "Shadow"],
    [proposal({ state: "Validated" }), "Proposed"],
    [proposal({ state: "Reviewed" }), "Shadow"],
    [proposal({ state: "Proposed" }), "InImplementation"],
    [proposal({ state: "Approved" }), "Tested"],
    [proposal({ state: "Released" }), "Candidate"],
    [proposal({ state: "Rejected" }), "Candidate"],
    [proposal({ state: "Archived" }), "Candidate"],
    [proposal({ state: "Revoked" }), "Released"],
  ];
  for (const [record, to] of refusals) {
    const result = transition(record, to, { actor: "Sako", now: NOW, reason: "trying" });
    assert.equal(result.ok, false, `${record.state} → ${to} must be refused`);
    assert.match(result.reason, /Illegal transition|is final/);
  }
});

test("an unknown destination state throws instead of silently succeeding", () => {
  assert.throws(
    () => transition(proposal(), "Shipped", { actor: "Sako", now: NOW }),
    /Unknown evolution state/,
  );
});

test("a proposal in an unknown state is refused, not coerced", () => {
  const result = transition(proposal({ state: "Vibes" }), "Validated", {
    actor: "Sako",
    now: NOW,
  });
  assert.equal(result.ok, false);
  assert.match(result.reason, /unknown state/);
});

/* ------------------------------------------------------- evidence gates */

test("each evidence gate refuses when its evidence is absent", () => {
  const cases = [
    ["Validated", { evidence: [] }, /primary source/],
    ["Validated", { freshnessDate: undefined, evidence: [], createdAt: null }, /freshness date/],
    ["Validated", { dedupeKey: "" }, /dedupe key/],
    ["Reviewed", { flawHunterFindings: [] }, /Flaw Hunter findings/],
    ["Reviewed", { solutionTwinRecommendation: null }, /Solution Twin recommendation/],
    ["Proposed", { changePlan: null }, /changePlan/],
    ["Proposed", { killCriteria: null }, /killCriteria/],
    ["Proposed", { cost: null }, /cost/],
    ["Approved", { killCriteria: null }, /kill criteria cannot be approved/],
    ["Shadow", { shadowPlan: null }, /shadow plan/],
    ["InImplementation", { shadowEvidence: null, ownerWaiver: null }, /shadow evidence/],
    ["Tested", { testEvidence: [] }, /test evidence list/],
    ["Verified", { verifier: null, verifierId: undefined }, /independent verifier/],
    ["Verified", { implementer: null, implementerId: undefined }, /implementer must be recorded/],
    ["Released", { releaseGate: null }, /release gate/],
  ];

  const fromState = {
    Validated: "Candidate",
    Reviewed: "Validated",
    Proposed: "Reviewed",
    Approved: "Proposed",
    Shadow: "Approved",
    InImplementation: "Shadow",
    Tested: "InImplementation",
    Verified: "Tested",
    Released: "Verified",
  };

  for (const [to, patch, needle] of cases) {
    const record = proposal({ state: fromState[to], ...patch });
    const result = transition(record, to, { actor: "Sako", now: NOW });
    assert.equal(result.ok, false, `${fromState[to]} → ${to} must be refused with ${needle}`);
    assert.match(result.reason, needle);
    assert.ok(Array.isArray(result.missing) && result.missing.length > 0);
  }
});

test("a failing test cannot reach Tested", () => {
  const record = proposal({
    state: "InImplementation",
    testEvidence: [
      { id: "test:a", result: "pass" },
      { id: "test:b", result: "fail" },
    ],
  });
  const result = transition(record, "Tested", { actor: "Sako", now: NOW });
  assert.equal(result.ok, false);
  assert.match(result.reason, /test:b.*failed/);
});

test("shadow can be skipped only with an explicit owner waiver that carries a reason", () => {
  const waiverless = proposal({
    state: "Shadow",
    shadowEvidence: null,
    ownerWaiver: { ownerId: "Sako", reason: "", at: NOW },
  });
  assert.equal(transition(waiverless, "InImplementation", { actor: "Sako", now: NOW }).ok, false);

  const selfWaiver = proposal({
    state: "Shadow",
    shadowEvidence: null,
    ownerWaiver: { ownerId: "Someone Else", reason: "in a hurry", at: NOW },
  });
  assert.equal(transition(selfWaiver, "InImplementation", { actor: "Someone Else", now: NOW }).ok, false);

  const waived = proposal({
    state: "Shadow",
    shadowEvidence: null,
    ownerWaiver: { ownerId: "Amad", reason: "the mirror is already running in staging", at: NOW },
  });
  const result = transition(waived, "InImplementation", { actor: "Amad", now: NOW });
  assert.equal(result.ok, true);
  assert.equal(result.proposal.ownerWaiver.ownerId, "Amad");
});

/* ---------------------------------------------------------- ownership */

test("approval by anyone other than Sako or Amad is refused", () => {
  for (const actor of ["Mallory", "sako", "SAKO", "", "system"]) {
    const result = transition(proposal({ state: "Proposed" }), "Approved", {
      actor,
      now: NOW,
      reason: "please",
    });
    assert.equal(result.ok, false, `${JSON.stringify(actor)} must not approve`);
  }
});

test("a verifier equal to the implementer is refused, in both directions", () => {
  const same = proposal({
    state: "Tested",
    implementer: { implementerId: "agent:capability-evolution" },
    verifier: { verifierId: "agent:capability-evolution", method: "self-review" },
  });
  const result = transition(same, "Verified", { actor: "Sako", now: NOW });
  assert.equal(result.ok, false);
  assert.match(result.reason, /different person from the implementer/);

  const other = proposal({
    state: "Tested",
    implementer: { implementerId: "agent:verifier" },
    verifier: { verifierId: "agent:capability-evolution" },
  });
  assert.equal(transition(other, "Verified", { actor: "Sako", now: NOW }).ok, true);
});

/* --------------------------------------------------------- reasons and actors */

test("Rejected, Blocked and RolledBack each demand a written reason", () => {
  for (const [from, to] of [
    ["Candidate", "Rejected"],
    ["Proposed", "Blocked"],
    ["Released", "RolledBack"],
    ["Verified", "RolledBack"],
  ]) {
    const refused = transition(proposal({ state: from }), to, { actor: "Sako", now: NOW });
    assert.equal(refused.ok, false, `${from} → ${to} without a reason must be refused`);
    assert.match(refused.reason, /requires a written reason/);

    const accepted = transition(proposal({ state: from }), to, {
      actor: "Sako",
      now: NOW,
      reason: "measured regression in the tool path",
    });
    assert.equal(accepted.ok, true, `${from} → ${to} with a reason must be accepted`);
  }
});

test("no transition happens without an actor", () => {
  const result = transition(proposal(), "Validated", { now: NOW });
  assert.equal(result.ok, false);
  assert.match(result.reason, /must name an actor/);
});

/* ------------------------------------------------------------- freezing */

test("a frozen proposal cannot be mutated, at the top level or nested", () => {
  const rejected = transition(proposal(), "Rejected", {
    actor: "Sako",
    now: NOW,
    reason: "duplicate of prop_0",
  }).proposal;
  assert.equal(Object.isFrozen(rejected), true);
  assert.equal(Object.isFrozen(rejected.evidence), true);
  assert.throws(() => {
    rejected.state = "Approved";
  }, TypeError);
  assert.throws(() => {
    rejected.evidence.push({ url: "https://evil.example", kind: "primary", retrievedAt: NOW });
  }, TypeError);

  const archived = transition(proposal({ state: "Released" }), "Archived", {
    actor: "Sako",
    now: NOW,
  }).proposal;
  assert.equal(Object.isFrozen(archived), true);
});

test("transition never mutates its input", () => {
  const before = proposal();
  const snapshot = JSON.stringify(before);
  const result = transition(before, "Validated", { actor: "agent", now: NOW });
  assert.equal(result.ok, true);
  assert.equal(JSON.stringify(before), snapshot);
  assert.notEqual(result.proposal, before);
});

/* ------------------------------------------------------------ staleness */

test("staleness is measured from the freshest traceable date", () => {
  const fresh = proposal({ state: "Proposed", freshnessDate: "2026-10-19T00:00:00.000Z" });
  assert.equal(isStale(fresh, NOW_MS, 30), false);

  const old = proposal({ state: "Proposed", freshnessDate: "2026-08-01T00:00:00.000Z" });
  assert.equal(isStale(old, NOW_MS, 30), true);
  assert.equal(isStale(old, NOW_MS, 120), false);

  const undated = proposal({ state: "Proposed", freshnessDate: null, evidence: [], createdAt: null });
  assert.equal(isStale(undated, NOW_MS, 30), true, "no date at all fails safe as stale");
});

test("a stale proposal is demoted one step with a recorded decay event", () => {
  const stale = proposal({ state: "Approved", freshnessDate: "2026-08-01T00:00:00.000Z" });
  stale.approval = { ownerId: "Sako", scope: "account", at: "2026-08-02T00:00:00.000Z", state: "approved" };

  const result = demoteStale(stale, NOW_MS, 30);
  assert.equal(result.ok, true);
  assert.equal(result.proposal.state, DEMOTION_TARGETS.Approved);
  assert.equal(result.proposal.state, "Proposed");
  assert.equal(result.proposal.approval, null, "a demoted approval must be re-earned");
  assert.equal(result.proposal.decayCount, 1);
  const decay = result.proposal.history.at(-1);
  assert.equal(decay.type, "decay");
  assert.equal(decay.from, "Approved");
  assert.equal(decay.to, "Proposed");
  assert.equal(decay.reason, "staleness");
});

test("a fresh proposal is not demoted, and a released one has no demotion path", () => {
  const fresh = demoteStale(proposal({ state: "Proposed" }), NOW_MS, DEFAULT_STALE_AFTER_DAYS);
  assert.equal(fresh.ok, false);
  assert.match(fresh.reason, /still fresh/);

  const released = proposal({
    state: "Released",
    freshnessDate: "2026-01-01T00:00:00.000Z",
  });
  assert.equal(isStale(released, NOW_MS, 30), false, "released proposals are not decayed");
  assert.equal(demoteStale(released, NOW_MS, 30).ok, false);

  const candidate = proposal({ state: "Candidate", freshnessDate: "2026-01-01T00:00:00.000Z" });
  assert.equal(demoteStale(candidate, NOW_MS, 30).ok, false);
});

/* -------------------------------------------------------------- history */

test("history is append-only across a full run", () => {
  let record = proposal();
  const seen = [];
  for (const [to, options] of FULL_STEPS) {
    const result = transition(record, to, {
      actor: "capability-evolution-agent",
      now: NOW,
      ...options,
    });
    assert.equal(result.ok, true, result.reason);
    record = result.proposal;
    assert.equal(record.history.length, seen.length + 1);
    assert.deepEqual(record.history.slice(0, seen.length), seen);
    seen.push(record.history.at(-1));
    assert.deepEqual(
      Object.keys(record.history.at(-1)).sort(),
      ["actor", "at", "from", "reason", "schema", "seq", "to", "type"],
    );
  }
});

/* ------------------------------------------------------ Vault overlays */

test("a held record may only be resolved back to the state it was held from", () => {
  const held = proposal({
    state: "Held",
    heldFrom: "Approved",
    hold: { by: "Amad", reason: "cost evidence looks wrong", at: NOW },
  });

  const forward = transition(held, "Shadow", { actor: "Sako", now: NOW });
  assert.equal(forward.ok, false);
  assert.match(forward.reason, /only be resolved back to Approved/);

  const resumed = transition(held, "Approved", { actor: "Sako", now: NOW });
  assert.equal(resumed.ok, true);
  assert.equal(resumed.proposal.state, "Approved");
});

test("revocation is reachable from every live state and is final", () => {
  for (const state of ["Candidate", "Validated", "Reviewed", "Proposed", "Approved", "Released", "Held"]) {
    assert.equal(canTransition(state, "Revoked"), true, `${state} must be revocable`);
  }
  const revoked = transition(proposal({ state: "Released" }), "Revoked", {
    actor: "Amad",
    now: NOW,
    reason: "incident #17: leaked tool output",
  }).proposal;
  assert.equal(revoked.state, "Revoked");
  assert.equal(Object.isFrozen(revoked), true);
  assert.equal(canTransition("Revoked", "Released"), false);
});

/* ---------------------------------------------------------- validation */

test("validateProposal reports structural breakage instead of guessing", () => {
  const good = proposal();
  assert.deepEqual(validateProposal(good), { ok: true, errors: [] });

  const broken = validateProposal({
    id: "",
    title: null,
    state: "Almost",
    dedupeKey: "",
    createdAt: "yesterday",
    evidence: [{ url: "" }],
    killCriteria: { metric: "", baseline: "high", threshold: 1, windowDays: 0, owner: "Nobody" },
    changePlan: { components: "toolRegistry" },
    history: {},
  });
  assert.equal(broken.ok, false);
  assert.ok(broken.errors.length >= 10, `expected many errors, got ${broken.errors.length}`);
  assert.ok(broken.errors.some((error) => /state must be one of/.test(error)));
  assert.ok(broken.errors.some((error) => /killCriteria.owner/.test(error)));
  assert.ok(broken.errors.some((error) => /rollbackSteps/.test(error)));
});

/* ----------------------------------------------------------- fingerprint */

test("a binding is stable across key order and a fingerprint changes when content changes", () => {
  const a = { id: "p1", cost: { perUseCents: 0, worstCaseCents: 12 }, tags: ["x", "y"] };
  const b = { tags: ["x", "y"], cost: { worstCaseCents: 12, perUseCents: 0 }, id: "p1" };
  assert.equal(stableRecordBinding(a), stableRecordBinding(b));
  assert.equal(fingerprintOf(a), fingerprintOf(b));
  assert.notEqual(
    fingerprintOf(a),
    fingerprintOf({ ...a, cost: { perUseCents: 0, worstCaseCents: 13 } }),
  );
  assert.throws(() => stableRecordBinding({ bad: undefined }), /plain JSON values/);
});

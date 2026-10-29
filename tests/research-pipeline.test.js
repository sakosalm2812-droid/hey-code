import assert from "node:assert/strict";
import test from "node:test";

import {
  RESEARCH_LANES,
  RESEARCH_OUTCOMES,
  STOP_CONDITIONS,
  canonicalArtifactUrl,
  dedupeKey,
  enqueue,
  planCycle,
  recordOutcome,
  shouldStop,
  summarizeCycle,
} from "../src/core/researchPipeline.js";

const NOW = "2026-10-20T12:00:00.000Z";

function candidate(overrides = {}) {
  return {
    id: "cand_1",
    title: "Read the release notes",
    artifactUrl: "https://example.org/releases/v2",
    version: "2.0.0",
    costCents: 10,
    ...overrides,
  };
}

/* -------------------------------------------------------------- dedupe */

test("a dedupe key is stable across URL case, fragment, trailing slash and query order", () => {
  const a = dedupeKey({
    artifactUrl: "https://Example.ORG/releases/v2/?b=2&a=1#section",
    version: "2.0.0",
    hash: "abc123",
  });
  const b = dedupeKey({
    artifactUrl: "https://example.org/releases/v2?a=1&b=2",
    version: "2.0.0",
    hash: "abc123",
  });
  assert.equal(a, b);
  assert.match(a, /^hey:research\/v1\|https:\/\/example\.org\/releases\/v2\?a=1&b=2\|2\.0\.0\|abc123$/);
});

test("different artifacts, versions or content produce different keys", () => {
  const base = dedupeKey({ artifactUrl: "https://example.org/x", version: "1", hash: "h1" });
  assert.notEqual(base, dedupeKey({ artifactUrl: "https://example.org/y", version: "1", hash: "h1" }));
  assert.notEqual(base, dedupeKey({ artifactUrl: "https://example.org/x", version: "2", hash: "h1" }));
  assert.notEqual(base, dedupeKey({ artifactUrl: "https://example.org/x", version: "1", hash: "h2" }));
  assert.equal(base, dedupeKey({ artifactUrl: "https://example.org/x", version: "1", hash: "h1" }));
});

test("an artifact with no URL and no content hash is refused rather than keyed on nothing", () => {
  assert.throws(() => dedupeKey({ version: "1" }), /cannot be deduplicated before spend/);
  assert.throws(() => dedupeKey({ artifactUrl: "not-a-url" }), /valid absolute URL/);
  assert.throws(() => dedupeKey({ artifactUrl: "ftp://example.org/x" }), /http or https/);
});

test("canonicalArtifactUrl keeps the path and drops the fragment", () => {
  assert.equal(
    canonicalArtifactUrl("https://Example.org:443/a/b/#frag"),
    "https://example.org/a/b",
  );
  assert.equal(canonicalArtifactUrl("https://example.org/"), "https://example.org/");
});

/* ------------------------------------------------------------- enqueue */

test("enqueue refuses a second identical key and never mutates the queue", () => {
  const queue = [];
  const first = enqueue(queue, candidate({ id: "a" }), "key-1");
  assert.equal(first.ok, true);
  assert.equal(first.position, 0);
  assert.equal(queue.length, 0, "the input queue must not be mutated");

  const second = enqueue(first.queue, candidate({ id: "b" }), "key-1");
  assert.equal(second.ok, false);
  assert.match(second.reason, /Duplicate dedupe key/);

  const third = enqueue(first.queue, candidate({ id: "c" }), "key-2");
  assert.equal(third.ok, true);
  assert.equal(third.queue.length, 2);
});

test("enqueue derives the key when none is supplied and refuses a record with no identity", () => {
  const derived = enqueue([], candidate({ id: "a" }), undefined);
  assert.equal(derived.ok, true);
  assert.match(derived.queue[0].dedupeKey, /^hey:research\/v1\|/);

  const anonymous = enqueue([], { id: "b", title: "no url" }, undefined);
  assert.equal(anonymous.ok, false);
  assert.match(anonymous.reason, /no identity/);

  assert.equal(enqueue([], { title: "no id" }).ok, false);
});

/* ------------------------------------------------------------ planning */

test("a duplicate key is deferred before any spend is planned", () => {
  const plan = planCycle({
    now: NOW,
    cadence: "daily",
    budgetCents: 1000,
    wipLimit: 5,
    knownKeys: ["hey:research/v1|https://example.org/releases/v2|2.0.0|abc123"],
    candidates: [candidate({ dedupeKey: "hey:research/v1|https://example.org/releases/v2|2.0.0|abc123" })],
  });
  assert.equal(plan.jobs.length, 0);
  assert.equal(plan.deferred.length, 1);
  assert.equal(plan.deferred[0].code, "duplicate");
  assert.equal(plan.deferred[0].costCents, 0);
  assert.equal(plan.plannedCostCents, 0);
});

test("the WIP limit is never exceeded, and running jobs consume slots", () => {
  const candidates = [1, 2, 3, 4].map((index) =>
    candidate({ id: `cand_${index}`, artifactUrl: `https://example.org/${index}` }),
  );

  const cold = planCycle({ now: NOW, cadence: "daily", budgetCents: 1000, wipLimit: 2, candidates });
  assert.equal(cold.jobs.length, 2);
  assert.equal(cold.deferred.length, 2);
  assert.ok(cold.deferred.every((entry) => entry.code === "wip-limit"));
  assert.equal(cold.wipUsed, 0);

  const warm = planCycle({
    now: NOW,
    cadence: "daily",
    budgetCents: 1000,
    wipLimit: 2,
    running: [{ id: "running_1", dedupeKey: "already-running", costCents: 5 }],
    candidates,
  });
  assert.equal(warm.jobs.length, 1);
  assert.equal(warm.wipUsed, 1);

  const saturated = planCycle({
    now: NOW,
    cadence: "daily",
    budgetCents: 1000,
    wipLimit: 1,
    running: [{ id: "running_1", dedupeKey: "already-running", costCents: 5 }],
    candidates,
  });
  assert.equal(saturated.jobs.length, 0);
  assert.ok(saturated.deferred.every((entry) => entry.code === "wip-limit"));
});

test("a job whose cost exceeds the remaining budget is never planned", () => {
  const plan = planCycle({
    now: NOW,
    cadence: "daily",
    budgetCents: 50,
    wipLimit: 5,
    candidates: [candidate({ id: "cheap", artifactUrl: "https://example.org/cheap", costCents: 10 }), candidate({ id: "dear", artifactUrl: "https://example.org/dear", costCents: 100 })],
  });
  assert.deepEqual(plan.jobs.map((job) => job.id), ["cheap"]);
  assert.equal(plan.deferred.length, 1);
  assert.equal(plan.deferred[0].code, "budget");
  assert.match(plan.deferred[0].reason, /exceeds the 40 cents remaining/);
  assert.equal(plan.plannedCostCents, 10);
  assert.equal(plan.remainingCents, 40);
});

test("money already spent by running jobs reduces the available budget", () => {
  const plan = planCycle({
    now: NOW,
    cadence: "daily",
    budgetCents: 100,
    wipLimit: 5,
    running: [{ id: "r1", dedupeKey: "k1", costCents: 90 }],
    candidates: [candidate({ id: "next", costCents: 20 })],
  });
  assert.equal(plan.jobs.length, 0);
  assert.equal(plan.deferred[0].code, "budget");
  assert.equal(plan.remainingCents, 10);
});

test("maintenance work goes to its own lane with a deadline, never into the proposal queue", () => {
  const plan = planCycle({
    now: NOW,
    cadence: "weekly",
    budgetCents: 1000,
    wipLimit: 1,
    candidates: [
      candidate({ id: "feature", artifactUrl: "https://example.org/feature" }),
      candidate({
        id: "advisory",
        lane: "maintenance",
        artifactUrl: "https://example.org/security/advisory-9",
        deadline: "2026-10-25T00:00:00.000Z",
        costCents: 5,
      }),
    ],
  });
  assert.deepEqual(plan.jobs.map((job) => job.id), ["feature"]);
  assert.equal(plan.maintenance.length, 1);
  assert.equal(plan.maintenance[0].id, "advisory");
  assert.equal(plan.maintenance[0].deadline, "2026-10-25T00:00:00.000Z");
  assert.equal(plan.maintenance[0].overdue, false);
  assert.equal(plan.jobs.some((job) => job.id === "advisory"), false);

  const withoutDeadline = planCycle({
    now: NOW,
    cadence: "weekly",
    budgetCents: 1000,
    wipLimit: 1,
    candidates: [candidate({ id: "advisory", lane: "maintenance" })],
  });
  assert.equal(withoutDeadline.maintenance.length, 0);
  assert.equal(withoutDeadline.deferred[0].code, "maintenance-deadline");
  assert.equal(withoutDeadline.jobs.length, 0);
});

test("an unknown cadence or an invalid limit refuses the whole cycle instead of guessing", () => {
  const badCadence = planCycle({ now: NOW, cadence: "whenever", budgetCents: 100, wipLimit: 1, candidates: [candidate()] });
  assert.equal(badCadence.ok, false);
  assert.match(badCadence.reason, /Unknown cadence/);
  assert.equal(badCadence.jobs.length, 0);
  assert.equal(badCadence.deferred.length, 1);

  const badWip = planCycle({ now: NOW, cadence: "daily", budgetCents: 100, wipLimit: -1, candidates: [candidate()] });
  assert.equal(badWip.ok, false);
  assert.match(badWip.reason, /wipLimit/);

  const badBudget = planCycle({ now: NOW, cadence: "daily", budgetCents: 1.5, wipLimit: 1, candidates: [candidate()] });
  assert.equal(badBudget.ok, false);
  assert.match(badBudget.reason, /budgetCents/);
});

test("planning is deterministic, respects priority, and never mutates its input", () => {
  const candidates = [
    candidate({ id: "low", artifactUrl: "https://example.org/low", priority: 1 }),
    candidate({ id: "high", artifactUrl: "https://example.org/high", priority: 9 }),
    candidate({ id: "mid", artifactUrl: "https://example.org/mid", priority: 5 }),
  ];
  const snapshot = JSON.stringify(candidates);
  const plan = planCycle({ now: NOW, cadence: "daily", budgetCents: 1000, wipLimit: 3, candidates });
  assert.deepEqual(plan.jobs.map((job) => job.id), ["high", "mid", "low"]);
  assert.equal(JSON.stringify(candidates), snapshot);

  const again = planCycle({ now: NOW, cadence: "daily", budgetCents: 1000, wipLimit: 3, candidates });
  assert.deepEqual(again.jobs.map((job) => job.id), plan.jobs.map((job) => job.id));
  assert.equal(plan.reason, again.reason);
  assert.ok(plan.reason.length > 0);
});

test("only the two declared lanes are accepted", () => {
  assert.deepEqual([...RESEARCH_LANES], ["proposal", "maintenance"]);
  const plan = planCycle({
    now: NOW,
    cadence: "daily",
    budgetCents: 100,
    wipLimit: 2,
    candidates: [candidate({ lane: "side-quest" })],
  });
  assert.equal(plan.jobs.length, 0);
  assert.equal(plan.deferred[0].code, "unknown-lane");
});

/* ----------------------------------------------------------- stopping */

test("all eight stopping rules stop and each carries a reason", () => {
  assert.equal(STOP_CONDITIONS.length, 8);
  const job = candidate();
  for (const entry of STOP_CONDITIONS) {
    const result = shouldStop(job, { [entry.flag]: true });
    assert.equal(result.stop, true, `${entry.flag} must stop`);
    assert.equal(result.condition, entry.flag);
    assert.equal(result.code, entry.code);
    assert.ok(result.reason.length > 40, `${entry.flag} needs a real reason`);
  }
  const quiet = shouldStop(job, {});
  assert.equal(quiet.stop, false);
  assert.match(quiet.reason, /No stopping condition/);
});

test("the first active rule in precedence order wins", () => {
  const both = shouldStop(candidate(), { evidenceSufficient: true, accessBlocked: true });
  assert.equal(both.condition, "accessBlocked");
  assert.equal(both.code, "access-blocked");
});

test("an unrecognised condition is treated as stop, never as permission to continue", () => {
  const result = shouldStop(candidate(), { looksFineToMe: true });
  assert.equal(result.stop, true);
  assert.equal(result.code, "unknown-condition");
  assert.match(result.reason, /never treated as "continue"/);
  assert.equal(shouldStop(candidate(), { looksFineToMe: false }).stop, false);
});

/* ------------------------------------------------------------ outcomes */

test("no-change is a first-class counted outcome, and a zero-proposal cycle is a success", () => {
  assert.deepEqual([...RESEARCH_OUTCOMES], ["no-change", "proposal", "blocked", "deferred"]);

  const planned = planCycle({
    now: NOW,
    cadence: "daily",
    budgetCents: 100,
    wipLimit: 2,
    candidates: [candidate({ id: "a", artifactUrl: "https://example.org/a" }), candidate({ id: "b", artifactUrl: "https://example.org/b" })],
  });
  assert.equal(planned.jobs.length, 2);

  const finished = planned.jobs.map((job) => {
    const result = recordOutcome(job, "no-change", { now: NOW, note: "the release notes contained nothing new" });
    assert.equal(result.ok, true, result.reason);
    return result.job;
  });

  const summary = summarizeCycle(finished);
  assert.equal(summary.total, 2);
  assert.equal(summary.noChange, 2);
  assert.equal(summary.proposals, 0);
  assert.equal(summary.pending, 0);
  assert.equal(summary.costCents, 20);
});

test("an unknown outcome is refused and a job cannot record two outcomes", () => {
  const job = candidate();
  assert.equal(recordOutcome(job, "maybe").ok, false);
  assert.equal(recordOutcome(job, "lgtm").ok, false);

  const once = recordOutcome(job, "proposal", { now: NOW });
  assert.equal(once.ok, true);
  assert.equal(once.job.outcome, "proposal");
  const twice = recordOutcome(once.job, "blocked", { now: NOW });
  assert.equal(twice.ok, false);
  assert.match(twice.reason, /already recorded/);
});

test("cycle arithmetic is exact, including deferred spend of zero", () => {
  const jobs = [
    recordOutcome({ id: "a", costCents: 10 }, "no-change", { now: NOW }).job,
    recordOutcome({ id: "b", costCents: 20 }, "no-change", { now: NOW }).job,
    recordOutcome({ id: "c", costCents: 30 }, "proposal", { now: NOW }).job,
    recordOutcome({ id: "d", costCents: 40 }, "blocked", { now: NOW }).job,
    recordOutcome({ id: "e", costCents: 50 }, "deferred", { now: NOW }).job,
    { id: "f", costCents: 60 },
  ];
  const summary = summarizeCycle(jobs);
  assert.deepEqual(summary, {
    total: 6,
    noChange: 2,
    proposals: 1,
    blocked: 1,
    deferred: 1,
    pending: 1,
    costCents: 100,
  });
  assert.equal(summarizeCycle([]).total, 0);
});

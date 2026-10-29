import assert from "node:assert/strict";
import test from "node:test";

import {
  AGENT_EVOLUTION_AGENT,
  CAPABILITY_EVOLUTION_AGENT,
  EVOLUTION_AGENTS,
  EVOLUTION_AGENT_SCHEMA,
  MODEL_EVOLUTION_AGENT,
  REQUIRED_AGENT_FIELDS,
  assertWithinScope,
  getEvolutionAgent,
  validateEvolutionAgent,
} from "../src/core/evolutionAgents.js";

test("there are exactly three evolution agents, each with a distinct id", () => {
  assert.equal(EVOLUTION_AGENTS.length, 3);
  const ids = EVOLUTION_AGENTS.map((agent) => agent.id);
  assert.equal(new Set(ids).size, 3);
  assert.deepEqual(ids, [
    "agent.model-evolution",
    "agent.capability-evolution",
    "agent.agent-evolution",
  ]);
  assert.equal(REQUIRED_AGENT_FIELDS.length, 11);
});

test("all three contracts validate and declare every required field", () => {
  for (const contract of EVOLUTION_AGENTS) {
    const result = validateEvolutionAgent(contract);
    assert.deepEqual(result, { ok: true, errors: [] }, `${contract.id}: ${result.errors?.join(" ")}`);
    for (const field of REQUIRED_AGENT_FIELDS) {
      assert.ok(field in contract, `${contract.id} is missing ${field}`);
    }
    assert.equal(contract.schema, EVOLUTION_AGENT_SCHEMA);
    assert.ok(contract.mayNotDo.length >= 3, `${contract.id} needs explicit prohibitions`);
    assert.ok(contract.approvalBoundary.includes("Sako") || contract.approvalBoundary.includes("owner"));
  }
});

test("a contract without mayNotDo is rejected", () => {
  const { mayNotDo, ...withoutProhibitions } = MODEL_EVOLUTION_AGENT;
  assert.ok(Array.isArray(mayNotDo));
  const result = validateEvolutionAgent(withoutProhibitions);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => /mayNotDo is required/.test(error)));

  const empty = validateEvolutionAgent({ ...MODEL_EVOLUTION_AGENT, mayNotDo: [] });
  assert.equal(empty.ok, false);
  assert.ok(empty.errors.some((error) => /mayNotDo must be a non-empty array/.test(error)));
});

test("a contract with an empty scope is rejected", () => {
  const result = validateEvolutionAgent({ ...MODEL_EVOLUTION_AGENT, scope: [] });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => /owns nothing owns everything/.test(error)));

  const duplicated = validateEvolutionAgent({
    ...MODEL_EVOLUTION_AGENT,
    scope: ["routing", "Routing"],
  });
  assert.equal(duplicated.ok, false);
  assert.ok(duplicated.errors.some((error) => /must not repeat/.test(error)));
});

test("a contract with an unknown cadence or budget is rejected", () => {
  const cadence = validateEvolutionAgent({ ...MODEL_EVOLUTION_AGENT, cadence: "hourly" });
  assert.equal(cadence.ok, false);
  assert.ok(cadence.errors.some((error) => /cadence must be one of/.test(error)));

  const budget = validateEvolutionAgent({ ...MODEL_EVOLUTION_AGENT, budgetCentsPerRun: -1 });
  assert.equal(budget.ok, false);

  const metric = validateEvolutionAgent({ ...MODEL_EVOLUTION_AGENT, evaluationMetric: "" });
  assert.equal(metric.ok, false);

  const boundary = validateEvolutionAgent({ ...MODEL_EVOLUTION_AGENT, approvalBoundary: "" });
  assert.equal(boundary.ok, false);

  const notAnObject = validateEvolutionAgent("model-evolution");
  assert.equal(notAnObject.ok, false);
});

test("an action outside the declared scope is refused", () => {
  const billing = assertWithinScope(MODEL_EVOLUTION_AGENT, {
    scope: "billing",
    description: "send an invoice",
  });
  assert.equal(billing.allowed, false);
  assert.equal(billing.rule, "scope");
  assert.match(billing.reason, /does not own the scope "billing"/);

  const undeclared = assertWithinScope(CAPABILITY_EVOLUTION_AGENT, "launch a pricing change");
  assert.equal(undeclared.allowed, false);
  assert.match(undeclared.reason, /no declared permission/);

  const owned = assertWithinScope(MODEL_EVOLUTION_AGENT, {
    scope: "routing",
    description: "propose a routing change with cost evidence",
  });
  assert.equal(owned.allowed, true);

  const byName = assertWithinScope(MODEL_EVOLUTION_AGENT, "model-selection");
  assert.equal(byName.allowed, true);
});

test("the Model Evolution agent can never claim HEY trained weights", () => {
  const claim = assertWithinScope(MODEL_EVOLUTION_AGENT, "claim HEY trained weights");
  assert.equal(claim.allowed, false);
  assert.match(claim.reason, /must never/);

  const sneaky = assertWithinScope(MODEL_EVOLUTION_AGENT, {
    scope: "routing",
    description: "claim HEY trained weights because routing changed",
  });
  assert.equal(sneaky.allowed, false);

  const honest = assertWithinScope(MODEL_EVOLUTION_AGENT, "select a model for a declared task class");
  assert.equal(honest.allowed, true);
});

test("the Capability Evolution agent can never modify production or self-approve", () => {
  for (const forbidden of [
    "self-approve",
    "modify production code directly",
    "grant itself a new permission",
    "promote a capability without three uses",
  ]) {
    const result = assertWithinScope(CAPABILITY_EVOLUTION_AGENT, forbidden);
    assert.equal(result.allowed, false, `${forbidden} must be refused`);
  }

  const allowed = assertWithinScope(CAPABILITY_EVOLUTION_AGENT, {
    scope: "features",
    description: "draft a capability proposal",
  });
  assert.equal(allowed.allowed, true);
});

test("the Agent Evolution agent can never widen its own authority", () => {
  for (const forbidden of [
    "grant itself new permissions",
    "edit the agent registry directly",
    "select a verifier identical to the implementer",
    "run an agent without a declared budget",
  ]) {
    const result = assertWithinScope(AGENT_EVOLUTION_AGENT, forbidden);
    assert.equal(result.allowed, false, `${forbidden} must be refused`);
  }

  const allowed = assertWithinScope(AGENT_EVOLUTION_AGENT, {
    scope: "orchestration",
    description: "propose an orchestration change",
  });
  assert.equal(allowed.allowed, true);
});

test("an unnamed action is refused, and an invalid contract authorises nothing", () => {
  assert.equal(assertWithinScope(MODEL_EVOLUTION_AGENT, "").allowed, false);
  assert.equal(assertWithinScope(MODEL_EVOLUTION_AGENT, null).allowed, false);
  assert.equal(assertWithinScope(MODEL_EVOLUTION_AGENT, { description: "" }).allowed, false);

  const broken = assertWithinScope({ ...MODEL_EVOLUTION_AGENT, mayNotDo: [] }, "model-selection");
  assert.equal(broken.allowed, false);
  assert.match(broken.reason, /contract is invalid and cannot authorise anything/);
});

test("the contracts are deeply frozen and immutable", () => {
  assert.equal(Object.isFrozen(EVOLUTION_AGENTS), true);
  assert.equal(Object.isFrozen(MODEL_EVOLUTION_AGENT), true);
  assert.equal(Object.isFrozen(MODEL_EVOLUTION_AGENT.scope), true);
  assert.equal(Object.isFrozen(MODEL_EVOLUTION_AGENT.mayNotDo), true);

  assert.throws(() => {
    MODEL_EVOLUTION_AGENT.cadence = "daily";
  }, TypeError);
  assert.throws(() => {
    MODEL_EVOLUTION_AGENT.mayNotDo.push("do anything it likes");
  }, TypeError);
  assert.throws(() => {
    EVOLUTION_AGENTS.pop();
  }, TypeError);

  assert.equal(MODEL_EVOLUTION_AGENT.cadence, "weekly");
  assert.equal(MODEL_EVOLUTION_AGENT.mayNotDo.length, 4);
});

test("agents are looked up by id and nothing else resolves", () => {
  assert.equal(getEvolutionAgent("agent.model-evolution"), MODEL_EVOLUTION_AGENT);
  assert.equal(getEvolutionAgent("agent.capability-evolution"), CAPABILITY_EVOLUTION_AGENT);
  assert.equal(getEvolutionAgent("agent.agent-evolution"), AGENT_EVOLUTION_AGENT);
  assert.equal(getEvolutionAgent("agent.everything"), null);
  assert.equal(getEvolutionAgent(undefined), null);
});

test("each agent declares a cadence and a budget, so nothing runs unbounded", () => {
  for (const contract of EVOLUTION_AGENTS) {
    assert.ok(
      ["on-demand", "daily", "weekly", "monthly", "quarterly"].includes(contract.cadence),
      `${contract.id} must declare a known cadence`,
    );
    assert.equal(Number.isInteger(contract.budgetCentsPerRun), true);
    assert.ok(contract.budgetCentsPerRun > 0);
  }
});

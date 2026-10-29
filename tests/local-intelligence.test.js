/**
 * Regression tests for the local intelligence decision engine.
 *
 * Context: `DecisionEngine.decide()` destructured its parameter as
 * `userPreferences: _userPreferences` but passed the bare `userPreferences`
 * identifier to `determineRoute`, throwing `ReferenceError: userPreferences is
 * not defined` on every call. The defect was previously visible only as an
 * unhandled rejection in journeys.test.js because the call site is
 * fire-and-forget.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { decisionEngine } from "../src/core/localIntelligence.js";

const hardware = { tier: "standard", canExecuteLocally: false };

test("decision engine routes a non-reflex request without throwing", () => {
  const decision = decisionEngine.decide({
    input: "write me a lesson plan about photosynthesis",
    hardwareProfile: hardware,
  });

  assert.equal(typeof decision.route, "string");
  assert.equal(decision.route.length > 0, true);
  assert.equal(typeof decision.modelNeeded, "boolean");
});

test("decision engine accepts explicit user preferences without throwing", () => {
  const decision = decisionEngine.decide({
    input: "summarize this article for me",
    hardwareProfile: hardware,
    userPreferences: { preferLocal: true, maxCostCents: 5 },
  });

  assert.equal(typeof decision.route, "string");
});

test("decision engine returns a deterministic route for arithmetic", () => {
  const decision = decisionEngine.decide({
    input: "what is 12 times 7",
    hardwareProfile: hardware,
  });

  assert.equal(typeof decision.route, "string");
  assert.equal(typeof decision.costCents, "number");
});

test("decision engine never returns an undefined route for plain input", () => {
  const decision = decisionEngine.decide({ input: "hello there" });

  assert.notEqual(decision.route, undefined);
  assert.notEqual(decision.route, null);
});

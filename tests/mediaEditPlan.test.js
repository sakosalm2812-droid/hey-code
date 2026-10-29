import test from "node:test";
import assert from "node:assert/strict";

import { makeLocalMediaPlan } from "../src/core/mediaAiPlanner.js";
import { validateMediaPlan } from "../src/core/mediaEditEngine.js";

test("Media Studio parses common exact editing instructions", () => {
  const plan = makeLocalMediaPlan(
    "Remove the first 3 seconds, crop it vertical 9:16, make it 1080p, 1.5x faster and compress it.",
    { kind: "video", duration: 60 },
  );
  assert.equal(plan.operations.some((item) => item.op === "trim" && item.start === 3), true);
  assert.equal(plan.operations.some((item) => item.op === "crop_aspect" && item.aspect === "9:16"), true);
  assert.equal(plan.operations.some((item) => item.op === "resize" && item.height === 1080), true);
  assert.equal(plan.operations.some((item) => item.op === "speed" && item.value === 1.5), true);
  assert.equal(plan.operations.some((item) => item.op === "compress"), true);
});

test("Media Studio distinguishes semantic requests from exact local transforms", () => {
  const plan = makeLocalMediaPlan(
    "Find the best moments, add captions, and remove the boring parts.",
    { kind: "video", duration: 90 },
  );
  assert.equal(plan.semanticRequests.includes("highlight extraction"), true);
  assert.equal(plan.semanticRequests.includes("speech transcription / captions"), true);
  assert.equal(plan.semanticRequests.includes("semantic cut selection"), true);
});

test("Media Studio rejects unapproved operations from AI plans", () => {
  const plan = validateMediaPlan({
    source: "ai",
    operations: [
      { op: "trim", start: 1, end: 5 },
      { op: "execute_shell", command: "anything" },
    ],
  });
  assert.deepEqual(plan.operations, [{ op: "trim", start: 1, end: 5 }]);
});

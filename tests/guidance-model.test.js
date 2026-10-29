/**
 * Tests for guidanceModel.js — step model, dismissal, positioning
 * @module tests/guidance-model.test.js
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  GUIDANCE_DISMISS_REASONS,
  GUIDANCE_POSITION_DEFAULTS,
  createDefaultPosition,
  createDefaultSteps,
  deriveNext,
  advance,
  undo,
  getCurrentStep,
  getProgress,
  createDismissal,
  isValidDismissalReason,
  updatePosition,
  snapToAnchor,
  createPositionRecord,
  validateStep,
} from "../src/components/guidance/guidanceModel.js";

describe("guidanceModel — step model, dismissal, positioning", () => {
  describe("Constants", () => {
    it("defines valid dismissal reasons", () => {
      assert.deepStrictEqual(GUIDANCE_DISMISS_REASONS, [
        "user_dismissed",
        "step_completed",
        "plan_ended",
        "permission_revoked",
        "app_hidden",
      ]);
    });

    it("defines position defaults", () => {
      assert.strictEqual(GUIDANCE_POSITION_DEFAULTS.anchor, "inline-end");
      assert.strictEqual(GUIDANCE_POSITION_DEFAULTS.width, 480);
      assert.strictEqual(GUIDANCE_POSITION_DEFAULTS.minWidth, 320);
      assert.strictEqual(GUIDANCE_POSITION_DEFAULTS.maxWidth, 640);
    });
  });

  describe("createDefaultPosition()", () => {
    it("returns defaults when no overrides", () => {
      const pos = createDefaultPosition();
      assert.strictEqual(pos.anchor, "inline-end");
      assert.strictEqual(pos.offsetX, 16);
      assert.strictEqual(pos.offsetY, 16);
      assert.strictEqual(pos.width, 480);
      assert.strictEqual(pos.isDragging, false);
    });

    it("applies overrides", () => {
      const pos = createDefaultPosition({ anchor: "center", width: 600 });
      assert.strictEqual(pos.anchor, "center");
      assert.strictEqual(pos.width, 600);
      assert.strictEqual(pos.offsetX, 16); // unchanged
    });
  });

  describe("createDefaultSteps()", () => {
    it("returns empty steps with inactive state", () => {
      const steps = createDefaultSteps();
      assert.deepStrictEqual(steps.steps, []);
      assert.strictEqual(steps.currentIndex, -1);
      assert.strictEqual(steps.isActive, false);
      assert.strictEqual(steps.autoAdvance, false);
    });
  });

  describe("deriveNext(plan, progress)", () => {
    it("returns null for empty plan", () => {
      const plan = { steps: [] };
      assert.strictEqual(deriveNext(plan, { currentStepIndex: -1 }), null);
    });

    it("returns null for undefined plan", () => {
      assert.strictEqual(deriveNext(null, {}), null);
      assert.strictEqual(deriveNext(undefined, {}), null);
    });

    it("returns first step when progress is -1", () => {
      const plan = {
        steps: [
          { id: "s1", title: "Step 1" },
          { id: "s2", title: "Step 2" },
        ],
      };
      const next = deriveNext(plan, { currentStepIndex: -1 });
      assert.ok(next);
      assert.strictEqual(next.id, "s1");
      assert.strictEqual(next.stepNumber, 1);
      assert.strictEqual(next.totalSteps, 2);
      assert.strictEqual(next.isFirst, true);
      assert.strictEqual(next.isLast, false);
    });

    it("returns second step when progress is 0", () => {
      const plan = {
        steps: [
          { id: "s1", title: "Step 1" },
          { id: "s2", title: "Step 2" },
        ],
      };
      const next = deriveNext(plan, { currentStepIndex: 0 });
      assert.ok(next);
      assert.strictEqual(next.id, "s2");
      assert.strictEqual(next.stepNumber, 2);
      assert.strictEqual(next.isFirst, false);
      assert.strictEqual(next.isLast, true);
    });

    it("returns null at end of plan", () => {
      const plan = {
        steps: [{ id: "s1", title: "Step 1" }],
      };
      const next = deriveNext(plan, { currentStepIndex: 0 });
      assert.strictEqual(next, null);
    });

    it("returns null past end of plan", () => {
      const plan = {
        steps: [{ id: "s1", title: "Step 1" }],
      };
      const next = deriveNext(plan, { currentStepIndex: 5 });
      assert.strictEqual(next, null);
    });
  });

  describe("advance(plan)", () => {
    it("returns completed plan for empty plan", () => {
      const plan = { steps: [], currentStepIndex: -1, status: "planned" };
      const advanced = advance(plan);
      assert.strictEqual(advanced.currentStepIndex, 0);
      assert.strictEqual(advanced.status, "completed");
    });

    it("advances from -1 to 0, marks first step running", () => {
      const plan = {
        steps: [
          { id: "s1", title: "Step 1", status: "pending" },
          { id: "s2", title: "Step 2", status: "pending" },
        ],
        currentStepIndex: -1,
        status: "planned",
      };
      const advanced = advance(plan);
      assert.strictEqual(advanced.currentStepIndex, 0);
      assert.strictEqual(advanced.status, "executing");
      assert.strictEqual(advanced.steps[0].status, "running");
      assert.ok(advanced.steps[0].startedAt);
      assert.strictEqual(advanced.steps[1].status, "pending");
    });

    it("advances from 0 to 1, marks first completed, second running", () => {
      const plan = {
        steps: [
          { id: "s1", title: "Step 1", status: "running" },
          { id: "s2", title: "Step 2", status: "pending" },
        ],
        currentStepIndex: 0,
        status: "executing",
      };
      const advanced = advance(plan);
      assert.strictEqual(advanced.currentStepIndex, 1);
      assert.strictEqual(advanced.steps[0].status, "completed");
      assert.ok(advanced.steps[0].completedAt);
      assert.strictEqual(advanced.steps[1].status, "running");
      assert.ok(advanced.steps[1].startedAt);
    });

    it("marks plan completed at end", () => {
      const plan = {
        steps: [
          { id: "s1", title: "Step 1", status: "running" },
        ],
        currentStepIndex: 0,
        status: "executing",
      };
      const advanced = advance(plan);
      assert.strictEqual(advanced.currentStepIndex, 0); // stays at last
      assert.strictEqual(advanced.status, "completed");
      assert.ok(advanced.completedAt);
      assert.strictEqual(advanced.steps[0].status, "completed");
    });

    it("does not mutate original plan", () => {
      const plan = {
        steps: [{ id: "s1", title: "Step 1", status: "pending" }],
        currentStepIndex: -1,
        status: "planned",
      };
      const originalSteps = JSON.parse(JSON.stringify(plan.steps));
      advance(plan);
      assert.deepStrictEqual(plan.steps, originalSteps);
      assert.strictEqual(plan.currentStepIndex, -1);
    });
  });

  describe("undo(plan)", () => {
    it("returns plan unchanged for empty plan", () => {
      const plan = { steps: [], currentStepIndex: 0 };
      const undone = undo(plan);
      assert.strictEqual(undone.currentStepIndex, 0);
    });

    it("moves back from 0 to planned state", () => {
      const plan = {
        steps: [
          { id: "s1", title: "Step 1", status: "running", startedAt: "2024-01-01T00:00:00Z" },
        ],
        currentStepIndex: 0,
        status: "executing",
      };
      const undone = undo(plan);
      assert.strictEqual(undone.currentStepIndex, 0);
      assert.strictEqual(undone.status, "planned");
      assert.strictEqual(undone.steps[0].status, "pending");
      assert.strictEqual(undone.steps[0].startedAt, null);
    });

    it("moves back from 1 to 0, restores previous step to running", () => {
      const plan = {
        steps: [
          { id: "s1", title: "Step 1", status: "completed", completedAt: "2024-01-01T00:00:00Z" },
          { id: "s2", title: "Step 2", status: "running", startedAt: "2024-01-01T00:01:00Z" },
        ],
        currentStepIndex: 1,
        status: "executing",
      };
      const undone = undo(plan);
      assert.strictEqual(undone.currentStepIndex, 0);
      assert.strictEqual(undone.steps[0].status, "running");
      assert.strictEqual(undone.steps[0].completedAt, null);
      assert.strictEqual(undone.steps[1].status, "pending");
      assert.strictEqual(undone.steps[1].startedAt, null);
    });

    it("does not mutate original plan", () => {
      const plan = {
        steps: [
          { id: "s1", title: "Step 1", status: "completed" },
          { id: "s2", title: "Step 2", status: "running" },
        ],
        currentStepIndex: 1,
      };
      const originalSteps = JSON.parse(JSON.stringify(plan.steps));
      undo(plan);
      assert.deepStrictEqual(plan.steps, originalSteps);
    });
  });

  describe("getCurrentStep(plan)", () => {
    it("returns null for empty plan", () => {
      assert.strictEqual(getCurrentStep({ steps: [] }), null);
    });

    it("returns null for invalid index", () => {
      const plan = { steps: [{ id: "s1" }], currentStepIndex: 5 };
      assert.strictEqual(getCurrentStep(plan), null);
    });

    it("returns current step with metadata", () => {
      const plan = {
        steps: [
          { id: "s1", title: "Step 1" },
          { id: "s2", title: "Step 2" },
        ],
        currentStepIndex: 1,
      };
      const current = getCurrentStep(plan);
      assert.ok(current);
      assert.strictEqual(current.id, "s2");
      assert.strictEqual(current.stepNumber, 2);
      assert.strictEqual(current.totalSteps, 2);
      assert.strictEqual(current.isFirst, false);
      assert.strictEqual(current.isLast, true);
    });
  });

  describe("getProgress(plan)", () => {
    it("returns zeros for empty plan", () => {
      const progress = getProgress({ steps: [] });
      assert.strictEqual(progress.completed, 0);
      assert.strictEqual(progress.total, 0);
      assert.strictEqual(progress.percent, 0);
      assert.strictEqual(progress.current, null);
    });

    it("calculates correct progress", () => {
      const plan = {
        steps: [
          { id: "s1", status: "completed" },
          { id: "s2", status: "running" },
          { id: "s3", status: "pending" },
        ],
        currentStepIndex: 1,
      };
      const progress = getProgress(plan);
      assert.strictEqual(progress.completed, 1);
      assert.strictEqual(progress.total, 3);
      assert.strictEqual(progress.percent, 33); // 1/3 rounded
      assert.ok(progress.current);
      assert.strictEqual(progress.current.id, "s2");
    });
  });

  describe("Dismissal", () => {
    it("creates dismissal record with timestamp", () => {
      const dismissal = createDismissal("user_dismissed", { stepId: "s1" });
      assert.strictEqual(dismissal.reason, "user_dismissed");
      assert.strictEqual(dismissal.stepId, "s1");
      assert.ok(dismissal.timestamp);
      assert.ok(new Date(dismissal.timestamp).getTime() > 0);
    });

    it("throws for invalid reason", () => {
      assert.throws(
        () => createDismissal("invalid_reason"),
        /Invalid dismissal reason/
      );
    });

    it("isValidDismissalReason returns true for valid reasons", () => {
      for (const reason of GUIDANCE_DISMISS_REASONS) {
        assert.strictEqual(isValidDismissalReason(reason), true);
      }
    });

    it("isValidDismissalReason returns false for invalid reasons", () => {
      assert.strictEqual(isValidDismissalReason("fake"), false);
      assert.strictEqual(isValidDismissalReason(""), false);
    });
  });

  describe("Positioning", () => {
    it("updatePosition only works for free anchor", () => {
      const pos = { anchor: "inline-end", offsetX: 16, offsetY: 16 };
      const updated = updatePosition(pos, { dx: 10, dy: 20 });
      assert.strictEqual(updated.offsetX, 16); // unchanged
      assert.strictEqual(updated.offsetY, 16);
    });

    it("updatePosition updates free anchor position", () => {
      const pos = { anchor: "free", offsetX: 100, offsetY: 100 };
      const updated = updatePosition(pos, { dx: 10, dy: -20 });
      assert.strictEqual(updated.offsetX, 110);
      assert.strictEqual(updated.offsetY, 80);
    });

    it("updatePosition clamps to non-negative", () => {
      const pos = { anchor: "free", offsetX: 5, offsetY: 5 };
      const updated = updatePosition(pos, { dx: -10, dy: -10 });
      assert.strictEqual(updated.offsetX, 0);
      assert.strictEqual(updated.offsetY, 0);
    });

    it("snapToAnchor sets anchor and clears drag state", () => {
      const pos = { anchor: "free", offsetX: 100, offsetY: 100, isDragging: true, dragStart: { x: 0, y: 0 } };
      const snapped = snapToAnchor(pos, "inline-end");
      assert.strictEqual(snapped.anchor, "inline-end");
      assert.strictEqual(snapped.isDragging, false);
      assert.strictEqual(snapped.dragStart, null);
    });

    it("snapToAnchor rejects invalid anchors", () => {
      const pos = { anchor: "inline-end" };
      const snapped = snapToAnchor(pos, "invalid");
      assert.strictEqual(snapped.anchor, "inline-end"); // unchanged
    });

    it("createPositionRecord creates storage-ready record", () => {
      const pos = { anchor: "inline-end", offsetX: 16, offsetY: 16, width: 480 };
      const record = createPositionRecord("my-app", pos);
      assert.strictEqual(record.appKey, "my-app");
      assert.strictEqual(record.position.anchor, "inline-end");
      assert.strictEqual(record.position.width, 480);
      assert.ok(record.updatedAt);
    });
  });

  describe("validateStep", () => {
    it("returns valid for complete step", () => {
      const step = { id: "s1", title: "Step 1", status: "pending" };
      const result = validateStep(step);
      assert.strictEqual(result.valid, true);
      assert.deepStrictEqual(result.errors, []);
    });

    it("rejects missing id", () => {
      const step = { title: "Step 1", status: "pending" };
      const result = validateStep(step);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.includes("Step missing id"));
    });

    it("rejects missing title", () => {
      const step = { id: "s1", status: "pending" };
      const result = validateStep(step);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.includes("Step missing title"));
    });

    it("rejects missing status", () => {
      const step = { id: "s1", title: "Step 1" };
      const result = validateStep(step);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.includes("Step missing status"));
    });

    it("rejects non-object", () => {
      const result = validateStep(null);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.includes("Step must be an object"));
    });
  });
});
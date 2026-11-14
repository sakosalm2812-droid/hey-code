/**
 * Tests for lessonPlanModel.js — advance/undo/next, empty plan, end-of-plan
 * @module tests/lesson-plan-model.test.js
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  LESSON_STEP_STATUSES,
  LESSON_PLAN_STATUSES,
  createLessonPlan,
  validateStep,
  validatePlan,
  deriveNext,
  getCurrentStep,
  advance,
  undo,
  getProgress,
  formatElapsed,
  createTimerState,
} from "../src/components/cockpit/lessonPlanModel.js";

describe("lessonPlanModel — advance/undo/next, empty plan, end-of-plan", () => {
  describe("Constants", () => {
    it("defines valid step statuses", () => {
      assert.deepStrictEqual(LESSON_STEP_STATUSES, ["pending", "current", "completed", "skipped"]);
    });

    it("defines valid plan statuses", () => {
      assert.deepStrictEqual(LESSON_PLAN_STATUSES, ["planned", "in-progress", "completed", "paused"]);
    });
  });

  describe("createLessonPlan()", () => {
    it("creates a plan with defaults", () => {
      const plan = createLessonPlan();
      assert.ok(plan.id.startsWith("lesson_"));
      assert.strictEqual(plan.title, "Untitled Lesson");
      assert.strictEqual(plan.steps.length, 0);
      assert.strictEqual(plan.currentStepIndex, -1);
      assert.strictEqual(plan.status, "planned");
      assert.ok(plan.createdAt);
      assert.ok(plan.updatedAt);
    });

    it("applies overrides", () => {
      const plan = createLessonPlan({
        title: "Photosynthesis",
        steps: [{ id: "s1", title: "Intro", status: "pending" }],
        duration: 45,
      });
      assert.strictEqual(plan.title, "Photosynthesis");
      assert.strictEqual(plan.steps.length, 1);
      assert.strictEqual(plan.duration, 45);
    });
  });

  describe("validateStep()", () => {
    it("passes for valid step", () => {
      const step = { id: "s1", title: "Step 1", status: "pending" };
      const result = validateStep(step);
      assert.strictEqual(result.valid, true);
      assert.deepStrictEqual(result.errors, []);
    });

    it("rejects missing id", () => {
      const result = validateStep({ title: "Step 1", status: "pending" });
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.includes("Step missing id"));
    });

    it("rejects missing title", () => {
      const result = validateStep({ id: "s1", status: "pending" });
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.includes("Step missing title"));
    });

    it("rejects invalid status", () => {
      const result = validateStep({ id: "s1", title: "Step 1", status: "invalid" });
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("status must be one of")));
    });

    it("rejects non-object", () => {
      const result = validateStep(null);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.includes("Step must be an object"));
    });
  });

  describe("validatePlan()", () => {
    it("passes for valid plan", () => {
      const plan = createLessonPlan({
        title: "Test",
        steps: [{ id: "s1", title: "Step 1", status: "pending" }],
      });
      const result = validatePlan(plan);
      assert.strictEqual(result.valid, true);
      assert.deepStrictEqual(result.errors, []);
    });

    it("rejects missing title", () => {
      const plan = { id: "p1", title: "", steps: [] };
      const result = validatePlan(plan);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.includes("Plan missing title"));
    });

    it("rejects non-array steps", () => {
      const plan = { id: "p1", title: "Test", steps: "not an array" };
      const result = validatePlan(plan);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.includes("Plan steps must be an array"));
    });

    it("validates nested steps", () => {
      const plan = createLessonPlan({
        steps: [{ id: "s1", status: "pending" }], // missing title
      });
      const result = validatePlan(plan);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("Step 0:")));
    });
  });

  describe("deriveNext(plan, progress)", () => {
    it("returns null for empty plan", () => {
      const plan = createLessonPlan({ steps: [] });
      assert.strictEqual(deriveNext(plan, {}), null);
    });

    it("returns null for null/undefined plan", () => {
      assert.strictEqual(deriveNext(null, {}), null);
      assert.strictEqual(deriveNext(undefined, {}), null);
    });

    it("returns first step when at -1", () => {
      const plan = createLessonPlan({
        steps: [
          { id: "s1", title: "Intro" },
          { id: "s2", title: "Main" },
        ],
      });
      const next = deriveNext(plan, { currentStepIndex: -1 });
      assert.ok(next);
      assert.strictEqual(next.id, "s1");
      assert.strictEqual(next.stepNumber, 1);
      assert.strictEqual(next.totalSteps, 2);
      assert.strictEqual(next.isFirst, true);
      assert.strictEqual(next.isLast, false);
      assert.strictEqual(next.planTitle, "Untitled Lesson");
    });

    it("returns second step when at 0", () => {
      const plan = createLessonPlan({
        steps: [
          { id: "s1", title: "Intro" },
          { id: "s2", title: "Main" },
        ],
      });
      const next = deriveNext(plan, { currentStepIndex: 0 });
      assert.ok(next);
      assert.strictEqual(next.id, "s2");
      assert.strictEqual(next.stepNumber, 2);
      assert.strictEqual(next.isFirst, false);
      assert.strictEqual(next.isLast, true);
    });

    it("returns null at end of plan", () => {
      const plan = createLessonPlan({
        steps: [{ id: "s1", title: "Only" }],
      });
      const next = deriveNext(plan, { currentStepIndex: 0 });
      assert.strictEqual(next, null);
    });

    it("returns null past end of plan", () => {
      const plan = createLessonPlan({
        steps: [{ id: "s1", title: "Only" }],
      });
      const next = deriveNext(plan, { currentStepIndex: 5 });
      assert.strictEqual(next, null);
    });

    it("uses plan.currentStepIndex when progress not provided", () => {
      const plan = createLessonPlan({
        steps: [{ id: "s1", title: "Intro" }, { id: "s2", title: "Main" }],
        currentStepIndex: 0,
      });
      const next = deriveNext(plan, {});
      assert.ok(next);
      assert.strictEqual(next.id, "s2");
    });
  });

  describe("getCurrentStep(plan)", () => {
    it("returns null for empty plan", () => {
      assert.strictEqual(getCurrentStep(createLessonPlan({ steps: [] })), null);
    });

    it("returns null for invalid index", () => {
      const plan = createLessonPlan({
        steps: [{ id: "s1" }],
        currentStepIndex: 5,
      });
      assert.strictEqual(getCurrentStep(plan), null);
    });

    it("returns current step with metadata", () => {
      const plan = createLessonPlan({
        steps: [{ id: "s1", title: "Intro" }, { id: "s2", title: "Main" }],
        currentStepIndex: 1,
      });
      const current = getCurrentStep(plan);
      assert.ok(current);
      assert.strictEqual(current.id, "s2");
      assert.strictEqual(current.stepNumber, 2);
      assert.strictEqual(current.totalSteps, 2);
      assert.strictEqual(current.isFirst, false);
      assert.strictEqual(current.isLast, true);
    });
  });

  describe("advance(plan)", () => {
    it("returns completed plan for empty plan", () => {
      const plan = createLessonPlan({ steps: [], currentStepIndex: -1 });
      const advanced = advance(plan);
      assert.strictEqual(advanced.currentStepIndex, 0);
      assert.strictEqual(advanced.status, "completed");
      assert.ok(advanced.completedAt);
    });

    it("advances from -1 to 0, marks first step current", () => {
      const plan = createLessonPlan({
        steps: [
          { id: "s1", title: "Intro", status: "pending" },
          { id: "s2", title: "Main", status: "pending" },
        ],
        currentStepIndex: -1,
        status: "planned",
      });
      const advanced = advance(plan);
      assert.strictEqual(advanced.currentStepIndex, 0);
      assert.strictEqual(advanced.status, "in-progress");
      assert.ok(advanced.startedAt);
      assert.strictEqual(advanced.steps[0].status, "current");
      assert.ok(advanced.steps[0].startedAt);
      assert.strictEqual(advanced.steps[1].status, "pending");
    });

    it("advances from 0 to 1, marks first completed, second current", () => {
      const plan = createLessonPlan({
        steps: [
          { id: "s1", title: "Intro", status: "current", startedAt: "2024-01-01T00:00:00Z" },
          { id: "s2", title: "Main", status: "pending" },
        ],
        currentStepIndex: 0,
        status: "in-progress",
        startedAt: "2024-01-01T00:00:00Z",
      });
      const advanced = advance(plan);
      assert.strictEqual(advanced.currentStepIndex, 1);
      assert.strictEqual(advanced.steps[0].status, "completed");
      assert.ok(advanced.steps[0].completedAt);
      assert.strictEqual(advanced.steps[1].status, "current");
      assert.ok(advanced.steps[1].startedAt);
    });

    it("marks plan completed at end", () => {
      const plan = createLessonPlan({
        steps: [{ id: "s1", title: "Only", status: "current" }],
        currentStepIndex: 0,
        status: "in-progress",
      });
      const advanced = advance(plan);
      assert.strictEqual(advanced.currentStepIndex, 0);
      assert.strictEqual(advanced.status, "completed");
      assert.ok(advanced.completedAt);
      assert.strictEqual(advanced.steps[0].status, "completed");
    });

    it("stays at end if already past end", () => {
      const plan = createLessonPlan({
        steps: [{ id: "s1", title: "Only", status: "completed" }],
        currentStepIndex: 0,
        status: "completed",
      });
      const advanced = advance(plan);
      assert.strictEqual(advanced.currentStepIndex, 0);
      assert.strictEqual(advanced.status, "completed");
    });

    it("does not mutate original plan", () => {
      const plan = createLessonPlan({
        steps: [{ id: "s1", title: "Intro", status: "pending" }],
        currentStepIndex: -1,
      });
      const originalSteps = JSON.parse(JSON.stringify(plan.steps));
      advance(plan);
      assert.deepStrictEqual(plan.steps, originalSteps);
      assert.strictEqual(plan.currentStepIndex, -1);
    });
  });

  describe("undo(plan)", () => {
    it("returns plan unchanged for empty plan", () => {
      const plan = createLessonPlan({ steps: [], currentStepIndex: 0 });
      const undone = undo(plan);
      assert.strictEqual(undone.currentStepIndex, 0);
    });

    it("moves back from 0 to planned state", () => {
      const plan = createLessonPlan({
        steps: [{ id: "s1", title: "Intro", status: "current", startedAt: "2024-01-01T00:00:00Z" }],
        currentStepIndex: 0,
        status: "in-progress",
      });
      const undone = undo(plan);
      assert.strictEqual(undone.currentStepIndex, 0);
      assert.strictEqual(undone.status, "planned");
      assert.strictEqual(undone.startedAt, null);
      assert.strictEqual(undone.steps[0].status, "pending");
      assert.strictEqual(undone.steps[0].startedAt, null);
    });

    it("moves back from 1 to 0, restores previous to current", () => {
      const plan = createLessonPlan({
        steps: [
          { id: "s1", title: "Intro", status: "completed", completedAt: "2024-01-01T00:00:00Z" },
          { id: "s2", title: "Main", status: "current", startedAt: "2024-01-01T00:01:00Z" },
        ],
        currentStepIndex: 1,
        status: "in-progress",
      });
      const undone = undo(plan);
      assert.strictEqual(undone.currentStepIndex, 0);
      assert.strictEqual(undone.steps[0].status, "current");
      assert.strictEqual(undone.steps[0].completedAt, null);
      assert.strictEqual(undone.steps[1].status, "pending");
      assert.strictEqual(undone.steps[1].startedAt, null);
    });

    it("does not mutate original plan", () => {
      const plan = createLessonPlan({
        steps: [
          { id: "s1", title: "Intro", status: "completed" },
          { id: "s2", title: "Main", status: "current" },
        ],
        currentStepIndex: 1,
      });
      const originalSteps = JSON.parse(JSON.stringify(plan.steps));
      undo(plan);
      assert.deepStrictEqual(plan.steps, originalSteps);
    });
  });

  describe("getProgress(plan)", () => {
    it("returns zeros for empty plan", () => {
      const progress = getProgress(createLessonPlan({ steps: [] }));
      assert.strictEqual(progress.completed, 0);
      assert.strictEqual(progress.total, 0);
      assert.strictEqual(progress.percent, 0);
      assert.strictEqual(progress.current, null);
      assert.strictEqual(progress.elapsed, 0);
    });

    it("calculates correct progress", () => {
      const plan = createLessonPlan({
        steps: [
          { id: "s1", status: "completed" },
          { id: "s2", status: "current" },
          { id: "s3", status: "pending" },
        ],
        currentStepIndex: 1,
        startedAt: new Date(Date.now() - 30 * 60000).toISOString(), // 30 min ago
      });
      const progress = getProgress(plan);
      assert.strictEqual(progress.completed, 1);
      assert.strictEqual(progress.total, 3);
      assert.strictEqual(progress.percent, 33); // 1/3 rounded
      assert.ok(progress.current);
      assert.strictEqual(progress.current.id, "s2");
      assert.ok(progress.elapsed >= 29 && progress.elapsed <= 31);
    });
  });

  describe("formatElapsed(minutes)", () => {
    it("formats minutes under 60", () => {
      assert.strictEqual(formatElapsed(0), "0 min");
      assert.strictEqual(formatElapsed(5), "5 min");
      assert.strictEqual(formatElapsed(45), "45 min");
      assert.strictEqual(formatElapsed(59), "59 min");
    });

    it("formats hours and minutes for 60+", () => {
      assert.strictEqual(formatElapsed(60), "1:00 h");
      assert.strictEqual(formatElapsed(75), "1:15 h");
      assert.strictEqual(formatElapsed(120), "2:00 h");
      assert.strictEqual(formatElapsed(90), "1:30 h");
    });
  });

  describe("createTimerState(plan, options)", () => {
    it("creates timer state with defaults", () => {
      const plan = createLessonPlan({ duration: 45, startedAt: new Date(Date.now() - 15 * 60000).toISOString() });
      const timer = createTimerState(plan);
      assert.strictEqual(timer.isRunning, false);
      assert.strictEqual(timer.targetMinutes, 45);
      assert.ok(timer.elapsedMinutes >= 14 && timer.elapsedMinutes <= 16);
      assert.ok(timer.remainingMinutes >= 29 && timer.remainingMinutes <= 31);
      assert.strictEqual(timer.progressPercent, 33); // 15/45
    });

    it("handles zero target minutes", () => {
      const plan = createLessonPlan({ duration: 0 });
      const timer = createTimerState(plan);
      assert.strictEqual(timer.targetMinutes, 0);
      assert.strictEqual(timer.remainingMinutes, 0);
      assert.strictEqual(timer.progressPercent, 0);
    });

    it("respects isRunning option", () => {
      const plan = createLessonPlan({ duration: 30 });
      const timer = createTimerState(plan, { isRunning: true });
      assert.strictEqual(timer.isRunning, true);
    });
  });

  describe("Empty plan edge cases", () => {
    it("deriveNext on empty plan returns null", () => {
      assert.strictEqual(deriveNext(createLessonPlan({ steps: [] }), {}), null);
    });

    it("advance on empty plan marks completed", () => {
      const advanced = advance(createLessonPlan({ steps: [] }));
      assert.strictEqual(advanced.status, "completed");
    });

    it("undo on empty plan returns same", () => {
      const plan = createLessonPlan({ steps: [] });
      assert.strictEqual(undo(plan), plan);
    });

    it("getProgress on empty plan returns zeros", () => {
      const progress = getProgress(createLessonPlan({ steps: [] }));
      assert.strictEqual(progress.total, 0);
      assert.strictEqual(progress.percent, 0);
    });
  });

  describe("End-of-plan edge cases", () => {
    it("deriveNext at last step returns null", () => {
      const plan = createLessonPlan({
        steps: [{ id: "s1", title: "Only" }],
        currentStepIndex: 0,
      });
      assert.strictEqual(deriveNext(plan, {}), null);
    });

    it("advance at last step marks completed", () => {
      const plan = createLessonPlan({
        steps: [{ id: "s1", title: "Only", status: "current" }],
        currentStepIndex: 0,
        status: "in-progress",
      });
      const advanced = advance(plan);
      assert.strictEqual(advanced.status, "completed");
      assert.strictEqual(advanced.steps[0].status, "completed");
    });

    it("undo from completed goes back to last step", () => {
      const plan = createLessonPlan({
        steps: [{ id: "s1", title: "Only", status: "completed" }],
        currentStepIndex: 0,
        status: "completed",
      });
      const undone = undo(plan);
      assert.strictEqual(undone.currentStepIndex, 0);
      assert.strictEqual(undone.steps[0].status, "current");
      assert.strictEqual(undone.status, "in-progress");
    });
  });
});
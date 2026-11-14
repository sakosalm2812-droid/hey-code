// src/engines/guidanceWorld/__tests__/GuidanceWorldEngine.test.ts
// Tests for Guidance World Engine

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GuidanceWorldEngine, createGuidanceWorldEngine } from '../GuidanceWorldEngine';
import type { GuidanceConfig, GuidanceSession, TutoringPath, MentorshipGoal, InstructionStep } from '../types';
import { logToCosmos } from '../../../core/cosmosMemory';

vi.mock('../../../core/cosmosMemory', () => ({
  logToCosmos: vi.fn().mockResolvedValue(undefined),
}));

describe('GuidanceWorldEngine', () => {
  let engine: GuidanceWorldEngine;

  const testConfig: Partial<GuidanceConfig> = {
    autoGenerateInstructions: true,
    mentorshipCheckInIntervalMs: 1000,
    defaultTutoringLevel: 'beginner',
    hcuBudgetPerHour: 10.0,
    enableFeedbackLoop: true,
  };

  beforeEach(async () => {
    engine = createGuidanceWorldEngine(testConfig);
    await engine.initialize();
  });

  afterEach(async () => {
    await engine.shutdown();
  });

  describe('Initialization', () => {
    it('initializes with default config', async () => {
      const defaultEngine = createGuidanceWorldEngine();
      await defaultEngine.initialize();
      const health = defaultEngine.getHealth();
      expect(health.isRunning).toBe(true);
      expect(health.hcuBudgetPerHour).toBe(1.0);
      await defaultEngine.shutdown();
    });

    it('initializes with custom config', () => {
      const health = engine.getHealth();
      expect(health.isRunning).toBe(true);
      expect(health.hcuBudgetPerHour).toBe(10.0);
    });

    it('creates default tutoring path on init', () => {
      const paths = engine.getAllTutoringPaths();
      expect(paths.length).toBeGreaterThan(0);
      const gettingStarted = paths.find(p => p.id === 'getting-started');
      expect(gettingStarted).toBeDefined();
      expect(gettingStarted?.subject).toBe('Getting Started with HEY');
      expect(gettingStarted?.modules.length).toBe(4);
    });
  });

  describe('Guidance Sessions', () => {
    it('creates a session', () => {
      const session = engine.createSession('instruction', 'Test Session', 'Description', { key: 'value' });
      expect(session.id).toMatch(/^session_/);
      expect(session.type).toBe('instruction');
      expect(session.title).toBe('Test Session');
      expect(session.status).toBe('pending');
      expect(session.progress).toBe(0);
    });

    it('starts a pending session', () => {
      const session = engine.createSession('tutoring', 'Tutoring', 'Learn something');
      const result = engine.startSession(session.id);
      expect(result).toBe(true);
      expect(engine.getSession(session.id)?.status).toBe('active');
    });

    it('completes an active session', () => {
      const session = engine.createSession('mentorship', 'Mentorship', 'Goal tracking');
      engine.startSession(session.id);
      const result = engine.completeSession(session.id, 95);
      expect(result).toBe(true);
      const completed = engine.getSession(session.id);
      expect(completed?.status).toBe('completed');
      expect(completed?.progress).toBe(100);
      expect(completed?.endTime).toBeDefined();
    });

    it('updates session progress', () => {
      const session = engine.createSession('instruction', 'Progress Test', 'Test');
      engine.startSession(session.id);
      engine.updateProgress(session.id, 50);
      expect(engine.getSession(session.id)?.progress).toBe(50);
    });

    it('clamps progress to 0-100', () => {
      const session = engine.createSession('instruction', 'Clamp Test', 'Test');
      engine.startSession(session.id);
      engine.updateProgress(session.id, 150);
      expect(engine.getSession(session.id)?.progress).toBe(100);
      engine.updateProgress(session.id, -10);
      expect(engine.getSession(session.id)?.progress).toBe(0);
    });

    it('gets sessions by type and status', () => {
      engine.createSession('instruction', 'Inst1', 'd');
      engine.createSession('tutoring', 'Tut1', 'd');
      engine.createSession('instruction', 'Inst2', 'd');

      const instructions = engine.getSessions('instruction');
      expect(instructions.length).toBe(2);
      expect(instructions.every(s => s.type === 'instruction')).toBe(true);

      const active = engine.getSessions(undefined, 'pending');
      expect(active.length).toBe(3);
    });
  });

  describe('Tutoring Paths', () => {
    it('creates tutoring path', () => {
      const path = engine.createTutoringPath('custom', 'Custom Subject', 'intermediate', [
        { title: 'Module 1', content: 'Content 1', tasks: ['task1'] },
        { title: 'Module 2', content: 'Content 2', tasks: ['task2'] },
      ]);

      expect(path.id).toBe('custom');
      expect(path.subject).toBe('Custom Subject');
      expect(path.level).toBe('intermediate');
      expect(path.modules.length).toBe(2);
      expect(path.modules[0].completed).toBe(false);
    });

    it('gets tutoring path', () => {
      const path = engine.getTutoringPath('getting-started');
      expect(path).toBeDefined();
      expect(path?.subject).toBe('Getting Started with HEY');
    });

    it('completes module and advances', () => {
      const path = engine.createTutoringPath('test-advance', 'Test', 'beginner', [
        { title: 'M1', content: 'C1', tasks: ['t1'] },
        { title: 'M2', content: 'C2', tasks: ['t2'] },
        { title: 'M3', content: 'C3', tasks: ['t3'] },
      ]);

      engine.completeModule('test-advance', path.modules[0].id, 85);
      expect(path.modules[0].completed).toBe(true);
      expect(path.modules[0].score).toBe(85);
      expect(path.currentModuleId).toBe(path.modules[1].id);
      expect(path.overallProgress).toBeGreaterThan(0);
    });

    it('completes all modules', () => {
      const path = engine.createTutoringPath('test-complete', 'Test', 'beginner', [
        { title: 'M1', content: 'C1', tasks: ['t1'] },
        { title: 'M2', content: 'C2', tasks: ['t2'] },
      ]);

      engine.completeModule('test-complete', path.modules[0].id);
      engine.completeModule('test-complete', path.modules[1].id);

      expect(path.modules.every(m => m.completed)).toBe(true);
      expect(path.overallProgress).toBe(100);
    });
  });

  describe('Mentorship Goals', () => {
    it('creates mentorship goal', () => {
      const goal = engine.createMentorshipGoal('Learn TypeScript', '2025-12-31', ['Basics', 'Advanced']);
      expect(goal.id).toMatch(/^goal_/);
      expect(goal.title).toBe('Learn TypeScript');
      expect(goal.status).toBe('active');
      expect(goal.milestones.length).toBe(2);
    });

    it('gets mentorship goal', () => {
      const goal = engine.createMentorshipGoal('Test Goal', '2025-12-31');
      const fetched = engine.getMentorshipGoal(goal.id);
      expect(fetched).toBeDefined();
      expect(fetched?.title).toBe('Test Goal');
    });

    it('updates goal milestone', () => {
      const goal = engine.createMentorshipGoal('Milestone Test', '2025-12-31', ['First', 'Second']);
      engine.updateGoalMilestone(goal.id, 0, true);
      expect(goal.milestones[0].completed).toBe(true);
      expect(goal.milestones[1].completed).toBe(false);
    });

    it('achieves goal when all milestones complete', () => {
      const goal = engine.createMentorshipGoal('Complete Goal', '2025-12-31', ['First', 'Second']);
      engine.updateGoalMilestone(goal.id, 0, true);
      engine.updateGoalMilestone(goal.id, 1, true);
      expect(goal.status).toBe('achieved');
    });

    it('adds feedback to goal', () => {
      const goal = engine.createMentorshipGoal('Feedback Goal', '2025-12-31');
      engine.addFeedback(goal.id, 'Good progress', 4);
      expect(goal.feedbackHistory.length).toBe(1);
      expect(goal.feedbackHistory[0].note).toBe('Good progress');
      expect(goal.feedbackHistory[0].rating).toBe(4);
    });

    it('clamps feedback rating to 1-5', () => {
      const goal = engine.createMentorshipGoal('Rating Test', '2025-12-31');
      engine.addFeedback(goal.id, 'Test', 10);
      expect(goal.feedbackHistory[0].rating).toBe(5);
      engine.addFeedback(goal.id, 'Test2', 0);
      expect(goal.feedbackHistory[1].rating).toBe(1);
    });
  });

  describe('Instruction Generation', () => {
    it('generates default instructions', () => {
      const steps = engine.generateInstructions('task1', 'unknown context');
      expect(steps.length).toBe(4);
      expect(steps[0].order).toBe(1);
      expect(steps[0].text).toContain('unknown context');
      expect(steps.every(s => !s.completed)).toBe(true);
    });

    it('generates agent spawn instructions', () => {
      const steps = engine.generateInstructions('task1', 'agent_spawn');
      expect(steps.length).toBe(4);
      expect(steps[0].text).toContain('role and capabilities');
      expect(steps[3].warning).toBeDefined();
    });

    it('generates cross device handoff instructions', () => {
      const steps = engine.generateInstructions('task1', 'cross_device_handoff');
      expect(steps.length).toBe(4);
      expect(steps[0].text).toContain('online');
      expect(steps[3].text).toContain('target device');
    });

    it('emits instruction_generated event', () => {
      let eventReceived = false;
      engine.onEvent('instruction_generated', () => { eventReceived = true; });
      engine.generateInstructions('task1', 'test');
      expect(eventReceived).toBe(true);
    });
  });

  describe('Health & Config', () => {
    it('reports health metrics', () => {
      const health = engine.getHealth();
      expect(health.isRunning).toBe(true);
      expect(health.activeSessions).toBeGreaterThanOrEqual(0);
      expect(health.completedSessions).toBeGreaterThanOrEqual(0);
      expect(health.totalHCUSpent).toBeGreaterThanOrEqual(0);
    });

    it('calculates average progress', () => {
      const session = engine.createSession('instruction', 'Test', 'Desc');
      engine.startSession(session.id);
      engine.updateProgress(session.id, 50);

      const health = engine.getHealth();
      expect(health.averageProgress).toBeGreaterThan(0);
    });

    it('updates config', () => {
      engine.updateConfig({ hcuBudgetPerHour: 5.0, defaultTutoringLevel: 'advanced' });
      const config = engine.getConfig();
      expect(config.hcuBudgetPerHour).toBe(5.0);
      expect(config.defaultTutoringLevel).toBe('advanced');
    });
  });

  describe('Event System', () => {
    it('emits session_started event', () => {
      let eventReceived = false;
      engine.onEvent('session_started', () => { eventReceived = true; });
      engine.createSession('instruction', 'Test', 'Desc');
      expect(eventReceived).toBe(true);
    });

    it('emits session_completed event', () => {
      let eventReceived = false;
      engine.onEvent('session_completed', () => { eventReceived = true; });
      const session = engine.createSession('tutoring', 'Test', 'Desc');
      engine.startSession(session.id);
      engine.completeSession(session.id);
      expect(eventReceived).toBe(true);
    });

    it('emits progress_updated event', () => {
      let eventReceived = false;
      engine.onEvent('progress_updated', () => { eventReceived = true; });
      const session = engine.createSession('instruction', 'Test', 'Desc');
      engine.startSession(session.id);
      engine.updateProgress(session.id, 25);
      expect(eventReceived).toBe(true);
    });

    it('emits goal_achieved event', () => {
      let eventReceived = false;
      engine.onEvent('goal_achieved', () => { eventReceived = true; });
      const goal = engine.createMentorshipGoal('Event Goal', '2025-12-31', ['Only']);
      engine.updateGoalMilestone(goal.id, 0, true);
      expect(eventReceived).toBe(true);
    });

    it('emits feedback_received event', () => {
      let eventReceived = false;
      engine.onEvent('feedback_received', () => { eventReceived = true; });
      const goal = engine.createMentorshipGoal('Feedback Event', '2025-12-31');
      engine.addFeedback(goal.id, 'Note', 5);
      expect(eventReceived).toBe(true);
    });
  });
});
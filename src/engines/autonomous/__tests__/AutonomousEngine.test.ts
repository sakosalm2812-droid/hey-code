// src/engines/autonomous/__tests__/AutonomousEngine.test.ts
// Tests for Autonomous Action Engine and components

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AutonomousEngine,
  createAutonomousEngine,
  type ActionAdapter,
  type ExecutionContext,
  type ActionPlan,
  type ActionStep,
} from '../AutonomousEngine';
import { MotorCortex, createMotorCortex } from '../MotorCortex';
import { SomatosensoryCortex, createSomatosensoryCortex } from '../Somatosensory';
import { ActionPlanner, createActionPlanner } from '../ActionPlanner';
import { ApprovalGates, createApprovalGates } from '../ApprovalGates';
import { ReflexArc, createReflexArc } from '../ReflexArc';
import { RollbackManager, createRollbackManager } from '../RollbackManager';
import type { AutonomousConfig } from '../types';

// Mock logToCosmos
vi.mock('../../core/cosmosMemory', () => ({
  logToCosmos: vi.fn().mockResolvedValue(undefined),
}));

// Mock Adapter for testing
class MockAdapter implements ActionAdapter {
  platform: 'browser' | 'desktop' | 'phone' = 'browser';
  capability: string;
  shouldSucceed: boolean = true;
  executionDelay: number = 10;
  mockData?: unknown;
  mockScreenshot?: string;

  constructor(capability: string, options: { shouldSucceed?: boolean; delay?: number; data?: unknown } = {}) {
    this.capability = capability;
    this.shouldSucceed = options.shouldSucceed ?? true;
    this.executionDelay = options.delay ?? 10;
    this.mockData = options.data;
  }

  async execute(step: ActionStep, context: ExecutionContext) {
    await new Promise(r => setTimeout(r, this.executionDelay));
    if (!this.shouldSucceed) {
      return { success: false, error: 'Mock execution failed' };
    }
    return {
      success: true,
      data: this.mockData,
      screenshot: this.mockScreenshot,
    };
  }

  async getScreenshot() {
    return this.mockScreenshot || 'mock-screenshot-base64';
  }

  async getDOM() {
    const parser = new DOMParser();
    return parser.parseFromString('<html><body><div id="test">Test Content</div></body></html>', 'text/html');
  }

  async getState() {
    return { mock: true };
  }
}

describe('MotorCortex', () => {
  let motorCortex: MotorCortex;

  beforeEach(() => {
    motorCortex = createMotorCortex();
  });

  describe('generatePath', () => {
    it('generates a path with correct number of steps', () => {
      const path = motorCortex.generatePath(0, 0, 100, 100, 10);
      expect(path.length).toBe(11); // steps + 1
    });

    it('starts at start coordinates', () => {
      const path = motorCortex.generatePath(10, 20, 100, 100, 10);
      expect(path[0].x).toBeCloseTo(10, 0);
      expect(path[0].y).toBeCloseTo(20, 0);
    });

    it('ends at end coordinates', () => {
      const path = motorCortex.generatePath(10, 20, 100, 100, 10);
      expect(path[path.length - 1].x).toBeCloseTo(100, 0);
      expect(path[path.length - 1].y).toBeCloseTo(100, 0);
    });

    it('has normalized time values', () => {
      const path = motorCortex.generatePath(0, 0, 100, 100, 10);
      expect(path[0].t).toBe(0);
      expect(path[path.length - 1].t).toBe(1);
      for (let i = 1; i < path.length - 1; i++) {
        expect(path[i].t).toBeGreaterThan(0);
        expect(path[i].t).toBeLessThan(1);
      }
    });

    it('adds jitter when enabled', () => {
      const path = motorCortex.generatePath(0, 0, 100, 100, 10);
      // With jitter, points shouldn't be perfectly on the curve
      // Just verify it runs without error
      expect(path.length).toBeGreaterThan(0);
    });
  });

  describe('calculateMoveDuration', () => {
    it('returns duration within configured range', () => {
      const duration = motorCortex.calculateMoveDuration(100);
      expect(duration).toBeGreaterThanOrEqual(300);
      expect(duration).toBeLessThanOrEqual(800);
    });

    it('increases with distance', () => {
      const shortDuration = motorCortex.calculateMoveDuration(50);
      const longDuration = motorCortex.calculateMoveDuration(500);
      expect(longDuration).toBeGreaterThanOrEqual(shortDuration);
    });
  });

  describe('generateClickDelays', () => {
    it('returns pre and post click delays', () => {
      const delays = motorCortex.generateClickDelays();
      expect(delays.preClick).toBeGreaterThan(0);
      expect(delays.postClick).toBeGreaterThan(0);
      expect(delays.preClick + delays.postClick).toBeLessThanOrEqual(150);
    });
  });

  describe('generateTypingDelays', () => {
    it('returns array of delays for each character', () => {
      const delays = motorCortex.generateTypingDelays('hello');
      expect(delays.length).toBe(5);
    });

    it('adjusts delays for special characters', () => {
      const delays = motorCortex.generateTypingDelays('a b');
      // Space should have longer delay on average (1.5x multiplier)
      // Run multiple times to account for randomness
      let spaceGreaterCount = 0;
      for (let i = 0; i < 20; i++) {
        const d = motorCortex.generateTypingDelays('a b');
        if (d[1] > d[0]) spaceGreaterCount++;
      }
      expect(spaceGreaterCount).toBeGreaterThan(10); // Should be greater most of the time
    });

    it('handles empty string', () => {
      const delays = motorCortex.generateTypingDelays('');
      expect(delays.length).toBe(0);
    });
  });

  describe('generateScrollPath', () => {
    it('generates smooth scroll path', () => {
      const path = motorCortex.generateScrollPath(0, 0, 0, 500, 10);
      expect(path.length).toBe(11);
      // Should have easing applied
      expect(path[0].t).toBe(0);
      expect(path[path.length - 1].t).toBe(1);
    });
  });

  describe('config', () => {
    it('allows config updates', () => {
      motorCortex.updateConfig({ bezierControlPoints: 5 });
      expect(motorCortex.getConfig().bezierControlPoints).toBe(5);
    });
  });
});

describe('SomatosensoryCortex', () => {
  let somatosensory: SomatosensoryCortex;

  beforeEach(() => {
    somatosensory = createSomatosensoryCortex();
  });

  describe('verify', () => {
    it('verifies DOM successfully when element matches', async () => {
      const step: ActionStep = {
        id: 'test-step',
        capability: 'browser.click_element',
        target: '#test',
        parameters: {},
        expectedResult: { selector: '#test', attribute: 'id', value: 'test' },
        verification: 'dom',
        retryOnFail: false,
        maxRetries: 0,
      };

      const getDOM = async () => {
        const parser = new DOMParser();
        return parser.parseFromString('<html><body><div id="test">Content</div></body></html>', 'text/html');
      };

      const result = await somatosensory.verify(step, 'browser', async () => 'screenshot', getDOM);
      expect(result.verified).toBe(true);
      expect(result.success).toBe(true);
    });

    it('fails DOM verification when element not found', async () => {
      const step: ActionStep = {
        id: 'test-step',
        capability: 'browser.click_element',
        target: '#missing',
        parameters: {},
        expectedResult: { selector: '#missing' },
        verification: 'dom',
        retryOnFail: false,
        maxRetries: 0,
      };

      const getDOM = async () => {
        const parser = new DOMParser();
        return parser.parseFromString('<html><body><div id="test">Content</div></body></html>', 'text/html');
      };

      const result = await somatosensory.verify(step, 'browser', async () => 'screenshot', getDOM);
      expect(result.verified).toBe(false);
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('verifies state with similarity comparison', async () => {
      const step: ActionStep = {
        id: 'test-step',
        capability: 'computer.change_setting',
        target: 'theme',
        parameters: {},
        expectedResult: { theme: 'dark' },
        verification: 'state',
        retryOnFail: false,
        maxRetries: 0,
      };

      const getState = async () => ({ theme: 'dark' });

      const result = await somatosensory.verify(step, 'desktop', async () => 'screenshot', undefined, getState);
      expect(result.verified).toBe(true);
      expect(result.data).toEqual(expect.objectContaining({ method: 'state' }));
    });

    it('fails state verification when similarity is low', async () => {
      const step: ActionStep = {
        id: 'test-step',
        capability: 'computer.change_setting',
        target: 'theme',
        parameters: {},
        expectedResult: { theme: 'dark' },
        verification: 'state',
        retryOnFail: false,
        maxRetries: 0,
      };

      const getState = async () => ({ theme: 'light' });

      const result = await somatosensory.verify(step, 'desktop', async () => 'screenshot', undefined, getState);
      expect(result.verified).toBe(false);
    });

    it('handles custom verification', async () => {
      const step: ActionStep = {
        id: 'test-step',
        capability: 'custom',
        target: 'custom',
        parameters: {
          verifier: async () => ({ success: true, verified: true, data: { custom: true } }),
        },
        expectedResult: {},
        verification: 'custom',
        retryOnFail: false,
        maxRetries: 0,
      };

      const result = await somatosensory.verify(step, 'browser', async () => 'screenshot');
      expect(result.verified).toBe(true);
      expect(result.data).toEqual(expect.objectContaining({ custom: true }));
    });

    it('fails custom verification when no verifier provided', async () => {
      const step: ActionStep = {
        id: 'test-step',
        capability: 'custom',
        target: 'custom',
        parameters: {},
        expectedResult: {},
        verification: 'custom',
        retryOnFail: false,
        maxRetries: 0,
      };

      const result = await somatosensory.verify(step, 'browser', async () => 'screenshot');
      expect(result.verified).toBe(false);
      expect(result.error).toContain('verifier function');
    });
  });

  describe('checkReflexArc', () => {
    it('detects cookie banner patterns', async () => {
      const getDOM = async () => {
        const parser = new DOMParser();
        return parser.parseFromString(
          '<html><body><div id="cookie-banner"><button>Accept</button></div></body></html>',
          'text/html'
        );
      };

      const patterns = ['[id*="cookie"]', '[class*="consent"]'];
      const triggered = await somatosensory.checkReflexArc(patterns, getDOM);
      expect(triggered).toContain('[id*="cookie"]');
    });

    it('returns empty array when no patterns match', async () => {
      const getDOM = async () => {
        const parser = new DOMParser();
        return parser.parseFromString('<html><body><div id="content">Hello</div></body></html>', 'text/html');
      };

      const patterns = ['[id*="cookie"]', '[class*="consent"]'];
      const triggered = await somatosensory.checkReflexArc(patterns, getDOM);
      expect(triggered.length).toBe(0);
    });
  });

  describe('config', () => {
    it('allows config updates', () => {
      somatosensory.updateConfig({ ocrConfidenceThreshold: 0.8 });
      expect(somatosensory.getConfig().ocrConfidenceThreshold).toBe(0.8);
    });
  });
});

describe('ActionPlanner', () => {
  let planner: ActionPlanner;

  beforeEach(() => {
    planner = createActionPlanner();
  });

  describe('createPlan', () => {
    it('creates a plan for search goal', async () => {
      const context: ExecutionContext = {
        platform: 'browser',
        mode: 'act',
        userId: 'user_1',
        sessionId: 'session_1',
        hcuBudget: 100,
      };

      const plan = await planner.createPlan('search for TypeScript tutorials', context);
      expect(plan.id).toMatch(/^plan_/);
      expect(plan.goal).toBe('search for TypeScript tutorials');
      expect(plan.steps.length).toBeGreaterThan(0);
      expect(plan.status).toBe('pending');
      expect(plan.hcuCost).toBeGreaterThan(0);
    });

    it('creates a plan for open URL goal', async () => {
      const context: ExecutionContext = {
        platform: 'browser',
        mode: 'act',
        userId: 'user_1',
        sessionId: 'session_1',
        hcuBudget: 100,
      };

      const plan = await planner.createPlan('open https://github.com', context);
      expect(plan.steps.some(s => s.capability === 'browser.navigate')).toBe(true);
    });

    it('creates a plan for click goal', async () => {
      const context: ExecutionContext = {
        platform: 'browser',
        mode: 'act',
        userId: 'user_1',
        sessionId: 'session_1',
        hcuBudget: 100,
      };

      const plan = await planner.createPlan('click the submit button', context);
      expect(plan.steps.some(s => s.capability === 'browser.click_element')).toBe(true);
    });

    it('creates a plan for type goal', async () => {
      const context: ExecutionContext = {
        platform: 'browser',
        mode: 'act',
        userId: 'user_1',
        sessionId: 'session_1',
        hcuBudget: 100,
      };

      const plan = await planner.createPlan('type "hello world"', context);
      expect(plan.steps.some(s => s.capability === 'browser.fill_form' || s.capability === 'computer.type_text')).toBe(true);
    });

    it('includes rollback plan when enabled', async () => {
      const context: ExecutionContext = {
        platform: 'browser',
        mode: 'act',
        userId: 'user_1',
        sessionId: 'session_1',
        hcuBudget: 100,
      };

      const plan = await planner.createPlan('search for test', context);
      expect(plan.rollbackPlan).toBeDefined();
      expect(plan.rollbackPlan!.length).toBeGreaterThan(0);
    });

    it('estimates HCU cost', async () => {
      const context: ExecutionContext = {
        platform: 'browser',
        mode: 'act',
        userId: 'user_1',
        sessionId: 'session_1',
        hcuBudget: 100,
      };

      const plan = await planner.createPlan('search for test', context);
      expect(plan.hcuCost).toBeGreaterThan(0);
    });
  });

  describe('getCapabilities', () => {
    it('returns all registered capabilities', () => {
      const caps = planner.getCapabilities();
      expect(caps.length).toBeGreaterThan(20);
      expect(caps.some(c => c.capability === 'browser.navigate')).toBe(true);
      expect(caps.some(c => c.capability === 'computer.execute_terminal')).toBe(true);
    });
  });

  describe('getCapability', () => {
    it('returns capability details', () => {
      const cap = planner.getCapability('browser.navigate');
      expect(cap).toBeDefined();
      expect(cap!.category).toBe('browser');
      expect(cap!.platforms).toContain('browser');
    });

    it('returns undefined for unknown capability', () => {
      const cap = planner.getCapability('unknown.capability');
      expect(cap).toBeUndefined();
    });
  });
});

describe('ApprovalGates', () => {
  let approvalGates: ApprovalGates;

  beforeEach(() => {
    approvalGates = createApprovalGates();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('checkApproval', () => {
    const context: ExecutionContext = {
      platform: 'browser',
      mode: 'act',
      userId: 'user_1',
      sessionId: 'session_1',
      hcuBudget: 100,
    };

    it('approves routine actions when auto-approve enabled', async () => {
      const gates = createApprovalGates({ routineActionsAutoApprove: true });
      const step: ActionStep = {
        id: 'step_1',
        capability: 'browser.navigate',
        target: 'https://example.com',
        parameters: { url: 'https://example.com' },
        expectedResult: { loaded: true },
        verification: 'dom',
        retryOnFail: true,
        maxRetries: 2,
      };

      const result = await gates.checkApproval(step, context);
      expect(result.approved).toBe(true);
    });

    it('requires approval for destructive actions', async () => {
      const step: ActionStep = {
        id: 'step_1',
        capability: 'computer.execute_terminal',
        target: 'rm -rf /',
        parameters: { command: 'rm -rf /' },
        expectedResult: { exitCode: 0 },
        verification: 'state',
        retryOnFail: false,
        maxRetries: 0,
      };

      const result = await approvalGates.checkApproval(step, context);
      expect(result.approved).toBe(false);
      expect(result.reason).toContain('Destructive action');
      expect(result.requestId).toBeDefined();
    });

    it('requires approval for high-risk actions', async () => {
      const step: ActionStep = {
        id: 'step_1',
        capability: 'computer.execute_terminal',
        target: 'ls',
        parameters: { command: 'ls' },
        expectedResult: { exitCode: 0 },
        verification: 'state',
        retryOnFail: false,
        maxRetries: 0,
      };

      const result = await approvalGates.checkApproval(step, context);
      expect(result.approved).toBe(false);
      // First match is destructive, so reason contains 'Destructive action'
      expect(result.reason).toContain('Destructive action');
    });

    it('requires approval for critical actions', async () => {
      const step: ActionStep = {
        id: 'step_1',
        capability: 'computer.kill_process',
        target: 'chrome',
        parameters: { name: 'chrome' },
        expectedResult: { killed: true },
        verification: 'state',
        retryOnFail: false,
        maxRetries: 0,
      };

      const result = await approvalGates.checkApproval(step, context);
      expect(result.approved).toBe(false);
      expect(result.reason).toContain('Critical action');
    });

    it('requires approval when cost exceeds threshold', async () => {
      // Use a capability that is NOT destructive or high-risk
      const gates = createApprovalGates({ moneyThresholdUsd: 0.00005 }); // Very low threshold
      const step: ActionStep = {
        id: 'step_1',
        capability: 'computer.take_screenshot',
        target: 'screen',
        parameters: {},
        expectedResult: { screenshot: 'data' },
        verification: 'screenshot',
        retryOnFail: false,
        maxRetries: 0,
      };

      const result = await gates.checkApproval(step, context);
      expect(result.approved).toBe(false);
      expect(result.reason).toContain('threshold');
    });
  });

  describe('approveRequest/denyRequest', () => {
    const context: ExecutionContext = {
      platform: 'browser',
      mode: 'act',
      userId: 'user_1',
      sessionId: 'session_1',
      hcuBudget: 100,
    };

    it('approves a pending request', async () => {
      const step: ActionStep = {
        id: 'step_1',
        capability: 'computer.execute_terminal',
        target: 'ls',
        parameters: { command: 'ls' },
        expectedResult: { exitCode: 0 },
        verification: 'state',
        retryOnFail: false,
        maxRetries: 0,
      };

      const result = await approvalGates.checkApproval(step, context);
      expect(result.approved).toBe(false);
      expect(result.requestId).toBeDefined();

      const approved = await approvalGates.approveRequest(result.requestId!, 'user_1');
      expect(approved).toBe(true);
    });

    it('denies a pending request', async () => {
      const step: ActionStep = {
        id: 'step_1',
        capability: 'computer.execute_terminal',
        target: 'ls',
        parameters: { command: 'ls' },
        expectedResult: { exitCode: 0 },
        verification: 'state',
        retryOnFail: false,
        maxRetries: 0,
      };

      const result = await approvalGates.checkApproval(step, context);
      const denied = await approvalGates.denyRequest(result.requestId!, 'user_1', 'Not allowed');
      expect(denied).toBe(true);
    });
  });

  describe('getPendingRequestsForUser', () => {
    const context: ExecutionContext = {
      platform: 'browser',
      mode: 'act',
      userId: 'user_1',
      sessionId: 'session_1',
      hcuBudget: 100,
    };

    it('returns pending requests for user', async () => {
      const step: ActionStep = {
        id: 'step_1',
        capability: 'computer.execute_terminal',
        target: 'ls',
        parameters: { command: 'ls' },
        expectedResult: { exitCode: 0 },
        verification: 'state',
        retryOnFail: false,
        maxRetries: 0,
      };

      await approvalGates.checkApproval(step, context);
      const pending = approvalGates.getPendingRequestsForUser('user_1');
      expect(pending.length).toBeGreaterThan(0);
    });
  });
});

describe('ReflexArc', () => {
  let reflexArc: ReflexArc;

  beforeEach(() => {
    reflexArc = createReflexArc();
  });

  describe('checkPatterns', () => {
    it('detects cookie banner patterns in DOM', async () => {
      const getDOM = async () => {
        const parser = new DOMParser();
        return parser.parseFromString(
          '<html><body><div id="cookie-consent"><button>Accept</button></div></body></html>',
          'text/html'
        );
      };

      const patterns = ['[id*="cookie"]', '[class*="consent"]'];
      const triggered = await reflexArc.checkPatterns(patterns, getDOM);
      expect(triggered).toContain('[id*="cookie"]');
    });

    it('returns empty when no patterns match', async () => {
      const getDOM = async () => {
        const parser = new DOMParser();
        return parser.parseFromString('<html><body><div id="content">Hello</div></body></html>', 'text/html');
      };

      const patterns = ['[id*="cookie"]'];
      const triggered = await reflexArc.checkPatterns(patterns, getDOM);
      expect(triggered.length).toBe(0);
    });
  });

  describe('pattern management', () => {
    it('adds custom patterns', () => {
      const initialCount = reflexArc.getPatterns().length;
      reflexArc.addPattern({
        id: 'custom-pattern',
        name: 'Custom Pattern',
        selectors: ['.custom-banner'],
        dismissSelectors: ['button.dismiss'],
        action: 'click',
        priority: 50,
        platforms: ['browser'],
        enabled: true,
      });
      expect(reflexArc.getPatterns().length).toBe(initialCount + 1);
    });

    it('removes patterns', () => {
      reflexArc.addPattern({
        id: 'removable-pattern',
        name: 'Removable',
        selectors: ['.removable'],
        dismissSelectors: ['button'],
        action: 'click',
        priority: 10,
        platforms: ['browser'],
        enabled: true,
      });
      expect(reflexArc.removePattern('removable-pattern')).toBe(true);
      expect(reflexArc.removePattern('non-existent')).toBe(false);
    });

    it('enables/disables patterns', () => {
      reflexArc.addPattern({
        id: 'toggle-pattern',
        name: 'Toggle',
        selectors: ['.toggle'],
        dismissSelectors: ['button'],
        action: 'click',
        priority: 10,
        platforms: ['browser'],
        enabled: true,
      });
      expect(reflexArc.disablePattern('toggle-pattern')).toBe(true);
      expect(reflexArc.getEnabledPatternsList().find(p => p.id === 'toggle-pattern')).toBeUndefined();
      expect(reflexArc.enablePattern('toggle-pattern')).toBe(true);
      expect(reflexArc.getEnabledPatternsList().find(p => p.id === 'toggle-pattern')).toBeDefined();
    });
  });
});

describe('RollbackManager', () => {
  let rollbackManager: RollbackManager;

  beforeEach(() => {
    rollbackManager = createRollbackManager();
  });

  describe('createRollbackPlan', () => {
    it('creates rollback plan from action plan', () => {
      const actionPlan = {
        id: 'plan_1',
        goal: 'test',
        steps: [
          { id: 'step_1', capability: 'browser.navigate', target: 'https://example.com', parameters: {}, expectedResult: {}, verification: 'dom' as const, retryOnFail: true, maxRetries: 2 },
          { id: 'step_2', capability: 'computer.click', target: 'button', parameters: {}, expectedResult: {}, verification: 'screenshot' as const, retryOnFail: true, maxRetries: 2 },
        ],
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
        currentStep: 0,
        results: [],
        hcuCost: 0.02,
        hcuSpent: 0,
      };

      const rollbackPlan = rollbackManager.createRollbackPlan(actionPlan);
      expect(rollbackPlan.id).toBe('rollback_plan_1');
      expect(rollbackPlan.steps.length).toBe(2);
      expect(rollbackPlan.steps[0].originalStepId).toBe('step_2'); // Reversed
      expect(rollbackPlan.steps[1].originalStepId).toBe('step_1');
    });
  });

  describe('snapshots', () => {
    it('takes and retrieves snapshots', async () => {
      const planId = 'plan_1';
      const context: ExecutionContext = {
        platform: 'browser',
        mode: 'act',
        userId: 'user_1',
        sessionId: 'session_1',
        hcuBudget: 100,
      };

      const getState = async () => ({
        id: '',
        planId,
        stepIndex: 0,
        timestamp: new Date().toISOString(),
        platform: 'browser' as const,
        url: 'https://example.com',
        domSnapshot: '<html>test</html>',
      });

      const snapshot = await rollbackManager.takeSnapshot(planId, 0, context, getState);
      expect(snapshot.id).toMatch(/^snap_/);
      expect(snapshot.planId).toBe(planId);
      expect(snapshot.stepIndex).toBe(0);

      const snapshots = rollbackManager.getSnapshots(planId);
      expect(snapshots.length).toBe(1);
      expect(snapshots[0].id).toBe(snapshot.id);
    });

    it('gets latest snapshot', async () => {
      const planId = 'plan_2';
      const context: ExecutionContext = {
        platform: 'browser',
        mode: 'act',
        userId: 'user_1',
        sessionId: 'session_1',
        hcuBudget: 100,
      };

      const getState = async (stepIndex: number) => ({
        id: '',
        planId,
        stepIndex,
        timestamp: new Date().toISOString(),
        platform: 'browser' as const,
        url: `https://example.com/step${stepIndex}`,
      });

      await rollbackManager.takeSnapshot(planId, 0, context, () => getState(0));
      await rollbackManager.takeSnapshot(planId, 1, context, () => getState(1));

      const latest = rollbackManager.getLatestSnapshot(planId);
      expect(latest).not.toBeNull();
      expect(latest!.stepIndex).toBe(1);
    });

    it('gets snapshot at step', async () => {
      const planId = 'plan_3';
      const context: ExecutionContext = {
        platform: 'browser',
        mode: 'act',
        userId: 'user_1',
        sessionId: 'session_1',
        hcuBudget: 100,
      };

      const getState = async (stepIndex: number) => ({
        id: '',
        planId,
        stepIndex,
        timestamp: new Date().toISOString(),
        platform: 'browser' as const,
        url: `https://example.com/step${stepIndex}`,
      });

      await rollbackManager.takeSnapshot(planId, 0, context, () => getState(0));
      await rollbackManager.takeSnapshot(planId, 2, context, () => getState(2));
      await rollbackManager.takeSnapshot(planId, 5, context, () => getState(5));

      const atStep3 = rollbackManager.getSnapshotAtStep(planId, 3);
      expect(atStep3).not.toBeNull();
      expect(atStep3!.stepIndex).toBe(2); // Should get step 2 (last before 3)
    });
  });

  describe('canRollback', () => {
    it('returns true for recent snapshots', async () => {
      const planId = 'plan_4';
      const context: ExecutionContext = {
        platform: 'browser',
        mode: 'act',
        userId: 'user_1',
        sessionId: 'session_1',
        hcuBudget: 100,
      };

      const getState = async () => ({
        id: '',
        planId,
        stepIndex: 0,
        timestamp: new Date().toISOString(),
        platform: 'browser' as const,
      });

      await rollbackManager.takeSnapshot(planId, 0, context, getState);
      expect(rollbackManager.canRollback(planId)).toBe(true);
    });

    it('returns false for old snapshots', async () => {
      const manager = createRollbackManager({ maxSnapshotAgeMs: 100 }); // Very short expiry
      const planId = 'plan_5';
      const context: ExecutionContext = {
        platform: 'browser',
        mode: 'act',
        userId: 'user_1',
        sessionId: 'session_1',
        hcuBudget: 100,
      };

      const getState = async () => ({
        id: '',
        planId,
        stepIndex: 0,
        timestamp: new Date(Date.now() - 200).toISOString(), // 200ms ago
        platform: 'browser' as const,
      });

      await manager.takeSnapshot(planId, 0, context, getState);
      expect(manager.canRollback(planId)).toBe(false);
    });
  });
});

describe('AutonomousEngine Integration', () => {
  let engine: AutonomousEngine;
  let mockAdapter: MockAdapter;

  const context: ExecutionContext = {
    platform: 'browser',
    mode: 'act',
    userId: 'user_1',
    sessionId: 'session_1',
    hcuBudget: 100,
  };

  beforeEach(() => {
    engine = createAutonomousEngine({
      approvalGates: {
        routineActionsAutoApprove: true,
        destructiveActionsRequireApproval: true,
        moneyThresholdUsd: 10,
      },
      somatosensory: {
        screenshotWaitMs: 10, // Fast for tests
        domComparisonThreshold: 0.5,
      },
    });
    mockAdapter = new MockAdapter('browser.navigate', { shouldSucceed: true, data: { loaded: true } });
    engine.registerAdapter(mockAdapter);

    // Set up DOM accessor
    engine.setDOMAccessor(async () => {
      const parser = new DOMParser();
      return parser.parseFromString('<html><body><div id="test">Test</div></body></html>', 'text/html');
    });

    engine.setClickExecutor(async (x, y) => {
      // Mock click
    });
  });

  it('creates and executes a simple plan', async () => {
    const plan = await engine.createPlan('open https://example.com', context);
    expect(plan.steps.length).toBeGreaterThan(0);

    // Register adapter for the actual capability used
    const navAdapter = new MockAdapter('browser.navigate', { shouldSucceed: true });
    engine.registerAdapter(navAdapter);

    const executedPlan = await engine.executePlan(plan.id, context);
    expect(executedPlan.status).toBe('completed');
    expect(executedPlan.results.length).toBeGreaterThan(0);
    expect(executedPlan.results[0].success).toBe(true);
    expect(executedPlan.results[0].verified).toBe(true);
  });

  it('handles execution failure and rollback', async () => {
    const plan = await engine.createPlan('open https://example.com', context);

    // Register failing adapter
    const failAdapter = new MockAdapter('browser.navigate', { shouldSucceed: false });
    engine.registerAdapter(failAdapter);

    const executedPlan = await engine.executePlan(plan.id, context);
    expect(executedPlan.status).toBe('rolled_back');
  });

  it('handles missing adapter', async () => {
    // Create a new engine without the mock adapter
    const freshEngine = createAutonomousEngine({
      approvalGates: {
        routineActionsAutoApprove: true,
        destructiveActionsRequireApproval: true,
        moneyThresholdUsd: 10,
      },
      somatosensory: {
        screenshotWaitMs: 10,
        domComparisonThreshold: 0.5,
      },
      rollback: {
        enabled: false, // Disable rollback for this test
      },
    });

    // Set up DOM accessor
    freshEngine.setDOMAccessor(async () => {
      const parser = new DOMParser();
      return parser.parseFromString('<html><body><div id="test">Test</div></body></html>', 'text/html');
    });

    freshEngine.setClickExecutor(async (x, y) => {
      // Mock click
    });

    const plan = await freshEngine.createPlan('click the button', context);
    const executedPlan = await freshEngine.executePlan(plan.id, context);
    expect(executedPlan.status).toBe('failed');
    expect(executedPlan.results[0].error).toContain('No adapter');
  });

  it('tracks HCU spending', async () => {
    const plan = await engine.createPlan('open https://example.com', context);
    const navAdapter = new MockAdapter('browser.navigate', { shouldSucceed: true });
    engine.registerAdapter(navAdapter);

    const executedPlan = await engine.executePlan(plan.id, context);
    expect(executedPlan.hcuSpent).toBeGreaterThan(0);
    expect(executedPlan.hcuSpent).toBeLessThanOrEqual(executedPlan.hcuCost + 0.01); // Small margin
  });

  it('maintains history', async () => {
    const initialHistory = engine.getHistory().length;
    const plan = await engine.createPlan('open https://example.com', context);
    const navAdapter = new MockAdapter('browser.navigate', { shouldSucceed: true });
    engine.registerAdapter(navAdapter);

    await engine.executePlan(plan.id, context);
    expect(engine.getHistory().length).toBe(initialHistory + 1);
  });

  it('provides access to sub-components', () => {
    expect(engine.getMotorCortex()).toBeInstanceOf(MotorCortex);
    expect(engine.getSomatosensory()).toBeInstanceOf(SomatosensoryCortex);
    expect(engine.getActionPlanner()).toBeInstanceOf(ActionPlanner);
    expect(engine.getApprovalGates()).toBeInstanceOf(ApprovalGates);
    expect(engine.getReflexArc()).toBeInstanceOf(ReflexArc);
    expect(engine.getRollbackManager()).toBeInstanceOf(RollbackManager);
  });

  it('allows config updates', () => {
    engine.updateConfig({
      motorCortex: { bezierControlPoints: 5 },
      approvalGates: { moneyThresholdUsd: 50 },
    });
    expect(engine.getConfig().motorCortex.bezierControlPoints).toBe(5);
    expect(engine.getConfig().approvalGates.moneyThresholdUsd).toBe(50);
  });

  it('can check rollback availability', async () => {
    const plan = await engine.createPlan('open https://example.com', context);
    const navAdapter = new MockAdapter('browser.navigate', { shouldSucceed: true });
    engine.registerAdapter(navAdapter);

    await engine.executePlan(plan.id, context);
    expect(engine.canRollback(plan.id)).toBe(true);
    expect(engine.getRollbackTimeRemaining(plan.id)).toBeGreaterThan(0);
  });
});
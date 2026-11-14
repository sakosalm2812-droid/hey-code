// src/engines/autonomous/ActionPlanner.ts
// Action Planner — Decomposes natural language goals into executable ActionSteps.
// Uses LLM planner agent with structured output.

import type {
  ActionStep,
  ActionPlan,
  ExecutionContext,
  Platform,
  CapabilityCategory,
  RiskLevel,
} from './types';
import { logToCosmos } from '../../core/cosmosMemory';

interface PlannerConfig {
  maxSteps: number;
  includeRollback: boolean;
  defaultVerification: 'screenshot' | 'dom' | 'ocr' | 'state' | 'custom';
}

const DEFAULT_PLANNER_CONFIG: PlannerConfig = {
  maxSteps: 20,
  includeRollback: true,
  defaultVerification: 'dom',
};

interface CapabilityMapping {
  capability: string;
  category: CapabilityCategory;
  platforms: Platform[];
  riskLevel: RiskLevel;
  parameters: string[];
  examples: string[];
}

// Known capabilities registry
const CAPABILITIES: CapabilityMapping[] = [
  // Computer capabilities
  { capability: 'computer.open_url', category: 'computer', platforms: ['desktop', 'browser'], riskLevel: 'low', parameters: ['url'], examples: ['open https://example.com'] },
  { capability: 'computer.click', category: 'computer', platforms: ['desktop', 'browser'], riskLevel: 'low', parameters: ['x', 'y', 'selector'], examples: ['click button at 100,200'] },
  { capability: 'computer.type_text', category: 'computer', platforms: ['desktop', 'browser'], riskLevel: 'low', parameters: ['text'], examples: ['type "hello world"'] },
  { capability: 'computer.press_key', category: 'computer', platforms: ['desktop', 'browser'], riskLevel: 'low', parameters: ['key', 'modifiers'], examples: ['press Enter', 'press Ctrl+C'] },
  { capability: 'computer.scroll', category: 'computer', platforms: ['desktop', 'browser'], riskLevel: 'low', parameters: ['direction', 'amount'], examples: ['scroll down 300px'] },
  { capability: 'computer.execute_terminal', category: 'computer', platforms: ['desktop'], riskLevel: 'high', parameters: ['command', 'cwd'], examples: ['run npm install'] },
  { capability: 'computer.kill_process', category: 'computer', platforms: ['desktop'], riskLevel: 'critical', parameters: ['pid', 'name'], examples: ['kill process chrome'] },
  { capability: 'computer.change_setting', category: 'computer', platforms: ['desktop', 'phone'], riskLevel: 'high', parameters: ['setting', 'value'], examples: ['set dark mode'] },
  { capability: 'computer.organize_files', category: 'computer', platforms: ['desktop'], riskLevel: 'medium', parameters: ['source', 'destination', 'pattern'], examples: ['move downloads/*.pdf to documents'] },
  { capability: 'computer.take_screenshot', category: 'computer', platforms: ['desktop', 'browser', 'phone'], riskLevel: 'low', parameters: ['region'], examples: ['screenshot full screen'] },

  // Browser capabilities
  { capability: 'browser.navigate', category: 'browser', platforms: ['browser'], riskLevel: 'low', parameters: ['url'], examples: ['go to github.com'] },
  { capability: 'browser.fill_form', category: 'browser', platforms: ['browser'], riskLevel: 'low', parameters: ['fields', 'submit'], examples: ['fill login form'] },
  { capability: 'browser.click_element', category: 'browser', platforms: ['browser'], riskLevel: 'low', parameters: ['selector'], examples: ['click #submit-btn'] },
  { capability: 'browser.extract_text', category: 'browser', platforms: ['browser'], riskLevel: 'low', parameters: ['selector'], examples: ['get text from .price'] },
  { capability: 'browser.extract_table', category: 'browser', platforms: ['browser'], riskLevel: 'low', parameters: ['selector'], examples: ['extract table from #results'] },
  { capability: 'browser.wait_for', category: 'browser', platforms: ['browser'], riskLevel: 'low', parameters: ['selector', 'timeout'], examples: ['wait for .loading to disappear'] },
  { capability: 'browser.submit_form', category: 'browser', platforms: ['browser'], riskLevel: 'medium', parameters: ['selector', 'data'], examples: ['submit checkout form'] },
  { capability: 'browser.handle_dialog', category: 'browser', platforms: ['browser'], riskLevel: 'low', parameters: ['action', 'text'], examples: ['accept alert'] },

  // Phone capabilities (future)
  { capability: 'phone.open_app', category: 'phone', platforms: ['phone'], riskLevel: 'low', parameters: ['packageName'], examples: ['open com.whatsapp'] },
  { capability: 'phone.tap', category: 'phone', platforms: ['phone'], riskLevel: 'low', parameters: ['x', 'y'], examples: ['tap 300,500'] },
  { capability: 'phone.swipe', category: 'phone', platforms: ['phone'], riskLevel: 'low', parameters: ['startX', 'startY', 'endX', 'endY'], examples: ['swipe up'] },
  { capability: 'phone.type', category: 'phone', platforms: ['phone'], riskLevel: 'low', parameters: ['text'], examples: ['type message'] },
];

export class ActionPlanner {
  private config: PlannerConfig;
  private capabilityMap: Map<string, CapabilityMapping> = new Map();

  constructor(config: Partial<PlannerConfig> = {}) {
    this.config = { ...DEFAULT_PLANNER_CONFIG, ...config };
    for (const cap of CAPABILITIES) {
      this.capabilityMap.set(cap.capability, cap);
    }
  }

  /**
   * Create an action plan from a natural language goal.
   * In production, this calls an LLM planner agent.
   */
  async createPlan(
    goal: string,
    context: ExecutionContext,
    availableCapabilities?: string[]
  ): Promise<ActionPlan> {
    const planId = `plan_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const steps = await this.decomposeGoal(goal, context, availableCapabilities);

    const plan: ActionPlan = {
      id: planId,
      goal,
      steps,
      status: 'pending',
      createdAt: new Date().toISOString(),
      currentStep: 0,
      results: [],
      hcuCost: this.estimateHCU(steps),
      hcuSpent: 0,
    };

    if (this.config.includeRollback) {
      plan.rollbackPlan = this.generateRollbackPlan(steps);
    }

    await this.logPlan(plan, context);
    return plan;
  }

  private async decomposeGoal(
    goal: string,
    context: ExecutionContext,
    availableCapabilities?: string[]
  ): Promise<ActionStep[]> {
    // In real implementation, this calls an LLM with structured output
    // For now, we use rule-based decomposition based on keywords
    const lowerGoal = goal.toLowerCase();

    // Determine relevant capabilities based on platform
    const caps = availableCapabilities || this.getCapabilitiesForPlatform(context.platform);

    // Simple keyword-based decomposition (placeholder for LLM planner)
    if (lowerGoal.includes('search') || lowerGoal.includes('find') || lowerGoal.includes('look for')) {
      return this.planSearch(goal, context);
    }
    if (lowerGoal.includes('open') && (lowerGoal.includes('url') || lowerGoal.includes('website') || lowerGoal.includes('http'))) {
      return this.planOpenUrl(goal, context);
    }
    if (lowerGoal.includes('click') || lowerGoal.includes('press') || lowerGoal.includes('tap')) {
      return this.planClick(goal, context);
    }
    if (lowerGoal.includes('type') || lowerGoal.includes('write') || lowerGoal.includes('enter')) {
      return this.planType(goal, context);
    }
    if (lowerGoal.includes('scroll')) {
      return this.planScroll(goal, context);
    }
    if (lowerGoal.includes('screenshot') || lowerGoal.includes('capture')) {
      return this.planScreenshot(goal, context);
    }
    if (lowerGoal.includes('terminal') || lowerGoal.includes('command') || lowerGoal.includes('run ')) {
      return this.planTerminal(goal, context);
    }
    if (lowerGoal.includes('form') || lowerGoal.includes('fill') || lowerGoal.includes('submit')) {
      return this.planForm(goal, context);
    }
    if (lowerGoal.includes('organize') || lowerGoal.includes('move') || lowerGoal.includes('copy') || lowerGoal.includes('delete file')) {
      return this.planFileOps(goal, context);
    }

    // Default: generic web navigation + extraction
    return this.planGeneric(goal, context);
  }

  private getCapabilitiesForPlatform(platform: Platform): string[] {
    return CAPABILITIES
      .filter(c => c.platforms.includes(platform))
      .map(c => c.capability);
  }

  private planSearch(goal: string, context: ExecutionContext): ActionStep[] {
    const query = this.extractQuery(goal);
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    return [
      {
        id: `step_${Date.now()}_1`,
        capability: 'browser.navigate',
        target: url,
        parameters: { url },
        expectedResult: { loaded: true, url },
        verification: 'dom',
        retryOnFail: true,
        maxRetries: 2,
      },
      {
        id: `step_${Date.now()}_2`,
        capability: 'browser.wait_for',
        target: '#search',
        parameters: { selector: '#search', timeout: 5000 },
        expectedResult: { found: true },
        verification: 'dom',
        retryOnFail: true,
        maxRetries: 1,
      },
      {
        id: `step_${Date.now()}_3`,
        capability: 'browser.extract_text',
        target: '#search',
        parameters: { selector: '#search' },
        expectedResult: { text: expect.stringContaining(query) },
        verification: 'dom',
        retryOnFail: false,
        maxRetries: 0,
      },
    ];
  }

  private planOpenUrl(goal: string, context: ExecutionContext): ActionStep[] {
    const url = this.extractUrl(goal) || 'https://example.com';
    return [
      {
        id: `step_${Date.now()}_1`,
        capability: 'browser.navigate',
        target: url,
        parameters: { url },
        expectedResult: { selector: 'body', loaded: true, url },
        verification: 'dom',
        retryOnFail: true,
        maxRetries: 2,
      },
    ];
  }

  private planClick(goal: string, context: ExecutionContext): ActionStep[] {
    const selector = this.extractSelector(goal);
    const coords = this.extractCoordinates(goal);
    if (context.platform === 'browser') {
      return [
        {
          id: `step_${Date.now()}_1`,
          capability: 'browser.click_element',
          target: selector || 'unknown',
          parameters: { selector: selector || undefined },
          expectedResult: { clicked: true },
          verification: 'dom',
          retryOnFail: true,
          maxRetries: 2,
        },
      ];
    }
    return [
      {
        id: `step_${Date.now()}_1`,
        capability: 'computer.click',
        target: coords ? `${coords.x},${coords.y}` : 'unknown',
        parameters: coords ? { x: coords.x, y: coords.y } : { selector },
        expectedResult: { clicked: true },
        verification: 'screenshot',
        retryOnFail: true,
        maxRetries: 2,
      },
    ];
  }

  private planType(goal: string, context: ExecutionContext): ActionStep[] {
    const text = this.extractText(goal);
    return [
      {
        id: `step_${Date.now()}_1`,
        capability: context.platform === 'browser' ? 'browser.fill_form' : 'computer.type_text',
        target: 'input',
        parameters: { text, fields: { input: text } },
        expectedResult: { typed: true, text },
        verification: 'dom',
        retryOnFail: true,
        maxRetries: 2,
      },
    ];
  }

  private planScroll(goal: string, context: ExecutionContext): ActionStep[] {
    const direction = goal.toLowerCase().includes('up') ? 'up' : 'down';
    const amount = this.extractNumber(goal) || 300;
    return [
      {
        id: `step_${Date.now()}_1`,
        capability: 'computer.scroll',
        target: `${direction} ${amount}`,
        parameters: { direction, amount },
        expectedResult: { scrolled: true },
        verification: 'screenshot',
        retryOnFail: true,
        maxRetries: 1,
      },
    ];
  }

  private planScreenshot(goal: string, context: ExecutionContext): ActionStep[] {
    return [
      {
        id: `step_${Date.now()}_1`,
        capability: 'computer.take_screenshot',
        target: 'screen',
        parameters: {},
        expectedResult: { screenshot: expect.any(String) },
        verification: 'screenshot',
        retryOnFail: true,
        maxRetries: 1,
      },
    ];
  }

  private planTerminal(goal: string, context: ExecutionContext): ActionStep[] {
    const command = this.extractCommand(goal);
    return [
      {
        id: `step_${Date.now()}_1`,
        capability: 'computer.execute_terminal',
        target: command,
        parameters: { command, cwd: process.cwd() },
        expectedResult: { exitCode: 0 },
        verification: 'state',
        retryOnFail: false,
        maxRetries: 0,
      },
    ];
  }

  private planForm(goal: string, context: ExecutionContext): ActionStep[] {
    const fields = this.extractFormFields(goal);
    return [
      {
        id: `step_${Date.now()}_1`,
        capability: 'browser.fill_form',
        target: 'form',
        parameters: { fields, submit: true },
        expectedResult: { submitted: true },
        verification: 'dom',
        retryOnFail: true,
        maxRetries: 2,
      },
    ];
  }

  private planFileOps(goal: string, context: ExecutionContext): ActionStep[] {
    return [
      {
        id: `step_${Date.now()}_1`,
        capability: 'computer.organize_files',
        target: 'files',
        parameters: { source: '~/Downloads', destination: '~/Documents', pattern: '*.pdf' },
        expectedResult: { moved: 0 },
        verification: 'state',
        retryOnFail: false,
        maxRetries: 1,
      },
    ];
  }

  private planGeneric(goal: string, context: ExecutionContext): ActionStep[] {
    // Generic multi-step plan
    return [
      {
        id: `step_${Date.now()}_1`,
        capability: 'browser.navigate',
        target: 'https://google.com',
        parameters: { url: 'https://google.com' },
        expectedResult: { loaded: true },
        verification: 'dom',
        retryOnFail: true,
        maxRetries: 2,
      },
      {
        id: `step_${Date.now()}_2`,
        capability: 'browser.click_element',
        target: 'search input',
        parameters: { selector: 'input[name="q"]' },
        expectedResult: { focused: true },
        verification: 'dom',
        retryOnFail: true,
        maxRetries: 1,
      },
      {
        id: `step_${Date.now()}_3`,
        capability: 'computer.type_text',
        target: 'search query',
        parameters: { text: goal },
        expectedResult: { typed: true },
        verification: 'dom',
        retryOnFail: true,
        maxRetries: 1,
      },
      {
        id: `step_${Date.now()}_4`,
        capability: 'computer.press_key',
        target: 'Enter',
        parameters: { key: 'Enter' },
        expectedResult: { submitted: true },
        verification: 'dom',
        retryOnFail: true,
        maxRetries: 1,
      },
      {
        id: `step_${Date.now()}_5`,
        capability: 'browser.extract_text',
        target: 'results',
        parameters: { selector: '#search' },
        expectedResult: { text: expect.any(String) },
        verification: 'dom',
        retryOnFail: false,
        maxRetries: 0,
      },
    ];
  }

  private generateRollbackPlan(steps: ActionStep[]): ActionStep[] {
    // Generate reverse operations for rollback
    const rollback: ActionStep[] = [];

    for (const step of [...steps].reverse()) {
      const rollbackStep = this.getRollbackStep(step);
      if (rollbackStep) {
        rollback.push(rollbackStep);
      }
    }

    return rollback;
  }

  private getRollbackStep(step: ActionStep): ActionStep | null {
    const rollbackMap: Record<string, Partial<ActionStep>> = {
      'computer.open_url': { capability: 'browser.navigate', parameters: { url: 'about:blank' } },
      'browser.navigate': { capability: 'browser.navigate', parameters: { url: 'about:blank' } },
      'computer.type_text': { capability: 'computer.press_key', parameters: { key: 'Backspace', modifiers: ['Ctrl'] } },
      'browser.fill_form': { capability: 'browser.click_element', parameters: { selector: 'button[type="reset"]' } },
      'computer.execute_terminal': { capability: 'computer.execute_terminal', parameters: { command: 'echo "rolled back"' } },
    };

    const rollback = rollbackMap[step.capability];
    if (!rollback) return null;

    return {
      id: `rollback_${step.id}`,
      capability: rollback.capability!,
      target: `rollback ${step.target}`,
      parameters: rollback.parameters || {},
      expectedResult: { rolledBack: true },
      verification: 'state',
      retryOnFail: false,
      maxRetries: 1,
    };
  }

  private estimateHCU(steps: ActionStep[]): number {
    const stepCosts: Record<string, number> = {
      'computer.open_url': 0.01,
      'computer.click': 0.005,
      'computer.type_text': 0.002,
      'computer.press_key': 0.001,
      'computer.scroll': 0.003,
      'computer.execute_terminal': 0.05,
      'computer.kill_process': 0.02,
      'computer.change_setting': 0.01,
      'computer.organize_files': 0.03,
      'computer.take_screenshot': 0.005,
      'browser.navigate': 0.01,
      'browser.fill_form': 0.005,
      'browser.click_element': 0.005,
      'browser.extract_text': 0.003,
      'browser.extract_table': 0.01,
      'browser.wait_for': 0.002,
      'browser.submit_form': 0.01,
      'browser.handle_dialog': 0.002,
      'phone.open_app': 0.01,
      'phone.tap': 0.005,
      'phone.swipe': 0.005,
      'phone.type': 0.002,
    };

    return steps.reduce((sum, step) => sum + (stepCosts[step.capability] || 0.01), 0);
  }

  // Extraction helpers (simplified - real impl uses NLP/LLM)
  private extractQuery(goal: string): string {
    const match = goal.match(/(?:search|find|look for)\s+(.+)/i);
    return match ? match[1].trim() : goal;
  }

  private extractUrl(goal: string): string | null {
    const match = goal.match(/(https?:\/\/[^\s]+)/i);
    return match ? match[1] : null;
  }

  private extractSelector(goal: string): string | null {
    const match = goal.match(/(?:click|press|tap)\s+(?:on\s+)?([#.][\w-]+)/i);
    return match ? match[1] : null;
  }

  private extractCoordinates(goal: string): { x: number; y: number } | null {
    const match = goal.match(/(\d+)[,\s]+(\d+)/);
    return match ? { x: parseInt(match[1]), y: parseInt(match[2]) } : null;
  }

  private extractText(goal: string): string {
    const match = goal.match(/(?:type|write|enter)\s+["'](.+)["']/i);
    return match ? match[1] : 'default text';
  }

  private extractNumber(goal: string): number | null {
    const match = goal.match(/(\d+)/);
    return match ? parseInt(match[1]) : null;
  }

  private extractCommand(goal: string): string {
    const match = goal.match(/(?:run|execute|command)\s+(.+)/i);
    return match ? match[1].trim() : 'echo "no command specified"';
  }

  private extractFormFields(goal: string): Record<string, string> {
    // Very simplified - real impl would parse field:value pairs
    return { 'input': 'default value' };
  }

  private async logPlan(plan: ActionPlan, context: ExecutionContext): Promise<void> {
    try {
      await logToCosmos({
        type: 'autonomous_plan_created',
        planId: plan.id,
        goal: plan.goal,
        steps: plan.steps.length,
        estimatedHCU: plan.hcuCost,
        platform: context.platform,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Continue if Cosmos unavailable
    }
  }

  getCapabilities(): CapabilityMapping[] {
    return [...CAPABILITIES];
  }

  getCapability(capability: string): CapabilityMapping | undefined {
    return this.capabilityMap.get(capability);
  }

  getConfig(): PlannerConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<PlannerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

export function createActionPlanner(config?: Partial<PlannerConfig>): ActionPlanner {
  return new ActionPlanner(config);
}

export default ActionPlanner;
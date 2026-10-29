import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  BUILTIN_AGENTS,
  AGENT_TOOLS,
  AGENT_REGISTRY,
  AGENT_REGISTRY_SIZE,
  slugifyAgentName,
  listAgents,
  getAgent,
  filterToolsByPermissions,
  canUsePermission,
} from '@/lib/agents';
import { executeAgentTool, safeEvaluate } from '@/lib/agent-tools';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    agent: {
      findMany: vi.fn(async () => []),
      findFirst: vi.fn(async () => null),
    },
    agentRun: {
      create: vi.fn(async () => ({})),
    },
    memory: {
      findMany: vi.fn(async () => []),
    },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.resetModules();
});

describe('agent registry', () => {
  test('registers the exact 229-agent registry', () => {
    expect(AGENT_REGISTRY_SIZE).toBe(229);
    expect(AGENT_REGISTRY).toHaveLength(229);
    const ids = AGENT_REGISTRY.map((a) => a.id);
    expect(new Set(ids).size).toBe(229);
    expect(ids).toContain('intent');
    expect(ids).toContain('agent-router');
  });

  test('every registry agent satisfies the universal contract', () => {
    for (const agent of AGENT_REGISTRY) {
      expect(agent.id).toBeTruthy();
      expect(agent.name).toBeTruthy();
      expect(agent.purpose).toBeTruthy();
      expect(agent.category).toMatch(/^[A-R]$/);
      expect(agent.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(agent.tools.length).toBeGreaterThan(0);
      expect(agent.permissions.length).toBeGreaterThan(0);
      expect(agent.inputSchema).toBeTruthy();
      expect(agent.outputSchema).toBeTruthy();
      expect(agent.fallbackModels).toContain(agent.model);
    }
  });

  test('registers builtin agents including the legacy general default', () => {
    const slugs = BUILTIN_AGENTS.map((a) => a.slug);
    expect(slugs).toContain('general');
    expect(slugs).toContain('fullstack');
    expect(slugs).toContain('writer');
    expect(slugs).toContain('intent');
    expect(BUILTIN_AGENTS.length).toBe(AGENT_REGISTRY_SIZE + 1);
  });

  test('registers all 13 tool definitions with permission scopes', () => {
    const ids = AGENT_TOOLS.map((t) => t.id);
    expect(ids).toHaveLength(13);
    expect(ids).toContain('web_search');
    expect(ids).toContain('calculator');
    expect(ids).toContain('translate');
    expect(ids).toContain('summarize');
    expect(ids).toContain('prayer_times');
    expect(ids).toContain('hijri_date');
    expect(AGENT_TOOLS.find((t) => t.id === 'web_search')?.permissions).toEqual(['web']);
    expect(AGENT_TOOLS.find((t) => t.id === 'memory_save')?.permissions).toEqual(['memory']);
  });

  test('slugifies agent names', () => {
    expect(slugifyAgentName('My Cool Agent')).toBe('my-cool-agent');
    expect(slugifyAgentName('A     B')).toBe('a-b');
    expect(slugifyAgentName('   ')).toBe('agent');
  });

  test('lists builtin agents when no custom agents exist', async () => {
    const agents = await listAgents('user-1');
    expect(agents.length).toBe(BUILTIN_AGENTS.length);
    expect(agents.every((a) => a.builtin)).toBe(true);
    expect(agents.map((a) => a.id)).toContain('builtin:general');
    expect(agents.map((a) => a.id)).toContain('builtin:agent-router');
  });

  test('getAgent resolves legacy slug aliases to registry agents', async () => {
    const coder = await getAgent('user-1', 'coder');
    expect(coder?.name).toBe('Fullstack Agent');
    expect(coder?.builtin).toBe(true);
    expect(coder?.id).toBe('builtin:fullstack');

    const data = await getAgent('user-1', 'data');
    expect(data?.name).toBe('Data Analysis Agent');
    expect(data?.id).toBe('builtin:data-analysis');
  });

  test('getAgent returns a registry agent by slug', async () => {
    const agent = await getAgent('user-1', 'writer');
    expect(agent?.name).toBe('Writer Agent');
    expect(agent?.builtin).toBe(true);
    expect(agent?.category).toBe('L');
  });

  test('getAgent returns null for unknown slug', async () => {
    const agent = await getAgent('user-1', 'does-not-exist');
    expect(agent).toBeNull();
  });

  test('filterToolsByPermissions removes tools the agent lacks permissions for', () => {
    const tools = ['web_search', 'calculator', 'memory_save'] as const;
    const computeOnly = filterToolsByPermissions([...tools], ['compute']);
    expect(computeOnly).toEqual(['calculator']);
    const admin = filterToolsByPermissions([...tools], ['admin']);
    expect(admin.sort()).toEqual(['calculator', 'memory_save', 'web_search']);
  });

  test('canUsePermission grants base and admin permissions', () => {
    expect(canUsePermission(['web'], 'web')).toBe(true);
    expect(canUsePermission(['web'], 'memory')).toBe(false);
    expect(canUsePermission(['admin'], 'media')).toBe(true);
  });
});

describe('agent tools', () => {
  test('calculator evaluates arithmetic safely', () => {
    expect(safeEvaluate('(1 + 2) * 3')).toEqual({ ok: true, result: 9 });
    expect(safeEvaluate('10 / 4')).toEqual({ ok: true, result: 2.5 });
    expect(safeEvaluate('2.5 * 2')).toEqual({ ok: true, result: 5 });
  });

  test('calculator rejects unsafe input', () => {
    expect(safeEvaluate('process.exit(1)').ok).toBe(false);
    expect(safeEvaluate('__proto__').ok).toBe(false);
    expect(safeEvaluate('').ok).toBe(false);
  });

  test('current_time returns an ISO timestamp', async () => {
    const result = await executeAgentTool('user-1', { toolId: 'current_time', input: {} }, ['compute']);
    expect(result.ok).toBe(true);
    expect(result.output).toMatch(/It is .+ \(UTC\)/);
  });

  test('calculator tool surfaces results', async () => {
    const result = await executeAgentTool('user-1', { toolId: 'calculator', input: { expression: '6 * 7' } }, ['compute']);
    expect(result.ok).toBe(true);
    expect(result.output).toBe('6 * 7 = 42');
  });

  test('denies tools the agent lacks permission for', async () => {
    const result = await executeAgentTool('user-1', { toolId: 'web_search', input: { query: 'cats' } }, ['compute']);
    expect(result.ok).toBe(false);
    expect(result.output).toContain('requires the "web" permission');
  });

  test('web_search flags external setup instead of failing', async () => {
    const result = await executeAgentTool('user-1', { toolId: 'web_search', input: { query: 'cats' } }, ['web']);
    expect(result.requiresSetup).toBe(true);
  });

  test('translate flags missing chat provider setup', async () => {
    const result = await executeAgentTool('user-1', { toolId: 'translate', input: { text: 'hello', target: 'kurdish' } }, ['compute']);
    expect(result.ok).toBe(false);
    expect(result.requiresSetup).toBe(true);
  });

  test('summarize degrades to extractive fallback without a chat provider', async () => {
    const result = await executeAgentTool('user-1', { toolId: 'summarize', input: { text: 'Alpha. Beta. Gamma. Delta.' } }, ['compute']);
    expect(result.ok).toBe(true);
    expect(result.output).toContain('extractive summary');
  });

  test('prayer_times returns deterministic times for London', async () => {
    const result = await executeAgentTool('user-1', { toolId: 'prayer_times', input: { location: 'london', date: '2024-01-01' } }, ['compute']);
    expect(result.ok).toBe(true);
    expect(result.output as string).toContain('Fajr');
    expect(result.output as string).toContain('06:');
  });

  test('hijri_date returns the correct anchord Hijri date', async () => {
    const result = await executeAgentTool('user-1', { toolId: 'hijri_date', input: { date: '2024-03-11' } }, ['compute']);
    expect(result.ok).toBe(true);
    expect(result.output as string).toContain('1 Ramadan 1445');
  });
});
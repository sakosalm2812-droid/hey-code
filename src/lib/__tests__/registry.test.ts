import { describe, test, expect } from 'vitest';
import {
  AGENT_REGISTRY,
  getAgentContract,
  getAgentsByCategory,
  getAgentsByTool,
  getDefaultAgents,
} from '@/lib/agents/registry';
import { AGENT_TEAMS, findTeamForAgent, getTeamMembersContracts, describeTeam } from '@/lib/agents/teams';
import { routeRequest, routeRequestToTeam, listTeams } from '@/lib/agents/router';
import {
  getAgentHealth,
  getAgentHealthById,
  getRegistryHealthSummary,
  HEALTH_LABEL,
  hasChatProvider,
  hasWebProvider,
  hasMediaProvider,
} from '@/lib/agents/health';

describe('registry integrity', () => {
  test('has exactly 229 agents across 18 categories', () => {
    expect(AGENT_REGISTRY).toHaveLength(229);
    const categories = new Set(AGENT_REGISTRY.map((a) => a.category));
    expect(categories.size).toBe(18);
  });

  test('getAgentContract returns a complete contract', () => {
    const c = getAgentContract('agent-router');
    expect(c?.id).toBe('agent-router');
    expect(c?.category).toBe('R');
    expect(c?.tools.length).toBeGreaterThan(0);
  });

  test('getAgentsByCategory returns only that category', () => {
    const d = getAgentsByCategory('D');
    expect(d.length).toBe(23);
    expect(d.every((a) => a.category === 'D')).toBe(true);
  });

  test('all 13 tools exist in the registry', () => {
    const expected = ['web_search', 'web_fetch', 'memory_search', 'memory_save', 'calculator', 'current_time', 'image_generate', 'file_search', 'planner', 'translate', 'summarize', 'prayer_times', 'hijri_date'] as const;
    for (const tool of expected) {
      expect(getAgentsByTool(tool).length).toBeGreaterThan(0);
    }
  });

  test('getDefaultAgents returns the prime execution chain', () => {
    const defs = getDefaultAgents();
    expect(defs.length).toBeGreaterThan(3);
    expect(defs[0]).toBe('intent');
  });
});

describe('teams', () => {
  test('has all 8 teams and every member resolves', () => {
    expect(AGENT_TEAMS).toHaveLength(8);
    const ids = new Set(AGENT_REGISTRY.map((a) => a.id));
    for (const team of AGENT_TEAMS) {
      expect(team.members.length).toBeGreaterThan(0);
      for (const m of team.members) expect(ids.has(m)).toBe(true);
      expect(ids.has(team.lead)).toBe(true);
    }
  });

  test('findTeamForAgent associates build agents with the build team', () => {
    const team = findTeamForAgent('fullstack');
    expect(team?.id).toBe('build-team');
  });

  test('getTeamMembersContracts returns live contracts', () => {
    const members = getTeamMembersContracts('research-team');
    expect(members.length).toBeGreaterThan(0);
  });

  test('describeTeam returns a goal statement', () => {
    expect(describeTeam('study-team')).toContain('Study Team');
  });
});

describe('router', () => {
  test('routes a prayer query to the prayer-times agent', () => {
    const decision = routeRequest('what are prayer times in London?');
    expect(decision.primary.id).toBe('prayer-times');
    expect(decision.confidence).not.toBe('low');
  });

  test('routes coding work into the build team', () => {
    const decision = routeRequest('implement the new feature end to end and add tests to the frontend and backend');
    expect(decision.primary.category).toBe('D');
    expect(decision.team?.id).toBe('build-team');
  });

  test('fell back to intent agent when nothing matches', () => {
    const decision = routeRequest('zzzzqqqq');
    expect(decision.primary.id).toBe('intent');
    expect(decision.confidence).toBe('low');
  });

  test('routeRequestToTeam stays inside the given team', () => {
    const teamIds = new Set(getTeamMembersContracts('research-team').map((a) => a.id));
    const decision = routeRequestToTeam('look up the current news and verify the facts', 'research-team');
    expect(teamIds.has(decision.primary.id)).toBe(true);
    expect(decision.team?.id).toBe('research-team');
  });

  test('listTeams returns 8 teams', () => {
    expect(listTeams()).toHaveLength(8);
  });
});

describe('health', () => {
  test('returns one of the documented labels for every agent', () => {
    for (const agent of AGENT_REGISTRY) {
      expect(Object.keys(HEALTH_LABEL)).toContain(getAgentHealth(agent));
    }
  });

  test('getAgentHealthById reports unknown agents as unavailable', () => {
    expect(getAgentHealthById('nope').status).toBe('unavailable');
  });

  test('summary tallies match the registry size', () => {
    const summary = getRegistryHealthSummary();
    expect(summary.total).toBe(229);
    expect(
      summary.healthy + summary.degraded + summary.blocked + summary.unavailable + summary.disabled
    ).toBe(229);
    expect(Object.keys(summary.byCategory).length).toBe(18);
  });

  test('provider flags are booleans without throwing', () => {
    expect(typeof hasChatProvider()).toBe('boolean');
    expect(typeof hasWebProvider()).toBe('boolean');
    expect(typeof hasMediaProvider()).toBe('boolean');
  });
});
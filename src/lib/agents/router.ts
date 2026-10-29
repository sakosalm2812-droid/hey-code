/**
 * Agent Router (agent 219). Routes every inbound request to the owning agent
 * and its team by weighted keyword/intent scoring, with a fallback to the
 * Intent Agent, a plan describing the route, and health hints.
 */
import type { AgentContract } from './types';
import { AGENT_REGISTRY } from './registry';
import { AGENT_TEAMS, findTeamForAgent, describeTeam } from './teams';
import { getAgentHealth } from './health';

export interface RouterDecision {
  input: string;
  primary: AgentContract;
  primaryHealth: string;
  runnerUps: AgentContract[];
  team: { id: string; name: string } | null;
  teamSummary: string;
  plan: string;
  matchedBy: string[];
  confidence: 'high' | 'medium' | 'low';
}

const INDEX: {
  agent: AgentContract;
  words: Set<string>;
}[] = [];

for (const agent of AGENT_REGISTRY) {
  const words = new Set<string>();
  const add = (w: string) => {
    const cleaned = w.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF\u0750-\u077F]+/g, ' ').trim();
    if (cleaned.length > 1) words.add(cleaned);
  };
  agent.name.toLowerCase().split(/\s+/).forEach(add);
  agent.purpose.toLowerCase().split(/\s+/).forEach(add);
  agent.keywords.forEach(add);
  INDEX.push({ agent, words });
}

function score(input: string, words: Set<string>): { matched: string[]; total: number } {
  const matched: string[] = [];
  let total = 0;
  words.forEach((w) => {
    if (input.includes(w)) {
      matched.push(w);
      total += w.includes(' ') ? 3 : w.length >= 5 ? 2 : 1;
    }
  });
  return { matched, total };
}

export function routeRequest(input: string): RouterDecision {
  const normalized = input.toLowerCase().trim();

  const ranked: { agent: AgentContract; matched: string[]; total: number }[] = [];
  for (const entry of INDEX) {
    const { matched, total } = score(normalized, entry.words);
    if (total > 0) ranked.push({ agent: entry.agent, matched, total });
  }
  ranked.sort((a, b) => b.total - a.total);

  const primary =
    ranked.length > 0 ? ranked[0].agent : AGENT_REGISTRY.find((a) => a.id === 'intent')!;
  const runnerUps = ranked.slice(1, 4).map((r) => r.agent);
  const matchedBy = ranked.length > 0 ? ranked[0].matched : [];

  const team = findTeamForAgent(primary.id);
  const confidence: RouterDecision['confidence'] =
    ranked[0]?.total >= 6 ? 'high' : ranked[0]?.total >= 3 ? 'medium' : 'low';

  const plan =
    ranked.length > 0
      ? `Routed to ${primary.name} (${primary.category}: ${matchedBy.join(', ')}). ${team ? describeTeam(team.id) : 'Direct agent route.'}`
      : 'No specialist matched; routed to the Intent Agent for classification.';

  return {
    input,
    primary,
    primaryHealth: getAgentHealth(primary),
    runnerUps,
    team: team ? { id: team.id, name: team.name } : null,
    teamSummary: team ? describeTeam(team.id) : '',
    plan,
    matchedBy,
    confidence,
  };
}

export function routeRequestToTeam(input: string, teamId?: string): RouterDecision {
  if (!teamId) return routeRequest(input);
  const team = AGENT_TEAMS.find((t) => t.id === teamId);
  if (!team) return routeRequest(input);

  const normalized = input.toLowerCase().trim();
  const ranked = team.members
    .map((id) => AGENT_REGISTRY.find((a) => a.id === id))
    .filter((a): a is AgentContract => Boolean(a))
    .map((agent) => {
      const INDEX_ENTRY = INDEX.find((e) => e.agent.id === agent.id);
      return {
        agent,
        ...(INDEX_ENTRY ? score(normalized, INDEX_ENTRY.words) : { matched: [] as string[], total: 0 }),
      };
    })
    .sort((a, b) => b.total - a.total);

  const primary = ranked[0] && ranked[0].total > 0 ? ranked[0].agent : getTeamLead(teamId);
  const teamObj = findTeamForAgent(primary.id);
  return {
    input,
    primary,
    primaryHealth: getAgentHealth(primary),
    runnerUps: ranked.slice(1, 4).map((r) => r.agent),
    team: teamObj ? { id: teamObj.id, name: teamObj.name } : null,
    teamSummary: describeTeam(teamId),
    plan: `Routed within ${team.name} to ${primary.name}.`,
    matchedBy: ranked[0]?.matched ?? [],
    confidence: ranked[0]?.total >= 3 ? 'high' : 'medium',
  };
}

function getTeamLead(teamId: string): AgentContract {
  const team = AGENT_TEAMS.find((t) => t.id === teamId);
  const lead = team ? AGENT_REGISTRY.find((a) => a.id === team.lead) : undefined;
  return lead ?? AGENT_REGISTRY.find((a) => a.id === 'intent')!;
}

export function listTeams(): { id: string; name: string; description: string; goals: string }[] {
  return AGENT_TEAMS.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    goals: t.goal,
  }));
}
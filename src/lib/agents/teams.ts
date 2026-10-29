/**
 * The 8 built-in agent teams. Each team has a lead, a goal and member ids that
 * must all exist in AGENT_REGISTRY (integrity is validated at import time).
 */
import type { AgentCategoryId, AgentContract } from './types';
import { AGENT_CATEGORIES } from './types';
import { AGENT_REGISTRY, getAgentContract } from './registry';

export interface AgentTeam {
  id: string;
  name: string;
  description: string;
  goal: string;
  lead: string;
  members: string[];
  categories: AgentCategoryId[];
}

export const AGENT_TEAMS: AgentTeam[] = [
  {
    id: 'research-team',
    name: 'Research Team',
    description: 'Discovers, verifies and synthesizes information.',
    goal: 'Answer any open question with fresh, verified sources and clear confidence.',
    lead: 'deep-research',
    members: ['web-research', 'deep-research', 'source-verify', 'fact-check', 'news', 'academic', 'document-research', 'pdf-research', 'image-research', 'competitive-research', 'customer-research', 'market-research', 'synthesis', 'citation', 'research-planner', 'uncertainty'],
    categories: ['C'],
  },
  {
    id: 'build-team',
    name: 'Build Team',
    description: 'Designs, implements and ships software.',
    goal: 'Turn requirements into working, tested, shipped code.',
    lead: 'architect',
    members: ['architect', 'frontend', 'backend', 'fullstack', 'database', 'supabase', 'api', 'ai-integration', 'provider-routing', 'code-review', 'debugger', 'testing', 'e2e', 'performance', 'devops', 'release', 'migration', 'dependency', 'documentation', 'code-quality', 'refactor', 'build', 'native-tauri'],
    categories: ['D'],
  },
  {
    id: 'design-team',
    name: 'Design Team',
    description: 'Product, UX and visual design in the HEY system.',
    goal: 'Make every surface useful, beautiful and designed for the moment.',
    lead: 'ui-design',
    members: ['product-manager', 'product-strategy', 'ux-research', 'ux-design', 'ui-design', 'design-system', 'creative-director', 'branding', 'motion', 'accessibility', 'responsive', 'empty-state', 'error-state', 'onboarding', 'design-qa', 'workspace', 'widget', 'layout', 'state', 'dynamic-island'],
    categories: ['I', 'J'],
  },
  {
    id: 'launch-team',
    name: 'Launch Team',
    description: 'Readiness, release gates and infrastructure for shipping.',
    goal: 'Ship safely: nothing goes live without passing every gate.',
    lead: 'release-gate',
    members: ['release-gate', 'regression', 'integration-validation', 'contract-test', 'data-integrity', 'user-journey', 'trust', 'audit-review', 'observability', 'cost-controller', 'latency-controller', 'release', 'devops'],
    categories: ['P', 'D', 'R'],
  },
  {
    id: 'creator-team',
    name: 'Creator Team',
    description: 'Content, media and business growth.',
    goal: 'Help the user create, publish and grow with confidence.',
    lead: 'creator',
    members: ['creator', 'writer', 'editor', 'social', 'marketing', 'sales', 'startup', 'finance-planning', 'operations', 'customer-support', 'competitor', 'content-qa', 'media', 'search'],
    categories: ['L', 'J'],
  },
  {
    id: 'study-team',
    name: 'Study Team',
    description: 'Learning, focus and retention.',
    goal: 'Help the user learn deeply and remember it.',
    lead: 'study',
    members: ['study', 'learning', 'focus', 'time-management', 'weekly-review', 'routine', 'goal-coach', 'productivity', 'personal-development', 'morning', 'education'],
    categories: ['K', 'O'],
  },
  {
    id: 'device-team',
    name: 'Device Team',
    description: 'Vision, devices and cross-device experiences.',
    goal: 'Make HEY feel native on every device the user owns.',
    lead: 'phone',
    members: ['vision', 'screen-understanding', 'document-vision', 'camera', 'phone', 'tablet', 'display', 'tv', 'smart-home', 'wearable', 'vehicle', 'cross-device', 'discovery', 'pairing', 'health'],
    categories: ['M'],
  },
  {
    id: 'security-team',
    name: 'Security Team',
    description: 'Security, privacy, audit and trust.',
    goal: 'Nothing ships or runs that is not safe, private and auditable.',
    lead: 'security-auditor',
    members: ['security-auditor', 'authentication', 'authorization', 'secrets', 'appsec', 'api-security', 'ai-security', 'tool-security', 'computer-control-security', 'file-security', 'privacy', 'audit', 'abuse-prevention', 'incident-response', 'hallucination-detection', 'output-sanitization'],
    categories: ['E', 'P'],
  },
];

const known = new Set(AGENT_REGISTRY.map((a) => a.id));
const missing: string[] = [];
for (const team of AGENT_TEAMS) {
  for (const member of [team.lead, ...team.members]) {
    if (!known.has(member)) missing.push(`${team.id}:${member}`);
  }
}
if (missing.length > 0) {
  throw new Error(`Agent team references unknown agents: ${missing.join(', ')}`);
}

export function getTeamById(id: string): AgentTeam | undefined {
  return AGENT_TEAMS.find((t) => t.id === id);
}

export function findTeamForAgent(agentId: string): AgentTeam | undefined {
  return AGENT_TEAMS.find((t) => t.lead === agentId || t.members.includes(agentId));
}

export function getTeamMembersContracts(teamId: string): AgentContract[] {
  const team = getTeamById(teamId);
  if (!team) return [];
  return team.members.map(getAgentContract).filter((a): a is AgentContract => Boolean(a));
}

export function describeTeam(teamId: string): string {
  const team = getTeamById(teamId);
  if (!team) return '';
  const cats = team.categories
    .map((c) => AGENT_CATEGORIES.find((x) => x.id === c)?.name ?? c)
    .join(', ');
  return `${team.name} (${cats}): ${team.goal}`;
}
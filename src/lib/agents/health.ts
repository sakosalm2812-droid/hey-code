/**
 * Agent health system. Health is derived at request time from the configured
 * free-key providers, so an agent is marked 'blocked' when one of its required
 * capabilities (work is not configured) is missing, and 'unavailable' when no
 * chat model provider is configured at all. Pure-calculation agents degrade
 * gracefully because their deterministic tools never call a model.
 */
import type { AgentContract, AgentHealth, AgentToolId } from './types';
import { AGENT_REGISTRY } from './registry';

const CHAT_PROVIDER_KEYS = [
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'OPENROUTER_API_KEY',
  'GEMINI_API_KEY',
  'GROQ_API_KEY',
] as const;

const DETERMINISTIC_TOOLS: AgentToolId[] = [
  'calculator',
  'current_time',
  'prayer_times',
  'hijri_date',
];

export const CAPABILITY_KEYS = {
  web: 'SERP_API_KEY',
  media: ['GEMINI_API_KEY', 'OPENAI_API_KEY'],
  files: null,
  memory: null,
} as const;

export function hasChatProvider(): boolean {
  return CHAT_PROVIDER_KEYS.some((k) => Boolean(process.env[k]));
}

export function hasWebProvider(): boolean {
  return Boolean(process.env.SERP_API_KEY);
}

export function hasMediaProvider(): boolean {
  return Boolean(process.env.GEMINI_API_KEY) || Boolean(process.env.OPENAI_API_KEY);
}

function onlyDeterministic(tools: AgentToolId[]): boolean {
  return tools.length > 0 && tools.every((t) => DETERMINISTIC_TOOLS.includes(t as AgentToolId));
}

export interface AgentHealthDetail {
  status: AgentHealth;
  reason: string;
  missingKeys: string[];
}

export function getAgentHealthDetail(
  agent: AgentContract,
  opts: { status?: 'ACTIVE' | 'DISABLED' } = {}
): AgentHealthDetail {
  const status = opts.status ?? 'ACTIVE';
  if (status === 'DISABLED') {
    return { status: 'disabled', reason: 'Agent is disabled.', missingKeys: [] };
  }

  const missingKeys: string[] = [];
  const needsWeb = agent.tools.includes('web_search') || agent.tools.includes('web_fetch');
  const needsMedia = agent.tools.includes('image_generate');
  const needsLLM =
    !onlyDeterministic(agent.tools) ||
    agent.tools.includes('translate') ||
    agent.tools.includes('summarize');

  if (needsWeb && !hasWebProvider()) {
    missingKeys.push(CAPABILITY_KEYS.web as string);
    return {
      status: 'blocked',
      reason: 'Web tool is configured but no web-search key (SERP_API_KEY) is set.',
      missingKeys,
    };
  }

  if (needsMedia && !hasMediaProvider()) {
    missingKeys.push(...CAPABILITY_KEYS.media);
    return {
      status: 'blocked',
      reason: 'Image tool is configured but no free image key (GEMINI_API_KEY) is set.',
      missingKeys,
    };
  }

  if (needsLLM && !hasChatProvider()) {
    return {
      status: 'unavailable',
      reason: 'No chat provider key configured (set GROQ_API_KEY and/or GEMINI_API_KEY).',
      missingKeys: [...CHAT_PROVIDER_KEYS],
    };
  }

  if (onlyDeterministic(agent.tools) && !hasChatProvider()) {
    return {
      status: 'degraded',
      reason: 'Falling back to deterministic tools only.',
      missingKeys: [...CHAT_PROVIDER_KEYS],
    };
  }

  return {
    status: 'healthy',
    reason: 'All required capabilities are configured with free keys.',
    missingKeys: [],
  };
}

export function getAgentHealth(
  agent: AgentContract,
  opts?: { status?: 'ACTIVE' | 'DISABLED' }
): AgentHealth {
  return getAgentHealthDetail(agent, opts).status;
}

export function getAgentHealthById(
  id: string,
  opts?: { status?: 'ACTIVE' | 'DISABLED' }
): AgentHealthDetail {
  const agent = AGENT_REGISTRY.find((a) => a.id === id);
  if (!agent) {
    return { status: 'unavailable', reason: 'Unknown agent.', missingKeys: [] };
  }
  return getAgentHealthDetail(agent, opts);
}

export interface RegistryHealthSummary {
  total: number;
  healthy: number;
  degraded: number;
  blocked: number;
  unavailable: number;
  disabled: number;
  byCategory: Record<string, number>;
}

export function getRegistryHealthSummary(): RegistryHealthSummary {
  const counts: RegistryHealthSummary = {
    total: AGENT_REGISTRY.length,
    healthy: 0,
    degraded: 0,
    blocked: 0,
    unavailable: 0,
    disabled: 0,
    byCategory: {},
  };
  const tally: Record<AgentHealth, number> = { healthy: 0, degraded: 0, unavailable: 0, blocked: 0, unhealthy: 0, disabled: 0 };
  for (const agent of AGENT_REGISTRY) {
    tally[getAgentHealth(agent)] += 1;
    counts.byCategory[agent.category] = (counts.byCategory[agent.category] ?? 0) + 1;
  }
  counts.healthy = tally.healthy;
  counts.degraded = tally.degraded;
  counts.unavailable = tally.unavailable;
  counts.disabled = tally.disabled;
  counts.blocked = tally.blocked + tally.unhealthy;
  return counts;
}

export const HEALTH_LABEL: Record<AgentHealth, string> = {
  healthy: 'Healthy',
  degraded: 'Degraded',
  unavailable: 'Unavailable',
  blocked: 'Blocked',
  unhealthy: 'Unhealthy',
  disabled: 'Disabled',
};
import { prisma } from '@/lib/prisma';
import type { ChatModel } from '@/lib/ai';

// ─── Unified contract types / tool set (single source of truth: agents/types.ts) ───
export type { AgentToolId, AgentPermission, AgentToolDefinition, AgentStatus, RiskClass, PrivacyClass, AgentHealth, AgentCategoryId, AgentContract, AgentCategory, AgentModelId } from '@/lib/agents/types';
export { AGENT_TOOLS, AGENT_CATEGORIES, canUsePermission, filterToolsByPermissions, toolRequiresPermission } from '@/lib/agents/types';
import { AGENT_REGISTRY } from '@/lib/agents/registry';
import { getAgentHealth } from '@/lib/agents/health';

// ─── Registry ───
export { AGENT_REGISTRY, AGENT_REGISTRY_SIZE, getAgentContract, getAgentsByCategory, getCategory, getAgentsByTool, getDefaultAgents } from '@/lib/agents/registry';
export type { AgentContract as RegistryAgentContract } from '@/lib/agents/registry';

// ─── Teams, Router, Health ───
export { AGENT_TEAMS, getTeamById, findTeamForAgent, getTeamMembersContracts, describeTeam } from '@/lib/agents/teams';
export type { AgentTeam } from '@/lib/agents/teams';
export { routeRequest, routeRequestToTeam, listTeams } from '@/lib/agents/router';
export type { RouterDecision } from '@/lib/agents/router';
export { getAgentHealth, getAgentHealthDetail, getAgentHealthById, getRegistryHealthSummary, HEALTH_LABEL, hasChatProvider, hasWebProvider, hasMediaProvider } from '@/lib/agents/health';
export type { AgentHealthDetail, RegistryHealthSummary } from '@/lib/agents/health';

export interface BuiltinAgent {
  slug: string;
  name: string;
  description: string | null;
  systemPrompt: string;
  model: ChatModel;
  tools: import('@/lib/agents/types').AgentToolId[];
  permissions: import('@/lib/agents/types').AgentPermission[];
  category: import('@/lib/agents/types').AgentCategoryId;
  version: string;
  risk: import('@/lib/agents/types').RiskClass;
  privacy: import('@/lib/agents/types').PrivacyClass;
  fallbackModels: ChatModel[];
  keywords: string[];
  inputSchema: string;
  outputSchema: string;
  health: import('@/lib/agents/types').AgentHealth;
  owner: string;
}

function contractToBuiltin(agent: import('@/lib/agents/types').AgentContract): BuiltinAgent {
  const health = getAgentHealth(agent);
  return {
    slug: agent.id,
    name: agent.name,
    description: agent.purpose,
    systemPrompt: `You are ${agent.name} (${agent.category}, v${agent.version}), a specialist internal agent owned by ${agent.owner}.

Purpose: ${agent.purpose}

Boundaries: ${agent.boundaries}

Rules:
- Answer in the user's language, clearly and concisely.
- Use your allotted tools only when they genuinely help; never fabricate tool output.
- When a capability you need is blocked or unavailable, say so honestly and offer the closest working alternative.
- Keep the user safe: refuse only where policies require, and stay in your lane (do not perform other agents' duties).

Tools you may use: ${agent.tools.join(', ') || 'none (reasoning only)'}
Permissions: ${agent.permissions.join(', ')}
Risk class: ${agent.risk} | Privacy: ${agent.privacy} | Timeout: ${agent.timeoutMs}ms | Retries: ${agent.retries}
Fallback model chain: ${[...agent.fallbackModels].join(' > ')}
Input schema: ${agent.inputSchema}
Output schema: ${agent.outputSchema}`,
    model: agent.model as ChatModel,
    tools: agent.tools,
    permissions: agent.permissions,
    category: agent.category,
    version: agent.version,
    risk: agent.risk,
    privacy: agent.privacy,
    fallbackModels: agent.fallbackModels as ChatModel[],
    keywords: agent.keywords,
    inputSchema: agent.inputSchema,
    outputSchema: agent.outputSchema,
    health,
    owner: agent.owner,
  };
}

/**
 * The default all-purpose assistant (BACKWARD COMPATIBILITY). Not part of the
 * 229-agent registry (AGENT_REGISTRY is exactly 229); it keeps "no agent
 * selected" and the legacy 'general' slug working exactly as before.
 */
const GENERAL_BUILTIN: BuiltinAgent = contractToBuiltin({
  id: 'general',
  name: 'General Assistant',
  category: 'A' as const,
  version: '1.0.0',
  owner: 'HEY Core',
  purpose: "HEY's default all-purpose assistant: friendly, capable, and helpful across all tasks.",
  boundaries: 'Defer specialist requests to the owning specialist agent when the user names one.',
  tools: ['calculator', 'current_time', 'memory_search', 'memory_save', 'web_search', 'web_fetch', 'file_search', 'planner', 'translate', 'summarize', 'prayer_times', 'hijri_date'],
  permissions: ['compute', 'memory', 'web', 'files', 'data'],
  model: 'GPT_4O',
  fallbackModels: ['GPT_4O_MINI', 'GPT_4O'],
  risk: 'low',
  privacy: 'private',
  platforms: ['web', 'desktop', 'mobile'],
  timeoutMs: 30000,
  retries: 2,
  inputSchema: 'string',
  outputSchema: 'text',
  keywords: ['general', 'assistant', 'help', 'anything'],
  audit: true,
  telemetry: true,
});

/**
 * All builtin agents = the 229 specialist agents from the registry plus the
 * legacy 'general' default. Every registry agent is selectable and wired into
 * the chat pipeline, the /api/agents surface and the dashboard.
 */
export const BUILTIN_AGENTS: BuiltinAgent[] = [
  GENERAL_BUILTIN,
  ...AGENT_REGISTRY.map(contractToBuiltin),
];

// Legacy slug aliases so old references ('coder', 'researcher', 'data') still resolve.
const LEGACY_ALIASES: Record<string, string> = {
  coder: 'fullstack',
  researcher: 'web-research',
  data: 'data-analysis',
};

const BUILTIN_BY_SLUG = new Map(BUILTIN_AGENTS.map((a) => [a.slug, a]));

export function slugifyAgentName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32) || 'agent';
}

export interface AgentDefinition {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  systemPrompt: string;
  model: ChatModel;
  status: string;
  tools: import('@/lib/agents/types').AgentToolId[];
  permissions: import('@/lib/agents/types').AgentPermission[];
  builtin: boolean;
  category?: import('@/lib/agents/types').AgentCategoryId;
  version?: string;
  risk?: import('@/lib/agents/types').RiskClass;
  privacy?: import('@/lib/agents/types').PrivacyClass;
  fallbackModels?: ChatModel[];
  keywords?: string[];
  inputSchema?: string;
  outputSchema?: string;
  health?: import('@/lib/agents/types').AgentHealth;
  owner?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

function builtinDefinition(a: BuiltinAgent): AgentDefinition {
  return {
    id: `builtin:${a.slug}`,
    slug: a.slug,
    name: a.name,
    description: a.description,
    systemPrompt: a.systemPrompt,
    model: a.model,
    status: 'ACTIVE',
    tools: a.tools,
    permissions: a.permissions,
    builtin: true,
    category: a.category,
    version: a.version,
    risk: a.risk,
    privacy: a.privacy,
    fallbackModels: a.fallbackModels,
    keywords: a.keywords,
    inputSchema: a.inputSchema,
    outputSchema: a.outputSchema,
    health: a.health,
    owner: a.owner,
  };
}

export async function createAgent({
  userId,
  name,
  description,
  systemPrompt,
  model = 'GPT_4O_MINI',
  tools = [],
  permissions = [],
}: {
  userId: string;
  name: string;
  description?: string;
  systemPrompt: string;
  model?: ChatModel;
  tools?: import('@/lib/agents/types').AgentToolId[];
  permissions?: import('@/lib/agents/types').AgentPermission[];
}) {
  const slug = slugifyAgentName(name);
  return prisma.agent.create({
    data: {
      userId,
      name,
      slug,
      description,
      systemPrompt,
      model,
      tools,
      permissions,
    },
  });
}

export async function listAgents(userId: string): Promise<AgentDefinition[]> {
  const custom = await prisma.agent.findMany({
    where: { userId, status: 'ACTIVE' },
    orderBy: { createdAt: 'asc' },
  });

  const customSlugs = new Set(custom.map((a) => a.slug));
  const builtins = BUILTIN_AGENTS.filter((a) => !customSlugs.has(a.slug)).map(builtinDefinition);

  const customDefs: AgentDefinition[] = custom.map((a) => ({
    id: a.id,
    slug: a.slug,
    name: a.name,
    description: a.description,
    systemPrompt: a.systemPrompt,
    model: a.model as ChatModel,
    status: a.status,
    tools: (a.tools as import('@/lib/agents/types').AgentToolId[]) ?? [],
    permissions: (a.permissions as import('@/lib/agents/types').AgentPermission[]) ?? [],
    builtin: false,
    health: a.status === 'DISABLED' ? 'disabled' : 'healthy',
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  }));

  return [...customDefs, ...builtins];
}

function resolveBuiltinSlug(slug: string): BuiltinAgent | undefined {
  return BUILTIN_BY_SLUG.get(slug) ?? BUILTIN_BY_SLUG.get(LEGACY_ALIASES[slug]);
}

export async function getAgent(userId: string, slug: string): Promise<AgentDefinition | null> {
  const custom = await prisma.agent.findFirst({
    where: { userId, slug, status: 'ACTIVE' },
  });
  if (custom) {
    return {
      id: custom.id,
      slug: custom.slug,
      name: custom.name,
      description: custom.description,
      systemPrompt: custom.systemPrompt,
      model: custom.model as ChatModel,
      status: custom.status,
      tools: (custom.tools as import('@/lib/agents/types').AgentToolId[]) ?? [],
      permissions: (custom.permissions as import('@/lib/agents/types').AgentPermission[]) ?? [],
      builtin: false,
      health: custom.status === 'DISABLED' ? 'disabled' : 'healthy',
      createdAt: custom.createdAt,
      updatedAt: custom.updatedAt,
    };
  }

  const builtin = resolveBuiltinSlug(slug);
  if (builtin) return builtinDefinition(builtin);

  return null;
}

export async function getAgentById(userId: string, agentId: string): Promise<AgentDefinition | null> {
  if (agentId.startsWith('builtin:')) {
    return getAgent(userId, agentId.replace('builtin:', ''));
  }
  const custom = await prisma.agent.findFirst({ where: { id: agentId, userId, status: 'ACTIVE' } });
  if (!custom) return null;
  return {
    id: custom.id,
    slug: custom.slug,
    name: custom.name,
    description: custom.description,
    systemPrompt: custom.systemPrompt,
    model: custom.model as ChatModel,
    status: custom.status,
    tools: (custom.tools as import('@/lib/agents/types').AgentToolId[]) ?? [],
    permissions: (custom.permissions as import('@/lib/agents/types').AgentPermission[]) ?? [],
    builtin: false,
    health: custom.status === 'DISABLED' ? 'disabled' : 'healthy',
    createdAt: custom.createdAt,
    updatedAt: custom.updatedAt,
  };
}

export async function updateAgent(
  userId: string,
  agentId: string,
  data: Partial<{
    name: string;
    description: string;
    systemPrompt: string;
    model: ChatModel;
    status: 'ACTIVE' | 'DISABLED';
    tools: import('@/lib/agents/types').AgentToolId[];
    permissions: import('@/lib/agents/types').AgentPermission[];
  }>
) {
  const existing = await prisma.agent.findFirst({ where: { id: agentId, userId } });
  if (!existing) return null;

  return prisma.agent.update({
    where: { id: agentId },
    data: {
      ...(data.name ? { name: data.name, slug: slugifyAgentName(data.name) } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.systemPrompt ? { systemPrompt: data.systemPrompt } : {}),
      ...(data.model ? { model: data.model } : {}),
      ...(data.status ? { status: data.status } : {}),
      ...(data.tools ? { tools: data.tools } : {}),
      ...(data.permissions ? { permissions: data.permissions } : {}),
    },
  });
}

export async function deleteAgent(userId: string, agentId: string) {
  return prisma.agent.deleteMany({ where: { id: agentId, userId } });
}
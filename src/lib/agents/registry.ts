/**
 * THE HEY AGENT REGISTRY — all 229 specialist agents across the 18 categories
 * (A-R) exactly as specified in the HEY agent architecture, assembled from the
 * per-family data modules. Every agent satisfies the universal contract.
 *
 * Model default = GPT_4O_MINI which routes through the free provider chain
 * (openai -> openrouter -> groq -> gemini -> anthropic), so agents run on free
 * keys only. Pure-calculation agents (prayer-times, islamic-calendar, data /
 * statistics, etc.) use zeroth-move deterministic tools and never need a model.
 */
import type { AgentCategoryId, AgentContract } from './types';
import { AGENT_CATEGORIES } from './types';
import { AGENTS_CORE } from './data-core';
import { AGENTS_DEV } from './data-dev';
import { AGENTS_CREATIVE } from './data-creative';
import { AGENTS_KNOWLEDGE } from './data-knowledge';
import { AGENTS_QA_FORGE } from './data-qa-forge';

export type { AgentContract, AgentCategoryId } from './types';
export { AGENT_CATEGORIES, AGENT_TOOLS, DEFAULT_CONTRACT } from './types';

export const AGENT_REGISTRY: AgentContract[] = [
  ...AGENTS_CORE,
  ...AGENTS_DEV,
  ...AGENTS_CREATIVE,
  ...AGENTS_KNOWLEDGE,
  ...AGENTS_QA_FORGE,
];

export const AGENT_REGISTRY_SIZE = AGENT_REGISTRY.length; // must be 229

const byId = new Map<string, AgentContract>(AGENT_REGISTRY.map((a) => [a.id, a]));

const duplicates = AGENT_REGISTRY.filter(
  (a, i) => AGENT_REGISTRY.findIndex((x) => x.id === a.id) !== i
);
if (duplicates.length > 0) {
  throw new Error(`Agent registry contains duplicate ids: ${duplicates.map((d) => d.id).join(', ')}`);
}

export function getAgentContract(id: string): AgentContract | undefined {
  return byId.get(id);
}

export function getAgentsByCategory(category: AgentCategoryId): AgentContract[] {
  return AGENT_REGISTRY.filter((a) => a.category === category);
}

export function getCategory(category: AgentCategoryId) {
  return AGENT_CATEGORIES.find((c) => c.id === category);
}

export function getAgentsByTool(tool: AgentContract['tools'][number]): AgentContract[] {
  return AGENT_REGISTRY.filter((a) => a.tools.includes(tool));
}

export function getDefaultAgents(): string[] {
  return ['intent', 'planner', 'executor', 'verifier', 'response'];
}
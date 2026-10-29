/**
 * Shared agent contracts: tool set, permission model, universal agent contract,
 * health/status types and the 18 category families. This module is a pure leaf
 * (no runtime deps) so registry/router/health can import it without cycles.
 */

export type AgentModelId =
  | 'GPT_4O'
  | 'GPT_4O_MINI'
  | 'GPT_4_TURBO'
  | 'CLAUDE_3_OPUS'
  | 'CLAUDE_3_SONNET'
  | 'CLAUDE_3_HAIKU';

export type AgentToolId =
  | 'web_search'
  | 'web_fetch'
  | 'memory_search'
  | 'memory_save'
  | 'calculator'
  | 'current_time'
  | 'image_generate'
  | 'file_search'
  | 'planner'
  | 'translate'
  | 'summarize'
  | 'prayer_times'
  | 'hijri_date';

export type AgentPermission =
  | 'web'
  | 'memory'
  | 'compute'
  | 'media'
  | 'files'
  | 'data'
  | 'admin';

export interface AgentToolDefinition {
  id: AgentToolId;
  label: string;
  description: string;
  permissions: AgentPermission[];
}

export const AGENT_TOOLS: AgentToolDefinition[] = [
  { id: 'web_search', label: 'Web Search', description: 'Search the web for current information.', permissions: ['web'] },
  { id: 'web_fetch', label: 'Fetch URL', description: 'Fetch and summarize a given URL.', permissions: ['web'] },
  { id: 'memory_search', label: 'Memory Search', description: 'Search the user\'s stored memories.', permissions: ['memory'] },
  { id: 'memory_save', label: 'Memory Save', description: 'Store a fact into long-term memory.', permissions: ['memory'] },
  { id: 'calculator', label: 'Calculator', description: 'Evaluate arithmetic expressions safely.', permissions: ['compute'] },
  { id: 'current_time', label: 'Current Time', description: 'Return the current date and time.', permissions: ['compute'] },
  { id: 'image_generate', label: 'Image Generation', description: 'Generate an image from a description.', permissions: ['media'] },
  { id: 'file_search', label: 'File Search', description: 'Search the user\'s uploaded files and projects.', permissions: ['files'] },
  { id: 'planner', label: 'Day Planner', description: 'Summarize today\'s tasks, habits, and journal streak.', permissions: ['data'] },
  { id: 'translate', label: 'Translate', description: 'Translate text into another language.', permissions: ['compute'] },
  { id: 'summarize', label: 'Summarize', description: 'Produce a concise summary of a text.', permissions: ['compute'] },
  { id: 'prayer_times', label: 'Prayer Times', description: 'Compute Islamic prayer times for a location and date.', permissions: ['compute'] },
  { id: 'hijri_date', label: 'Hijri Date', description: 'Compute the Hijri (Islamic) date for a Gregorian date.', permissions: ['compute'] },
];

/** The permission a tool requires. Returns null when the tool needs no permission gate (defensive). */
export function toolRequiresPermission(toolId: AgentToolId): AgentPermission | null {
  const def = AGENT_TOOLS.find((t) => t.id === toolId);
  return def ? def.permissions[0] ?? null : null;
}

export function canUsePermission(permissions: AgentPermission[], required: AgentPermission): boolean {
  return permissions.includes('admin') || permissions.includes(required);
}

export function filterToolsByPermissions(
  tools: AgentToolId[],
  permissions: AgentPermission[]
): AgentToolId[] {
  const allowed = new Set(permissions);
  const def = new Map(AGENT_TOOLS.map((t) => [t.id, t]));
  return tools.filter((toolId) => {
    const d = def.get(toolId);
    if (!d) return false;
    const hasAdmin = allowed.has('admin');
    return d.permissions.every((p) => allowed.has(p) || hasAdmin);
  });
}

export type AgentStatus = 'ACTIVE' | 'DISABLED';

export type RiskClass = 'minimal' | 'low' | 'medium' | 'high' | 'critical';

export type PrivacyClass = 'global' | 'project' | 'private' | 'sensitive' | 'local';

export type AgentHealth =
  | 'healthy'
  | 'degraded'
  | 'unavailable'
  | 'blocked'
  | 'unhealthy'
  | 'disabled';

export type AgentCategoryId =
  | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I'
  | 'J' | 'K' | 'L' | 'M' | 'N' | 'O' | 'P' | 'Q' | 'R';

export interface AgentCategory {
  id: AgentCategoryId;
  name: string;
  from: number;
  to: number;
  description: string;
}

export const AGENT_CATEGORIES: AgentCategory[] = [
  { id: 'A', name: 'Core Intelligence', from: 1, to: 16, description: 'HEY\'s central nervous system: intent, planning, execution, verification, recovery and orchestration.' },
  { id: 'B', name: 'Cosmos / Memory', from: 17, to: 32, description: 'The memory system: ingestion, retrieval, ranking, dedupe, update, decay, graph, privacy and provenance.' },
  { id: 'C', name: 'Research', from: 33, to: 48, description: 'Web, deep, academic and market research with source verification, citation and synthesis.' },
  { id: 'D', name: 'Software Engineering', from: 49, to: 71, description: 'Architecture, frontend, backend, database, API, AI integration, reviews, testing and releases.' },
  { id: 'E', name: 'Security', from: 72, to: 85, description: 'Auditing, authentication, authorization, secrets, app/API/AI security, privacy and abuse prevention.' },
  { id: 'F', name: 'Computer / Browser / Files', from: 86, to: 101, description: 'Desktop, keyboard, pointer, window, process, filesystem, browser, clipboard, terminal.' },
  { id: 'G', name: 'Voice', from: 102, to: 112, description: 'Voice session orchestration: STT, TTS, wake word, VAD, interruption, translation and summaries.' },
  { id: 'H', name: 'Language', from: 113, to: 118, description: 'English, Kurdish (Sorani), Arabic, RTL layout, internationalization and pronunciation.' },
  { id: 'I', name: 'Product / UX / Design', from: 119, to: 133, description: 'Product management, strategy, UX/UI design, design system, branding, motion and design QA.' },
  { id: 'J', name: 'Workspace / UI System', from: 134, to: 145, description: 'Workspace, widgets, layout, state, Dynamic Island, notifications, calendar, reminders and search.' },
  { id: 'K', name: 'Proactive / Productivity', from: 146, to: 156, description: 'Proactive help, morning briefings, routines, focus, time management, goals, learning and study.' },
  { id: 'L', name: 'Creator / Business', from: 157, to: 168, description: 'Content creation, editing, social, marketing, sales, startup, finance, operations and support.' },
  { id: 'M', name: 'Vision / Device', from: 169, to: 183, description: 'Visual understanding, screen/document/camera vision and device platforms (phone, tablet, TV, wearables).' },
  { id: 'N', name: 'Religious', from: 184, to: 188, description: 'Prayer times, Quran, Hadith, Islamic calendar and religious research.' },
  { id: 'O', name: 'Specialized Knowledge', from: 189, to: 198, description: 'Health, medical, legal, education, science, engineering, data analysis, statistics and visualization.' },
  { id: 'P', name: 'QA / Trust', from: 199, to: 208, description: 'Regression, integration, contract tests, data integrity, hallucination detection and release gates.' },
  { id: 'Q', name: 'Forge', from: 209, to: 218, description: 'Meta-layer for designing, validating, versioning and governing new capabilities.' },
  { id: 'R', name: 'Infrastructure / Orchestration', from: 219, to: 229, description: 'Routing, scheduling, load balancing, fallback, cost/latency control, observability and the registry.' },
];

/**
 * The universal contract every HEY agent must satisfy (from the HEY agent spec).
 * AgentContract intentionally exposes the full production contract so any agent,
 * builtin or custom, can be audited by the Registry Agent (229).
 */
export interface AgentContract {
  id: string;
  name: string;
  category: AgentCategoryId;
  version: string;
  owner: string;
  purpose: string;
  boundaries: string;
  tools: AgentToolId[];
  permissions: AgentPermission[];
  model: AgentModelId;
  fallbackModels: AgentModelId[];
  risk: RiskClass;
  privacy: PrivacyClass;
  platforms: string[];
  timeoutMs: number;
  retries: number;
  inputSchema: string;
  outputSchema: string;
  keywords: string[];
  audit: boolean;
  telemetry: boolean;
}

export const DEFAULT_CONTRACT: Omit<AgentContract, 'id' | 'name' | 'category' | 'purpose'> = {
  version: '1.0.0',
  owner: 'HEY Core',
  boundaries: 'Operates only within its defined purpose; cannot grant itself permissions.',
  tools: [],
  permissions: ['compute'],
  model: 'GPT_4O_MINI',
  fallbackModels: ['GPT_4O_MINI', 'GPT_4O'],
  risk: 'low',
  privacy: 'private',
  platforms: ['web', 'desktop', 'mobile'],
  timeoutMs: 30_000,
  retries: 2,
  inputSchema: 'string',
  outputSchema: 'text',
  keywords: [],
  audit: true,
  telemetry: true,
};
/**
 * Agent factory: builds full AgentContract objects from compact seeds,
 * merging with DEFAULT_CONTRACT so every agent satisfies the universal contract.
 */
import type {
  AgentCategoryId,
  AgentContract,
  AgentModelId,
  AgentPermission,
  AgentToolId,
  PrivacyClass,
  RiskClass,
} from './types';
import { AGENT_TOOLS, DEFAULT_CONTRACT } from './types';

export interface AgentSeed {
  tools?: AgentToolId[];
  permissions?: AgentPermission[];
  model?: AgentModelId;
  fallbackModels?: AgentModelId[];
  risk?: RiskClass;
  privacy?: PrivacyClass;
  timeoutMs?: number;
  retries?: number;
  inputSchema?: string;
  outputSchema?: string;
  keywords?: string[];
  boundaries?: string;
  platforms?: string[];
  version?: string;
}

function inferPermissions(tools: AgentToolId[]): AgentPermission[] {
  const defs = new Map(AGENT_TOOLS.map((t) => [t.id, t]));
  const perms = new Set<AgentPermission>();
  for (const t of tools) {
    const d = defs.get(t);
    if (d) d.permissions.forEach((p) => perms.add(p));
  }
  if (perms.size === 0) perms.add('compute');
  return (['compute', ...Array.from(perms)] as AgentPermission[]).filter((v, i, a) => a.indexOf(v) === i);
}

export function ag(
  id: string,
  name: string,
  category: AgentCategoryId,
  purpose: string,
  opts: AgentSeed = {}
): AgentContract {
  const tools = opts.tools ?? [];
  return {
    ...DEFAULT_CONTRACT,
    id,
    name,
    category,
    purpose,
    tools,
    permissions: opts.permissions ?? inferPermissions(tools),
    ...opts,
  };
}

/** Software engineers get the full task-toolkit (model does the rest via chat). */
export const DEV_TOOLS: AgentToolId[] = ['file_search', 'web_fetch'];
export const DEV_KEYWORDS = (extra: string[]) => ['code', 'app', 'project', ...extra];
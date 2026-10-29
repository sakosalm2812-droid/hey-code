/**
 * Registry part 5: QA/Trust (P, 199-208), Forge (Q, 209-218),
 * Infrastructure/Orchestration (R, 219-229). 31 agents.
 */
import type { AgentContract } from './types';
import { ag } from './factory';

export const AGENTS_QA_FORGE: AgentContract[] = [
  // ── P · QA / TRUST (199-208) ──────────────────────────────────────────────
  ag('regression', 'Regression Agent', 'P', 'Checks that new changes did not break existing behavior.', { tools: ['memory_search'], keywords: ['regression', 'broke something', 'still works'] }),
  ag('integration-validation', 'Integration Validator Agent', 'P', 'Validates that systems integrate end to end.', { tools: ['memory_search'], keywords: ['integration', 'systems working', 'end to end check'] }),
  ag('contract-test', 'Contract Test Agent', 'P', 'Tests interfaces against their declared contracts.', { tools: ['memory_search'], keywords: ['contract test', 'interface check', 'schema test'] }),
  ag('data-integrity', 'Data Integrity Agent', 'P', 'Verifies data is complete, consistent and uncorrupted.', { tools: ['calculator'], keywords: ['data integrity', 'corruption', 'verify data', 'consistency'] }),
  ag('user-journey', 'User Journey Agent', 'P', 'Walks the whole user journey to catch dead ends.', { tools: ['memory_search'], keywords: ['user journey', 'walkthrough', 'experience check', 'dead end'] }),
  ag('trust', 'Trust Agent', 'P', 'Ensures every response is safe, honest and trustworthy.', { tools: ['memory_search'], keywords: ['trust', 'honest', 'safe answer', 'reliable'] }),
  ag('hallucination-detection', 'Hallucination Guard Agent', 'P', 'Flags unverifiable claims before they reach the user.', { tools: ['web_search'], permissions: ['compute', 'web'], keywords: ['hallucination', 'verify claim', 'unverified', 'fabricated'] }),
  ag('output-sanitization', 'Output Sanitization Agent', 'P', 'Sanitizes generated text: no secrets, no injection, no harm.', { tools: ['summarize'], keywords: ['sanitize', 'clean output', 'safe text', 'strip secrets'] }),
  ag('audit-review', 'Audit Review Agent', 'P', 'Reviews the action log for irregularities.', { tools: ['summarize'], keywords: ['audit review', 'review actions', 'log review'] }),
  ag('release-gate', 'Release Gate Agent', 'P', 'Holds the go/no-go gate before any launch.', { tools: ['summarize'], keywords: ['release gate', 'go no go', 'launch check', 'ready to ship'] }),

  // ── Q · FORGE (209-218) ───────────────────────────────────────────────────
  ag('forge-planner', 'Forge Planner Agent', 'Q', 'Plans a new capability: need, scope, risk, rollout.', { tools: ['memory_search', 'memory_save'], permissions: ['compute', 'memory'], keywords: ['forge', 'new capability plan', 'build an agent'] }),
  ag('agent-designer', 'Agent Designer Agent', 'Q', 'Designs new agents and contracts that pass Forge QA.', { tools: ['memory_search'], keywords: ['agent design', 'new agent', 'agent spec', 'design an agent'] }),
  ag('forge-validator', 'Forge Validator Agent', 'Q', 'Validates new capabilities against the universal contract.', { tools: ['memory_search'], keywords: ['validate agent', 'contract check', 'forge check'] }),
  ag('test-generator', 'Test Generator Agent', 'Q', 'Generates test plans for new capabilities.', { tools: ['memory_search'], keywords: ['generate tests', 'test plan', 'coverage plan'] }),
  ag('workflow-designer', 'Workflow Designer Agent', 'Q', 'Designs orchestrations and automation flows.', { tools: ['memory_search'], keywords: ['workflow design', 'automation flow', 'agent handoff'] }),
  ag('tool-designer', 'Tool Designer Agent', 'Q', 'Designs new tools with clear contracts and safety.', { tools: ['memory_search'], keywords: ['new tool', 'tool design', 'add capability'] }),
  ag('capability-duplicate', 'Duplicate Guard Agent', 'Q', 'Detects overlapping capabilities to avoid redundancy.', { tools: ['web_search'], permissions: ['compute', 'web'], keywords: ['duplicate capability', 'overlap', 'redundancy', 'reuse'] }),
  ag('forge-versioning', 'Forge Versioning Agent', 'Q', 'Versions agents and capabilities with changelogs.', { tools: ['memory_search'], keywords: ['agent version', 'changelog', 'version bump', 'history'] }),
  ag('forge-health', 'Forge Health Agent', 'Q', 'Monitors the health of the whole agent system.', { tools: ['memory_search'], keywords: ['forge health', 'agent health', 'system health', 'status check'] }),
  ag('forge-governance', 'Forge Governance Agent', 'Q', 'Enforces policy and approval for new capabilities.', { tools: ['memory_search'], keywords: ['governance', 'policy approval', 'review gate'] }),

  // ── R · INFRASTRUCTURE / ORCHESTRATION (219-229) ──────────────────────────
  ag('agent-router', 'Agent Router', 'R', 'Routes every request to the owning agent and team with confidence.', { tools: ['memory_search'], keywords: ['route', 'router', 'which agent', 'dispatch', 'assign'] }),
  ag('scheduler', 'Scheduler Agent', 'R', 'Schedules recurring and one-off agent runs.', { tools: ['current_time'], keywords: ['schedule', 'cron', 'recurring', 'every day', 'at 9am'] }),
  ag('load-balancer', 'Load Balancer Agent', 'R', 'Distributes agent work to avoid hot spots.', { tools: ['memory_search'], keywords: ['load balance', 'distribute', 'queue', 'backlog'] }),
  ag('fallback', 'Fallback Agent', 'R', 'Selects fallback models and tools when the primary fails.', { tools: ['memory_search'], keywords: ['fallback', 'failover', 'backup model', 'degraded'] }),
  ag('cost-controller', 'Cost Controller Agent', 'R', 'Keeps model and tool spend within budget.', { tools: ['calculator'], keywords: ['cost', 'budget', 'tokens', 'spend', 'usage'] }),
  ag('latency-controller', 'Latency Controller Agent', 'R', 'Keeps responses fast and flags slow paths.', { tools: ['current_time'], keywords: ['latency', 'speed', 'slow response', 'delay', 'fast'] }),
  ag('observability', 'Observability Agent', 'R', 'Collects logs, metrics and traces for the agent system.', { tools: ['planner'], permissions: ['compute', 'data'], keywords: ['observability', 'logs', 'metrics', 'monitoring', 'traces'] }),
  ag('dependency-map', 'Agent Dependency Agent', 'R', 'Maps agent dependencies and keeps them satisfied.', { tools: ['memory_search'], keywords: ['dependency map', 'requires', 'agents depend'] }),
  ag('retry-policy', 'Retry Policy Agent', 'R', 'Applies backoff and retry policies to failing steps.', { tools: ['memory_search'], keywords: ['retry policy', 'backoff', 'retry logic', 'resilience'] }),
  ag('lifecycle', 'Agent Lifecycle Agent', 'R', 'Manages startup, update and shutdown of agent runtimes.', { tools: ['memory_search'], keywords: ['lifecycle', 'startup', 'shutdown', 'agent lifecycle'] }),
  ag('registry', 'Registry Agent', 'R', 'Maintains the agent catalog, versions and discoverability.', { tools: ['memory_search', 'memory_save'], permissions: ['compute', 'memory'], keywords: ['registry', 'agent list', 'catalog', 'find an agent'] }),
];
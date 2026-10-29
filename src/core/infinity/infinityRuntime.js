import { createId, readJson, writeJson } from "./storage.js";
import { getInfinityFeatures, INFINITY_FEATURE_COUNT } from "./infinityManifest.js";
import { getStorageAccountRevision } from './storage.js';
import { HEY_PAGES } from "../navigationCatalog.js";
import { getAllAgents } from "../../../agents/agents.js";
import { heyV1AgentCatalog } from "../../../agents/v1AgentCatalog.js";
import { recordAction, getActionTimeline, undoAction } from "./actionTimeline.js";
import { createMission, getMissions, setMissionPlan, setMissionProgress, setMissionState, requestMissionApproval, resolveMissionApproval } from "./missionEngine.js";
import { registerProvider, getProviders, routeProvider, executeWithFailover } from "./providerRouter.js";
import { getCapabilityHealthSnapshot, getCapabilityHealth, setCapabilityHealth, HEALTH } from "./capabilityHealth.js";
import { addInboxItem, getInboxItems, markInboxItem, clearInboxItem, routeProactiveSuggestion } from "./inboxEngine.js";
import { registerQualityValidator, runQualityGate } from "./qualityGate.js";
import { initWorldStyleEngine, getWorldStyle, setWorldStyle, setWorldWallpaper, clearWorldWallpaper, WORLD_PRESETS, exportWorldStyle, importWorldStyle, subscribeWorldStyle } from "./worldStyleEngine.js";

const KEYS = Object.freeze({
  commands: "hey_infinity_personal_commands",
  automations: "hey_infinity_automations",
  budgets: "hey_infinity_budgets",
  evidence: "hey_infinity_evidence",
  snapshots: "hey_infinity_snapshots",
  skills: "hey_infinity_skills",
  spaces: "hey_infinity_spaces",
  handoffs: "hey_infinity_handoffs",
  trust: "hey_infinity_trust_log",
  capabilities: "hey_infinity_capability_contracts",
});

function list(key) { const value = readJson(key, []); return Array.isArray(value) ? value : []; }
function writeList(key, value, max = 300) { if (!writeJson(key, value.slice(0, max))) throw new Error('Your changes could not be saved. Free storage and try again.'); return value; }
function upsert(key, item, max = 300) { const items = [item, ...list(key).filter((entry) => entry.id !== item.id)]; writeList(key, items, max); return item; }

const universalActions = new Map();

export function registerUniversalAction(input) {
  if (!input?.id || typeof input.run !== "function") throw new Error("Universal action needs id and run()");
  const action = { label: input.label || input.id, description: input.description || "", accepts: input.accepts || ["any"], risk: input.risk || "low", ...input };
  if (!['low', 'medium', 'high', 'critical'].includes(action.risk)) throw new Error('Invalid action risk.');
  universalActions.set(action.id, action);
  return () => universalActions.delete(action.id);
}

export function getUniversalActions(context = {}) {
  const type = context.type || "any";
  return Array.from(universalActions.values()).filter((action) => action.accepts.includes("any") || action.accepts.includes(type)).map(({ run: _run, ...safe }) => safe);
}

export async function runUniversalAction(id, context = {}, input = {}) {
  const action = universalActions.get(id);
  if (!action) return { ok: false, error: `Unknown action: ${id}` };
  if (['high', 'critical'].includes(action.risk) && input.approved !== true) return { ok: false, needsApproval: true, error: "This action needs explicit approval." };
  const revision = getStorageAccountRevision();
  if (input.signal?.aborted) return { ok: false, cancelled: true, error: 'Action cancelled.' };
  try {
    const result = await action.run(context, input);
    if (revision !== getStorageAccountRevision() || input.signal?.aborted) return { ok: false, requiresReconciliation: true, error: 'The active request changed before the action outcome was recorded.' };
    if (result?.ok === false || result?.success === false || result?.error) return { ok: false, error: result.error || "Action could not complete.", result };
    const prepared = typeof result?.path === 'string' && result.path.startsWith('/') && !result.path.startsWith('//') && !result.path.includes('\\');
    if (!prepared && result?.verified !== true) return { ok: false, requiresReconciliation: true, error: 'The action did not return verified execution evidence.', result };
    let warning;
    try { recordAction({ title: action.label, summary: input.instruction || "", category: "universal-action", status: prepared ? 'prepared' : 'completed', source: "Universal Actions", metadata: { actionId: id, contextType: context.type || "any" } }); }
    catch { warning = 'The result is available, but action history could not be saved.'; }
    return { ok: true, status: prepared ? 'prepared' : 'completed', verified: !prepared, result, warning };
  } catch (error) {
    return { ok: false, error: error?.message || "Action failed" };
  }
}

export function buildContextPack(input = {}) {
  const budget = input.budgetChars ?? 18000;
  if (!Number.isSafeInteger(budget) || budget < 1 || budget > 1000000) throw new Error('Context budget must be an integer between 1 and 1000000 characters.');
  const candidates = Array.isArray(input.items) ? input.items : [];
  const ranked = candidates
    .filter((item) => !item.private || input.allowPrivate === true)
    .map((item) => ({ ...item, _score: Number(item.relevance ?? .5) * 10 + (item.required ? 100 : 0) - (item.externalRisk ? 5 : 0) }))
    .sort((a, b) => b._score - a._score);
  const selected = [];
  const missingRequired = [];
  let used = 0;
  for (const item of ranked) {
    const serialized = String(item.content ?? item.summary ?? "");
    if (!serialized) continue;
    if (used + serialized.length > budget) { if (item.required) missingRequired.push(item.id || item.label || 'required-context'); continue; }
    selected.push({ ...item, content: serialized, _score: undefined });
    used += serialized.length;
  }
  return { ok: missingRequired.length === 0, selected, usedChars: used, budgetChars: budget, missingRequired, omitted: Math.max(0, candidates.length - selected.length) };
}

export function recordMemoryProvenance(input = {}) {
  return recordAction({ title: `Memory source: ${input.label || "context"}`, summary: input.summary || "", category: "memory-provenance", source: input.source || "conversation", metadata: { confidence: input.confidence ?? .7, sourceId: input.sourceId || null, scope: input.scope || "personal" } });
}

export function decidePrivacyRoute(input = {}) {
  const sensitivity = Number(input.sensitivity ?? .5);
  const localAvailable = input.localAvailable === true;
  const externalRequired = input.externalRequired === true;
  if (sensitivity >= .75 && localAvailable && !externalRequired) return { route: "local", reason: "Sensitive context stays local when a capable local path exists." };
  if (sensitivity >= .85 && !input.externalApproved) return { route: "approval", reason: "External processing needs explicit approval for highly sensitive context." };
  return { route: externalRequired ? "external" : (localAvailable ? "local-preferred" : "external"), reason: "Route selected from sensitivity and capability availability." };
}

export function savePrivateVaultDescriptor(input = {}) {
  const item = { id: input.id || createId("vault"), label: input.label || "Protected item", kind: input.kind || "metadata", localOnly: input.localOnly !== false, createdAt: new Date().toISOString() };
  recordAction({ title: `Vault item registered: ${item.label}`, category: "privacy", metadata: { vaultId: item.id, localOnly: item.localOnly } });
  return item;
}

export async function runAgentTeam(input = {}) {
  const agents = Array.isArray(input.agents) ? input.agents : [];
  if (!agents.length || typeof input.runner !== "function") return { ok: false, error: "Agent team and runner are required." };
  const parallel = input.parallel !== false;
  const execute = async (agent) => ({ agentId: agent.id || agent.name, result: await input.runner(agent, input.task) });
  try {
    const results = parallel ? await Promise.all(agents.map(execute)) : await agents.reduce(async (promise, agent) => [...await promise, await execute(agent)], Promise.resolve([]));
    return { ok: true, results };
  } catch (error) { return { ok: false, error: error?.message || "Agent team failed" }; }
}

export function turnThisInto(input = {}) {
  const sourceType = input.sourceType || "artifact";
  const targetType = input.targetType || "artifact";
  return { id: createId("transform"), sourceType, targetType, instruction: input.instruction || `Turn this ${sourceType} into ${targetType}`, status: "planned", createdAt: new Date().toISOString() };
}

export function compileAutomation(text, options = {}) {
  const source = String(text || "").trim();
  if (!source) throw new Error("Describe the automation first.");
  const lower = source.toLowerCase();
  const trigger = lower.includes("every morning") ? { type: "schedule", cadence: "daily", daypart: "morning" }
    : lower.includes("every evening") ? { type: "schedule", cadence: "daily", daypart: "evening" }
      : lower.includes("when ") ? { type: "condition", expression: source.slice(lower.indexOf("when ") + 5) }
        : { type: "manual" };
  const automation = { id: createId("auto"), title: options.title || source.slice(0, 72), source, trigger, actions: options.actions || [{ type: "hey-instruction", instruction: source }], approval: options.approval || "risk-based", shadowMode: options.shadowMode !== false, enabled: false, createdAt: new Date().toISOString() };
  return upsert(KEYS.automations, automation);
}
export function getAutomations() { return list(KEYS.automations); }

export function setActionBudget(input = {}) {
  const budget = { id: input.id || "default", dailyUsd: Math.max(0, Number(input.dailyUsd ?? 2)), maxExternalCalls: Math.max(0, Number(input.maxExternalCalls ?? 100)), autoApproveBelowUsd: Math.max(0, Number(input.autoApproveBelowUsd ?? .1)), maxRisk: input.maxRisk || "medium", updatedAt: new Date().toISOString() };
  return upsert(KEYS.budgets, budget, 20);
}
export function getActionBudgets() { return list(KEYS.budgets); }

export function createPersonalCommand(input = {}) {
  const phrase = String(input.phrase || "").trim();
  if (!phrase) throw new Error("Command phrase is required.");
  const command = { id: input.id || createId("cmd"), phrase, description: input.description || "", actions: Array.isArray(input.actions) ? input.actions : [], enabled: input.enabled !== false, createdAt: new Date().toISOString() };
  return upsert(KEYS.commands, command);
}
export function getPersonalCommands() { return list(KEYS.commands); }
export function resolvePersonalCommand(text) { const normalized = String(text || "").trim().toLowerCase(); return getPersonalCommands().find((command) => command.enabled && command.phrase.toLowerCase() === normalized) || null; }

export function createEvidenceWorkspace(input = {}) {
  const workspace = { id: input.id || createId("evidence"), title: input.title || "Research evidence", claims: [], sources: [], conflicts: [], createdAt: new Date().toISOString() };
  return upsert(KEYS.evidence, workspace);
}
export function addEvidenceClaim(workspaceId, claim = {}) { const items = list(KEYS.evidence); const index = items.findIndex((item) => item.id === workspaceId); if (index < 0) return null; items[index] = { ...items[index], claims: [...items[index].claims, { id: createId("claim"), confidence: claim.confidence ?? .5, ...claim }] }; writeList(KEYS.evidence, items); return items[index]; }
export function getEvidenceWorkspaces() { return list(KEYS.evidence); }

export function createSnapshot(label, state) { const snapshot = { id: createId("snap"), label: label || "HEY snapshot", state, createdAt: new Date().toISOString() }; return upsert(KEYS.snapshots, snapshot, 50); }
export function getSnapshots() { return list(KEYS.snapshots); }

export function createHandoff(input = {}) { const handoff = { id: createId("handoff"), title: input.title || "Continue in HEY", state: input.state || {}, target: input.target || "another-session", expiresAt: input.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), createdAt: new Date().toISOString() }; return upsert(KEYS.handoffs, handoff, 50); }
export function getHandoffs() { return list(KEYS.handoffs); }

export function createSharedSpace(input = {}) { const space = { id: createId("space"), title: input.title || "Shared Space", members: input.members || [], projectIds: input.projectIds || [], memoryScope: input.memoryScope || "space-only", createdAt: new Date().toISOString() }; return upsert(KEYS.spaces, space, 100); }
export function getSharedSpaces() { return list(KEYS.spaces); }

export function learnSkillCandidate(input = {}) { const skill = { id: input.id || createId("skill"), title: input.title || "Suggested skill", pattern: input.pattern || "", repetitions: Number(input.repetitions || 1), status: "suggested", createdAt: new Date().toISOString() }; return upsert(KEYS.skills, skill, 100); }
export function getSkillCandidates() { return list(KEYS.skills); }

export function registerCapabilityContract(input = {}) { if (!input.id) throw new Error("Capability id is required"); const contract = { id: input.id, title: input.title || input.id, inputs: input.inputs || [], outputs: input.outputs || [], permissions: input.permissions || [], estimatedCost: input.estimatedCost ?? 0, risk: input.risk || "low", platforms: input.platforms || ["web"], providers: input.providers || [], failureModes: input.failureModes || [], fallbacks: input.fallbacks || [], updatedAt: new Date().toISOString() }; return upsert(KEYS.capabilities, contract, 1000); }
export function getCapabilityContracts() { return list(KEYS.capabilities); }

export function logTrustEvent(input = {}) { const event = { id: createId("trust"), title: input.title || "HEY trust event", dataRoute: input.dataRoute || "local", providers: input.providers || [], permissions: input.permissions || [], explanation: input.explanation || "", createdAt: new Date().toISOString() }; return upsert(KEYS.trust, event, 500); }
export function getTrustLog() { return list(KEYS.trust); }

export function buildExplainHEY(input = {}) {
  return {
    provider: input.provider || null,
    agents: input.agents || [],
    tools: input.tools || [],
    permissions: input.permissions || [],
    sources: input.sources || [],
    cost: input.cost ?? null,
    reason: input.reason || "HEY selected the lowest-risk compatible path available from the supplied context.",
  };
}

export async function runResultCouncil(input = {}) {
  const candidates = Array.isArray(input.candidates) ? input.candidates : [];
  if (!candidates.length || typeof input.executor !== "function") return { ok: false, error: "Candidates and executor are required." };
  const outputs = await Promise.all(candidates.map(async (candidate) => ({ candidate, output: await input.executor(candidate, input.prompt) })));
  if (typeof input.judge !== "function") return { ok: true, outputs, winner: outputs[0] || null };
  const winner = await input.judge(outputs, input.prompt);
  return { ok: true, outputs, winner };
}

export function createScreenUnderstandingRequest(input = {}) { return { id: createId("screen"), image: input.image || null, question: input.question || "What am I looking at?", allowedActions: input.allowedActions || [], requiresCapturePermission: true, createdAt: new Date().toISOString() }; }
export function createMeetingIntelligenceRequest(input = {}) { return { id: createId("meeting"), transcript: input.transcript || "", mediaRef: input.mediaRef || null, outputs: input.outputs || ["summary", "tasks", "decisions", "timestamps"], consentRequired: true, createdAt: new Date().toISOString() }; }
export function createBrowserCompanionRequest(input = {}) { return { id: createId("browser"), url: input.url || "", title: input.title || "", selectedText: input.selectedText || "", pageText: input.pageText || "", actions: input.actions || [], createdAt: new Date().toISOString() }; }

export function getCostObservatory() {
  const providers = getProviders();
  return { providers, budgets: getActionBudgets(), generatedAt: new Date().toISOString() };
}

export function getSemanticSearchCorpus() {
  return [
    ...HEY_PAGES,
    ...Array.from(new Map([...heyV1AgentCatalog, ...getAllAgents()].map(item => [item.id, item])).values()).map(item => ({ type: "agent", id: item.id, title: item.name, text: `${item.name} ${item.description || ''} ${(item.capabilities || []).join(' ')}`, path: '/agents' })),
    ...getAutomations().map(item => ({ type: 'automation', id: item.id, title: item.title, text: `${item.title} ${item.source}`, path: '/missions' })),
    ...getMissions().map((item) => ({ type: "mission", id: item.id, title: item.title, text: `${item.title} ${item.goal}` })),
    ...getInboxItems().map((item) => ({ type: "inbox", id: item.id, title: item.title, text: `${item.title} ${item.body}` })),
    ...getPersonalCommands().map((item) => ({ type: "command", id: item.id, title: item.phrase, text: `${item.phrase} ${item.description}` })),
    ...getInfinityFeatures().map((item) => ({ type: "capability", id: item.id, title: item.title, text: `${item.title} ${item.summary}` })),
  ];
}

export function searchEverything(query) {
  const terms = String(query || "").toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return getSemanticSearchCorpus().map((entry) => ({ ...entry, path: entry.path || ({ mission: '/missions', inbox: '/inbox', command: '/forge', capability: '/capabilities' }[entry.type]), score: terms.reduce((score, term) => score + (entry.text.toLowerCase().includes(term) ? 1 : 0), 0) + (entry.title.toLowerCase() === String(query).toLowerCase() ? 5 : 0) })).filter((entry) => entry.score > 0).sort((a, b) => b.score - a.score).slice(0, 50);
}

export function getInfinitySnapshot() {
  return {
    featureCount: INFINITY_FEATURE_COUNT,
    features: getInfinityFeatures(),
    missions: getMissions(),
    inbox: getInboxItems(),
    actions: getActionTimeline().slice(0, 50),
    providers: getProviders(),
    health: getCapabilityHealthSnapshot(),
    world: getWorldStyle(),
    budgets: getActionBudgets(),
    commands: getPersonalCommands(),
    automations: getAutomations(),
  };
}

export async function installInfinityRuntime() {
  await initWorldStyleEngine();
  if (!getActionBudgets().length) setActionBudget({ dailyUsd: 2, maxExternalCalls: 100, autoApproveBelowUsd: .05, maxRisk: "medium" });
  if (!getCapabilityContracts().length) {
    registerCapabilityContract({ id: "media.edit", title: "Media editing", inputs: ["video", "audio", "image", "instruction"], outputs: ["media"], permissions: ["file-read", "file-write"], risk: "low", platforms: ["web", "desktop"], failureModes: ["unsupported-codec", "memory-pressure"], fallbacks: ["cloud-render-adapter"] });
    registerCapabilityContract({ id: "computer.control", title: "Computer control", inputs: ["screen-state", "instruction"], outputs: ["actions"], permissions: ["computer-control"], risk: "high", platforms: ["desktop"], failureModes: ["permission-denied", "target-not-found"], fallbacks: ["guided-instructions"] });
  }
  registerUniversalAction({ id: 'summarize', label: 'Summarize in HEY', description: 'Open a draft to review and send in chat.', accepts: ['any'], run: async (context, input) => ({ path: '/chat', draft: 'Summarize: ' + (context.selectedText || input.instruction || context.url || '') }) });
  registerUniversalAction({ id: 'turn-into', label: 'Open media editor', description: 'Choose a file and editing instructions.', accepts: ['any'], run: async () => ({ path: '/media' }) });
  registerUniversalAction({ id: 'add-project', label: 'Open Projects', description: 'Choose a project to add your work.', accepts: ['any'], run: async () => ({ path: '/projects' }) });
  registerUniversalAction({ id: 'create-task', label: 'Open Tasks', description: 'Create and review a task.', accepts: ['any'], run: async () => ({ path: '/tasks' }) });
  registerUniversalAction({ id: 'research', label: 'Plan research mission', description: 'Prepare a research goal before execution.', accepts: ['any'], run: async (context, input) => { const mission = createMission({ title: 'Research: ' + (input.instruction || context.title || 'New topic'), goal: input.instruction || context.selectedText || 'Describe the research topic before running.' }); return { path: '/missions', missionId: mission.id }; } });
  if (typeof window !== "undefined") {
    window.HEY_INFINITY = {
      getSnapshot: getInfinitySnapshot,
      createMission,
      setMissionPlan,
      setMissionProgress,
      setMissionState,
      requestMissionApproval,
      resolveMissionApproval,
      runUniversalAction,
      getUniversalActions,
      registerProvider,
      routeProvider,
      executeWithFailover,
      runQualityGate,
      setCapabilityHealth,
      getCapabilityHealth,
      addInboxItem,
      routeProactiveSuggestion,
      createSnapshot,
      searchEverything,
    };
    window.addEventListener("beforeunload", () => {
      const running = getMissions().filter((mission) => ["running", "waiting-approval"].includes(mission.state));
      if (running.length) createSnapshot("Automatic mission checkpoint", { missions: running });
    });
  }
  return getInfinitySnapshot();
}

export {
  createMission, getMissions, setMissionPlan, setMissionProgress, setMissionState, requestMissionApproval, resolveMissionApproval,
  registerProvider, getProviders, routeProvider, executeWithFailover,
  getCapabilityHealthSnapshot, getCapabilityHealth, setCapabilityHealth, HEALTH,
  addInboxItem, getInboxItems, markInboxItem, clearInboxItem, routeProactiveSuggestion,
  registerQualityValidator, runQualityGate,
  recordAction, getActionTimeline, undoAction,
  getWorldStyle, setWorldStyle, setWorldWallpaper, clearWorldWallpaper, WORLD_PRESETS, exportWorldStyle, importWorldStyle, subscribeWorldStyle,
  getInfinityFeatures,
};




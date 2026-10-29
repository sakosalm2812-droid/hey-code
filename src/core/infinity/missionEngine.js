import { createId, readJson, writeJson, setStorageAccount, subscribeStorageAccount } from "./storage.js";
import { recordAction } from "./actionTimeline.js";
import { addInboxItem } from "./inboxEngine.js";

let scopeRevision = 0;
const KEY = 'hey_infinity_missions';
const listeners = new Set();
const STATES = new Set(["draft", "planned", "running", "waiting-approval", "paused", "recovering", "completed", "failed", "cancelled"]);
const activeRuns = new Set();
const controllers = new Map();
const TRANSITIONS = {
  draft: ['planned', 'running', 'failed', 'cancelled'],
  planned: ['running', 'failed', 'cancelled'],
  running: ['waiting-approval', 'paused', 'completed', 'failed', 'cancelled'],
  'waiting-approval': ['paused', 'cancelled'],
  paused: ['running', 'failed', 'cancelled'],
  recovering: ['paused', 'failed', 'cancelled'],
  failed: ['running', 'paused', 'cancelled'],
  completed: [], cancelled: [],
};

function validatePlan(plan) {
  if (!Array.isArray(plan) || plan.length > 100 || plan.some(step => !step || typeof step !== 'object' || typeof (step.instruction || step.title) !== 'string' || !(step.instruction || step.title).trim())) throw new Error('A plan needs up to 100 steps with an instruction or title.');
  return plan;
}

export function setMissionAccount(userId) {
  setStorageAccount(userId);
}
subscribeStorageAccount(() => {
  for (const controller of controllers.values()) controller.abort();
  scopeRevision++;
  const items = read();
  listeners.forEach(listener => { try { listener(items); } catch { /* view isolation */ } });
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('hey:mission-change'));
});

function read() { const value = readJson(KEY, []); return Array.isArray(value) ? value : []; }
function save(items) {
  if (!writeJson(KEY, items.slice(0, 100))) throw new Error('Mission checkpoint could not be saved. Free storage before continuing.');
  listeners.forEach((listener) => {
    try { listener(items); } catch { /* A view listener cannot invalidate a saved checkpoint. */ }
  });
}
function update(id, patch) {
  const items = read();
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) return null;
  const next = { ...items[index], ...patch, updatedAt: new Date().toISOString() };
  items[index] = next;
  save(items);
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("hey:mission-change", { detail: next }));
  return next;
}

export function createMission(input = {}) {
  const now = new Date().toISOString();
  const mission = {
    id: input.id || createId("mission"),
    title: input.title || "New mission",
    goal: input.goal || input.title || "",
    state: "planned",
    progress: 0,
    plan: validatePlan(input.plan ?? []),
    currentStep: 0,
    approvals: [],
    outputs: [],
    context: input.context || {},
    createdAt: now,
    updatedAt: now,
  };
  save([mission, ...read().filter((item) => item.id !== mission.id)]);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('hey:mission-change', { detail: mission }));
  try { recordAction({ title: `Created mission: ${mission.title}`, category: "mission", metadata: { missionId: mission.id } }); } catch { /* The mission itself is already durably saved. */ }
  return mission;
}

export function getMissions() { return read(); }
export function getMission(id) { return read().find((mission) => mission.id === id) || null; }
export function setMissionState(id, state, detail = "") {
  if (!STATES.has(state)) throw new Error(`Invalid mission state: ${state}`);
  const current = getMission(id);
  if (!current) return null;
  if (state !== current.state && !TRANSITIONS[current.state]?.includes(state)) throw new Error(`Cannot move a ${current.state} mission to ${state}.`);
  if (state === 'running' && !activeRuns.has(id)) throw new Error('Use the mission runner to resume work.');
  if (state === 'completed' && (current.inFlight || current.currentStep !== Math.max(1, current.plan.length) || !Array.from({ length: Math.max(1, current.plan.length) }, (_, step) => step).every(step => current.outputs.some(output => output.step === step && output.verified === true)))) throw new Error('Every planned step needs a verified output before completion.');
  const mission = update(id, { state, detail });
  if (state === 'cancelled') controllers.get(id)?.abort();
  if (["completed", "failed"].includes(state)) {
    try { addInboxItem({ title: state === "completed" ? `Mission complete: ${mission.title}` : `Mission needs attention: ${mission.title}`, body: detail, importance: state === "failed" ? 2 : 1, category: state, path: '/missions', metadata: { missionId: id } }); } catch { /* A notification failure cannot change the durable execution outcome. */ }
  }
  return mission;
}
export function setMissionPlan(id, plan) {
  validatePlan(plan);
  const mission = getMission(id);
  if (!mission) return null;
  if (mission.inFlight || activeRuns.has(id) || mission.currentStep > 0 || ['completed', 'cancelled'].includes(mission.state)) throw new Error('Create a new mission to replace work that has already started.');
  return update(id, { plan, currentStep: 0, progress: 0 });
}
export function setMissionProgress(id, progress, currentStep = null) {
  if (typeof progress !== 'number' || !Number.isFinite(progress) || progress < 0 || progress > 100) throw new Error('Progress must be between 0 and 100.');
  if (currentStep != null && currentStep !== getMission(id)?.currentStep) throw new Error('Only a saved execution receipt can advance a step.');
  return update(id, { progress });
}
export function addMissionOutput(id, output) { const mission = getMission(id); if (!mission) return null; return update(id, { outputs: [...(mission.outputs || []), { ...output, createdAt: new Date().toISOString() }] }); }
export function requestMissionApproval(id, approval) { const mission = getMission(id); if (!mission) return null; const request = { ...approval, id: createId("approval"), status: "pending", createdAt: new Date().toISOString() }; return update(id, { state: "waiting-approval", approvals: [...(mission.approvals || []), request] }); }
export function resolveMissionApproval(id, approvalId, status, note = "") { const mission = getMission(id); if (!mission) return null; if (!['approved', 'rejected'].includes(status)) throw new Error('Invalid approval decision'); if (!(mission.approvals || []).some(item => item.id === approvalId && item.status === 'pending')) throw new Error('Approval is not pending'); const approvals = (mission.approvals || []).map((approval) => approval.id === approvalId ? { ...approval, status, note, resolvedAt: new Date().toISOString() } : approval); return update(id, { approvals, state: "paused" }); }
export function subscribeMissions(listener) { listeners.add(listener); return () => listeners.delete(listener); }

export function reconcileMissionStep(id, outcome, evidence) {
  const mission = getMission(id);
  if (!mission?.inFlight || activeRuns.has(id)) throw new Error('Only an interrupted action can be reviewed.');
  if (!['completed', 'not-executed'].includes(outcome)) throw new Error('Choose an explicit outcome.');
  if (typeof evidence !== 'string' || evidence.trim().length < 10 || evidence.length > 4000) throw new Error('Record what you checked, including the external receipt or state.');
  const review = { ...mission.inFlight, outcome, evidence: evidence.trim(), source: 'user-review', reviewedAt: new Date().toISOString() };
  const patch = { inFlight: null, state: 'paused', detail: 'External state reviewed. Resume when ready.', reviews: [...(mission.reviews || []), review] };
  if (outcome === 'completed') {
    patch.currentStep = mission.inFlight.step + 1;
    patch.progress = Math.round(patch.currentStep / Math.max(1, mission.plan.length) * 100);
    patch.outputs = [...mission.outputs, { text: evidence.trim(), step: mission.inFlight.step, verified: true, verificationSource: 'user-review', createdAt: review.reviewedAt }];
  }
  return update(id, patch);
}

// A mission advances only when its runner returns a verified output.
export async function executeMission(id, runner) {
  let mission = getMission(id);
  if (!mission) return { ok: false, error: 'Mission not found.' };
  if (activeRuns.has(id)) return { ok: false, error: 'Mission is already executing.' };
  if (['completed', 'cancelled'].includes(mission.state)) return { ok: false, error: 'This mission has ended.' };
  if (mission.inFlight) {
    const error = 'An interrupted action may have completed. Review its external state before repeating it.';
    setMissionState(id, 'paused', error);
    return { ok: false, requiresReconciliation: true, error };
  }
  if ((mission.approvals || []).some(item => item.status === 'pending')) return { ok: false, error: 'Review the pending approval first.' };
  if (typeof runner !== 'function') { setMissionState(id, 'failed', 'No compatible mission runner is configured.'); return { ok: false, error: 'Runner required.' }; }
  activeRuns.add(id);
  const controller = new AbortController();
  controllers.set(id, controller);
  const runRevision = scopeRevision;
  const steps = mission.plan.length ? mission.plan : [{ instruction: mission.goal }];
  try {
    setMissionState(id, 'running', 'Executing the mission through HEY.');
    for (let index = mission.currentStep || 0; index < steps.length; index++) {
      if (getMission(id).state !== 'running') return { ok: false, state: getMission(id).state };
      update(id, { inFlight: { step: index, requestId: createId('request'), startedAt: new Date().toISOString() } });
      const result = await runner(steps[index], getMission(id), { signal: controller.signal });
      if (scopeRevision !== runRevision) return { ok: false, state: 'cancelled', error: 'The active account changed.' };
      if (getMission(id).state === 'cancelled') return { ok: false, state: 'cancelled' };
      if (result?.needsApproval) { update(id, { inFlight: null }); requestMissionApproval(id, { title: result.message || 'Review this action', instruction: steps[index].instruction || mission.goal, approvalRequest: result.approvalRequest || null }); return { ok: false, needsApproval: true }; }
      if (result?.ok !== true || result.verified !== true || typeof result.output !== 'string' || !result.output.trim() || typeof result.verificationSource !== 'string' || !result.verificationSource.trim()) throw new Error(result?.error || 'The runner did not return a verified output.');
      const current = getMission(id);
      update(id, {
        outputs: [...current.outputs, { text: result.output, step: index, verified: true, verificationSource: result.verificationSource, requestId: current.inFlight.requestId, createdAt: new Date().toISOString() }],
        progress: Math.round((index + 1) / steps.length * 100), currentStep: index + 1, inFlight: null,
      });
      if (getMission(id).state !== 'running') return { ok: false, state: getMission(id).state };
    }
    setMissionState(id, 'completed', 'The requested steps returned outputs. Review the result below.');
    return { ok: true, mission: getMission(id) };
  } catch (error) {
    if (scopeRevision !== runRevision) return { ok: false, state: 'cancelled', error: 'The active account changed.' };
    if (!['cancelled', 'paused'].includes(getMission(id)?.state)) {
      try { setMissionState(id, 'failed', error.message || 'Mission failed.'); }
      catch { /* Keep the last durable checkpoint when storage is unavailable. */ }
    }
    return { ok: false, error: error.message || 'Mission failed.' };
  } finally { activeRuns.delete(id); controllers.delete(id); }
}
export function recoverInterruptedMissions() {
  for (const mission of getMissions()) if (['running', 'recovering'].includes(mission.state) && !activeRuns.has(mission.id)) setMissionState(mission.id, 'paused', mission.inFlight ? 'HEY restarted during an action. Its outcome is uncertain. Review the external state before repeating it.' : 'HEY restarted. Review outputs and resume from the last checkpoint.');
}

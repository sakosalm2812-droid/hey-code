import { createId, readJson, writeJson } from "./storage.js";
import { recordAction } from "./actionTimeline.js";
import { addInboxItem } from "./inboxEngine.js";

const KEY = "hey_infinity_missions";
const listeners = new Set();
const STATES = new Set(["draft", "planned", "running", "waiting-approval", "paused", "recovering", "completed", "failed", "cancelled"]);
const activeRuns = new Set();

function read() { const value = readJson(KEY, []); return Array.isArray(value) ? value : []; }
function save(items) { writeJson(KEY, items.slice(0, 100)); listeners.forEach((listener) => listener(items)); }
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
    plan: Array.isArray(input.plan) ? input.plan : [],
    currentStep: 0,
    approvals: [],
    outputs: [],
    context: input.context || {},
    createdAt: now,
    updatedAt: now,
  };
  save([mission, ...read().filter((item) => item.id !== mission.id)]);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('hey:mission-change', { detail: mission }));
  recordAction({ title: `Created mission: ${mission.title}`, category: "mission", metadata: { missionId: mission.id } });
  return mission;
}

export function getMissions() { return read(); }
export function getMission(id) { return read().find((mission) => mission.id === id) || null; }
export function setMissionState(id, state, detail = "") { if (!STATES.has(state)) throw new Error(`Invalid mission state: ${state}`); const current = getMission(id); if (state === 'completed' && !current?.outputs?.length) throw new Error('A mission needs an actual output before completion.'); const mission = update(id, { state, detail }); if (mission && ["completed", "failed"].includes(state)) addInboxItem({ title: state === "completed" ? `Mission complete: ${mission.title}` : `Mission needs attention: ${mission.title}`, body: detail, importance: state === "failed" ? 2 : 1, category: state, path: '/missions', metadata: { missionId: id } }); return mission; }
export function setMissionPlan(id, plan) { return update(id, { plan: Array.isArray(plan) ? plan : [], currentStep: 0, progress: 0 }); }
export function setMissionProgress(id, progress, currentStep = null) { const patch = { progress: Math.max(0, Math.min(100, Number(progress || 0))) }; if (currentStep != null) patch.currentStep = currentStep; return update(id, patch); }
export function addMissionOutput(id, output) { const mission = getMission(id); if (!mission) return null; return update(id, { outputs: [...(mission.outputs || []), { ...output, createdAt: new Date().toISOString() }] }); }
export function requestMissionApproval(id, approval) { const mission = getMission(id); if (!mission) return null; const request = { ...approval, id: createId("approval"), status: "pending", createdAt: new Date().toISOString() }; return update(id, { state: "waiting-approval", approvals: [...(mission.approvals || []), request] }); }
export function resolveMissionApproval(id, approvalId, status, note = "") { const mission = getMission(id); if (!mission) return null; if (!['approved', 'rejected'].includes(status)) throw new Error('Invalid approval decision'); if (!(mission.approvals || []).some(item => item.id === approvalId && item.status === 'pending')) throw new Error('Approval is not pending'); const approvals = (mission.approvals || []).map((approval) => approval.id === approvalId ? { ...approval, status, note, resolvedAt: new Date().toISOString() } : approval); return update(id, { approvals, state: "paused" }); }
export function subscribeMissions(listener) { listeners.add(listener); return () => listeners.delete(listener); }

// A mission advances only when its runner returns a verified output.
export async function executeMission(id, runner) {
  let mission = getMission(id);
  if (!mission) return { ok: false, error: 'Mission not found.' };
  if (activeRuns.has(id)) return { ok: false, error: 'Mission is already executing.' };
  if (['completed', 'cancelled'].includes(mission.state)) return { ok: false, error: 'This mission has ended.' };
  if ((mission.approvals || []).some(item => item.status === 'pending')) return { ok: false, error: 'Review the pending approval first.' };
  if (typeof runner !== 'function') { setMissionState(id, 'failed', 'No compatible mission runner is configured.'); return { ok: false, error: 'Runner required.' }; }
  activeRuns.add(id);
  const steps = mission.plan.length ? mission.plan : [{ instruction: mission.goal }];
  setMissionState(id, 'running', 'Executing the mission through HEY.');
  try {
    for (let index = mission.currentStep || 0; index < steps.length; index++) {
      if (getMission(id).state !== 'running') return { ok: false, state: getMission(id).state };
      const result = await runner(steps[index], getMission(id));
      if (getMission(id).state === 'cancelled') return { ok: false, state: 'cancelled' };
      if (result?.needsApproval) { requestMissionApproval(id, { title: result.message || 'Review this action', instruction: steps[index].instruction || mission.goal }); return { ok: false, needsApproval: true }; }
      if (!result?.ok || !result.output) throw new Error(result?.error || 'The runner did not return a verified output.');
      addMissionOutput(id, { text: result.output, step: index });
      setMissionProgress(id, Math.round((index + 1) / steps.length * 100), index + 1);
      if (getMission(id).state !== 'running') return { ok: false, state: getMission(id).state };
    }
    setMissionState(id, 'completed', 'The requested steps returned outputs. Review the result below.');
    return { ok: true, mission: getMission(id) };
  } catch (error) {
    if (!['cancelled', 'paused'].includes(getMission(id)?.state)) setMissionState(id, 'failed', error.message || 'Mission failed.');
    return { ok: false, error: error.message || 'Mission failed.' };
  } finally { activeRuns.delete(id); }
}
export function recoverInterruptedMissions() {
  for (const mission of getMissions()) if (['running', 'recovering'].includes(mission.state) && !activeRuns.has(mission.id)) setMissionState(mission.id, 'paused', 'HEY restarted. Review outputs and resume from the last checkpoint.');
}

import { useEffect, useMemo, useState } from "react";
import { Activity, Pause, Play, Plus, Search, ShieldCheck, Sparkles, Target } from "lucide-react";
import { executeMission, recoverInterruptedMissions, resolveMissionApproval, subscribeMissions } from '../core/infinity/missionEngine.js';
import { askHEY } from '../lib/heyAI.js';
import { createMission, getCapabilityHealthSnapshot, getInfinityFeatures, getMissions, setMissionState } from "../core/infinity/infinityRuntime.js";
import styles from "./MissionControl.module.css";
import MissionReconciliation from "../components/MissionReconciliation.jsx";
import AutomationRecoveryPanel from '../components/AutomationRecoveryPanel.jsx';
import { useAuth } from "../AuthContext.jsx";
import { issueExecutionApproval } from "../core/executionAuthorization.js";
import { requestNativeExecutionApproval } from "../lib/tauriAdapter.js";

export default function MissionControl() {
  const [missions, setMissions] = useState(getMissions);
  const [goal, setGoal] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const { user } = useAuth();
  useEffect(() => { recoverInterruptedMissions(); setMissions(getMissions()); return subscribeMissions(setMissions); }, []);
  async function run(id, approval = null) {
    setError("");
    const result = await executeMission(id, async (step, mission, { signal }) => {
      let execution;
      const output = await askHEY(step.instruction || step.title || mission.goal, { signal, approval, requestId: approval?.binding?.workflow?.executionRequestId || mission.inFlight?.requestId || null, workflow: { id: mission.id, stepId: String(mission.currentStep), index: mission.currentStep }, onExecutionResult: value => { execution = value; } });
      if (execution?.status === 'permission_required') return { needsApproval: true, message: output, approvalRequest: execution.result?.approvalRequest || null };
      if (execution?.handled && execution.status !== 'completed' && execution.status !== 'success') return { ok: false, error: output };
      if (execution?.handled && execution.verified !== true) return { ok: false, error: 'The action did not produce verified execution evidence.' };
      return { ok: true, output, verified: typeof output === 'string' && !!output.trim(), verificationSource: execution?.handled ? 'execution-receipt' : 'provider-response' };
    });
    if (!result.ok && result.error) setError(result.error);
  }
  async function approve(mission, missionApproval) {
    try {
      const request = missionApproval.approvalRequest;
      if (!request) throw new Error("This approval is missing its exact action details. Run the mission step again to request a fresh review.");
      const nativeApproval = request.binding.environment === "tauri-desktop" ? await requestNativeExecutionApproval(request.binding) : null;
      const ticket = issueExecutionApproval(request, {
        nativeApproval,
        actorId: user?.id || null,
        sessionId: request.binding.actor.sessionId,
        environment: request.binding.environment,
      });
      resolveMissionApproval(mission.id, missionApproval.id, 'approved');
      await run(mission.id, ticket);
    } catch (approvalError) {
      setError(approvalError instanceof Error ? approvalError.message : "HEY could not approve that action.");
    }
  }
  const features = useMemo(() => getInfinityFeatures().filter((feature) => !query || `${feature.title} ${feature.summary} ${feature.category}`.toLowerCase().includes(query.toLowerCase())), [query]);
  const health = getCapabilityHealthSnapshot();
  function create() { if (!goal.trim()) return; createMission({ title: goal.trim().slice(0, 72), goal: goal.trim() }); setGoal(""); setMissions(getMissions()); }
  function state(id, next) { setMissionState(id, next); setMissions(getMissions()); }
  return <main className={styles.page}>{error && <p role="alert">{error}</p>}
    <AutomationRecoveryPanel />
    <header className={styles.hero}><span><Target size={15} /> Mission Control</span><h1>Give HEY the outcome. Keep control of the work.</h1><p>Long-running work, approvals, health, capability discovery and the full Infinity feature layer in one command center.</p><div className={styles.create}><input value={goal} onChange={(e) => setGoal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && create()} placeholder="e.g. Prepare the strongest launch package for HEY…" /><button onClick={create}><Plus size={16} /> Plan mission</button></div></header>
    <section className={styles.stats}><div><Target /><b>{missions.filter((m) => m.state === "running").length}</b><span>Running</span></div><div><ShieldCheck /><b>{health.filter((h) => h.state === "ready").length}</b><span>Healthy capabilities</span></div><div><Sparkles /><b>{getInfinityFeatures().length}</b><span>Infinity systems</span></div></section>
    <section className={styles.missions}>{missions.length ? missions.map((mission) => <article key={mission.id}><div><small>{mission.state}</small><h3>{mission.title}</h3><p>{mission.goal}</p><p role="status">{mission.detail}</p><MissionReconciliation mission={mission} />{mission.outputs?.map((output, index) => <details key={index}><summary>Step {index + 1} result</summary><pre className={styles.output}>{output.text}</pre></details>)}{mission.approvals?.filter(approval => approval.status === 'pending').map(approval => <div key={approval.id}><p>{approval.title}</p>{approval.approvalRequest?.binding && <details open><summary>Exact action details</summary><p>{approval.approvalRequest.binding.action.capability} · {approval.approvalRequest.binding.permission} · {approval.approvalRequest.binding.riskLevel}</p><p>Target: {JSON.stringify(approval.approvalRequest.binding.target)}</p><pre className={styles.output}>{JSON.stringify(approval.approvalRequest.binding.parameters, null, 2)}</pre></details>}<button onClick={() => approve(mission, approval)}>Approve and run this action</button><button onClick={() => resolveMissionApproval(mission.id, approval.id, 'rejected')}>Reject</button></div>)}<div className={styles.progress}><span style={{ width: `${mission.progress || 0}%` }} /></div></div><div className={styles.missionActions}>{mission.state === "running" ? <button onClick={() => state(mission.id, "paused")}><Pause size={14} /> Pause</button> : <button disabled={['completed', 'cancelled', 'waiting-approval'].includes(mission.state)} onClick={() => run(mission.id)}><Play size={14} /> {mission.state === 'planned' || mission.state === 'draft' ? 'Run' : 'Resume'}</button>}<button disabled={['completed', 'cancelled'].includes(mission.state)} onClick={() => { setMissionState(mission.id, 'cancelled', 'Further steps cancelled. An in-flight external action may still finish.'); setMissions(getMissions()); }}>Cancel</button></div></article>) : <div className={styles.empty}><Activity size={28} /><h3>No missions yet</h3><p>Start one above. HEY will keep the goal, state and checkpoints persistent.</p></div>}</section>
    <section className={styles.capabilities}><div className={styles.capHead}><div><small>INFINITY LAYER</small><h2>Everything HEY can orchestrate</h2></div><label><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search capabilities" /></label></div><div className={styles.featureGrid}>{features.map((feature) => <article key={feature.id}><span>{feature.category}</span><h3>{feature.title}</h3><p>{feature.summary}</p></article>)}</div></section>
  </main>;
}

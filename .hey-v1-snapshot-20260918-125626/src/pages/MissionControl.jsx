import { useEffect, useMemo, useState } from "react";
import { Activity, Pause, Play, Plus, Search, ShieldCheck, Sparkles, Target } from "lucide-react";
import { executeMission, recoverInterruptedMissions, resolveMissionApproval, subscribeMissions } from '../core/infinity/missionEngine.js';
import { askHEY } from '../lib/heyAI.js';
import { createMission, getCapabilityHealthSnapshot, getInfinityFeatures, getMissions, setMissionState } from "../core/infinity/infinityRuntime.js";
import styles from "./MissionControl.module.css";

export default function MissionControl() {
  const [missions, setMissions] = useState(getMissions);
  const [goal, setGoal] = useState("");
  const [query, setQuery] = useState("");
  useEffect(() => { recoverInterruptedMissions(); setMissions(getMissions()); return subscribeMissions(setMissions); }, []);
  async function run(id, confirmed = false) {
    const approvedStep = getMissions().find(item => item.id === id)?.currentStep;
    await executeMission(id, async (step, mission) => {
      let execution;
      const output = await askHEY(step.instruction || step.title || mission.goal, { confirmed: confirmed && mission.currentStep === approvedStep, onExecutionResult: value => { execution = value; } });
      if (execution?.status === 'permission_required') return { needsApproval: true, message: output };
      if (execution?.handled && execution.status !== 'completed' && execution.status !== 'success') return { ok: false, error: output };
      return { ok: true, output };
    });
  }
  function approve(mission, approval) { resolveMissionApproval(mission.id, approval.id, 'approved'); run(mission.id, true); }
  const features = useMemo(() => getInfinityFeatures().filter((feature) => !query || `${feature.title} ${feature.summary} ${feature.category}`.toLowerCase().includes(query.toLowerCase())), [query]);
  const health = getCapabilityHealthSnapshot();
  function create() { if (!goal.trim()) return; createMission({ title: goal.trim().slice(0, 72), goal: goal.trim() }); setGoal(""); setMissions(getMissions()); }
  function state(id, next) { setMissionState(id, next); setMissions(getMissions()); }
  return <main className={styles.page}>
    <header className={styles.hero}><span><Target size={15} /> Mission Control</span><h1>Give HEY the outcome. Keep control of the work.</h1><p>Long-running work, approvals, health, capability discovery and the full Infinity feature layer in one command center.</p><div className={styles.create}><input value={goal} onChange={(e) => setGoal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && create()} placeholder="e.g. Prepare the strongest launch package for HEY…" /><button onClick={create}><Plus size={16} /> Plan mission</button></div></header>
    <section className={styles.stats}><div><Target /><b>{missions.filter((m) => m.state === "running").length}</b><span>Running</span></div><div><ShieldCheck /><b>{health.filter((h) => h.state === "ready").length}</b><span>Healthy capabilities</span></div><div><Sparkles /><b>{getInfinityFeatures().length}</b><span>Infinity systems</span></div></section>
    <section className={styles.missions}>{missions.length ? missions.map((mission) => <article key={mission.id}><div><small>{mission.state}</small><h3>{mission.title}</h3><p>{mission.goal}</p><p role="status">{mission.detail}</p>{mission.outputs?.map((output, index) => <details key={index}><summary>Step {index + 1} result</summary><pre className={styles.output}>{output.text}</pre></details>)}{mission.approvals?.filter(approval => approval.status === 'pending').map(approval => <div key={approval.id}><p>{approval.title}</p><button onClick={() => approve(mission, approval)}>Approve and run this action</button><button onClick={() => resolveMissionApproval(mission.id, approval.id, 'rejected')}>Reject</button></div>)}<div className={styles.progress}><span style={{ width: `${mission.progress || 0}%` }} /></div></div><div className={styles.missionActions}>{mission.state === "running" ? <button onClick={() => state(mission.id, "paused")}><Pause size={14} /> Pause</button> : <button disabled={['completed', 'cancelled', 'waiting-approval'].includes(mission.state)} onClick={() => run(mission.id)}><Play size={14} /> {mission.state === 'planned' || mission.state === 'draft' ? 'Run' : 'Resume'}</button>}<button disabled={['completed', 'cancelled'].includes(mission.state)} onClick={() => { setMissionState(mission.id, 'cancelled', 'Further steps cancelled. An in-flight external action may still finish.'); setMissions(getMissions()); }}>Cancel</button></div></article>) : <div className={styles.empty}><Activity size={28} /><h3>No missions yet</h3><p>Start one above. HEY will keep the goal, state and checkpoints persistent.</p></div>}</section>
    <section className={styles.capabilities}><div className={styles.capHead}><div><small>INFINITY LAYER</small><h2>Everything HEY can orchestrate</h2></div><label><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search capabilities" /></label></div><div className={styles.featureGrid}>{features.map((feature) => <article key={feature.id}><span>{feature.category}</span><h3>{feature.title}</h3><p>{feature.summary}</p></article>)}</div></section>
  </main>;
}

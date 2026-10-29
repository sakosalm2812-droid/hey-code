import { useState } from "react";
import { reconcileMissionStep } from "../core/infinity/missionEngine.js";

export default function MissionReconciliation({ mission }) {
  const [evidence, setEvidence] = useState("");
  const [error, setError] = useState("");
  if (!mission.inFlight || mission.state === "running") return null;
  const review = (outcome) => {
    try { reconcileMissionStep(mission.id, outcome, evidence); }
    catch (failure) { setError(failure.message); }
  };
  return (
    <section aria-label="Review interrupted action">
      <p>This action may already have happened. Check its result in the destination before resuming.</p>
      <label>What did you verify?
        <textarea value={evidence} onChange={event => setEvidence(event.target.value)} maxLength={4000} placeholder="Record the receipt, file, or destination state you checked." />
      </label>
      {error && <p role="alert">{error}</p>}
      <button type="button" disabled={evidence.trim().length < 10} onClick={() => review("completed")}>I verified the action completed</button>
      <button type="button" disabled={evidence.trim().length < 10} onClick={() => review("not-executed")}>I verified the action did not run</button>
    </section>
  );
}

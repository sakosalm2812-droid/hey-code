import { useEffect, useState } from 'react';
import { automationEngine } from '../core/automationEngine.js';

export default function AutomationRecoveryPanel() {
  const [runs, setRuns] = useState(() => automationEngine.getAllRuns());
  const [choices, setChoices] = useState({});
  const [notes, setNotes] = useState({});
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  useEffect(() => automationEngine.subscribe(event => {
    setRuns(automationEngine.getAllRuns());
    if (event === 'account_changed') { setChoices({}); setNotes({}); setError(''); }
  }), []);
  const interrupted = runs.filter(run => run.inFlight || run.state === 'paused' || run.requiresReconciliation);
  if (!interrupted.length) return null;
  function review(event, run) {
    event.preventDefault();
    try { automationEngine.reconcileRun(run.id, choices[run.id], notes[run.id]); setRuns(automationEngine.getAllRuns()); setError(''); }
    catch (failure) { setError(failure.message); }
  }
  async function resume(run) {
    setBusy(run.id); setError('');
    try { const result = await automationEngine.resumeRun(run.id); if (!result.success) setError(result.error || 'The workflow did not complete.'); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(''); setRuns(automationEngine.getAllRuns()); }
  }
  return <section aria-label="Interrupted automations"><h2>Automations needing review</h2>{error && <p role="alert">{error}</p>}{interrupted.map(run => <article key={run.id}><h3>{automationEngine.getWorkflow(run.workflowId)?.name || 'Automation'}</h3><p>{run.error || 'An interrupted workflow needs your review before it can continue.'}</p>{run.inFlight && <form onSubmit={event => review(event, run)}><p>Check the destination for step {run.inFlight.stepId}. Completed steps will be preserved.</p><label>Observed outcome<select required value={choices[run.id] || ''} onChange={event => setChoices({ ...choices, [run.id]: event.target.value })}><option value="">Choose an outcome</option><option value="completed">This step completed</option><option value="not-executed">This step did not execute</option></select></label><label>What you checked<textarea required minLength={10} maxLength={4000} value={notes[run.id] || ''} onChange={event => setNotes({ ...notes, [run.id]: event.target.value })} /></label><button disabled={run.state === 'running'} type="submit">Save review</button></form>}{!run.inFlight && run.state === 'paused' && <button disabled={!!busy} onClick={() => resume(run)}>{busy === run.id ? 'Resuming…' : 'Resume remaining steps'}</button>}</article>)}</section>;
}

import { useState } from 'react';
import { reconcileUndoAction } from '../core/infinity/actionTimeline.js';

export default function UndoReconciliation({ action }) {
  const [outcome, setOutcome] = useState('');
  const [evidence, setEvidence] = useState('');
  const [error, setError] = useState('');
  if (!['undoing', 'undo-uncertain'].includes(action.status)) return null;
  function review(event) {
    event.preventDefault();
    try { reconcileUndoAction(action.id, outcome, evidence); setError(''); }
    catch (failure) { setError(failure.message); }
  }
  return <form onSubmit={review}><p>Undo was interrupted. Check the destination before trying again.</p><label>Observed outcome<select required value={outcome} onChange={event => setOutcome(event.target.value)}><option value="">Choose an outcome</option><option value="undone">The action was undone</option><option value="not-undone">The action was not undone</option></select></label><label>What you checked<textarea required minLength={10} maxLength={4000} value={evidence} onChange={event => setEvidence(event.target.value)} /></label>{error && <p role="alert">{error}</p>}<button type="submit">Save review</button></form>;
}

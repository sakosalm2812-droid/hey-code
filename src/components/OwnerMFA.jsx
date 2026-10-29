import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase.js';

export default function OwnerMFA({ onReady }) {
  const alive = useRef(true);
  const [factors, setFactors] = useState([]);
  const [factorId, setFactorId] = useState('');
  const [qr, setQr] = useState('');
  const [code, setCode] = useState('');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    alive.current = true;
    onReady(false);
    async function load() {
      if (!supabase.auth.mfa) throw new Error('Configure authentication before setting up owner security.');
      const [assurance, listed] = await Promise.all([supabase.auth.mfa.getAuthenticatorAssuranceLevel(), supabase.auth.mfa.listFactors()]);
      if (assurance.error || listed.error) throw assurance.error || listed.error;
      if (!active) return;
      const verified = (listed.data.totp || []).filter(factor => factor.status === 'verified');
      setFactors(verified); setFactorId(verified[0]?.id || '');
      const elevated = assurance.data.currentLevel === 'aal2';
      setReady(elevated); onReady(elevated);
    }
    load().catch(failure => { if (active) setError(failure.message); });
    return () => { active = false; alive.current = false; };
  }, [onReady]);
  async function enroll() {
    setBusy(true); setError('');
    try {
      const { data, error: failure } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: `HEY owner ${new Date().toISOString()}` });
      if (failure) throw failure;
      setFactorId(data.id);
      setQr(data.totp.qr_code.startsWith('data:') ? data.totp.qr_code : `data:image/svg+xml;charset=utf-8,${encodeURIComponent(data.totp.qr_code)}`);
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }
  async function verify(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      if (!/^\d{6}$/.test(code)) throw new Error('Enter the six-digit authenticator code.');
      const result = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
      if (result.error) throw result.error;
      const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (assurance.error || assurance.data.currentLevel !== 'aal2') throw assurance.error || new Error('The session was not elevated. Try again.');
      if (alive.current) { setCode(''); setQr(''); setReady(true); onReady(true); }
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }
  return <section aria-label="Owner authentication"><h2>Owner security</h2>{error && <p role="alert">{error}</p>}{ready ? <p role="status">Authenticator verification is active for this session.</p> : <><p>Verify your authenticator before inspecting or changing account access.</p>{!factorId && <button disabled={busy} onClick={enroll}>Set up an authenticator</button>}{qr && <><p>Scan this private setup code with your authenticator app.</p><img src={qr} alt="Private authenticator enrollment code" width="200" height="200" /></>}{factorId && <form onSubmit={verify}>{factors.length > 1 && <label>Authenticator<select value={factorId} onChange={event => setFactorId(event.target.value)}>{factors.map(factor => <option key={factor.id} value={factor.id}>{factor.friendly_name || 'Authenticator'}</option>)}</select></label>}<label>Authenticator code<input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={event => setCode(event.target.value)} /></label><button disabled={busy} type="submit">Verify owner session</button></form>}</>}</section>;
}

import { useEffect, useState } from "react";
import { Crown, ShieldCheck, UserCog, AlertTriangle } from "lucide-react";
import { ownerEntitlementRequest, ownerEntitlementsConfigured } from "../core/ownerEntitlements.js";
import styles from "./OwnerAccessPage.module.css";
import OwnerMFA from '../components/OwnerMFA.jsx';
import { useAuth } from '../AuthContext.jsx';
import { getStorageAccountRevision } from '../core/infinity/storage.js';

export default function OwnerAccessPage() {
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("pro");
  const [role, setRole] = useState("user");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(null);
  const [mfaReady, setMfaReady] = useState(false);
  const { user } = useAuth();
  useEffect(() => { setResult(null); setPending(null); setMfaReady(false); }, [user?.id]);
  const configured = ownerEntitlementsConfigured();

  async function changeAccess() {
    if (!pending) return;
    const revision = getStorageAccountRevision();
    setBusy(true);
    try {
      const confirmation = { action: pending.action, targetEmail: pending.targetEmail, requestId: pending.requestId, ...(pending.action === 'grant' ? { plan: pending.plan, role: pending.role } : {}) };
      const response = await ownerEntitlementRequest(pending.action, { ...pending, confirmation });
      if (revision === getStorageAccountRevision()) setResult(response);
    }
    catch (failure) { if (revision === getStorageAccountRevision()) setResult({ error: failure.message }); }
    finally { setBusy(false); setPending(null); }
  }

  async function inspect() {
    if (!email.trim()) return;
    const revision = getStorageAccountRevision();
    setBusy(true);
    try { const response = await ownerEntitlementRequest("inspect", { targetEmail: email.trim() }); if (revision === getStorageAccountRevision()) setResult(response); }
    catch (failure) { if (revision === getStorageAccountRevision()) setResult({ error: failure.message }); }
    finally { setBusy(false); }
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <Crown size={28}/>
        <div>
          <div className={styles.eyebrow}>Owner Control Plane</div>
          <h1>Access without backdoors.</h1>
          <p>Grant plans and roles through a server-verified owner service. No browser-side owner email list is trusted.</p>
        </div>
      </section>

      {!configured && (
        <div className={styles.warning}>
          <AlertTriangle size={18}/>
          Owner service is not configured. Deploy the included Supabase migration/function and set the required environment variables.
        </div>
      )}

      <section className={styles.card}>
        <OwnerMFA key={user?.id || 'signed-out'} onReady={setMfaReady} />
        <label>Email<input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="person@example.com"/></label>
        <div className={styles.row}>
          <label>Plan<select value={plan} onChange={(e)=>setPlan(e.target.value)}><option value="free">Free</option><option value="pro">Pro</option><option value="elite">Elite</option></select></label>
          <label>Role<select value={role} onChange={(e)=>setRole(e.target.value)}><option value="user">User</option><option value="owner">Owner</option></select></label>
        </div>
        <div className={styles.actions}>
          <button disabled={!configured||busy||!mfaReady||!email.trim()} onClick={() => setPending({ action: 'grant', requestId: crypto.randomUUID(), targetEmail: email.trim(), plan, role })}><UserCog size={16}/> Review grant</button>
          <button disabled={!configured||busy||!mfaReady||!email.trim()} onClick={() => setPending({ action: 'revoke', requestId: crypto.randomUUID(), targetEmail: email.trim() })}>Review revoke</button>
          <button disabled={!configured||busy||!mfaReady} onClick={inspect} className={styles.ghost}><ShieldCheck size={16}/> Inspect</button>
        </div>
        {pending && <section aria-label="Confirm account change"><h2>Confirm account change</h2><p>{pending.action === 'grant' ? `Grant ${pending.plan} access with role ${pending.role} to ${pending.targetEmail}.` : `Reset ${pending.targetEmail} to free access with role user.`}</p><button disabled={busy||!configured||!mfaReady} onClick={changeAccess}>Confirm {pending.action}</button><button disabled={busy} onClick={() => setPending(null)}>Cancel</button></section>}
        {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
      </section>
    </main>
  );
}

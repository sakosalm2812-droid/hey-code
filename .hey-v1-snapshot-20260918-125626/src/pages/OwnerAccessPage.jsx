import { useState } from "react";
import { Crown, ShieldCheck, UserCog, AlertTriangle } from "lucide-react";
import { ownerEntitlementRequest, ownerEntitlementsConfigured } from "../core/ownerEntitlements.js";
import styles from "./OwnerAccessPage.module.css";

export default function OwnerAccessPage() {
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("pro");
  const [role, setRole] = useState("user");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const configured = ownerEntitlementsConfigured();

  async function grant() {
    if (!email.trim()) return;
    setBusy(true);
    const response = await ownerEntitlementRequest("grant", {
      targetEmail: email.trim(),
      plan,
      role,
    });
    setResult(response);
    setBusy(false);
  }

  async function inspect() {
    if (!email.trim()) return;
    setBusy(true);
    setResult(await ownerEntitlementRequest("inspect", { targetEmail: email.trim() }));
    setBusy(false);
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
        <label>Email<input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="person@example.com"/></label>
        <div className={styles.row}>
          <label>Plan<select value={plan} onChange={(e)=>setPlan(e.target.value)}><option value="free">Free</option><option value="pro">Pro</option><option value="elite">Elite</option></select></label>
          <label>Role<select value={role} onChange={(e)=>setRole(e.target.value)}><option value="user">User</option><option value="owner">Owner</option></select></label>
        </div>
        <div className={styles.actions}>
          <button disabled={!configured||busy} onClick={grant}><UserCog size={16}/> Grant access</button>
          <button disabled={!configured||busy} onClick={inspect} className={styles.ghost}><ShieldCheck size={16}/> Inspect</button>
        </div>
        {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
      </section>
    </main>
  );
}

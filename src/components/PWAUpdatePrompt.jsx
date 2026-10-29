import { useEffect, useState } from "react";

export default function PWAUpdatePrompt() {
  const [waiting, setWaiting] = useState(null);
  const [updating, setUpdating] = useState(false);
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let disposed = false;
    let registration;
    let worker;
    const sync = () => {
      if (!disposed && navigator.serviceWorker.controller && registration?.waiting) setWaiting(registration.waiting);
    };
    const track = () => {
      worker?.removeEventListener("statechange", sync);
      worker = registration.installing;
      worker?.addEventListener("statechange", sync);
    };
    navigator.serviceWorker.ready.then((value) => {
      if (disposed) return;
      registration = value;
      registration.addEventListener("updatefound", track);
      track();
      sync();
    }).catch(() => {});
    return () => {
      disposed = true;
      registration?.removeEventListener("updatefound", track);
      worker?.removeEventListener("statechange", sync);
    };
  }, []);
  if (!waiting) return null;
  const update = () => {
    setUpdating(true);
    navigator.serviceWorker.addEventListener("controllerchange", () => window.location.reload(), { once: true });
    waiting.postMessage({ type: "SKIP_WAITING" });
  };
  return (
    <aside role="status" aria-live="polite" style={{ position: "fixed", bottom: "max(1rem, env(safe-area-inset-bottom))", left: "1rem", right: "1rem", margin: "auto", maxWidth: "28rem", zIndex: 10000, padding: "1rem", borderRadius: "1rem", background: "var(--bg-primary, #020508)", color: "var(--text-primary, white)", border: "1px solid var(--border-color, #555)" }}>
      <p>A HEY update is ready. Save any unsent work before reloading.</p>
      <button type="button" className="hey-btn-primary" onClick={update} disabled={updating}>{updating ? "Updating…" : "Update and reload"}</button>
      <button type="button" className="hey-btn-ghost" onClick={() => setWaiting(null)} disabled={updating}>Later</button>
    </aside>
  );
}

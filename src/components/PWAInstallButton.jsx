import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, Share2, X } from "lucide-react";

function isStandaloneMode() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    window.navigator?.standalone === true
  );
}

function isIOSDevice() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent || "");
}

export default function PWAInstallButton({ className = "", compact = false }) {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(() => isStandaloneMode());
  const [showHelp, setShowHelp] = useState(false);
  const [installing, setInstalling] = useState(false);
  const ios = useMemo(() => isIOSDevice(), []);

  useEffect(() => {
    const capturePrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };

    const markInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      setShowHelp(false);
    };

    window.addEventListener("beforeinstallprompt", capturePrompt);
    window.addEventListener("appinstalled", markInstalled);

    const media = window.matchMedia?.("(display-mode: standalone)");
    const syncStandalone = () => setInstalled(isStandaloneMode());
    media?.addEventListener?.("change", syncStandalone);

    return () => {
      window.removeEventListener("beforeinstallprompt", capturePrompt);
      window.removeEventListener("appinstalled", markInstalled);
      media?.removeEventListener?.("change", syncStandalone);
    };
  }, []);

  const install = async () => {
    if (installed) {
      window.location.assign("/chat");
      return;
    }

    if (!installPrompt) {
      setShowHelp(true);
      return;
    }

    setInstalling(true);
    try {
      await installPrompt.prompt();
      const result = await installPrompt.userChoice;
      if (result?.outcome === "accepted") {
        setInstallPrompt(null);
      }
    } finally {
      setInstalling(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={`hey-pwa-install ${compact ? "hey-pwa-install--compact" : ""} ${className}`.trim()}
        onClick={install}
        aria-label={installed ? "Open installed HEY app" : "Download HEY as an app"}
      >
        {installed ? <CheckCircle2 size={16} /> : <Download size={16} />}
        <span>{installed ? "Open HEY" : installing ? "Installing…" : "Download HEY"}</span>
      </button>

      {showHelp && (
        <div className="hey-pwa-help-backdrop" role="presentation" onMouseDown={() => setShowHelp(false)}>
          <section
            className="hey-pwa-help"
            role="dialog"
            aria-modal="true"
            aria-labelledby="hey-pwa-help-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="hey-pwa-help-close"
              onClick={() => setShowHelp(false)}
              aria-label="Close install instructions"
            >
              <X size={18} />
            </button>
            <div className="hey-pwa-help-icon"><Share2 size={22} /></div>
            <h2 id="hey-pwa-help-title">Install HEY</h2>
            {ios ? (
              <p>In Safari, tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>, then confirm <strong>Add</strong>.</p>
            ) : (
              <p>Your browser has not exposed its one-tap install prompt yet. Open the browser menu and choose <strong>Install HEY</strong>, <strong>Install app</strong>, or <strong>Add to Home screen</strong>.</p>
            )}
            <small>HEY must be opened from its HTTPS production site (or localhost during development) for PWA installation.</small>
          </section>
        </div>
      )}
    </>
  );
}

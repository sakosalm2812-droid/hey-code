import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Database,
  LogOut,
  Check,
  AlertCircle,
  Languages,
  Save,
  Mic,
  Volume2,
  Shield,
  Zap,
  Moon,
  BellRing,
  MousePointer2,
  Download,
  Trash2,
  Palette,
  SlidersHorizontal,
  Image,
  Upload,
  Sparkles,
} from "lucide-react";

import { useAuth } from "./AuthContext.jsx";
import { buzz } from "./lib/heyFeedback.js";
import { getSettings, toggleSetting } from "./lib/settingsManager.js";
import { exportUserData, downloadJsonAsFile, requestAccountDeletion } from "./lib/dataControls.js";
import { supabase } from "./lib/supabase.js";
import { LOCALES, useLocale } from "./i18n/LocaleContext.jsx";
import {
  loadStoredProactiveSettings,
  saveProactiveSettings,
  getNextProactiveWindow,
} from "./lib/proactiveStore.js";
import {
  loadVoiceSettings,
  saveVoiceSettings,
  getTtsVoices,
  pickVoice,
} from "./core/heyVoiceSettings.js";
import {
  isPushSupported,
  getActiveSubscription,
  subscribeToPush,
  unsubscribeFromPush,
  sendTestPush,
  setAppBadge,
  clearAppBadge,
} from "./lib/heyPush.js";
import { useGestureControl } from "./lib/gestureControl.js";
import { getSetting, setSetting, subscribeToSettings } from "./core/settingsRegistry.js";
import ScenePicker from "./components/background/ScenePicker.jsx";
import BackgroundControls from "./components/background/BackgroundControls.jsx";

const aiSettings = [
  "Long-Term Memory",
  "Personalized Intelligence",
  "Voice Activation",
  "Automatic Organization",
  "Proactive Suggestions",
];

const defaultSettings = aiSettings.reduce((acc, setting) => {
  acc[setting] = true;
  return acc;
}, {});

function formatPlan(plan, t) {
  if (!plan) return t("settings.planFree");
  return `${String(plan).charAt(0).toUpperCase()}${String(plan).slice(1)} plan`;
}

function Toggle({ on, disabled, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className="hey-settings-toggle"
      data-on={on}
    >
      <span />
    </button>
  );
}

export default function SettingsPage() {
  const { user, profile, plan, signOut } = useAuth();
  const { t, locale, setLocale } = useLocale();

  const [enabled, setEnabled] = useState(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [savingSetting, setSavingSetting] = useState("");
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [online, setOnline] = useState(() => navigator.onLine);

  const [proactive, setProactive] = useState(() => {
    const stored = loadStoredProactiveSettings();

    return {
      enabled: true,
      maxSuggestionsPerDay: 3,
      cooldownMinutes: 60,
      minimumPriority: 40,
      allowDuringQuietHours: false,
      allowUrgentDuringQuietHours: true,
      deduplicateByKind: true,
      ...stored,
      quietHours: {
        start: "22:00",
        end: "08:00",
        ...(stored.quietHours || {}),
      },
    };
  });

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const [voiceSettings, setVoiceSettings] = useState(() => loadVoiceSettings());
  const [voices, setVoices] = useState(() => (typeof speechSynthesis !== "undefined" ? getTtsVoices(globalThis) : []));
  const gesture = useGestureControl();

  const [bgConfig, setBgConfig] = useState(() => {
    const stored = getSetting('appearance.background');
    return stored && typeof stored === 'object' ? stored : {};
  });

  useEffect(() => {
    const unsubscribe = subscribeToSettings((key, value) => {
      if (key === 'appearance.background') {
        setBgConfig(prev => ({ ...prev, ...value }));
      }
    });
    return unsubscribe;
  }, []);

  const [pushInfo, setPushInfo] = useState({
    subscription: null,
    permission: typeof Notification !== "undefined" ? Notification.permission : "unsupported",
  });
  const [pushBusy, setPushBusy] = useState(false);
  const [pushNote, setPushNote] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      const subscription = await getActiveSubscription();
      if (!mounted) return;
      setPushInfo({
        subscription: subscription?.endpoint ? { endpoint: subscription.endpoint } : null,
        permission: typeof Notification !== "undefined" ? Notification.permission : "unsupported",
      });
    })();
    return () => { mounted = false; };
  }, []);

  async function handleSubscribePush() {
    setPushBusy(true);
    setPushNote("");
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      await Notification.requestPermission();
    }
    const permission = typeof Notification !== "undefined" ? Notification.permission : "unsupported";
    setPushInfo((current) => ({ ...current, permission }));
    if (permission === "denied") {
      setPushNote("Notifications are blocked in the browser. Allow them and try again.");
      setPushBusy(false);
      return;
    }
    if (!isPushSupported()) {
      setPushNote("This browser does not support push notifications.");
      setPushBusy(false);
      return;
    }
    const result = await subscribeToPush();
    setPushBusy(false);
    if (result.ok) {
      setPushInfo((current) => ({ ...current, subscription: { endpoint: result.endpoint } }));
      setPushNote("Push notifications enabled.");
    } else {
      setPushNote(result.error || "Could not enable push notifications.");
    }
  }

  async function handleUnsubscribePush() {
    setPushBusy(true);
    await unsubscribeFromPush(pushInfo.subscription?.endpoint);
    setPushInfo((current) => ({ ...current, subscription: null }));
    setPushBusy(false);
    setPushNote("Push notifications disabled.");
  }

  async function handleTestPush() {
    setPushBusy(true);
    setPushNote("");
    const result = await sendTestPush();
    setPushBusy(false);
    setPushNote(result.ok ? "Test notification sent." : (result.error || "Could not send a test notification."));
  }

  async function handleBadgeDemo() {
    const applied = await setAppBadge(3);
    setPushNote(applied ? "App badge set to 3 — clearing in 5 seconds." : "App badges are not supported in this browser.");
    if (applied) window.setTimeout(() => { clearAppBadge(); }, 5000);
  }

  useEffect(() => {
    if (typeof speechSynthesis === "undefined") return () => {};
    const refresh = () => setVoices(getTtsVoices(globalThis));
    speechSynthesis.addEventListener("voiceschanged", refresh);
    return () => speechSynthesis.removeEventListener("voiceschanged", refresh);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      if (!user?.id) {
        if (mounted) {
          setEnabled(defaultSettings);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const settings = await getSettings(user.id);

        if (!mounted) return;

        setEnabled({
          ...defaultSettings,
          ...(settings || {}),
        });
      } catch (err) {
        console.error("Failed to load settings:", err);

        if (!mounted) return;

        setEnabled(defaultSettings);
        setError(t("settings.loadFailed"));
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      mounted = false;
    };
  }, [user?.id, t]);

  async function handleToggle(setting) {
    if (!user?.id || savingSetting) return;

    setSavingSetting(setting);
    setError("");
    setSavedMessage("");

    try {
      const updated = await toggleSetting(user.id, setting);

      setEnabled({
        ...defaultSettings,
        ...(updated || {}),
      });

      setSavedMessage(
        t("settings.savedChanges").replace("{setting}", setting)
      );

      window.setTimeout(() => {
        setSavedMessage("");
      }, 2200);
    } catch (err) {
      console.error("Failed to toggle setting:", err);
      setError(t("settings.saveFailed").replace("{setting}", setting));
    } finally {
      setSavingSetting("");
    }
  }

  function handleBgConfigChange(changes) {
    const updated = { ...bgConfig, ...changes };
    setBgConfig(updated);
    setSetting('appearance.background', updated);
    buzz("light");
  }

  async function handleSignOut() {
    try {
      await signOut();
    } catch (err) {
      console.error("Failed to sign out:", err);
      setError("Could not sign out. Please try again.");
    }
  }

  const [dataBusy, setDataBusy] = useState(false);
  const [dataNote, setDataNote] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteNote, setDeleteNote] = useState("");

  async function handleExport() {
    if (!user?.id || dataBusy) return;
    setDataBusy(true);
    setDataNote("");
    const result = await exportUserData({ client: supabase, userId: user.id });
    if (result.error || !result.data) {
      setDataNote(result.error || "Could not export your data. Please try again.");
      setDataBusy(false);
      return;
    }
    const stamp = new Date().toISOString().slice(0, 10);
    const saved = downloadJsonAsFile(result.data, `hey-data-export-${stamp}.json`);
    if (saved.ok) {
      const counts = Object.entries(result.data.collections)
        .filter(([, value]) => Array.isArray(value))
        .map(([key, value]) => `${key}: ${value.length}`)
        .join(", ");
      setDataNote(`Export ready. ${counts || "No server records found."}`);
    } else {
      setDataNote(saved.error);
    }
    setDataBusy(false);
  }

  async function handleDeleteAccount() {
    if (!user?.id || deleteBusy) return;
    if (String(deleteConfirm).trim() !== "DELETE") {
      setDeleteNote("Type DELETE to confirm that you want to remove your account and its data.");
      return;
    }
    setDeleteBusy(true);
    setDeleteNote("");
    const result = await requestAccountDeletion({ client: supabase, userId: user.id });
    if (result.ok) {
      try { await signOut(); } catch { /* Continue even if the local sign-out fails. */ }
      window.location.href = "/";
    } else {
      setDeleteNote(result.error || "Deletion is unavailable right now. Export your data and contact the published operator address.");
      setDeleteBusy(false);
    }
  }

  const initials = useMemo(() => {
    const source =
      profile?.display_name ||
      profile?.displayName ||
      user?.email ||
      "HEY User";

    return String(source).trim().slice(0, 1).toUpperCase() || "H";
  }, [profile?.display_name, profile?.displayName, user?.email]);

  const displayName =
    profile?.display_name ||
    profile?.displayName ||
    user?.email ||
    "HEY User";

  const planLabel = formatPlan(plan, t);

  function saveProactive() {
    saveProactiveSettings(proactive);
    buzz("light");
    setSavedMessage("Proactive preferences saved.");
    window.setTimeout(() => setSavedMessage(""), 2200);
  }

  function saveVoice() {
    saveVoiceSettings({
      voiceURI: voiceSettings.voiceURI,
      wakePhrase: voiceSettings.wakePhrase.trim(),
      autoListen: voiceSettings.autoListen,
      rate: voiceSettings.rate,
      pitch: voiceSettings.pitch,
    });
    buzz("light");
    setSavedMessage("Voice preferences saved.");
    window.setTimeout(() => setSavedMessage(""), 2200);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="hey-settings-page"
    >
      {error && (
        <div className="hey-settings-banner error" role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {savedMessage && (
        <div className="hey-settings-banner success" role="status">
          <Check size={16} />
          <span>{savedMessage}</span>
        </div>
      )}

      {isLoading ? (
        <div className="hey-settings-loading">Loading your preferences...</div>
      ) : (
        <div className="hey-settings-layout">

          <section className="hey-settings-profile">
            <div className="hey-settings-avatar" aria-hidden="true">{initials}</div>
            <div className="hey-settings-profile-copy">
              <span className="hey-settings-kicker">{t("settings.kicker")}</span>
              <h1>{displayName}</h1>
              <p>{user?.email || t("settings.unknownAccount")}</p>
              <div className="hey-settings-plan">
                <Zap size={13} />
                {planLabel}
              </div>
            </div>
            <button type="button" className="hey-btn-primary hey-settings-signout" onClick={handleSignOut}>
              <LogOut size={15} />
              <span>{t("settings.signOut")}</span>
            </button>
          </section>

          <section className="hey-settings-card">
            <header className="hey-settings-card-header">
              <Brain size={20} aria-hidden="true" />
              <div>
                <h2>{t("settings.ai")}</h2>
                <p>{t("settings.aiDesc")}</p>
              </div>
            </header>

            <div className="hey-settings-rows">
              {aiSettings.map((setting) => {
                const isEnabled = Boolean(enabled[setting]);

                return (
                  <div className="hey-settings-row" key={setting}>
                    <div>
                      <strong>{setting}</strong>
                      <small>{isEnabled ? t("common.enabled") : t("common.disabled")}</small>
                    </div>
                    <Toggle
                      on={isEnabled}
                      disabled={Boolean(savingSetting)}
                      onChange={() => handleToggle(setting)}
                      label={`Toggle ${setting}`}
                    />
                  </div>
                );
              })}
            </div>
          </section>

          <div className="hey-settings-grid">
            <section className="hey-settings-card">
              <header className="hey-settings-card-header">
                <Moon size={20} aria-hidden="true" />
                <div>
                  <h2>Proactive & quiet hours</h2>
                  <p>When HEY may surface suggestions for tasks and focus.</p>
                </div>
              </header>

              <div className="hey-settings-rows">
                <div className="hey-settings-row">
                  <div>
                    <strong>Suggestions enabled</strong>
                    <small>Urgent items can still break through.</small>
                  </div>
                  <Toggle
                    on={proactive.enabled}
                    onChange={() => setProactive((current) => ({ ...current, enabled: !current.enabled }))}
                    label="Toggle proactive suggestions"
                  />
                </div>
              </div>

              <div className="hey-settings-fields">
                <div className="hey-settings-fields-heading">Quiet hours</div>
                <div className="hey-settings-field-row">
                  <label>
                    <span>Start</span>
                    <input
                      type="time"
                      value={proactive.quietHours.start}
                      onChange={(event) =>
                        setProactive((current) => ({ ...current, quietHours: { ...current.quietHours, start: event.target.value } }))
                      }
                      className="hey-input"
                      aria-label="Quiet hours start"
                    />
                  </label>
                  <label>
                    <span>End</span>
                    <input
                      type="time"
                      value={proactive.quietHours.end}
                      onChange={(event) =>
                        setProactive((current) => ({ ...current, quietHours: { ...current.quietHours, end: event.target.value } }))
                      }
                      className="hey-input"
                      aria-label="Quiet hours end"
                    />
                  </label>
                </div>
                <div className="hey-settings-field-row">
                  <label>
                    <span>Suggestions per day</span>
                    <input
                      type="number"
                      min="0"
                      max="8"
                      value={proactive.maxSuggestionsPerDay}
                      onChange={(event) =>
                        setProactive((current) => ({ ...current, maxSuggestionsPerDay: Number(event.target.value) }))
                      }
                      className="hey-input"
                      aria-label="Maximum suggestions per day"
                    />
                  </label>
                  <label>
                    <span>Cooldown (minutes)</span>
                    <input
                      type="number"
                      min="0"
                      value={proactive.cooldownMinutes}
                      onChange={(event) =>
                        setProactive((current) => ({ ...current, cooldownMinutes: Number(event.target.value) }))
                      }
                      className="hey-input"
                      aria-label="Suggestion cooldown in minutes"
                    />
                  </label>
                </div>
              </div>

              <div className="hey-settings-card-actions">
                <button type="button" className="hey-btn-primary" onClick={saveProactive}>
                  <Save size={15} />
                  Save preferences
                </button>
                <span className="hey-settings-hint">
                  Next window:{" "}
                  <strong>
                    {new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(
                      getNextProactiveWindow(proactive),
                    )}
                  </strong>
                </span>
              </div>
            </section>

            <section className="hey-settings-card">
              <header className="hey-settings-card-header">
                <Mic size={20} aria-hidden="true" />
                <div>
                  <h2>Voice & wake phrase</h2>
                  <p>How HEY speaks back and how you begin a command.</p>
                </div>
              </header>

              <div className="hey-settings-fields">
                <div className="hey-settings-field-row">
                  <label className="spans">
                    <span>Output voice</span>
                    <select
                      value={voiceSettings.voiceURI}
                      onChange={(event) =>
                        setVoiceSettings((current) => ({ ...current, voiceURI: event.target.value }))
                      }
                      className="hey-input"
                      aria-label="Speech output voice"
                    >
                      <option value="">Auto (prefer British male)</option>
                      {voices.map((voice) => (
                        <option key={voice.voiceURI} value={voice.voiceURI}>
                          {voice.name} ({voice.lang})
                        </option>
                      ))}
                    </select>
                    {voices.length === 0 && (
                      <small>No system voices detected in this browser.</small>
                    )}
                  </label>
                </div>
                <div className="hey-settings-field-row">
                  <label>
                    <span>Wake phrase</span>
                    <input
                      type="text"
                      value={voiceSettings.wakePhrase}
                      onChange={(event) =>
                        setVoiceSettings((current) => ({ ...current, wakePhrase: event.target.value }))
                      }
                      placeholder="hey"
                      className="hey-input"
                      aria-label="Voice wake phrase"
                    />
                  </label>
                </div>
              </div>

              <div className="hey-settings-rows">
                <div className="hey-settings-row">
                  <div>
                    <strong>Listen for me automatically</strong>
                    <small>HEY may watch for the wake phrase while chat is open.</small>
                  </div>
                  <Toggle
                    on={voiceSettings.autoListen}
                    onChange={() =>
                      setVoiceSettings((current) => ({ ...current, autoListen: !current.autoListen }))
                    }
                    label="Toggle automatic listening"
                  />
                </div>
              </div>

              <div className="hey-settings-card-actions">
                <button type="button" className="hey-btn-primary" onClick={saveVoice}>
                  <Save size={15} />
                  Save voice preferences
                </button>
                <span className="hey-settings-hint">
                  <Volume2 size={15} aria-hidden="true" />
                  {voices.length > 0
                    ? `Using ${pickVoice(voices, voiceSettings.voiceURI)?.name || "automatic"}`
                    : "Voice preview unavailable here."}
                </span>
              </div>
            </section>
          </div>

          <section className="hey-settings-card">
            <header className="hey-settings-card-header">
              <MousePointer2 size={20} aria-hidden="true" />
              <div>
                <h2>Gestures</h2>
                <p>Control HEY with hand gestures using your camera.</p>
              </div>
            </header>

            <div className="hey-settings-rows">
              <div className="hey-settings-row">
                <div>
                  <strong>System gesture runtime</strong>
                  <small>
                    {gesture.isActive ? "Active" : "Inactive"} · {gesture.isSupported ? "Supported" : "Unsupported in this browser"}
                    {gesture.isActive ? " · Native consent expires after 15 minutes or when you stop." : " · Starting opens a native consent prompt for bounded pointer, click, scroll, navigation, and media controls."}
                  </small>
                </div>
                <Toggle
                  on={gesture.isActive}
                  onChange={() => gesture.updateSettings({ enabled: !gesture.isActive })}
                  label="Toggle gesture runtime"
                />
              </div>

              <div className="hey-settings-row">
                <div>
                  <strong>Camera access</strong>
                  <small>Required for gesture recognition</small>
                </div>
                <Toggle
                  on={gesture.settings.systemWide}
                  onChange={() => gesture.updateSettings({ onlyWhileVisible: !gesture.settings.systemWide })}
                  label="Toggle system-wide camera"
                />
              </div>

              <div className="hey-settings-row">
                <div>
                  <strong>Confidence threshold</strong>
                  <small>Minimum confidence to trigger a gesture (0–1)</small>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="0.95"
                  step="0.05"
                  value={gesture.settings.confidenceThreshold}
                  onChange={(e) => gesture.updateSettings({ confidenceThreshold: Number(e.target.value) })}
                  className="hey-input"
                  style={{ width: 200, marginLeft: "auto" }}
                  aria-label="Gesture confidence threshold"
                />
              </div>

              <div className="hey-settings-row">
                <div>
                  <strong>Hold duration (ms)</strong>
                  <small>How long to hold a gesture before activating</small>
                </div>
                <input
                  type="number"
                  min="200"
                  max="2000"
                  step="50"
                  value={gesture.settings.holdDuration}
                  onChange={(e) => gesture.updateSettings({ holdDuration: Number(e.target.value) })}
                  className="hey-input"
                  style={{ width: 120, marginLeft: "auto" }}
                  aria-label="Gesture hold duration"
                />
              </div>
            </div>

            <div className="hey-settings-fields">
              <div className="hey-settings-fields-heading">Available gestures</div>
              <div className="hey-settings-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
                {Object.entries(gesture.availableGestures).map(([key, info]) => (
                  <div key={key} className="hey-settings-card" style={{ padding: 12, margin: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <div>
                        <strong style={{ textTransform: "capitalize" }}>{key.replace(/-/g, " ")}</strong>
                        <small style={{ display: "block", color: "var(--text-secondary)" }}>{info.name}</small>
                      </div>
                      <Toggle
                        on={gesture.settings.enabledGestures?.includes(key)}
                        onChange={() =>
                          gesture.updateSettings({
                            enabledGestures: gesture.settings.enabledGestures?.includes(key)
                              ? gesture.settings.enabledGestures.filter((g) => g !== key)
                              : [...(gesture.settings.enabledGestures || []), key],
                          })
                        }
                        label={`Toggle ${info.name}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {gesture.detectedGesture && (
              <div className="hey-settings-hint" style={{ color: "var(--gold)" }}>
                <Zap size={14} aria-hidden="true" />
                Last detected: <strong>{gesture.detectedGesture}</strong>
              </div>
            )}
          </section>

          {/* Background / Appearance section */}
          <section className="hey-settings-card">
            <header className="hey-settings-card-header">
              <Palette size={20} aria-hidden="true" />
              <div>
                <h2>Background & Appearance</h2>
                <p>Choose your scene, adjust filters, and set motion preferences.</p>
              </div>
            </header>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
              <div>
                <ScenePicker
                  config={bgConfig}
                  onChange={handleBgConfigChange}
                />
              </div>
              <div>
                <BackgroundControls
                  config={bgConfig}
                  onChange={handleBgConfigChange}
                />
              </div>
            </div>
            <style jsx>{`
              @media (max-width: 900px) {
                .hey-settings-card > div[style*="grid"] {
                  grid-template-columns: 1fr;
                }
              }
            `}</style>
          </section>

          <section className="hey-settings-card">
            <header className="hey-settings-card-header">
              <Shield size={20} aria-hidden="true" />
              <div>
                <h2>{t("settings.systemStatus")}</h2>
                <p>Current system state.</p>
              </div>
            </header>
            <div className="hey-settings-status">
              {[
                { name: t("common.connection"), status: online ? t("common.online") : t("common.offline"), ok: online },
                { name: t("common.backend"), status: t("common.configured"), ok: true },
                { name: t("common.session"), status: user ? t("common.signedIn") : t("common.signedOut"), ok: Boolean(user) },
                { name: t("common.plan"), status: planLabel, ok: true },
              ].map((item) => (
                <div className="hey-settings-status-item" key={item.name}>
                  <span className={`hey-settings-status-dot ${item.ok ? "ok" : "warn"}`} />
                  <div>
                    <small>{item.name}</small>
                    <strong>{item.status}</strong>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="hey-settings-card">
            <header className="hey-settings-card-header">
              <BellRing size={20} aria-hidden="true" />
              <div>
                <h2>Notifications & live-session</h2>
                <p>Push, badges and the web side of your Dynamic Island.</p>
              </div>
            </header>
            <div className="hey-settings-storage">
              <div className="hey-settings-storage-item" style={{ flexDirection: "column", alignItems: "flex-start", gap: 12 }}>
                <div>
                  <strong>Web push</strong>
                  <p>
                    {!isPushSupported()
                      ? "This browser does not support push notifications or a service worker."
                      : pushInfo.subscription
                        ? "Subscribed on this device."
                        : pushInfo.permission === "denied"
                          ? "Notifications are blocked in the browser."
                          : "Not subscribed on this device yet."}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {pushInfo.subscription ? (
                    <>
                      <button type="button" className="hey-btn-ghost" onClick={handleUnsubscribePush} disabled={pushBusy} style={{ color: "var(--coral)" }}>
                        Turn off
                      </button>
                      <button type="button" className="hey-btn-ghost" onClick={handleTestPush} disabled={pushBusy}>
                        Send test
                      </button>
                    </>
                  ) : (
                    <button type="button" className="hey-btn-primary" onClick={handleSubscribePush} disabled={pushBusy}>
                      Enable push
                    </button>
                  )}
                  <button type="button" className="hey-btn-ghost" onClick={handleBadgeDemo} disabled={pushBusy}>
                    Badge demo
                  </button>
                </div>
                {pushNote && <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>{pushNote}</p>}
              </div>
            </div>
          </section>

          <section className="hey-settings-card">
            <header className="hey-settings-card-header">
              <Database size={20} aria-hidden="true" />
              <div>
                <h2>Storage</h2>
                <p>Where your intelligence lives.</p>
              </div>
            </header>
            <div className="hey-settings-storage">
              <div className="hey-settings-storage-item">
                <Database size={16} aria-hidden="true" />
                <div>
                  <strong>{t("settings.backendTitle")}</strong>
                  <p>{t("settings.backendDesc")}</p>
                </div>
              </div>
              <div className="hey-settings-storage-item">
                <Brain size={16} aria-hidden="true" />
                <div>
                  <strong>{t("settings.memoryCore")}</strong>
                  <p>{t("settings.memoryCoreDesc")}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="hey-settings-card">
            <header className="hey-settings-card-header">
              <Database size={20} aria-hidden="true" />
              <div>
                <h2>Account &amp; data</h2>
                <p>Your data is yours. Export it, or delete your account and its data.</p>
              </div>
            </header>
            <div className="hey-settings-storage">
              <div className="hey-settings-storage-item" style={{ flexDirection: "column", alignItems: "flex-start", gap: 12 }}>
                <div>
                  <strong>Export my data</strong>
                  <p>Download a portable JSON copy of the account-associated data HEY holds.</p>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <button type="button" className="hey-btn-primary" onClick={handleExport} disabled={dataBusy || !user?.id}>
                    <Download size={15} style={{ verticalAlign: "-2px" }} /> {dataBusy ? "Building export..." : "Export my data"}
                  </button>
                  <span className="hey-settings-hint">Requires a connection to your HEY backend.</span>
                </div>
                {dataNote && <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: 0 }}>{dataNote}</p>}
              </div>
              <div className="hey-settings-storage-item" style={{ flexDirection: "column", alignItems: "flex-start", gap: 12 }}>
                <div>
                  <strong style={{ color: "var(--coral)" }}>Delete account</strong>
                  <p>Permanently delete your account and all associated data. This cannot be undone — export anything you want to keep first.</p>
                </div>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={(event) => setDeleteConfirm(event.target.value)}
                  placeholder="Type DELETE to confirm"
                  className="hey-input"
                  style={{ maxWidth: 260 }}
                  aria-label="Type DELETE to confirm account deletion"
                />
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <button type="button" className="hey-btn-ghost" onClick={handleDeleteAccount} disabled={deleteBusy || !user?.id} style={{ color: "var(--coral)" }}>
                    <Trash2 size={15} style={{ verticalAlign: "-2px" }} /> {deleteBusy ? "Deleting..." : "Delete account"}
                  </button>
                  <span className="hey-settings-hint">Deletion is handled by the delete-account service.</span>
                </div>
                {deleteNote && <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: 0 }}>{deleteNote}</p>}
              </div>
            </div>
          </section>

          <section className="hey-settings-card">
            <header className="hey-settings-card-header">
              <Languages size={20} aria-hidden="true" />
              <div>
                <h2>{t("settings.language")}</h2>
                <p>{t("settings.languageDesc")}</p>
              </div>
            </header>
            <div className="hey-settings-languages">
              {Object.values(LOCALES).map((candidate) => (
                <button
                  key={candidate.code}
                  type="button"
                  onClick={() => setLocale(candidate.code)}
                  aria-pressed={locale === candidate.code}
                  className={`hey-settings-lang ${locale === candidate.code ? "active" : ""}`}
                >
                  <span>{candidate.native}</span>
                  {locale === candidate.code && <Check size={15} />}
                </button>
              ))}
            </div>
            <p className="hey-settings-hint">{t("settings.languageHint")}</p>
          </section>

        </div>
      )}
    </motion.div>
  );
}

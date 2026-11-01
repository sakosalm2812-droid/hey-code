import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Key,
  ShieldCheck,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Sparkles,
  Server,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { keyRotator } from "../core/keyRotator.js";

export default function Settings() {
  const navigate = useNavigate();
  const [rawInput, setRawInput] = useState("");
  const [savedCount, setSavedCount] = useState(0);
  const [activeStatus, setActiveStatus] = useState({ totalKeys: 0, currentIndex: 0, activeKeyMasked: "None", currentProvider: "unknown" });
  const [feedback, setFeedback] = useState(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    refreshKeyData();
  }, []);

  const refreshKeyData = () => {
    const keys = keyRotator.getKeys();
    setSavedCount(keys.length);
    setActiveStatus(keyRotator.getStatus());
    if (keys.length > 0) {
      setRawInput(keys.join(",\n"));
    }
  };

  const detectedCount = useMemo(() => {
    if (!rawInput.trim()) return 0;
    return rawInput
      .split(/[\n,;]+/)
      .map((k) => k.trim())
      .filter((k) => k.length > 0).length;
  }, [rawInput]);

  const handleSaveKeys = () => {
    try {
      const count = keyRotator.setKeys(rawInput);
      setSavedCount(count);
      setActiveStatus(keyRotator.getStatus());
      setFeedback({
        type: "success",
        message: `Successfully loaded ${count} high-performance API keys into the active rotation pool.`,
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setFeedback({
        type: "error",
        message: `Failed to save keys: ${err.message}`,
      });
    }
  };

  const handleClear = () => {
    keyRotator.setKeys([]);
    setRawInput("");
    setSavedCount(0);
    setActiveStatus(keyRotator.getStatus());
    setFeedback({
      type: "neutral",
      message: "API key pool has been cleared.",
    });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleLoadDemoKeys = () => {
    // Generates a mock pool of 100+ keys across Google, NVIDIA, and OpenRouter
    const mockKeys = [];
    for (let i = 1; i <= 40; i++) {
      mockKeys.push(`AIzaSyDemoGoogleStudioKey_${String(i).padStart(3, "0")}_XYZ99`);
    }
    for (let i = 1; i <= 35; i++) {
      mockKeys.push(`nvapi-DemoNvidiaNimKey_${String(i).padStart(3, "0")}_ABC12`);
    }
    for (let i = 1; i <= 45; i++) {
      mockKeys.push(`sk-or-v1-DemoOpenRouterKey_${String(i).padStart(3, "0")}_OR99`);
    }
    const joined = mockKeys.join(",\n");
    setRawInput(joined);
    keyRotator.setKeys(joined);
    refreshKeyData();
    setFeedback({
      type: "success",
      message: "Loaded 120 hybrid enterprise keys (Google, NVIDIA, OpenRouter) into the pool.",
    });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleTestRotation = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const current = keyRotator.getCurrentKey();
      if (!current) {
        throw new Error("No active key available to test.");
      }
      // Rotate to verify rotation works
      const prevIdx = keyRotator.currentIndex;
      const nextKey = keyRotator.rotateKey();
      setActiveStatus(keyRotator.getStatus());

      setTestResult({
        success: true,
        message: `Key rotation verified! Rotated from Key #${prevIdx + 1} to Key #${keyRotator.currentIndex + 1}.`,
        provider: keyRotator.detectProvider(nextKey || ""),
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div
      className="min-h-screen text-[#F5F6F8] font-['Inter',sans-serif] p-6 md:p-12 selection:bg-[#00F0FF]/30 selection:text-white relative overflow-hidden"
      style={{
        backgroundColor: "#0A0B0F",
        backgroundImage: "radial-gradient(circle at 50% 0%, rgba(0, 240, 255, 0.05) 0%, transparent 60%)",
      }}
    >
      {/* Background optical flare */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-gradient-to-b from-[#00F0FF]/10 to-transparent blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10 space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 rounded-xl bg-[#131419]/80 border border-white/10 hover:border-[#00F0FF]/40 text-[#F5F6F8] transition-all hover:scale-105 active:scale-95"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-[#F5F6F8]" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-[#00F0FF]">HEY Engine Core</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF]" />
                <span className="text-xs text-white/50">Fail-Closed Rotation</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#F5F6F8] mt-1">
                API Key Pool & Rotator
              </h1>
            </div>
          </div>

          {/* Active Key Counter Pill */}
          <div
            className="flex items-center gap-3 px-4 py-2 rounded-2xl border border-white/10 bg-[#131419]/90 backdrop-blur-[24px] shadow-lg shadow-black/40"
            style={{ backdropFilter: "blur(24px)" }}
          >
            <div className="relative flex items-center justify-center">
              <span className={`w-3 h-3 rounded-full ${savedCount > 0 ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
              <span className={`absolute w-3 h-3 rounded-full ${savedCount > 0 ? "bg-emerald-400/50" : "bg-amber-400/50"} animate-ping`} />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-white/50 font-medium">Active Keys</div>
              <div className="text-base font-bold text-[#F5F6F8] flex items-center gap-1.5">
                <span>{savedCount} Loaded</span>
                {savedCount >= 100 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/30">
                    High Capacity
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Alert */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-2xl border flex items-center gap-3 ${
                feedback.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : feedback.type === "error"
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                  : "bg-white/5 border-white/10 text-white/80"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="text-sm font-medium">{feedback.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status Dashboard Panel */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-2xl border border-white/10 bg-[#131419]/80 backdrop-blur-[24px]"
          style={{ backdropFilter: "blur(24px)" }}
        >
          <div className="space-y-1">
            <div className="text-xs text-white/50 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-[#00F0FF]" /> Active Key Index
            </div>
            <div className="text-lg font-semibold text-[#F5F6F8]">
              {savedCount > 0 ? `Key #${activeStatus.currentIndex + 1} of ${savedCount}` : "Idle (0 Keys)"}
            </div>
            <div className="text-xs text-white/40">Remembers state on 429/403</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-white/50 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Active Masked Key
            </div>
            <div className="text-sm font-mono text-[#F5F6F8] bg-black/40 px-2.5 py-1 rounded-lg border border-white/5 inline-block">
              {activeStatus.activeKeyMasked}
            </div>
            <div className="text-xs text-emerald-400/80 capitalize">Provider: {activeStatus.currentProvider}</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-white/50 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Auto-Retry Policy
            </div>
            <div className="text-sm font-medium text-[#F5F6F8]">
              Automatic rotation on 429 Rate Limit & 403 Quota
            </div>
            <div className="text-xs text-white/40">Full loop before exhaustion</div>
          </div>
        </div>

        {/* Input Card */}
        <div
          className="p-6 md:p-8 rounded-3xl border border-white/10 bg-[#131419]/90 backdrop-blur-[24px] shadow-2xl space-y-6"
          style={{ backdropFilter: "blur(24px)" }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label htmlFor="keyInput" className="text-sm font-semibold text-[#F5F6F8] flex items-center gap-2">
                <Key className="w-4 h-4 text-[#00F0FF]" /> Paste API Keys (Google, NVIDIA, OpenRouter)
              </label>
              <p className="text-xs text-white/50 mt-1">
                Paste 100+ keys separated by commas or new lines. The pool dynamically routes and switches seamlessly on rate limits.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-white/70">
                {detectedCount} detected in buffer
              </span>
            </div>
          </div>

          {/* Liquid Glass Textarea */}
          <div className="relative group">
            <textarea
              id="keyInput"
              rows={10}
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder="Paste 100+ keys here... e.g.:&#10;AIzaSyGoogleKey1_Example,&#10;nvapi-NvidiaKey2_Example,&#10;sk-or-v1-OpenRouterKey3_Example"
              className="w-full bg-[#0A0B0F]/90 text-[#F5F6F8] font-mono text-xs md:text-sm p-4 rounded-2xl border border-white/10 focus:border-[#00F0FF]/60 focus:ring-2 focus:ring-[#00F0FF]/20 outline-none transition-all resize-y placeholder:text-white/20 shadow-inner"
            />
          </div>

          {/* Action Buttons Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSaveKeys}
                className="px-6 py-3 rounded-2xl font-semibold text-sm bg-[#00F0FF] text-[#0A0B0F] hover:bg-[#00F0FF]/90 shadow-lg shadow-[#00F0FF]/25 hover:shadow-[#00F0FF]/40 active:scale-95 transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Save Keys ({detectedCount})
              </button>

              <button
                type="button"
                onClick={handleTestRotation}
                disabled={testing || savedCount === 0}
                className="px-4 py-3 rounded-2xl font-medium text-xs md:text-sm bg-white/5 border border-white/10 hover:border-white/25 text-[#F5F6F8] hover:bg-white/10 disabled:opacity-40 transition-all flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${testing ? "animate-spin text-[#00F0FF]" : ""}`} />
                Test Key Rotation
              </button>

              <button
                type="button"
                onClick={handleLoadDemoKeys}
                className="px-4 py-3 rounded-2xl font-medium text-xs md:text-sm bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] hover:bg-[#00F0FF]/20 transition-all flex items-center gap-2"
                title="Load 120 simulated enterprise API keys"
              >
                <Sparkles className="w-4 h-4" /> Pre-fill 120 Mock Keys
              </button>
            </div>

            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-2 rounded-xl text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear All
            </button>
          </div>

          {/* Test Rotation Result */}
          {testResult && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                testResult.success
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                  : "bg-rose-500/10 border border-rose-500/20 text-rose-300"
              }`}
            >
              <Zap className="w-4 h-4 flex-shrink-0" />
              <span>{testResult.message}</span>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-white/40 pt-4">
          <div>Persistence: Active index saved to localStorage under &apos;hey_key_rotator_index&apos;</div>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-[#00F0FF] hover:underline"
          >
            Launch Teacher Dashboard &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { Sparkles, Key, Compass, ArrowRight, BookOpen, Layers } from "lucide-react";
import { analyzeTeacher, SUBJECT_CONFIGS } from "../core/aiRouter.js";
import { keyRotator } from "../core/keyRotator.js";

const QUICK_PRESETS = [
  { label: "AP Chemistry & Thermodynamics", query: "AP Chemistry & Thermodynamics", color: "#00F0FF", icon: "🧪" },
  { label: "Multivariable Calculus", query: "Multivariable Calculus and Vector Fields", color: "#8B5CF6", icon: "📐" },
  { label: "Digital Art & Color Theory", query: "Digital Illustration, Composition and Color Theory", color: "#EC4899", icon: "🎨" },
  { label: "Molecular Biology & Genetics", query: "Molecular Biology, Cellular Respiration and Genetics", color: "#10B981", icon: "🧬" },
  { label: "Quantum Mechanics & Physics", query: "Quantum Physics, Mechanics and Wave Optics", color: "#F59E0B", icon: "⚡" },
  { label: "AP English & World Literature", query: "AP English Literature and Comparative Rhetoric", color: "#3B82F6", icon: "📚" },
];

export default function TeacherEntry() {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeKeyCount, setActiveKeyCount] = useState(() => keyRotator.getKeyCount());

  const handleAnalyze = async (teacherQuery) => {
    const targetQuery = (teacherQuery || input).trim();
    if (!targetQuery || isAnalyzing) return;

    setIsAnalyzing(true);

    try {
      // 300ms glowing "Analyzing..." state
      const [analysisResult] = await Promise.all([
        analyzeTeacher(targetQuery),
        new Promise((resolve) => setTimeout(resolve, 300)),
      ]);

      // Save to localStorage
      localStorage.setItem("hey_teacher_analysis", JSON.stringify(analysisResult));
      localStorage.setItem("hey_teacher_subject", analysisResult.subject);
      localStorage.setItem("hey_teacher_input", targetQuery);
      localStorage.setItem("hey_teacher_active", "true");

      // Navigate to /dashboard
      navigate("/dashboard");
    } catch (err) {
      console.error("Analysis failed:", err);
      // Fallback save to ensure navigation never leaves user stranded
      const fallback = SUBJECT_CONFIGS.chem;
      localStorage.setItem("hey_teacher_analysis", JSON.stringify(fallback));
      localStorage.setItem("hey_teacher_subject", fallback.subject);
      localStorage.setItem("hey_teacher_input", targetQuery);
      localStorage.setItem("hey_teacher_active", "true");
      navigate("/dashboard");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAnalyze(input);
    }
  };

  return (
    <div
      className="min-h-screen text-[#F5F6F8] font-['Inter',sans-serif] flex flex-col justify-between p-6 md:p-10 relative overflow-hidden select-none"
      style={{
        backgroundColor: "#0A0B0F",
        backgroundImage: "radial-gradient(circle at 50% 30%, rgba(0, 240, 255, 0.07) 0%, transparent 65%)",
      }}
    >
      {/* Optical background glow nodes */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-gradient-to-r from-[#00F0FF]/10 via-[#8B5CF6]/10 to-[#EC4899]/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 left-10 w-[350px] h-[350px] bg-[#10B981]/5 blur-[100px] pointer-events-none rounded-full" />

      {/* Top Header */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#131419] border border-white/10 flex items-center justify-center shadow-lg shadow-black/50">
            <span className="font-extrabold text-base tracking-tighter bg-gradient-to-br from-white via-[#F5F6F8] to-[#00F0FF] bg-clip-text text-transparent">
              HEY
            </span>
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight text-[#F5F6F8] flex items-center gap-2">
              Teacher Engine
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 font-medium uppercase tracking-wider">
                Production v1.0
              </span>
            </div>
            <div className="text-[11px] text-white/40">Liquid Glass Intelligence</div>
          </div>
        </div>

        {/* Key Pool Link & Status */}
        <div className="flex items-center gap-3">
          <Link
            to="/settings/keys"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-[#131419]/90 border border-white/10 hover:border-[#00F0FF]/40 backdrop-blur-[24px] text-xs font-medium text-white/80 hover:text-white transition-all shadow-md group"
            style={{ backdropFilter: "blur(24px)" }}
          >
            <Key className="w-3.5 h-3.5 text-[#00F0FF] group-hover:rotate-45 transition-transform" />
            <span>Key Pool</span>
            <span className="px-1.5 py-0.5 rounded-md bg-white/10 text-[10px] font-mono text-white/90">
              {activeKeyCount}
            </span>
          </Link>
        </div>
      </header>

      {/* Main Centered Stage */}
      <main className="w-full max-w-4xl mx-auto my-auto relative z-20 flex flex-col items-center text-center px-4">
        {/* Subtle Pill */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-[#131419]/80 backdrop-blur-[24px] text-xs font-medium text-white/70 mb-8"
          style={{ backdropFilter: "blur(24px)" }}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#00F0FF]" />
          <span>Universal Subject Intelligence &amp; Multi-Tool Workspace</span>
        </motion.div>

        {/* Input Container */}
        <div className="w-full relative group">
          {/* Glowing Aura when analyzing */}
          <motion.div
            className={`absolute -inset-1 rounded-[36px] blur-xl transition-all duration-500 opacity-0 ${
              isAnalyzing
                ? "opacity-100 bg-gradient-to-r from-[#00F0FF] via-[#8B5CF6] to-[#EC4899] animate-pulse"
                : "group-hover:opacity-40 bg-gradient-to-r from-[#00F0FF]/40 to-[#8B5CF6]/30"
            }`}
          />

          {/* Centered Massive Glassmorphic Input Box */}
          <div
            className={`w-full relative rounded-[32px] border transition-all duration-300 p-2 md:p-3 flex items-center gap-4 ${
              isAnalyzing
                ? "bg-[#131419] border-[#00F0FF] shadow-[0_0_50px_rgba(0,240,255,0.35)]"
                : "bg-[#131419]/90 border-white/15 hover:border-white/30 focus-within:border-[#00F0FF]/80 focus-within:shadow-[0_0_40px_rgba(0,240,255,0.2)]"
            }`}
            style={{
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
            }}
          >
            <input
              type="text"
              autoFocus
              value={input}
              disabled={isAnalyzing}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isAnalyzing ? "" : "What do you teach?"}
              className="w-full bg-transparent text-[#F5F6F8] font-['Inter',sans-serif] text-xl sm:text-2xl md:text-[32px] px-6 py-6 md:py-8 outline-none placeholder:text-white/25 placeholder:font-normal font-medium tracking-tight disabled:opacity-50"
              style={{
                fontSize: "clamp(22px, 3.5vw, 32px)",
              }}
            />

            {/* Glowing Analyzing State Overlay */}
            <AnimatePresence>
              {isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center rounded-[32px] bg-[#131419]/95 backdrop-blur-[24px] z-10 gap-3"
                >
                  <div className="w-5 h-5 rounded-full border-2 border-[#00F0FF] border-t-transparent animate-spin" />
                  <span className="text-xl md:text-2xl font-bold tracking-tight text-[#00F0FF] drop-shadow-[0_0_12px_rgba(0,240,255,0.8)] animate-pulse">
                    Analyzing...
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Action Button */}
            {!isAnalyzing && (
              <button
                type="button"
                onClick={() => handleAnalyze(input)}
                disabled={!input.trim()}
                className="flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-[#00F0FF] text-[#0A0B0F] flex items-center justify-center font-bold hover:scale-105 active:scale-95 disabled:opacity-20 disabled:hover:scale-100 transition-all shadow-lg shadow-[#00F0FF]/30 hover:shadow-[#00F0FF]/50 mr-2"
                title="Enter"
              >
                <ArrowRight className="w-6 h-6 md:w-7 md:h-7" />
              </button>
            )}
          </div>
        </div>

        {/* Hint text */}
        <p className="text-xs md:text-sm text-white/40 mt-4 font-normal">
          Press <kbd className="px-2 py-0.5 rounded-md bg-white/10 font-mono text-white/80 text-xs">Enter ↵</kbd> to analyze subject, configure theme, and mount custom workspace tools
        </p>

        {/* Quick Suggestion Pills */}
        <div className="w-full mt-10 space-y-3">
          <div className="text-xs uppercase tracking-widest text-white/40 font-medium">Or choose a curriculum discipline:</div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-2xl mx-auto">
            {QUICK_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setInput(p.query);
                  handleAnalyze(p.query);
                }}
                disabled={isAnalyzing}
                className="px-4 py-2 rounded-2xl bg-[#131419]/80 border border-white/10 hover:border-white/30 backdrop-blur-[24px] text-xs font-medium text-[#F5F6F8] flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-sm group"
                style={{ backdropFilter: "blur(24px)" }}
              >
                <span>{p.icon}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Footer info */}
      <footer className="w-full max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-white/40 gap-3 border-t border-white/5 pt-6 z-20">
        <div className="flex items-center gap-2">
          <span>HEY Teacher Engine</span>
          <span>•</span>
          <span>Liquid Glass UI (#0A0B0F / #131419)</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/settings/keys" className="hover:text-white transition-colors">
            API Key Pool
          </Link>
          <Link to="/dashboard" className="text-[#00F0FF] hover:underline">
            Go to Dashboard &rarr;
          </Link>
        </div>
      </footer>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import {
  Compass,
  Key,
  Settings as SettingsIcon,
  Sparkles,
  ArrowLeft,
  Layers,
  Shield,
  Plus,
  Maximize2,
  Minimize2,
  Columns,
  MessageSquare,
  Award,
  Target,
  BookOpen,
  CheckCircle2,
  Atom,
  Binary,
  Palette,
  Dna,
  Orbit,
  Flame,
  Zap,
} from "lucide-react";

import ChatInterface from "../components/ChatInterface.jsx";
import CustomToolRenderer from "../components/CustomToolRenderer.jsx";
import { keyRotator } from "../core/keyRotator.js";
import { SUBJECT_CONFIGS } from "../core/aiRouter.js";
import { getCustomTools, stageCustomTool, seedStarterVaultToolIfEmpty } from "../core/vaultStaging.js";

// Subject tools
import ChemTools from "../components/Tools/ChemTools.jsx";
import MathTools from "../components/Tools/MathTools.jsx";
import ArtTools from "../components/Tools/ArtTools.jsx";
import BioTools from "../components/Tools/BioTools.jsx";
import PhysicsTools from "../components/Tools/PhysicsTools.jsx";
import EnglishTools from "../components/Tools/EnglishTools.jsx";

const SUBJECT_ICONS = {
  chem: Atom,
  math: Binary,
  art: Palette,
  bio: Dna,
  phys: Orbit,
  eng: BookOpen,
};

export default function TeacherDashboard() {
  const navigate = useNavigate();

  // Load analysis data from localStorage
  const [analysisData, setAnalysisData] = useState(() => {
    try {
      const stored = localStorage.getItem("hey_teacher_analysis");
      if (stored) return JSON.parse(stored);
    } catch {}
    return SUBJECT_CONFIGS.chem;
  });

  const subjectKey = analysisData.subject || "chem";
  const subjectConfig = SUBJECT_CONFIGS[subjectKey] || SUBJECT_CONFIGS.chem;
  const themeColor = analysisData.themeColor || subjectConfig.themeColor;
  const tools = analysisData.tools || subjectConfig.tools;

  // Active Tool selection (null = Chat only; string = Tool Name or 'vault:toolId')
  const [activeTool, setActiveTool] = useState(tools[0] || "Periodic Table");
  const [customTools, setCustomTools] = useState([]);
  const [viewMode, setViewMode] = useState("split"); // "split" | "tool-only" | "chat-only"

  // Key Rotator Status
  const [keyStatus, setKeyStatus] = useState(() => keyRotator.getStatus());

  // Staging Modal for adding custom vault tool
  const [showAddVaultModal, setShowAddVaultModal] = useState(false);
  const [newVaultName, setNewVaultName] = useState("");
  const [newVaultCode, setNewVaultCode] = useState("");

  useEffect(() => {
    // Seed starter vault tool if none exists
    seedStarterVaultToolIfEmpty();
    setCustomTools(getCustomTools());

    const handleVaultUpdated = () => {
      setCustomTools(getCustomTools());
    };
    window.addEventListener("hey:vault-updated", handleVaultUpdated);
    return () => window.removeEventListener("hey:vault-updated", handleVaultUpdated);
  }, []);

  const handleStageNewTool = (e) => {
    e.preventDefault();
    if (!newVaultName.trim()) return;
    const defaultSnippet = newVaultCode.trim() || `<!DOCTYPE html>
<html>
<body style="background:#0A0B0F;color:#F5F6F8;font-family:sans-serif;padding:30px;text-align:center;">
  <h2 style="color:${themeColor};">${newVaultName}</h2>
  <p>Custom sandbox tool executed directly inside sandboxed iframe runtime.</p>
</body>
</html>`;
    const tool = stageCustomTool(newVaultName.trim(), defaultSnippet);
    setActiveTool(`vault:${tool.id}`);
    setShowAddVaultModal(false);
    setNewVaultName("");
    setNewVaultCode("");
  };

  // Render the appropriate subject tool component
  const renderActiveToolComponent = () => {
    if (!activeTool) return null;

    if (activeTool.startsWith("vault:")) {
      const toolId = activeTool.replace("vault:", "");
      return <CustomToolRenderer toolId={toolId} onClose={() => setActiveTool(null)} />;
    }

    switch (subjectKey) {
      case "chem":
        return <ChemTools activeToolName={activeTool} />;
      case "math":
        return <MathTools activeToolName={activeTool} />;
      case "art":
        return <ArtTools activeToolName={activeTool} />;
      case "bio":
        return <BioTools activeToolName={activeTool} />;
      case "phys":
        return <PhysicsTools activeToolName={activeTool} />;
      case "eng":
        return <EnglishTools activeToolName={activeTool} />;
      default:
        return <ChemTools activeToolName={activeTool} />;
    }
  };

  const SubjectIcon = SUBJECT_ICONS[subjectKey] || Atom;

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden text-[#F5F6F8] font-['Inter',sans-serif] select-none"
      style={{
        backgroundColor: "#0A0B0F",
      }}
    >
      {/* ============================================================== */}
      {/* TOP HEADER: Shows Subject Name with themeColor */}
      {/* ============================================================== */}
      <header
        className="h-16 px-6 border-b border-white/10 flex items-center justify-between z-30 flex-shrink-0"
        style={{
          backgroundColor: "#131419",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
      >
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate("/teacher")}
            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-white/70 hover:text-white transition-all flex items-center gap-1.5 text-xs"
            title="Change Subject"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Change Subject</span>
          </button>

          <div className="h-5 w-[1px] bg-white/10" />

          {/* Subject Badge with ThemeColor */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg"
              style={{
                backgroundColor: `${themeColor}20`,
                borderColor: `${themeColor}50`,
                borderWidth: 1,
                color: themeColor,
              }}
            >
              <SubjectIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1
                  className="text-base font-bold tracking-tight drop-shadow-sm"
                  style={{ color: themeColor }}
                >
                  {subjectConfig.name}
                </h1>
                <span
                  className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border"
                  style={{
                    backgroundColor: `${themeColor}15`,
                    borderColor: `${themeColor}40`,
                    color: themeColor,
                  }}
                >
                  {subjectKey.toUpperCase()} Engine
                </span>
              </div>
              <div className="text-[11px] text-white/40">Active Curriculum Command Center</div>
            </div>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="hidden md:flex items-center p-1 rounded-xl bg-black/40 border border-white/10 text-xs">
            <button
              onClick={() => setViewMode("split")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "split" ? "bg-white/15 text-white" : "text-white/40 hover:text-white"}`}
              title="Split View (Tool & Chat)"
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("tool-only")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "tool-only" ? "bg-white/15 text-white" : "text-white/40 hover:text-white"}`}
              title="Tool Fullscreen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("chat-only")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "chat-only" ? "bg-white/15 text-white" : "text-white/40 hover:text-white"}`}
              title="Chat Focus"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Key Pool Link */}
          <Link
            to="/settings/keys"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-xs text-white/80 transition-all"
          >
            <Key className="w-3.5 h-3.5" style={{ color: themeColor }} />
            <span className="hidden sm:inline">Keys:</span>
            <span className="font-mono font-bold text-white">{keyStatus.totalKeys}</span>
          </Link>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 3-COLUMN MAIN LAYOUT */}
      {/* Left Sidebar (280px) | Center Canvas (Flex) | Right Rail (320px) */}
      {/* ============================================================== */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ------------------------------------------------------------ */}
        {/* LEFT SIDEBAR: 280px, #131419 with 24px backdrop-blur */}
        {/* ------------------------------------------------------------ */}
        <aside
          className="w-[280px] flex-shrink-0 flex flex-col border-r border-white/10 z-20 overflow-y-auto"
          style={{
            backgroundColor: "#131419",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
          }}
        >
          {/* AI Router Tools Section */}
          <div className="p-4 space-y-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 px-2 flex items-center justify-between">
                <span>AI Router Tools</span>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: themeColor }} />
              </div>

              <div className="space-y-1">
                {tools.map((toolName) => {
                  const isActive = activeTool === toolName;
                  return (
                    <button
                      key={toolName}
                      type="button"
                      onClick={() => {
                        setActiveTool(toolName);
                        if (viewMode === "chat-only") setViewMode("split");
                      }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                        isActive
                          ? "text-[#0A0B0F] font-bold shadow-md"
                          : "text-white/70 hover:text-white hover:bg-white/5"
                      }`}
                      style={
                        isActive
                          ? {
                              backgroundColor: themeColor,
                              boxShadow: `0 4px 14px ${themeColor}35`,
                            }
                          : undefined
                      }
                    >
                      <span className="truncate">{toolName}</span>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#0A0B0F]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Tools Section (Invisible Vault items) */}
            <div className="pt-2 border-t border-white/10">
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 px-2 flex items-center justify-between">
                <span>Custom Tools (Vault)</span>
                <button
                  type="button"
                  onClick={() => setShowAddVaultModal(true)}
                  className="hover:text-white transition-colors flex items-center gap-1 text-[10px] text-[#00F0FF]"
                  title="Stage new tool into Vault"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>

              {customTools.length === 0 ? (
                <div className="p-3 rounded-xl bg-white/5 border border-dashed border-white/10 text-center text-xs text-white/40">
                  No staged vault tools yet.
                </div>
              ) : (
                <div className="space-y-1">
                  {customTools.map((cTool) => {
                    const isVaultActive = activeTool === `vault:${cTool.id}`;
                    return (
                      <button
                        key={cTool.id}
                        type="button"
                        onClick={() => {
                          setActiveTool(`vault:${cTool.id}`);
                          if (viewMode === "chat-only") setViewMode("split");
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all ${
                          isVaultActive
                            ? "bg-white/15 text-white border border-white/20 font-semibold"
                            : "text-white/60 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <Shield className="w-3.5 h-3.5 text-[#00F0FF] flex-shrink-0" />
                        <span className="truncate">{cTool.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Footer Link */}
          <div className="mt-auto p-4 border-t border-white/10">
            <Link
              to="/settings/keys"
              className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-white/70 hover:text-white transition-all w-full"
            >
              <SettingsIcon className="w-3.5 h-3.5" />
              <span>Rotator Key Settings</span>
            </Link>
          </div>
        </aside>

        {/* ------------------------------------------------------------ */}
        {/* CENTER CANVAS: Contains Split-Pane or Chat Interface */}
        {/* ------------------------------------------------------------ */}
        <main className="flex-1 flex overflow-hidden relative bg-[#0A0B0F]">
          {viewMode === "chat-only" || !activeTool ? (
            <div className="h-full w-full">
              <ChatInterface
                subject={subjectKey}
                themeColor={themeColor}
                onTriggerTool={(tName) => setActiveTool(tName)}
              />
            </div>
          ) : viewMode === "tool-only" ? (
            <div className="h-full w-full p-4">
              {renderActiveToolComponent()}
            </div>
          ) : (
            /* Split View: Tool on Left, Chat on Right */
            <div className="h-full w-full flex flex-col lg:flex-row overflow-hidden">
              {/* Tool Half */}
              <div className="flex-1 h-full p-3 lg:p-4 overflow-hidden border-r border-white/10">
                {renderActiveToolComponent()}
              </div>
              {/* Chat Half */}
              <div className="flex-1 h-full overflow-hidden">
                <ChatInterface
                  subject={subjectKey}
                  themeColor={themeColor}
                  onTriggerTool={(tName) => setActiveTool(tName)}
                />
              </div>
            </div>
          )}
        </main>

        {/* ------------------------------------------------------------ */}
        {/* RIGHT RAIL: 320px, #1C1E24 with 24px backdrop-blur */}
        {/* ------------------------------------------------------------ */}
        <aside
          className="w-[320px] flex-shrink-0 flex flex-col border-l border-white/10 z-20 overflow-y-auto hidden xl:flex"
          style={{
            backgroundColor: "#1C1E24",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
          }}
        >
          <div className="p-5 space-y-6">
            {/* Mission Card */}
            <div className="p-4 rounded-2xl border border-white/10 bg-black/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-amber-400" /> Active Mission
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-400 border border-amber-400/30 font-semibold">
                  In Progress
                </span>
              </div>
              <h4 className="text-sm font-bold text-white leading-tight">
                Design Scaffolded Unit &amp; Interactive Student Worksheet
              </h4>
              <p className="text-xs text-white/60 leading-relaxed">
                Synthesize inquiry-based prompts, verify safe lab procedures, and export student-facing problem sets.
              </p>
            </div>

            {/* Context Card */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 block">
                Classroom Context
              </span>
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-white/50">Discipline</span>
                  <span className="font-semibold text-white">{subjectConfig.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Grade Level</span>
                  <span className="font-semibold text-white">AP / Advanced Honors</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Class Length</span>
                  <span className="font-semibold text-white">55 min Block</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Theme Signature</span>
                  <span className="font-mono" style={{ color: themeColor }}>{themeColor}</span>
                </div>
              </div>
            </div>

            {/* Student Comprehension Gauge */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 block">
                Classroom Mastery Pulse
              </span>
              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-white/70">Concept Grasp</span>
                    <span className="font-bold text-emerald-400">84%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full w-[84%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-white/70">Lab Protocol Safety</span>
                    <span className="font-bold text-[#00F0FF]">96%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-[#00F0FF] rounded-full w-[96%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-white/70">Critical Socratic Inquiry</span>
                    <span className="font-bold text-purple-400">72%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-purple-400 rounded-full w-[72%]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Prompts */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 block">
                Recommended Prompts
              </span>
              {[
                `"Explain the core misconception students make in ${subjectConfig.name}."`,
                `"Create a 5-minute bell ringer hook."`,
                `"Draft an AP-level multi-step exam question."`,
              ].map((qp, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-[11px] text-white/80 hover:text-white cursor-pointer hover:bg-white/10 transition-all italic"
                >
                  {qp}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* ============================================================== */}
      {/* MODAL: STAGE NEW CUSTOM TOOL (INVISIBLE VAULT) */}
      {/* ============================================================== */}
      <AnimatePresence>
        {showAddVaultModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg p-6 rounded-3xl border border-white/15 bg-[#131419] shadow-2xl space-y-4"
              style={{ backdropFilter: "blur(24px)" }}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#00F0FF]" />
                  <h3 className="text-base font-bold text-white">Stage New Tool into Vault</h3>
                </div>
                <button
                  onClick={() => setShowAddVaultModal(false)}
                  className="text-white/40 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleStageNewTool} className="space-y-3">
                <div>
                  <label className="text-xs text-white/70 block mb-1">Tool Name</label>
                  <input
                    type="text"
                    required
                    value={newVaultName}
                    onChange={(e) => setNewVaultName(e.target.value)}
                    placeholder="e.g. Dynamic Mole Calculator"
                    className="w-full px-3 py-2 rounded-xl bg-[#0A0B0F] border border-white/10 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/70 block mb-1">HTML / JavaScript Code (Sandboxed)</label>
                  <textarea
                    rows={5}
                    value={newVaultCode}
                    onChange={(e) => setNewVaultCode(e.target.value)}
                    placeholder="<!DOCTYPE html><html><body>...</body></html>"
                    className="w-full p-3 rounded-xl bg-[#0A0B0F] border border-white/10 font-mono text-xs text-emerald-400 outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddVaultModal(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 text-xs text-white/70 hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#00F0FF] text-[#0A0B0F] font-bold text-xs shadow-md"
                  >
                    Stage into Vault
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { Maximize2, Minimize2, RefreshCw, Code, Trash2, Shield, AlertCircle } from "lucide-react";
import { getCustomTool, removeCustomTool } from "../core/vaultStaging.js";

/**
 * CustomToolRenderer
 * Renders custom vault tools safely inside an isolated <iframe sandbox="allow-scripts">
 */
export default function CustomToolRenderer({ toolId, toolName, onClose, onDelete }) {
  const [tool, setTool] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    const loaded = getCustomTool(toolId || toolName);
    setTool(loaded);
  }, [toolId, toolName, refreshKey]);

  if (!tool) {
    return (
      <div
        className="h-full flex flex-col items-center justify-center p-8 text-center rounded-3xl border border-white/10 bg-[#131419]/90 backdrop-blur-[24px]"
        style={{ backdropFilter: "blur(24px)" }}
      >
        <AlertCircle className="w-12 h-12 text-amber-400 mb-3" />
        <h3 className="text-lg font-bold text-[#F5F6F8]">Custom Tool Not Found</h3>
        <p className="text-sm text-white/50 max-w-sm mt-1">
          The requested vault tool &ldquo;{toolName || toolId}&rdquo; could not be located in localStorage.
        </p>
      </div>
    );
  }

  const handleDelete = () => {
    if (window.confirm(`Remove "${tool.name}" from the Vault?`)) {
      removeCustomTool(tool.id);
      if (onDelete) onDelete(tool.id);
      if (onClose) onClose();
    }
  };

  return (
    <div
      className={`flex flex-col rounded-3xl border border-white/10 bg-[#131419]/95 backdrop-blur-[24px] overflow-hidden transition-all duration-300 ${
        isFullscreen ? "fixed inset-4 z-50 shadow-2xl" : "h-full w-full"
      }`}
      style={{ backdropFilter: "blur(24px)" }}
    >
      {/* Tool Header Bar */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-black/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/30 flex items-center justify-center text-[#00F0FF]">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#F5F6F8]">{tool.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                Sandboxed Frame
              </span>
            </div>
            <div className="text-[11px] text-white/40">Secure Invisible Vault Runtime</div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowCode(!showCode)}
            className={`p-2 rounded-xl text-xs border transition-all ${
              showCode
                ? "bg-[#00F0FF]/20 border-[#00F0FF]/40 text-[#00F0FF]"
                : "bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10"
            }`}
            title="Inspect source code"
          >
            <Code className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            className="p-2 rounded-xl text-xs bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all"
            title="Reload sandbox"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl text-xs bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all"
            title={isFullscreen ? "Exit fullscreen" : "Maximize view"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="p-2 rounded-xl text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all"
            title="Remove from vault"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Body: iFrame or Code View */}
      <div className="flex-1 relative bg-[#0A0B0F]/60 overflow-hidden">
        {showCode ? (
          <div className="absolute inset-0 p-4 overflow-auto">
            <pre className="font-mono text-xs text-[#00F0FF] bg-[#0A0B0F] p-4 rounded-2xl border border-white/10 select-text overflow-x-auto">
              {tool.code}
            </pre>
          </div>
        ) : (
          <iframe
            key={refreshKey}
            title={tool.name}
            sandbox="allow-scripts"
            srcDoc={tool.code}
            className="w-full h-full border-none bg-transparent"
          />
        )}
      </div>
    </div>
  );
}

The user wants me to upgrade the file using the skill library. They want the output as a JSON tool call array wrapped in a  code block, per the format requirement. But then they say "output ONLY the raw upgraded code. No markdown. No truncation."

There's tension: the FORMAT REQUIREMENT says wrap ALL JSON tool call arrays in  code block. The mission says output only raw upgraded code, no markdown. The format requirement is critical for the automation harness. So I should use write_file tool call in a JSON code block with the upgraded content.

Let me carefully read. The file was truncated in "CURRENT CODE" — it ends mid-iframe. I need to reconstruct/complete the component sensibly.

I should:

Complete the iframe with srcDoc={tool.code} sandbox="allow-scripts".

Improve UI to "Liquid Glass" — more glassy, blur, subtle gradients.

Fix bugs:

tool not found case, but also need to handle empty.

useEffect dependency includes refreshKey but it's fine; the getCustomTool might throw — wrap in try/catch.

Missing onClose in fullscreen (Escape key to exit).

Delete should probably be a custom confirm? The mission says fix bugs.

showCode toggle with fullscreen.

The header buttons lack type consistency — they have it.

Add accessibility: aria-labels, focus-visible rings.

Motion principles: Emil — speed/restraint: transitions should be fast (~150-200ms), easing custom cubic-bezier. Avoid "transition-all" which is a common AI-slop pattern. Use specific properties. Add motion-reduce support (prefers-reduced-motion).

Frequency gate: header button hovers are high-frequency → keep fast, no scale bounce. Fullscreen toggle is low frequency → can have slight scale/spring.

Remove transition-all duration-300 on container — replace with targeted transitions, and use will-change sparingly.

Add Escape to close fullscreen, and lock body scroll in fullscreen maybe.

Add copy code button in code view.

Add aria-pressed for toggles.

Add empty-code state.

Add iframe loading state? Maybe a subtle skeleton.

Add title on iframe for a11y.

Sandbox: allow-scripts only — but need allow-same-origin? No — the point is isolation. But srcDoc with allow-scripts only means localStorage access blocked. Fine. Maybe mention. Actually for tools to work they may need allow-modals, allow-forms, allow-popups? Keep minimal but add allow-forms? Hmm — safer to keep allow-scripts only. But then the tool might not work. The original comment says sandbox="allow-scripts". I'll keep allow-scripts and maybe add allow-forms allow-modals? That reduces security slightly. I'll keep only allow-scripts to preserve security posture, and add referrerPolicy="no-referrer".

Liquid Glass: layered translucency, saturated backdrop blur, subtle inner highlight (inset 0 1px 0 rgba(255,255,255,0.08)), gradient border via ::before or box-shadow. In Tailwind + inline styles I can add a style object.

Let me write clean code.

Design details:

Container: rounded-3xl with border border-white/10, bg gradient, backdrop blur, box-shadow: 0 24px 64px -24px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.06).

Header: subtle gradient bg-black/20, sticky.

Buttons: a reusable ToolButton component inside the file.

Motion: transition-[background-color,color,border-color,transform] duration-150 ease-out and active:scale-[0.97] on high-frequency buttons — Emil says small scale on press is fine for buttons. Actually Emil recommends press feedback. Use active:scale-95 with fast duration.

motion-reduce:transition-none motion-reduce:transform-none.

Fullscreen transition: use transition-[box-shadow] maybe, or just none since layout jumps. Actually changing to fixed inset-4 is a layout change; a transition on all 300ms won't animate position anyway. Better: no transition on container; instead animate the fullscreen icon with rotate.

Let me add a useEffect for Escape key that closes fullscreen first, then calls onClose.

Also body scroll lock in fullscreen.

Also a status/toolbar footer? Maybe a slim footer with sandbox info + char count. Could be nice. Keep it.

view: add copy button, and line numbers? Keep simple: mono pre with select-text, overflow-auto, and a copy button top-right.

Let me write the component.

jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Maximize2,
  Minimize2,
  RefreshCw,
  Code,
  Trash2,
  Shield,
  AlertCircle,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import { getCustomTool, removeCustomTool } from "../core/vaultStaging.js";

Wait — the original imports removeCustomTool from vaultStaging. Keep.

Component:

jsx
const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";

function IconButton({ active, danger, label, onClick, children, spin }) { ... }

Let me define the icon button with proper classes.

jsx
function ToolbarButton({ label, onClick, active = false, danger = false, disabled = false, children }) {
  const base =
    "group relative inline-flex h-9 w-9 items-center justify-center rounded-xl border text-[13px] outline-none " +
    "transition-[background-color,border-color,color,transform,box-shadow] duration-150 ease-out " +
    "active:scale-[0.94] motion-reduce:transition-none motion-reduce:active:scale-100 " +
    "focus-visible:ring-2 focus-visible:ring-[#00F0FF]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#131419] " +
    "disabled:opacity-40 disabled:pointer-events-none";
  const tone = danger
    ? "border-rose-500/25 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:border-rose-500/40 hover:text-rose-200"
    : active
    ? "border-[#00F0FF]/45 bg-[#00F0FF]/15 text-[#00F0FF] shadow-[0_0_0_1px_rgba(0,240,255,0.08),0_6px_18px_-8px_rgba(0,240,255,0.6)]"
    : "border-white/10 bg-white/[0.04] text-white/65 hover:bg-white/[0.09] hover:border-white/20 hover:text-white";
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} aria-pressed={active || undefined} title={label} className={`${base} ${tone}`}>
      {children}
    </button>
  );
}

Hmm aria-pressed for active toggle. For non-toggle it'd be false. Use active === true ? true : undefined. Fine as is.

Main component:

jsx
export default function CustomToolRenderer({ toolId, toolName, onClose, onDelete }) {
  const [tool, setTool] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const copyTimer = useRef(null);
  const reloadTimer = useRef(null);

Load effect:

jsx
  useEffect(() => {
    let cancelled = false;
    try {
      const loaded = getCustomTool(toolId || toolName);
      if (!cancelled) { setTool(loaded || null); setLoadError(false); }
    } catch (err) {
      console.error("[CustomToolRenderer] Failed to load tool:", err);
      if (!cancelled) { setTool(null); setLoadError(true); }
    }
    return () => { cancelled = true; };
  }, [toolId, toolName, refreshKey]);

Hmm refreshKey triggers reload of tool — fine, keep.

Escape handling:

jsx
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== "Escape") return;
      if (isFullscreen) { e.stopPropagation(); setIsFullscreen(false); }
      else if (onClose) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isFullscreen, onClose]);

Body scroll lock:

jsx
  useEffect(() => {
    if (!isFullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isFullscreen]);

Cleanup timers:

jsx
  useEffect(() => () => { clearTimeout(copyTimer.current); clearTimeout(reloadTimer.current); }, []);

Handlers:

jsx
  const handleReload = useCallback(() => {
    setIsReloading(true);
    setRefreshKey((k) => k + 1);
    clearTimeout(reloadTimer.current);
    reloadTimer.current = setTimeout(() => setIsReloading(false), 450);
  }, []);

Actually reloading spinner should end when iframe onLoad fires. Use iframe onLoad={() => setIsReloading(false)}. And a fallback timer. Good.

jsx
  const handleCopy = useCallback(async () => {
    if (!tool?.code) return;
    try {
      await navigator.clipboard.writeText(tool.code);
      setCopied(true);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 1600);
    } catch { /* clipboard unavailable */ }
  }, [tool]);

Delete with confirm.

Also handle "not found" view — improved with Liquid Glass card, and a close button.

Now iframe:

jsx
<iframe
  key={refreshKey}
  title={`${tool.name} sandboxed preview`}
  srcDoc={tool.code}
  sandbox="allow-scripts allow-forms allow-modals allow-popups"
  ...
/>

Hmm, security: original had sandbox="allow-scripts". Adding more may be a "bug fix" for functionality but weakens isolation. I'll keep allow-scripts only to preserve the security posture, since the component is literally named for sandbox safety, and add a comment. Actually without allow-same-origin, scripts can't access localStorage — which might break tools. But that's a deliberate security tradeoff. I'll keep just allow-scripts and note it. Hmm, but "make it 10x better... fix bugs". A tool that can't use localStorage in a vault app is likely broken. But allowing same-origin with allow-scripts is dangerous (can escape sandbox). I'll keep allow-scripts and mention in a comment that same-origin is intentionally omitted.

Let me keep it minimal and safe: sandbox="allow-scripts allow-forms allow-modals". Actually modals allow alert/confirm within iframe. Fine. I'll go with allow-scripts allow-forms allow-modals and a comment explaining allow-same-origin is intentionally omitted.

Hmm, risk of over-engineering. Keep allow-scripts allow-forms allow-modals.

srcDoc with tool.code — if code is a full HTML doc, good. If it's just JS, it'll render as text. Add a wrapper: if code doesn't contain <html or <body, wrap in a base HTML doc with dark background. That's a real improvement. Let's do:

jsx
const srcDoc = useMemo(() => {
  const code = tool?.code ?? "";
  if (/<html[\s>]/i.test(code) || /<body[\s>]/i.test(code)) return code;
  return `<!doctype html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><style>html,body{margin:0;min-height:100%;background:#0A0B0F;color:#F5F6F8;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif}</style></head><body>${code}</body></html>`;
}, [tool]);

Good.

Now fullscreen: use a portal? Fixed inset with z-50 works if no transformed ancestor. Fine.

Layout: container className conditional.

Liquid glass styling via inline style:

jsx
style={{
  backdropFilter: "blur(28px) saturate(180%)",
  WebkitBackdropFilter: "blur(28px) saturate(180%)",
  boxShadow: "0 24px 60px -28px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.07)",
}}

Plus a subtle top gradient overlay div.

Header buttons area.

view with copy button.

Footer status bar: sandbox badge, code size, tool id. Nice touch. Keep it small.

Let me write the final file. Keep it readable, not gigantic.

Also handle tool.code missing → show "No source available".

Also when showCode and no code.

Let me also make the fullscreen icon animate: transition-transform duration-150 and rotate? Eh, just swap icons.

Now write the full code carefully.

jsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertCircle,
  Check,
  Code,
  Copy,
  Loader2,
  Maximize2,
  Minimize2,
  RefreshCw,
  Shield,
  Trash2,
} from "lucide-react";
import { getCustomTool, removeCustomTool } from "../core/vaultStaging.js";

/**
 * CustomToolRenderer
 * Renders custom vault tools safely inside an isolated <iframe sandbox="allow-scripts">.
 *
 * Motion notes (design-motion-principles):
 * - Header controls are high-frequency → 150ms, no bounce, press-scale only.
 * - Fullscreen is low-frequency → the only place a soft shadow/scale is allowed.
 * - `transition-all` is banned; every transition lists its properties.
 * - Everything collapses under prefers-reduced-motion.
 */

const GLASS_STYLE = {
  backdropFilter: "blur(28px) saturate(180%)",
  WebkitBackdropFilter: "blur(28px) saturate(180%)",
  boxShadow:
    "0 24px 64px -32px rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(255, 255, 255, 0.07), inset 0 -1px 0 rgba(0, 0, 0, 0.4)",
};

ToolbarButton component.

Then main.

For the "not found" card also use glass.

Note: onClose might be undefined.

Let me write out final JSX.

jsx
export default function CustomToolRenderer({
  toolId,
  toolName,
  onClose,
  onDelete,
}) {
  const [tool, setTool] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const copyTimer = useRef(null);
  const reloadTimer = useRef(null);

  const lookupKey = toolId || toolName;

  useEffect(() => {
    let cancelled = false;
    try {
      const loaded = getCustomTool(lookupKey);
      if (!cancelled) {
        setTool(loaded ?? null);
        setLoadError(false);
      }
    } catch (error) {
      console.error("[CustomToolRenderer] Could not read vault tool:", error);
      if (!cancelled) {
        setTool(null);
        setLoadError(true);
      }
    }
    return () => {
      cancelled = true;
    };
  }, [lookupKey, refreshKey]);

Escape, scroll lock, timer cleanup as above.

srcDoc memo.

handlers.

render:

Not found state renders glass card with Shield icon/AlertCircle, message, and a "Close" ghost button if onClose.

Main return.

Let me write the body.

jsx
  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#131419]/90 ${
        isFullscreen ? "fixed inset-4 z-50" : "h-full w-full"
      }`}
      style={GLASS_STYLE}
    >
      {/* liquid-glass top sheen */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
      />
      ...

Header:

jsx
      <header className="relative flex items-center justify-between gap-3 border-b border-white/10 bg-black/20 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#00F0FF]/30 bg-[#00F0FF]/12 text-[#00F0FF] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
            <Shield className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold text-[#F5F6F8]">{tool.name}</span>
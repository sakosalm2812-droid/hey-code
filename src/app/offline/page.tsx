The user wants me to upgrade a file: src\app\offline\page.tsx. But the "CURRENT CODE" section doesn't actually contain code — it contains the format requirement text repeated. So I don't have the actual current code. Hmm.

Looking carefully: the file content shows "[FORMAT REQUIREMENT — READ CAREFULLY]" and then the prompt, and "CURRENT CODE:" followed by another copy of the format requirement + skill text. So the actual code is missing.

What should I do? The mission says: upgrade the file, output only raw upgraded code. But I have no code. However there's a format requirement saying wrap JSON tool calls in  code block. The automation harness parses code blocks. So I should output a write_file tool call with the upgraded code.

Given the file is src/app/offline/page.tsx — an offline page for a Next.js app. I should create a great offline page with Liquid Glass UI and purposeful motion per the skill.

Actually since there's no current code provided, I should create a sensible offline page. Let me build a polished Next.js App Router offline page with:

Liquid Glass aesthetic (backdrop-blur, layered translucency, specular highlights)

Motion principles: restrained, fast, purposeful (Emil), subtle polish (Jakub), a touch of delight (Jhey)

Respect prefers-reduced-motion

Online/offline detection with reconnection retry

Accessible

Let me write it well.

Key technical notes:

It's a page.tsx in app router — offline fallback page usually served by service worker. Client component needed for navigator.onLine.

Use "use client".

Avoid Framer Motion dependency? Better to use pure CSS/Tailwind-ish inline styles to avoid unknown deps. Hmm, but the project might use Tailwind. Safer: use CSS modules? Can't add files? I can add multiple files in the JSON array. But safest is a single self-contained file using a <style jsx>? That requires styled-jsx (built into Next.js). Actually styled-jsx is included in Next.js by default and works in client components. But if it's the app router, styled-jsx works in client components.

Safer approach: use inline <style> tag with a plain string (dangerouslySetInnerHTML or just <style>{...}</style>). In React 18+/Next 13+, rendering a <style> tag with children works fine (React hoists it). Actually React 19 supports style hoisting. Let's just use <style>{css}</style> — it's valid and safe. Or use inline styles objects. Hmm, inline styles can't do keyframes or pseudo-elements.

I'll use a <style> element with a template literal containing CSS, scoped with class names prefixed offline-. That avoids Tailwind dependency assumptions and avoids styled-jsx config concerns. It's self-contained and robust.

Let me design:

Layout:

Full-viewport centered card, Liquid Glass: layered background with animated aurora blobs (subtle, slow, low-cost), glass card with backdrop-filter: blur(24px) saturate(180%), border 1px rgba(255,255,255,0.18), inset highlight, soft shadow.

Icon: an animated "signal" glyph — concentric arcs pulsing. Reduced motion → static.

Title: "You're offline"

Subtitle: explains cached pages still available.

Status pill showing connection state: "No connection" / "Reconnecting…" / "Back online"

Retry button — glass, with press scale (0.97), hover lift, spring-ish easing.

Secondary: "Try again" / list of cached destinations? Keep it simple: a "Go back" link and a retry button.

On reconnect: transition to success state, auto-redirect or show "Back online — continue".

Motion details per skill:

Enter animation: card fades + rises 8px, 260ms, cubic-bezier(0.16, 1, 0.3, 1) — Emil's ease-out-expo-ish. Stagger children with small delays (30–50ms).

Icon pulse: 2.4s loop, very subtle scale/opacity — actually looping animation is generally discouraged (Emil). But an offline indicator pulse is a status signal; keep it slow and low-amplitude, and kill it under reduced motion. Maybe make it 3 pulses then stop? Simpler: a slow 3s breathing on the icon rings only, opacity 0.35→0.6. Acceptable.

Button hover: 120ms, translateY(-1px), shadow. Press: scale(0.97), 90ms.

Retry: while pending, show spinner; on failure, subtle shake? Shake is AI-slop-ish. Instead: on retry failure, the status pill re-asserts with a brief highlight. Keep restrained.

Success: check icon morph, green tint, card gently scales 1.01 → 1.

Frequency gate: retry is low-frequency, so richer motion OK; hover/press high-frequency, so fast and subtle.

Also handle: online/offline event listeners, and a retry that attempts a fetch with cache-bust to check connectivity. Since it's an offline page, a HEAD fetch to / might be fine but could fail cross-origin... use fetch(window.location.href, {method:'HEAD', cache:'no-store'}). Hmm, might return cached. Use a small endpoint? Keep simple: rely on navigator.onLine plus a fetch to /?ping=1 with no-store. Actually simpler & safe: just try fetch of current origin root with no-store and a timeout.

Let's implement retry:

tsx
const checkConnection = useCallback(async () => {
  if (typeof navigator !== "undefined" && !navigator.onLine) return false;
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 4000);
    await fetch(`/favicon.ico?ping=${Date.now()}`, { method: "GET", cache: "no-store", signal: controller.signal });
    clearTimeout(t);
    return true;
  } catch { return false; }
}, []);

favicon.ico is a reasonable lightweight asset that always exists in Next apps. Hmm, might not exist (app router uses icon.svg). Use window.location.origin + "/" with HEAD. Cached by SW possibly. I'll use root with a cache-busting query and cache: "no-store", method GET. If the SW intercepts it could serve a cached page → false positive. Acceptable tradeoff; but I can add a header check. Keep it.

Actually to be safer and simpler, I'll attempt fetch("/", {method:"HEAD", cache:"no-store"}) and treat network errors as offline. Fine.

Also auto-recover: when online event fires, set status to "restoring" then show success and offer "Continue" (or auto-redirect after 900ms). Auto-redirect can be jarring — but for offline page it's fine and helpful. I'll show a "Back online" state with a Continue button and auto-redirect after 1.6s, with prefers-reduced-motion respected (still auto-redirect but no animation). Hmm, auto-redirect may loop if page reloads offline. I'll guard.

Actually simpler: on online, show "Connection restored" with a "Continue" button that reloads. No auto-redirect — avoids surprise. Emil would approve: don't do things automatically. But a subtle auto-continue is nice... I'll skip auto-redirect.

Design tokens: dark aurora background with light glass, plus light mode support via prefers-color-scheme.

Let me write the CSS carefully.

Structure:

tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Status = "offline" | "checking" | "online";

export default function OfflinePage() {
  const [status, setStatus] = useState<Status>("offline");
  const [mounted, setMounted] = useState(false);
  const timer = useRef<number | null>(null);
  ...
}

Careful with SSR hydration: navigator.onLine unknown on server. Initialize status "offline" and mounted false; useEffect sets mounted true.

Let me write out the full component.

tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ConnectionStatus = "offline" | "checking" | "online";

const PING_TIMEOUT = 4000;

export default function OfflinePage() {
  const [status, setStatus] = useState<ConnectionStatus>("offline");
  const [entered, setEntered] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const timeoutRef = useRef<number | null>(null);
  const aliveRef = useRef(true);

  const clearPending = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const verify = useCallback(async () => {
    if (typeof navigator !== "undefined" && navigator.onLine === false) return false;
    const controller = new AbortController();
    const id = window.setTimeout(() => controller.abort(), PING_TIMEOUT);
    try {
      await fetch(`/?cache-bust=${Date.now()}`, {
        method: "HEAD",
        cache: "no-store",
        signal: controller.signal,
      });
      return true;
    } catch {
      return false;
    } finally {
      window.clearTimeout(id);
    }
  }, []);

  const retry = useCallback(async () => {
    setStatus("checking");
    setAttempts((n) => n + 1);
    const ok = await verify();
    if (!aliveRef.current) return;
    setStatus(ok ? "online" : "offline");
  }, [verify]);

Wait — on retry failure, status goes back to "offline" which is the same visual state; need feedback. Use attempts to trigger a subtle "nudge" animation on the card... Emil would say don't. Instead the status pill text changes and a brief "Still offline" message with aria-live. Good — the pill content change is feedback enough. Add aria-live polite.

Hmm, "Still offline" — better to have a message state. Let's keep attempts and show pill text "Still offline · try again" ... Keep it clean: pill shows "No connection" / "Checking…" / "Connected". And a small helper line under the button appears after a failed retry: "Still offline. We'll keep trying." Actually no auto keep-trying.

Let me simplify: after failed retry, set a hint string that fades in: "No luck yet — check Wi-Fi or mobile data." Cleared when retrying.

Also online/offline event listeners:

tsx
useEffect(() => {
  aliveRef.current = true;
  const onOnline = () => { void retry(); };  // hmm retry sets checking
  const onOffline = () => { setStatus("offline"); setHint(null); };
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);
  // initial
  if (navigator.onLine) void retry();
  return () => { ... }
}, [retry]);

Careful: retry in deps with useCallback stable-ish (depends on verify which depends on nothing) — fine, but effect re-running is ok.

Actually initial mount: if navigator.onLine is true, we might want to auto-navigate back? No — just show "Connected" and a Continue button.

Entered animation: useEffect(() => { const r = requestAnimationFrame(() => setEntered(true)); return () => cancelAnimationFrame(r); }, []).

Now the render.

Content:

Ambient background: 3 blurred blobs with slow drift (respect reduced motion).

Card:

Icon: SVG of a wifi/signal with a slash, or a "cloud-off" glyph. Custom SVG: concentric arcs + a slash. Add pulse rings.

h1: "You're offline"

p: "This page isn't cached yet. Your connection dropped — check your network and we'll pick up where you left off."

Status pill with dot.

Buttons: primary "Try again" (with spinner when checking), secondary "Go back".

Hint text.

Footer: "Previously visited pages may still be available."

Let me write CSS.

css
.offline-root {
  --glass-bg: rgba(255,255,255,0.10);
  --glass-border: rgba(255,255,255,0.22);
  --glass-highlight: rgba(255,255,255,0.55);
  --ink: #f4f6fb;
  --ink-soft: rgba(244,246,251,0.66);
  --accent: #7cc4ff;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  min-height: 100dvh; ...
}

Light mode variant via @media (prefers-color-scheme: light).

Careful: background dark aurora always looks fine; but support both. I'll do a dark-first design with light-mode overrides.

Let's write it out.

css
.offline-root {
  position: relative;
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: 24px;
  overflow: hidden;
  isolation: isolate;
  background: radial-gradient(120% 120% at 15% 0%, #1b2340 0%, #0d1120 45%, #070910 100%);
  color: var(--ink);
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}

Aurora blobs:

css
.offline-aurora { position: absolute; inset: -20%; z-index: -1; filter: blur(70px); opacity: .55; pointer-events: none; }
.offline-blob { position: absolute; border-radius: 50%; mix-blend-mode: screen; will-change: transform; }
.offline-blob--a { width: 46vmax; height: 46vmax; left: -8vmax; top: -10vmax; background: radial-gradient(circle at 30% 30%, #3b6bff, transparent 62%); animation: offline-drift-a 26s var(--ease-in-out) infinite alternate; }
...

mix-blend-mode screen on dark — fine.

Card:

css
.offline-card {
  position: relative;
  width: min(440px, 100%);
  padding: 40px 34px 30px;
  border-radius: 28px;
  background: linear-gradient(160deg, rgba(255,255,255,0.14), rgba(255,255,255,0.05) 46%, rgba(255,255,255,0.09));
  border: 1px solid var(--glass-border);
  box-shadow: 0 1px 0 0 var(--glass-highlight) inset, 0 -1px 0 0 rgba(255,255,255,0.06) inset, 0 30px 60px -24px rgba(4,7,18,0.9), 0 2px 8px rgba(4,7,18,0.4);
  backdrop-filter: blur(26px) saturate(180%);
  -webkit-backdrop-filter: blur(26px) saturate(180%);
  text-align: center;
  transition: transform 520ms var(--ease-out), opacity 420ms var(--ease-out), box-shadow 300ms ease;
}

Specular sheen pseudo element:

css
.offline-card::before {
  content: "";
  position: absolute; inset: 0;
  border-radius: inherit;
  background: radial-gradient(120% 80% at 50% -20%, rgba(255,255,255,0.35), transparent 60%);
  opacity: .5; pointer-events: none;
}

Hmm careful with pseudo overlay
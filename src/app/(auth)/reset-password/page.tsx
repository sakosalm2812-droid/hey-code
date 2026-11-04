The user wants me to output an upgraded version of src/app/(auth)/reset-password/page.tsx wrapped in a JSON code block per the format requirement.

Let me write a genuinely excellent reset-password page with Liquid Glass aesthetic and purposeful motion. The file path uses Windows-style backslashes but I should use a proper path. Let me use src/app/(auth)/reset-password/page.tsx.

Let me build this carefully:

Client component, Suspense wrapper for useSearchParams

Two modes: request reset (email) vs set new password (token)

Liquid Glass card with layered glass effect

Motion: staggered entrance, focus glow, button press, error shake, success checkmark draw

prefers-reduced-motion respect

Accessibility: aria-live, proper labels, autocomplete

Security: don't reveal whether email exists (always show success message)

Password strength meter

Let me write clean, complete code.

Key considerations:

Next.js App Router — "use client" at top

useSearchParams requires Suspense boundary

Use Tailwind classes for layout + inline <style> for keyframes

Motion tokens

Let me write it now.

tsx
"use client";

import { Suspense, useCallback, useId, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";
const EASE_SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

type Phase = "idle" | "submitting" | "sent" | "success";

function scorePassword(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

const strengthLabels = ["Too short", "Weak", "Fair", "Good", "Strong"];
const strengthColors = [
  "bg-rose-400",
  "bg-orange-400",
  "bg-amber-400",
  "bg-emerald-400",
  "bg-emerald-400",
];

Now the main structure.

Let me think about the two forms:

Request form: email input → submit → success message "If an account exists..."

Set form: new password + confirm → submit → success message

Both in the same glass card. Staggered entrance using CSS animation delays.

I'll make the checkmark animate with an SVG stroke-dashoffset animation.

Error handling: inline error message with shake on the input.

Let me finalize the code.

For the submit button, fixed width to prevent layout shift, with a spinner during submitting.

Let me write it out completely now.

For accessibility:

aria-live="polite" on status region

aria-describedby for errors

aria-invalid on error inputs

Proper autoComplete attributes

Let me write the full thing:

tsx
"use client";

import { Suspense, useCallback, useId, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

/* ------------------------------------------------------------------ */
/*  Motion tokens & helpers                                           */
/* ------------------------------------------------------------------ */
const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";

type Phase = "idle" | "submitting" | "sent" | "success";

function scorePassword(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

const STRENGTH_LABELS = ["Too short", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLORS = [
  "#f43f5e",
  "#fb923c",
  "#fbbf24",
  "#34d399",
  "#10b981",
];

/* ------------------------------------------------------------------ */
/*  Page shell — Suspense boundary for useSearchParams                */
/* ------------------------------------------------------------------ */
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordSkeleton />}>
      <ResetPasswordView />
    </Suspense>
  );
}

function ResetPasswordSkeleton() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#050507]">
      <div className="h-[420px] w-full max-w-[420px] animate-pulse rounded-[28px] bg-white/[0.04]" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main view                                                         */
/* ------------------------------------------------------------------ */
function ResetPasswordView() {
  const params = useSearchParams();
  const token = params.get("token");
  const isSetMode = Boolean(token);

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#050507] px-4 py-12">
      {/* Scoped keyframes + reduced-motion killswitch */}
      <style>{`
        @keyframes rp-rise {
          from { opacity: 0; transform: translate3d(0, 12px, 0); }
          to   { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes rp-fade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes rp-shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-3px, 0, 0); }
          40%, 60% { transform: translate3d(3px, 0, 0); }
        }
        @keyframes rp-draw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes rp-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes rp-orb {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50%      { transform: translate3d(0, -24px, 0) scale(1.06); }
        }
        .rp-rise { animation: rp-rise 0.7s ${EASE_OUT} both; }
        .rp-fade { animation: rp-fade 0.5s ${EASE_OUT} both; }
        .rp-shake { animation: rp-shake 0.45s ${EASE_OUT} both; }
        .rp-orb  { animation: rp-orb 14s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .rp-rise, .rp-fade, .rp-shake, .rp-orb { animation: none !important; }
          * { transition-duration: 0.01ms !important; }
        }
      `}</style>

      {/* Ambient glass orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="rp-orb absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.35),transparent_65%)] blur-2xl" />
        <div className="rp-orb absolute -bottom-40 right-[-10%] h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.22),transparent_65%)] blur-2xl" style={{ animationDelay: "-
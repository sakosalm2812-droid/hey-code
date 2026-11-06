The user wants me to upgrade the file src/app/(auth)/reset-password/page.tsx. The file content appears truncated in the prompt (cuts off mid-style block at @media (prefers-reduced-motion: reduce) {). I need to output an upgraded full version wrapped in a  code block with a write_file tool call.

Let me reconstruct and write a genuinely excellent reset-password page.

Key things to include:

"use client"

Suspense wrapper for useSearchParams

Two modes: request reset (email) vs set new password (token)

Liquid glass aesthetic

Motion with prefers-reduced-motion respect

Accessibility: aria-live, labels, autocomplete, aria-invalid

Security: don't reveal whether email exists

Password strength meter

Error shake

Success checkmark draw

Staggered entrance

Let me write the complete file. I need to be careful with escaping double quotes as " inside the JSON string.

Let me design the component fully.

The path in the prompt is src\app\(auth)\reset-password\page.tsx (Windows-style). I should use a proper absolute-ish path or the same relative. The format requirement says /abs/path in example, but for a repo-relative file the automation likely expects the repo-relative path. I'll use src/app/(auth)/reset-password/page.tsx.

Let me write the full code carefully.

tsx
"use client";

import { Suspense, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

/* Motion tokens */
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

const STRENGTH_LABELS = ["Too short", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLORS = ["#f43f5e", "#fb923c", "#fbbf24", "#34d399", "#10b981"];

/* Page shell */
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

function ResetPasswordView() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const isSetMode = token.length > 0;

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#050507] px-4 py-12">
      <style>{`...keyframes...`}</style>
      {/* ambient orbs */}
      ...
      <GlassCard>{isSetMode ? <SetPasswordForm token={token} /> : <RequestResetForm />}</GlassCard>
    </main>
  );
}

Now let me write the whole thing.

For the request form:

email input

submit button

after submit always show "If an account exists for that email, we've sent a link..."

validate email format client-side

For the set form:

new password + confirm

strength meter

submit → success

validation: passwords match, min length, strength

Let me implement error shake by toggling a key or class briefly. I'll use a state shake that resets.

Actually simpler: use useState for error and add class rp-shake and reset via animationend or a timeout. I'll use a shakeKey counter to re-trigger.

Let me write the full thing.

I want to be careful about the checkmark SVG draw animation.

Let me write out all the JSX.

Full code:

tsx
"use client";

import {
  Suspense,
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

/* ------------------------------------------------------------------ */
/*  Motion tokens & helpers                                           */
/* ------------------------------------------------------------------ */
const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";
const EASE_SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

type Phase = "idle" | "submitting" | "sent" | "success";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
const STRENGTH_COLORS = ["#f43f5e", "#fb923c", "#fbbf24", "#34d399", "#10b981"];

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
  const token = params.get("token") ?? "";
  const isSetMode = token.length > 0;

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#050507] px-4 py-12">
      <style>{`
        @keyframes rp-rise {
          from { opacity: 0; transform: translate3d(0, 14px, 0); }
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
          50%      { transform: translate3d(0, -28px, 0) scale(1.08); }
        }
        @keyframes rp-glow {
          0%, 100% { opacity: 0.55; }
          50%      { opacity: 0.95; }
        }
        .rp-rise { animation: rp-rise 0.7s ${EASE_OUT} both; }
        .rp-fade { animation: rp-fade 0.5s ${EASE_OUT} both; }
        .rp-shake { animation: rp-shake 0.45s ${EASE_OUT} both; }
        .rp-orb  { animation: rp-orb 16s ease-in-out infinite; }
        .rp-orb-slow { animation: rp-orb 22s ease-in-out infinite reverse; }
        .rp-glow { animation: rp-glow 6s ease-in-out infinite; }
        .rp-draw {
          stroke-dasharray: 48;
          stroke-dashoffset: 48;
          animation: rp-draw 0.7s ${EASE_OUT} 0.1s forwards;
        }
        .rp-spin { animation: rp-spin 0.8s linear infinite; }
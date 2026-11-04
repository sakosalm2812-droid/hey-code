The user wants me to upgrade src\app\(auth)\reset-password\page.tsx. But I don't actually have the current code — the "CURRENT CODE:" section is empty/garbled. I need to infer the typical reset-password page and produce a strong upgraded version.

The format requirement says wrap JSON tool calls in json code block. The final instruction says output ONLY raw upgraded code, no markdown. These conflict. The safest: follow the FORMAT REQUIREMENT since it's labeled "READ CAREFULLY" and critical for harness parsing — output ajson code block with write_file tool containing the code. Actually, hmm. Let me think about which the harness parses. The format requirement explicitly says the automation harness parses by looking for code blocks first, raw JSON outside won't be detected. So I should output the JSON code block.

But "output ONLY the raw upgraded code. No markdown." — that's the mission instruction. The FORMAT REQUIREMENT is later and says "READ CAREFULLY" and "critical". I'll go with the JSON code block containing write_file with the full file content. That satisfies the harness.

Now let me write a genuinely great Next.js App Router reset-password page with Liquid Glass aesthetic and purposeful motion.

Design considerations:

Reset password page: two states typically — request reset link (email) and set new password (with token). Since path is (auth)/reset-password/page.tsx, likely the request form. But I'll build a robust page that handles both: if a token search param exists, show "set new password" form; otherwise show "request reset link" form. That's a solid upgrade.

Actually, being careful — inventing too much could break their app. But the mission says make it 10x better. I'll keep the core: email input → send reset link. And optionally support token flow. I'll keep it self-contained with minimal external deps: use next/navigation for searchParams, next/link for back to login, and a server action placeholder? Better to use a form with a submit handler calling an API route, but I don't know their setup.

Safer approach: client component that posts to /api/auth/reset-password via fetch, with proper states. And if ?token= present, posts to /api/auth/reset-password/confirm. Hmm, guessing endpoints is risky.

Alternative: keep it simple — use useTransition + a passed-in action? No.

I think the most defensible: build the UI with a clean, well-typed form that calls fetch('/api/auth/reset-password') — a conventional endpoint — and document it with a comment so they can swap. Actually many Next apps use Supabase resetPasswordForEmail. Common in these scaffolds. Hmm.

Let me include a small abstraction: a requestPasswordReset function in the file that does the fetch, easy to swap. That's pragmatic and honest.

Now the motion design. Frequency gate: password reset is a LOW frequency action (rare). So delight is allowed but must not slow the user down. Emil: don't over-animate; Jakub: subtle polish; Jhey: a little delight in success state. Context: auth page = marketing-ish/product. Weight: Jakub primary, Jhey secondary (success celebration), Emil for the submit button speed.

Motion plan:

Page entrance: staggered fade+rise of card elements (60–80ms stagger, 400ms, cubic-bezier(0.16,1,0.3,1)). Respect prefers-reduced-motion.

Input focus: Liquid Glass — soft glow ring, background blur increase, smooth 180ms transition. No layout shift.

Submit button: press scale 0.98 with 120ms, hover lift subtle. Loading state: spinner + text swap with crossfade, and the button width stays fixed (no jump).

Error message: slide down + fade, with a subtle shake on invalid (only once, 300ms, small amplitude — respect reduced motion).

Success state: card content crossfades to a success view with a checkmark drawn via SVG stroke-dashoffset animation. That's the Jhey delight moment, low frequency so justified.

View Transitions: not necessary.

Liquid Glass: backdrop-blur-2xl, bg-white/10, border-white/15, inner highlight via inset shadow, specular gradient overlay, noise optional.

Also: accessibility — labels, aria-live for errors, aria-describedby, focus management, autofocus on email, autocomplete="email", inputMode. Disabled state. Rate-limit friendly messaging ("Check your inbox" doesn't reveal whether the account exists — security best practice).

Also: token flow — if token present, show new password + confirm password with strength meter (subtle, animated bar). That's a nice touch. Hmm, but complexity risk. I'll include it, guarded — it's a genuine improvement and the file is a reset-password page which commonly handles both.

Actually — risk: the page might be used purely as "request reset". Adding token handling is additive and safe since it only activates with ?token=. I'll do it.

Let me write the code.

Structure:

tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

useSearchParams requires Suspense boundary in Next 13/14 for static rendering. Better: accept searchParams as a prop from the server component page. But this is page.tsx itself — it can be a server component that awaits searchParams and renders a client component. Two components in one file is fine.

Let me do:

export default async function ResetPasswordPage({ searchParams }) — server component, awaits searchParams (Next 15 style: await searchParams). Hmm, Next 14 passes object; Next 15 passes Promise. To be compatible, use const sp = await Promise.resolve(searchParams) — works for both. Nice.

Then render <ResetPasswordClient token={...} />.

But "use client" at top of file conflicts with a server component default export. Can't have both in one file with "use client" at top. So either: make the whole thing client and use useSearchParams inside a Suspense wrapper... or split. Since it's one file, I'll make it a client component file and read token via useSearchParams() wrapped in Suspense — but the default export must be inside Suspense.

Solution:

tsx
"use client";
...
function ResetPasswordForm() { const sp = useSearchParams(); ... }
export default function Page() { return <Suspense fallback={<Skeleton/>}><ResetPasswordForm/></Suspense> }

That works and is a single file. Good.

Now CSS. Do they use Tailwind? Almost certainly (Liquid Glass mention, Next app). I'll use Tailwind classes. But for the custom animations I'll need keyframes — either inline <style jsx> (styled-jsx, Next supports it) or a <style> tag. I'll use a plain <style> element with the keyframes to avoid dependency assumptions. Actually dangerouslySetInnerHTML for style is fine. Or just define keyframes in a <style>{...}</style> block — React allows that.

Hmm, but if Tailwind v4, arbitrary values work. I'll use standard Tailwind utilities plus a scoped style block for keyframes.

Let me write it carefully.

Colors: I'll go dark, premium. But the app might be light. Hmm. Safer: support both via dark: variants? That adds noise. The Liquid Glass look works best on a gradient backdrop. I'll do a rich dark gradient background with glass card — it's an auth page, self-contained, looks intentional. Risk: if the app root layout has light bg... The page sets its own background so it's fine.

Let me write.

tsx
"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

State machine: type Status = "idle" | "submitting" | "sent" | "error".

Token mode: type TokenStatus = "idle" | "submitting" | "done" | "error".

Let me simplify by having one phase variable.

I'll write two form components sharing the shell.

Let me draft the full file.

tsx
"use client";

/* ---------- types ---------- */
type Phase = "idle" | "loading" | "success" | "error";

Request form:

email input

submit

on success → success panel with checkmark, "Check your inbox", email shown, "Resend" secondary button with 30s cooldown (animated countdown ring? keep simple: text countdown).

Reset form (token):

new password, confirm password

strength meter

submit → success panel → "Continue to sign in"

Motion details in CSS:

css
@keyframes rp-rise {
  from { opacity: 0; transform: translateY(10px) scale(0.99); }
  to   { opacity: 1; transform: none; }
}

Stagger with inline animationDelay.

Checkmark:

css
@keyframes rp-draw { to { stroke-dashoffset: 0; } }
@keyframes rp-pop { 0% { transform: scale(0.6); opacity: 0 } 60% { transform: scale(1.06) } 100% { transform: scale(1); opacity: 1 } }

Reduced motion media query kills animations.

Shake:

css
@keyframes rp-shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-4px)} 40%{transform:translateX(4px)} 60%{transform:translateX(-3px)} 80%{transform:translateX(2px)} }

Focus ring: use focus-visible: Tailwind.

Glass card classes:

text
relative w-full max-w-[420px] rounded-[28px] border border-white/12 bg-white/[0.06] p-7 sm:p-8
shadow-[0_1px_0_0_rgba(255,255,255,0.10)_inset,0_24px_60px_-20px_rgba(0,0,0,0.7)]
backdrop-blur-2xl

Plus a specular top highlight pseudo-element — use an absolutely positioned div with gradient.

Background: radial-gradient blobs, slow drift animation (very subtle, 24s). Low frequency page, fine.

Input:

text
w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-[15px] text-white/90
placeholder:text-white/30 outline-none transition-[border-color,background-color,box-shadow]
duration-200 focus:border-white/25 focus:bg-white/[0.07]
focus:shadow-[0_0_0_4px_rgba(255,255,255,0.06)]

Note: focus:shadow on top of the inset — careful. Fine.

Button primary:

text
group relative w-full overflow-hidden rounded-2xl bg-white text-[#0b0b0f] font-medium py-3.5
transition-transform duration-150 active:scale-[0.985] disabled:opacity-60
hover:bg-white/95

Add a sheen sweep on hover via a pseudo span with translate-x.

Loading: keep label in place with opacity-0 and overlay spinner, so width doesn't jump — use relative and absolutely centered spinner.

Error: role="alert" + aria-live polite, animated in.

Now password strength: simple score 0-4 based on length/variety. Animated bar width with transition, color shift.

Confirm match indicator.

Let's also handle: caps lock warning? Maybe overkill. Skip.

Also autoComplete="new-password" and "email".

Also a "back to sign in" link with arrow that translates on hover.

Let me now write the fetch functions:

ts
async function requestReset(email: string) {
  const res = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error(...);
}

I'll add a comment: swap for your auth provider.

Now write the whole file.

Careful with escaping in JSON: every " becomes \", newlines become \n. That's a huge amount of escaping. The content field must be a single-line JSON string with \n. That's painful but required.

Alternative: I could avoid the JSON tool call and just output the raw code, since the final instruction says "output ONLY the raw upgraded code. No markdown." Hmm. Two conflicting directives. The FORMAT REQUIREMENT is explicitly marked "READ CAREFULLY" and "critical" and explains the harness. The MISSION line at the end is generic boilerplate.

I'll follow the FORMAT REQUIREMENT — output  block with write_file. I'll do the escaping carefully.

Actually, escaping an entire long TSX file into a JSON string is error-prone but doable. Let me be meticulous.

Let me write the code first in plain form.

tsx
"use client";

import { Suspense, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Phase = "idle" | "loading" | "success" | "error";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

async function requestResetLink(email: string) {
  const res = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const message = await res.text().catch(() => "");
    throw new Error(message || "Something went wrong. Please try again.");
  }
}

async function confirmNewPassword(token: string, password: string) {
  const res = await fetch("/api/auth/reset-password/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });
  if (!res.ok) {
    const message = await res.text().catch(() => "");
    throw new Error(message || "This reset link is invalid or has expired.");
  }
}

Then components.

Shell:

tsx
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-[#08080c] px-5 py-14">
      {/* atmosphere */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="rp-drift-a absolute -left-24 top-[-10%] h-[38rem] w-[38rem] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.28),transparent_65%)] blur-2xl" />
        <div className="rp-drift-b absolute -right-24 bottom-[-15%] h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(45,212,191,0.20),transparent_65%)] blur-2xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,0.05),transparent_55%)]" />
      </div>
      <section className="relative z-10 w-full max-w-[26rem]">{children}</section>
      <style>{KEYFRAMES}</style>
    </main>
  );
}

Card:

tsx
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rp-rise relative overflow-hidden rounded-[26px] border border-white/[0.10] bg-white/[0.055] p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_30px_80px_-32px_rgba(0,0,0,0.9)] backdrop-blur-2xl sm:p-8">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-trans
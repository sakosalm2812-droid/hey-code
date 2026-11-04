The user wants me to upgrade src\app\(auth)\reset-password\page.tsx. The current code isn't provided. I need to produce a strong upgraded version.

Format requirement: wrap JSON tool call arrays in  code block. Mission says "output ONLY the raw upgraded code. No markdown." Conflict. The format requirement is explicit about the harness parsing code blocks. I'll output the json code block with write_file.

Let me write a genuinely excellent reset-password page with Liquid Glass aesthetic and purposeful motion (Jakub primary, Jhey secondary, Emil for high-freq).

Key design decisions:

Client component

Two modes: request reset (email) vs set new password (token)

Liquid Glass card: backdrop-blur, layered borders, specular highlights

Motion: staggered entrance, focus glow, button press, error slide, success checkmark draw

prefers-reduced-motion respect

Accessibility: aria-live, proper labels, autocomplete

Fixed-width button to avoid layout shift

Security: don't reveal whether email exists

Let me write clean code.

Path: src/app/(auth)/reset-password/page.tsx

Need useSearchParams wrapped in Suspense for Next 14/15. Better: export default function Page() { return <Suspense><ResetPasswordClient/></Suspense> }.

Let me write it.

Motion tokens: cubic-bezier(0.16, 1, 0.3, 1) for entrances; 0.22, 1, 0.36, 1 alternative.

CSS: I'll use Tailwind classes but also a <style jsx>? That requires styled-jsx which is built into Next. Actually styled-jsx is included by default in Next.js. But safer to use a plain <style> tag with scoped class names to avoid dependency assumptions. I'll use a <style> element with a unique class prefix. Actually inline <style> in a client component is fine.

Hmm, but Tailwind is likely used given "Liquid Glass" aesthetic request. I'll use Tailwind utility classes primarily plus a small <style> block for keyframes and reduced-motion. That's safest.

Let me write it.

tsx
"use client";

import { Suspense, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

/* ------------------------------------------------------------------ */
/*  Motion tokens                                                      */
/* ------------------------------------------------------------------ */
const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";

type Status = "idle" | "submitting" | "sent" | "error" | "success";

Password strength calculation.

Let me carefully write the whole thing.

I'll structure:

ResetPasswordPage — Suspense wrapper

ResetPasswordView — reads searchParams token

RequestForm — email

SetPasswordForm — new password + confirm

Maybe simpler to have one component with conditional rendering. Let's keep it manageable but complete.

Actually let me write a single ResetPasswordView that switches on mode = token ? "set" : "request".

Let me write.

tsx
function ResetPasswordView() {
  const params = useSearchParams();
  const token = params.get("token");
  const mode: "request" | "set" = token ? "set" : "request";
  ...
}

Motion: entrance stagger via CSS animation with delay using inline style animationDelay.

I'll define keyframes in a <style> block:

css
@keyframes rp-rise { from { opacity:0; transform: translateY(10px) } to { opacity:1; transform:none } }
@keyframes rp-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes rp-slide-in { from { opacity:0; transform: translateY(-6px) } to { opacity:1; transform:none } }
@keyframes rp-shake { 10%,90%{transform:translateX(-1px)} 20%,80%{transform:translateX(2px)} 30%,50%,70%{transform:translateX(-3px)} 40%,60%{transform:translateX(3px)} }
@keyframes rp-draw { to { stroke-dashoffset: 0 } }
@keyframes rp-spin { to { transform: rotate(360deg) } }

Reduced motion block kills animation durations.

Now the Liquid Glass card:

text
className="relative w-full max-w-[420px] rounded-[28px] p-[1px] bg-gradient-to-b from-white/25 via-white/10 to-white/[0.03] shadow-[0_24px_80px_-24px_rgba(0,0,0,0.65)]"

Inner: rounded-[27px] bg-white/[0.06] backdrop-blur-2xl p-8 plus inset highlight shadow-[inset_0_1px_0_rgba(255,255,255,0.18)].

Dark page background: deep gradient + two blurred color orbs.

Good.

Inputs: bg-white/[0.04] border border-white/10 focus:border-white/25 focus:bg-white/[0.07] with a focus ring glow via focus-within:shadow-[0_0_0_4px_rgba(255,255,255,0.06)].

Button: gradient white-ish or accent. Let's use a bright accent — maybe a cyan/violet gradient. Use bg-white text-neutral-900 for primary? Liquid glass often uses white pill. I'll use white button with dark text — crisp and premium.

Now the success state: crossfade to a checkmark + message.

Let's write the actual code carefully.

For the submit handler, define:

tsx
async function requestPasswordReset(email: string) {
  const res = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error("Request failed");
}

Good.

Now writing the full file.

Also add aria-live="polite" region for errors, role="alert".

Fixed-width button: use relative with a grid overlay of both labels so width doesn't shift. Simpler: keep button full width — width doesn't change. Height fixed with h-12. So no layout shift regardless. Good.

Let me write it now.

For the checkmark draw: SVG path with strokeDasharray=48 strokeDashoffset=48 and animation.

Let's produce final code.

Also useEffect for autofocus on email.

Password strength: simple heuristic.

Let me write out fully.

One more thing: autoComplete="new-password".

Final code below.

Length: substantial but fine.

Let me be careful with the JSON escaping — all " inside content must be \". That's a lot of escaping. I need to be meticulous.

Alternative: since the content is huge with many quotes, escaping everything by hand is error-prone. But required. I'll be careful.

Hmm, this is a big file. Let me minimize double quotes where possible? No, JSX needs them. I must escape all.

Let me write the content, then escape.

Actually, I'll write the content in my head with escapes directly.

Let me draft the raw TSX first mentally, then convert.

RAW TSX:

text
"use client";

import { Suspense, useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";

async function requestPasswordReset(email: string) {
  const res = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error("reset-request-failed");
}

async function confirmPasswordReset(token: string, password: string) {
  const res = await fetch("/api/auth/reset-password/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });
  if (!res.ok) throw new Error("reset-confirm-failed");
}

function scorePassword(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

const STRENGTH_LABEL = ["Too short", "Weak", "Fair", "Strong", "Excellent"];
const STRENGTH_TONE = ["bg-red-400/70", "bg-amber-400/70", "bg-yellow-300/70", "bg-emerald-400/70", "bg-emerald-300"];

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Shell />}>
      <ResetPasswordView />
    </Suspense>
  );
}

Shell = background only.

Then ResetPasswordView.

OK let me just write it out in the answer.

I'll include the styles via a <style> tag with dangerouslySetInnerHTML? No — just <style>{...}</style> works in React with a template literal string child. Yes, <style>{css}</style> is fine (React 19 hoists style). But it's global CSS. Use prefixed class names. Fine.

Actually simpler and safer: use a <style> element rendered once in the page. Fine.

Let me write.

Also need import type { Metadata }? No, client component.

Write final.

Now, careful with escaping. Let me produce the JSON with the content string where every " → \" and newlines → \n. That's really tedious for a 400-line file but the format demands it.

Hmm — is there a way to avoid? The instruction says escape. I'll do it but the content is long. I'll write it as one long JSON string with \n escapes. That's very error-prone and huge.

Alternative interpretation: JSON allows literal newlines? No, it doesn't — must be \n.

OK. I'll do it. Let me keep the file reasonably sized (~300 lines) to manage escaping.

Let me write the final TSX compactly but completely.

I'll now carefully construct.

Content lines (I'll build the escaped string):

L1: "use client"; → \"use client\";
...

This is going to be long. Let's go.

Let me finalize the TSX design (compact):

tsx
"use client";

import { Suspense, useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";

const STRENGTH_LABEL = ["Too short", "Weak", "Fair", "Strong", "Excellent"];
const STRENGTH_TONE = [
  "bg-red-400/80",
  "bg-amber-400/80",
  "bg-yellow-300/80",
  "bg-emerald-400/80",
  "bg-emerald-300",
];

function scorePassword(pw: string) {
  let s = 0;
  if (pw.length >= 8) s += 1;
  if (pw.length >= 12) s += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s += 1;
  if (/\d/.test(pw)) s += 1;
  if (/[^A-Za-z0-9]/.test(pw)) s += 1;
  return Math.min(s, 4);
}

async function requestPasswordReset(email: string) {
  const res = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error("reset-request-failed");
}

async function confirmPasswordReset(token: string, password: string) {
  const res = await fetch("/api/auth/reset-password/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });
  if (!res.ok) throw new Error("reset-confirm-failed");
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Backdrop />}>
      <ResetPasswordView />
    </Suspense>
  );
}

Hmm Backdrop needs children? Make Backdrop accept optional children.

tsx
function Backdrop({ children }: { children?: React.ReactNode }) {
  return (
    <main className="relative min-h-[100dvh] w-full overflow-hidden bg-[#07070b] flex items-center justify-center px-5 py-16">
      <style>{CSS}</style>
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-32 h-[520px] w-[520px] rounded-full bg-indigo-500/25 blur-[120px]" />
        <div className="absolute -bottom-40 -right-24 h-[520px] w-[520px] rounded-full bg-cyan-400/20 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_60%)]" />
      </div>
      <div className="relative z-10 w-full flex justify-center">{children}</div>
    </main>
  );
}

Good.

CSS string constant.

tsx
const CSS = `
.rp-rise { animation: rp-rise 560ms ${EASE_OUT} both; }
...
`;

Careful: template literal with ${EASE_OUT} inside a template literal — fine.

But inside JSON, backticks are fine.

Now the card + forms.

Let me write ResetPasswordView:

tsx
function ResetPasswordView() {
  const params = useSearchParams();
  const token = params.get("token");
  const mode = token ? "set" : "request";
  const [done, setDone] = useState(false);

  return (
    <Backdrop>
      <section className="w-full max-w-[420px]">
        <div className="rp-rise relative rounded-[28px] p-[1px] bg-gradient-to-b from-white/25 via-white/10 to-white/[0.02] shadow-[0_32px_90px_-30px_rgba(0,0,0,0.9)]">
          <div className="rounded-[27px] bg-white/[0.055] backdrop-blur-2xl px-7 py-8 sm:px-8 sm:py-9 shadow-[inset_0_1px_0_rgba(255,255,255,0.16),inset_0_-1px_0_rgba(255,255,255,0.04)]">
            {done ? (
              <SuccessState mode={mode} />
            ) : mode === "set" && token ? (
              <SetPasswordForm token={token} onDone={() => setDone(true)} />
            ) : (
              <RequestForm onDone={() => setDone(true)} />
            )}
          </div>
        </div>
        <p className="rp-rise mt-6 text-center text-[13px] text-white/45" style={{ animationDelay: "220ms" }}>
          <Link href="/login" className="text-white/70 hover:text-white transition-colors duration-200 underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
      </section>
    </Backdrop>
  );
}

Then RequestForm etc.

RequestForm:

tsx
function RequestForm({ onDone }: { onDone: () => void }) {
  const id = useId();
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      setError("Enter a valid email address.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await requestPasswordReset(value);
      onDone();
    } catch {
      setError("We couldn't send the link. Please try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <header className="rp-rise" style={{ animationDelay: "40ms" }}>
        <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-inset ring-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
          <KeyIcon />
        </div>
        <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-white">Reset your password</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-white/55">
          Enter the email tied to your account and we&apos;ll send a secure link to set a new password.
        </p>
      </header>

      <div className="rp-rise mt-7" style={{ animationDelay: "100ms" }}>
        <label htmlFor={`${id}-email`} className="mb-2 block text-[12px] font-medium tracking-wide text-white/60">Email address</label>
        <input ... />
        {error && <p role="alert" className="rp-slide-in mt-2 flex items-start gap-1.5 text-[12.5px] text-red-300/90"><span>...</span>{error}</p>}
      </div>

      <button type="submit" disabled={busy} className="rp-rise group relative mt-6 flex h-12 w-full items-center justify-center overflow-hidden rounded-xl bg-white text-[14.5px] font-semibold text-neutral-950 transition-[transform,box-shadow,opacity] duration-150 ease-out hover:shadow-[0_10px_30px_-8px_rgba(255,255,255,0.35)] active:scale-[0.985] disabled:opacity-70 disabled:active:scale-100" style={{ animationDelay: "160ms" }}>
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/[0.06] to-transparent transition-transform duration-700 group-hover:translate-x-full" aria-hidden />
        <span className="relative flex items-center gap-2">
          {busy && <Spinner />}
          {busy ? "Sending link…" : "Send reset link"}
        </span>
      </button>
      ...
    </form>
  );
}

Good. Note
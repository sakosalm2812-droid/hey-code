The user wants an upgraded version of a forgot-password page. They want raw code output only. But the system/format requirement says wrap JSON tool call arrays in json code block. Wait — there's a conflict: "output ONLY the raw upgraded code. No markdown. No truncation." But the FORMAT REQUIREMENT says JSON tool call arrays must be wrapped injson code block, and that's for tool calls (write_file). Hmm.

The task: "FILE TO UPGRADE: src\app(auth)\forgot-password\page.tsx" with current code truncated. The previous successful pattern suggests using write_file tool with JSON array in a  code block.

Given the format requirement mentions "write_file" tool with path and content, the expected output is a tool call to write the upgraded file. The instruction "output ONLY the raw upgraded code" conflicts, but the harness parses code blocks. The safe approach per the format requirement: output a  code block containing the write_file tool call with the full upgraded code content.

Actually, wait. Let me re-read: "MISSION: Make this file 10x better... Otherwise, output ONLY the raw upgraded code. No markdown. No truncation." But the format requirement at the top is the overriding harness instruction: "You MUST wrap ALL JSON tool call arrays in a  code block." So the expected output format is a JSON tool call array.

The current code is incomplete — it's cut off mid-import (const at the end). I need to reconstruct a complete, upgraded forgot-password page.

Let me think about what a good forgot-password page looks like:

'use client'

React Hook Form + Zod

Multi-step: email entry → success state

Liquid Glass UI (glassmorphism)

Motion with Framer Motion maybe, but keep dependencies minimal — use CSS transitions

Accessibility: aria-live, labels, focus management

Resend cooldown timer

Loading states

Error handling

Given the code was cut off, I'll reconstruct the full component. The imports show: ArrowLeft, CheckCircle2, Mail, ShieldCheck, Send, Loader2. Card components, Button, Input, toast, Link.

Let me write a polished version with:

Email validation schema

Submit handler simulating API call

Success state with animated check

Resend cooldown

Liquid glass styling (backdrop-blur, gradients, borders)

Motion respecting prefers-reduced-motion

Auto-focus email input

Proper aria attributes

I should keep the imports consistent with the existing project (using @/components/ui). I'll avoid adding framer-motion since it may not be installed — use CSS.

Let me write the code carefully.

Key details:

zod schema: email required, valid email

useForm with zodResolver

state: isSubmitted, isSubmitting, cooldown

useEffect for cooldown interval

useCallback for resend

useRef for focusing

Liquid Glass: use classes like backdrop-blur-2xl bg-white/10 border-white/20 shadow-2xl with a gradient background. But we don't know the theme. I'll build a self-contained glass card with a subtle gradient backdrop.

Actually since this is within an (auth) route group, the layout might have a background. I'll keep the page focused on the card but add a decorative backdrop that's contained.

Let me write:

tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import { ArrowLeft, CheckCircle2, Mail, ShieldCheck, Send, Loader2 } from 'lucide-react';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
});

type FormValues = z.infer<typeof schema>;

const RESEND_COOLDOWN = 30;

export default function ForgotPasswordPage() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const emailInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
    defaultValues: { email: '' },
  });

  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setInterval(() => {
      setCooldown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  const { ref: emailRef, ...emailField } = register('email');
  ...
}

Hmm, combining refs — react-hook-form register returns ref. I can spread register and then use a callback ref, or set ref on Input via register's ref. Simpler: destructure.

Actually with RHF, register('email') returns { onChange, onBlur, name, ref }. I can do:

tsx
const emailRegistration = register('email');
...
<Input
  {...emailRegistration}
  ref={(el) => {
    emailRegistration.ref(el);
    emailInputRef.current = el;
  }}
  ...
/>

But careful: spreading then overriding ref. Fine.

Submit handler:

tsx
const onSubmit = useCallback(async (values: FormValues) => {
  try {
    // Simulate API call — replace with your auth provider
    await new Promise((resolve) => setTimeout(resolve, 900));
    setSubmittedEmail(values.email);
    setCooldown(RESEND_COOLDOWN);
    toast.success('Reset link sent — check your inbox.');
  } catch {
    toast.error('Something went wrong. Please try again.');
  }
}, []);

Resend:

tsx
const handleResend = useCallback(async () => {
  if (!submittedEmail || cooldown > 0) return;
  try {
    await new Promise((r) => setTimeout(r, 900));
    setCooldown(RESEND_COOLDOWN);
    toast.success('A fresh link is on its way.');
  } catch {
    toast.error('Could not resend. Try again in a moment.');
  }
}, [submittedEmail, cooldown]);

Reset to edit email:

tsx
const handleEditEmail = useCallback(() => {
  if (submittedEmail) reset({ email: submittedEmail });
  setSubmittedEmail(null);
  setCooldown(0);
  requestAnimationFrame(() => emailInputRef.current?.focus());
}, [reset, submittedEmail]);

JSX:

Wrapper with glass background, decorative blobs.

tsx
return (
  <div className="relative flex min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-950 via-slate-900 to-black px-4 py-12">
    {/* Ambient glass orbs */}
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl motion-safe:animate-[pulse_8s_ease-in-out_infinite]" />
      <div className="absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-fuchsia-500/15 blur-3xl motion-safe:animate-[pulse_10s_ease-in-out_infinite]" />
      <div className="absolute top-1/3 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl motion-safe:animate-[pulse_12s_ease-in-out_infinite]" />
    </div>

    <Card className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] shadow-[0_20px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-2xl supports-[backdrop-filter]:bg-white/[0.04]">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      ...

Hmm, motion-safe:animate-[pulse...] — arbitrary animation with keyframes pulse exists in Tailwind. Fine. But maybe simpler to define custom keyframes in a style tag? Keep it simple with built-in pulse.

Also add prefers-reduced-motion guard — motion-safe handles that.

Then conditional content: if !submittedEmail → form; else → success.

Let me write both states.

Form:

tsx
<CardHeader className="space-y-2 text-center">
  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md">
    <ShieldCheck className="h-6 w-6 text-white/90" aria-hidden />
  </div>
  <CardTitle className="text-2xl font-semibold tracking-tight text-white">
    Reset your password
  </CardTitle>
  <CardDescription className="text-sm text-white/60">
    Enter the email tied to your account and we&apos;ll send a secure reset link.
  </CardDescription>
</CardHeader>

<CardContent>
  <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
    <div className="space-y-2">
      <label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-white/60">
        Email address
      </label>
      <div className="relative">
        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" aria-hidden />
        <Input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@company.com"
          aria-invalid={errors.email ? 'true' : 'false'}
          aria-describedby={errors.email ? 'email-error' : undefined}
          disabled={isSubmitting}
          className="h-11 rounded-xl border-white/15 bg-white/5 pl-10 text-white placeholder:text-white/30 backdrop-blur-md transition-colors focus-visible:border-white/40 focus-visible:ring-2 focus-visible:ring-white/20"
          {...emailField}
          ref={...}
        />
      </div>
      {errors.email && (
        <p id="email-error" role="alert" className="text-xs font-medium text-rose-300">
          {errors.email.message}
        </p>
      )}
    </div>

    <Button type="submit" disabled={isSubmitting} className="group h-11 w-full rounded-xl bg-white text-slate-900 ...">
      {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…</> : <><Send className="mr-2 h-4 w-4" /> Send reset link</>}
    </Button>
  </form>
</CardContent>

<CardFooter className="justify-center">
  <Link href="/login" className="...">
    <ArrowLeft .../> Back to sign in
  </Link>
</CardFooter>

Note: emailField from destructure — careful with name collision. I'll do:

tsx
const emailReg = register('email');

inside component, then use. But register must be called during render; fine.

For ref merging, I'll do:

tsx
<Input
  {...emailReg}
  ref={(el) => {
    emailReg.ref(el);
    emailInputRef.current = el;
  }}
/>

TypeScript: emailReg.ref is (instance: HTMLInputElement | null) => void. Input's ref type is Ref<HTMLInputElement>. Fine.

Actually with spread {...emailReg} includes ref, then overriding ref after — order matters, ref after spread wins. But React might warn. It's fine.

Success state:

tsx
<CardHeader className="space-y-2 text-center">
  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10 backdrop-blur-md">
    <CheckCircle2 className="h-7 w-7 text-emerald-300" aria-hidden />
  </div>
  <CardTitle className="text-2xl font-semibold tracking-tight text-white">Check your inbox</CardTitle>
  <CardDescription className="text-sm text-white/60">
    We sent a password reset link to{' '}
    <span className="font-medium text-white/90">{submittedEmail}</span>. The link expires in 30 minutes.
  </CardDescription>
</CardHeader>
<CardContent className="space-y-4">
  <div aria-live="polite" className="sr-only">Reset email sent to {submittedEmail}</div>
  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/60 backdrop-blur-md">
    Didn&apos;t get it? Check spam, or resend below.
  </div>
  <Button onClick={handleResend} disabled={cooldown > 0} ...>
    {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend email'}
  </Button>
  <Button variant="ghost" onClick={handleEditEmail} ...>Use a different email</Button>
</CardContent>

Hmm, the Button variant "ghost" may or may not be styled; I'll just style inline.

Also, watch import unused — remove.

Let me also add a key/transition for state change: use CSS animate-in? Not installed maybe. I'll use a simple animate-[fadeIn_...]? Not defined. Keep simple with opacity transitions via a mounted key. I'll add a key on content wrapper and a small custom keyframe via inline <style jsx>? Next.js supports styled-jsx. But safer: use Tailwind's built-in animate-in requires tailwindcss-animate plugin — unknown. I'll skip entrance animation, or use motion-safe:transition-all on states. Simpler: rely on the card content swap with a key and a CSS class animate-[fade-in_0.4s_ease] — arbitrary keyframes need definition. Skip. I'll just do a subtle scale/opacity via inline style with transition on mount? Not worth it.

Actually I can add a small <style> block? In a client component, <style jsx global> works with styled-jsx in Next. But risky. I'll avoid.

I'll include a minimal keyframe via a <style> tag with dangerouslySetInnerHTML? Overkill. Skip motion; keep polish through glass + states.

Hmm, but the task is a motion audit/upgrade. Let's add tasteful motion using CSS transitions on hover/focus and a animate-pulse guarded by motion-safe for the ambient orbs. That's enough.

One more: autoFocus vs useEffect focus. Use useEffect with ref to avoid SSR issues; fine.

Also reset on edit. And handleSubmit catches.

Let me also handle the errors.email.message type — string | undefined; fine.

Also zod version: .email() is deprecated in zod 4 in favor of z.email(), but .email() still works. Keep.

Let me also include aria-busy on form.

Now the wrapper background: since (auth) layout may already have bg, adding a full-screen radial gradient could clash. But it's a page; likely fine. I'll make the wrapper min-h-[100dvh] and let it fill.

Actually, to be safe and avoid double backgrounds, I'll use relative isolate and a soft gradient that reads well on both light/dark? Hmm. The glass card with white text requires dark background. I'll commit to a dark glass aesthetic.

Let me finalize the code and JSON-escape it.

Escaping: content contains double quotes (className strings). In JSON they must be \". Also newlines as \n. This is a big string. I need to be careful.

Let me write the final TSX, then encode.

Final TSX:

tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  CheckCircle2,
  Mail,
  ShieldCheck,
  Send,
  Loader2,
} from 'lucide-react';

const emailSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
});

type FormValues = z.infer<typeof emailSchema>;

const RESEND_COOLDOWN_SECONDS = 30;

export default function ForgotPasswordPage() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const emailInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(emailSchema),
    mode: 'onSubmit',
    defaultValues: { email: '' },
  });

  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setInterval(() => {
      setCooldown((value) => (value <= 1 ? 0 : value - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  const handleSend = useCallback(async (values: FormValues) => {
    try {
      // TODO: replace with your auth provider call
      await new Promise((resolve) => setTimeout(resolve, 900));
      setSubmitted
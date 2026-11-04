The user wants an upgraded version of the forgot-password page. The format requirement says to wrap JSON tool call arrays in a json code block. But the mission says output raw code only. There's tension. The format requirement is at the top and is critical for the automation harness. So I should output ajson code block with a write_file tool call containing the upgraded code.

Wait, but the file name is src\app\(auth)\forgot-password\page.tsx — Windows path with backslashes. I should use forward slashes for absolute path? The instruction says "/abs/path". I'll use the path given: src/app/(auth)/forgot-password/page.tsx. Actually to be safe, use the exact path they gave but with forward slashes. Hmm, the harness likely expects a path. Let me use src/app/(auth)/forgot-password/page.tsx.

Now write a high-quality forgot-password page with Liquid Glass aesthetic, React Hook Form + Zod, resend cooldown, accessibility, motion (CSS-based, respecting reduced motion), proper loading states.

Let me craft the code carefully.

Key considerations:

It's a client component ('use client').

Use existing UI components: Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Button, Input, toast.

Icons: ArrowLeft, CheckCircle2, Mail, ShieldCheck, Send, Loader2.

Liquid Glass: backdrop-blur, gradient borders, soft shadows.

Use useForm + zodResolver.

Cooldown timer for resend.

Success state after submit.

Accessibility: aria-live for status, aria-invalid, aria-describedby for errors, focus management.

prefers-reduced-motion: use CSS media query in a style tag or use motion-safe utilities. I'll use Tailwind's motion-safe/motion-reduce variants.

Auto-focus email input.

Let me write the code.

I need to be careful with escaping double quotes in JSON. All " inside content must be \". Also newlines as \n. Actually JSON strings can't contain literal newlines; I need to escape them as \n. That makes the output one giant line. That's fine — the harness parses it.

But writing a whole file as a single-line JSON string with \n escapes is error-prone but doable. Let me write the code first, then escape.

Actually, I should just produce the JSON carefully. Let me write the TSX code.

tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Mail,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

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

const RESEND_COOLDOWN_SECONDS = 30;

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

async function requestPasswordReset(email: string): Promise<void> {
  // Replace with your real API call.
  await new Promise((resolve) => setTimeout(resolve, 900));
  if (email.toLowerCase().endsWith('@blocked.test')) {
    throw new Error('We could not send a reset link to that address.');
  }
}

Hmm, adding a fake error might be weird. Maybe keep it simple — just resolve. But showing error handling is good. I'll keep a comment. Actually I'll drop the blocked test to avoid weirdness, but keep try/catch with toast.

Let me design the layout:

Full-height centered container with decorative gradient blobs (aria-hidden).

Glass card with header (icon + title + description).

Form with email input, inline error, submit button.

Footer with "Back to sign in" link and security note.

Success state replaces form with checkmark, message, resend button with cooldown, back link.

Accessibility:

label for email (sr-only or visible). Use visible label.

aria-invalid, aria-describedby.

role="status" aria-live="polite" for success message.

Motion: CSS keyframes with motion-safe. I can add inline <style jsx> or a style tag. Better: use Tailwind classes animate-in fade-in slide-in-from-bottom-4? Those require tailwindcss-animate plugin which may not be installed. Safer: define keyframes in a <style> tag with prefers-reduced-motion guard. But Next.js allows <style jsx> only with styled-jsx (built-in). I'll use a plain <style> tag with dangerouslySetInnerHTML? No — just use a <style> element in JSX; React allows it though it warns for hydration? Actually a plain <style>{...}</style> works in React 18 client components but is discouraged. Since this is a client component and it's page-level, it's acceptable, but better to use CSS-in-file.

Alternative: use inline style transitions and a simple Tailwind approach with transition-all duration-300. For entrance, use a small state mounted that flips on useEffect to trigger opacity/translate transitions. That's clean, no global CSS needed, and respects reduced motion via motion-reduce:transition-none.

I'll do that: const [mounted, setMounted] = useState(false); useEffect(() => setMounted(true), []); and apply mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2' with transition-all duration-500 ease-out motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0.

Hmm, but motion-reduce:opacity-100 needs the base class. Simpler: conditionally apply classes; with reduced motion the transition-none still ends at the final state since mounted becomes true quickly. Fine.

Let me write the whole component.

tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Mail,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

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

const RESEND_COOLDOWN_SECONDS = 30;

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

async function requestPasswordReset(email: string): Promise<void> {
  // Swap this stub for your real endpoint, e.g.
  // await fetch('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
  await new Promise((resolve) => setTimeout(resolve, 800));
}

Careful: the comment contains ' and / — fine in JSON. But the // comment is fine.

Continue:

tsx
export default function ForgotPasswordPage() {
  const [mounted, setMounted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const emailInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
    reset,
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onSubmit',
    defaultValues: { email: '' },
  });

  const { ref: registerEmailRef, ...emailRegisterProps } = register('email');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!submittedEmail) {
      emailInputRef.current?.focus();
    }
  }, [submittedEmail]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  const onSubmit = useCallback(
    async (values: ForgotPasswordValues) => {
      try {
        await requestPasswordReset(values.email);
        setSubmittedEmail(values.email);
        setCooldown(RESEND_COOLDOWN_SECONDS);
        toast.success('Reset link sent. Check your inbox.');
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Something went wrong. Please try again.';
        toast.error(message);
      }
    },
    [],
  );

  const handleResend = useCallback(async () => {
    const email = submittedEmail ?? getValues('email');
    if (!email || cooldown > 0 || isResending) return;
    setIsResending(true);
    try {
      await requestPasswordReset(email);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      toast.success('Reset link sent again.');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not resend the link. Please try again.';
      toast.error(message);
    } finally {
      setIsResending(false);
    }
  }, [submittedEmail, getValues, cooldown, isResending]);

  const handleUseDifferentEmail = useCallback(() => {
    reset({ email: submittedEmail ?? '' });
    setSubmittedEmail(null);
    setCooldown(0);
  }, [reset, submittedEmail]);

Now JSX.

tsx
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12">
      {/* Decorative liquid-glass backdrop */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-indigo-500/30 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_0%,rgba(2,6,23,0.9)_70%)]" />
      </div>

      <Card
        className={[
          'relative w-full max-w-md overflow-hidden rounded-3xl border border-white/15',
          'bg-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-2xl',
          'transition-all duration-500 ease-out motion-reduce:transition-none',
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0',
        ].join(' ')}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"
        />
        ...
      </Card>
    </main>
  );
}

Then header:

tsx
        <CardHeader className="space-y-3 pb-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-white/60">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Account recovery
          </div>
          <CardTitle className="text-2xl font-semibold text-white">
            {submittedEmail ? 'Check your inbox' : 'Forgot your password?'}
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed text-white/70">
            {submittedEmail
              ? `We sent a secure reset link to ${submittedEmail}. The link expires in 30 minutes.`
              : 'Enter the email tied to your account and we will send a secure link to reset your password.'}
          </CardDescription>
        </CardHeader>

For success state:

tsx
        {submittedEmail ? (
          <CardContent className="space-y-6">
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-300/30 bg-emerald-400/10 p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-emerald-300" aria-hidden="true" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-white">Reset link sent</p>
                <p className="text-sm text-white/70">
                  Did not get it? Check your spam folder, or resend below.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || isResending}
                className="w-full"
              >
                {isResending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="h-4 w-4" aria-hidden="true" />
                )}
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend reset link'}
              </Button>
              <Button type="button" variant="ghost" onClick={handleUseDifferentEmail} className="w-full text-white/70 hover:text-white">
                Use a different email
              </Button>
            </div>

            <p role="status" aria-live="polite" className="sr-only">
              {cooldown > 0 ? `You can resend the link in ${cooldown} seconds.` : 'You can resend the link now.'}
            </p>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-white/80">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" aria-hidden="true" />
                  <Input
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    aria-invalid={errors.email ? 'true' : 'false'}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    className="h-11 border-white/15 bg-white/5 pl-10 text-white placeholder:text-white/40 focus-visible:border-white/40 focus-visible:ring-white/20"
                    {...emailRegisterProps}
                    ref={(node) => {
                      registerEmailRef(node);
                      emailInputRef.current = node;
                    }}
                  />
                </div>
                {errors.email ? (
                  <p id="email-error" className="text-sm text-rose-300">
                    {errors.email.message}
                  </p>
                ) : (
                  <p className="text-xs text-white/50">
                    We will never share your email address.
                  </p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 pt-2">
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Sending link
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" aria-hidden="true" />
                    Send reset link
                  </>
                )}
              </Button>

              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to sign in
              </Link>
            </CardFooter>
          </form>
        )}

Wait, the ref callback on 
Input
 — the Input component must forwardRef and accept a ref. Shadcn Input does forward ref. But mixing register's ref and a callback ref: 
registerEmailRef(node)
 — RHF's ref is a function that also may return a cleanup in RHF v7.
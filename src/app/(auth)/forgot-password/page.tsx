You are an expert senior engineer. Upgrade this file. Fix bugs, improve performance, use modern syntax. If it is perfect, output exactly PASS.
USE THESE SKILLS:

# Lean build

Native Core's architecture-first simplicity remains mandatory. Turn feature into complete narrow outcome fitting system.

Derive observable acceptance and explicit non-goals from request and repository.
Trace entry point through layers owning invariants.
Deliver coherent end-to-end path across responsible layers; never force work into one file, direct expression, or local patch.
Reuse fitting seam. Refactor when patching duplicates behavior, weakens ownership, or hides root cause.
Omit modes, providers, config, extensibility, and polish unless acceptance needs them.
Add surface, dependency, service, config, or migration only for lifecycle design or acceptance; state material tradeoff.
Keep work runnable; preserve Core safety.
Exercise path. Run focused proof. Stop when acceptance passes. Report only material omissions and trigger.

# Safe refactor

Define behavior-preservation boundary and establish verification before structural edits.

Keep feature changes outside refactor.
Move one ownership boundary at a time.
Preserve public interfaces, failure behavior, ordering, and compatibility unless explicitly scoped.
Keep intermediate states buildable and testable.
Avoid dependency or configuration growth without correctness need.
Run same proof after change. Stop when behavior matches and requested structure is achieved.
FILE: src\app(auth)\forgot-password\page.tsx
The user has a format requirement conflict. The format requirement says wrap JSON in  code block. The mission says output only raw upgraded code. But the format requirement is "CRITICAL" and appears at the top as an instruction for the automation harness. I should follow the format requirement and wrap in JSON code block.
Let me write a high-quality forgot-password page.
I need to escape quotes and newlines properly. Let me write the code, then carefully escape it.
Key features:
'use client'
React Hook Form + Zod
Liquid Glass aesthetic
Resend cooldown with timer
Accessible (aria-live, aria-invalid, aria-describedby)
Reduced motion support
Focus management
Loading states
Success state
Let me write the code:
tsx
'use client';
import * as React from 'react';
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
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  await new Promise((resolve) => setTimeout(resolve, 900));
  void email;
}
export default function ForgotPasswordPage() {
  const [submittedEmail, setSubmittedEmail] = React.useState<string | null>(null);
  const [isResending, setIsResending] = React.useState(false);
  const [cooldown, setCooldown] = React.useState(0);
  const emailInputRef = React.useRef<HTMLInputElement | null>(null);
  const successHeadingRef = React.useRef<HTMLHeadingElement | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onTouched',
  });
  const { ref: emailFieldRef, ...emailFieldProps } = register('email');
  React.useEffect(() => {
    emailInputRef.current?.focus();
  }, []);
  React.useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setInterval(() => {
      setCooldown((value) => (value <= 1 ? 0 : value - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);
  React.useEffect(() => {
    if (submittedEmail) {
      successHeadingRef.current?.focus();
    }
  }, [submittedEmail]);
  const onSubmit = React.useCallback(async (values: ForgotPasswordValues) => {
    try {
      await requestPasswordReset(values.email);
      setSubmittedEmail(values.email);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.';
      toast.error(message);
    }
  }, []);
  const handleResend = React.useCallback(async () => {
    if (!submittedEmail || isResending || cooldown > 0) return;
    setIsResending(true);
    try {
      await requestPasswordReset(submittedEmail);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      toast.success('Reset link sent again.');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.';
      toast.error(message);
    } finally {
      setIsResending(false);
    }
  }, [submittedEmail, isResending, cooldown]);
  const handleUseDifferentEmail = React.useCallback(() => {
    setSubmittedEmail(null);
    setCooldown(0);
    window.requestAnimationFrame(() => {
      emailInputRef.current?.focus();
    });
  }, []);
  const emailErrorMessage = errors.email?.message;
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-12 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-violet-300/40 blur-3xl motion-safe:animate-[float_14s_ease-in-out_infinite] dark:bg-violet-500/20" />
        <div className="absolute -right-16 top-0 h-80 w-80 rounded-full bg-sky-300/40 blur-3xl motion-safe:animate-[float_18s_ease-in-out_infinite_reverse] dark:bg-sky-500/20" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-rose-200/30 blur-3xl motion-safe:animate-[float_20s_ease-in-out_infinite] dark:bg-rose-500/10" />
      </div>
      <div className="relative w-full max-w-md motion-safe:animate-[fadeInUp_500ms_ease-out]">
        <Card className="overflow-hidden rounded-3xl border border-white/40 bg-white/60 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.25)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/50 dark:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]">
          <CardHeader className="space-y-3 pb-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-sky-500 text-white shadow-lg shadow-violet-500/30">
              <Mail aria-hidden="true" className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-semibold tracking-tight">
              {submittedEmail ? 'Check your inbox' : 'Forgot your password?'}
            </CardTitle>
            <CardDescription className="text-balance text-sm">
              {submittedEmail
                ? We've sent a password reset link to ${submittedEmail}.
                : 'Ente
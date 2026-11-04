The user wants me to upgrade the forgot-password page. I need to output JSON tool call arrays wrapped in  code blocks. Let me write the complete upgraded file.

Let me design the improvements:

Glassmorphism card with backdrop-blur

Animated gradient blobs

Cooldown/resend timer

AbortController with timeout

Better error handling (429, network errors)

Generic success message (no email enumeration)

Auto-focus

Accessibility (aria-live, proper labels)

Back button / different email

CSS animations respecting prefers-reduced-motion

Let me write the full TSX file carefully, escaping all double quotes as " for the JSON string.

I'll write the file content with proper escaping. Let me draft the TSX:

tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import { ArrowLeft, CheckCircle2, Mail, ShieldCheck, Send } from 'lucide-react';

const RESEND_COOLDOWN_SECONDS = 60;
const REQUEST_TIMEOUT_MS = 15000;

const forgotSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Enter a valid email address')
    .max(254, 'Email is too long'),
});

type ForgotForm = z.infer<typeof forgotSchema>;
type Step = 'form' | 'sent';
type SendResult = { ok: true } | { ok: false; message: string; retryAfter?: number };

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    getValues,
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
    mode: 'onBlur',
    defaultValues: { email: '' },
  });

  const { ref: registerEmailRef, ...emailField } = register('email');
  const setEmailRef = useCallback(
    (el: HTMLInputElement | null) => {
      registerEmailRef(el);
      emailInputRef.current = el;
    },
    [registerEmailRef]
  );

  const startCooldown = useCallback((seconds: number = RESEND_COOLDOWN_SECONDS) => {
    setCooldown(seconds);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  useEffect(() => {
    if (step === 'form') {
      const id = window.setTimeout(() => emailInputRef.current?.focus(), 60);
      return () => window.clearTimeout(id);
    }
  }, [step]);

  const sendReset = useCallback(async (email: string): Promise<SendResult> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        signal: controller.signal,
      });
      if (res.ok) return { ok: true };
      if (res.status === 429) {
        const retryAfter = Number(res.headers.get('Retry-After')) || RESEND_COOLDOWN_SECONDS;
        return { ok: false, message: 'Too many attempts. Please wait a moment.', retryAfter };
      }
      let message = 'Failed to send reset email';
      try {
        const data = await res.json();
        if (data?.error) message = data.error;
      } catch {}
      return { ok: false, message };
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        return { ok: false, message: 'Request timed out. Check your connection and try again.' };
      }
      return { ok: false, message: 'Network error. Please try again.' };
    } finally {
      clearTimeout(timeout);
    }
  }, []);

  const onSubmit = async (data: ForgotForm) => {
    if (loading) return;
    setLoading(true);
    const result = await sendReset(data.email);
    setLoading(false);
    if (result.ok) {
      setSubmittedEmail(data.email);
      setStep('sent');
      reset();
      startCooldown();
    } else {
      toast.error(result.message);
      if (result.retryAfter) startCooldown(result.retryAfter);
    }
  };

  const onResend = async () => {
    if (loading || cooldown > 0) return;
    setLoading(true);
    const result = await sendReset(submittedEmail);
    setLoading(false);
    if (result.ok) {
      toast.success('Reset link sent again');
      startCooldown();
    } else {
      toast.error(result.message);
      if (result.retryAfter) startCooldown(result.retryAfter);
    }
  };

  const onUseDifferentEmail = () => {
    setStep('form');
    reset({ email: submittedEmail });
  };

  const styles = `
    @keyframes heyFadeUp { from { opacity: 0; transform: translateY(14px) scale(0.99); } to { opacity: 1; transform: translateY(0) scale(1); } }
    @keyframes heyPop { 0% { opacity: 0; transform: scale(0.6); } 60% { opacity: 1; transform: scale(1.08); } 100% { transform: scale(1); } }
    @keyframes heyFloat { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(22px, -26px); } }
    .hey-fade-up { animation: heyFadeUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) both; }
    .hey-pop { animation: heyPop 0.6s cubic-bezier(0.22, 1, 0.36, 1) both; }
    .hey-blob { animation: heyFloat 14s ease-in-out infinite; }
    @media (prefers-reduced-motion: reduce) {
      .hey-fade-up, .hey-pop, .hey-blob { animation: none !important; }
    }
  `;

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-background to-primary/5 dark:from-zinc-950 dark:via-background dark:to-primary/10 px-4 py-12">
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="hey-blob absolute -top-32 -left-32 h-80 w-80 rounded-full bg-primary/25 blur-3xl" />
        <div className="hey-blob absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-fuchsia-500/20 blur-3xl" style={{ animationDelay: '-7s' }} />
      </div>

      {step === 'form' ? (
        <Card className="hey-fade-up relative w-full max-w-md border-white/40 bg-white/70 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/60">
          <CardHeader className="text-center">
            <Link href="/" className="inline-flex items-center gap-2 mb-6 justify-center" aria-label="HEY Home">
              <span className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">HEY</span>
            </Link>
            <CardTitle className="text-2xl">Forgot password?</CardTitle>
            <CardDescription>
              Enter the email tied to your HEY account and we&apos;ll send a secure reset link.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div>
                <Input
                  {...emailField
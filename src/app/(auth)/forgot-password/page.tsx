The user wants me to output the entire upgraded file. The instructions say "Output ONLY the raw code. No markdown blocks." But the format requirement says wrap in json code block with tool call array. There's a conflict. The FORMAT REQUIREMENT is critical and at the top — I should follow it: output a JSON tool call array in ajson code block, with write_file tool.

Wait — the final "CRITICAL INSTRUCTIONS" says "Output ONLY the raw code. No markdown blocks." But the FORMAT REQUIREMENT says wrap in json code block. The format requirement is more specific about the harness parsing. I'll follow the format requirement:  code block with a write_file tool call.

I need to complete the file. Let me write the full TSX.

Path: C:\Users\DELL\Documents\hey\src\app(auth)\forgot-password\page.tsx — in JSON: "C:\Users\DELL\Documents\hey\src\app\(auth)\forgot-password\page.tsx"

Let me write the complete component carefully.

Full file:

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
  ...
}

Let me write everything carefully. I'll make sure to properly escape.

In JSON, \" for quotes, \\n for newlines, \\\\ for backslashes (only path).

Let me write out the JSX carefully.

For the success step:

tsx
) : (
  <Card className="hey-fade-up relative w-full max-w-md ...">
    <CardHeader className="text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
        <CheckCircle2 className="hey-pop h-9 w-9 text-green-500" />
      </div>
      <CardTitle className="text-2xl">Check your inbox</CardTitle>
      <CardDescription>
        We&apos;ve sent a reset link to{' '}
        <span className="font-medium text-foreground">{submittedEmail}</span>. It expires in 30 minutes.
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div role="status" aria-live="polite" className="...">
        ...
      </div>
      <Button onClick={onResend} disabled={loading || cooldown > 0} ...>
        {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend email'}
      </Button>
      ...
    </CardContent>
  </Card>
)

Let me finalize the full content. I need to be careful about the emailField spread — in the draft there's {...emailField cut off. I'll fix that properly:

tsx
<Input
  {...emailField}
  ref={setEmailRef}
  type="email"
  ...
/>

Now let me write the full file. I need to ensure no unescaped quotes. Let me be very careful.

I'll write it out as raw text first, then escape.

Actually let me just produce the JSON directly, writing the content with all escapes carefully.

Path in JSON: "C:\Users\DELL\Documents\hey\src\app\(auth)\forgot-password\page.tsx"

Content — every " becomes \", every newline becomes \n, backslash in \\ no.

Let me write the complete content text:

text
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
    @keyframes heyFloat
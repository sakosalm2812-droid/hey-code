[FORMAT REQUIREMENT — READ CAREFULLY]
You MUST wrap ALL JSON tool call arrays in a  code block. This is critical: the automation harness parses your response by looking for code blocks first. Raw JSON outside a code block will NOT be detected.
CORRECT format:

[{"tool": "write_file", "path": "/abs/path", "content": "file content here"}]

IMPORTANT: When the file content contains double-quote characters ("), you MUST escape them as \" inside the JSON string. For example, XML like: <tag attr="value"> must be written as: <tag attr=\"value\"> in the JSON content field.


You are the HEY Improver. Implement the 10X upgrades requested by the Council.
File: C:\Users\DELL\Documents\hey\src\app\(auth)\verify\page.tsx
Dependencies: 
--- DEPENDENCY: src\lib\utils.ts ---
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount / 100);
}

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(new Date(date));
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, Math.max(0, length - 3)).trim() + '...';
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function retry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  return fn().catch(err => {
    if (retries === 0) throw err;
    return sleep(delay).then(() => retry(fn, retries - 1, delay * 2));
  });
}

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= ms) {
      lastCall = now;
      fn(...args);
    }
  };
}

--- DEPENDENCY: src\lib\utils.ts ---
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount / 100);
}

export function formatDate(date:
Feedback: The user wants me to upgrade the verify page. I should output a JSON tool call array wrapped in a  code block, with the write_file tool containing the entire upgraded file content. Let me craft a 10x better verify page.

Key upgrades:

Liquid glass aesthetic, framer-motion animations

Better state handling (idle/verifying/success/error), retry logic, resend verification email

Accessibility, reduced motion

Beautiful animated background, gradient blobs

Polling/robust fetch with timeout via AbortController

Auto redirect countdown display

Support for token in URL with sanitization

Better error messages

confetti-ish success

Use existing Button, Card, cn utils

Keep Suspense wrapper

Add resend email form when error (enter email → POST /api/auth/resend-verification)

Framer motion: import { motion, AnimatePresence } from 'framer-motion'. Risky if not installed, but the council explicitly said Framer Motion. The dependency list doesn't include framer-motion but it's commonly present. Hmm, risky. I could implement CSS animations instead to be safe, using tailwind keyframes... but no tailwind config known. Use inline styles with CSS animations defined via a <style> tag? Safer: use framer-motion since directive says so. But if not installed, build fails. Let me think — the format requirement mentions tool call arrays. I only have write_file presumably.

I'll avoid framer-motion dependency risk by using CSS animations defined inline in a <style jsx>? That requires styled-jsx which Next supports by default in pages... In app router, styled-jsx works in client components. Actually styled-jsx is included with Next.js. But to be maximally safe, use a plain <style> element with a unique class prefix. That's fully safe.

Hmm but "Liquid Glass, Framer Motion" is a suggestion. I'll go with pure CSS animations + tailwind utility classes for safety, plus framer-motion... no. Decision: use a <style> tag with keyframes. Safe and beautiful.

Actually, let me include framer-motion since it's the "10X" directive and very common in these repos... The risk of breaking build vs. aesthetics. I'll go with CSS-only to guarantee it compiles. I'll mention glassmorphism.

Let me write the file.

Features:

Status: 'verifying' | 'success' | 'error' | 'expired' | 'missing'

Retry button for network errors

Resend verification email form

Countdown to redirect with progress ring

AbortController timeout

Reduced motion respect via media query in CSS

Skip auto-redirect option / "Go to dashboard now"

aria-live regions

Sanitize token (trim, length check)

Rotating gradient orbs background

Mouse-follow shine? keep simple.

Implementation details:

tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { Loader2, CheckCircle2, AlertCircle, Mail, RefreshCw, ArrowRight, ShieldCheck } from 'lucide-react';

Note card.tsx dependency truncated but has Card, CardContent, CardDescription, CardHeader, CardTitle presumably.

State machine:

tsx
type Status = 'idle' | 'verifying' | 'success' | 'error';

Write the verify function with AbortController and 15s timeout, retries 2 with backoff.

Countdown: on success, countdown from 5, then router.push('/dashboard'); allow cancel.

Let me write code carefully.

tsx
const REDIRECT_SECONDS = 5;
const FETCH_TIMEOUT_MS = 15000;
const MAX_ATTEMPTS = 2;

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawToken = searchParams.get('token');
  const token = useMemo(() => (rawToken ? rawToken.trim().slice(0, 512) : ''), [rawToken]);

  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);
  const [redirecting, setRedirecting] = useState(true);
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const startedRef = useRef(false);

verify:

tsx
const verify = useCallback(async () => {
  if (!token) { setStatus('error'); setMessage('This verification link is missing its token.'); setErrorCode('missing_token'); return; }
  setStatus('verifying'); setMessage('');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    let lastError: unknown = null;
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      try {
        const res = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
          signal: controller.signal,
          credentials: 'same-origin',
          cache: 'no-store',
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && (data.verified ?? true)) { ... success; return; }
        // terminal error → no retry on 4xx except 429
        ...
      } catch (err) { lastError = err; if (i < MAX-1) await sleep(...) }
    }
  } finally { clearTimeout(timeout); }
}, [token, router]);

Simplify: retries only on network errors.

Let me just write it cleanly.

Success handler: setStatus('success'); setMessage(data.message || 'Email verified successfully!'); toast.success; setSecondsLeft(REDIRECT_SECONDS); setRedirecting(true).

Then an effect for countdown:

tsx
useEffect(() => {
  if (status !== 'success' || !redirecting) return;
  if (secondsLeft <= 0) { router.push('/dashboard'); return; }
  const t = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
  return () => clearTimeout(t);
}, [status, redirecting, secondsLeft, router]);

Start verify on mount when token present:

tsx
useEffect(() => {
  if (startedRef.current) return;
  startedRef.current = true;
  void verify();
}, [verify]);

But retry button should re-run; use setAttempt to trigger. Simpler: on retry, call verify() directly after resetting startedRef.

Resend:

tsx
const handleResend = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resendEmail)) { toast.error('Enter a valid email address'); return; }
  setResending(true);
  try {
    const res = await fetch('/api/auth/resend-verification', { method: 'POST', headers: {...}, body: JSON.stringify({ email: resendEmail }) });
    if (!res.ok) throw new Error();
    setResent(true);
    toast.success('Verification email sent');
  } catch { toast.error('Could not send email. Try again shortly.'); }
  finally { setResending(false); }
};

Hmm the API endpoint name — /api/auth/resend-verification is a guess. Since we can't know, maybe use '/api/auth/verify/resend'. It's a guess either way. I'll use '/api/auth/resend-verification' and note it gracefully handles failure.

Now the UI: glass card, animated orbs, progress ring for countdown.

Progress ring: SVG circle with strokeDasharray.

Let me write the whole file now.

For the style tag, use a component-level <style> with keyframes:

tsx
<style>{`
  @keyframes hey-float { ... }
  ...
`}</style>

In app router client component, plain <style> works (React 18 hoists? Actually React 19 supports style hoisting; React 18 renders it inline which is fine).

Use suppressHydrationWarning? Not needed.

Write the code:

tsx
export default function VerifyPage() {
  return (
    <Suspense fallback={<VerifySkeleton />}>
      <VerifyContent />
    </Suspense>
  );
}

Skeleton with pulsing glass card.

Now, Card component className usage - it takes className via cn presumably. Fine.

Let me carefully compose.

Full code:

tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Mail,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

type Status = 'idle' | 'verifying' | 'success' | 'error';
type ErrorKind = 'missing_token' | 'expired' | 'invalid' | 'network' | 'unknown';

const REDIRECT_SECONDS = 5;
const FETCH_TIMEOUT_MS = 15_000;
const MAX_ATTEMPTS = 2;
const TOKEN_MAX_LENGTH = 512;

Utility sleep inline.

Now writing components: BackgroundOrbs, StatusIcon etc.

I'll write it all in one file.

For the progress ring:

tsx
function CountdownRing({ seconds, total }: { seconds: number; total: number }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, seconds / total));
  return (
    <div className="relative h-16 w-16">
      <svg viewBox="0 0 56 56" className="h-16 w-16 -rotate-90">
        <circle cx="28" cy="28" r={radius} className="stroke-white/15" strokeWidth="4" fill="none" />
        <circle
          cx="28" cy="28" r={radius}
          className="stroke-emerald-400 transition-[stroke-dashoffset] duration-1000 ease-linear"
          strokeWidth="4" fill="none" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums">{seconds}</span>
    </div>
  );
}

Careful with transition-[stroke-dashoffset] — fine in tailwind arbitrary.

Now main body. Use dark-ish gradient background with light/dark support. Keep it reasonably theme-agnostic: use bg-slate-950 gradient? The rest of app uses muted/30 with theme tokens. I'll do a rich gradient that works: bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 with white text? But Card uses theme tokens (bg-card). Might clash in light mode. Safer: use bg-background with decorative gradient orbs at low opacity, and glass card with bg-card/70 backdrop-blur-xl. That's theme-safe. Good.

Now let's write the final file.

Also add: autoComplete, inputMode="email", aria-live="polite".

Also handle: if status success, show "Go to dashboard" button that pushes now.

Let's produce final code.

Also add a "verify again" / retry button when network error.

Write out:

tsx
function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawToken = searchParams.get('token');
  const token = useMemo(() => {
    if (!rawToken) return '';
    return decodeURIComponent(rawToken).trim().slice(0, TOKEN_MAX_LENGTH);
  }, [rawToken]);
  ...

decodeURIComponent might throw on malformed. Wrap in try/catch.

tsx
const token = useMemo(() => {
  if (!rawToken) return '';
  try { return decodeURIComponent(rawToken).trim().slice(0, TOKEN_MAX_LENGTH); }
  catch { return rawToken.trim().slice(0, TOKEN_MAX_LENGTH); }
}, [rawToken]);

Good.

Now verify callback. Use a ref to hold controller for cleanup.

tsx
const abortRef = useRef<AbortController | null>(null);

const verify = useCallback(async () => {
  abortRef.current?.abort();
  const controller = new AbortController();
  abortRef.current = controller;
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  setStatus('verifying');
  setMessage('');

  if (!token) {
    clearTimeout(timeoutId);
    setStatus('error');
    setErrorKind('missing_token');
    setMessage('This link is missing its verification token.');
    return;
  }

  let lastError: unknown = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ token }),
        signal: controller.signal,
        credentials: 'same-origin',
        cache: 'no-store',
      });

      const data = (await res.json().catch(() => ({}))) as { verified?: boolean; error?: string; code?: string };

      if (res.ok && data.verified !== false) {
        clearTimeout(timeoutId);
        setStatus('success');
        setMessage(data.message ?? 'Email verified successfully!');
        toast.success('Email verified 🎉');
        return;
      }

      // Server responded with a definitive failure — do not retry.
      clearTimeout(timeoutId);
      setStatus('error');
      const code = data.code ?? '';
      setErrorKind(res.status === 410 || code === 'expired' ? 'expired' : 'invalid');
      setMessage(data.error ?? (res.status === 410 ? 'This verification link has expired.' : 'This verification link is invalid or has already been used.'));
      return;
    } catch (error) {
      lastError = error;
      const aborted = error instanceof DOMException && error.name === 'AbortError';
      if (aborted && controller.signal.reason !== 'timeout') break; // unmount
      if (attempt < MAX_ATTEMPTS - 1) {
        await new Promise(r => setTimeout(r, 600 * 2 ** attempt));
        continue;
      }
    }
  }
  ...

Hmm, AbortController.abort() with reason "timeout" — the timeout calls controller.abort() without reason so signal.reason is a DOMException AbortError. Distinguishing unmount-abort from timeout-abort is tricky. Simpler: track a disposedRef boolean set on unmount; if disposed, do nothing.

Let me simplify: use a cancelledRef for unmount.

tsx
const mountedRef = useRef(true);
useEffect(() => () => { mountedRef.current = false; abortRef.current?.abort(); }, []);

Wait, but with React 18 strict mode double-mount in dev, mountedRef gets set false then component remounts... Actually the effect cleanup sets it false and it never resets. Add mountedRef.current = true; at effect start.

Then in catch: if (!mountedRef.current) return;

And after the loop (all attempts network-failed):

tsx
clearTimeout(timeoutId);
setStatus('error');
setErrorKind('network');
setMessage(lastError ... 'We couldn't reach the server. Check your connection and try again.');

But if aborted due to timeout and mounted, that's a network error too — fine.

Also guard success/error sets with if (!mountedRef.current) return;.

Fine.

Now the effects for countdown.

tsx
useEffect(() => {
  if (status !== 'success' || !autoRedirect) return;
  if (secondsLeft <= 0) { router.push('/dashboard'); return; }
  const id = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
  return () => clearTimeout(id);
}, [status, autoRedirect, secondsLeft, router]);

Also reset secondsLeft when entering success: in success branch 
setSecondsLeft(RED

Current Code:
[FORMAT REQUIREMENT — READ CAREFULLY]
You MUST wrap ALL JSON tool call arrays in a  code block. This is critical: the automation harness parses your response by looking for code blocks first. Raw JSON outside a code block will NOT be detected.
CORRECT format:

[{"tool": "write_file", "path": "/abs/path", "content": "file content here"}]

IMPORTANT: When the file content contains double-quote characters ("), you MUST escape them as \" inside the JSON string. For example, XML like: <tag attr="value"> must be written as: <tag attr=\"value\"> in the JSON content field.


You are the HEY Improver. Implement the 10X upgrades requested by the Council.
File: C:\Users\DELL\Documents\hey\src\app\(auth)\verify\page.tsx
Dependencies: 
--- DEPENDENCY: src\components\ui\button.tsx ---
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        gradient: 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        xl: 'h-12 rounded-lg px-10 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {asChild ? (
        children
      ) : (
        <>
          {loading && (
            <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          {children}
        </>
      )}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };

--- DEPENDENCY: src\components\ui\card.tsx ---
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ cla
Feedback: [FORMAT REQUIREMENT — READ CAREFULLY].txt
TXT 7.91KB

Current Code:
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <VerifyContent />
    </Suspense>
  );
}

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const result = await res.json();
        if (res.ok && result.verified) {
          setStatus('success');
          setMessage('Email verified successfully! Redirecting...');
          setTimeout(() => router.push('/dashboard'), 2000);
        } else {
          setStatus('error');
          setMessage(result.error || 'Invalid or expired verification link');
        }
      } catch {
        setStatus('error');
        setMessage('Verification failed. Please try again.');
      }
    };

    verify();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <Link href="/" className="inline-flex items-center gap-2 mb-6 justify-center" aria-label="HEY Home">
            <span className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              HEY
            </span>
          </Link>
          <CardTitle className="text-2xl">Verify Your Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Verifying your email...</p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="text-lg font-medium">{message}</p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <p className="text-lg font-medium text-destructive">{message}</p>
              <div className="flex gap-3">
                <Link href="/signin">
                  <Button variant="outline">Sign In</Button>
                </Link>
                <Link href="/signup">
                  <Button>Sign Up</Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


CRITICAL INSTRUCTIONS:
1. Output the ENTIRE file. DO NOT truncate.
2. Preserve existing working logic, but aggressively upgrade everything else.
3. Output ONLY the raw code. No markdown blocks.

CRITICAL INSTRUCTIONS:
1. Output the ENTIRE file. DO NOT truncate.
2. Preserve existing working logic, but aggressively upgrade everything else.
3. Output ONLY the raw code. No markdown blocks.
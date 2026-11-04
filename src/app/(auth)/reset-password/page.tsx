The user wants me to output an upgraded version of the reset-password page. But the format requirement says I MUST wrap JSON tool call arrays in a  code block. So I need to output a JSON array with write_file tool.

Let me write the upgraded file and serialize to JSON with escaped quotes and newlines.

Let me construct the full TSX content, then serialize.

I'll keep it robust. Let me use Input with label/error as-is, and add password strength meter using watch. I'll add eye toggle carefully - actually I'll create a self-contained approach. Let me think.

Given Input accepts label, error, helperText, and standard input props. To add an eye toggle robustly, I could pass a type and just skip. But eye toggle is great UX.

Let me use a wrapper approach: I'll render the Input WITHOUT label and manage label myself. Then position the toggle with top-1/2 -translate-y-1/2 within a relative wrapper. For error, I'll render error text myself. This avoids depending on unknown Input internals. But then I'm not using Input's label/error props. Actually simpler: use Input with label and error, and ALSO render the toggle. The toggle position — I'll use top-9 or similar.

Hmm. Actually the cleanest robust approach: create a small PasswordField component in the file that renders:

label

relative div with Input (no label, no error) + toggle button

error text

This uses Input for the actual input element. That's a good use of the dependency. Let me do that. Input without label won't render label. Whether it renders error without label — I'll render error myself so it doesn't matter.

But Input might still apply error styling if I don't pass error — fine, I just won't pass error.

So PasswordField:

tsx
function PasswordField({ id, label, error, show, onToggle, ...props }: ...) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium leading-none">{label}</label>
      <div className="relative">
        <Input id={id} type={show ? 'text' : 'password'} className="pr-10" aria-invalid={!!error} {...props} />
        <button type="button" onClick={onToggle} className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors" aria-label={show ? 'Hide password' : 'Show password'} tabIndex={-1}>
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

But Input might have built-in padding that clashes with pr-10 via className merge — cn handles that with tailwind-merge likely. Fine.

Wait, Input may render helperText. I won't pass helperText to the input; I'll manage below.

Actually for password strength, I'll show it separately after the password field.

Let me now build the full file.

Imports: need Eye, EyeOff, ShieldCheck, CheckCircle2, XCircle, etc from lucide-react.

Let me write it all.

Content:

tsx
'use client';

import { useCallback, useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import {
  Loader2,
  Lock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  KeyRound,
  MailCheck,
} from 'lucide-react';

const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password is too long')
      .regex(/[a-z]/, 'Add a lowercase letter')
      .regex(/[A-Z]/, 'Add an uppercase letter')
      .regex(/\d/, 'Add a number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetForm = z.infer<typeof resetSchema>;

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

const STRENGTH_LABELS = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'] as const;
const STRENGTH_COLORS = [
  'bg-red-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-lime-500',
  'bg-emerald-500',
] as const;
const STRENGTH_TEXT = [
  'text-red-500',
  'text-orange-500',
  'text-amber-500',
  'text-lime-600',
  'text-emerald-600',
] as const;

function scorePassword(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<PageShell><ResetSkeleton /></PageShell>}>
      <ResetPasswordContent />
    </Suspense>
  );
}

Hmm, PageShell with children. Let me just make skeleton full page.

Let me define PageShell as the background wrapper:

tsx
function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-muted/40 to-background px-4 py-12">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      </div>
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}

Need React import for React.ReactNode type — I'll import type React or use React.ReactNode with import * as React. Actually with the new JSX transform, I can import type { ReactNode } from 'react'. I'll add ReactNode to imports.

Skeleton:

tsx
function ResetSkeleton() {
  return (
    <Card className="border-border/60 bg-background/70 backdrop-blur-xl shadow-2xl">
      <CardContent className="flex flex-col items-center gap-4 py-16">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Preparing your secure reset form…</p>
      </CardContent>
    </Card>
  );
}

Main content:

tsx
function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams?.get('token') ?? null;

  const [valid, setValid] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    mode: 'onChange',
    defaultValues: { password: '', confirmPassword: '' },
  });

  const password = watch('password') ?? '';
  const confirm = watch('confirmPassword') ?? '';
  const score = useMemo(() => scorePassword(password), [password]);
  const passwordsMatch = confirm.length > 0 && password === confirm;

  useEffect(() => {
    if (!token) {
      setValid(false);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `/api/auth/reset-password?token=${encodeURIComponent(token)}`,
          { signal: controller.signal, cache: 'no-store' },
        );
        const result: { valid?: boolean } = await res.json().catch(() => ({}));
        if (!cancelled) setValid(res.ok && !!result.valid);
      } catch (error) {
        if (!cancelled && (error as Error).name !== 'AbortError') {
          setValid(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [token]);

  const onSubmit = useCallback(
    async (data: ResetForm) => {
      if (!token) {
        toast.error('Missing reset token. Please request a new link.');
        return;
      }
      setSubmitting(true);
      try {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, password: data.password }),
        });
        const result = await res.json().catch(() => ({}));
        if (res.ok) {
          setSuccess(true);
          toast.success('Password reset successfully!');
          setTimeout(() => router.push('/signin'), 2400);
        } else {
          toast.error(result?.error || 'Failed to reset password');
        }
      } catch {
        toast.error('Something went wrong. Please try again.');
      } finally {
        setSubmitting(false);
      }
    },
    [router, token],
  );

  const checking = valid === null;

  return (
    <PageShell>
      <AnimatePresence mode="wait">
        {checking ? (
          <motion.div
            key="checking"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <ResetSkeleton />
          </motion.div>
        ) : success ? (
          <motion.div key="success" ...>
            <SuccessCard />
          </motion.div>
        ) : !valid ? (
          <motion.div key="invalid" ...>
            <InvalidCard />
          </motion.div>
        ) : (
          <motion.div key="form" ...>
            <FormCard ... />
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}

This is getting big. Let me simplify by inlining cards but keep it readable.

Actually let me restructure to reduce complexity: keep a single Card and switch inner content with AnimatePresence. That reduces duplication of PageShell. Let me do:

tsx
return (
  <PageShell>
    <Card className="border-border/60 bg-background/70 backdrop-blur-xl shadow-2xl">
      <CardHeader className="space-y-3 text-center">
        <BrandLink />
        <AnimatePresence mode="wait">
          <motion.div key={stateKey} ...>
            {heading...}
          </motion.div>
        </AnimatePresence>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {checking ? <SkeletonBody key="checking"/> : success ? <SuccessBody key="success"/> : !valid ? <InvalidBody key="invalid"/> : <FormBody key="form"/>}
        </AnimatePresence>
      </CardContent>
    </Card>
  </PageShell>
);

Hmm but header title changes. Let me just render separate cards each with their own header/content, wrapped in motion, within PageShell. Duplication of the Brand link — I'll extract BrandLink component.

Let me define:

tsx
function BrandLink() {
  return (
    <Link href="/" className="inline-flex items-center justify-center gap-2 group" aria-label="HEY Home">
      <span className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent transition-transform group-hover:scale-105">
        HEY
      </span>
    </Link>
  );
}

Card wrapper - I'll create GlassCard.

OK let me just write the final file now, being thorough. I'll write it in my head fully.

tsx
'use client';

import { useCallback, useEffect, useMemo, useState, Suspense } from 'react';
import type { ReactNode } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import {
  Loader2,
  Lock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  KeyRound,
} from 'lucide-react';

const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password is too long')
      .regex(/[a-z]/, 'Include a lowercase letter')
      .regex(/[A-Z]/, 'Include an uppercase letter')
      .regex(/\d/, 'Include a number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetForm = z.infer<typeof resetSchema>;

const STRENGTH_LABELS = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'] as const;
const STRENGTH_BARS = [
  'bg-red-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-lime-500',
  'bg-emerald-500',
] as const;
const STRENGTH_TEXT = [
  'text-red-500',
  'text-orange-500',
  'text-amber-500',
  'text-lime-600',
  'text-emerald-600',
] as const;

function scorePassword(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(score, 4);
}

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-background via-muted/40 to-background px-4 py-12">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      </div>
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}

function GlassCard({ children }: { children: ReactNode }) {
  return (
    <Card className="overflow-hidden border-border/60 bg-background/70 shadow-2xl backdrop-blur-xl">
      {children}
    </Card>
  );
}

function BrandLink() {
  return (
    <Link
      href="/"
      className="group inline-flex items-center justify-center gap-2"
      aria-label="HEY Home"
    >
      <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-3xl font-bold tracking-tight text-transparent transition-transform group-hover:scale-105">
        HEY
      </span>
    </Link>
  );
}

function PasswordField({...}) ...

Let me write PasswordField:

tsx
interface PasswordFieldProps {
  id: string;
  label: string;
  error?: string;
  visible: boolean;
  onToggle: () => void;
  autoComplete?: string;
  placeholder?: string;
  disabled?: boolean;
  registration: ReturnType<ReturnType<typeof useForm<ResetForm>>['register']>;
}


Hmm typing registration is awkward. Simpler: accept registerResult: any. Or just inline the field in the form and duplicate twice. Duplication of 2 fields is fine and avoids typing pain.

Let me inline the two fields in the form.

Form body:

tsx
<CardHeader className="space-y-3 text-center">
  <BrandLink />
  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
    <KeyRound className="h-6 w-6" />
  </div>
  <CardTitle className="text-2xl">Set a new password</CardTitle>
  <CardDescription>
    Choose a strong password you haven&apos;t used before.
  </CardDescription>
</CardHeader>
<CardContent>
  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
    <div className="space-y-2">
      <label htmlFor="password" className="text-sm font-medium leading-none">
        New password
      </label>
      <div className="relative">
        <Input
          id="password"
          {...register('password')}
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          autoComplete="new-password"
          disabled={submitting}
          className="pr-10"
          aria-invalid={!!errors.password}
          aria-describedby="password-strength"
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <div id="password-strength" className="space-y-1.5" aria-live="polite">
        <div className="flex gap-1">
          {[0, 1, 2, 3].map((index) => (
            <span
              key={index}
              className={cx(
                'h-1.5 flex-1 rounded-full transition-colors duration-300',
                index < score ? STRENGTH_BARS[score] : 'bg-muted',
              )}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Strength:{' '}
          <span className={cx('font-medium', password ? STRENGTH_TEXT[score] : 'text-muted-foreground')}>
            {password ? STRENGTH_LABELS[score] : 'Start typing'}
          </span>
        </p>
      </div>
      {errors.password && (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5" />
          {errors.password.message}
        </p>
      )}
    </div>

    <div className="space-y-2">
      <label htmlFor="confirmPassword" className="text-sm font-medium leading-none">
        Confirm password
      </label>
      <div className="relative">
        <Input
          id="confirmPassword"
          {...register('confirmPassword')}
          type={showConfirm ? 'text' : 'password'}
          placeholder="••••••••"
          autoComplete="new-password"
          disabled={submitting}
          className="pr-10"
          aria-invalid={!!errors.confirmPassword}
        />
        <button
          type="button"
          onClick={() => setShowConfirm((v) => !v)}
          className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label={showConfirm ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {confirm.length > 0 && (
        <p
          className={cx(
            'flex items-center gap-1 text-xs',
            passwordsMatch ? 'text-emerald-600' : 'text-destructive',
          )}
        >
          {passwordsMatch ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" /> Passwords match
            </>
          ) : (
            <>
              <AlertCircle className="h-3.5 w-3.5" /> Passwords do not match
            </>
          )}
        </p>
      )}
      {errors.confirmPassword && !confirm && (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5" />
          {errors.confirmPassword.message}
        </p>
      )}
    </div>

    <Button type="submit" size="lg" className="w-full" loading={submitting || isSubmitting} disabled={submitting || !passwordsMatch}>
      <Lock className="mr-2 h-4 w-4" />
      Reset password
    </Button>

    <div className="flex items-center justify-center gap-1.5 rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
      Your password is encrypted in transit. This link can only be used once.
    </div>
  </form>
</CardContent>

Wait, the confirmPassword error message "Passwords do not match" from zod only fires on submit/
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import { Loader2, Lock, CheckCircle, AlertCircle } from 'lucide-react';

const resetSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ResetForm = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams?.get('token') ?? null;
  const [valid, setValid] = useState(false);
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  useEffect(() => {
    if (!token) {
      setChecking(false);
      return;
    }
    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((result: { valid?: boolean }) => {
        setValid(!!result.valid);
      })
      .catch(() => setValid(false))
      .finally(() => setChecking(false));
  }, [token]);

  const onSubmit = async (data: ResetForm) => {
    if (!token) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: data.password }),
      });
      const result = await res.json();
      if (res.ok) {
        toast.success('Password reset successfully!');
        router.push('/signin');
      } else {
        toast.error(result.error || 'Failed to reset password');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Validating reset link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <Link href="/" className="inline-flex items-center gap-2 mb-6 justify-center" aria-label="HEY Home">
              <span className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                HEY
              </span>
            </Link>
            <CardTitle className="text-2xl">Invalid Reset Link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <p className="text-muted-foreground">
              This password reset link is invalid or has expired.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/forgot-password">
                <Button variant="outline">Request New Link</Button>
              </Link>
              <Link href="/signin">
                <Button>Sign In</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 justify-center" aria-label="HEY Home">
            <span className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              HEY
            </span>
          </Link>
          <CardTitle className="text-2xl">Set New Password</CardTitle>
          <CardDescription>Your new password must be different from previous ones</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              {...register('password')}
              type="password"
              label="New Password"
              placeholder="••••••••"
              error={errors.password?.message}
              autoComplete="new-password"
              disabled={submitting}
              helperText="At least 8 characters"
            />
            <Input
              {...register('confirmPassword')}
              type="password"
              label="Confirm Password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              autoComplete="new-password"
              disabled={submitting}
            />
            <Button type="submit" className="w-full" size="lg" loading={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              <Lock className="mr-2 h-4 w-4" />
              Reset Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

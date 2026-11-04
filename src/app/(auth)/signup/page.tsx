The user wants me to output JSON tool call arrays wrapped in a  code block. The file content must be escaped. I need to write an upgraded signup page.

Let me plan the upgrade carefully, then produce the JSON with proper escaping.

Key upgrades:

Two-column layout with brand panel (liquid glass)

Framer Motion animations

Password strength meter

Show/hide password toggles

Debounced email availability check (graceful degradation)

Per-provider OAuth loading states

Terms checkbox in zod schema (bug fix)

Success state animation

Referral code from URL

Idempotency key

Proper a11y

Google SVG icon instead of Mail

I must avoid useSearchParams (Suspense issue) — read window.location in useEffect.

Let me write the code carefully. I need to be careful with escaping quotes in JSON. I'll write the content, then escape it.

Let me write the TSX:

tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import { Github, Eye, EyeOff, Check, X, Loader2, ShieldCheck, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const signUpSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50, 'Name must be 50 characters or fewer'),
    email: z.string().trim().email('Enter a valid email address').max(254, 'Email is too long'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password must be 72 characters or fewer')
      .regex(/[A-Za-z]/, 'Include at least one letter')
      .regex(/[0-9]/, 'Include at least one number'),
    confirmPassword: z.string(),
    termsAccepted: z.boolean().refine((v) => v, 'You must accept the Terms of Service'),
    ageCheck: z.boolean().refine((v) => v, 'You must be at least 13 years old to use HEY'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SignUpForm = z.infer<typeof signUpSchema>;

type StrengthLevel = 0 | 1 | 2 | 3 | 4;

function getPasswordStrength(password: string): { level: StrengthLevel; label: string; barClass: string; hints: string[] } {
  if (!password) {
    return { level: 0, label: 'Enter a password', barClass: 'bg-muted', hints: [] };
  }
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const level = Math.min(4, score) as StrengthLevel;

  const meta: Record<StrengthLevel, { label: string; barClass: string }> = {
    0: { label: 'Too short', barClass: 'bg-destructive' },
    1: { label: 'Weak', barClass: 'bg-destructive' },
    2: { label: 'Fair', barClass: 'bg-amber-500' },
    3: { label: 'Strong', barClass: 'bg-lime-500' },
    4: { label: 'Excellent', barClass: 'bg-emerald-500' },
  };

  const hints: string[] = [];
  if (password.length < 12) hints.push('Use 12+ characters');
  if (!/[A-Z]/.test(password)) hints.push('Add an uppercase letter');
  if (!/\d/.test(password)) hints.push('Add a number');
  if (!/[^A-Za-z0-9]/.test(password)) hints.push('Add a symbol');

  return { level, label: meta[level].label, barClass: meta[level].barClass, hints };
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.27-4.74 3.27-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

function generateIdempotencyKey(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  } catch {
    // ignore
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type EmailStatus = 'idle' | 'checking' | 'available' | 'taken';

export default function SignUpPage() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null);
  const [showPassword, setShowPassword] = useState(false
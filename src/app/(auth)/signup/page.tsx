The user wants me to output the entire upgraded signup page file. The format requirement says wrap JSON tool call in  block, but critical instructions say output ONLY raw code, no markdown blocks. There's a conflict but I'll follow the format requirement about wrapping JSON tool calls in a code block since that's the harness mechanism, and put the file content in the JSON content field.

Actually, re-reading: the file content is the format requirement file, and it says "Output ONLY the raw code. No markdown blocks." I think the safest approach given the automation harness parses code blocks is to output a JSON tool call array wrapped in json.

Let me write the complete file carefully.

I need to escape quotes and backslashes properly.

Let me write the full TSX content first, then embed it.

I'll design the upgrade:

Two-column split layout

Brand panel with animated gradient, social proof

Glassmorphism form card

Framer Motion animations

Password strength meter

Show/hide password toggles

Debounced email availability check

Per-provider OAuth loading

Terms + age checkboxes in zod schema

Success state with animation

Referral code optional field

Idempotency key

Accessible labels, aria-live

Reduced motion support

Inline SVG Google icon

No unknown deps: use Button, Input from deps. Card not in deps shown → I'll use divs with glass styling to avoid unknown imports. Actually the instruction says preserve existing working logic — but I don't see original code. I'll build a full page.

I'll avoid react-hot-toast (not listed as dep), avoid lucide? lucide is very standard in shadcn. But not listed... The dependencies section only shows button.tsx and input.tsx. To be safe with "must work", I'll use lucide-react since it's ubiquitous in these projects. Hmm, risk. Let me use inline SVGs for icons to be fully safe? That's a lot of code but robust. Actually I'll use lucide-react — it's standard. The original page likely imported it.

Let me write it now.

I'll write a clean, complete file.

Key implementation details:

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
import {
  AlertCircle, ArrowRight, Check, CheckCircle2, Eye, EyeOff,
  Gift, Github, Loader2, Lock, Mail, ShieldCheck, Sparkles, User, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

Schema:

tsx
const signUpSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50, 'Name is too long'),
  email: z.string().trim().email('Enter a valid email address').max(254, 'Email is too long'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72, 'Password is too long')
    .regex(/[A-Za-z]/, 'Include at least one letter')
    .regex(/[0-9]/, 'Include at least one number'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  termsAccepted: z.boolean().refine((v) => v === true, { message: 'You must accept the Terms of Service' }),
  ageCheck: z.boolean().refine((v) => v === true, { message: 'You must be at least 13 years old' }),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

Note: z.boolean().refine with message — in zod v3, .refine(check, message | params). Passing { message: ... } works.

Strength function.

Component with all state.

Let me write the JSX.

Note on Input component: it accepts label?, error?, helperText?, and standard input props. I'll use label and error. Actually since Input renders its own label and error per the truncated deps, I'll use those. But I can't see implementation... truncated at helperText?: strin. It likely renders label and error. I'll pass label and error and trust it. Hmm, but if Input doesn't render label... risk of missing labels. To be safe and accessible, I'll render labels myself and pass only className, id, etc. Actually rendering my own label is safest and gives full control. But then label prop unused, fine.

Wait — if Input already renders a label when given label, and I also render one, I'd get duplicates. Since I won't pass label, no duplicate. Good. I'll render my own <label>.

Actually — but what if Input renders a wrapper with error below when error prop passed? I won't pass error either; I'll render my own error text. Fully safe. Good.

So I use Input purely as a styled input.

Let me write it.

For animations with framer-motion, define variants.

Reduced motion: use prefersReducedMotion to skip y offsets.

Let me write the complete code now.

I'll be mindful of motion typing with variants — use Variants type maybe. Keep simple.

Now the email check: /api/auth/check-email?email=. Handle gracefully.

Submit: POST /api/auth/signup with idempotency key.

Let me write.

Also handle isSubmitting from RHF.

Success screen: AnimatePresence swap.

Let me write the full file text.

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
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Gift,
  Github,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const signUpSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name must be 50 characters or fewer'),
    email: z
      .string()
      .trim()
      .email('Enter a valid email address')
      .max(254, 'Email is too long'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password must be 72 characters or fewer')
      .regex(/[A-Za-z]/, 'Include at least one letter')
      .regex(/[0-9]/, 'Include at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    termsAccepted: z
      .boolean()
      .refine((v) => v === true, 'You must accept the Terms of Service'),
    ageCheck: z
      .boolean()
      .refine((v) => v === true, 'You must be at least 13 years old to use HEY'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SignUpForm = z.infer<typeof signUpSchema>;
type OAuthProvider = 'google' | 'github';
type EmailStatus = 'idle' | 'checking' | 'available' | 'taken';
type StrengthLevel = 0 | 1 | 2 | 3 | 4;

const STRENGTH_META: Record<StrengthLevel, { label: string; bar: string; text: string }> = {
  0: { label: 'Too short', bar: 'bg-destructive', text: 'text-destructive' },
  1: { label: 'Weak', bar: 'bg-destructive', text: 'text-destructive' },
  2: { label: 'Fair', bar: 'bg-amber-500', text: 'text-amber-500' },
  3: { label: 'Strong', bar: 'bg-lime-500', text: 'text-lime-500' },
  4: { label: 'Excellent', bar: 'bg-emerald-500', text: 'text-emerald-500' },
};

function getPasswordStrength(password: string): {
  level: StrengthLevel;
  label: string;
  bar: string;
  text: string;
  hints: string[];
} {
  if (!password) {
    return {
      level: 0,
      label: 'Enter a password',
      bar: 'bg-muted',
      text: 'text-muted-foreground',
      hints: [],
    };
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const level = Math.min(4, score) as StrengthLevel;
  const meta = STRENGTH_META[level];

  const hints: string[] = [];
  if (password.length < 12) hints.push('12+ characters');
  if (!/[A-Z]/.test(password)) hints.push('an uppercase letter');
  if (!/[0-9]/.test(password)) hints.push('a number');
  if (!/[^A-Za-z0-9]/.test(password)) hints.push('a symbol');

  return { level, label: meta.label, bar: meta.bar, text: meta.text, hints };
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.27-4.74 3.27-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11
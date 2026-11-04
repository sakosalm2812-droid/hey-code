The user wants me to output an upgraded version of the reset-password page. The format requirement says I MUST wrap JSON tool call arrays in a  code block. So I need to output a JSON array with write_file tool.

Wait, but the last instruction says "Output ONLY the raw code. No markdown blocks." There's a conflict. The FORMAT REQUIREMENT says wrap JSON in code block. The final "CRITICAL INSTRUCTIONS" says output only raw code, no markdown blocks.

Hmm. Let me re-read. The system prompt at top says [FORMAT REQUIREMENT — READ CAREFULLY] You MUST wrap ALL JSON tool call arrays in a  code block. Then at the end, "CRITICAL INSTRUCTIONS: 1. Output the ENTIRE file. DO NOT truncate. 2. Preserve existing working logic... 3. Output ONLY the raw code. No markdown blocks."

These conflict. The format requirement is the automation harness parsing. I think the safest is to follow the explicit format requirement: wrap the JSON tool call in . Because that's what the harness parses. The "raw code" instruction is probably part of the file content prompt, but the meta-format requires JSON code block.

Actually, let me reconsider. The instruction says "Output the ENTIRE file" — that suggests outputting code. But the format requirement says output JSON tool call array. The format requirement is labeled "READ CAREFULLY" and "critical". I'll go with the JSON tool call wrapped in  block, with write_file.

Let me construct the full TSX file content and JSON-encode it.

I need to write a complete, upgraded reset-password page. Let me write the full TSX carefully.

Let me now compose the entire file content:

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
  KeyRound,
  ArrowRight,
  MailCheck,
  XCircle,
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

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

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

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
} as const;

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <PageShell>
          <GlassCard>
            <CardContent className="flex flex-col items-center gap-4 py-16">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Preparing your secure reset form…</p>
            </CardContent>
          </GlassCard>
        </PageShell>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams?.get('token') ?? null;

  const [valid, setValid] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false
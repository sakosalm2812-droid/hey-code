[FORMAT REQUIREMENT — READ CAREFULLY]
You MUST wrap ALL JSON tool call arrays in a  code block. This is critical: the automation harness parses your response by looking for code blocks first. Raw JSON outside a code block will NOT be detected.
CORRECT format:

[{"tool": "write_file", "path": "/abs/path", "content": "file content here"}]

IMPORTANT: When the file content contains double-quote characters ("), you MUST escape them as \" inside the JSON string. For example, XML like: <tag attr="value"> must be written as: <tag attr=\"value\"> in the JSON content field.


You are the HEY UX Motion Auditor.
YOUR SKILL LIBRARY:

--- SKILL.md ---
---
name: design-motion-principles
description: "Motion and interaction design expert based on Emil Kowalski, Jakub Krehel, and Jhey Tompkins' techniques. Two modes — build interactive components with purposeful motion, or audit existing animations to catch AI-slop motion patterns (audit emits a branded HTML report with looping demos). Use when creating, adding, animating, or reviewing UI motion: transitions, hover states, micro-interactions, enter/exit animations, or any motion design work in React, Framer Motion, CSS, or HTML. Provides per-designer perspectives with context-aware weighting."
---

# Design Motion Principles

You are a senior design engineer specializing in motion and interaction design. This skill operates in two modes:

- **Create** — Build interactive components with purposeful motion → `workflows/create.md`
- **Audit** — Review existing motion design and report findings → `workflows/audit.md`

**Scope**: Web and app UI motion — HTML/CSS, React, Framer Motion / Motion, iOS/Android transitions, design system animations. The frequency framework still applies to other motion work (game engines, Lottie, Rive, video), but designer-specific techniques may not translate.

---

## STEP 0: Detect Mode (DO THIS FIRST)

| Signal in the request | Mode |
|-----------------------|------|
| "build", "create", "add animation", "animate this", "implement", "make it feel…" | **Create** |
| "audit", "review", "evaluate", "check", "feedback on", "is this motion good" | **Audit** |
| Ambiguous (e.g. "look at this modal animation") | Ask the user |

For ambiguous requests, if `AskUserQuestion` is available, present:
- **Create** — Build or improve the component's motion
- **Audit** — Review existing motion and report findings

Otherwise ask in plain text: "Should I build/improve the motion (Create mode), or review existing motion and report findings (Audit mode)?"

**Once the mode is known, read the matching workflow file and follow it exactly.**

---

## The Three Designers

- **Emil Kowalski** (Linear, ex-Vercel) — Restraint, speed, purposeful motion. Best for productivity tools.
- **Jakub Krehel** (jakub.kr) — Subtle production polish, professional refinement. Best for shipped consumer apps.
- **Jhey Tompkins** (@jh3yy) — Playful experimentation, CSS innovation. Best for creative sites, kids apps, portfolios.

> These three lenses distill each designer's *publicly published* work — courses, articles, talks, and open-source projects. The weighting framework and the "lens" framing are this skill's interpretation of their principles, named in tribute; they are not authored or endorsed by the designers themselves.

Each designer answers a different question:
- **Emil** — *"Should this animate at all?"*
- **Jakub** — *"Is this subtle and polished enough for production?"*
- **Jhey** — *"What could this become?"*

**Critical insight**: These perspectives are context-dependent, not universal rules. A kids' app should prioritize Jakub + Jhey (polish + delight), not Emil's productivity-focused speed rules. Both modes weight the designers by project context before doing anything.

---

## Context-to-Perspective Mapping

| Project Type | Primary | Secondary | Selective |
|--------------|---------|-----------|-----------|
| Productivity tool (Linear, Raycast) | Emil | Jakub | Jhey (onboarding only) |
| Kids app / Educational | Jakub | Jhey | Emil (high-freq game interactions) |
| Creative portfolio | Jakub | Jhey | Emil (high-freq interactions) |
| Marketing/landing page | Jakub | Jhey | Emil (forms, nav) |
| SaaS dashboard | Emil | Jakub | Jhey (empty states) |
| Mobile app | Jakub | Emil | Jhey (delighters) |
| E-commerce | Jakub | Emil | Jhey (product showcase) |

---

## Core Principles (Both Modes)

### The Frequency Gate

Before adding or approving any animation, ask how often the user triggers it:

| Frequency | Recommendation |
|-----------|-
PREVIOUSLY SUCCESSFUL PATTERN:

You are the HEY UX Motion Auditor.
YOUR SKILL LIBRARY:

--- SKILL.md ---
---
name: design-motion-principles
description: "Motion and interaction design expert based on Emil Kowalski, Jakub Krehel, and Jhey Tompkins' techniques. Two modes — build interactive components with purposeful motion, or audit existing animations to catch AI-slop motion patterns (audit emits a branded HTML report with looping demos). Use when creating, adding, animating, or reviewing UI motion: transitions, hover state

FILE TO UPGRADE: src\app\(dashboard)\dashboard\research\page.tsx
CURRENT CODE:
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Newspaper, Search, ExternalLink, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResearchSource {
  title: string;
  url: string;
  snippet: string;
  trustScore: number;
  trusted: boolean;
}

interface ResearchResult {
  query: string;
  sources: ResearchSource[];
  summary: string;
  citations: string[];
  extractive: boolean;
  needsSetup: boolean;
}

export default function ResearchPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResearchResult | null>(null);

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      });
      if (!res.ok) {
        let message = `Request failed with status ${res.status}`;
        try {
          const data = await res.json();
          message = data.error || message;
        } catch {}
        throw new Error(message);
      }
      const data = await res.json();
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Research failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="h-5 w-5" />
            Web Research
          </CardTitle>
          <CardDescription>
            Collect sources from the web, summarize them with citations, and flag untrusted content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={run} className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Next.js App Router caching behavior 2026"
              aria-label="Research query"
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !query.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Research
            </Button>
          </form>
          {error && <p className="mt-3 text-sm text-destructive" role="alert">{error}</p>}
        </CardContent>
      </Card>

      {result?.needsSetup && (
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <p className="text-sm text-muted-foreground">{result.summary}</p>
          </CardContent>
        </Card>
      )}

      {result && !result.needsSetup && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{result.query}</CardTitle>
              {result.extractive && (
                <CardDescription className="flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Extractive fallback — live summarizer provider not configured.
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{result.summary}</div>
              {result.citations.length > 0 && (
                <div className="mt-4 border-t pt-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Sources</p>
                  <ol className="space-y-1.5">
                    {result.citations.map((url, i) => (
                      <li key={url} className="text-sm flex items-start gap-2">
                        <span className="text-muted-foreground min-w-4">{i + 1}.</span>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 break-all">
                          {url}
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </CardContent>
          </Card>

          {result.sources.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Source confidence</CardTitle>
                <CardDescription>
                  Trust sco
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.
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

FILE TO UPGRADE: src\app\about\page.tsx
CURRENT CODE:
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';
import {
  ArrowRight,
  Bot,
  Brain,
  Check,
  Code,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  Mic,
  Search,
  Shield,
  Sparkles,
  Terminal,
  Users,
  Zap,
} from 'lucide-react';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hey.ai';

export const metadata: Metadata = {
  title: 'About HEY',
  description:
    'HEY is your AI assistant like Jarvis — one calm, focused conversation surface for frontier AI models, your memories, your files, your voice, and your team. Learn who we are and how we think about privacy.',
  alternates: { canonical: `${baseUrl}/about` },
  openGraph: {
    title: 'About HEY — Your AI Assistant Like Jarvis',
    description:
      'HEY brings GPT-4o, Claude 3, and more into one honest, private conversation surface. The story, the product, and how we think about privacy.',
    url: `${baseUrl}/about`,
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About HEY — Your AI Assistant Like Jarvis',
    description:
      'HEY brings GPT-4o, Claude 3, and more into one honest, private conversation surface.',
    images: ['/og-image.png'],
  },
};

const capabilities = [
  {
    icon: MessageSquare,
    title: 'Talk to the best models',
    body: 'Chat with GPT-4o, Claude 3 Opus, Sonnet, and Haiku — and more as they arrive. You choose the model, or let HEY route and fail over automatically so the conversation keeps flowing.',
  },
  {
    icon: Brain,
    title: 'A memory that respects you',
    body: 'HEY can remember the facts, preferences, projects, and relationships you choose to save, then bring them up when they matter. Every memory is yours to review and delete in the Memories board.',
  },
  {
    icon: FileText,
    title: 'Bring your information',
    body: 'Upload documents and images into projects, and HEY indexes their content so your files become searchable and referenceable right inside a conversation.',
  },
  {
    icon: Mic,
    title: "Talk, don't type",
    body: 'Dictate naturally with voice input — your recording is transcribed into a message — and HEY can speak replies aloud using your device\u2019s speech engine.',
  },
  {
    icon: Bot,
    title: 'Agents that get things done',
    body: 'Configure custom agents with their own instructions, tools, and permissions to research, summarize, and execute. The built-in terminal adds hands-free controls with on-device hand gestures.',
  },
  {
    icon: Users,
    title: 'Work together',
    body: 'Share team conversations with roles and invitations, and power everyone in the workspace with the same model set, shared projects, and one source of truth.',
  },
  {
    icon: ImageIcon,
    title: 'Create and extend',
    body: 'Generate images, briefings, planners, journals, and goal tracking from a single surface — then extend HEY further with the developer API and API keys.',
  },
  {
    icon: Search,
    title: 'Research, with receipts',
    body: 'Run live web research and get a sourced, cited summary with trust-scored links — not a wall of anonymous text.',
  },
];

const pillars = [
  {
    icon: Shield,
    title: 'Calm by design',
    body: 'One surface instead of ten tabs. Restrained, focused, premium — an assistant that gets out of your way.',
  },
  {
    icon: Sparkles,
    title: 'Privacy by default',
    body: 'No advertising business, no data sold, marketing off until you opt in, and on-device processing where it counts.',
  },
  {
    icon: Zap,
    title: 'Choice across models',
    body: 'We never lock you to one vendor. HEY is the surface; you keep the freedom to pick the model that fits the moment.',
  },
];

const privacyCommitments = [
  'We do not sell your personal information, and HEY runs no ad networks.',
  'Your content is not used to train our models.',
  'Hand-gesture detection and voice playback run on your device.',
  'Marketing email and data-sharing are off until you turn them on.',
  'You can review and delete saved memories at any time.',
  'You can request a copy of your data, or its deletion, at any time.',
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main" className="pt-32 lg:pt-40">
        <section className="relative overflow-hidden" aria-labelledby="about-heading">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-from)_0%,_transparent_65%)] from-primary/10 to-transparent" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center 
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.
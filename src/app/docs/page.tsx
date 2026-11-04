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

FILE TO UPGRADE: src\app\docs\page.tsx
CURRENT CODE:
'use client';

import { useEffect, useRef } from 'react';
import { openApiSpec } from '@/lib/openapi/spec';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ExternalLink,
  Copy,
  Download,
  Code,
  Globe,
  Key,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

const ERROR_EXAMPLE = `{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": { "retryAfter": 45 }
}`;

const CHAT_EXAMPLE = `const response = await fetch('https://hey.ai/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer hey_live_abc123...'
  },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'Write a React component for a todo list' }
    ],
    model: 'GPT_4O',
    systemPrompt: 'You are a helpful coding assistant.'
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\\n').filter(l => l.startsWith('data: '));

  for (const line of lines) {
    const data = JSON.parse(line.slice(6));
    if (data.chunk) process.stdout.write(data.chunk);
    if (data.done) console.log('\\nDone! Tokens:', data.tokens);
  }
}`;

const IMAGE_EXAMPLE = `const response = await fetch('https://hey.ai/api/images/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer hey_live_abc123...'
  },
  body: JSON.stringify({
    prompt: 'A futuristic cityscape at sunset, cyberpunk style, highly detailed',
    size: '1024x1024',
    quality: 'hd',
    style: 'vivid'
  })
});

const { url, revised_prompt } = await response.json();
console.log('Image URL:', url);
console.log('Revised prompt:', revised_prompt);`;

const VOICE_EXAMPLE = `const formData = new FormData();
formData.append('audio', audioBlob, 'recording.webm');

const response = await fetch('https://hey.ai/api/voice', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer hey_live_abc123...'
  },
  body: formData
});

const { text } = await response.json();
console.log('Transcription:', text);`;

const UPLOAD_EXAMPLE = `const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('https://hey.ai/api/upload', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer hey_live_abc123...'
  },
  body: formData
});

const { url, fileName, fileSize } = await response.json();
console.log('File uploaded:', url);`;

const TEAM_EXAMPLE = `// Create team
await fetch('https://hey.ai/api/team', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer hey_live_...' },
  body: JSON.stringify({ name: 'Acme Inc', slug: 'acme-inc', description: 'Our team' })
});

// Invite member
await fetch('https://hey.ai/api/team/invitations?teamId=team_123', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer hey_live_...' },
  body: JSON.stringify({ email: 'colleague@company.com', role: 'ADMIN' })
});`;

export default function DocsPage() {
  const swaggerRef = useRef<HTMLDivElement>(null);
  const specRef = useRef(openApiSpec);

  useEffect(() => {
    if (swaggerRef.current && !swaggerRef.current.hasChildNodes()) {
      import('swagger-ui-dist').then(() => {});
    }
  }, []);

  useEffect(() => {
    const loadSwaggerUI = async () => {
      const container = swaggerRef.current;
      if (!container) return;

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/swagger-ui-dist@5.10.0/swagger-ui-bundle.js';
      script.onload = () => {
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'https://unpkg.com/swagger-ui-dist@5.10.0/swagger-ui.css';
        document.head.appendChild(css);

        // @ts-ignore
        window.SwaggerUIBundle({
          spec: specRef.current,
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [
            // @ts-ignore
            window.SwaggerUIBundle.presets.apis,
            // @ts-ignore
            window.SwaggerUIStandalonePreset
          ],
          plugins: [
            // @ts-ignore
            window.SwaggerUIBundle.plugins.DownloadUrl
          ],
          layout: 'StandaloneLayout',
          displayRequestDuration: true,
          filter: true,
          showExtensions: true,
          showCommonExtensions: true,
          tryItOutEnabled: true,
        });
      };
      document.body.appendChild(script);
    };

    loadSwaggerUI();
  }, []);

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <Link href="/" 
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.
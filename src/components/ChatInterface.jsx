[FORMAT REQUIREMENT — READ CAREFULLY]
You MUST wrap ALL JSON tool call arrays in a  code block. This is critical: the automation harness parses your response by looking for code blocks first. Raw JSON outside a code block will NOT be detected.
CORRECT format:

[{"tool": "write_file", "path": "/abs/path", "content": "file content here"}]

IMPORTANT: When the file content contains double-quote characters ("), you MUST escape them as \" inside the JSON string. For example, XML like: <tag attr="value"> must be written as: <tag attr=\"value\"> in the JSON content field.


You are the HEY Motion Specialist.
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

You are the HEY Motion Specialist.
YOUR SKILL LIBRARY:

--- SKILL.md ---
---
name: design-motion-principles
description: "Motion and interaction design expert based on Emil Kowalski, Jakub Krehel, and Jhey Tompkins' techniques. Two modes — build interactive components with purposeful motion, or audit existing animations to catch AI-slop motion patterns (audit emits a branded HTML report with looping demos). Use when creating, adding, animating, or reviewing UI motion: transitions, hover state

FILE TO UPGRADE: src\components\ChatInterface.jsx
CURRENT CODE:
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Sparkles,
  Users,
  Bot,
  User,
  Copy,
  Check,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Flame,
  Award,
} from "lucide-react";
import { keyRotator } from "../core/keyRotator.js";
import { debate } from "../core/mentorCouncil.js";

export default function ChatInterface({ subject = "chem", themeColor = "#00F0FF", onTriggerTool }) {
  const [mode, setMode] = useState("standard"); // "standard" | "council"
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      mode: "standard",
      content: `Welcome to your **${subject.toUpperCase()} Teaching Command Center**. Ask anything about lesson architecture, student misconceptions, lab demos, or click any tool on the left to mount it.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const executeStandardAI = async (userPrompt) => {
    const keys = keyRotator.getKeys();
    const currentKey = keyRotator.getCurrentKey();
    const isDemo = !currentKey || currentKey.includes("Demo") || currentKey.includes("Example");

    if (keys.length === 0 || isDemo) {
      // High-quality local subject-aware response
      await new Promise((resolve) => setTimeout(resolve, 600));
      return `### Lesson Strategy & Execution Plan (${subject.toUpperCase()})\n\n**Addressing:** "${userPrompt}"\n\n1. **Core Concept Hook:** Frame this around a tangible phenomenon or real-world application to anchor student curiosity.\n2. **Cognitive Scaffolding:** Break down multi-step logic into discrete, testable units before introducing abstract formulas.\n3. **Active Diagnostic:** Test student intuition with an immediate quick-check question before formal notation.\n4. **Extension Activity:** Use the interactive tools in your sidebar to provide immediate tactile practice.`;
    }

    const provider = keyRotator.detectProvider(currentKey);
    let url = "https://openrouter.ai/api/v1/chat/completions";
    let fetchOptions = {};

    const systemPrompt = `You are an elite master teacher and curriculum strategist for ${subject.toUpperCase()}. Provide concise, structured, high-impact teaching insights, lesson outlines, and conceptual explanations.`;

    if (provider === "google") {
      url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
      fetchOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: `${systemPrompt}\n\nTeacher Question: ${userPrompt}` }],
            },
          ],
        }),
      };
    } else {
      url = "https://openrouter.ai/api/v1/chat/completions";
      fetchOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "HTTP-Referer": "https://hey.internal",
          "X-Title": "HEY Teacher Engine",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      };
    }

    const response = await keyRotator.fetchWithRotation(url, fetchOptions);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    if (provider === "google") {
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response received";
    }
    return data.choices?.[0]?.message?.content || "No response received";
  };

  const handleSend = async (textToSend) => {
    const prompt = (textToSend || input).trim();
    if (!prompt || isLoading) return;

    const userMessage = {
      id: `usr_${Date.now()}`,
      role: "user",
      content: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      if (mode === "council") {
        // Mentor Council Debate Mode
        const debateResult = await debate(prompt, { subject });
        const councilMessage = {
          id: `cnl_${Date.now()}`,
          role: "assistant",
          mode: "council",
          debate: debateResult,
          timestamp: new Date().toLocaleTimeString
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.
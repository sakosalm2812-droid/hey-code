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

FILE TO UPGRADE: src\components\Tools\EnglishTools.jsx
CURRENT CODE:
import React, { useState } from "react";
import {
  BookOpen,
  FileText,
  Feather,
  MessageSquare,
  Sparkles,
  Award,
  CheckCircle,
  Copy,
} from "lucide-react";

const NOVEL_PROMPTS = [
  {
    book: "The Great Gatsby (F. Scott Fitzgerald)",
    theme: "The Illusion of the American Dream & Green Light",
    questions: [
      "In what ways does the valley of ashes function as an indictment of industrial capitalism's moral wasteland?",
      "Analyze how Nick Carraway's claim of being 'one of the few honest people' is subverted by his romantic complicity.",
      "How does the recurring motif of time (the defunct mantelpiece clock) demonstrate Gatsby's inability to reconcile memory with reality?",
    ],
  },
  {
    book: "1984 (George Orwell)",
    theme: "Linguistic Determinism & Newspeak",
    questions: [
      "How does the erosion of vocabulary in Newspeak diminish the physiological capability of the human mind to formulate dissident thoughts?",
      "Analyze the psychological mechanism of Doublethink as the ultimate surrender of cognitive sovereignty.",
      "Is Winston's final statement 'He loved Big Brother' a tragic defeat or an inevitable consequence of totalitarian psychological engineering?",
    ],
  },
  {
    book: "Hamlet (William Shakespeare)",
    theme: "Existential Epistemology & Paralyzing Consciousness",
    questions: [
      "How does Hamlet's obsession with theatrical performance ('the play's the thing') mirror his epistemological crisis regarding empirical truth?",
      "Examine Ophelia's botanical mad scene as a form of coded subversive protest against Elsinore's patriarchal surveillance.",
      "In the 'To be or not to be' soliloquy, how does the fear of the post-mortem realm subjugate human agency to conscience?",
    ],
  },
];

export default function EnglishTools({ activeToolName = "Essay Grader & Rubric" }) {
  const [activeTab, setActiveTab] = useState(() => {
    if (activeToolName.includes("Grammar") || activeToolName.includes("Syntax")) return "grammar";
    if (activeToolName.includes("Poetry") || activeToolName.includes("Meter")) return "poetry";
    if (activeToolName.includes("Literature") || activeToolName.includes("Discussion")) return "literature";
    return "essay";
  });

  // Essay Grader State
  const [essayDraft, setEssayDraft] = useState(
    "Fitzgerald employs the green light at the end of Daisy's dock as an unattainable talisman of Gatsby's past. Through evocative sensory imagery and temporal disorientation, the novel demonstrates that the pursuit of idealized nostalgia ultimately corrupts the present and precipitates inexorable disillusionment."
  );
  const [rubricResult, setRubricResult] = useState(null);

  // Grammar & Syntax State
  const [syntaxText, setSyntaxText] = useState(
    "The experiment was conducted by the students in the laboratory. They observed the reaction. It was very interesting."
  );
  const [syntaxAnalysis, setSyntaxAnalysis] = useState(null);

  // Poetry Scanner State
  const [poemLine, setPoemLine] = useState("Shall I compare thee to a summer's day?");
  const [meterScan, setMeterScan] = useState({
    meter: "Iambic Pentameter",
    feet: "5 Metric Feet (da-DUM da-DUM da-DUM da-DUM da-DUM)",
    syllables: 10,
    stressPattern: "˘ ¯ | ˘ ¯ | ˘ ¯ | ˘ ¯ | ˘ ¯",
  });

  // Literature Prompts State
  const [selectedBook, setSelectedBook] = useState(NOVEL_PROMPTS[0]);

  const handleGradeEssay = () => {
    setRubricResult({
      thesisScore: "1 / 1 (Present & Defensible)",
      evidenceScore: "3 / 4 (Specific textual references with integrated commentary)",
      sophisticationScore: "1 / 1 (Nuanced rhetorical awareness & complex syntax)",
      totalScore: "5 / 6 (AP Advanced Placement Equivalent)",
      strengths: "Eloquent synthesis of motif and thematic consequence; clean, assertive thesis statement.",
      growth: "Expand on the socio-economic dimension of Gatsby's failure to further deepen commentary.",
    });
  };

  const handleAnalyzeSyntax = () => {
    const words = syntaxText.split(/\s+/).filter(Boolean);
    const sentences = syntaxText.split(/[.!?]+/).filter(Boolean);
    const avgLen = (words.length / (sentences.length || 1)).toFixed(1);

    setSyntaxAnalysis({
      wordCount: words.length,
      sentenceCount: sentences.length,
      avgSentenceLength: `${avgLen} words / sentence`,
      readabilityGrade: "Grade 9.4 (Flesch-Kincaid)",
      passiveVoiceFound: syntaxText.includes("was conducted") ? "Passive voice detected: 'was conducted by'" : "No dominant passive voice",
      varietyAdvice: avgLen < 12 ? "Sentence variety is low; consider combining short clauses using subordinating conjunctions." : "Good syntactic complexity.",
    });
  };

  const handleScanPoem = (line) => {
    const text = line.toLowerCase();
    if (text.includes("summer") || text.includes("compare")) {
      setMeterScan({
        meter: "Iambic Pentameter",
        feet: "5 Metric Feet (da-DUM da-DUM da-DUM da-DUM 
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.
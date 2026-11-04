[FORMAT REQUIREMENT — READ CAREFULLY]
You MUST wrap ALL JSON tool call arrays in a  code block. This is critical: the automation harness parses your response by looking for code blocks first. Raw JSON outside a code block will NOT be detected.
CORRECT format:

[{"tool": "write_file", "path": "/abs/path", "content": "file content here"}]

IMPORTANT: When the file content contains double-quote characters ("), you MUST escape them as \" inside the JSON string. For example, XML like: <tag attr="value"> must be written as: <tag attr=\"value\"> in the JSON content field.


You are the HEY Methodology Specialist.
YOUR SKILL LIBRARY:

--- SKILL.md ---
---
name: brainstorming
description: "You MUST use this before any creative work - creating features, building components, adding functionality, modifying behavior, or planning anything new, in software or out of it (a talk, a business, a renovation)."
---

# Brainstorming

You are very good at building. You build what you believe your human
partner wants, and that belief is usually thinner than it feels. This
skill is for finding out what they actually want, and why, before
anything gets built.

People often haven't finished working out what they want. Good questions
help them think it through. When you understand the why, you make the
hundred decisions they never mention the way they would have made them.

## First: What Do You Actually Know?

Before you reply, ask yourself: what do I know about what they want, and
why?

- **Everything that matters is in the request** ("make the icon cornflower
  blue"). This is a quick, clear task. Do it, and say what you did.
- **Something non-trivial is missing.** Start the conversation.

Before you start implementing, you must, in order:

1. Lay out the approaches in a message of their own, and have your
   human partner pick one (see Lay out the approaches).
2. Write the design doc, short or full (see Size the Work).
3. Get their approval of that doc.
4. Invoke the superpowers:writing-plans skill.

If nothing is open when you write your first message and there's one
sensible way, steps 1 to 3 happen in that message (see Your First
Message).

Two things aren't implementing: a spike they said yes to (see Spike to
feel things out), and doing what they asked once they've opted out of
the questions.

## Look Before You Ask

In an existing project, or when they've given you context (a spec, a plan,
a handoff, files they pointed at, earlier conversation), dig in before your
first message. Read what they referred to and the code or material it
connects to, and keep reading until you can explain how the relevant
parts work today and what this change would touch. Never ask what the
project or their context already answers, or reopen what they've
already decided.

## Your First Message

Move the work forward, with one of these:

- **They've already said what they want** (a spec, a plan, a detailed
  request): aim for about 200 words for the whole message. Echo their
  request back in your own words, so they can see whether you've got its
  shape: what they want, who it's for, and why, as far as they've said.
  Add what you found that bears on it: how the relevant parts work today
  and what the change would touch. If you found something they may not
  have considered that would change what they're asking for or how it
  has to be built, like a constraint, a conflict, or a cheaper path, say
  so plainly. How to build it comes later, once you understand what they
  want (see Lay out the approaches). End with one line inviting
  corrections. Then, if they haven't told you why they want it, even if
  you can guess, ask about that: one open question in their own terms,
  with nothing to pick from. If they have told you, and their request
  and the project leave open something whose answer would change what
  gets built, ask about the one that would change it most; when its
  choices can be named, sketch each concretely, with what it trades off
  and which you'd pick. If nothing like that is open, there's one
  sensible way: end with the short design itself (the approach, a line on
  why the others don't fit, and the design in a few lines) and ask them
  to approve it. Their approval covers the approach and the design: write
  the short design doc as approved and go on to the plan.
  Specs are often incomplete, so confirm before you build on one.
- **They haven't:** one open question, in their own terms, about the
  biggest thing their request leaves unsettled. Say why you're asking:
  what the answer would change about what you build. For "a website for
  my bakery": "If it's mostly f
PREVIOUSLY SUCCESSFUL PATTERN:

You are the HEY Methodology Specialist.
YOUR SKILL LIBRARY:

--- SKILL.md ---
---
name: brainstorming
description: "You MUST use this before any creative work - creating features, building components, adding functionality, modifying behavior, or planning anything new, in software or out of it (a talk, a business, a renovation)."
---

# Brainstorming

You are very good at building. You build what you believe your human
partner wants, and that belief is usually thinner than it feels. This
skill i

FILE TO UPGRADE: src\components\background\backgroundConfig.test.js
CURRENT CODE:
import { test, describe } from 'node:test';
import { strictEqual, deepStrictEqual, ok } from 'node:assert';
import {
  DEFAULT_BACKGROUND,
  clampConfig,
  validateConfig,
  mergeConfig,
  migrateConfig,
  effectiveLuminance,
} from './backgroundConfig.js';

describe('backgroundConfig', () => {
  describe('DEFAULT_BACKGROUND', () => {
    test('has correct default values', () => {
      strictEqual(DEFAULT_BACKGROUND.source, 'procedural');
      strictEqual(DEFAULT_BACKGROUND.blur, 48);
      strictEqual(DEFAULT_BACKGROUND.brightness, 33);
      strictEqual(DEFAULT_BACKGROUND.saturate, 70);
      strictEqual(DEFAULT_BACKGROUND.scrim, 45);
      strictEqual(DEFAULT_BACKGROUND.parallax, false);
      strictEqual(DEFAULT_BACKGROUND.parallaxDepth, 0.25);
      strictEqual(DEFAULT_BACKGROUND.motion, 'auto');
      strictEqual(DEFAULT_BACKGROUND.rotateEvery, null);
      deepStrictEqual(DEFAULT_BACKGROUND.perRoute, {});
    });
  });

  describe('clampConfig', () => {
    test('returns defaults for null/undefined input', () => {
      const result = clampConfig(null);
      deepStrictEqual(result, DEFAULT_BACKGROUND);

      const result2 = clampConfig(undefined);
      deepStrictEqual(result2, DEFAULT_BACKGROUND);
    });

    test('clamps blur to 0-120', () => {
      strictEqual(clampConfig({ blur: -10 }).blur, 0);
      strictEqual(clampConfig({ blur: 9999 }).blur, 120);
      strictEqual(clampConfig({ blur: 60 }).blur, 60);
    });

    test('clamps brightness to 0-100', () => {
      strictEqual(clampConfig({ brightness: -50 }).brightness, 0);
      strictEqual(clampConfig({ brightness: 150 }).brightness, 100);
      strictEqual(clampConfig({ brightness: 33 }).brightness, 33);
    });

    test('clamps saturate to 0-200', () => {
      strictEqual(clampConfig({ saturate: -10 }).saturate, 0);
      strictEqual(clampConfig({ saturate: 500 }).saturate, 200);
      strictEqual(clampConfig({ saturate: 70 }).saturate, 70);
    });

    test('clamps scrim to 0-100', () => {
      strictEqual(clampConfig({ scrim: -5 }).scrim, 0);
      strictEqual(clampConfig({ scrim: 200 }).scrim, 100);
      strictEqual(clampConfig({ scrim: 45 }).scrim, 45);
    });

    test('clamps parallaxDepth to 0-1', () => {
      strictEqual(clampConfig({ parallaxDepth: -1 }).parallaxDepth, 0);
      strictEqual(clampConfig({ parallaxDepth: 5 }).parallaxDepth, 1);
      strictEqual(clampConfig({ parallaxDepth: 0.5 }).parallaxDepth, 0.5);
    });

    test('validates source enum', () => {
      strictEqual(clampConfig({ source: 'invalid' }).source, 'procedural');
      strictEqual(clampConfig({ source: 'bundled' }).source, 'bundled');
      strictEqual(clampConfig({ source: 'user-image' }).source, 'user-image');
      strictEqual(clampConfig({ source: 'generated' }).source, 'generated');
    });

    test('validates motion enum', () => {
      strictEqual(clampConfig({ motion: 'invalid' }).motion, 'auto');
      strictEqual(clampConfig({ motion: 'off' }).motion, 'off');
      strictEqual(clampConfig({ motion: 'on' }).motion, 'on');
    });

    test('handles rotateEvery', () => {
      strictEqual(clampConfig({ rotateEvery: 10 }).rotateEvery, null);
      strictEqual(clampConfig({ rotateEvery: 15 }).rotateEvery, 15);
      strictEqual(clampConfig({ rotateEvery: 60 }).rotateEvery, 60);
      strictEqual(clampConfig({ rotateEvery: null }).rotateEvery, null);
    });

    test('ensures perRoute is object', () => {
      deepStrictEqual(clampConfig({ perRoute: null }).perRoute, {});
      deepStrictEqual(clampConfig({ perRoute: 'invalid' }).perRoute, {});
      deepStrictEqual(clampConfig({ perRoute: { '/dashboard': 'scene1' } }).perRoute, { '/dashboard': 'scene1' });
    });

    test('preserves unknown keys', () => {
      const result = clampConfig({ unknownKey: 'value', blur: 50 });
      strictEqual(result.unknownKey, 'value');
      strictEqual(result.blur, 50);
    });
  });

  describe('validateConfig', () => {
    test('returns ok for valid config', () => {
      const result = validateConfig(DEFAULT_BACKGROUND);
      strictEqual(result.ok, true);
      deepStrictEqual(result.errors, []);
    });

    test('rejects invalid source', () => {
      const result = validateConfig({ source: 'invalid' });
      strictEqual(result.ok, false);
      ok(result.errors.some(e => e.includes('source')));
    });

    test('rejects invalid motion', () => {
      const result = validateConfig({ motion: 'invalid' });
      strictEqual(result.ok, false);
      ok(result.errors.some(e => e.includes('motion')));
    });

    test('rejects out of range numeric values', () => {
      const result = validateConfig({ blur: 9999, brightness: -50, saturate: 500, scrim: 200, parallaxDepth: 5 });
      strictEqual(result.ok, false);
      ok(result.errors.length >= 5);
    });

    test('rejects invalid rotateEvery', () => {
      const result = validateConfig({ rotateEvery: 10 });
      strictEqual(result.ok, false);
      ok(result.errors.some(e => e.includes(
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.
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

FILE TO UPGRADE: src\components\ui\dropdown-menu.tsx
CURRENT CODE:
"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Check, ChevronRight, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

const DropdownMenu = DropdownMenuPrimitive.Root
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger
const DropdownMenuGroup = DropdownMenuPrimitive.Group
const DropdownMenuPortal = DropdownMenuPrimitive.Portal
const DropdownMenuSub = DropdownMenuPrimitive.Sub
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, chil
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.
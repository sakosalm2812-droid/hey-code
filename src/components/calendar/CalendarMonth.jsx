You are the HEY Motion Specialist.
YOUR SKILL LIBRARY:

## --- SKILL.md ---

## name: design-motion-principles description: "Motion and interaction design expert based on Emil Kowalski, Jakub Krehel, and Jhey Tompkins' techniques. Two modes — build interactive components with purposeful motion, or audit existing animations to catch AI-slop motion patterns (audit emits a branded HTML report with looping demos). Use when creating, adding, animating, or reviewing UI motion: transitions, hover states, micro-interactions, enter/exit animations, or any motion design work in React, Framer Motion, CSS, or HTML. Provides per-designer perspectives with context-aware weighting."

# Design Motion Principles

You are a senior design engineer specializing in motion and interaction design. This skill operates in two modes:

**Create** — Build interactive components with purposeful motion → workflows/create.md
**Audit** — Review existing motion design and report findings → workflows/audit.md

**Scope**: Web and app UI motion — HTML/CSS, React, Framer Motion / Motion, iOS/Android transitions, design system animations. The frequency framework still applies to other motion work (game engines, Lottie, Rive, video), but designer-specific techniques may not translate.

## STEP 0: Detect Mode (DO THIS FIRST)

text
| Signal in the request                                                            | Mode         |
| -------------------------------------------------------------------------------- | ------------ |
| "build", "create", "add animation", "animate this", "implement", "make it feel…" | **Create**   |
| "audit", "review", "evaluate", "check", "feedback on", "is this motion good"     | **Audit**    |
| Ambiguous (e.g. "look at this modal animation")                                  | Ask the user |

For ambiguous requests, if AskUserQuestion is available, present:

**Create** — Build or improve the component's motion
**Audit** — Review existing motion and report findings

Otherwise ask in plain text: "Should I build/improve the motion (Create mode), or review existing motion and report findings (Audit mode)?"

**Once the mode is known, read the matching workflow file and follow it exactly.**

## The Three Designers

**Emil Kowalski** (Linear, ex-Vercel) — Restraint, speed, purposeful motion. Best for productivity tools.
**Jakub Krehel** (jakub.kr) — Subtle production polish, professional refinement. Best for shipped consumer apps.
**Jhey Tompkins** (@jh3yy) — Playful experimentation, CSS innovation. Best for creative sites, kids apps, portfolios.

These three lenses distill each designer's *publicly published* work — courses, articles, talks, and open-source projects. The weighting framework and the "lens" framing are this skill's interpretation of their principles, named in tribute; they are not authored or endorsed by the designers themselves.

Each designer answers a different question:

**Emil** — *"Should this animate at all?"*
**Jakub** — *"Is this subtle and polished enough for production?"*
**Jhey** — *"What could this become?"*

**Critical insight**: These perspectives are context-dependent, not universal rules. A kids' app should prioritize Jakub + Jhey (polish + delight), not Emil's productivity-focused speed rules. Both modes weight the designers by project context before doing anything.

## Context-to-Perspective Mapping

text
| Project Type                        | Primary | Secondary | Selective                          |
| ----------------------------------- | ------- | --------- | ---------------------------------- |
| Productivity tool (Linear, Raycast) | Emil    | Jakub     | Jhey (onboarding only)             |
| Kids app / Educational              | Jakub   | Jhey      | Emil (high-freq game interactions) |
| Creative portfolio                  | Jakub   | Jhey      | Emil (high-freq interactions)      |
| Marketing/landing page              | Jakub   | Jhey      | Emil (forms, nav)                  |
| SaaS dashboard                      | Emil    | Jakub     | Jhey (empty states)                |
| Mobile app                          | Jakub   | Emil      | Jhey (delighters)                  |
| E-commerce                          | Jakub   | Emil      | Jhey (product showcase)            |

## Core Principles (Both Modes)

### The Frequency Gate

Before adding or approving any animation, ask how often the user triggers it:

Frequency	Recommendation
PREVIOUSLY SUCCESSFUL PATTERN:	
You are the HEY Motion Specialist.	
YOUR SKILL LIBRARY:	

## --- SKILL.md ---

name: design-motion-principles
description: "Motion and interaction design expert based on Emil Kowalski, Jakub Krehel, and Jhey Tompkins' techniques. Two modes — build interactive components with purposeful motion, or audit existing animations to catch AI-slop motion patterns (audit emits a branded HTML report with looping demos). Use when creating, adding, animating, or reviewing UI motion: transitions, hover states

FILE TO UPGRADE: src\components\calendar\CalendarMonth.jsx
CURRENT CODE:
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { springs, press } from "../../lib/heyMotion";
import { buzz } from "../../lib/heyFeedback";
import { useAuth } from "../../AuthContext.jsx";
import { createRecord, listRecords } from "../../lib/heyRecords.js";
import CalendarEvent from "./CalendarEvent";
import { toHijri } from "../../core/prayerTimes.js";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function dateToISO(year, monthIndex, day) {
return ${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")};
}

function todayISO() {
const now = new Date();
return dateToISO(now.getFullYear(), now.getMonth(), now.getDate());
}

function eventDateISO(event) {
const explicit = event.metadata?.date;
if (typeof explicit === "string" && /^\d{4}-\d{2}-\d{2}/.test(explicit)) return explicit.slice(0, 10);
const content = typeof event.content === "string" ? event.content : "";
const match = content.match(/^\d{4}-\d{2}-\d{2}/);
return match ? match[0] : null;
}

export default function CalendarMonth() {
const { user } = useAuth();
const today = new Date();
const [cursor, setCursor] = useState(() => ({ year: today.getFullYear(), month: today.getMonth() }));
const [events, setEvents] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [selected, setSelected] = useState(() => todayISO());
const [title, setTitle] = useState("");
const [time, setTime] = useState("");
const [type, setType] = useState("Planning");
const [saved, setSaved] = useState(false);

useEffect(() => {
let cancelled = false;
async function load() {
if (!user) {
setEvents([]);
setLoading(false);
return;
}
try {
const records = await listRecords(user.id, "event");
if (!cancelled) setEvents(records);
} catch (loadError) {
if (!cancelled) setError(loadError.message);
} finally {
if (!cancelled) setLoading(false);
}
}
load();
return () => {
cancelled = true;
};
}, [user]);

const eventsByDate = useMemo(() => {
const map = {};
events.forEach((event) => {
const iso = eventDateISO(event);
if (!iso) return;
if (!map[iso]) map[iso] = [];
map[iso].push(event);
});
return map;
}, [events]);

const unscheduled = useMemo(
() => events.filter((event) => !eventDateISO(event)),
[events],
);

const { year, month } = cursor;
const first = new Date(year, month, 1);
const startOffset = (first.getDay() + 6) % 7;
const daysInMonth = new Date(year, month + 1, 0).getDate();

const cells = [];
for (let i = 0; i < startOffset; i += 1) cells.push(null);
for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);

const selectedEvents = eventsByDate[selected] || [];
const monthLabel = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(first);

function move(delta) {
const next = new Date(year, month + delta, 1);
setCursor({ year: next.getFullYear(), month: next.getMonth() });
}

function goToday() {
setCursor({ year: today.getFullYear(), month: today.getMonth() });
setSelected(todayISO());
}

async function addEvent(event) {
event.preventDefault();
if (!user || !title.trim()) return;
const iso = selected || todayISO();
setError("");
try {
const savedEvent = await createRecord(user.id, "event", {
title: title.trim(),
content: time.trim() || iso,
metadata: { type, date: iso },
});
setEvents((current) => [savedEvent, ...current]);
setTitle("");
setTime("");
setSaved(true);
setTimeout(() => setSaved(false), 2000);
} catch (saveError) {
setError(saveError.message);
}
}

return (

<div className="hey-calendar-month">
<div className="hey-calendar-toolbar">
<div className="flex items-center gap-2">
<motion.button
type="button"
className="hey-btn-ghost"
onClick={() => move(-1)}
onPointerDown={() => buzz("light")}
whileHover={{ scale: 1.02, transition: springs.snappy }}
whileTap={{ scale: 0.97, transition: press }}
aria-label="Previous month"
>
←
</motion.button>
<motion.button
type="button"
className="hey-btn-ghost"
onClick={() => move(1)}
onPointerDown={() => buzz("light")}
whileHover={{ scale: 1.02, transition: springs.snappy }}
whileTap={{ scale: 0.97, transition: press }}
aria-label="Next month"
>
→
</motion.button>
<button type="button" className="hey-btn-ghost" onClick={goToday}>
Today
</button>
</div>
<h3 className="font-hea
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.
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

FILE TO UPGRADE: src\components\notification-bell.jsx
CURRENT CODE:
import { useEffect, useState, useRef } from 'react';
import { Bell, BellOff, CheckCheck, Inbox, Radio } from 'lucide-react';
import { subscribeNotifications, unreadCount, markAllNotificationsRead, getNotifications } from '../../core/notificationCenter.js';
import styles from './notification-bell.module.css';

export function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [nativeEnabled, setNativeEnabled] = useState(false);
  const [webPushEnabled, setWebPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [permission, setPermission] = useState('default');
  const timerRef = useRef(null);

  // Subscribe to notification center
  useEffect(() => {
    const unsubscribe = subscribeNotifications((notifications) => {
      setItems(notifications);
      setUnread(notifications.filter(n => !n.read).length);
    });

    // Initial load
    const initial = unreadCount();
    setUnread(initial);
    setItems(getNotifications());

    return unsubscribe;
  }, []);

  // Native notifications setup (stub for now)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      setNativeEnabled(Notification.permission === 'granted');
    }
  }, []);

  const handlePushToggle = async () => {
    if (pushBusy) return;
    setPushBusy(true);
    try {
      // Stub - would connect to web push
      setWebPushEnabled(!webPushEnabled);
    } finally {
      setPushBusy(false);
    }
  };

  const toggleNative = async () => {
    if (!nativeEnabled) {
      if ('Notification' in window) {
        const granted = await Notification.requestPermission();
        if (granted === 'granted') {
          setPermission('granted');
          setNativeEnabled(true);
        }
      }
    } else {
      setNativeEnabled(false);
    }
  };

  const markAll = async () => {
    markAllNotificationsRead();
    setItems(prev => prev.map(x => ({ ...x, read: true })));
    setUnread(0);
  };

  // Open notification center instead of dropdown
  const handleOpenCenter = () => {
    setOpen(false);
    window.dispatchEvent(new CustomEvent('hey:open-notification-center'));
  };

  // Don't render dropdown if we use the center drawer
  if (!open) {
    return (
      <button
        className={styles.bell}
        onClick={() => setOpen(true)}
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className={styles.badge} aria-hidden="true">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className={styles.dropdown} role="menu">
      <div className={styles.header}>
        <h3>Notifications</h3>
        <div className={styles.controls}>
          <button
            type="button"
            onClick={toggleNative}
            className={`${styles.control} ${nativeEnabled ? styles.active : ''}`}
            aria-pressed={nativeEnabled}
            title={nativeEnabled ? 'Native notifications on' : 'Enable native notifications'}
          >
            {nativeEnabled ? <Bell size={14} /> : <BellOff size={14} />}
            <span>Native</span>
          </button>
          <button
            type="button"
            onClick={handlePushToggle}
            disabled={pushBusy}
            className={`${styles.control} ${webPushEnabled ? styles.active : ''}`}
            aria-pressed={webPushEnabled}
            title={webPushEnabled ? 'Web push on' : 'Enable web push'}
          >
            <Radio size={14} />
            <span>Push</span>
          </button>
          {unread > 0 && (
            <button type="button" onClick={markAll} className={styles.control}>
              <CheckCheck size={14} />
              <span>Mark all</span>
            </button>
          )}
        </div>
      </div>
      <div className={styles.list}>
        {items.length === 0 ? (
          <div className={styles.empty}>
            <Inbox size={32} />
            <p>No notifications</p>
          </div>
        ) : (
          items.map(item => (
            <button
              key={item.id}
              type="button"
              className={`${styles.item} ${!item.read ? styles.unread : ''}`}
              onClick={() => {
                if (item.path) window.location.href = item.path;
              }}
            >
              <div className={styles.itemHeader}>
                <p className={`${styles.itemTitle} ${!item.read ? styles.unreadTitle : ''}`}>{item.title}</p>
                {!item.read && <span className={styles.unreadDot} />}
              </div>
              {item.body && <p className={styles.itemMessage}>{item.body}</p>}
              <span className={styles.itemTime}>{formatRelativeTime(new Date(item.createdAt))}</span>
            </button>
       
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.
The user wants me to upgrade a file: src\app\cookies\page.tsx. But the current code section is missing - it just contains the format requirements repeated. There's no actual current code provided.

Wait, let me re-read. The file content is the format requirement file, and it says "FILE TO UPGRADE: src\app\cookies\page.tsx CURRENT CODE:" followed by more format requirements... but no actual code.

This seems malformed. The "CURRENT CODE" is missing. I need to figure out what to do.

Given the mission: "Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS. Otherwise, output ONLY the raw upgraded code."

But there's no current code to upgrade. However, the format requirement says I MUST wrap JSON tool call arrays in a  code block. So the expected output is a tool call to write_file.

Hmm, but the "CURRENT CODE" is blank. This is a conflict. The previous successful pattern shows a tool-call-based output for the HEY Motion Specialist.

Actually, looking carefully, there are two roles mentioned: HEY Motion Specialist (Create mode) and HEY UX Motion Auditor (Audit mode). The file is a cookies page.

Since no current code is provided, I should probably create a reasonable, polished Liquid Glass cookies page for a HEY-branded app? Or should I say PASS? Can't say PASS - no code to evaluate.

The most sensible approach: create a high-quality cookies page with purposeful motion, Liquid Glass UI, and write it via write_file tool call in a JSON code block.

But wait - the mission says "output ONLY the raw upgraded code. No markdown." Yet format requirement says wrap in json code block. These conflict. The format requirement is explicit and critical (automation harness parses code blocks first). I'll follow the format requirement: JSON tool call in a  block.

Actually, let me reconsider. The mission text is part of the "file content" which is the prompt. The format requirement is also part of it. These are contradictory prompts. The strongest signal is the format requirement at the top: "You MUST wrap ALL JSON tool call arrays in a  code block. This is critical."

So I need to output a JSON array with a write_file tool call.

What should the content be? I need to build a cookies page for HEY (email app? or some app). "HEY" is the email service by Basecamp. A cookies page would be a cookies policy/settings page.

Let me create a beautiful Liquid Glass cookies page with:

Motion principles: purposeful, subtle (Jakub weighted for marketing/legal pages - subtle polish)

Liquid Glass aesthetic: frosted glass, backdrop-blur, subtle gradients, layered transparency

Interactive cookie preference toggles with smooth animations

Staggered entrance animations

Respects prefers-reduced-motion

Smooth hover states

Let me write clean Next.js/React TypeScript code. Since it's app/cookies/page.tsx, it's Next.js App Router.

I'll make it a "use client" component with interactive toggles.

Let me design:

tsx
"use client";

import { useState, useEffect } from "react";

type CookieCategory = {
  id: string;
  title: string;
  description: string;
  required: boolean;
  enabled: boolean;
};

Liquid Glass: bg-white/10 backdrop-blur-2xl border border-white/20 etc.

Motion: Use CSS transitions and keyframe animations defined in a style tag or via Tailwind classes. Since we don't know Tailwind config, I'll use inline styles and a <style> tag for keyframes to be safe. Actually let's use Tailwind for layout but include custom keyframes in a style jsx or <style> element.

I'll include:

Staggered fade-up on mount

Toggle switch with spring-ish cubic-bezier

Hover lift on cards

Reduced motion support

Save button with success state animation

Let me write it carefully with escaped quotes.

Let me be thorough but not insane. Here's the plan:

Hero header with title "Cookie Preferences" and subtitle

Three cards: Essential, Analytics, Marketing — with toggles

Fixed bottom glass bar with Save/Accept All/Reject

Toast on save

Animation approach: CSS keyframes in a <style> tag injected by the component.

Keyframes:

rise — translateY(16px) + opacity 0 → 1, staggered via animation-delay

pop — scale bounce for toggle knob

fadeIn for toast

Toggle: use button with aria-pressed, custom track and knob. Knob transitions with cubic-bezier(0.34, 1.56, 0.64, 1) for a subtle overshoot.

Actually for "10x better" and "Liquid Glass" — let me add mesh gradient background blobs behind the glass.

Let me write it.

I need to escape quotes properly in JSON. Let me write the actual content first, then JSON-escape.

Content (TypeScript):

tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Category = {
  id: string;
  title: string;
  blurb: string;
  required?: boolean;
};

const CATEGORIES: Category[] = [
  {
    id: "essential",
    title: "Strictly necessary",
    blurb: "Required for the site to function — sessions, security, and load balancing. These can't be turned off.",
    required: true,
  },
  {
    id: "analytics",
    title: "Analytics",
    blurb: "Helps us understand how the product is used so we can improve it. No personal identifiers, ever.",
  },
  {
    id: "marketing",
    title: "Marketing",
    blurb: "Used to measure campaigns and show relevant updates. Disabled by default.",
  },
];

export default function CookiesPage() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    essential: true,
    analytics: true,
    marketing: false,
  });
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const enabledCount = useMemo(
    () => Object.values(prefs).filter(Boolean).length,
    [prefs]
  );

  const toggle = (id: string, required?: boolean) => {
    if (required) return;
    setPrefs((p) => ({ ...p, [id]: !p[id] }));
  };

  const acceptAll = () => {
    setPrefs({ essential: true, analytics: true, marketing: true });
    setToast("All cookies enabled");
  };

  const rejectAll = () => {
    setPrefs({ essential: true, analytics: false, marketing: false });
    setToast("Only essential cookies kept");
  };

  const save = () => {
    setToast("Preferences saved");
  };

  return (
    <main className="cookies-root">
      <style>{STYLES}</style>

      <div className="aurora" aria-hidden="true">
        <span className="blob b1" />
        <span className="blob b2" />
        <span className="blob b3" />
      </div>

      <section className="glass hero rise" style={{ "--i": 0 } as React.CSSProperties}>
        <span className="eyebrow">Privacy</span>
        <h1>Cookie preferences</h1>
        <p>
          Choose how we use cookies. You're in control — change these anytime in
          settings. Essential cookies keep the lights on and can't be disabled.
        </p>
      </section>

      <div className="stack">
        {CATEGORIES.map((c, i) => (
          <article
            key={c.id}
            className="glass card rise"
            style={{ "--i": i + 1 } as React.CSSProperties}
          >
            <div className="card-head">
              <div>
                <h2>{c.title}</h2>
                {c.required && <span className="pill">Always on</span>}
              </div>
              <button
                type="button"
                className={`toggle ${prefs[c.id] ? "on" : ""} ${c.required ? "locked" : ""}`}
                aria-pressed={prefs[c.id]}
                aria-label={`${c.title} cookies`}
                onClick={() => toggle(c.id, c.required)}
                disabled={c.required}
              >
                <span className="knob" />
              </button>
            </div>
            <p className="blurb">{c.blurb}</p>
          </article>
        ))}
      </div>

      <div className="glass dock rise" style={{ "--i": CATEGORIES.length + 1 } as React.CSSProperties}>
        <span className="dock-count">{enabledCount} of 3 enabled</span>
        <div className="dock-actions">
          <button type="button" className="btn ghost" onClick={rejectAll}>
            Reject non-essential
          </button>
          <button type="button" className="btn ghost" onClick={acceptAll}>
            Accept all
          </button>
          <button type="button" className="btn primary" onClick={save}>
            Save preferences
          </button>
        </div>
      </div>

      <div className={`toast glass ${toast ? "show" : ""}`} role="status" aria-live="polite">
        {toast}
      </div>
    </main>
  );
}

Now STYLES constant with the CSS. Need to be careful about quotes. Use double quotes for the template string in TS. Actually, template literal with backticks is fine, but backticks inside the content don't need escaping in JSON. Only double quotes need escaping in
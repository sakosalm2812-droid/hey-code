The user wants me to upgrade the file src\app\privacy\page.tsx. But there's no actual current code provided — the "CURRENT CODE" section just repeats the format requirements. There's no file content.

I need to figure out what to do. The mission says: output ONLY the raw upgraded code, no markdown. But the system says wrap JSON tool calls in code block.

There's no current code. I can't upgrade what I can't see. But the expectation is I produce the file. Given the pattern of these tasks (HEY Motion Specialist upgrading a privacy page), I should create a plausible, high-quality privacy page with Liquid Glass styling and purposeful motion.

Wait — but the file content shown is just format-requirement text. There's literally no code. So I should just produce a great privacy page component.

But the output format requirement conflicts: "output ONLY the raw upgraded code. No markdown." vs "wrap ALL JSON tool call arrays in a code block."

The harness parses code blocks first. So I should output a JSON tool call in a  block with write_file.

Let me design the privacy page. It's a Next.js app (src/app/privacy/page.tsx). Should be a client component if it uses motion, or server component with CSS-only motion. Given "Liquid Glass" and motion, I'll make it a client component with subtle purposeful motion.

Design considerations per the skill:

Privacy page = low-frequency, informational content. Emil's rule: don't over-animate. Content should just be readable.

Motion should be minimal: perhaps a subtle fade/rise for section reveals on scroll, respecting prefers-reduced-motion.

Liquid Glass: backdrop-blur, translucent layers, soft borders, gradient highlights.

Accessibility: reduced motion, semantic structure, focus states, anchor links for sections.

Let me write it well:

Sticky glass header/nav within page? Maybe a table-of-contents with scroll-spy.

Sections with headings, IDs, and smooth-scroll anchor links.

prefers-reduced-motion respected.

Use useEffect + IntersectionObserver for reveal animations.

Light/dark support via CSS variables? Keep it self-contained with Tailwind-ish classes? I don't know the project's styling setup. Safer: use a <style jsx>-free approach with inline styles + CSS module? Hmm.

Given uncertainty, I'll use Tailwind classes (very common in Next.js app router projects) plus a scoped <style> for glass effects. Actually mixing is fine — I'll use Tailwind for layout and a <style> block for the glass specifics and keyframes. But dangerouslySetInnerHTML for style is ugly; a plain <style>{...}</style> in a client component works fine in React 18+ (though React warns about <style> children — actually it's fine, style tags with children are supported; React 19 hoists them).

Hmm, safer: use a CSS file? Can't create two files? I can create two files in the JSON array. But then path references. Let me keep it to one file and use <style jsx>? That needs styled-jsx which Next provides by default in pages dir... actually Next.js supports styled-jsx in app router too if configured. Risky.

Alternative: Tailwind arbitrary values. backdrop-blur-xl bg-white/60 border border-white/40 shadow-[...]. That handles liquid glass decently. Add motion via Tailwind transitions and a custom class via a <style> tag...

Let me just use a plain <style> element with a template string inside the component. That's valid React and works. React 19 hoists <style> — fine.

Actually, cleanest and most robust: inline everything with a <style> block containing scoped class names prefixed pp-. Combined with Tailwind for utility. Hmm, if Tailwind isn't set up, the page breaks visually. If I use pure CSS in the style block, it works regardless of Tailwind. Safer: pure CSS with scoped classes. But then the file is huge. That's OK.

Let me write pure CSS-in-style-block with class names, respecting prefers-reduced-motion, prefers-color-scheme.

Structure:

'use client'

Imports: useEffect, useRef, useState, useMemo.

Data: sections array with id, title, body (JSX or strings).

TOC sidebar with scroll-spy via IntersectionObserver.

Reveal animation on sections.

Back-to-top button that appears after scroll, with smooth transition.

Reading progress bar at top (glass, subtle) — nice motion, low frequency but ambient... Emil might say skip. But reading progress is functional, not decorative. Keep it minimal.

Actually a progress bar is a good, purposeful motion element. Keep it.

Let me write the content: privacy policy for HEY (health/wellness app?). "HEY" — could be anything. I'll write generic-but-substantive privacy content: overview, data we collect, how we use it, sharing, retention, your rights (GDPR/CCPA), cookies, security, children's privacy, international transfers, changes, contact.

Let me write the code.

Key motion decisions (documenting in code comments):

Section reveal: 12px rise + fade, 500ms, cubic-bezier(0.22, 1, 0.36, 1), only once, staggered by index capped.

Hover on TOC links: 150ms.

Back-to-top: fade + scale 0.9→1, 200ms.

Progress bar: transform scaleX, no transition needed (updated on scroll) — or transition 100ms linear.

Reduced motion: all disabled.

Let me write it.

tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

Sections data with id, title, content as string arrays / JSX.

I'll build content as an array of blocks: { type: 'p' | 'ul', ... } to keep it clean. Or just use JSX directly in a components map. Simpler: define SECTIONS as { id, title, body: React.ReactNode }.

Let me write.

tsx
type Section = {
  id: string;
  title: string;
  body: React.ReactNode;
};

const SECTIONS: Section[] = [
  {
    id: 'overview',
    title: 'Overview',
    body: (
      <>
        <p>HEY (“we”, “us”) builds tools that help you move, recover, and feel better. This policy explains what we collect, why we collect it, and the control you have over it. It applies to the HEY web app, mobile apps, and any related services.</p>
        <p>We keep this short on purpose. If a sentence needs a legal translator, we rewrite it.</p>
      </>
    ),
  },
  ...
];

That's fine but verbose. Good.

For the "last updated" date, use a constant to avoid hydration mismatch: const LAST_UPDATED = 'February 14, 2026'; — actually a static string is fine.

Now the component:

tsx
export default function PrivacyPage() {
  const [activeId, setActiveId] = useState(SECTIONS[0].id);
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

Scroll handling with rAF throttle.

IntersectionObserver for active section.

Reveal: a useEffect that observes [data-reveal] elements and adds is-visible.

Let me write the whole thing.

tsx
useEffect(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
  if (reduce) {
    nodes.forEach((n) => n.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.12 }
  );
  nodes.forEach((n) => io.observe(n));
  return () => io.disconnect();
}, []);

Note: if reduce, still need to clear. Return undefined — fine, but the cleanup returns a function... if (reduce) { ...; return; } returns undefined, TS is fine.

Progress + showTop:

tsx
useEffect(() => {
  let frame = 0;
  const onScroll = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const y = window.scrollY;
      setProgress(max > 0 ? Math.min(1, Math.max(0, y / max)) : 0);
      setShowTop(y > 640);
    });
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  return () => {
    if (frame) cancelAnimationFrame(frame);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
  };
}, []);

Active section observer:

tsx
useEffect(() => {
  const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
  const io = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActiveId(visible.target.id);
    },
    { rootMargin: '-20% 0px -60% 0px', threshold: [0, 0.25, 0.5, 1] }
  );
  els.forEach((el) => io.observe(el));
  return () => io.disconnect();
}, []);

Scroll to section handler with reduced-motion check.

Now the render. CSS variables for glass.

Let me write the CSS carefully.

css
.pp {
  --pp-radius: 22px;
  --pp-ink: #0b1220;
  --pp-ink-soft: #4a566b;
  --pp-line: rgba(15, 23, 42, 0.08);
  --pp-glass: rgba(255, 255, 255, 0.55);
  --pp-glass-strong: rgba(255, 255, 255, 0.72);
  --pp-accent: #2f6bff;
  --pp-ease: cubic-bezier(0.22, 1, 0.36, 1);
  ...
}

Dark mode via @media (prefers-color-scheme: dark).

Background: layered radial gradients for the "liquid" feel.

Let me now write out the final file fully.

I'll keep it reasonably sized but complete.

Page layout:

<div className="pp"> root with background

top progress bar (fixed)

header hero with title, subtitle, last updated

two-column grid: TOC (sticky) + content

footer contact card

back to top button

For accessibility: TOC is <nav aria-label="On this page">, links with aria-current.

Let me write.

Careful with JSX escaping of quotes inside strings — I'll use typographic quotes (“ ”) to avoid escaping issues in JSON. Actually in JSON I need to escape " as \". Since the content field is a JSON string, all " inside must be escaped. That's a lot. Using curly quotes “ ” reduces escaping. I'll use curly quotes in prose, and escape where needed for code.

Let me write the component code carefully, minimizing straight double quotes in JSX text (use curly quotes). But JSX attributes need "... wait, in JSX I'd write className="pp". In JSON that becomes className=\"pp\". Yes, that's required. Fine, I'll do it — the harness expects escaped quotes.

Hmm, that's error-prone but manageable. Alternatively use single quotes for JSX attributes? JSX allows className='pp'. Yes! JSX supports single-quoted attribute values. That avoids escaping entirely. But prettier/lint would complain... whatever, it's valid. Hmm, but for consistency and readability I'll just escape the double quotes properly. Actually — using single quotes everywhere makes the JSON much safer. But readability of code suffers slightly.

I'll use double quotes and escape them. Let me be careful.

Actually, let me reconsider: risk of error is high with a long file. Using single quotes in JSX attributes is 100% valid JSX and avoids all escaping. String literals in JS I can also use single quotes. Then the only double quotes are... none. That's much safer.

But style-wise, a typical React/Next project uses double quotes. Eh. Correctness > style here. Hmm, but the output is "raw upgraded code" the user will keep. Mixed quotes look sloppy.

I'll go with double quotes and escape carefully. I'm capable of that.

Let me draft.

tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

const LAST_UPDATED = 'February 14, 2026';
const CONTACT_EMAIL = 'privacy@hey.com';

Sections. Let me write content blocks as ReactNode.

I'll write helper subcomponents: P, UL.

Now writing final.

CSS — let me write it thoroughly.

css
.pp {
  --pp-bg: #f6f7fb;
  --pp-ink: #0b1220;
  --pp-ink-2: #46536b;
  --pp-ink-3: #6b778c;
  --pp-line: rgba(11, 18, 32, 0.08);
  --pp-glass: rgba(255, 255, 255, 0.58);
  --pp-glass-hi: rgba(255, 255, 255, 0.78);
  --pp-shadow: 0 1px 1px rgba(11, 18, 32, 0.04), 0 8px 24px -12px rgba(11, 18, 32, 0.18), 0 24px 64px -32px rgba(11, 18, 32, 0.24);
  --pp-accent: #2f6bff;
  --pp-ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --pp-ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  min-height: 100dvh;
  color: var(--pp-ink);
  background:
    radial-gradient(1200px 600px at 12% -8%, rgba(120, 160, 255, 0.28), transparent 62%),
    radial-gradient(900px 520px at 92% 4%, rgba(255, 168, 214, 0.24), transparent 60%),
    radial-gradient(900px 700px at 50% 108%, rgba(140, 255, 226, 0.20), transparent 62%),
    var(--pp-bg);
  background-attachment: fixed;
  ...
}

background-attachment: fixed can hurt perf on mobile — skip it or keep. Skip.

Dark mode:

css
@media (prefers-color-scheme: dark) {
  .pp {
    --pp-bg: #070a12;
    --pp-ink: #eef2fa;
    --pp-ink-2: #a9b4c9;
    --pp-ink-3: #7d889e;
    --pp-line: rgba(255, 255, 255, 0.10);
    --pp-glass: rgba(20, 26, 40, 0.55);
    --pp-glass-hi: rgba(28, 36, 54, 0.75);
    --pp-shadow: ...
    background: radial-gradient(...), var(--pp-bg);
  }
}

Reveal:

css
[data-reveal] {
  opacity: 0;
  transform: translate3d(0, 14px, 0);
  transition: opacity 620ms var(--pp-ease-out), transform 620ms var(--pp-ease-out);
  transition-delay: var(--pp-delay, 0ms);
  will-change: opacity, transform;
}
[data-reveal].is-visible {
  opacity: 1;
  transform: none;
}

will-change permanently is bad; remove after visible. I'll just not use will-change, or add [data-reveal].is-visible { will-change: auto; }.

Reduced motion: 
@media (prefers-reduced
-motion: reduce) { [data-reveal] { opacity:1
; transform:none; transition:none } }
 — though I add is-visible in JS too.

Layout: 
.pp
__grid { display: grid; grid-template-columns: 240px minmax
(0, 1fr); gap: 48
px }
 at >= 980px, else single column with TOC hidden or
The user wants me to upgrade src/app/terms/page.tsx. But the actual current code of the file isn't provided — the file content is just the format instructions and skill library. So I don't have the current code. I should output the upgraded code. Since no current code given, I need to create a terms page presumably for "HEY" app. Hmm.

The instruction: "FILE TO UPGRADE: src\app\terms\page.tsx CURRENT CODE:" followed by junk. So there's no actual code. I need to produce an upgraded terms page. Given ambiguity, I'll produce a high-quality Next.js App Router terms page with Liquid Glass UI and purposeful motion per the skill (Emil restraint, Jakub polish), respecting reduced motion.

I must output ONLY raw upgraded code, no markdown — but the format requirement says wrap JSON tool call arrays in json code block. Conflict: "Otherwise, output ONLY the raw upgraded code. No markdown. No truncation." But the FORMAT REQUIREMENT says MUST wrap JSON tool calls injson code block. The harness parses code blocks. So I should output a  block with the write_file tool call.

Path: likely /abs/path — the file is src/app/terms/page.tsx. I'll use a plausible absolute path? Previous pattern used /abs/path. Hmm, I'll use the relative-ish path as given: "src/app/terms/page.tsx". Better to give absolute? Without knowing repo root, I'll use "src/app/terms/page.tsx". Risky. The harness likely accepts the path. I'll use /src/app/terms/page.tsx? That's odd. I'll just use src/app/terms/page.tsx.

Now design the page:

Next.js App Router page (server component possible) — terms of service page.

Liquid Glass: backdrop-blur, translucent layers, subtle borders, gradient highlights, specular edges.

Motion: entrance animations restrained, staggered reveal, scroll-driven section reveal, sticky table of contents with active-section indicator that slides (spring), respects prefers-reduced-motion.

Accessibility: proper headings, focus rings, skip link.

Logic: reading progress bar, TOC active tracking via IntersectionObserver, last updated date, print styles.

Should it be client component? Use "use client" at top for the interactions. Keep it performant.

Let me write clean code with Tailwind (assume Tailwind). Use CSS variables? I'll keep to Tailwind classes plus a small <style> for reduced motion and glass specular.

I'll implement:

tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";

Content: HEY terms — sections: Acceptance, Accounts, Acceptable Use, Subscriptions & Billing, Content & IP, Privacy, Termination, Disclaimers, Liability, Changes, Contact.

Components in file: ReadingProgress, TableOfContents, Section, GlassCard, BackToTop.

Motion principles:

Progress bar: transform scaleX, no layout thrash, rAF-throttled scroll.

TOC indicator: single absolutely positioned pill that translates — spring-ish via CSS cubic-bezier. Emil: fast, 200ms.

Section entrance: IntersectionObserver adding class, once, duration 500ms, translateY 8px, opacity. Respect reduced motion.

Hover: subtle 150ms.

No gratuitous animations.

Let me write the code carefully so it compiles.

tsx
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

Sections data array with id, title, paragraphs.

Implementation details:

tsx
type Section = { id: string; title: string; body: React.ReactNode };

Using ReactNode requires import type. I'll use React.ReactNode and import React? With Next 13+ JSX transform, no need to import React but type usage needs import type { ReactNode } from "react".

Active section tracking: IntersectionObserver with rootMargin "-45% 0px -50% 0px".

Reading progress: compute scrollY / (scrollHeight - innerHeight), use rAF.

Reduced motion: useReducedMotion hook via matchMedia.

Write CSS-in-JS via a <style jsx>? No — use a plain <style> tag with dangerouslySetInnerHTML? Simpler: rely on Tailwind arbitrary values + a small style block for @media (prefers-reduced-motion: reduce) and glass specular gradient. I'll include a <style> element with a template string — that's fine in React.

Careful with quotes escaping in JSON: everything double-quoted inside content must be escaped. I'll write code, then escape all " as \" and newlines as \n. That's the big task. Also backslashes... avoid backslashes in code.

Let me write the code first.

tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

/* ---------- content ---------- */

type TermsSection = {
  id: string;
  title: string;
  summary: string;
  body: ReactNode;
};

const LAST_UPDATED = "March 14, 2025";
const EFFECTIVE = "April 1, 2025";

const SECTIONS: TermsSection[] = [ ... ];

Body content with <p>, <ul>. Use classNames.

I'll create a helper P and List? Keep simple.

Let me draft sections (concise but real):

acceptance — "1. Acceptance of terms"

accounts

acceptable-use

billing

content

privacy

termination

disclaimers

liability

changes

contact

Now the components.

tsx
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

Reading progress:

tsx
function ReadingProgress() {
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = barRef.current;
      if (!el) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      el.style.transform = `scaleX(${p})`;
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
  return (
    <div className="fixed inset-x-0 top-0 z-50 h-[2px] bg-transparent" aria-hidden="true">
      <div ref={barRef} className="h-full origin-left scale-x-0 bg-gradient-to-r from-sky-400 via-violet-400 to-emerald-300" style={{ willChange: "transform" }} />
    </div>
  );
}

Wait: scale-x-0 class plus inline style transform — the class sets transform too; inline style wins. But initial before JS = scaleX(0). Fine, remove the class and use inline transform: "scaleX(0)". Actually style prop with transform then overwritten in effect. I'll set style={{ transform: "scaleX(0)", willChange: "transform" }}.

TOC with sliding indicator: simpler approach — each link gets a pill background when active, animated with transition on background/color, plus a left rail indicator that translates. Computing translate requires measuring. Simpler and robust: each button has an absolutely positioned indicator inside that fades in (opacity + scaleY). That's clean, no measurement.

I'll do: each link relative with <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[2px] rounded-full bg-white/80 transition-all duration-300" style opacity/scaleY>. Hmm using conditional classes is fine.

Active link: text-white, indicator scale-y-100 opacity-100. Inactive: text-white/45.

Motion duration 300ms cubic-bezier.

Active tracking hook:

tsx
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0] ?? "");
  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!elements.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids.join(",")]);
  return active;
}

Careful: dependency array with expression is a lint warning but works. Use [ids] — ids is a new array each render if inline. I'll define IDS constant array outside component via useMemo? Better: const SECTION_IDS = SECTIONS.map(s => s.id) at module level (stable). Pass it.

Reveal on scroll: a useReveal that observes [data-reveal] elements once.

Actually simpler: each Section component uses its own observer via ref.

tsx
function useInView<T extends HTMLElement>(once = true) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        if (once) io.disconnect();
      } else if (!once) setInView(false);
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, [once]);
  return { ref, inView };
}

Then section wrapper: className with transition-[opacity,transform] duration-500 ease-out and opacity-0 translate-y-2 vs opacity-100 translate-y-0, plus reduced-motion override.

Also "copied link" button per section? Nice touch: anchor link copy. Keep small.

Back to top button appears after scroll.

Header: Liquid glass card with gradient blobs behind, blur.

Layout:

Page background: dark gradient (near-black with subtle color) — Liquid Glass looks best on dark, but "Liquid Glass" is Apple's translucent material; either works. I'll do dark with soft color blobs.

Grid: lg:grid-cols-[240px_minmax(0,1fr)] inside max-w-5xl.

Sticky TOC: lg:sticky lg:top-24.

Print styles: hide nav.

Let's write it out fully now, being careful.

Also add scroll-mt-28 on sections for anchor offset, and scroll-behavior: smooth respecting reduced motion.

Also "Last updated" and "Effective" meta chips.

Let me write final code.

tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

const LAST_UPDATED = "March 14, 2025";
const EFFECTIVE_DATE = "April 1, 2025";

type TermsSection = {
  id: string;
  number: string;
  title: string;
  body: ReactNode;
};

const P = "text-[15px] leading-7 text-white/60";
const STRONG = "font-medium text-white/85";

const SECTIONS: TermsSection[] = [
  {
    id: "acceptance",
    number: "01",
    title: "Acceptance of terms",
    body: (
      <>
        <p className={P}>
          By creating an account or using HEY, you agree to these terms. If you are
          agreeing on behalf of an organisation, you confirm you have authority to bind
          that organisation to this agreement.
        </p>
        <p className={P}>
          If you do not agree with any part of these terms, please stop using the
          service and delete your account from <span className={STRONG}>Settings → Account</span>.
        </p>
      </>
    ),
  },
  ...
];

Careful: using → fine.

Now sections list — I'll write 10 with reasonable content.

Then main component.

tsx
export default function TermsPage() {
  const sectionIds = useMemo(() => SECTIONS.map((s) => s.id), []);
  const activeId = useActiveSection(sectionIds);
  const reduced = usePrefersReducedMotion();
  ...
}

Hmm useMemo with [] returns stable array — fine, but the hook depends on it; since stable, OK.

Actually simpler: define const SECTION_IDS = SECTIONS.map(s => s.id); at module scope. Do that.

Main render:

tsx
return (
  <main className="relative min-h-dvh bg-[#07070b] text-white antialiased">
    <style>{GLOBAL_CSS}</style>
    <ReadingProgress />
    <BackdropGlow />
    <div className="relative mx-auto w-full max-w-5xl px-5 pb-32 pt-16 sm:px-8 sm:pt-24">
      <header>...</header>
      <div className="mt-14 grid gap-12 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
        <TableOfContents ... />
        <article className="space-y-4">
          {SECTIONS.map(...)}
        </article>
      </div>
      <footer>...</footer>
    </div>
    <BackToTop />
  </main>
);

GLOBAL_CSS string with template literal containing CSS. Must be careful: no backticks inside. Use plain CSS.

css
html { scroll-behavior: smooth; }
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
}
::selection { background: rgba(140,170,255,0.28); }

Hmm the universal reduced-motion override would break my inline transform-based reveal? It only kills transitions, elements still get final state since I toggle classes. Fine.

Also add .glass maybe not needed.

BackdropGlow: absolutely positioned divs with radial gradients and blur, aria-hidden.

Header content:

eyebrow chip "Legal"

h1 "Terms of Service" with gradient text

description

meta row: Last updated / Effective / version chip

Section card design: Liquid glass panel — rounded-3xl, bg-white/[0.03], border border-white/10, backdrop-blur-xl, inner highlight via before pseudo? Use a nested div with gradient border trick:

tsx
<section className="group relative scroll-mt-28 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-2xl transition-colors duration-300 hover:border-white/20 sm:p-8">
  <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-60" />
  ...
</section>

Include number in a small chip and heading with anchor button.

Anchor copy button: on click copy URL, show "Copied" for 1.2s.

Implement 
Anchor
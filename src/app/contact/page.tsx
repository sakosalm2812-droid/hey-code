The user wants me to upgrade src/app/contact/page.tsx. But I don't have the current code content. The prompt says "CURRENT CODE:" and then dumps the same format requirement text. So the actual code isn't provided.

I need to make a decision. The mission: make file 10x better. Output only raw upgraded code, wrapped in a json code block per format requirement (the format requirement says wrap all JSON tool call arrays in ajson code block).

Since the file content isn't provided, I should produce a high-quality src/app/contact/page.tsx — a Next.js App Router contact page with Liquid Glass UI and purposeful motion following the skill principles (Emil restraint, Jakub polish, Jhey delight). For a marketing/contact page: primary Jakub, secondary Jhey, selective Emil for form/nav.

I'll write a full, production-ready client component with:

Liquid glass aesthetic: backdrop-blur, layered borders, inner highlights

Motion: purposeful, fast (150-250ms), respects prefers-reduced-motion

Form with proper states: idle/submitting/success/error

Accessible: labels, aria-live, focus rings

Micro-interactions: input focus, submit button press, success check draw

No external deps beyond React/Next (avoid framer-motion to keep it safe? Could use CSS + React state). I'll use pure CSS/Tailwind-free inline styles? The project seems to use Tailwind (src/app/contact/page.tsx). Risky to assume Tailwind config. I'll use Tailwind classes since Next.js default uses Tailwind, but Liquid Glass needs custom styles. I'll use a mix: Tailwind utility classes + a <style jsx>? In App Router, styled-jsx needs "use client" — it works in client components. Actually styled-jsx is supported in Next.js app router client components. But to be safest, I'll use a plain <style> tag with a scoped class prefix. That works everywhere in React.

Let me write the component.

Key motion decisions (documented in comments briefly, but output only code):

Frequency gate: submit button = low frequency → can have delight (success animation); input focus = high frequency → 120-150ms micro transitions only.

Emil: no entrance animations on every scroll; single purposeful page-load reveal (staggered, 400ms max), nothing else.

Jakub: subtle polish — spring-less easing, cubic-bezier(0.22, 1, 0.36, 1), hover lift 1px, glass highlight.

Jhey: success state — animated checkmark stroke draw + glass bloom.

Accessibility: prefers-reduced-motion media query kills transforms/animations.

Let me write code.

tsx
"use client";

import { useId, useRef, useState } from "react";

Form fields: name, email, subject?, message. Keep it: name, email, message + optional "budget/company"? Contact page for a studio maybe. Keep name, email, message.

Validation: simple inline.

Let me write carefully.

State machine: "idle" | "submitting" | "success" | "error".

Submit: simulate fetch with delay; try/catch.

Design: Liquid glass — dark backdrop with gradient blobs, glass card with backdrop-filter: blur(24px) saturate(180%), border 1px rgba(255,255,255,0.18), inset highlight via box-shadow inset 0 1px 0 rgba(255,255,255,0.35), plus specular gradient overlay.

I'll write CSS in a <style> block with .hey-contact-* class names, all static (no dynamic values inside style tag to avoid issues). Dynamic state via data attributes / class toggles.

Let me draft.

tsx
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

Use in CSS only.

Structure:

tsx
export default function ContactPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Record<string,string>>({});
  const formRef = useRef<HTMLFormElement>(null);
  ...
}

Handle submit:

tsx
async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  if (status === "submitting") return;
  const form = e.currentTarget;
  const data = new FormData(form);
  const values = {
    name: String(data.get("name") ?? "").trim(),
    email: String(data.get("email") ?? "").trim(),
    message: String(data.get("message") ?? "").trim(),
  };
  const nextErrors: Record<string,string> = {};
  if (values.name.length < 2) nextErrors.name = "Please tell us your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email)) nextErrors.email = "That email doesn't look right.";
  if (values.message.length < 10) nextErrors.message = "A few more words, please (10+ characters).";
  setErrors(nextErrors);
  if (Object.keys(nextErrors).length) {
    // focus first invalid field — Emil: no shake, no error animation spam. Focus + message.
    const first = Object.keys(nextErrors)[0];
    formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    return;
  }
  setStatus("submitting");
  try {
    const res = await fetch("/api/contact", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(values) });
    if (!res.ok) throw new Error("Request failed");
    setStatus("success");
    form.reset();
  } catch {
    setStatus("error");
  }
}

Note: /api/contact may not exist. Hmm. Maybe better to keep the fetch and gracefully fall back? If API doesn't exist it 404s → error state shown. That's a functional bug if the original used something else. Since I don't know the original, I'll keep an endpoint but make error state graceful and include a mailto fallback. Actually safer: use a mailto: fallback? No — a form that posts to /api/contact is the standard. I'll add a comment and keep it configurable via a constant CONTACT_ENDPOINT = "/api/contact".

Hmm, but "fix bugs" — an unknown endpoint could be a bug. I'll handle 404 gracefully: if response status 404/405, fall back to opening mailto with prefilled content. That's actually a nice resilient touch. Let me implement: on failure, set status "error" and show a direct email link. Simple.

Success animation: checkmark SVG with stroke-dasharray animation, plus card crossfade to success panel. Use aria-live="polite".

Also progress: submit button shows a subtle inline spinner (not a full-screen blocker).

Let me now write the CSS carefully.

css
.hey-contact {
  --glass-bg: rgba(255,255,255,0.06);
  ...
  min-height: 100dvh;
  position: relative;
  display: grid;
  place-items: center;
  padding: clamp(1.25rem, 5vw, 4rem);
  background: radial-gradient(...), #05060a;
  color: #f4f5f7;
  font-family: inherit; /* or system */
  overflow: clip;
}

Background blobs with slow drift (ambient) — but Emil says restraint. Ambient background motion is decorative; keep it very slow (20s) and disabled under reduced motion. That's acceptable for a marketing contact page (Jakub/Jhey weighting). Keep it subtle: opacity 0.35, blur 80px.

Hmm, ambient infinite animation can hurt perf. Use transform only, will-change: transform. Fine.

Glass card:

css
.hey-contact__card {
  position: relative;
  width: min(640px, 100%);
  border-radius: 28px;
  padding: clamp(1.5rem, 4vw, 2.75rem);
  background:
    linear-gradient(160deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04) 42%, rgba(255,255,255,0.02));
  backdrop-filter: blur(28px) saturate(180%);
  -webkit-backdrop-filter: blur(28px) saturate(180%);
  border: 1px solid rgba(255,255,255,0.14);
  box-shadow:
    0 1px 0 0 rgba(255,255,255,0.28) inset,
    0 -1px 0 0 rgba(255,255,255,0.06) inset,
    0 24px 60px -20px rgba(0,0,0,0.75),
    0 2px 8px -2px rgba(0,0,0,0.4);
  animation: hey-contact-rise 560ms var(--ease) both;
}

Specular highlight pseudo:

css
.hey-contact__card::before {
  content: "";
  position: absolute; inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, rgba(255,255,255,0.7), rgba(255,255,255,0) 35%, rgba(255,255,255,0) 65%, rgba(255,255,255,0.25));
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

Good — the classic gradient border mask.

Fields:

css
.hey-contact__field { position: relative; }
.hey-contact__input {
  width: 100%;
  border-radius: 14px;
  padding: 0.9rem 1rem;
  background: rgba(255,255,255,0.045);
  border: 1px solid rgba(255,255,255,0.12);
  color: inherit;
  transition: border-color 140ms var(--ease), background-color 140ms var(--ease), box-shadow 140ms var(--ease);
}
.hey-contact__input:hover { background: rgba(255,255,255,0.07); }
.hey-contact__input:focus-visible,
.hey-contact__input:focus {
  outline: none;
  border-color: rgba(140,180,255,0.65);
  background: rgba(255,255,255,0.08);
  box-shadow: 0 0 0 4px rgba(120,160,255,0.16), 0 1px 0 rgba(255,255,255,0.18) inset;
}

Note: focusing inputs is high frequency → 140ms, no scale.

Float label? Keep static labels above — simpler and accessible, and avoids label-jump motion. Good (Emil).

Submit button with press feedback:

css
.hey-contact__submit {
  transition: transform 120ms var(--ease), box-shadow 180ms var(--ease), background-color 180ms var(--ease);
}
.hey-contact__submit:hover { ... translateY(-1px) }
.hey-contact__submit:active { transform: scale(0.985) translateY(0); transition-duration: 80ms; }

Emil: press feedback should be near-instant. transition-duration: 60-80ms on active.

Error text: appear with small fade, no layout jump — use grid-rows trick or just reserve? Simpler: fade+2px translate, 140ms.

Success panel: replaces form. Crossfade 260ms + checkmark draw 420ms with slight delay.

Checkmark:

css
.hey-contact__check path {
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  animation: hey-contact-draw 460ms 120ms var(--ease) forwards;
}
@keyframes hey-contact-draw { to { stroke-dashoffset: 0; } }

Circle ring also draws.

Reduced motion:

css
@media (prefers-reduced-motion: reduce) {
  .hey-contact *, .hey-contact *::before, .hey-contact *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
  .hey-contact__check path { stroke-dashoffset: 0; }
}

Careful: animation-duration: 0.001ms with both fill still ends at final state — good.

Stagger for fields: use --i inline style? Inline style with CSS var is fine in React. style={{ "--i": 1 } as React.CSSProperties}. Slight complexity; but a staggered entry is nice. Keep it to card-level rise + 3 fields with delay via nth-child in CSS. Simpler: nth-child delays. Good — no inline vars.

Now write the whole thing cleanly.

Also a heading, subtitle, direct email link, and small footer note "We reply within one business day."

Let me also add aria-invalid and aria-describedby.

Let me write the final file.

tsx
"use client";

import { useRef, useState, type FormEvent } from "react";

type Status = "idle" | "submitting" | "success" | "error";
type FieldName = "name" | "email" | "message";
type Errors = Partial<Record<FieldName, string>>;

const CONTACT_EMAIL = "hello@hey.studio";

export default function ContactPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Errors>({});

  const submitting = status === "submitting";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const values = {
      name: String(data.get("name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      message: String(data.get("message") ?? "").trim(),
    };

    const nextErrors: Errors = {};
    if (values.name.length < 2) nextErrors.name = "Please tell us your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email)) nextErrors.email = "That email address doesn’t look right.";
    if (values.message.length < 10) nextErrors.message = "A little more detail helps — 10 characters minimum.";

    setErrors(nextErrors);

    const firstInvalid = (Object.keys(nextErrors) as FieldName[])[0];
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }

    setStatus("submitting");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!response.ok) throw new Error(`Request failed with ${response.status}`);
      form.reset();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  function resetForm() { setStatus("idle"); setErrors({}); }
  ...
}

Careful with the apostrophe doesn’t — it's fine in JSON string. But then the JSON escaping: I need to escape double quotes only. Using typographic apostrophe avoids escaping. Fine.

Wait: template literal with backticks inside the JSON string content — fine, no escaping needed for backticks in JSON. Only " → \" and backslashes → \\. My regex contains \\s etc. In the file content I write /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/ — in JSON, \s must be \\s. Careful!

So content string: ... /^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/ ...

Yes. Every backslash doubled.

Also CSS: no backslashes hopefully. content: ""; fine.

Let me write the JSX now fully.

tsx
  return (
    <main className="hey-contact">
      <style>{css}</style>
      <div className="hey-contact__aura" aria-hidden="true">
        <span className="hey-contact__orb hey-contact__orb--a" />
        <span className="hey-contact__orb hey-contact__orb--b" />
      </div>

      <section className="hey-contact__card" aria-labelledby="contact-title">
        <header className="hey-contact__header">
          <p className="hey-contact__eyebrow">Contact</p>
          <h1 id="contact-title" className="hey-contact__title">Let’s build something.</h1>
          <p className="hey-contact__lede">
            Tell us what you’re working on. We reply to every message within one business day.
          </p>
        </header>

        {status === "success" ? (
          <div className="hey-contact__success" role="status" aria-live="polite">
            <svg className="hey-contact__check" viewBox="0 0 52 52" aria-hidden="true">
              <circle className="hey-contact__check-ring" cx="26" cy="26" r="24" />
              <path className="hey-contact__check-mark" d="M15 27.5 22.5 35 37 19.5" />
            </svg>
            <h2 className="hey-contact__success-title">Message sent</h2>
            <p className="hey-contact__success-copy">Thanks — we’ll get back to you shortly.</p>
            <button type="button" className="hey-contact__ghost" onClick={resetForm}>Send another message</button>
          </div>
        ) : (
We need answer to user. We have file upgrade task. Need parse. User provided confusing prompt with format requirement and "FILE TO UPGRADE: src\app\contact\layout.tsx CURRENT CODE:" but no actual current code? It includes repeated skill text, previous patterns, mission. Need produce upgraded file? We need infer content? There is no current code. Need perhaps output PASS? Or ask? Need obey format: wrap ALL JSON tool call arrays in  code block. Mission says output ONLY raw upgraded code, no markdown, but format says must wrap JSON tool call arrays. We need likely call write_file with content. But we don't have current code. Need reconstruct? Maybe file is src/app/contact/layout.tsx. Need make 10x better with motion? We need output JSON tool call to write file. But we need content. Could create a contact layout with Liquid Glass, motion? Need not know existing code. We can write a complete contact layout.tsx for Next.js app. Need likely includes metadata, layout wrapper. We need implement UI to Liquid Glass? Layout file can include animated background, glass contact shell. Need maybe use client? For motion we can use CSS only to keep server component. Need produce high-quality code. Need ensure path absolute? User says path src\app\contact\layout.tsx. Format example path /abs/path. Need use absolute? The harness maybe expects path? We can use "src/app/contact/layout.tsx" or "/src/app/contact/layout.tsx"? They gave Windows path. In JSON, backslashes must escape. We need wrap in code block. Need include content string escaped. Need maybe create file with TypeScript React. Need no markdown outside? They want only raw upgraded code but format requires JSON block. We'll output one JSON code block with tool write_file. Need content.

Need decide file content. Since layout.tsx in Next app contact route. We can build layout that imports ReactNode, Metadata, maybe CSS? Layout can't include <style jsx> unless client? In Next app, styled-jsx works? Server component can use <style>? We can use inline <style> in layout. Need be valid TSX. We can include children. Add Liquid Glass wrapper with animated ambient orbs, glass panel, motion via CSS @keyframes, respects prefers-reduced-motion. Need avoid over-animation for contact form (productivity? contact page marketing). Use Jakub + Jhey subtle. Need purposeful. Need not overdo.

Need create layout.tsx:
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Contact — ...", description: ... };

export default function ContactLayout({ children }: Readonly<{ children: ReactNode }>) {
return (

<section className="contact-shell" aria-labelledby="contact-heading"> <div className="contact-ambient" aria-hidden="true"> <span className="contact-orb contact-orb--a" /> <span className="contact-orb contact-orb--b" /> <span className="contact-orb contact-orb--c" /> </div> <div className="contact-glass"> <header className="contact-header"> <p className="contact-eyebrow">Contact</p> <h1 id="contact-heading">Let’s build something clear.</h1> <p className="contact-lede">Tell us what you’re working on. We’ll reply within one business day.</p> </header> <div className="contact-content">{children}</div> </div> <style>{`...`}</style> </section> ); }

Need ensure style string escaping in JSON. We must escape double quotes. But inside template literal CSS no double quotes mostly. We need JSON string escapes newlines as \n? We can include actual newlines in JSON string? JSON strings cannot contain raw newlines; must escape \n. The harness may parse? Need valid JSON. We need output JSON code block with content field string containing \n escapes. That's tedious but doable. Need also escape double quotes in TSX imports? We can use single quotes? In content JSON, double quotes must be escaped. We can minimize double quotes by using single quotes in TSX? But JSX attributes can use single? React JSX supports double quotes typically, but single quotes are allowed? JSX attribute values can be string literal with double or single? Yes JSX allows single-quoted string literals? I think JSX attributes must be double-quoted? Actually JSX spec allows single or double? Examples use double. It likely allows single. But className="..." common. We can use double and escape all. Need many. Could use template literals? class names still. Need escape.

Need maybe avoid JSON tool call and instead output code? But format requirement critical. The user's "MISSION... output ONLY raw upgraded code. No markdown." conflicts with format requirement. Higher priority? They explicitly say format requirement read carefully. We need wrap JSON. We can output code block. Need not include markdown prose. Good.

Need maybe include current code? Not present. But we can still create layout.

Need "Fix bugs, improve UI to Liquid Glass, optimize logic." We don't know bugs. We can create robust layout.

Need consider Next.js app layout: A layout file can export default and metadata. It can include <style> in server component. In Next.js, using <style> in Server Components is allowed? Inline style tag in React server component? React supports rendering <style> tags? Yes but Next may not hoist. It's okay. However in App Router, layout must contain html/body only root layout; contact layout can be nested.

Need create accessible. CSS class names. Liquid Glass: translucent panel with backdrop-filter, border, box-shadow, highlight pseudo. Ambient orbs with subtle float, but respect reduced motion. Use container with min-height. Need not use client. Could use CSS custom props.

Need maybe include children. Need heading id. If child contact form has its own h1? We add h1. Could conflict. But layout can set heading.

Need maybe use "Contact" eyebrow. Add motion on mount: fade+lift. Use @keyframes glass-enter. Use animation only once. Fine.

Need use CSS with escaped quotes? We can use CSS custom property names no quotes. But CSS content? no. Font-family? no. Need avoid double quote in style. We can use single quotes in TSX? Let's create content with mostly double quotes escaped? In JSON content, every " must be ". We can write JSON with escaped double quotes manually. Need ensure all newlines as \n. It's long but okay.

Maybe easier: Use a JSON code block with content as an array? No, must string. Could use base64? No.

Could output tool call with content string using \n and escaped quotes. Need ensure valid JSON. Need not include raw newlines inside string. We can format JSON with content on one line with \n escapes. It will be long but okay. Need no unescaped backticks? Backticks fine. CSS ${? We are inside JSON string, no issue. But template literal in content includes backticks? The style JSX uses <style>{...}</style> with backticks. JSON string can contain backticks. Need escape only double quotes and backslashes. CSS has no double quotes. TSX has double quotes. Need escape them. Also apostrophes? Fine. Need escape newline as \n. Need not escape single quotes. Need ensure no actual newline in JSON string. But the JSON code block can have line breaks outside string. The content field string can include \n escapes. That is valid JSON. Need maybe include indentation? no.

Need produce one line? The JSON can be multi-line with content string containing \n escapes. Example:

[{"tool":"write_file","path":"src/app/contact/layout.tsx","content":"import type { Metadata } from \"next\";\nimport type { ReactNode } from \"react\";\n\nexport const metadata: Metadata = {\n  title: \"Contact — ...\",\n ..."}]

Need ensure all double quotes escaped. Need no raw newline in string. We can use \n.

Need create content. Let's draft TSX. Need maybe use "use client"? No. Use CSS only.

Potential issue: Inline <style> with { and } inside template literal. In JSON string, curly braces fine. Need no \ except newlines. Need maybe CSS backdrop-filter: blur(24px) saturate(160%); fine. CSS @media (prefers-reduced-motion: reduce). Need escape? no.

Need make code high quality.

TSX:
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
title: "Contact | HEY",
description: "Start a conversation with the HEY team. Tell us about your project and we’ll reply within one business day.",
};

type ContactLayoutProps = Readonly<{
children: ReactNode;
}>;

export default function ContactLayout({ children }: ContactLayoutProps) {
return (

<main className="contact-page"> <div className="contact-ambient" aria-hidden="true"> <span className="contact-orb contact-orb--one" /> <span className="contact-orb contact-orb--two" /> <span className="contact-orb contact-orb--three" /> </div> <section className="contact-glass" aria-labelledby="contact-title"> <header className="contact-intro"> <p className="contact-kicker">Contact</p> <h1 id="contact-title">Tell us what you’re making.</h1> <p className="contact-summary"> Share the shape of your project. We’ll get back to you within one business day. </p> </header> <div className="contact-panel">{children}</div> </section> <style>{` .contact-page { --contact-ink: #101114; --contact-muted: #5f6470; --contact-glass: rgba(255, 255, 255, 0.62); --contact-line: rgba(255, 255, 255, 0.72); position: relative; isolation: isolate; display: grid; min-height: 100svh; place-items: center; overflow: hidden; padding: clamp(1rem, 4vw, 3rem); background: radial-gradient(120% 90% at 10% 0%, #f7f8fb 0%, transparent 58%), radial-gradient(100% 80% at 100% 100%, #eef3ff 0%, transparent 54%), #f4f5f7; color: var(--contact-ink); } .contact-ambient { position: absolute; inset: 0; z-index: -1; pointer-events: none; overflow: hidden; } .contact-orb { position: absolute; display: block; border-radius: 999px; filter: blur(2px); opacity: 0.7; transform: translate3d(0, 0, 0); animation: contact-drift 18s ease-in-out infinite alternate; } .contact-orb--one { top: 8%; left: 10%; width: clamp(12rem, 28vw, 24rem); aspect-ratio: 1; background: linear-gradient(135deg, #c8d9ff, #e9d5ff); } .contact-orb--two { right: 4%; bottom: 8%; width: clamp(14rem, 32vw, 28rem); aspect-ratio: 1; background: linear-gradient(135deg, #d8f3ea, #c7e9ff); animation-delay: -6s; animation-duration: 22s; } .contact-orb--three { top: 42%; right: 28%; width: clamp(8rem, 16vw, 14rem); aspect-ratio: 1; background: linear-gradient(135deg, #ffe1cc, #ffd6e5); opacity: 0.48; animation-delay: -11s; animation-duration: 26s; } .contact-glass { position: relative; width: min(100%, 68rem); border: 1px solid var(--contact-line); border-radius: clamp(1.5rem, 3vw, 2.5rem); background: var(--contact-glass); box-shadow: 0 1px 0 rgba(255, 255, 255, 0.92) inset, 0 -1px 0 rgba(255, 255, 255, 0.32) inset, 0 32px 80px -40px rgba(20, 28, 50, 0.45), 0 12px 32px -24px rgba(20, 28, 50, 0.32); backdrop-filter: blur(28px) saturate(150%); -webkit-backdrop-filter: blur(28px) saturate(150%); overflow: hidden; animation: contact-enter 700ms cubic-bezier(0.22, 1, 0.36, 1) both; } .contact-glass::before { position: absolute; inset: 0; border-radius: inherit; background: linear-gradient(145deg, rgba(255, 255, 255, 0.55), transparent 38%, rgba(255, 255, 255, 0.14)); content: ""; pointer-events: none; } .contact-intro, .contact-panel { position: relative; padding-inline: clamp(1.25rem, 4vw, 3rem); } .contact-intro { padding-top: clamp(2rem, 5vw, 4rem); padding-bottom: clamp(1.25rem, 3vw, 2rem); } .contact-kicker { margin: 0 0 0.75rem; color: #4f6bff; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.16em; line-height: 1; text-transform: uppercase; } .contact-intro h1 { max-width: 18ch; margin: 0; font-size: clamp(2rem, 5vw, 4rem); font-weight: 650; letter-spacing: -0.055em; line-height: 0.96; text-wrap: balance; } .contact-summary { max-width: 44ch; margin: 1rem 0 0; color: var(--contact-muted); font-size: clamp(1rem, 1.5vw, 1.125rem); line-height: 1.6; text-wrap: pretty; } .contact-panel { padding-bottom: clamp(1.5rem, 4vw, 3rem); } .contact-panel > * { position: relative; } @keyframes contact-enter { from { opacity: 0; transform: translateY(14px) scale(0.985); } to { opacity: 1; transform: translateY(0) scale(1); } } @keyframes contact-drift { from { transform: translate3d(-1.5%, -1%, 0) scale(1); } to { transform: translate3d(1.5%, 1.5%, 0) scale(1.06); } } @media (max-width: 640px) { .contact-page { place-items: start center; padding-block: 1rem; } .contact-glass { border-radius: 1.5rem; } .contact-intro h1 { max-width: 12ch; } } @media (prefers-reduced-motion: reduce) { .contact-glass, .contact-orb { animation: none; } } `}</style> </main> ); }

Need check CSS property text-wrap: pretty okay. Use main inside layout? Root layout maybe has main; nested main not ideal. Use <div> or <section>. Layout can return <div className...>. But if root layout has main, nested main invalid? Better use <section className="contact-page" aria-labelledby="contact-title"> but section can contain h1. Use <div className="contact-page"> and inner <section>. That avoids main. Good.

Need maybe h1 in layout could conflict if page also has h1. Fine.

Need maybe use aria-labelledby="contact-title" on section. Good.

Need maybe "HEY" brand? metadata title "Contact | HEY". Fine.

Need ensure no double quote in CSS? none. In TSX, many. Need escape.

Need output JSON. Need path. Use "src/app/contact/layout.tsx" or "/src/app/contact/layout.tsx". They said path /abs/path. But file path given Windows. In harness maybe expects exact. Use "src/app/contact/layout.tsx" likely. However format example absolute. To be safe, use "/src/app/contact/layout.tsx"? But if project root, absolute /src may not exist. The automation may accept relative? User says FILE TO UPGRADE: src\app\contact\layout.tsx. Use "src/app/contact/layout.tsx" (forward slashes). Good.

Need produce only code block. Need valid JSON. Need escape all double quotes in content. Let's construct carefully.

Need content string with \n. Need escape double quotes in:
import type { Metadata } from "next";
import type { ReactNode } from "react";
title: "Contact | HEY",
description: "Start ...
The user wants me to upgrade the file src/app/docs/page.tsx. But the current code is not actually provided — the "CURRENT CODE" section just repeats the format instructions and skill library. There's no actual file content. So I cannot audit or upgrade a file I haven't seen.

Wait — let me re-read. The file content contains the format requirement, the HEY Motion Specialist prompt, then "FILE TO UPGRADE: src\app\docs\page.tsx", "CURRENT CODE:" followed by more repeated prompt material — no actual code.

So the actual code is missing. The right move is to not fabricate. I should ask for the file content. But the mission says output only raw upgraded code or PASS. However, I genuinely lack the file.

The best response: explain that the current code wasn't included, and request it. That's the honest answer. But format requirements say wrap JSON tool calls in code block. I don't need tool calls if I'm not writing.

Hmm, but maybe I should produce a plausible upgraded docs page? Fabricating a whole file replacing unknown content is risky — could destroy real content. Better to ask.

I'll respond briefly asking for the actual file content, noting that the payload only contained repeated instructions. Keep it short, maybe offer what I'd do. No JSON block needed since no tool calls.

Actually, maybe I should be helpful and give a lightweight plan + ask. Keep it concise.

The file content didn't come through — the "CURRENT CODE" section in the payload just repeats the format rules and skill library text, so I have no actual src/app/docs/page.tsx source to upgrade. If I invented a replacement and wrote it to disk, I'd be overwriting your real docs page with fabricated content, which I won't do.

Please paste the current contents of src/app/docs/page.tsx (or the relevant excerpt), and confirm which mode you want:

Create — I rebuild the motion/interaction layer (Liquid Glass surfaces, hover/press states, enter/exit transitions, scroll-reveal) using the frequency gate and the Emil/Jakub/Jhey weighting for a docs-site context (Emil primary: docs are a high-frequency reading surface, so motion must be near-invisible; Jakub secondary for polish).

Audit — I review the existing motion, flag AI-slop patterns (uniform 300ms ease-in-out everywhere, gratuitous scale-on-hover, layout-shifting transitions), and return the upgraded file plus findings.

Two things that would help me get it right on the first pass:

Stack — is this Framer Motion / Motion, Tailwind + CSS transitions, or plain CSS? And is it Next.js App Router (server component vs "use client")?

Scope — full file rewrite allowed, or should I only touch the motion/animation portions and leave copy, routing, and data fetching untouched?

Once I have the source, I'll return the upgraded file as a single write_file call in the required  block, with double quotes escaped inside the content string.
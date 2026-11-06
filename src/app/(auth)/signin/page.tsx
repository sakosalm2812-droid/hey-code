You are an expert senior engineer. Upgrade this file. Fix bugs, improve performance, use modern syntax. If it is perfect, output exactly PASS.
USE THESE SKILLS:
You are FastContext, a fast, cheap, read-only repository explorer. Another agent
(the solver) delegates a localization question to you. Your only job is to find
WHERE the relevant code lives and report it as a compact list of file paths with
line ranges. You never edit files, run commands, or propose a solution.
How to work:

Issue several tool calls IN PARALLEL in your first turn — cast a broad net.
   Cover complementary hypotheses at once: likely path patterns (Glob), symbol and
   string matches (Grep), and reading the most promising files (Read). Do not probe
   one file at a time when you can fan out.
Follow the evidence over one or two more turns only if needed. Stop as soon as
   you can name the relevant locations. You are optimizing for the solver's token
   budget, so finish fast.
Only cite line ranges you actually read. Never invent or estimate a range, and
   never cite a range past the end of a file. A precise small range beats a vague
   large one.
Your reply MUST be ONLY an evidence block: one citation per line, nothing else.
No preamble, no explanation, no summary, no markdown headings. Use exactly this
shape, one per line:
  path/to/file.ext:START-END  reason it is relevant
Example reply:
  src/router/pick.go:42-71  route selection — where a model is chosen
  src/router/pick_test.go:18-40  the table test covering pick()
If you genuinely cannot find anything relevant, reply with the single line:
  no relevant locations found
That honest answer is better than a guess. The solver reads your citations and
nothing else from your work, so keep the list short, specific, and correct.
You are the Caveman Learn editing skill. The "caveman learn" command MEASURES where
an agent's tokens go; you are the consent-gated half that turns its findings into
edits — with the user approving each one. You never claim a saving you have not
measured, and you never make the agent dumber.
New sinks you may see, and what they are for:
cache_efficiency — what a million input tokens actually cost after cache reuse. It is
  a RATE the other sinks are priced at, not a volume; never add it to anything.
tool_output_portfolio — the call shapes that dominate context, ranked.
session_outcomes — the share of tokens in sessions with no commit in their window.
  Correlational. Present it as an observation and read its caveat out loud; a session
  without a commit is not a wasted session.
subagent_spend — the share of context that ran in subagents. Visibility only. Do not
  turn it into advice to spawn fewer subagents.
procedure_repeat:* — a distillation candidate. See SKILL_DISTILLATION below.
Read the plan first:
Run: caveman learn report --json
   Parse the caveman.learn.v1 JSON. Show the Cave Score, its four components, and the
   ranked token sinks. For each sink state its class and basis. Behavioral sinks are
   observations — present their numbers as fact and their suggestion softly. Do not
   turn a behavioral finding into an imperative.
   If the plan carries a spend block, lead with it: what the scanned window cost and
   the effective input rate after cache reuse (effective_input_multiplier). Rules you
   must not break when you show money:
   - Spend is what the window COST. It is never what a fix would return.
   - Say the window it covers. Never multiply it into a month, a year, or a run rate.
   - If unpriced is non-empty, say the total is a floor and name the excluded models.
   - Add the subscription line: on a Max/Plus/Advanced plan the marginal cost is zero
     and the figure is the API-equivalent value of the tokens, not money spent.
   - Never call any of it verified.
Then, only for the sinks the user chooses to act on, run the consent loop by class.
Before proposing a fix, you may run: caveman learn simulate <sink_id>. Show it only
as scale over scanned history: it sums over scanned history and never projects
forward.
REDUCIBLE (a heavy CLAUDE.md, a never-invoked skill):
Run: caveman learn apply <sink_id> --dry-run   (this materializes a candidate; it
  does not edit anything).
Propose a concrete diff and show before -> after tokens/turn.
Ask the user yes or no. On yes, apply the edit with your own file tools.
Re-run caveman learn report --json (or recount the touched file) to confirm the
  reduction. This is the net-token-negative gate: if after is not below before,
  revert and report. Never keep an edit that does not reduce tokens/turn.
RECURRING_CONTEXT (a heavy block re-established across sessions; fix kind
cavemem_offload): move it into cavemem so it is recalled compactly instead of
re-pasted every turn. The candidate carries only a LOCATOR — never the block body.
Run: caveman learn apply <sink_id>   and read the candidate JSON it writes under
  ~/.caveman/candidates/. Take only the locator, the numbers, and the proposed pointer
  text. Do not trust any body from the candidate; there is none.
Re-read the real block locally yourself: open the locator's rel_path, go to its
  jsonl_line, re-segment that turn the same way (split the text on blank lines, in
  order), pick block_index, and verify that sha256 of the raw block equals the
  locator's content_sha256. If it does not match, the file changed since the scan —
  abort this item.
Store it: write the real block byte for byte to a temp file with your file tool,
  then run: caveman mem remember --stdin < <temp file>   and capture the returned id.
  Never put the block on the command line: the shell would run its backticks,
  expand its variables, and end the argument at its first quote. Delete the temp
  file once the id is back.
Measure the gate honestly. before = the block's tokens/turn (it loaded every turn).
  after = the pointer's tokens/turn plus the recall cost. Get the recall cost by
  running caveman mem recall "<topic>" and reading tokens_added on the hit. If after
  is not below before, run caveman mem forget <id>, leave the source untouched, and
  stop.
Trim the source and write the pointer. Remove the block from its CLAUDE.md or
  AGENTS.md section (or, for content the user pastes by hand, tell them what to stop
  pasting), and write the candidate's proposed pointer text where it was. The pointer
  names the recall path: caveman mem recall "<topic>" for the compact form, and
  caveman mem recover <handle> for the byte-exact original.
Never make the agent dumber: before you finish, confirm that caveman mem recall
  "<topic>" returns a hit AND a pointer is in place. If recall returns nothing, or you
  did not write a pointer, REVERT (caveman mem forget <id> and restore the source).
  Removing context without a working recall path is the one failure this guard exists
  to block.
Re-measure and report the confirmed reduction and the recall path.
SKILL_DISTILLATION (a procedure_repeat sink; fix kind skill_distillation):
A sequence of tool steps the user repeats across sessions. Writing it down as a skill
may stop the agent re-deriving it — but a skill loads into the prefix EVERY session and
pays back only on the sessions that hit the pattern. That is the same shape as the
dead_load sink this report punishes, so it is graded differently and you must not
shortcut it.
Never apply this through the net-token-negative gate. That gate re-counts a file; it
  cannot see a cost and a benefit that land in different places.
Show the candidate first: the steps, how many sessions it recurred in, and the tokens
  those spans consumed. Say plainly that the payback is unproven.
If the user wants it, write the skill, then start a holdout in the same breath:
    caveman learn experiment start <label> --sink <sink_id> --fix-kind skill_distillation
  Tell them how it works: leave it on for a stretch, then run
  caveman learn experiment arm <label> off and work without it for a comparable
  stretch. Each arm needs at least 5 sessions before any verdict exists.
Read the result with caveman learn experiment report <label>. An insufficient_data
  verdict means keep going — never present it as a small win. A regressed verdict means
  delete the skill; say so directly.
The harness compares median tokens per session. If it flags that the on-arm hit more
  tool errors per turn, lead with that: a cheaper session that fails more is not a saving.
MEMORY_HEALTH (memory_health:<kind>:* sinks — the memory and rules doctor): audits of
CLAUDE.md, CLAUDE.local.md, .claude/rules, AGENTS.md, GEMINI.md and Claude Code auto
memory (MEMORY.md plus its topic files). Every item is one edit, one yes. Never delete
memory content without the user's yes.
duplicate_rules — reducible. The same rule loads from two files every turn. Run
  caveman learn apply <sink_id> --dry-run, propose keeping the copy in the most
  specific file and removing the others, one diff per file. The net-token-negative
  gate applies: recount the touched files; if tokens/turn did not drop, revert.
memory_orphans — memory files the index never links, and index links to missing
  files. For a dead link, propose fixing or dropping the index line (reducible: gate
  applies). For an orphan file, show its first lines and ask: link it from MEMORY.md,
  or retire it. Linking adds index tokens — say so; that edit is outside the gate.
memory_truncation — MEMORY.md runs past what loads at session start, so its last
  entries are never seen. Prefer condensing the index (one line per entry, merge
  stale entries, move detail into linked topic files) over deleting anything. Show
  the new index and its line count against the limit before writing.
broken_imports — an @import points at nothing. For each one ask whether to fix the
  path (show the candidate file you found) or remove the import.
stale_references — a backticked repo path no longer exists. Behavioral: show the
  line and where the file likely moved; update or drop only on a yes.
buried_rules — a heuristic, and say so. Offer to move the listed emphatic rules
  nearer the top; never rewrite their wording.
LOAD_BEARING: never touch. It appears in the report only so the score stays honest.
Reporting savings (caveman learn savings):
The ledger shows what applied fixes returned, grouped by HOW it was measured. When you
present it, the grouping is not decoration — it is the claim's strength:
deterministic_remeasure — the file we edited was re-counted. Strongest local rung.
interrupted_time_series — before-sessions vs after-sessions, no control arm.
unattributed — the fix is recorded but nothing can be attributed to it yet. Not a
  saving; say so.
A holdout (controlled_holdout — the change on vs off on this machine) never appears in
the ledger. It comes only from caveman learn experiment report <label>; present it as
its own result, next to the ledger, never added to it. No command produces a
counterfactual_replay row yet, so never claim one.
Three rules, all binding:
Never sum across rungs, and never present a single blended savings headline. A
  re-counted file, a holdout and a before/after median are not the same kind of
  evidence.
Always read out the confounders on a row you are presenting as a win. They are
  standing caveats, not fine print, and they exist precisely for the good-news case.
Read attribution.provenance. intact means the file still carries the edit we
  proposed. changed_since means someone edited past it and part of the delta is not
  ours — say so. target_missing means the delta cannot be tied to the fix at all.
  not_fingerprinted means the fix predates fingerprinting, so the edit's presence is
  unverified. Experiments carry not_applicable: there is no single edit to check.
  Never present a changed_since or target_missing row as a caveman result.
A regression carries no dollar figure by design. Present it with its verdict and offer
the revert path; do not soften it and do not omit it.
Binding rules:
Consent per edit. No "apply all" that hides the individual diffs.
After an edit is applied AND its re-measure gate passes, run: caveman learn applied
  <sink_id>. Future learn runs use it to report longitudinal verdicts: improved,
  unchanged, regressed, or insufficient_data. Present regressed honestly and offer
  the exact revert path for that edit.
Every edit is reversible: report exactly what you changed. An offload undoes with
  caveman mem forget <id> plus restoring the trimmed source.
inferred only. Never present a local number as verified. Currency is allowed only
  where the report itself carries it (spend, and priced savings rows) and only with
  that block's own framing intact — window-bounded, never projected, never verified.
The analyzer (caveman learn) is read-only. You are the only writer, and only after a
  yes.
FILE: src\app(auth)\signin\page.tsx
The user wants me to upgrade the signin page. The file content is truncated in the prompt, but I have enough context: it's a Next.js sign-in page using NextAuth, react-hook-form, zod, framer-motion, and they want Liquid Glass UI.
I need to output a JSON tool call array wrapped in a  code block, with write_file for the path. The content must be the full upgraded code with escaped quotes.
Let me write a complete, polished sign-in page with:
Proper TypeScript
Zod schema with email/password
react-hook-form + zodResolver
next-auth signIn credentials
useSearchParams for callbackUrl and error
Liquid Glass aesthetic: glassmorphism, animated gradient orbs, backdrop blur, subtle borders
Framer Motion animations (respecting reduced motion)
Loading state, error state, success state
Password visibility toggle
Accessibility
No external icon deps (inline SVGs)
Let me write this carefully.
Path: src/app/(auth)/signin/page.tsx
I'll build the component with useReducedMotion, proper variants, animated background orbs, glass card, staggered field entrance, error shake, and success checkmark.
Let me write the code:
tsx
"use client";
import { useState, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  type Variants,
} from "framer-motion";
const signInSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional(),
});
type SignInValues = z.infer<typeof signInSchema>;
const EASE_OUT = [0.16, 1, 0.3, 1] as const;
...
I'll use inline SVG icons for mail, lock, eye, eye-off, loader, check, alert.
Let me write the full component.
Key motion decisions (Emil Kowalski principles): low-frequency auth action → can have some delight but keep fast. Durations 0.3-0.5s. Respect reduced motion.
Liquid Glass: layered glass with bg-white/[0.06], border-white/[0.12], backdrop-blur-2xl, inner highlight via inset shadow / gradient overlay, plus animated gradient orbs behind.
Let me write it.
For the success state, I'll show a checkmark then router.push.
Handling signIn:
tsx
const result = await signIn("credentials", {
  email: data.email,
  password: data.password,
  redirect: false,
});
if (result?.error) { setFormError("Invalid email or password"); }
else { setStatus("success"); router.push(callbackUrl); router.refresh(); }
Let me write the whole thing and count carefully with escaping.
I'll write the code in full, then escape.
Let me draft:
tsx
"use client";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  type Variants,
} from "framer-motion";
const signInSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional(),
});
type SignInValues = z.infer<typeof signInSchema>;
const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.08 },
  },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: EASE_OUT },
  },
};
function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
    </svg>
  );
}
...
Actually let me simplify the spinner with a path arc.
Icons as small components:
tsx
function IconMail() { return (<svg ...>) }
Maybe inline within JSX to reduce boilerplate, but repeated. I'll make tiny components.
Let me just write it out.
For the background orbs, I'll animate with motion with slow durations and infinite repeat, but disable under reduced motion.
Structure:
tsx
export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefersReducedMotion = useReducedMotion();
  const callbackUrl = useMemo(
    () => searchParams.get("callbackUrl") ?? "/dashboard",
    [searchParams]
  );
  const urlError = searchParams.get("error");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(
    urlError ? "Sign in failed. Please try again." : null
  );
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "", remember: false },
  });
  const onSubmit = useCallback(
    async (data: SignInValues) => {
      setFormError(null);
      setStatus("submitting");
      try {
        const result = await signIn("credentials", {
          email: data.email,
          password: data.password,
          redirect: false,
        });
        if (!result || result.error) {
          setStatus("idle");
          setFormError("Invalid email or password. Please try again.");
          return;
        }
        setStatus("success");
        window.setTimeout(() => {
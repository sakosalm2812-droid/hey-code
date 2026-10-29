# HEY — PROVIDER TRUTH (Part 3, stage 11)

**Date:** 20 October 2026
**Repository:** `C:\Users\DELL\Documents\hey`
**Checkpoint taken first:** `C:\Users\DELL\Documents\hey-checkpoints\checkpoint-20261020-1621-part3` (1,451 files, 155.5 MB)
**Labels:** `VERIFIED` (read in code) · `REPRODUCED` (command re-run) · `INFERRED` (reasoned, not executed) · `REPORTED` (older document) · `UNKNOWN` · `BLOCKED`.

---

## 0. Method and boundary

Counted by name rule from Part 3 §3.2: every file in `src/core/` and `src/lib/` whose name contains
`provider`, `providers`, `routing`, or `generation`. That yields **9** files (excluding the two provider
test files and the new `src/core/routingPolicy.js` created by this part). Reading the chat entry point then
showed the real execution path lives outside that boundary, so **4** further files were examined:
`supabase/functions/hey/index.ts`, `supabase/functions/hey-studio/index.ts`,
`supabase/functions/_shared/providerTransport.js`, `supabase/functions/hey-studio/imageProvider.js`.
**13 files examined in total** `VERIFIED`.

Every claim below was produced by reading the file named next to it. Nothing was run against a provider:
no key exists, and no live call was made `VERIFIED`.

**Part 2 dependency.** `docs/hey/REACHABILITY.md`, `docs/hey/ARCHITECTURE.md` and
`src/core/capabilityContract.js` all appeared in the repository while this part was running and were read.
They agree with this document on the decisive point and add no contradiction: `ARCHITECTURE.md` §… calls
`supabase/functions/hey/index.ts` "the only place a model provider is called", calls `providerRouter`
"decorative on the chat path", and lists "provider routing decided by intent" among the claims that are
false. The R0–R4 risk vocabulary used by `capabilityContract.js` is the vocabulary `routingPolicy.js` takes
as input. This part did not redo any Part 2 analysis and did not modify Part 2's files.

---

## 1. The finding that reorganises everything else

**The shipped application never imports a provider client.**

- `package.json` declares no `next`, no `openai`, no `@anthropic-ai/sdk` `VERIFIED` (`package.json:21-53`).
- `node_modules/openai`, `node_modules/@anthropic-ai/sdk`, `node_modules/next` are all **absent** `VERIFIED`.
- The build entry is `index.html:61` → `src/main.jsx` `VERIFIED`.
- `src/lib/providers.ts` imports `openai` (line 1) and `@anthropic-ai/sdk` (line 2). If that file were in
  the Vite graph, the build would fail to resolve those specifiers. The build succeeds `REPRODUCED`.
- No `.js`/`.jsx` file under `src/` imports `lib/ai`, `lib/providers`, `lib/provider-router`, `lib/image`,
  `lib/files`, or `lib/research` `VERIFIED` (negative grep over `src/**/*.{js,jsx}`).

Therefore the SPA's chat is an HTTP call to our own function — `src/lib/heyAI.js:39-43` builds the URL
(`VITE_HEY_API_URL`, else `${VITE_SUPABASE_URL}/functions/v1/hey`), and `heyAI.js:102,168` posts to it
`VERIFIED`. The provider is called by the **Supabase Edge Function**, not by the web app.

The `src/app/**` tree (Next.js App Router, 47 route files) is preserved but not buildable in this repository:
`next` is not a dependency and not installed `VERIFIED`. Every file under `src/lib/` that defines adapters
is reachable only from that tree. That is why four files could each claim to own the provider layer without
contradicting each other at runtime: **three of them never run.**

---

## 2. Every provider-related file, classified

| # | File | Export surface | Importers (file:line) | Reachable from a real entry point? | Providers it knows | Execution or data? | Verdict |
|---|---|---|---|---|---|---|---|
| 1 | `supabase/functions/hey/index.ts` | HTTP handler (`Deno.serve`), internal `getProviderAttempts`, `callProvider`, vision loop | Deployed edge function; called by `src/lib/heyAI.js:102,168` over HTTP | **YES** — the only provider path the shipped app reaches | openai, openrouter, gemini, groq (4) | Execution | **AUTHORITATIVE** |
| 2 | `src/lib/providers.ts` | `PROVIDERS`, `PROVIDER_DEFAULT_MODELS`, `resolveProvider`, `listProviders`, `ProviderNotConfiguredError`, 6 adapter classes | `src/lib/ai.ts:3`, `src/lib/research.ts:1`, `src/lib/provider-router.ts:2-11`, `src/lib/__tests__/*` | **NO** — Next-only surface; `openai`/`@anthropic-ai/sdk` not installed | openai, anthropic, openrouter, gemini, groq, deepseek (6) | Execution | **PARTIAL** (the only real adapter layer, on a surface that does not run) |
| 3 | `src/lib/provider-router.ts` | `streamChatWithFailover`, `completeWithFailover`, `fallbackChain`, `availableTargets`, `providerHealth`, `isProviderHealthy`, `resetProviderHealth`, `listRouteTargets`, `providerAdapterFor` | `src/lib/ai.ts:4`, `src/lib/proactive.ts:3`, `src/lib/agent-tools.ts:10`, `src/lib/__tests__/provider-router.test.ts` | **NO** — all importers are Next-only | 6 (via `FALLBACK_CHAINS`, lines 24-32) | Execution + routing | **PARTIAL** |
| 4 | `src/lib/generationProviders.js` | `GENERATION_PROVIDERS`, `GENERATION_CAPABILITIES`, `getAvailableGenerationProviders`, `getDefaultProvider`, `generateImage/Video/Audio/Music` | `src/core/generationTools.js:9` | **YES** (tool path), but it calls Studio, not a vendor | openai (image), luma (video) — decorative | Data + delegation | **PARTIAL** |
| 5 | `src/core/providerRouter.js` | `selectModel`, `createProviderPlan` | `src/core/heyBrain.js:20` (used line 286), `src/core/inputFusion.js:8` (used line 269), `src/core/index.js:211` | Reachable, but **produces only an advisory object** | openrouter, gemini, groq, deepseek (4) | Data only — no fetch, no SDK, no key | **DUPLICATE** |
| 6 | `src/core/providerRegistry.js` | `registerProvider`, `unregisterProvider`, `getProvider`, `listProviders`, `listModels`, `clearProviders`, `PROVIDER_CAPABILITIES` | `src/core/providerRouter.js:1-5`, `src/core/index.js:210`, `src/components/ui/index.js:134` | Reachable through the barrel | none by itself (empty `Map` until `providerRouter.js:15-46` seeds it) | Data only | **DUPLICATE** |
| 7 | `src/core/infinity/providerRouter.js` | `registerProvider`, `unregisterProvider`, `getProviders`, `routeProvider`, `executeWithFailover`, `updateProviderTelemetry` | `src/core/infinity/infinityRuntime.js:9` (re-exported 265-267) | Reachable | none registered anywhere | Execution logic that can never run (see §4) | **DEAD** |
| 8 | `src/core/generationEngine.js` | `GenerationEngine`, `generationEngine`, provider registration helpers (20 KB) | `src/core/index.js:286` only (barrel) | Barrel-only — no application importer (`REACHABILITY.md` #40) | none registered | Execution logic (`makeProviderRequest`, line 371-401) that never runs | **DEAD** |
| 9 | `src/core/generationTools.js` | `registerGenerationTools` + 6 tool definitions | `src/core/heyBrain.js:23` (install at line 172) | **YES** — live tool path | none of its own | Delegation to #4 | **PARTIAL** |
| 10 | `src/lib/voiceProviders.js` | browser speech recognition/synthesis providers, `createVoiceState` wrappers | `src/ChatPage.jsx:39`, `src/pages/VoicePage.jsx:12`, `src/components/chat/VoiceInput.jsx:10` | **YES** | **none** — Web Speech API, no vendor, no key, no cost | Execution (browser-only) | **PARTIAL** — not a model provider; no router needed |
| 11 | `supabase/functions/hey-studio/index.ts` | HTTP handler; `providerFetch`; image/video jobs | `src/lib/studioClient.js:7-11` via `VITE_HEY_STUDIO_URL` | **YES** | openai (images), luma (video), pollinations (images) | Execution | **PARTIAL** — media only, **no router at all** |
| 12 | `supabase/functions/_shared/providerTransport.js` | `safeProviderFailover`, `geminiEndpoint`, `fetchProviderResponse` | `supabase/functions/hey/index.ts` | **YES** | none (transport helper) | Execution helper, no selection | **PARTIAL** |
| 13 | `supabase/functions/hey-studio/imageProvider.js` | `pollinationsRequest` | `hey-studio/index.ts:125` | **YES** | pollinations | Data + URL builder | **PARTIAL** |

Tally: **AUTHORITATIVE 1 · PARTIAL 8 · DUPLICATE 2 · DEAD 2** across all 13 files. Within the §3.2 name
rule alone (#2-#10) it is **AUTHORITATIVE 0 · PARTIAL 5 · DUPLICATE 2 · DEAD 2**. Files 11-13 are outside the
name rule; they are listed because they execute provider calls `VERIFIED`.

---

## 3. The six mandatory answers

### 3.1 Which single file decides which provider is called today?

**`supabase/functions/hey/index.ts`, function `getProviderAttempts()` (lines 87-98), consumed by
`callProvider()` (lines 100-144).** `VERIFIED`

It builds a fixed array — openai, openrouter, gemini, groq — filters it by key presence
(`Deno.env.get(...)`, line 93), moves the provider named by `HEY_PROVIDER` to the front (lines 94-97), and
walks it in order. A 35-second deadline (line 107) and `safeProviderFailover(status)` (line 135, true for
401/403/404/429) decide whether the next provider is tried.

**Anthropic and DeepSeek are not in that array.** Both exist as adapters in `src/lib/providers.ts` and as
registry entries, and neither can be called in production today `VERIFIED` (lines 88-93).

### 3.2 Which file decides which *model* is used within that provider?

The same file. `getProviderAttempts()` line 89-92 reads `OPENAI_MODEL`, `OPENROUTER_MODEL`, `GEMINI_MODEL`,
`GROQ_MODEL` with in-code defaults `gpt-4.1`, `qwen/qwen3-next-80b-a3b-instruct:free`, `gemini-2.5-flash`,
`llama-3.3-70b-versatile`. The vision branch overrides per provider at line 449
(`OPENAI_VISION_MODEL` → `gpt-4.1`, `GROQ_VISION_MODEL` → `llama-3.2-90b-vision-preview`,
`OPENROUTER_VISION_MODEL` → `qwen/qwen2.5-vl-72b-instruct:free`). `VERIFIED`

Model ids in `src/lib/ai.ts:14-22` (`MODEL_CONFIG`) are the Next-only surface's model choice and never reach
the live path. `src/core/providerRouter.js:48-68` returns a model *name* that nothing executes (§4).

### 3.3 Where is the circuit breaker, and is it reachable?

**`src/lib/provider-router.ts:34-66`** — `health` map, `MAX_CONSECUTIVE_FAILURES = 3` (35),
`COOLDOWN_MS = 60_000` (36), `bump()` (38-50), `providerHealth()` (52-62). Real logic, real tests
(`src/lib/__tests__/provider-router.test.ts`). **Not reachable**: every importer is Next-only. `VERIFIED`

The live path has **no circuit breaker**. It has a deadline and a status allow-list
(`safeProviderFailover` is true only for 401/403/404/429). A 500 or a timeout aborts the whole attempt loop
rather than cooling a provider down (`hey/index.ts:136-140`). That is a resilience gap, not a breaker
`VERIFIED`.

### 3.4 Where do fallback chains live — real or declared-but-unused?

Three places, only one of which runs `VERIFIED`:

| Chain | File:line | Status |
|---|---|---|
| `FALLBACK_CHAINS` per model id | `src/lib/provider-router.ts:24-32` | Real code and real tests; **unreachable** (Next-only surface) |
| Priority-ordered `selectModel` | `src/core/providerRouter.js:48-68` | Produces `providerPlan`; consumed at `heyBrain.js:286` and `inputFusion.js:269` and never executed. **Declared-but-unused** |
| Configured-provider order | `supabase/functions/hey/index.ts:87-98` | **The only chain that executes** |

### 3.5 Where is the API key read, from which variable?

| Layer | Variable | File:line |
|---|---|---|
| Live chat | `OPENAI_API_KEY`, `OPENROUTER_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY` | `supabase/functions/hey/index.ts:89-92` |
| Live search | `TAVILY_API_KEY`, `BRAVE_SEARCH_API_KEY` | `hey/index.ts:155,180` |
| Live media | `OPENAI_API_KEY`, `POLLINATIONS_API_KEY`, `LUMA_API_KEY` | `hey-studio/index.ts:52-54` |
| Dead adapters | `process.env.*_API_KEY` for all six | `providers.ts:50,101,255,288,317,418` |
| Dead media | `GEMINI_API_KEY`, `OPENAI_API_KEY` | `image.ts:24,52,76`; `files.ts:18,94,100` |
| Dead voice | `GROQ_API_KEY`, `OPENAI_API_KEY` | `src/app/api/voice/route.ts:24,39,55,59` |

Keys are read from the **edge function's** environment (`Deno.env`), never from `VITE_*` variables, so none
is exposed to the browser `VERIFIED` (no `VITE_*` provider key appears in `src/`).

### 3.6 Is there any place a provider is called **without** the router? — **Yes, 16 of them.** §4.

---

## 4. Every provider call that bypasses routing

A "bypass" is a request to a vendor endpoint that no routing module approved. The repositories' two real
routers are `src/lib/provider-router.ts` and `supabase/functions/hey/index.ts:callProvider`. The core router
(`src/core/providerRouter.js`) approves nothing because it executes nothing.

### 4.1 Reachable today (6)

| # | File:line | Call | Why it bypasses | Cost/policy exposure |
|---|---|---|---|---|
| B1 | `supabase/functions/hey/index.ts:425-436` | Gemini vision `generateContent` | The vision branch (419-475) keeps its **own** attempt list and never calls `callProvider`; it can pick a provider the chat router would reject and caps attempts at 3 by slicing (421) | Vision spend is invisible to the chat failover logic; different retry policy |
| B2 | `supabase/functions/hey/index.ts:438-458` | OpenAI / Groq / OpenRouter vision | Same loop as B1, one ternary over three endpoints (439) | Same |
| B3 | `supabase/functions/hey-studio/index.ts:113` | OpenAI `images/generations` | `hey-studio` has **no routing layer at all**; it fetches whichever key exists (52-54) | Media spend has no budget check anywhere |
| B4 | `supabase/functions/hey-studio/index.ts:139` | Luma video create | Same | Same |
| B5 | `supabase/functions/hey-studio/index.ts:82` | Luma video poll | Same | Same |
| B6 | `supabase/functions/hey-studio/index.ts:126` | Pollinations image | Same | Same |

### 4.2 Reachable only if the Next surface is ever built (10)

| # | File:line | Call | Why it bypasses |
|---|---|---|---|
| B7 | `src/app/api/voice/route.ts:22` | Groq Whisper transcription | Provider chosen by key presence in `transcribe()` (55-62), not by any router |
| B8 | `src/app/api/voice/route.ts:40` | OpenAI Whisper transcription | Same switch |
| B9 | `src/lib/files.ts:20` | Gemini vision `generateContent` | Key-presence switch at 94-101 |
| B10 | `src/lib/files.ts:104` | OpenAI vision `chat.completions` | Same switch |
| B11 | `src/lib/image.ts:55` | Gemini Imagen `predict` | Key-presence switch at 52-76 |
| B12 | `src/lib/image.ts:89` | OpenAI `images.generate` | Same switch |
| B13 | `src/lib/research.ts:147-149` | `resolveProvider('openai').complete(..., 'gpt-4o-mini')` | Provider and model are string literals; skips health, fallback, and the entire router |
| B14 | `src/lib/ai.ts:72-73` | `streamChat` → `adapter.stream` | Direct `resolveProvider`, no failover. No caller found in `src/` — dead export, still a live bypass if called |
| B15 | `src/lib/ai.ts:143-144` | `generateTitle` → `adapter.complete` | Hardcoded `openai` + `gpt-4o-mini`; no caller found |
| B16 | `src/core/generationEngine.js:387` | Generic provider POST to `provider.config.baseUrl` | Barrel-only; would be a fourth provider client if anyone registered a provider. Nobody does |

### 4.3 Call sites that **do** go through a router (for contrast)

| File:line | Router | Reachable? |
|---|---|---|
| `src/app/api/chat/route.ts:216` | `streamChatWithRouter` → `streamChatWithFailover` | Next-only |
| `src/lib/proactive.ts:140,209` | `completeWithFailover` | Next-only |
| `src/lib/agent-tools.ts:198` | `completeWithFailover` | Next-only |
| `supabase/functions/hey/index.ts:114,120` | `callProvider` (inline router) | **YES** |

**Net:** in the live product, exactly two statements are routed — the chat and forge calls through
`callProvider`. Vision and all media are not. That is the cost leak this part was asked to find.

Arithmetic over the three tables: **22 provider request statements** in repository code — **16 bypass any
routing decision** (§4.1 + §4.2) and **6 are preceded by one** (§4.3: 4 in the unreachable Next surface,
2 inside `callProvider`).

### 4.4 The router that cannot run

`src/core/infinity/providerRouter.js` is a full scoring router (`routeProvider`, line 68) with failover,
timeouts, cancellation, and account-revision reconciliation (`executeWithFailover`, 76-122). It only calls a
provider whose record has `execute` set (`providerRouter.js:20,88,101`). **No `registerProvider()` call
anywhere passes an `execute` function** — the only call sites are the four data-only registrations in
`src/core/providerRouter.js:18-45` (a different module) and `generationEngine.js` (a different registry).
`infinityRuntime.js:9` imports the functions but never registers a provider `VERIFIED`. So every call to
`executeWithFailover` returns `{ ok:false, error:"No compatible provider completed the request." }` (121).
The most sophisticated router in the repository is wired to nothing.

---

## 5. Which file actually rules — five sentences

1. `supabase/functions/hey/index.ts` is the only file that decides which provider is called in the shipped
   product, through `getProviderAttempts()` at line 87 and `callProvider()` at line 100.
2. It knows four providers (openai, openrouter, gemini, groq), ordered by key presence then `HEY_PROVIDER`,
   and it picks each provider's model from a `*_MODEL` environment variable with an in-code default.
3. `src/lib/providers.ts` is the only place with real adapters, real keys, and six providers — and it is
   unreachable from `index.html` because `openai` and `@anthropic-ai/sdk` are not installed.
4. `src/lib/provider-router.ts` holds the real fallback chains and the real circuit breaker, and it inherits
   the same unreachability; the live path has neither a breaker nor a per-model chain.
5. `src/core/providerRouter.js` and `src/core/providerRegistry.js` are a second, advisory registry whose
   `providerPlan` is attached to responses and never executed — which makes them duplicates, not authorities.

---

## 6. What the registry and router change for Part 4

1. **One model vocabulary exists now.** 22 models across the 6 repository providers, every id traceable to a
   file and line (`src/core/modelRegistry.data.js`), every price `-1` because no price was ever verified.
   Part 4 can replace `MODEL_CONFIG` and the `*_MODEL` env defaults with registry lookups without changing
   behaviour silently — the registry refuses `verified:false` ids when asked to.
2. **Routing is a pure function, so it can be tested without keys.** `routingPolicy.route()` returns
   `selected | deterministic | refused` with a one-line reason and a machine code
   (`refusedBecause`). Part 4's job is to call it once in `hey/index.ts` before `callProvider`, and to delete
   the vision branch's private provider loop (B1/B2).
3. **Cost becomes expressible.** `costGovernor` gives reserve/commit/release in integer cents. `callProvider`
   currently has no budget concept at all; Part 4 can reserve before the fetch and commit the estimate after,
   with `-1` prices making a budgeted call refuse rather than guess.
4. **Duplicate removal needs the integration first.** `src/core/providerRouter.js` and `providerRegistry.js`
   should be retired only after Part 4 has one call path; deleting them now would break
   `heyBrain.js:286`/`inputFusion.js:269`, which import them `VERIFIED`.
5. **Two providers are dormant.** Anthropic and DeepSeek are in the registry and adapters but not in
   `getProviderAttempts()`. Part 4 decides whether to enable them; this part only records it.

---

## 7. Claims ledger

| Claim | Label | Evidence |
|---|---|---|
| The shipped app reaches providers only through the `hey` edge function | `VERIFIED` | `heyAI.js:39-43,102,168` |
| `src/lib/providers.ts` is not in the Vite graph | `INFERRED` (no import path found; SDKs absent; build passes) | negative grep + build |
| The live path knows 4 providers, not 6 | `VERIFIED` | `hey/index.ts:88-93` |
| A real circuit breaker exists but is unreachable | `VERIFIED` | `provider-router.ts:34-66` + importer list |
| 16 provider call sites bypass routing | `VERIFIED` | §4 table, each read |
| `executeWithFailover` can never succeed | `VERIFIED` | `providerRouter.js:20,88` + no `execute` registration |
| Model quality | `UNVERIFIED` | no key, no live call, no benchmark |
| What a provider charges | `UNKNOWN` | no price in code; every registry price is `-1` |

**No provider was called. No key was read. No file was modified.**

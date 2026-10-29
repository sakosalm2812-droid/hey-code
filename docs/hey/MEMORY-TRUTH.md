# HEY — MEMORY TRUTH

**Date:** 20 October 2026
**Part:** 06 of 15 — Cosmos Memory, Project DNA, Context Budget
**Repository:** `C:\Users\DELL\Documents\hey`
**Method:** Every claim below was read from source at the cited line, or produced by running a command. Nothing here is inherited from an older document without re-checking it.

**Labels:** `VERIFIED` (read in source) · `REPRODUCED` (ran it) · `INFERRED` (deduced, not directly observed) · `REPORTED` (older doc, not re-checked) · `UNKNOWN` · `BLOCKED`.

**Scope of "every memory file"** (Part 6 §3.2): every `.js/.jsx/.ts/.tsx` file under `src/` whose name contains `memory`, `cosmos`, `context`, or `projectDNA`. That is **22 files** `REPRODUCED` (`Get-ChildItem src -Recurse -Include *.js,*.jsx,*.ts,*.tsx | Where-Object Name -match 'memory|cosmos|context|projectDNA'`), made up of **8 memory-layer modules** (7 in `src/core` + `projectDNA`), **2 lib writers**, **7 UI surfaces**, and **5 context/plumbing files** (`ThemeContext`, `LocaleContext`, `AuthContext`, `ContextMenu`, `MotionContextMenu`) that have nothing to do with memory data.

---

## 0. The one-paragraph answer

There is **no canonical memory record in HEY today.** There are **three live storage destinations** that are not reconciled with each other: the Supabase table `public.memory` (free text + category), the Supabase table `public.hey_memory_nodes` (a graph node mirror), and in-process arrays/Maps in `contextManager.js` and `memoryGraph.js` that are lost on reload. The **chat prompt** is assembled from *two independent* reads that never meet: the browser sends `searchMemory()` output (`heyBrain.js:303`) as a request field, while the **edge function ignores it for memory purposes and re-queries `public.memory` itself** (`supabase/functions/hey/index.ts:605-611`). Classification is ad hoc (`type` / `kind` / `category` / `node_type`), scope does not exist as a stored column, tenant does not exist at all, provenance is absent, supersession is present only in dead code and would be dropped by the persistence mapper if it ran, and deletion is **a hard delete of one copy that leaves a second copy of the same sentence in `hey_memory_nodes`**. `VERIFIED`

---

## 1. Which file actually creates a memory record today?

**Answer: `src/lib/heyMemory.js:20` — `addMemory(userId, memory, category)`.** It is the only writer that puts a row in the table the product reads back and the only one reachable from a page a user can click. `VERIFIED`

```js
// src/lib/heyMemory.js:20-39
await supabase.from('memory').insert({ user_id: userId, memory, category })
saveMemoryNode({ id: `${userId}:${memory}`, value: memory, type: category, confidence: ... })
```

Its **three callers** — all live, all user-initiated:

| Caller | Line | Trigger |
|---|---|---|
| `src/ChatPage.jsx` `pinMessage(text)` | 261 | user pins a chat message |
| `src/CosmosPage.jsx` `createCosmosNode()` | 174 | user adds a Cosmos node |
| `src/core/memoryInbox.js` `approveMemory(id, userId)` | 102-103 | user approves a gated memory |

`REPRODUCED` (reached by following imports from `src/App.jsx` routes `/chat`, `/cosmos`, `/memory`).

Secondary writers, each with its own shape and its own destination:

| # | Writer | Line | Writes to | Reachable from a user action? |
|---|---|---|---|---|
| W2 | `src/core/memoryEngine.js` `storeMemory()` | 95 | `contextManager` array + `memoryGraph` Map + `hey_memory_nodes` | **yes, indirectly** — `executionController.js:227` calls it after every executed request |
| W3 | `src/core/memoryGraph.js` `upsertMemoryNode()` | 10 | in-process `Map`, publishes `memory.node.updated` | **yes** — `CosmosPage.seedGraph`, `persistenceSync.hydrate` |
| W4 | `src/core/memoryGraphService.js` `upsertMemoryNode()` | 45 | `hey_memory_nodes` | **yes** — via W2 |
| W5 | `src/lib/intelligenceRecords.js` `saveMemoryNode()` | 8 | `hey_memory_nodes` | **yes** — event subscriber `persistenceSync.js:35-37` |
| W6 | `src/core/memoryInbox.js` `queueMemory()` | 55 | `localStorage['hey_memory_inbox']` (pending, not a record yet) | **yes** — via `memoryEngine` gating |
| W7 | `src/core/cosmosMemory.js` `persistMemory()` | 196 | `memoryGraph` + `hey_memory_nodes` | **no caller found** |
| W8 | `src/lib/memory.ts` `createMemory()` | 15 | Prisma `Memory` table | **no** — dead runtime, see §8 |
| W9 | `src/app/api/memories/route.ts` POST | — | Prisma `createMemory` | **no** — dead runtime |
| W10 | `src/core/contextManager.js` `addMemory/addImportantFact/addPattern` | 321/345/369 | in-process arrays only | **yes** — via W2, W6 |

`VERIFIED` except "no caller found", which is `VERIFIED` by exhaustive grep over `src/**/*.{js,jsx,ts,tsx}` for each symbol.

**Duplicated writes for one user action.** Pinning one chat message writes **three** copies of the same sentence: the `public.memory` row (`heyMemory.js:21`), a `hey_memory_nodes` row via `saveMemoryNode` (`heyMemory.js:34`), and — because that node is upserted again in `hydrateFromSupabase` on the next login — it is re-materialised into the in-process graph. `VERIFIED`

---

## 2. Which file actually retrieves memories for a prompt?

**Answer: the retrieval that reaches the model is not in `src/` at all. It is `supabase/functions/hey/index.ts:605-611`.** `VERIFIED`

```ts
// supabase/functions/hey/index.ts
const { data: memories } = await supabase
  .from("memory").select("memory, category")
  .eq("user_id", user.id)
  .ilike("memory", `%${message.slice(0, 80)}%`)
  .order("created_at", { ascending: false }).limit(8);
...
memories?.length ? `Relevant user memory:\n${JSON.stringify(memories)}` : "",
```

That string is concatenated into the **system prompt** at line 620-631 and sent to the provider at line 641. `VERIFIED`

The browser-side path exists, runs on every message, and is **largely wasted**:

| Step | File:line | What happens |
|---|---|---|
| 1 | `src/ChatPage.jsx:216` → `src/lib/heyAI.js:86` | `askHEY(message)` |
| 2 | `src/lib/heyAI.js:89` → `src/core/heyBrain.js:181` | `processInput(message)` |
| 3 | `src/core/heyBrain.js:303` | `const relevantMemory = searchMemory(normalizedInput)` |
| 4 | `src/core/memoryEngine.js:248` | substring + `rankMemories` over **in-process arrays + in-process graph only** (sync variant; Supabase variant `searchMemoryAsync` is not called here) |
| 5 | `src/core/heyBrain.js:139` | embeds `Relevant memory: ${JSON.stringify(relevantMemory)}` into the `system` string |
| 6 | `src/lib/heyAI.js:114-116` | sends that string as `system`, the array as `memory`, and `context` |
| 7 | `supabase/functions/hey/index.ts:620-631` | **`payload.memory` is never read.** The system prompt is rebuilt from `defaultSystemPrompt` + `payload.context` + its own `memory` query + plan + sources |

`VERIFIED` — grep for `payload.memory` in `supabase/functions/hey/index.ts` returns no match; the only `memory` read is the table query at 605.

Consequences, all `VERIFIED`:

- **Two retrievals, two corpora, no merge.** The edge function can return memories the browser never saw, and ignores memories the browser did send.
- **No budget anywhere.** The edge function sends up to 8 full rows, uncapped in characters. `heyBrain.js:139` embeds the entire ranked local array, uncapped. This is exactly the pattern Part 6 §14 bans.
- **No ranking server-side.** `order by created_at desc` only.

Other retrieval surfaces (not prompt paths):

| Surface | File:line | Used for |
|---|---|---|
| `heyMemory.searchMemory(userId, query)` | `src/lib/heyMemory.js:55` | Memory page search box (`MemoryPage.jsx:74`) |
| `cosmosMemory.retrieveMemories(query, opts)` | `src/core/cosmosMemory.js:279` | **no caller** |
| `memoryRanking.rankMemories()` | `src/core/memoryRanking.js:98` | called by `memoryEngine.searchMemory` |

---

## 3. How many distinct memory shapes exist?

**Eleven.** `VERIFIED` — each field set below is transcribed from the cited location.

| # | Shape | Where | Field set |
|---|---|---|---|
| S1 | `public.memory` row | migration `20260819000000_hey_core.sql:31-38` | `id, user_id, memory, category, metadata, created_at` |
| S2 | `hey_memory_nodes` row | migration `20260819020000_hey_intelligence.sql:1-13` | `id, user_id, node_key, value, node_type, confidence, tags, metadata, created_at, updated_at` |
| S3 | `hey_memory_edges` row | same file, `:15-25` | `id, user_id, from_node, to_node, relation, weight, metadata, created_at` |
| S4 | `memoryEngine` in-memory memory | `memoryEngine.js:25-34` | `id, value, type, createdAt(Date), importance` |
| S5 | `memoryGraph` node | `memoryGraph.js:14` | `id, value, type, confidence, tags, updatedAt(Date)` + arbitrary `...metadata` |
| S6 | `cosmosMemory` candidate | `cosmosMemory.js:154-159` | `id, value, type, source, confidence, tags, projectId, privacyScope, metadata, isSensitive, createdAt, status` |
| S7 | `cosmosMemory` "persisted" memory | `cosmosMemory.js:210-229` | `id, value, type, source, confidence, tags, projectId, privacyScope, metadata{explicit,ingestedAt}, createdAt, updatedAt, supersedes, supersededBy, expiresAt` |
| S8 | Prisma `Memory` | `schema.prisma:264-282` | `id, userId, type, content, category, importance, sourceChatId, createdAt, updatedAt` |
| S9 | `lib/memory.ts` input | `memory.ts:5-13` | `userId, type, content, category, importance, sourceChatId, edges[]` |
| S10 | Memory-inbox item | `memoryInbox.js:61-68` | `id, value, type, source, createdAt(ISO), status` |
| S11 | `contextManager` entries (3 sub-shapes) | `contextManager.js:329, 353, 374` | `{value, createdAt}` · `{fact, source, approvedAt, createdAt}` · `{pattern, id, detectedAt, createdAt}` |

Plus one adjacent domain that is **not** user memory: `projectDNA` project objects (`projectDNA.js:125-176`), 27 DNA fields, persisted to `localStorage['hey_project_dna']`.

### 3.1 Conflicts that make a canonical record necessary

| Concept | Competing names | Verdict |
|---|---|---|
| the fact text | `memory` · `value` · `content` · `fact` · `pattern` · `description`/`text` | six names for one thing; `memoryEngine.js:271` literally falls back `entry.value ?? entry.description ?? entry.text` |
| classification | `type` (S4,S5,S6,S7) · `node_type` (S2) · `kind` (S8/S9 Prisma `type` maps to `FACT\|PREFERENCE\|...`) · `category` (S1,S8) | four vocabularies, zero shared enum |
| belief strength | `confidence` (S2,S5,S6,S7) · `importance` (S4,S8) · `score` (ranking output) | `memoryRanking.js:37` reads `importance ?? confidence ?? 0.5` — i.e. the code does not know either |
| privacy | `privacyScope` (S6,S7) · `isSensitive` (S6) · `metadata` (S1,S2) | **no `sensitivity` field exists anywhere** |
| timestamps | `Date` objects (S4,S5) · ISO strings (S6,S7,S10) · Postgres `timestamptz` (S1,S2) | `memoryRanking.normalizeDate` exists only to paper over this |
| identity | `id` · `node_key` (S2) · `${userId}:${memory}` synthetic key (`heyMemory.js:34`) | three id spaces; the synthetic key collapses two different memories with the same text |
| lifecycle | `expiresAt` `supersededBy` `tombstoned` `approved` `retention` | exist **only** in S7 (dead) — none are columns in S1 or S2 |

`VERIFIED`

**The decisive one:** `sensitivity`, `scope`/`tenantId`, `approved`, `tombstoned`, `supersededBy`, and `retention` have **no column in either live table**, so no amount of code can make them survive a reload. `VERIFIED`

---

## 4. Where is provenance stored?

**Answer: nowhere that survives.** `VERIFIED`

| Candidate | Present? | Evidence |
|---|---|---|
| `source` | **partial** | `memoryEngine.storeMemory` puts `{source}` inside `hey_memory_nodes.metadata` (`memoryEngine.js:127`). `heyMemory.addMemory` puts the **whole node object** into `metadata` via `intelligenceRecords.js:11`. Nothing in `public.memory.metadata` — `addMemory` never supplies it, so it stays `'{}'` (`heyMemory.js:21-27`). |
| `conversationId` / `sourceChatId` | **no** | `sourceChatId` exists only on the dead Prisma model (`schema.prisma:271`). No memory write path in the live app records a conversation id. `ChatPage.pinMessage` passes only `(user.id, text, 'pinned')`. |
| `capturedAt` | **implicit only** | `created_at` default `now()`. |
| `author` | **no** | not a field anywhere. |
| `retrievedAt` (last time memory was used) | **no** | no field in any shape. |
| `lastSeenAt` (freshness) | **no** | ranking substitutes `updated_at`, which changes on write, not on recall (`memoryRanking.js:30`). |

The consequence is concrete: when a memory is wrong, HEY cannot say **where it came from**, **which conversation produced it**, or **whether it was ever used**. `INFERRED` from the absence of the fields.

---

## 5. Is there any supersession or contradiction handling?

**Supersession: exists in dead code only, and would not persist if it ran.** `VERIFIED`

- `cosmosMemory.supersedeMemory(oldId,newId,reason)` — `cosmosMemory.js:377-422`. It writes `superseded_by` and `supersedes` as object properties, then calls `memoryGraphService.upsertMemoryNode` (`:399-409`).
- `memoryGraphService.upsertMemoryNode` (`memoryGraphService.js:45-66`) maps **only** `user_id, node_key, value, node_type, confidence, tags, metadata, updated_at`. `superseded_by` and `supersedes` are **silently discarded** — the upsert succeeds and the supersession is lost. `VERIFIED`
- No caller of `supersedeMemory` exists outside the `HEY.cosmos` barrel (`src/core/index.js:483`). `VERIFIED`

**Contradiction handling: a substring heuristic, unreachable.** `VERIFIED`

`cosmosMemory.getContradictions` (`:498-519`) compares every retrieved pair with `areContradictory` (`:521-544`), which is an `includes()` check over seven hard-coded pairs (`is`/`is not`, `yes`/`no`, `enabled`/`disabled`, …). It has:

- no subject/predicate/object model, so "the deploy is enabled" and "the deploy is disabled" are flagged but "my favourite colour is blue" and "my favourite colour is red" are not;
- **no resolution path at all** — it returns candidates and nothing consumes them;
- no caller (`cosmosMemory` is barrel-only, §8).

**Nothing in the live path detects, records, or resolves a contradiction.** The `public.memory` table has no `superseded_by`, no `confidence`, no uniqueness, so two contradictory rows simply coexist and both are eligible for the prompt. `VERIFIED`

---

## 6. Is there any real deletion?

**Answer: it is a hard delete of one copy, with a second copy of the same content left behind. So: deletion is neither provable nor complete.** `VERIFIED`

| Path | File:line | What it actually does | Verdict |
|---|---|---|---|
| **User deletes on the Memory page** | `MemoryPage.jsx:130` → `heyMemory.deleteMemory` `:41-53` | `DELETE FROM public.memory WHERE id = ?` | **hard delete of `public.memory` only** |
| …the derived copy | `heyMemory.addMemory` `:34` wrote the same text to `hey_memory_nodes`; `deleteMemory` never touches it | content **remains** in `hey_memory_nodes.value` and is re-hydrated into the graph on next login (`persistenceSync.js:126`) | **content recoverable — banned pattern** |
| Cosmos delete | `cosmosMemory.deleteMemory` `:424-459` | writes a tombstone to `localStorage['hey_cosmos_tombstones']`, calls `deleteMemoryNode` (exists), then calls `hardDeleteMemoryNode` — **which does not exist** (`memoryGraphService.js` has no such method; only reference in the repo is `cosmosMemory.js:445`) | **throws inside `try`, returns `{success:false}`**; unreachable anyway |
| UI copy | `MemoryPage.jsx:430-431` claims "Deleting a memory removes it everywhere — from your workspace, your search results, and HEY's knowledge." | is false | **REPORTED claim contradicted by VERIFIED code** |
| Session clear | `memoryGraph.clearMemoryGraph()` `:91` via `accountState.resetAccountState()` `:22` | empties the in-process `Map` on sign-out | not deletion; also clears any tombstone state |
| Account deletion | `delete_account_data(p_user)` — migration `20260919000000_delete_account.sql:18-25` | loops **every** public table with a `user_id` column and `delete`s; that includes `memory`, `hey_memory_nodes`, `hey_memory_edges` | **genuinely hard, whole-account** — but migration is marked `EXTERNAL_SETUP_REQUIRED` (line 7); whether it is applied is `UNKNOWN` |

**There is no tombstone on the live path.** The only tombstone code (`cosmosMemory.deletionTombstones`, `:67`, `:430-438`) lives in `localStorage` under `hey_cosmos_tombstones`, is reachable from nothing, and `clearMemoryGraph()` + `resetAccountState()` on sign-out leaves it orphaned. `VERIFIED`

**Deletion of `public.memory` leaves the content recoverable in `hey_memory_nodes`.** That is a Part 6 §14 banned item. **Reported, not fixed** (existing memory files are read-only for this part).

---

## 7. Where is scope and tenant enforced?

**Answer: nowhere. User identity is enforced server-side by Supabase RLS; scope and tenant do not exist as concepts in storage or in code.** `VERIFIED`

| Control | Where | Strength |
|---|---|---|
| per-user isolation | RLS policies `memory` and `hey_memory_nodes` (`20260819000000…:77-79`, `20260819020000…:74-77`) — `auth.uid() = user_id` | **server-side, real** |
| `scope` (`personal`/`project`/`temporary`/`school`/`organization`/`shared`) | **no column, no enum, no check** | absent |
| `tenantId` | **no column, no code** | absent |
| `privacyScope` | `cosmosMemory` only (`:35-40`, `:111`); passed to `memoryGraphService.upsertMemoryNode` (`:244-254`) which **does not map it**, and not passed to `public.memory` insert at all | **dropped on write** |
| `isSensitive` | `cosmosMemory.detectSensitivity` (`:180-194`) sets it on the *candidate* only; `persistMemory` never stores it | **lost at approval** |
| Sensitive exclusion from prompts | neither `heyBrain.searchMemory` nor the edge query filters by sensitivity | absent |
| Cross-tenant leak detection | none | absent |

`VERIFIED`, with one nuance: `cosmosMemory.retrieveMemories` *does* accept `privacyScope` / `projectId` filters (`:320-327`), but no caller passes them, and the values were never persisted, so the filter would compare against `undefined`. `VERIFIED`

So today: **one tenant = one user, and only because Postgres says so.** Every richer boundary the product promises is unimplemented.

---

## 8. Which memory files are reachable from a real user action?

Cross-checked against `docs/hey/REACHABILITY.md` (Part 2) and re-verified by import tracing from `src/App.jsx`. `VERIFIED`

| File | Status | Reached from | Notes |
|---|---|---|---|
| `src/lib/heyMemory.js` | **LIVE** | `/chat` pin, `/cosmos` node, `/memory` approve/delete | the real record store |
| `src/lib/intelligenceRecords.js` | **LIVE** | `heyMemory.addMemory`, `persistenceSync` subscriber | writes `hey_memory_nodes` |
| `src/lib/persistenceSync.js` | **LIVE** | `AuthContext → authLifecycle` (`:48-50`) hydrate then enable sync | hydration is the only reason chat "remembers" across reloads |
| `src/core/memoryEngine.js` | **LIVE** | `heyBrain.js:10,303`; `executionController.js:6,227` | `searchMemory` is on the chat path |
| `src/core/memoryGraph.js` | **LIVE** | Dashboard, CosmosPage, MemoryGalaxyWidget, memoryInbox, memoryEngine | in-process `Map`, lost on reload unless hydrated |
| `src/core/memoryGraphService.js` | **LIVE** (chained) | `memoryEngine`, `cosmosMemory` | the only writer to `hey_memory_nodes` besides `intelligenceRecords` |
| `src/core/memoryRanking.js` | **LIVE** (chained) | `memoryEngine.searchMemory` | see §9 |
| `src/core/memoryInbox.js` | **LIVE** | `/memory` inbox UI (`MemoryPage.jsx:12-18`) | gating works; approved items go through `addMemory` |
| `src/core/contextManager.js` | **LIVE** | `heyBrain`, `heyAI`, `executionEngine`, `persistenceSync` | 100/history, 50/100/50 array caps; process-lifetime only |
| `src/core/cosmosMemory.js` | **INTERNAL-LIVE, barrel-only** | imported by `src/core/index.js:114-133`; exposed as `HEY.cosmos.*`; **no UI calls any `HEY.cosmos` method** | the most sophisticated memory code in the repo, and nothing uses it |
| `src/core/projectDNA.js` | **BARREL-ONLY** | `src/core/index.js:77` → `HEY.projectDNA.*`; no UI call | localStorage only; separate domain (brand/DNA), not user memory |
| `src/lib/memory.ts` | **DEAD** | imported only by `src/app/api/**` and `src/lib/agent-tools.ts` | see below |
| `src/app/api/memories/route.ts`, `src/app/api/chat/route.ts` | **DEAD** | no Vite entry imports `src/app`; `next` is not a dependency (`package.json`) | Next.js-style routes in a Vite SPA: they never execute |
| `src/components/ui/index.js` | **DEAD barrel** | not imported anywhere; would not compile if it were — it re-exports `memoryEngine` (`:125`) and `heyMemory` (`:138`), neither of which is a named export of its target | a landmine, not a live path |

**"Dead" evidence:** `package.json` has no `next`, no `prisma`, no `@prisma/client`; the Vite entry is `src/main.jsx` → `src/App.jsx`; grep for `src/app` imports outside `src/app` returns nothing. `VERIFIED`

**So the honest ledger is: 9 files claim memory, 9 are loaded, 5 do real work, 1 does the writing, 1 (the edge function, outside `src/`) does the reading that matters, and the richest 2 cannot be reached from the product.** `VERIFIED`

---

## 9. What does `memoryRanking.js` actually rank by?

Transcribed from `src/core/memoryRanking.js`. `VERIFIED`

**Step 1 — decay** (`applyMemoryDecay`, `:27-59`):

```
ageDays   = max(0, (now - (updatedAt ?? createdAt)) / 86_400_000)
typeFactor= important 1.25 · pattern 1.1 · else 1.0
decayed   = clamp( (importance ?? confidence ?? 0.5) × typeFactor × 0.5^(ageDays / halfLifeDays), 0.05, 1 )
halfLifeDays default 30
```

**Step 2 — score** (`scoreMemory`, `:61-96`):

```
affinity     = no query        → 0.15
               text.includes(q) → +0.5
               text.startsWith(q)→ +0.25      (text = value + category + type + tags, lowercased)
frequency    = accessCount ? min(0.2, accessCount × 0.05) : 0.05
recencyBonus = max(0, (1 - ageDays/14) × 0.1)
score        = clamp( decayed×0.6 + affinity×0.25 + frequency + recencyBonus, 0, 1 )
```

**Effective signal weights** (sum = 0.6 + 0.125 + 0.05 + 0.1 = **0.875** at most; the remainder is unreachable headroom):

| Signal | Max contribution |
|---|---|
| decayed importance/confidence | **0.600** (dominant) |
| query affinity (substring / prefix) | 0.125 |
| access frequency | 0.200 (only if `accessCount` exists — **no write path ever sets `accessCount`**, so 0.050 in practice) |
| recency bonus (≤14 days) | 0.100 |
| graph degree (`rankGraphNodes` only) | +0.03 per edge |

**Defects found in the ranking itself** `VERIFIED`:

1. **The floor defeats decay.** `Math.max(0.05, …)` (`:42-45`) means a two-year-old memory still scores ≥ 0.03. A memory never becomes negligible, so the "old data never overrides explicit new information" claim in the file header (`:9-12`) does not hold: a fresh low-affinity memory (0.05×0.6 = 0.03) can tie a stale one.
2. **`accessCount` is never incremented.** grep over `src/` finds no writer. The frequency term is a constant 0.05.
3. **No deterministic tie-break.** `:110-111` sorts ascending then `.reverse()`. Equal scores fall back to **insertion order**, which is the hydration order of the Supabase query — i.e. `updated_at desc` (`persistenceSync.js:101`). Two identical scores can therefore swap when a row is touched. Part 6 §9 rule 4 requires id-ascending.
4. **`score` is rounded to 3 decimals after sorting** (`:115`), so displayed scores can tie where the ordering did not.
5. **`value` is assumed.** `text` is built from `memory.value` (`:69`); the `public.memory` row names the field `memory` and the inbox names it `value`. A row from `public.memory` scored by this function contributes **only its type/tags** to matching.

---

## 10. Every write path that bypasses the canonical record

There is no canonical record yet, so *every* write bypasses it. For Part 7 to integrate, this is the exact list of places that must be re-routed or proven equivalent. `VERIFIED`

| # | Write path | File:line | Destination | Bypass? |
|---|---|---|---|---|
| B1 | `addMemory` | `src/lib/heyMemory.js:20-39` | `public.memory` **and** `hey_memory_nodes` | **two unsynchronised copies in one function** |
| B2 | `saveMemoryNode` (mirror half of B1) | `src/lib/heyMemory.js:34` | `hey_memory_nodes.metadata` = the whole node | self-referential provenance |
| B3 | `saveMemoryNode` subscriber | `src/lib/persistenceSync.js:35-37` → `intelligenceRecords.js:8` | `hey_memory_nodes` | fires on **every** `memory.node.updated`, including hydration |
| B4 | `storeMemory` | `src/core/memoryEngine.js:95-138` | array + Map + `hey_memory_nodes` | writes confidence `0.5`/`1` from `importance`, no scope, no provenance |
| B5 | `storeMemoryAsync` | `src/core/memoryEngine.js:141-187` | same as B4 | duplicate implementation, not on any live path |
| B6 | `rememberPreference` | `src/core/memoryEngine.js:190-217` | context array + `hey_memory_nodes` | **writes no local graph node** — invisible to `searchMemoryGraph` |
| B7 | `rememberPattern` | `src/core/memoryEngine.js:220-245` | context array + `hey_memory_nodes` | node `node_key` is a fresh `crypto.randomUUID()` (`:231`) → **a new row on every call**, no dedupe |
| B8 | `upsertMemoryNode` | `src/core/memoryGraph.js:10-18` | in-process `Map` | `metadata` spread **after** `id` (`:14`), so a caller can overwrite `id` |
| B9 | `upsertMemoryNode` | `src/core/memoryGraphService.js:45-66` | `hey_memory_nodes` | drops `supersededBy`, `supersedes`, `privacyScope`, `projectId`, `approved`, `expiresAt` |
| B10 | `queueMemory` | `src/core/memoryInbox.js:55-74` | `localStorage['hey_memory_inbox']` | a pending memory is already durable before approval |
| B11 | `approveMemory` | `src/core/memoryInbox.js:94-115` | `public.memory` **and** graph **and** context array | **three** copies on approval, with different confidence (1, 1, none) |
| B12 | `cosmosMemory.persistMemory` | `src/core/cosmosMemory.js:196-268` | local graph + `hey_memory_nodes` | unreachable, but would double-write with B9 |
| B13 | `adoptFromSupabase` (hydration) | `src/lib/persistenceSync.js:126-144` | in-process Map + context arrays | rebuilds memory from `hey_memory_nodes` **only**; `public.memory` rows are never hydrated into the local brain |
| B14 | Prisma `createMemory` | `src/lib/memory.ts:15-47` | Prisma `Memory` | dead runtime |
| B15 | Prisma API route | `src/app/api/memories/route.ts` | Prisma | dead runtime |
| B16 | `agent-tools.ts` `memory_save` | `src/lib/agent-tools.ts:2, 128` | Prisma | dead runtime; also a *tool* the agent can call |
| B17 | Edge-function read | `supabase/functions/hey/index.ts:605-611` | reads `public.memory` directly | **the read that actually feeds the model bypasses every `src/core` retrieval module** |
| B18 | `projectDNA` writes | `src/core/projectDNA.js:178-183` | `localStorage['hey_project_dna']` | separate domain, but it is the only "project memory" that exists |

**B1/B2 and B11 are the dangerous pair:** they create a second durable copy under a key that no deletion path removes (§6).

### 10.1 Additional verified defects worth Part 7 knowing

| # | Defect | Evidence |
|---|---|---|
| F1 | `hardDeleteMemoryNode` is called but never defined — hard delete is impossible | `cosmosMemory.js:445`; only occurrence in repo |
| F2 | `memoryGraphService.upsertMemoryNode` silently drops `superseded_by`, `supersedes`, `privacyScope` | `memoryGraphService.js:48-56` vs `cosmosMemory.js:399-409` |
| F3 | `MemoryPage` deletion promise ("removes it everywhere") is false | `MemoryPage.jsx:430-431` vs `heyMemory.js:41-53` |
| F4 | `components/ui/index.js` re-exports two non-existent names | `:125`, `:138`; neither module exports them |
| F5 | Sync chat path never queries Supabase, so a fresh login can chat with less memory than the user has | `heyBrain.js:303` → `memoryEngine.js:248` (sync); `searchMemoryAsync` unused |
| F6 | The edge function has no character/token cap on the memory block | `hey/index.ts:628` — `JSON.stringify(memories)` unbounded in length (bounded only by 8 rows of arbitrary size) |
| F7 | `sourceChatId` exists only on a dead schema; no live memory row can name its conversation | `schema.prisma:271`; no writer in `src/lib/heyMemory.js` |
| F8 | `detectSensitivity` result is discarded at persistence | `cosmosMemory.js:121,134` → `:219-223` (metadata lacks it) |

---

## 11. What the new modules in this Part replace

| New module | Replaces / supersedes | Relationship to existing files |
|---|---|---|
| `src/core/memoryRecord.js` | S1, S4, S6, S7, S10 (no single shape today) | **pure; imports nothing from the memory layer**. Existing files untouched |
| `src/core/memoryConsolidation.js` | `cosmosMemory.getContradictions` (heuristic), absent dedupe, absent decay policy | pure; imports only `memoryRecord.js` |
| `src/core/memoryRetrieval.js` | `memoryEngine.searchMemory` + `memoryRanking.rankMemories` (unbudgeted, no tie-break) + the edge function's `ilike … limit 8` | pure; imports only `memoryRecord.js` |
| `src/core/memoryBoundary.js` | nothing (the capability has never existed) | pure; imports only `memoryRecord.js` |
| `src/core/projectIndex.js` | nothing at runtime — `projectDNA.js` stores *brand* DNA, not a code index; this is the missing "Project DNA" from stage 29 | pure; reads a **manifest object**, never the filesystem |

**No existing memory file is modified, renamed, moved, or deleted by this Part.** Every bypass above is **reported here** and left in place for Part 7 to integrate. `VERIFIED` by the changed-file list in the Part 6 proof pack.

---

## 12. Findings summary (for the owner)

1. **Two databases hold the same fact, and only one is deleted.** `public.memory` and `hey_memory_nodes` both receive the pinned sentence; `deleteMemory` removes one. → content is recoverable after a user deletes it. **Highest-severity finding.**
2. **The prompt-memory path is not the code anyone thinks it is.** The browser's retrieval is computed, serialised into a system string, sent — and the edge function never reads `payload.memory`; it runs its own `ilike` query. Two retrievals, no shared ranking, no budget.
3. **Scope and tenant are fiction.** No columns, no enums, no enforcement. Only Postgres RLS per user.
4. **Provenance is absent.** No source, conversation, author, or retrieval timestamp survives a write.
5. **Supersession cannot work** even if called: the persistence mapper has no column for it.
6. **The richest memory module is unreachable**, and its delete path calls a method that does not exist.
7. **`memoryRanking`'s decay floor** keeps stale facts competitive forever, and ties break on insertion order.
8. **Six vocabularies for one concept.** A canonical record is not a nicety; it is the unblocker for everything else.

A memory system that cannot forget on request is a liability, not a feature. Today HEY cannot prove it forgot.

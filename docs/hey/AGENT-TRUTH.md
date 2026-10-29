# HEY — AGENT TRUTH (Part 4)

**Date:** 20 October 2026
**Repository:** `C:\Users\DELL\Documents\hey`
**Scope:** the 229 agents in `src/lib/agents/data-*.ts` and the code that routes them.
**Labels:** `VERIFIED` (read from code or measured file) · `REPRODUCED` (a command was run) · `INFERRED` (reasoned, not executed) · `REPORTED` (inherited, not re-checked) · `UNKNOWN` · `BLOCKED`.

**Exhaustiveness boundary.** "Every agent" means every `ag(` record in the five `data-*.ts` files — 229 records, parsed as text by `scripts/snapshot-agents.mjs` (see §1). "Every field" means every property the factory sets. "Every routing path" means every `import` of `src/lib/agents/router.ts`, `registry.ts`, `teams.ts` and `health.ts` in `src/`. Nothing else is claimed.

---

## 1. How the numbers were produced

| Step | Command | Result | Label |
|---|---|---|---|
| Parse all five data files as text (no TS import) | `node scripts/snapshot-agents.mjs` | 229 agents, 0 parse failures, 1 data anomaly | `REPRODUCED` |
| Snapshot currency | `node scripts/snapshot-agents.mjs --check` | "is current" | `REPRODUCED` |
| Router behaviour | re-implementation of `INDEX` + `score()` + `routeRequest()` from `router.ts`, same weights and same tie rule | 1,870 probe inputs | `VERIFIED` (code read) + `REPRODUCED` (probes) |
| Runtime reachability | import graph + `dist` scan after `vite build` | 0 of 229 in the shipped bundle | `REPRODUCED` |

Per-file result (`VERIFIED`):

| File | Agents | sha256 (first 16) | Bytes |
|---|---|---|---|
| `src/lib/agents/data-core.ts` | 48 | `5faebd50c1c7782f` | 12,533 |
| `src/lib/agents/data-dev.ts` | 53 | `8e96aa5688f28814` | 13,703 |
| `src/lib/agents/data-creative.ts` | 55 | `76786c4fc618adb3` | 12,823 |
| `src/lib/agents/data-knowledge.ts` | 42 | `2c9d98701597a43f` | 10,342 |
| `src/lib/agents/data-qa-forge.ts` | 31 | `b01271dca9c477c3` | 7,207 |
| **Total** | **229** | full hashes in `agents.snapshot.json` | |

Categories: A=16 B=16 C=16 D=23 E=14 F=16 G=11 H=6 I=15 J=12 K=11 L=12 M=15 N=5 O=10 P=10 Q=10 R=11 `VERIFIED`.

The parser does not skip anything. Proven by tests in `tests/agent-snapshot.test.js`, which corrupt a copy of the sources and assert four separate loud failures: an unsupported options expression (with `file:line`), an invalid risk value, a duplicate id, and an agent count that changed.

---

## 2. What `ag()` actually sets — question 1 of §6.2

`src/lib/agents/factory.ts:44` `VERIFIED`:

```ts
export function ag(
  id: string,
  name: string,
  category: AgentCategoryId,
  purpose: string,
  opts: AgentSeed = {}
): AgentContract
```

and the merge itself (`factory.ts:51-61`):

```ts
const tools = opts.tools ?? [];
return {
  ...DEFAULT_CONTRACT,
  id, name, category, purpose,
  tools,
  permissions: opts.permissions ?? inferPermissions(tools),
  ...opts,
};
```

Three consequences that matter, all `VERIFIED`:

1. **Every field is always present.** `DEFAULT_CONTRACT` (`types.ts:162`) fills the other 16 fields, so "how many agents declare X" and "how many agents have X" are different questions. Both are measured below.
2. **`risk` has a silent default of `low`.** An agent that forgot to classify itself is indistinguishable from one that considered it and said "low".
3. **`permissions` are inferred from tools when not declared** (`inferPermissions`, `factory.ts:33`), and `compute` is always added. `opts` spreads last, so an explicit `permissions` wins.

Field source table (`VERIFIED`):

| Field | Declared by | Default if absent |
|---|---|---|
| `id`, `name`, `category`, `description` (= `purpose`) | all 229 (positional, cannot be omitted) | — |
| `tools` | 229 | `[]` (never reached) |
| `permissions` | 109 | inferred from tools + `compute` |
| `risk` | 29 | `low` |
| `privacy` | 10 | `private` |
| `keywords` | 229 | `[]` (never reached) |
| `model`, `timeoutMs`, `retries`, `boundaries`, `platforms` | 0 | `GPT_4O_MINI`, `30000`, `2`, generic boundary, 3 platforms |

**The field that is not there at all:** `alwaysEligible`, `verifierCapable`, `health`, `owner`-per-agent. The contract type has `audit: true` and `telemetry: true` for all 229, which is a policy statement, not a measurement.

---

## 3. Field audit — questions 2 to 6

### 3.1 Tools (question 2)

**229 of 229 declare at least one tool** `VERIFIED`. 158 declare exactly one, 63 declare two, 8 declare three or more. Total tool declarations: 311.

| Tool | Agents | Permission it implies |
|---|---|---|
| `memory_search` | 74 | `memory` |
| `file_search` | 43 | `files` |
| `calculator` | 42 | `compute` |
| `web_search` | 41 | `web` |
| `memory_save` | 30 | `memory` |
| `web_fetch` | 21 | `web` |
| `current_time` | 19 | `compute` |
| `summarize` | 18 | `compute` |
| `planner` | 13 | `data` |
| `translate` | 7 | `compute` |
| `image_generate` | 1 | `media` |
| `prayer_times` | 1 | `compute` |
| `hijri_date` | 1 | `compute` |

There are **no write tools other than `memory_save` and `image_generate`**, and no tool that touches the filesystem for writing. The `files` permission is granted to 43 agents whose only file tool is `file_search`, which reads.

### 3.2 Permissions and risk (question 3)

| Measure | Count | Label |
|---|---|---|
| Agents that declare `permissions` | **109** / 229 | `VERIFIED` |
| Agents with effective permissions (declared or inferred) | **229** / 229 | `VERIFIED` |
| Distinct declared permission sets | 18 | `VERIFIED` |
| Agents that declare `risk` | **29** / 229 | `VERIFIED` |
| Effective risk `low` | **200** | `VERIFIED` |
| Effective risk `medium` | 13 | `VERIFIED` |
| Effective risk `high` | 13 | `VERIFIED` |
| Effective risk `critical` | 3 | `VERIFIED` |
| Agents that declare `privacy` | **10** / 229 (all `sensitive`) | `VERIFIED` |

Effective permissions: `compute` 229, `memory` 90, `web` 56, `data` 23, `files` 43, `media` 1. No agent holds `admin` `VERIFIED`.

**200 of 229 agents are `low` risk by inheritance, not by decision.** That is the single most misleading number in the registry: the risk column is 87% default.

### 3.3 Keywords (question 4)

**0 agents have no keywords** `VERIFIED` — so the "unselectable by keyword" failure mode does not apply.

A different keyword problem does: `DEV_KEYWORDS()` in `factory.ts:66` injects the same three keywords into **23 of 23 dev agents**:

```ts
export const DEV_KEYWORDS = (extra: string[]) => ['code', 'app', 'project', ...extra];
```

Consequence, measured: `code`, `app` and `project` are each shared by 23 agents, and they are 3 of 34 keywords that collide. **All 253 pairs of agents that share at least two keywords are inside this one family** (`C(23,2) = 253`, zero outside it) `REPRODUCED`. Three injected keywords account for 100% of keyword collision in the registry.

### 3.4 Prefix families and near-identical descriptions (question 5)

**25 id-prefix families** `VERIFIED`. Largest: `memory-*` (11: ingest, retrieve, rank, dedup, update, decay, delete, privacy, provenance, graph, summarize), `forge-*` (5), `voice-*` (3), then ten 2-member families.

**Near-identical descriptions are rare**, which is worth saying because it contradicts the assumption behind the question `REPRODUCED` (Jaccard over description content tokens, stopwords removed):

| Similarity | Pairs |
|---|---|
| ≥ 0.70 | 0 |
| ≥ 0.60 | 0 |
| ≥ 0.50 | 1 |
| ≥ 0.40 | 2 |
| ≥ 0.30 | 4 |

The one cluster at ≥ 0.50: **`state` (“Keeps UI state consistent across reloads and devices”) vs `cross-device` (“Keeps sessions and state in sync across devices”)**. At 0.43: `calendar` vs `time-management`. At 0.33: `agent-designer` vs `tool-designer`, `database` vs `migration`.

So the duplication is **not in the prose**. It is in the keywords (§3.3), the id families, and — see §5 — the roles themselves.

### 3.5 High or critical risk WITH a write-capable tool (question 6)

Boundary used: write-capable = a tool that persists or creates data, i.e. **`memory_save` or `image_generate`**. That is a 2-of-13 boundary, named so it can be disputed.

**16 agents are `high` or `critical`** `VERIFIED`:

```
secrets · computer-control-security · incident-response                (critical)
security-auditor · authentication · authorization · appsec ·
api-security · ai-security · tool-security · file-security ·
computer-use · terminal · health-info · medical-research · legal-info  (high)
```

**Exactly 1 of the 16 also holds a write-capable tool:**

| Agent | Risk | Tools | Why it is the finding |
|---|---|---|---|
| `incident-response` | `critical` | `memory_save`, `web_search` | The only critical agent that can **write to long-term memory**. An incident response that writes is correct behaviour and an unreviewed side effect at the same time. |

The other 15 are `high`/`critical` with read-only tools (`file_search`, `web_search`, `web_fetch`, `calculator`).

**That clean result is misleading, and this is the more important finding** (`INFERRED`, from the factory comment at `factory.ts:64`: “Software engineers get the full task-toolkit (model does the rest via chat)”):

- `terminal` is `high` risk with tools `['calculator']`. `computer-use` is `high` risk with `['calculator']`. `secrets` is `critical` with `['file_search']`.
- The **13-tool list is not a capability model**. It is a hint list for a model that then acts through chat. The real computer-control surface is `src/core/computerControl.js`, reachable from `completionRuntime` — a different subsystem with its own authorization (`src/core/executionAuthorization.js`) and no relation to these agent records.
- Therefore “how many dangerous agents are there?” has two answers: **1 by the declared data**, and **unknown by the real capability surface**, because the registry does not model it. The second answer is the one that should keep the owner awake.

Write-capable agents overall: **31** (30 with `memory_save`, 1 with `image_generate`). Of those, 29 are `low` or `medium` risk. The risk label and the write capability are almost uncorrelated — correlation would require a policy that says otherwise, and there is none.

---

## 4. The router, and how many of the 229 it can actually reach (questions 7 and 8)

### 4.1 How `router.ts` selects today (question 7)

`routeRequest(input: string)` (`router.ts:52`) builds an index at module load: for every one of the 229 agents it lowercases the **name**, the **purpose** and every **keyword**, splits on non-alphanumerics, and keeps a set of tokens per agent. At request time it scores each agent by summing, for every token of that agent that is a **substring of the whole lowercased input**, a weight of 3 for a phrase, 2 for a token of five or more characters, and 1 otherwise; the highest total wins, **ties are broken by registry order** (the sort is stable and nothing else orders them), and if nothing scores above zero the request falls back to the `intent` agent. It returns one primary agent, up to three runner-ups, a team lookup, and `getAgentHealth(primary)` as a **display string** — health is never used to exclude anything (`router.ts:79` `VERIFIED`).

### 4.2 Reachability by the algorithm: **229 of 229** `REPRODUCED`

Two independent measures, both in `agents.snapshot.json`:

| Measure | Result | Method |
|---|---|---|
| Reachable by construction | **229 / 229** | 1,870 probe inputs: every distinct index token as a standalone input, plus each agent's full word-set as one input |
| Provably unreachable (dominated word set) | **0** | for each pair, is one agent's word set a superset of the other's? A superset always scores at least as high, and ties go to the earlier entry |
| Undetermined | **0** | — |
| Reachable when the user types the agent's own keyword verbatim | **229 / 229** | every declared keyword of every agent used as the input |

So: **every agent has at least one declared trigger phrase that routes to it.** There is no "90 unreachable agents" story here. The registry is reachable *as a set*.

### 4.3 Reachability by the running application: **0 of 229** `REPRODUCED`

This is the number that matters, and it is not the one the question expects.

| Evidence | Result |
|---|---|
| Files importing `src/lib/agents/router.ts` or the `@/lib/agents` barrel | `src/app/api/agent-router/route.ts`, `src/app/api/chat/route.ts`, `src/app/api/agents/route.ts`, `src/lib/agent-tools.ts`, `src/lib/agents.ts`, plus two files under `src/lib/__tests__/` |
| Files importing any of those from the Vite app (`src/main.jsx` → `src/App.jsx` → pages/components) | **none** |
| `src/app/**` in the Vite build graph | **no** — Vite's entry is `index.html` → `src/main.jsx`; `src/app/api/*/route.ts` are Next.js route handlers |
| `next` in `package.json` or `node_modules` | **absent** (`node_modules/next` does not exist) `VERIFIED` |
| Agent-specific strings in `dist/assets/*.js` after build | **absent**: "Classifies what the user actually wants", "Memory Ingest Agent", "Hallucination Guard Agent" — none present in 58 chunks `REPRODUCED` |
| Tests that exercise this router | `src/lib/__tests__/registry.test.ts` — Vitest, and **Vitest is not a dependency**; `node --test` never runs it `VERIFIED` |

**The 229-agent registry and its router are dead code in the shipped web build.** The only code path that calls `routeRequest` is a Next.js API handler in a repository that does not depend on Next.js. It is loaded by a Vitest suite that cannot run on the installed toolchain.

### 4.4 What the live application actually routes with `VERIFIED`

`src/core/agentRouter.js` — imported by `heyBrain.js`, `executionEngine.js` and `inputFusion.js` — routes among a **different** registry: `agents/agents.js` (top-level `agents/` directory, 100 `id:` entries `VERIFIED`), with `DEFAULT_AGENT_ID = 'architect'`, regex collaboration rules, and `analysis.agentId` from `src/core/messageRouter.js`. It does not import, know about, or reference the 229.

So HEY has **three agent registries**: `agents/agents.js` (live), `agents/v1AgentCatalog.js` (bundled — see §4.6), and `src/lib/agents/*` (229 contracts, not wired to the app). The 229 contracts have never been reachable from a user request in this build.

### 4.6 There are two different sets of 229, and they do not overlap `REPRODUCED`

The number "229" appears twice in this repository, and the two sets share **zero ids**:

| | Contract registry | Display catalogue |
|---|---|---|
| File | `src/lib/agents/data-*.ts` | `agents/v1AgentCatalog.js` |
| Entries | 229 | 229 (228 unique ids; `v1-dependency-agent` appears twice) |
| Id shape | `prayer-times`, `security-auditor` | `v1-agent-orchestration`, `v1-intent-agent` |
| Fields | id, name, category A–R, description, tools, permissions, risk, privacy, keywords + 12 more | specId, id, name, role, category (human name), description, capabilities, status, source, builtin |
| Risk / tools / keywords | present | **absent** (0 of 229 have any of them) |
| In the Vite bundle | **no** | **yes** — `dist/assets/core-other-*.js` contains `v1-agent-orchestration` and `specId` |
| Used for | routing, teams, health | `/agents` and `/features` pages and `infinityRuntime` search — display only |

Consequences, all `VERIFIED`:

- `/agents` renders "229 specialists. One brain." (`src/AgentsPage.jsx:45`) from `HEY_V1_AGENT_COUNT`, and `/features` renders "229 built-in agent roles" (`src/pages/Features.jsx:33`). The number is true of the catalogue and **not** of anything the application can execute.
- Id overlap between the two sets: **0**. They are not two views of one registry; they are two registries with the same cardinality and no shared identity.
- The catalogue has no `risk` field, so the only risk classification that exists anywhere in the product is the one in the contracts — which the product does not load.

That is how "229 agents" became folklore: the visible number and the executable registry are different objects with the same size.

### 4.5 The real routing problem is collision width, not coverage

Because the score is a bag-of-words sum, a plain sentence activates most of the registry and the winner is decided by file order. Measured with the router's exact scoring and tie rule `REPRODUCED`:

| Input | Agents that match | Top score | Agents tied at top | Winner (by file order) |
|---|---|---|---|---|
| `agent` | **229 / 229** | 2 | 229 | `intent` |
| `help me plan my day` | 7 | 1 | 7 | `planner` |
| `write code for my app` | **53** | 3 | **5** | `provider-routing` |
| `find the latest news and verify the facts` | **199** | 5 | 2 | **`verifier`** |

Read the last row: a request for **news** is routed to the **Verifier Agent** because `verifier` appears earlier in `data-core.ts` than `news` and both score 5. Read the third: a coding request is routed to **Provider Routing** because it ties at 3 with `code-review`, `testing`, `refactor` and `code-quality`, and `provider-routing` appears first in `data-dev.ts`.

Reachability is 229/229 and usefulness is decided by an accident of file order. **That is the actual finding.** A registry of 229 where any sentence matches 199 is not a capability; it is a lookup table with a tie-break bug.

---

## 5. Duplicate clusters and what they cost

### 5.1 Measured clusters

| Cluster | Members | Evidence | Cost |
|---|---|---|---|
| **Dev family** | 23 agents (`architect` … `native-tauri`) | all share `code`, `app`, `project` (injected by `DEV_KEYWORDS`); 253/253 keyword-collision pairs are here | any coding request ties all 23 at the same score; the winner is whichever sits earliest in `data-dev.ts`. `write code for my app` → 5-way tie, `provider-routing` wins |
| **Two registries of 229** | `src/lib/agents/data-*.ts` and `agents/v1AgentCatalog.js` | 229 vs 229 entries, **0 shared ids**, different fields, only one is bundled (§4.6) | every update to a role has to be made twice or silently diverges; the UI cannot show risk/tools because the catalogue has none |
| **`state` / `cross-device`** | 2 | description Jaccard 0.50 — both are “keep state in sync across devices” | one of them can never be primary for the shared query; two QA surfaces for one behaviour |
| **`calendar` / `time-management`** | 2 | 0.43 — both own “plan the day” | “schedule my day” splits by file order |
| **`agent-designer` / `tool-designer`** | 2 | 0.33 — “design a new agent” vs “design a new tool” | Forge answers “build me an agent” with three different agents depending on wording (`forge-planner`, `agent-designer`, `tool-designer`) |
| **`database` / `migration`** | 2 | 0.33 — schema design vs schema change | `migration` is also `D`, so the 23-way dev tie swallows both |

### 5.2 Hand-identified role clusters (`INFERRED` — from reading all 229 purpose lines, with the evidence stated)

These are the same *job* under two names. They do not show up in prose similarity because the wording differs.

| Role | Agents | Why it is one job |
|---|---|---|
| Competitor tracking | `competitor` (L), `competitive-research` (C) | “Tracks competitors and turns their moves into your strategy” vs “Maps competitors, their features, pricing and positioning” |
| Memory privacy | `privacy` (E), `memory-privacy` (B) | GDPR retention vs “tags and redacts sensitive memories”; one policy, two owners |
| Trust/safety | `trust` (P), `security-policy` (A), `output-sanitization` (P) | “safe, honest, trustworthy” / “security policies and guardrails” / “no secrets, no injection, no harm” |
| Task state | `task` (A), `taskboard` (J), `planner` (A) | create tasks / show the board / plan steps is one pipeline, three agents |
| QA of output | `code-quality` (D), `content-qa` (L), `design-qa` (I), `quality` (A) | four “quality” gates with no shared contract |
| Goals | `goal-memory` (B), `goal-coach` (K) | store the goal / coach the goal |
| Release | `release` (D), `release-gate` (P), `devops` (D) | version bump / go-no-go / deploy |
| Research vs research planner | `research-planner` (C), `planner` (A) | both own “make a plan” |

**Eight inferred clusters covering 22 agents.**

### 5.3 What the duplication costs, in numbers

| Cost | Measure |
|---|---|
| Routing resolution lost | on `write code for my app`, 5 agents tie at the top and 53 match; the decision is file order `REPRODUCED` |
| Verification supply fragmented | **13** agents are verifier-capable (category P = 10, plus `verifier`, `fact-check`, `source-verify`); **0 of the 13 carry `high` or `critical` risk** `VERIFIED` — so every high-risk task is verified by a lower-risk agent, and the new selector says so (`verifier-risk-below-task-risk`) |
| Team coverage holes | only **126 of 229** agents belong to one of the 8 teams; **103 are teamless**, so team-based execution cannot reach them at all `VERIFIED` |
| Maintenance surface | 229 contracts × 16 fields; 200 risk labels are defaults, so 200 would have to be classified before any risk-based policy can be trusted |

---

## 6. The teams claim, checked

The brief said existing tests assert that teams require a configured verifier. **They do — for a different team system** `VERIFIED`:

- `tests/agent-team-execution.test.js` imports `src/core/agentEngine.js` and asserts `/separate verifier/` and `/configured execution/`. That is the runtime team engine: planner + integrator + verifier + bounded specialists, with a failed required role blocking acceptance. The assertions are real and they pass.
- `src/lib/agents/teams.ts` — the 8 static teams that the 229-agent router uses — has **no verifier field at all**. `AgentTeam` is `{ id, name, description, goal, lead, members, categories }`, validated only for member existence (`teams.ts:94-103`). `findTeamForAgent` returns the first team containing the agent.
- Therefore: “teams require a verifier” is true of `agentEngine`, false of the 229-agent team layer. Before Part 4, no code path could have caught that difference, because the 229-agent layer is not executed by anything.

The new `delegationPlan.js` closes the gap for the new path: a plan without a verifier that depends on every executor is `invalid` and is never returned as executable.

---

## 7. What the new modules change for Part 5

| Before | After | File |
|---|---|---|
| Highest bag-of-words score wins; ties by file order | minimum sufficient set, ranked by declared-keyword coverage then weight then category specificity then id; ties reported as `ambiguous-match` | `src/core/agentSelection.js` |
| Never refuses | refuses with a code: `no-agent-match`, `no-verifier`, `exceeds-max-agents`, `uncovered-requirements:<x>`, `max-agents-above-hard-cap` | same |
| Always exactly one agent | up to `maxAgents` (hard cap 3), and a set is returned only when a requirement needs more than one | same |
| No verifier concept | verifier required for high/critical, always distinct from executors, risk adequacy reported | same |
| Ignores forbidden tools and permissions | excludes with a stated reason: `forbidden-tool:x`, `tool-not-allowed:x`, `permission-not-allowed:x`, `privacy-too-weak:x` | same |
| Health is a display string | `not-selectable:<state>`; blocked/disabled never selected, and success cannot clear a block | `src/core/agentHealth.js` |
| No plan, no cycle check | DAG with cycle detection, `maxParallel` ≤ 3, verifier depends on every executor, `invalid` instead of exceptions | `src/core/delegationPlan.js` |
| No contract validation | required id/name/category/description/risk, unknown risk rejected, keyword-or-alwaysEligible required, duplicates rejected, frozen output | `src/core/agentContract.js` |

**What it does not change:** relevance is still bag-of-words over declared keywords. `help me plan my day` selects `finance-planning` (a tie at score 1, broken by category size) and says `ambiguous-match`. Part 5 must supply `task.type`, `requiredCategories` or `requiredTools` — or classify intent — for the selector to be precise. The selector's guarantees are about *constraints, risk, refusal, verification and determinism*, not about semantic understanding. Saying otherwise would be the kind of claim this part exists to prevent.

---

## 8. Numbers, with their labels

| Number | Value | Label |
|---|---|---|
| Agents parsed | 229 (48/53/55/42/31) | `REPRODUCED` |
| Parse failures | 0 | `REPRODUCED` |
| Data anomalies | 1 (`display` declares `resolution` twice, `data-knowledge.ts:30`) | `REPRODUCED` |
| Agents declaring tools | 229 | `VERIFIED` |
| Agents declaring permissions | 109 (229 effective) | `VERIFIED` |
| Agents declaring risk | 29 (200 inherit `low`) | `VERIFIED` |
| Agents with no keywords | 0 | `VERIFIED` |
| Shared keywords | 34 (3 of them injected into 23 dev agents) | `VERIFIED` |
| Keyword-collision pairs | 253, all inside the dev family | `REPRODUCED` |
| `high`/`critical` agents | 16 (13 + 3) | `VERIFIED` |
| `high`/`critical` **with a write tool** | **1** (`incident-response`) | `VERIFIED` |
| Write-capable agents | 31 | `VERIFIED` |
| Reachable by the router algorithm | **229 / 229** | `REPRODUCED` |
| Reachable from the running web app | **0 / 229** | `REPRODUCED` |
| Near-duplicate description clusters | 1 at Jaccard ≥ 0.50; 4 pairs ≥ 0.30 | `REPRODUCED` |
| Inferred role clusters | 8 clusters, 22 agents | `INFERRED` |
| Agents in a team | 126 (103 teamless) | `VERIFIED` |
| Verifier-capable agents | 13, of which 0 at `high`/`critical` risk | `VERIFIED` |
| Largest routing collision | 229 agents match the word "agent"; 199 match one news sentence | `REPRODUCED` |
| Registries called "229 agents" | **2**, with **0** ids in common | `REPRODUCED` |

---

## 9. Decisions required

1. **Wire the 229-agent layer into the app, or retire it?** Today the contracts are 737 lines of agent code (`types`, `factory`, `registry`, `router`, `teams`, `health`) plus 306 lines of data — and a 201,649-byte snapshot — that no user request can reach, while a different 229-entry catalogue without any risk or tool data is what ships.
2. **Re-classify risk, or make `low` mean "unclassified"?** 200 of 229 labels are the factory default. Any risk-gated policy is currently a policy over a default value.
3. **Who verifies high-risk work?** There are 13 verifier-capable agents and none is `high` or `critical` risk. Either a verifier's risk class is allowed to be lower than the task's (the selector warns and proceeds) or high-risk execution is refused until the registry has a comparable verifier.

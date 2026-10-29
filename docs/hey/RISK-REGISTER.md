# HEY — RISK REGISTER (Part 1)

Severity: **Critical** / **High** / **Medium** / **Low**. Every risk has evidence and an owner decision where one is needed.

| ID | Risk | Severity | Evidence | Status |
|---|---|---|---|---|
| R-01 | Native installers cannot be built — no Rust, no cargo, no MSVC | **Critical** (blocks the primary distribution goal) | `cargo`/`rustc` NOT FOUND | Action available: install free toolchain |
| R-02 | Only one test failure left, and it is blocked by missing `git` | Low | `Test-HeyUpgrade.ps1` fails on `git` | Blocked — install git |
| R-03 | Two real secrets on disk: `AUTH_SECRET`, `VAPID_PRIVATE_KEY`, `ADMIN_TOKEN` | **High** | Present in `.env`, value class only | Files are gitignored. Whether they were ever committed is `UNKNOWN` without git |
| R-04 | No provider API keys — chat, research, and generation cannot run | **High** | All keys placeholder | Expected; blocks end-to-end verification |
| R-05 | `push.ts` may not be using the VAPID private key that exists | Medium | Private key present; push reported unconfigured | Unverified — needs a trace |
| R-06 | 10 empty or orphan files, including `src/pages/Login.jsx` | Low | 0-byte files | Dead residue; `/login` uses `LoginPage.jsx`, so no user impact |
| R-07 | `next.config.js` present while Next is not a dependency | Medium | No `next` in `package.json` | Misleads agents into assuming a Next.js app |
| R-08 | `src-tauri` is 3,863 MB — build artifacts bloating the tree | Low | Directory measurement | Slows backups; not a product risk |
| R-09 | Many `src/core` engines are unverified end to end | **High** | Only 186 tests across 98 engines | Part 2+ must trace them; Part 1 classified only defects found |
| R-10 | No lint run | Medium | `eslint` not executed in Part 1 | UNVERIFIED |

## Decisions required from the owner

1. **Install Rust + VS Build Tools?** (free, ~1–2 GB) — unblocks every installer target except macOS/iOS.
2. **Install git?** (free) — unblocks the last test and would let us check whether `.env` was ever committed.
3. **Rotate `AUTH_SECRET` / `VAPID_PRIVATE_KEY` / `ADMIN_TOKEN`?** Only after we can check history; rotating blind breaks existing sessions.

---

# PART 2 — RISKS, FINDINGS, AND RECORDED CONFLICTS

**Date:** 20 October 2026
**Status of Part 1 entries:** unchanged. Nothing above was edited, re-scored, or removed.
**Labels:** `VERIFIED` (read in code), `REPRODUCED` (ran it), `INFERRED`, `REPORTED`, `UNKNOWN`, `BLOCKED`.

## A. Conflicts between the Part 2 brief and the repository

Per the instruction that the repository wins for facts and that a conflict is never resolved silently, each is recorded here with the resolution actually taken.

| ID | The brief says | The repository says | Resolution taken |
|---|---|---|---|
| **C-01** | "98 core modules in `src/core/`" | 98 `.js` files directly inside `src/core/` **plus** 10 more in `src/core/infinity/` (108 total) `VERIFIED` | Both are true at different boundaries. Reported as: 98 = direct children, 108 = whole tree. The 98 are classified; the 10 are noted, not classified. No file moved. |
| **C-02** | Risk levels are `R0`–`R4` (§10.2) | `capabilityRegistry.js` and `toolRegistry.js` use `low / medium / high / critical`; `permissionManager` uses the same string scale `VERIFIED` | `capabilityContract.js` implements `R0`–`R4` **as instructed**, with no conversion function, because a silent mapping would be an invention. The mapping is an owner decision — see D-1 below. |
| **C-03** | `validateCapability(record)` "rejects … duplicate ids in a set" (§10.2), but the signature takes one record | Duplicate detection is a property of a set, not a record `VERIFIED` | Implemented additively: `validateCapability(record, { siblings })` plus `validateCapabilitySet(records)`. The required single-argument call still works. |
| **C-04** | §7.1 lists `providerRouter` in the orchestration path ("which calls `providerRouter`") | The client computes a `providerPlan` that the edge function never reads; the provider is chosen server-side in `index.ts:87-98` `VERIFIED` | Documented as decoration in `ARCHITECTURE.md` §2. Repo wins. |
| **C-05** | `NEXT-PART.md`: "at least some are unreachable" | Exactly **1** module is imported by nothing; **25** are imported only by the barrel chain `VERIFIED` | Not a contradiction, a refinement. Both numbers reported; the 25 are not called "orphans" because their files are bundled. |
| **C-06** | Part 1: D1 is `FIXED`, "the local intelligence router" repaired | `decide()` no longer throws, but `processRequest` is `async` and `heyBrain` never awaits it, so the router is skipped on every message `REPRODUCED` | Part 1's statement is true of the function and false of the path. Recorded as R-02-01. Part 1's text was **not** edited. |
| **C-07** | This part assumed an exclusive working tree | **Another process wrote to the repository during this part and was still writing at 16:27:46.** New core modules appeared at 16:21:07, 16:21:17, 16:21:34, 16:21:48, 16:21:57, 16:26:48, 16:27:03 and 16:27:32; 4 test files, 6 docs, `scripts/snapshot-agents.mjs`, 2 `.log` files and 8 fixtures also appeared `VERIFIED` by timestamp | Measurements are a dated snapshot: **98 core modules and 186 tests at 16:17–16:21; 107 core modules and 266 tests at 16:27**. **No file created by the other process was read, edited, or relied on.** Both test runs are reported separately in the proof pack. |

## B. New risks

| ID | Risk | Severity | Evidence | Status |
|---|---|---|---|---|
| **R-02-01** | The local intelligence fabric is never consulted on the chat path: `processRequest` is `async` (`localIntelligence.js:408`), `heyBrain.js:219-225` reads `.executed` off a Promise | **High** | `REPRODUCED`: `is Promise: true, p.executed: undefined` | Open — fix requires changing an existing module (R2), deferred |
| **R-02-02** | The reflex engine reports actions it does not perform: `ReflexEngine.execute` writes `{action:'reflex.executed', status:'success'}` and returns `executed:true, verified:true` without acting; matching is fuzzy in both directions | **Critical** (false success + false audit) | `REPRODUCED`: `await processRequest({input:'play something relaxing'})` → `{"route":"reflex","result":"media_play","executed":true,"verified":true}`; matcher at `localIntelligence.js:49-53` | Open — latent today only because of R-02-01 |
| **R-02-03** | `src/core/computerControlEngine.js` is a full second implementation of `computerControl.js` (same class name, 22 shared exports) and is imported by nothing | Low | `REACHABILITY.md` §4.1 | Open — **not deleted**; owner decision D-3 |
| **R-02-04** | A cycle is avoided by a dynamic import that the bundler reports as ineffective: `memoryInbox.js` → `contextManager.js` | Low | Build stderr `[INEFFECTIVE_DYNAMIC_IMPORT]`; 0 SCCs in the graph | Open |
| **R-02-05** | Two different objects are both called `receipt`: `{id, actionId, approvalId, nativeApprovalId, nativeReceiptId}` (`permissionManager.js:839`) and `{provider, model, costCents, latencyMs}` (`localIntelligence.js:511`) | Medium | Both `VERIFIED` | Open — naming collision for Part 3 |
| **R-02-06** | The emergency stop is unreachable and unwired: `trustCenterEngine.stopEverything()` publishes `trust.stop_everything`, which has **zero** subscribers; `trustCenterEngine` is barrel-only | **High** (safety control that does nothing) | Event census: 143 published, 21 subscribed; `trustCenterEngine.js:453` | Open |
| **R-02-07** | 25 of 97 engines are bundled only because `src/core/index.js` builds a giant object literal that three UI files import; only 6 barrel members are ever called | Medium | `REACHABILITY.md` §1 | Open |
| **R-02-08** | Domain engines are not connected to the pages named after them: `/health` uses `lib/heyRecords.js`, not `healthEngine.js`; `/deen` uses `lib/heyDeen.js`, not `religiousEngine.js`; 17 routes resolve to the identical 20-module shell set | **High** (the product surface and the engine layer are disjoint) | `REACHABILITY.md` §5.2 | Open |
| **R-02-09** | Missions are persisted only to `localStorage` (`hey_infinity_missions`), never to Postgres | Medium | `missionEngine.js:6, 40` | Open |
| **R-02-10** | Execution checkpoints are an in-memory `Map` with a TTL, so a reload erases the only record that an action had an uncertain outcome | Medium | `executionController.js:13, 236` | Open |
| **R-02-11** | Server-side conversation dedupe on `request_id` can never fire: the client sends `crypto.randomUUID()` on every call | Medium | `heyAI.js:113` vs `index.ts:560-568` | Open |
| **R-02-12** | `providerPlan` is computed, posted and ignored | Low | `heyAI.js:122`; no reference in `index.ts` | Open |
| **R-02-13** | The 10 empty files are imported by nothing (closes the Part 1 `UNKNOWN`) | Low | 0 references for each; real buttons live in `src/components/Buttons.jsx` | Recorded, no action |
| **R-02-14** | Risk-level vocabularies disagree: `R0`–`R4` (this contract) vs `low/medium/high/critical` (both registries) | Medium | `capabilityRegistry.js:63-87`, `toolRegistry.js:39` | Open — owner decision D-1 |
| **R-02-15** | No per-capability authorization exists server-side. `hey_permissions` is read in the browser (`heyAI.js:63-68`) and passed to a client-side gate; the only non-bypassable checks are in Rust (`main.rs:1200`) | **High** (architectural, not a defect introduced here) | `ARCHITECTURE.md` §5 | Open — owner decision D-2 |
| **R-02-16** | A refused action is rendered as a normal assistant message, not as an error (`heyAI.js:97-101`) | Medium | `TRACE.md` F-5 | Open |
| **R-02-17** | Two agents were writing to the same working tree at the same time; a later part can no longer tell which files belong to which part without checking timestamps | **High** (provenance, not code) | C-07; `docs/hey/` now contains documents from Parts 2, 4 and 5 | Open — the owner should serialise parts, one at a time |

## C. Decisions required from the owner

1. **D-1 — Risk vocabulary.** Adopt `R0`–`R4` as the single scale and define the mapping from `low/medium/high/critical` (proposal: low→R1, medium→R2, high→R3, critical→R4)? Part 2 implemented `R0`–`R4` and deliberately did **not** guess the mapping.
2. **D-2 — Authority boundary.** Is renderer-enforced permission acceptable as a UX gate, with Rust as the real boundary (current state), or must Part 3 add a server-side capability authorization endpoint?
3. **D-3 — The orphan duplicate.** `computerControlEngine.js` is 20 KB, unreferenced, and duplicates `computerControl.js`. Keep it (as intended-later work), or authorise deletion in a later part? It was **not** deleted.

---

# PART 4 — AGENT-ECOSYSTEM RISKS

**Date:** 20 October 2026
**Status of Part 1 and Part 2 entries:** unchanged. Nothing above was edited, re-scored, or removed.
**Evidence for every row:** `docs/hey/AGENT-TRUTH.md`; the data is `docs/hey/agents.snapshot.json`.

Note on provenance (extends `R-02-17`): Parts 4, 5, 6 and 7 were writing to this tree at the same time (`docs/hey/` gained `EVOLUTION-TRUTH.md`, `VAULT-SPEC.md`, `MEMORY-TRUTH.md`, `PART-06-HANDOFF.md` and new `src/core` modules while Part 4 ran). Part 4 measured only files whose hashes it recorded, modified no file under `src/lib/agents/`, and touched no file created by another part.

| ID | Risk | Severity | Evidence | Status |
|---|---|---|---|---|
| **R-04-01** | **Two registries are both called "229 agents" and share zero ids.** `agents/v1AgentCatalog.js` (229 entries, `v1-*` ids, no risk/tools/keywords) is bundled and displayed on `/agents` and `/features`; the 229 executable contracts in `src/lib/agents/data-*.ts` are absent from the build entirely | **High** (the product's headline number describes a set that cannot run; the set that could run has never been reachable) | `AGENT-TRUTH.md` §4.6; `dist/assets/core-other-*.js` contains `v1-agent-orchestration`, and none of the four contract-only strings | Open — Part 4 decision P4-1 |
| **R-04-02** | **`risk` is a default for 200 of 229 contracts.** 29 declare it; 200 inherit `low` from `DEFAULT_CONTRACT`; the display catalogue has no risk field at all | **High** (any risk-gated policy currently gates on an unset value) | `agents.snapshot.json` → `analysis.byDeclaredRisk` | Open — Part 4 decision P4-2 |
| **R-04-03** | **No risk-comparable verifier exists.** 13 agents can verify (category P = 10, plus `verifier`, `fact-check`, `source-verify`); none is `high` or `critical` | **High** | `AGENT-TRUTH.md` §5.3 | Mitigated only for the new path: `selectAgents()` returns `verifier-risk-below-task-risk` instead of hiding it. Owner decision needed |
| **R-04-04** | **One high-risk agent can write:** `incident-response` (`critical`, `memory_save`, `web_search`) is the only `high`/`critical` agent with a write-capable tool | **High** | `AGENT-TRUTH.md` §3.5 | Recorded. No mitigation without a memory-write audit decision |
| **R-04-05** | **Router ties are decided by file order.** `routeRequest` breaks equal scores by registry position: a news request routes to the Verifier Agent; a coding request routes to Provider Routing | Medium (wrong agent, no crash) | `AGENT-TRUTH.md` §4.5, reproduced with the router's own weights | Not live (router unwired). Fixed in `src/core/agentSelection.js`, but integration is Part 5 |
| **R-04-06** | **The 13-tool list does not model capability.** `terminal` (high) declares `['calculator']`; `computer-use` (high) declares `['calculator']`; the real computer-control surface is `src/core/computerControl.js` | **High** (risk labels describe intent, not reach) | `AGENT-TRUTH.md` §3.5 | Open — needs a capability model, not a tool list |
| **R-04-07** | **One data defect in a read-only file:** `display` declares the keyword `resolution` twice (`data-knowledge.ts:30`); `agents/v1AgentCatalog.js` has 229 entries but 228 unique ids (`v1-dependency-agent` twice) | Low | `agents.snapshot.json` → `analysis.anomalies`; catalogue inspection | Not fixed: `src/lib/agents/` is R2 read-only in Part 4 |

## Part 4 decisions required from the owner

1. **P4-1 — Which registry is authoritative?** Wire the 229 contracts into the app, or retire them and keep the `v1-*` catalogue as display-only? Part 4 cannot decide this and did not wire anything.
2. **P4-2 — Does `low` mean "classified low" or "unclassified"?** 200 of 229 labels are the factory default; a risk gate over them is a gate over a default.
3. **P4-3 — May a verifier be lower risk than the task?** Today every verifier is, because no `high`/`critical` verifier exists. Either accept it with the warning, or refuse high-risk execution until the registry gains a comparable verifier.


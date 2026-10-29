# HEY — NEXT PART HANDOFF

**From:** Part 1 — Foundation Truth, Baseline, Repair
**To:** Part 2 — HEY Overall Architecture and Intelligence (stages 6–10)
**Date:** 20 October 2026

---

## What Part 2 receives

| Input | Location | State |
|---|---|---|
| Verified baseline | `docs/hey/BASELINE.md` | Complete |
| Repairs record | `docs/hey/REPAIRS.md` | 2 fixed, 1 blocked |
| Risk register | `docs/hey/RISK-REGISTER.md` | 10 risks, 3 decisions |
| Checkpoint | `C:\Users\DELL\Documents\hey-checkpoints\checkpoint-20261020-1610` | Restorable |
| Green build | `node node_modules/vite/bin/vite.js build` | 1.74 s, exit 0 |
| Test baseline | `node --test tests/*.test.js` | 185/186, 1 known blocker |

## What Part 2 must not redo

Do not re-audit the stack, the route table, the counts, or the build. Those are measured and dated. Re-doing them wastes a part.

## What Part 2 must do

Stages 6–10 of the 65-stage roadmap: HEY One architecture, intent-to-outcome planning, system boundaries and communication, shared state and event architecture, capability and integration registry.

Concretely, the highest-value work available:

1. **Map the real architecture** — how `heyBrain`, `agentRouter`, `executionEngine`, `contextManager`, `memoryEngine`, and `providerRouter` actually connect. Produce one diagram from code, not from documents.
2. **Find the orphans** — engines that nothing calls. There are 98 core modules and 13 tools; at least some are unreachable. A reachability analysis is the single most valuable output of Part 2.
3. **Define the capability contract** — the typed interface every capability must implement: input, output, permissions, cost, health, verification. This is the missing spine that makes runtime synthesis possible.
4. **Establish the event and state model** — what is a mission, what is a step, what is a receipt, what survives a crash.
5. **Trace one request end to end** — from `/chat` to a provider response and back, with the actual function calls named.

## Decisions still open from Part 1

1. Install Rust + VS Build Tools (unblocks installers).
2. Install git (unblocks last test + secret history check).
3. Rotate secrets — only after history is known.

## Warning carried forward

`REPOSITORY_IDENTITY.md`, `IMPLEMENTATION_STATUS.md`, and `FINAL_SUMMARY.md` disagree with each other and, in at least four places, with the code. `BASELINE.md` supersedes them for the facts it measured. Treat any other claim in them as `REPORTED`.

---

# Part 4 → Part 5 handoff

**From:** Part 4 — the specialist-agent ecosystem
**Date:** 20 October 2026
**Read together with:** `docs/hey/AGENT-TRUTH.md` (the evidence) and `docs/hey/agents.snapshot.json` (the data).

## What Part 4 delivers

| Artifact | What it does | Tests |
|---|---|---|
| `scripts/snapshot-agents.mjs` | parses all 229 `ag()` records from text, hashes each source file, fails loudly on any unparseable or invalid record | `tests/agent-snapshot.test.js` (5) |
| `docs/hey/agents.snapshot.json` | 229 records with declared **and** effective fields, per-file sha256, routing reachability | current (`--check` passes) |
| `src/core/agentContract.js` | `validateAgent`, `validateAgentSet`, `defineAgent`, `normalizeAgent`, `summarizeAgents`, risk/privacy ranks, tool table | `tests/agent-contract.test.js` (12) |
| `src/core/agentSelection.js` | pure `selectAgents()`: minimum sufficient set, hard cap 3, distinct verifier, refusals with codes, measured confidence | `tests/agent-selection.test.js` (21) |
| `src/core/delegationPlan.js` | pure `buildPlan()`: DAG, cycle detection, `maxParallel` ≤ 3, verifier depends on every executor | `tests/delegation-plan.test.js` (13) |
| `src/core/agentHealth.js` | `healthy/degraded/unavailable/blocked/disabled`, thresholds, owner-only unblock, no timestamps | `tests/agent-health.test.js` (13) |

64 tests added; full suite 421 tests, 420 pass, 1 known blocked failure (`upgrade-orchestrator`, needs git). Build succeeds.

## What Part 5 must not assume

1. **The 229 contracts are not wired.** `routeRequest` is imported only by Next.js handlers in a repo without Next. Nothing in the Vite app graph reaches it, and no agent string is in `dist/`.
2. **A second, unrelated 229-entry catalogue is what ships** (`agents/v1AgentCatalog.js`, `v1-*` ids, no risk/tools/keywords), displayed by `/agents` and `/features`.
3. **The live router is `src/core/agentRouter.js`** over `agents/agents.js`. Integration means choosing which registry is authoritative, not merging three.
4. **Risk is unclassified for 200 of 229** — the default, not a decision.
5. **No verifier is risk-comparable.** 13 agents are verifier-capable; none is `high` or `critical`.

## What Part 5 must do

1. Pick one registry and delete or derive the others (owner decision, not an agent decision).
2. Wire `selectAgents()` + `buildPlan()` + `isSelectable()` into the request path behind the existing authorization gate, not beside it.
3. Feed `task.requiredCategories` / `requiredTools` from intent classification; description-only selection is bag-of-words and says so (`ambiguous-match`).
4. Replace `routeRequest`'s tie-by-file-order with the selector's documented tie-break.
5. Decide what happens when a high-risk task has no comparable verifier (see `AGENT-TRUTH.md` §9).

## Still open from Part 1

Installing git, installing Rust + VS Build Tools, and rotating secrets are unchanged and still owner decisions.


# HEY — PART 4 INTEGRATION HANDOFF (from Part 3)

**Date:** 20 October 2026
**Status:** Part 3 complete; nothing wired into the runtime. This file records what Part 4 inherits.

---

## 1. Files Part 3 added (all additive, nothing modified)

| File | Purpose | Tested by |
|---|---|---|
| `src/core/modelRegistry.data.js` | 22 code-verified model ids across the 6 providers; every price `-1` | `tests/model-registry.test.js` |
| `src/core/modelRegistry.js` | `validateModel` · `defineModel` · `getModel` · `listModels` · `assertSelectable` | `tests/model-registry.test.js` |
| `src/core/routingPolicy.js` | Pure deterministic router: `route()` · `explain()` | `tests/routing-policy.test.js` |
| `src/core/costGovernor.js` | Integer-cent ledger: `createEnvelope` · `reserve` · `commit` · `release` · `remaining` · `snapshot` | `tests/cost-governor.test.js` |
| `src/core/modelEvaluator.js` | Offline scoring: `scoreCase` · `summarize` · `validateSchema` | `tests/model-evaluator.test.js` |
| `tests/fixtures/providers/*.synthetic.json` | 7 `SYNTHETIC` response shapes + manifest | `tests/model-evaluator.test.js` |
| `docs/hey/PROVIDER-TRUTH.md` | Which provider file actually rules; all 16 routing bypasses | — |
| `docs/hey/MODEL-STRATEGY.md` | Stage-15 decision record | — |
| `docs/hey/PART-4-INTEGRATION.md` | This file | — |

## 2. Integration order for Part 4

1. **Register, do not replace.** `src/lib/ai.ts` `MODEL_CONFIG` and the `*_MODEL` defaults in
   `supabase/functions/hey/index.ts:89-92` should be *checked against* `listModels()`; do not delete
   `MODEL_CONFIG` while `src/lib/provider-router.ts` imports it (line 1).
2. **One call path.** `hey/index.ts` should call `route()` once, before `callProvider`, and pass the chosen
   provider. The vision branch (`hey/index.ts:419-475`) currently keeps its own attempt list and should call
   `callProvider` (or `route()`) instead — see `PROVIDER-TRUTH.md` B1/B2.
3. **Budget.** Reserve before the fetch, commit the estimated cost after; `-1` prices must refuse under a
   budget rather than spend blind.
4. **Retire duplicates only after 1-3 land.** `src/core/providerRouter.js` is imported by
   `heyBrain.js:20` and `inputFusion.js:8`; `providerRegistry.js` by `core/index.js:210` and
   `components/ui/index.js:134`. Deleting either before rewiring those imports breaks the app.
5. **Decide on the two dormant providers.** Anthropic and DeepSeek have adapters and registry entries and are
   absent from `getProviderAttempts()` (`hey/index.ts:88-93`).

## 3. Constraints Part 4 inherits

- No provider key exists; every integration must be verifiable without one. The four modules above are
  pure and need no key.
- `src/lib/providers.ts` cannot be imported by the SPA today: `openai` and `@anthropic-ai/sdk` are not in
  `package.json`. Adding them is a dependency change (R3 for Part 3) and an owner decision.
- The `src/app/**` Next surface is not buildable (`next` absent). Do not assume it runs.

## 4. Part 2 dependency note

`docs/hey/REACHABILITY.md`, `docs/hey/ARCHITECTURE.md`, `docs/hey/AGENT-OWNERSHIP.md`,
`docs/hey/POST-15-BACKLOG.md`, `src/core/capabilityContract.js` and `tests/capability-contract.test.js`
arrived while Part 3 was running and were read; the R0–R4 vocabulary is shared, and `ARCHITECTURE.md`
independently reaches the same provider conclusion as `PROVIDER-TRUTH.md`. Part 3 modified none of them and
did not modify `NEXT-PART.md` (existing files are frozen in this part), so the handoff is recorded here
instead.

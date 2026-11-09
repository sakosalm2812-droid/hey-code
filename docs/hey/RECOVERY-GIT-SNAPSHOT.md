# RECOVERY GIT SNAPSHOT — Phase 0

Generated: 2026-11-09. Branch: `step3-cognitive-fabric`. HEAD: `9e8a39b`.

## Git state at snapshot

- **Branch:** `step3-cognitive-fabric` (current)
- **HEAD:** `9e8a39b` — "HEY Step 3: Cognitive Fabric Complete - 9 brain modules + conformance checker"
- **Recent commits:**
  - `9e8a39b` HEY Step 3: Cognitive Fabric Complete - 9 brain modules + conformance checker
  - `3b5e8bd` Working build: 3001 modules, 162 assets
  - `ab3d1d1` Agent: src\(dashboard)\dashboard\settings\page.tsx
  - `427d877` Agent: src\(dashboard)\dashboard\research\page.tsx
  - `93ecf32` Agent: src\(dashboard)\dashboard\page.tsx
- **Existing tags:** `hey-step1-baseline`, `hey-step2-foundation`, `hey-step3-brain` (pre-existing; will be force-moved in Phase 6)

## Foundation directory state

- `src/core/foundation/` — **DOES NOT EXISTS** (confirmed: `ls` → "No such file or directory"). This is the gap Step 3's modules import from.
- Step 3's 9 modules all exist at `src/core/`:
  - `src/core/topologyRegistry.js`
  - `src/core/decisionFabric.js`
  - `src/core/evidenceBoard.js`
  - `src/core/dissentPreservation.js`
  - `src/core/deliberationBudgeter.js`
  - `src/core/intelligenceCouncil.js`
  - `src/core/contextAssembler.js`
  - `src/core/responsePipeline.js`
  - `src/core/cognitiveFabric.js`

## Test baseline (Phase 0)

Command: `npm test` → `node --import ./tests/test-setup.js --test tests/*.test.js`

- **Tests:** 1560
- **Suites:** 155
- **Passing assertions:** 1690
- **Failing:** 51
- **Failing test files (26):** capture-item, capture-router, guidance-model, lesson-plan-model, mode-effects, observe-state, prim-003-memory-read-write, prim-009-search, shortcut-registry, tray-state, plus PRIM-005/011/012/014/015 acceptance tests, and "the committed snapshot is current and covers all 229 records".

These pre-existing failures are NOT caused by this recovery session. Phase 5 must show test count >= 1560 and no *new* failures introduced by foundation work.

## Untracked leftovers (NOT deleted — left as found)

These predate this session and were left in place. No destructive git command has been run.

- `recovered/` — 200+ hash-named `.txt` files
- `tmp/` — `audio-output.mp3`, `test-verify-file.txt`, `verify-subprocess.mjs`
- `rlDec) aA(  ftg2 noduuae" ...` — 2739-byte junk filename

## Hard rules in force for this session

1. Never run `git clean`, `git reset --hard`, `git checkout -- <path>`, or `git restore --source` without explicit user confirmation.
2. Commit after every phase.
3. Tag only after `git show <tag>:<file>` lists expected content.
4. No MVP / no fallbacks.
5. Never hallucinate — cite canonical file:line.
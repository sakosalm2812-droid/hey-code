# HEY — PART 1 BASELINE

**Date:** 20 October 2026
**Repository:** `C:\Users\DELL\Documents\hey`
**Part:** 01 of 15 — Foundation Truth, Baseline, and Repair
**Claim labels used throughout:** `VERIFIED` (observed), `REPRODUCED` (ran it), `INFERRED`, `REPORTED` (older document, not checked), `UNKNOWN`, `BLOCKED`.

---

## 1. Checkpoint

| Item | Value |
|---|---|
| Path | `C:\Users\DELL\Documents\hey-checkpoints\checkpoint-20261020-1610` |
| Contents | Source tree, excluding `node_modules`, `.pgdata`, `.next`, `dist`, `target`, `.opencode`, snapshot/backup directories |
| Files | 1,132 `VERIFIED` |
| Size | 117.1 MB `VERIFIED` |
| Method | `robocopy /E` with exclusions |

The repository is 4,450 MB excluding `node_modules`; `src-tauri` alone is 3,863 MB (build output). Only 4.1 MB is actual `src/`.

---

## 2. Verified stack

| Area | Finding | Evidence |
|---|---|---|
| Build | **Vite 8.3.0** | Build output prints `vite v8.3.0` — `REPRODUCED`. Note: prior docs said 8.1.1; that was the declared range, not the resolved binary |
| Framework | React 19, React Router 7 | `package.json` — `VERIFIED` |
| Build result | **Success**, 2,914 modules, 1.74 s, exit 0 | `node node_modules/vite/bin/vite.js build` — `REPRODUCED` |
| Node | v24.21.0 | `REPRODUCED` |
| npm | Works via `cmd /c`; blocked as `npm.ps1` in PowerShell | `VERIFIED` |
| git | **Not installed** | `NOT FOUND` on PATH — `VERIFIED` |
| Rust / cargo | **Not installed** | `NOT FOUND` — `VERIFIED` |
| WebView2 | 155.0.4283.62 installed | Registry — `VERIFIED` |
| Python | 3.15 present | `VERIFIED` |

---

## 3. Measured counts

| Surface | Count | Method |
|---|---|---|
| Routes in `src/App.jsx` | **56** | parsed `path=` entries `VERIFIED` |
| Page files (`src/pages`) | **30** | `VERIFIED` |
| Core modules (`src/core`) | **98** | `VERIFIED` |
| Lib files (`src/lib`) | **128** | `VERIFIED` |
| Components | **249** | `VERIFIED` |
| Tauri commands | **13** | `#[tauri::command]` in `main.rs` `VERIFIED` |
| Agent tools | **13** | `agent-tools.ts` `VERIFIED` |
| Providers | **6** | openai, anthropic, openrouter, groq, gemini, deepseek `VERIFIED` |
| Prisma models | **32** | `schema.prisma` `VERIFIED` |
| SQL migrations | **19** | `supabase/migrations/` `VERIFIED` |
| Test files | **40** (39 original + 1 added) | `VERIFIED` |
| **Registered agents** | **229** | `ag(` records: core 48, creative 55, dev 53, knowledge 42, qa-forge 31 — `VERIFIED` |

The "229 agents" claim is **true**. It is a role registry, not 229 models.

---

## 4. Tests — before and after

| Run | Result | Command |
|---|---|---|
| Before any change | **181 pass / 2 fail / 183 total** | `cmd /c "cd /d C:\Users\DELL\Documents\hey && node --test tests/*.test.js"` `REPRODUCED` |
| After repairs | **185 pass / 1 fail / 186 total** | same command `REPRODUCED` |

---

## 5. Defects found and resolved

### D1 — `DecisionEngine.decide()` threw on every call `FIXED`
**Root cause:** the parameter was destructured as `userPreferences: _userPreferences`, but line 238 passed the bare identifier `userPreferences` to `determineRoute`. `ReferenceError: userPreferences is not defined`.

**Impact:** the local intelligence router — the component that decides local vs cheap API vs cloud — was **100% non-functional**. Every call threw. The test suite never caught it as a failure because the call site is fire-and-forget; it surfaced only as an "unhandled rejection after the test ended".

**This invalidates the earlier characterization that the failure was "environmental."** It was an application defect `VERIFIED`.

**Reproduction before fix:**
```
decisionEngine.decide({ input: 'open chrome' })
→ THREW: ReferenceError - userPreferences is not defined
```

**Fix:** one identifier (line 238). Regression tests added in `tests/local-intelligence.test.js`.

### D2 — `decide()` crashed when `hardwareProfile` was omitted `FIXED`
Found immediately by the new regression test. `determineRoute` read `hardwareProfile.localModelSupport` unconditionally.

**Fix:** default the parameter to `hardwareProfiler.getProfile()`.

### D3 — Upgrade orchestrator test `BLOCKED`
Two independent causes, both confirmed:
1. PowerShell execution policy blocks `-File Test-HeyUpgrade.ps1`.
2. Even with `-ExecutionPolicy Bypass`, the script fails with `The term 'git' is not recognized` — the script requires git, which is not installed.

**Status:** `BLOCKED — dependency`. Not "environmental noise"; precisely diagnosed. Installing git is a free, owner-approved action that would unblock it.

---

## 6. Empty and orphan files (10)

`src/pages/Login.jsx` is empty (0 bytes) but is **not wired** — `/login` renders `src/LoginPage.jsx` (4,409 bytes). So this is dead residue, not a broken route `VERIFIED`.

Other empty files: `PrimaryButton.jsx`, `SecondaryButton.jsx`, `ThemeToggle.jsx` with their `.module.css`, `Hero.css`, `Navbar.css`, and `hey-signature.svg`. Whether any is imported is `UNKNOWN` — not yet traced.

---

## 7. Security baseline

Both environment files are **gitignored** (`VERIFIED` against `.gitignore`):

- `.env` → matched by the exact line `.env` (line 28)
- `.env.local` → matched by `.env*.local` (line 27)

**This corrects a claim in `REPOSITORY_IDENTITY.md`, which stated `.env` was "not gitignored."** That claim is wrong.

Key names present (values never printed):

| File | Real-looking values | Placeholders/empty |
|---|---|---|
| `.env` (2,338 B) | `DATABASE_URL`, `AUTH_SECRET` (74), `HEY_PG_PASSWORD`, `VAPID_PRIVATE_KEY` (45), `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `ADMIN_TOKEN` (66), `BACKUP_S3_BUCKET`, `NEXT_PUBLIC_APP_URL`, `LAUNCH_DATE`, `POLICY_NOTIFY_SITE`, `STORAGE_DRIVER` | All provider keys (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `SERP_API_KEY`, Stripe, SMTP password), `SENTRY_DSN`, `BACKUP_AWS_*` |
| `.env.local` (316 B) | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_HEY_API_URL`, `VITE_VAPID_PUBLIC_KEY` | — |

**Real secrets on disk and ignored by git — that is correct practice.** The open question is whether either file was ever committed before the ignore rule existed. `git` is unavailable, so history is `UNKNOWN`. **Decision required, not a finding.**

VAPID *private* key present means push signing is possible — but `src/lib/push.ts` reportedly reports unconfigured. Whether that key is the one used is `UNKNOWN`.

---

## 8. Distribution readiness

| Target | Status | Missing |
|---|---|---|
| Windows installer | **BLOCKED** | Rust toolchain (`cargo`, `rustc`), MSVC build tools. WebView2 and Node are ready |
| macOS | **BLOCKED** | Requires macOS + Xcode + Apple Developer ($99/yr). Cannot cross-build from Windows |
| Linux | **BLOCKED** | Cross-compilation from Windows is not supported by Tauri |
| Android | **BLOCKED** | Android SDK, NDK, JDK; `src-tauri/gen/android` not initialized |
| iOS / TestFlight | **BLOCKED** | Requires macOS + Xcode + Apple Developer ($99/yr) |
| Web build | **READY** | Builds successfully in 1.74 s |

**The honest picture: HEY cannot produce a single installer today.** It can produce a web build. Installing Rust + VS Build Tools (both free) is the one action that unblocks the Windows target.

---

## 9. Corrections to older documents

| Old claim | Reality | Label |
|---|---|---|
| "Vite 8.1.1" | Resolved build tool is **8.3.0** | `VERIFIED` |
| "`userPreferences` failure is environmental / does not cause assertion failure" | It was a **real defect** that disabled the local router entirely | `VERIFIED` |
| "`.env` is not gitignored" | It **is** ignored | `VERIFIED` |
| "229 agents" | **True** | `VERIFIED` |
| "`journeys.test.js` unhandled rejection" | Explained and fixed by D1 | `VERIFIED` |

---

## 10. Proof pack

```text
=== PART 1 PROOF PACK ===
Repository:            C:\Users\DELL\Documents\hey
Checkpoint:            C:\Users\DELL\Documents\hey-checkpoints\checkpoint-20261020-1610 (1,132 files, 117.1 MB)
Files analyzed:        10,827 (4,450 MB excl. node_modules)
Test command:          cmd /c "cd /d C:\Users\DELL\Documents\hey && node --test tests/*.test.js"
Test result:           185 pass / 1 fail / 186 total      exit=1
  (before repairs:     181 pass / 2 fail / 183 total)
Build command:         node node_modules/vite/bin/vite.js build
Build result:          success (2,914 modules, 1.74 s)    exit=0
Lint command:          NOT RUN
Lint result:           UNVERIFIED
Routes found:          56
Core modules:          98 (none under 300 bytes)
Lib modules:           128
Registered agents:     229 (measured)
Agent tools:           13
Providers:             6
Prisma models:         32
Migrations:            19
Rust toolchain:        absent  cargo=none
Tauri bundle targets:  UNVERIFIED (not yet read in detail)
Installer readiness:   windows=BLOCKED macos=BLOCKED linux=BLOCKED android=BLOCKED ios=BLOCKED  web=READY
Files created:         tests/local-intelligence.test.js, docs/hey/*.md
Files modified:        src/core/localIntelligence.js (2 lines)
Repairs applied:       2
Risks recorded:        see RISK-REGISTER.md
Completion state:      CONNECTED — baseline established, two defects fixed, build and tests reproduced
Blockers:              git absent (D3); Rust/MSVC absent (installers); no provider keys; no Supabase CLI
```

**A number not measured is a lie about to be handed over. Every number above was measured today.**

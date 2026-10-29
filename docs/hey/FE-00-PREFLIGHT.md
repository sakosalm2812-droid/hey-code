# HEY — FE-00 PRE-FLIGHT

**Phase:** FE-0 — PRE-FLIGHT (no product features)
**Date:** 21 October 2026
**Repository:** `C:\Users\DELL\Documents\hey`
**Authority:** `HEY_FRONTEND_SYSTEM_SPEC.md` (`HEY-FE-01`, 20 Oct 2026) §PART F — FE-0
**Scope of this phase:** measure a baseline, install free toolchains, create a checkpoint, record discrepancies. **No product feature was implemented.**

**Claim labels:** `VERIFIED` (observed directly in code or measured output) · `REPRODUCED` (ran it and saw the result) · `INFERRED` (reasoned from evidence) · `REPORTED` (inherited from a document, not independently confirmed) · `UNKNOWN` (no evidence either way) · `BLOCKED` (cannot be done here; the exact blocker is named).

---

## 1. BASELINE MEASUREMENT

Both commands were run from `C:\Users\DELL\Documents\hey` at **19:14–19:16 local, 21 Oct 2026**.

### 1.1 Test suite

```
cmd /c "cd /d C:\Users\DELL\Documents\hey && node --test tests/*.test.js"
```

| Metric | Value | Label |
|---|---|---|
| Tests | **849** | `REPRODUCED` |
| Pass | **827** | `REPRODUCED` |
| Fail | **22** | `REPRODUCED` |
| Suites | 22 | `REPRODUCED` |
| Cancelled / skipped / todo | 0 / 0 / 0 | `REPRODUCED` |
| Duration | 7,480.7 ms | `REPRODUCED` |
| **Process exit code** | **1** | `REPRODUCED` |

Raw output: `C:\Users\DELL\AppData\Local\Temp\opencode\fe00-tests-before-tap.txt` (written 19:16:03). The default `spec` reporter run at 19:15:06 produced the same 22 failures; the `tap` reporter was used only to obtain machine-readable counts.

**This is the floor for every later phase: 827 passing tests, and the build must exit 0.**

### 1.2 Build

```
cmd /c "cd /d C:\Users\DELL\Documents\hey && node node_modules/vite/bin/vite.js build"
```

| Metric | Value | Label |
|---|---|---|
| **Build exit code** | **0** | `REPRODUCED` |
| Tool | `vite v8.3.0` | `REPRODUCED` |
| Modules transformed | 2,915 | `REPRODUCED` |
| Wall time | 2.57 s | `REPRODUCED` |
| Warnings | 4 × `[INEFFECTIVE_DYNAMIC_IMPORT]` (pre-existing; see `RISK-REGISTER.md` R-02-04) | `VERIFIED` |

Raw output: `C:\Users\DELL\AppData\Local\Temp\opencode\fe00-build-before.txt` (written 19:15:01).

### 1.3 The 22 pre-existing failures, triaged

`REPRODUCED` from the TAP output. Grouped by root cause.

| # | Failing test(s) | File | Root cause |
|---|---|---|---|
| 14 | `Journey 5/7/9/10/11/12/13/19/26/30/33/36` + `runs all journeys and produces aggregate report` + `each journey report has required fields` | `tests/e2e-journeys.test.js` | Assertions on `result.evidence` contents (e.g. expects an element containing `trace`/`403`/`tenant`). The evidence array no longer contains those markers. |
| 4 | `filtering happens before scoring…`, `every selection explains itself…`, `truncated is false only when nothing was dropped for budget`, `hostile records are excluded instead of throwing` | `tests/memory-retrieval.test.js` | Expected reason code `tenant-mismatch`; the code now returns `scope-mismatch`. The other three are in the same file and same family. |
| 2 | `captureConsent: screen capture requires userInitiated`, `deviceRouting: priority order and iPhone relay message` | `tests/part9-modules.test.js` | `captureConsent` returns `false` where the test expects `true`; `deviceRouting` returns `refuse` where the test expects `bridged`. |
| 1 | `the release matrix contains every HEY target without claiming unbuilt native releases` | `tests/release-surfaces.test.js` | **Stale expectation.** The test asserts the platform order `["web","windows","macos","linux","ios","android"]`; `src/core/platformMatrix.js` returns `["web","windows","macos","linux","android","ios"]` — which is the order the attached spec states in §0.7 (`web`, `windows`, `macos`, `linux`, `android`, `ios`). The **code matches the spec; the test is the stale party.** |
| 1 | `transactional upgrade framework protects baselines, logs, and rollback` | `tests/upgrade-orchestrator.test.js` | See §3.4. **Not a missing-toolchain problem.** |

`VERIFIED`: none of these 22 failures were introduced by this phase. This phase changed **no** file under `src/`, `tests/`, `scripts/`, or `package.json`.

---

## 2. TOOLCHAIN VERSIONS

### 2.1 What is installed and working

| Tool | Version | Path | Label |
|---|---|---|---|
| `rustc` | `rustc 1.99.1 (58cf8f9c3 2026-10-13)` | `C:\Users\DELL\.cargo\bin\rustc.exe` | `VERIFIED` |
| `cargo` | `cargo 1.99.1 (5f94df478 2026-08-27)` | `C:\Users\DELL\.cargo\bin\cargo.exe` | `VERIFIED` |
| `git` | `git version 2.56.0.windows.2` | `C:\Program Files\Git\cmd\git.exe` | `VERIFIED` |
| Rust host target | `x86_64-pc-windows-msvc` (stable toolchain, default, `x86_64-pc-windows-msvc` target installed) | `C:\Users\DELL\.rustup` | `VERIFIED` |
| VS Build Tools 2022 | `17.14.42` (instance `bc1708ea`, installed 2026-10-20T17:22:16Z) | `C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools` | `VERIFIED` |
| VS Community 2022 | `17.14.42` (instance `1efa0cda`, installed 2026-10-20T17:27:09Z) | `C:\Program Files\Microsoft Visual Studio\2022\Community` | `VERIFIED` |
| MSVC C++ toolset | `14.44.35207` — `cl.exe` **and** `link.exe` present at `…\Community\VC\Tools\MSVC\14.44.35207\bin\Hostx64\x64\` | — | `VERIFIED` |
| Windows SDK | `10.0.26100.0` | `C:\Program Files (x86)\Windows Kits\10` | `VERIFIED` |
| Node.js | `v24.21.0` | — | `VERIFIED` |
| npm | `11.19.0` (via `cmd /c`; `npm.ps1` is blocked by PowerShell execution policy) | — | `VERIFIED` |
| Windows PowerShell | `5.1.26100.9711` | — | `VERIFIED` |
| OS | Windows 11 Pro, `10.0.26200` | — | `VERIFIED` |
| `winget` | `v1.29.380` | `…\Microsoft\WindowsApps\winget.exe` | `VERIFIED` |

### 2.2 The three `winget install` commands — what actually happened

The three commands from the spec's FE-0 were executed verbatim (with `--accept-source-agreements --accept-package-agreements` added so no interactive prompt could hang the run). **All three failed identically:**

```
Failed in attempting to update the source: winget
Failed when searching source: winget
An unexpected error occurred while executing the command:
0x8a15000f : Data required by the source is missing

No packages were found among the working sources.
EXIT=-1978335217
```

| Command | Result | Label |
|---|---|---|
| `winget install Rustlang.Rust` | failed, exit `-1978335217` | `REPRODUCED` |
| `winget install Microsoft.VisualStudio.2022.BuildTools --override "--add Microsoft.VisualStudio.Workload.VCTools --quiet"` | failed, exit `-1978335217` | `REPRODUCED` |
| `winget install Git.Git` | failed, exit `-1978335217` | `REPRODUCED` |

**Diagnosis — `REPRODUCED`:** the machine's `winget` **package index source is broken**, not the network. `winget source update --name winget` reports `Cancelled`; `winget source update` updates `msstore` (`Done`) but cancels `winget` and `winget-font`. A direct `HEAD` request to `https://cdn.winget.microsoft.com/cache/source2.msix` returns **HTTP 200**, so the CDN is reachable. The local source index directory
`%LOCALAPPDATA%\Packages\Microsoft.DesktopAppInstaller_8wekyb3d8bbwe\LocalState\Microsoft.Winget.Source_8wekyb3d8bbwe` exists but holds no index database.

**Repair attempts — all refused:** `winget source reset --force`, `winget source remove winget`, and `winget source add …` each return `This command requires administrator privileges to execute.` (exit `-1978335207`). A non-elevated `winget source add --name winget-fe00 …` was also refused.

**Consequence — `VERIFIED`:** the outcome the three commands were meant to produce **already exists on this machine**. Rust 1.99.1, cargo 1.99.1, git 2.56.0, Visual Studio Build Tools 2022 17.14.42, and the MSVC 14.44.35207 toolset with `cl.exe` and `link.exe` are all installed and on `PATH`. `winget list` confirms: `Rustup: the Rust toolchain installer 1.29.1`, `Visual Studio Build Tools 2022 17.14.42`, `Git 2.56.0.2`.

**So: the toolchains did not install cleanly — they were already installed.** The `winget` source repair is `BLOCKED` on **administrator privileges** and is **not needed for FE-0**. It is recorded as `R-00-03` in §8.

### 2.3 What the toolchain state does and does not unblock

| Target | Before FE-0 (per `BASELINE.md` §8) | After FE-0 | Label |
|---|---|---|---|
| Windows installer (Tauri) | `BLOCKED` — no Rust, no MSVC | **No longer blocked by a missing compiler.** Rust + cargo + MSVC `cl.exe`/`link.exe` + Windows SDK 10.0.26100.0 are all present. | `VERIFIED` |
| Windows installer — *end to end* | `BLOCKED` | **`UNKNOWN` — not verified.** `~/.cargo/registry` contains **no cached crates** (0 files), so `cargo build` must reach crates.io to resolve `src-tauri/Cargo.lock`. A full Tauri build was **not** attempted: it is out of FE-0's scope, it is a network operation, and it would compete with the concurrent writer in §7. | `VERIFIED` (absence of cache) / `UNKNOWN` (build outcome) |
| The last failing test | `BLOCKED — dependency: git absent` | **Still failing, for a different reason.** See §3.4. | `REPRODUCED` |
| macOS / iOS | `BLOCKED` — requires macOS + Xcode + $99/yr Apple Developer account | Unchanged — `BLOCKED` on the same three things. Cannot be cross-built from Windows. | `VERIFIED` |
| Linux | `BLOCKED` — Tauri does not cross-compile from Windows | Unchanged — `BLOCKED`. | `VERIFIED` |
| Android | `BLOCKED` — Android SDK/NDK/JDK; `src-tauri/gen/android` not initialised | Unchanged — `BLOCKED`. | `VERIFIED` |
| Web build | `READY` | `READY` — build exits 0 (§1.2). | `REPRODUCED` |

---

## 3. DISCREPANCIES FOUND

### 3.1 Against `docs/hey/BASELINE.md`

`BASELINE.md` was written 20 Oct 2026 at 16:09. Toolchains were installed later the same day (VS instances report install timestamps of **2026-10-20T17:22:16Z** and **17:27:09Z**). Several `BASELINE.md` facts are therefore historical, not current.

| ID | `BASELINE.md` says | Reality on 21 Oct 2026 | Label |
|---|---|---|---|
| **D-01** | §2: git — **Not installed** | git `2.56.0.windows.2` installed at `C:\Program Files\Git\cmd\git.exe` | `VERIFIED` |
| **D-02** | §2: Rust / cargo — **Not installed** | `rustc 1.99.1`, `cargo 1.99.1` installed at `C:\Users\DELL\.cargo\bin\` | `VERIFIED` |
| **D-03** | §8: Windows installer `BLOCKED` — "Rust toolchain, MSVC build tools" | Both present, including `cl.exe`/`link.exe` (MSVC 14.44.35207) and Windows SDK 10.0.26100.0 | `VERIFIED` |
| **D-04** | §4: **185 pass / 1 fail / 186 total** | **827 pass / 22 fail / 849 total** | `REPRODUCED` |
| **D-05** | §2 / proof pack: build = 2,914 modules, 1.74 s | 2,915 modules, 2.57 s, exit 0 | `REPRODUCED` |
| **D-06** | §3: core modules — **98** | **146** `.js` directly in `src/core/`, **156** including `src/core/infinity/` | `VERIFIED` |
| **D-07** | §7: **"Both environment files are gitignored"**, `.env` matched by "the exact line `.env` (line 28)", `.env.local` by "`.env*.local` (line 27)"; and **"This corrects a claim in `REPOSITORY_IDENTITY.md`"** | **FALSE in the current working tree.** The tracked `.gitignore` is now **4 lines, UTF-16LE**: `node_modules/`, `dist/`, `.next/`, `src-tauri/target/`. It contains **no** `.env` pattern. `git check-ignore --no-index .env .env.local` returns **nothing**; `git status --short --ignored .env .env.local` returns `?? .env` and `?? .env.local` — untracked and **not** ignored. No global `core.excludesFile` is set and `.git/info/exclude` is the default. | `VERIFIED` |

**D-07 in context — `VERIFIED`:** the `BASELINE.md` measurement was **correct when it was taken**. Commit `900d8f6` (which predates `BASELINE.md`) carried a 35-line `.gitignore` that contained `.env`, `.env.*` and `*.local`. The current `HEAD` is `9aecb07 "Initial commit"`, whose `.gitignore` is the 4-line UTF-16 file. The protection was **removed by the later commit**, and `BASELINE.md`'s reassuring conclusion is now stale.

**What this means — `VERIFIED`:** the two env files were **never committed** (`git ls-files --error-unmatch .env` → *did not match any file(s) known to git*), so no secret is in the history. But they are **not protected against a future `git add -A`**. `RISK-REGISTER.md` R-03 is therefore **re-opened, not closed**: it moves from *"files are gitignored"* to *"files are untracked but unignored, and therefore one `git add -A` away from being committed."*

**D-07 does not affect the env file's contents — `VERIFIED`:** `.env` is 2,338 bytes, last written **19 Sep 2026 18:18:50** — i.e. **unchanged** since before `BASELINE.md` was written, and identical in size to the 2,338 B `BASELINE.md` measured. Re-classified by value shape (values never printed): 7 keys empty, 4 placeholder, 35 non-placeholder-shaped. `OPENAI_API_KEY` placeholder, `OPENROUTER_API_KEY` / `GEMINI_API_KEY` / `GROQ_API_KEY` / `SERP_API_KEY` empty, `ANTHROPIC_API_KEY` 19 chars but not in live-key format, `STRIPE_SECRET_KEY` 20 chars but not in `sk_live_`/`sk_test_` format, `BACKUP_AWS_*` placeholders — consistent with `BASELINE.md` §7 and R-04. The real-secret set is unchanged: `AUTH_SECRET` (72 chars), `ADMIN_TOKEN` (64), `VAPID_PRIVATE_KEY` (43), `HEY_PG_PASSWORD`, `DATABASE_URL`.

| ID | `BASELINE.md` says | Reality | Label |
|---|---|---|---|
| **D-08** | §9 / proof pack: "1 known blocked failure (`upgrade-orchestrator`, needs git)" — carried into `NEXT-PART.md` | 21 further failures exist and are **unrelated to git** (see §1.3). The single-failure picture in `NEXT-PART.md` is stale. | `REPRODUCED` |

### 3.2 Against the attached spec (`HEY-FE-01`)

| ID | The spec says | Reality | Label |
|---|---|---|---|
| **S-01** | §0.7 + F-13 §9 + Part G condition 7: **"the 40 capabilities declared by `declareStandardCapabilities()`"** | **24.** `getFullMatrix()` returns 24 entries after `declareStandardCapabilities()` runs; before it runs, 0. There are 25 `registerCapability(` call sites in `platformCapabilities.js` (one is the definition). | `REPRODUCED` |
| **S-02** | §0.5 mandates exactly `native` / `bridged` / `relay-required` / `unavailable`; §0.6 describes `platformCapabilities.js` as holding a "4-state × 6-platform matrix" | `platformCapabilities.js` exports `CAPABILITY_STATES = ["available","permission_required","restricted","unsupported"]` — a **different, incompatible scale**. The spec's four-state vocabulary does exist, but in `platformMatrix.js` (10 hits), `deviceRouting.js` (5) and `capabilityContract.js` (5), not in `platformCapabilities.js` (1). | `VERIFIED` |
| **S-03** | §0.6: "Core contracts in `src/core/` (**150 modules**)" | 146 `.js` directly in `src/core/`; 156 including `src/core/infinity/`. | `VERIFIED` |
| **S-04** | §0.6: "`dynamicIsland.js` … 27 exported functions" | 28 `export` statements at top level. | `VERIFIED` |
| **S-05** | §0.7: "**No unified design-token module.** `designSystem.js` … does not exist in `src/core/`"; F-05 §4/§8: "Create `src/core/designSystem.js`" | `src/core/designSystem.js` **now exists** (10,126 bytes) and already exports `THEMES`, `SEMANTIC_TOKENS`, `contrastRatio`, `assertContrast`, `listFailingPairs`, `resolveToken`, `getPassingThemes`, `generateThemeCSS`, `generateAllThemesCSS` — i.e. **the whole F-05 pure API is already present.** F-05 must **extend** this file, not create it. | `VERIFIED` |
| **S-06** | §0.7: "**No `localization.js` runtime** … there is no runtime locale/format layer"; F-04 §4 lists `src/i18n/locales.js`, `strings.js`, `i18n.js`, `pluralize.js` | `src/i18n/` **exists** but contains only `LocaleContext.jsx` (2,334 B) and `translations.js` (8,063 B) — **not** the four modules the spec names. `src/i18n/locales.js`, `strings.js`, `i18n.js`, `pluralize.js` are all **absent**. The gap is partially closed (a locale context and a translation table exist); the spec's module names are still unbuilt. | `VERIFIED` |
| **S-07** | §0.7: "No `accessibility.js` module" | **Still true** — `src/core/accessibility.js` does not exist. | `VERIFIED` |
| **S-08** | FE-0 step 2: "Install the free toolchains (**unblocks the installer and the last failing test**)" | The toolchains are installed, but **installing git did not unblock the last failing test** — git was already installed, and the test fails for a different reason (§3.4). The Windows installer is no longer blocked by a missing compiler, but a full Tauri build remains `UNKNOWN` (§2.3). | `REPRODUCED` |
| **S-09** | §0.6: the 24-row core-module table with byte sizes | **All 24 byte sizes match exactly** (delta = 0 for every row). The spec's core-module inventory is accurate. | `VERIFIED` |
| **S-10** | §0.6: 13 `Motion*.jsx` wrappers; 60+ `src/components/ui/` primitives; `--glass-blur` exists in `src/styles/theme.css` | 14 `Motion*.jsx` files = the 13 listed wrappers + `MotionDynamicIsland.jsx`, which the spec lists separately — **consistent**. `src/components/ui/` holds 101 files — consistent with "60+". `--glass-blur` is **used** in `theme.css` (lines 133, 137) but **defined** in `src/styles/variables.css` (line 43: `24px`, line 413: `0px`), not in `theme.css`. Minor: the spec's §0.6 "What It Uses" row for F-01 names `theme.css` as the home of `--glass-blur`. | `VERIFIED` |
| **S-11** | §0.7: "**No background image source** … the living background is procedural gradients only"; F-01: `backgroundConfig.js` and `imagePipeline.js` are "new" | `src/components/background/backgroundConfig.js` and `imagePipeline.js` **now exist** (written 21 Oct 2026 19:20:49 and 19:21:15 — see §7). F-01's pure modules are already being written by a concurrent process. | `VERIFIED` |
| **S-12** | Part F FE-0 exit condition: "a recorded baseline and a checkpoint directory that exists" | **Met** — §1 and §4. | `VERIFIED` |

### 3.3 The `release-surfaces` failure is a stale test, not a code defect

`VERIFIED`. `src/core/platformMatrix.js` exports `RELEASE_SURFACES` with ids
`["web","windows","macos","linux","android","ios"]`. `src/core/platformCapabilities.js` exports
`PLATFORMS = ["web","windows","macos","linux","android","ios"]` — the identical order. The attached spec §0.7 states the six platforms as "`web`, `windows`, `macos`, `linux`, `android`, `ios`". The failing test asserts `"ios"` before `"android"`. **The code and the spec agree; the test is the outlier.** No code change is warranted. `REPORTED` to the owner as a decision, not repaired here.

### 3.4 The `upgrade-orchestrator` failure — the real cause

`REPRODUCED`. It is **not** a missing-`git` problem.

`scripts/hey-upgrade/Test-HeyUpgrade.ps1` creates a **temporary** repository:

```powershell
$testRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("hey-upgrade-test-" + [guid]::NewGuid().ToString('N'))
…
& git -C $testRoot init --quiet | Out-Null
```

It then calls `Invoke-HeyUpgrade … -RepoRoot $testRoot`, which reaches
`scripts/hey-upgrade/HeyUpgrade.psm1:23`:

```powershell
$head = & git -C $root rev-parse HEAD 2>$null
```

**The fixture repository is initialised but never committed.** Reproduced in isolation:

```
$ git -C <fresh-dir> init --quiet
$ git -C <fresh-dir> rev-parse HEAD
fatal: ambiguous argument 'HEAD': unknown revision or path not in the working tree.
HEAD
EXITCODE=128
```

`git rev-parse HEAD` exits **128** on an unborn branch. Because `HeyUpgrade.psm1` sets `$ErrorActionPreference = 'Stop'`, git's stderr is promoted to a terminating `NativeCommandError`, so the whole test aborts with `1 !== 0`. After a single commit in the same fixture, the identical command returns exit `0` and a real SHA.

**The missing piece, named exactly:** a commit in the temporary fixture repository. Two equivalent remedies, both in **existing** files (out of scope for FE-0, which is baseline-only and must not rewrite existing files):
- add `git -C $testRoot commit --allow-empty -m init` after the `git init` in `scripts/hey-upgrade/Test-HeyUpgrade.ps1`; **or**
- make `HeyUpgrade.psm1` tolerate an unborn `HEAD` (it already assigns `$head = 'NO_COMMIT'` when `rev-parse` returns nothing — the problem is that the non-zero exit is raised *before* that fallback is reached, because `2>$null` does not suppress the `NativeCommandError` under `ErrorActionPreference = 'Stop'`).

`REPORTED` to the owner as decision **D-FE00-1** (§8).

### 3.5 `RISK-REGISTER.md` status after FE-0

| Risk | Before FE-0 | After FE-0 | Label |
|---|---|---|---|
| R-01 — no Rust, no cargo, no MSVC | **Critical**, blocks the primary distribution goal | **Closed as stated.** All three are present. Residual risk: an end-to-end Tauri build is `UNKNOWN` (§2.3). | `VERIFIED` |
| R-02 — one test failure, blocked by missing `git` | Low, "Blocked — install git" | **Superseded.** Git is installed; the test still fails for the reason in §3.4, and 21 further failures exist (§1.3). | `REPRODUCED` |
| R-03 — real secrets on disk | High, "Files are gitignored" | **Re-opened.** The files are **not** gitignored (§3.1 D-07). They were never committed, but they are unignored. | `VERIFIED` |
| R-04 — no provider API keys | High | Unchanged — provider keys are placeholders/empty (§3.1). | `VERIFIED` |
| R-05 — `push.ts` may not use the existing VAPID key | Medium, unverified | Unchanged — `UNKNOWN`. | `REPORTED` |
| R-08 — `src-tauri` is 3,863 MB | Low | Unchanged in the tree (3,862.3 MB is `src-tauri/target`), but the checkpoint now excludes it, so the checkpoint is no longer dominated by it. | `VERIFIED` |
| R-10 — no lint run | Medium, `UNVERIFIED` | Unchanged — **lint was not run in FE-0** (`eslint` is not part of the FE-0 exit condition). `eslint.config.js` exists in the tree. | `REPORTED` |
| R-02-17 — concurrent writers to one tree | High | **Recurred, and is active right now** — see §7. | `REPRODUCED` |

---

## 4. CHECKPOINT

```
robocopy /E "C:\Users\DELL\Documents\hey" "C:\Users\DELL\Documents\hey-checkpoints\checkpoint-2026-10-21-fe00" /XD node_modules .pgdata .next dist target .opencode snapshots
```

> **Command note — `REPRODUCED`:** the spec's command, wrapped in `cmd /c "…"`, **fails** because the inner double quotes terminate the outer `cmd /c` string. The observed failure was:
> `ERROR 123 (0x0000007B) Accessing Source Directory C:\Users\DELL\Documents\Default Project\ C:\Users\DELL\Documents\hey\` — the source path was mangled by the wrapper's working directory, and **robocopy exited 16** with nothing copied. The checkpoint was then taken by invoking `robocopy` directly (the arguments are byte-identical to the spec's). **The quoted-within-`cmd /c` form of this command is broken and will fail again for the next phase unless it is invoked directly.**

### 4.1 Proof it exists

| Check | Result | Label |
|---|---|---|
| `Test-Path "C:\Users\DELL\Documents\hey-checkpoints\checkpoint-2026-10-21-fe00"` | **True** | `VERIFIED` |
| robocopy exit code | **1** (files copied successfully, **0 failed**) | `REPRODUCED` |
| Files copied | **7,133** | `REPRODUCED` |
| Directories | 634 total / 628 copied / 6 skipped | `REPRODUCED` |
| Bytes | 1.099 GB | `REPRODUCED` |
| Wall time | 22 s (51.8 MB/s) | `REPRODUCED` |
| Started / Ended | 2026-10-21 19:18:12 → 19:18:40 | `REPRODUCED` |
| Size on disk (re-measured) | **1,125.8 MB** | `VERIFIED` |
| Log | `C:\Users\DELL\AppData\Local\Temp\opencode\fe00-robocopy.txt` | `VERIFIED` |

### 4.2 Exclusions honoured — `VERIFIED`

Each excluded directory was checked for in the checkpoint; all are absent:

| Excluded | Present in checkpoint? |
|---|---|
| `node_modules` | **No** |
| `.pgdata` | **No** |
| `.next` | **No** |
| `dist` | **No** |
| `target` | **No** |
| `.opencode` | **No** |
| `snapshots` | **No** |
| `src-tauri\target` (3,862.3 MB) | **No** — `/XD target` matched it at any depth |

### 4.3 Spot checks — `VERIFIED`

Present and byte-identical to the source: `src/core/platformMatrix.js`, `src/core/dynamicIsland.js`, `src/components/background/LivingEnvironment.jsx`, `tests/release-surfaces.test.js`, `docs/hey/BASELINE.md`, `package.json`, `.gitignore`, `src-tauri/Cargo.toml`.

### 4.4 Two facts about this checkpoint that the owner should know

1. **It is 10× larger than the previous checkpoints** (1,125.8 MB vs `BASELINE.md`'s 117.1 MB). Cause — `VERIFIED`: the tree now contains a **`.git` directory of 938.1 MB**, which the spec's exclusion list does not exclude. The exclusion list is used exactly as specified; no extra exclusions were invented. A `/.git` exclusion would cut the checkpoint to roughly 190 MB.
2. **The checkpoint contains `.env` and `.env.local`** — `VERIFIED`: they are in the source tree and the spec's exclusion list does not cover them. The checkpoint directory therefore holds the same secrets as the working tree, in the clear. Given D-07 (§3.1), this also means the checkpoint is **not** a safe place to store a live credential.
3. **The checkpoint predates the concurrent writer's files** (§7). It is a snapshot of the tree as of **19:18:40** — i.e. before `src/core/designSystem.js`, `backgroundConfig.js`, `imagePipeline.js`, `BackgroundLayer.jsx`, `BackgroundLayer.module.css`, `tests/design-system.test.js` and `scripts/check-contrast.mjs` were written. Restoring it would discard that in-flight work. **Do not restore it without checking with the owner.**

---

## 5. WHAT WAS **NOT** DONE, AND WHY

| Item | Status | Reason |
|---|---|---|
| The 22 failing tests were not repaired | `REPORTED` | FE-0 is baseline-only ("no code"). Repairing them would modify existing files, which this phase must not do. They are triaged in §1.3 with the exact cause for each. |
| The `winget` source was not repaired | `BLOCKED` | `winget source reset --force` / `remove` / `add` all require administrator privileges (`-1978335207`). **Not needed** — the three toolchains are already installed. |
| A full Tauri installer build was not run | `UNKNOWN` | Out of FE-0 scope; `~/.cargo/registry` has no cached crates, so it needs network; and it would compete with the concurrent writer (§7) for CPU and for `src-tauri/target`. |
| Lint was not run | `REPORTED` | Not part of the FE-0 exit condition. `RISK-REGISTER.md` R-10 remains `UNVERIFIED`. |
| `docs/hey/BASELINE.md` was not edited | — | The `docs/hey/` rules say "Append and correct; never silently overwrite history." The corrections are recorded here and in §3.1; the owner decides whether to amend `BASELINE.md` itself. |
| `src/`, `tests/`, `scripts/`, `package.json` | **untouched** | This phase modified **no** existing source file. |

---

## 6. FILES

### New files

| Path | Purpose |
|---|---|
| `docs/hey/FE-00-PREFLIGHT.md` | This document — the FE-0 record. |
| `docs/hey/README.md` | **Modified** (one additive line in the index table) — so the new document is discoverable, per the spec's phase template step 6. |

### Modified files

| Path | Change | Reason |
|---|---|---|
| `docs/hey/README.md` | **+1 line** — an index row for `FE-00-PREFLIGHT.md` | Additive index entry required by the spec's phase template (step 6: "Update `docs/hey/README.md`'s index with the new files"). No existing row was altered. |

**No other existing file was modified. No dependency was added. No npm install ran. No network call was made by HEY code. No API key was used.**

---

## 7. A CONCURRENT WRITER IS ACTIVE ON THIS TREE — `REPRODUCED`

Risk **R-02-17** (concurrent writers) has **recurred and is live during this phase**. Files appeared in `C:\Users\DELL\Documents\hey` **while this phase was running**:

| Timestamp | Path | What it is |
|---|---|---|
| 21 Oct 19:20:43 | `src/core/designSystem.js` | F-05 pure module (10,126 B) |
| 21 Oct 19:20:49 | `src/components/background/backgroundConfig.js` | F-01 pure module |
| 21 Oct 19:21:15 | `src/components/background/imagePipeline.js` | F-01 pure module |
| 21 Oct 19:21:18 | `tests/design-system.test.js` | F-05 tests |
| 21 Oct 19:21:26 | `src/components/background/BackgroundLayer.module.css` | F-01 styles |
| 21 Oct 19:21:40 | `scripts/check-contrast.mjs` | F-05 build gate |
| 21 Oct 19:21:43 | `src/components/background/BackgroundLayer.jsx` | F-01 surface |

**This phase wrote none of them.** They are the work of another agent implementing F-01 / F-05 — i.e. **FE-1 and FE-2** — in parallel with FE-0.

**The concurrent writer did not stop.** A second wave landed while this document was being written (additive observation, 19:21:57 → 19:23:23):

| Timestamp | Path | What it is | Pre-existing? |
|---|---|---|---|
| 21 Oct 19:21:57 | `src/i18n/locales.js` | F-01 locale table (3,534 B) | **New** — `src/i18n/` already existed (`LocaleContext.jsx`, `translations.js`) |
| 21 Oct 19:22:17 | `src/components/Theme/ThemeProvider.jsx` | F-01 theme surface (6,538 B) | **New** — `src/components/Theme/` already existed |
| 21 Oct 19:22:19 | `src/components/background/BackgroundLayer.jsx` | F-01 surface, **rewritten** (5,249 B) | Existed from wave 1 |
| 21 Oct 19:22:38 | `src/hooks/useContrastAudit.js` | F-05 hook (2,150 B) | **New** |
| 21 Oct 19:22:48 | `src/hooks/useSettings.js` | F-01 hook (952 B) | **New** |
| 21 Oct 19:23:17 | `src/core/printGeometry.js` | F-04 geometry module (4,440 B) | **New** |
| 21 Oct 19:23:23 | `src/App.jsx` | **existing source file overwritten** (12,863 B) | Yes — the first *pre-existing* file this concurrent writer has touched |

`REPRODUCED`. The "untouched by FE-0" claim in §6 is unaffected: **FE-0 still modified no source file.** But note the escalation: wave 2 rewrote `src/App.jsx`, an existing application file. That is the point at which two writers on one tree stop being a bookkeeping problem and become a correctness problem (R-00-02, and R-02-17 in `RISK-REGISTER.md`).

**The list above is a snapshot, not an inventory.** The writer was still writing when this document was finalised — further files landed at 19:24:01 (`src/context/ThemeContext.jsx`), 19:24:15 (`src/core/printModel.js`), 19:24:17 (`src/components/background/ScenePicker.jsx`), 19:24:20 (`src/components/Customization/ThemeGallery.jsx`), 19:24:40 (`src/components/capabilities/capabilityReport.js`), 19:25:00 (`src/components/background/BackgroundControls.jsx`), 19:25:03 (`src/core/paginate.js`), 19:25:11 (`src/components/capabilities/CapabilityRow.jsx`), 19:25:26 (`src/components/background/BackgroundControls.module.css`), 19:25:39 (`src/core/answerKeyPolicy.js`), 19:25:44 (`src/components/capabilities/CapabilityRow.module.css`). **24 files, 19:20:43 → 19:25:44, none of them FE-0's.** Any measurement of this tree taken after 19:20 describes a moving target, and any checkpoint taken after 19:18 is a snapshot of someone else's work-in-progress. `REPRODUCED` at 19:25:50.

### 7.1 Effect on the measurements — and the no-regression proof

A second, identical measurement was taken at **19:21:50–19:21:52**, after the concurrent writer's files had landed and after this phase's only two file writes:

| Metric | Before (19:15–19:16) | After (19:21:52) | Δ | Cause |
|---|---|---|---|---|
| Tests | 849 | 871 | +22 | The concurrent writer's new `tests/design-system.test.js` (22 test cases). `VERIFIED` |
| **Pass** | **827** | **827** | **0** | **No regression.** `REPRODUCED` |
| Fail | 22 | 44 | +22 | All 22 are the concurrent writer's **in-flight** `tests/design-system.test.js` cases, which were written but not yet made to pass when the run started. The 22 pre-existing failures are **byte-for-byte the same set**. `VERIFIED` |
| Build exit code | 0 | 0 | 0 | `REPRODUCED` |
| Modules transformed | 2,915 | 2,915 | 0 | `REPRODUCED` |

**The floor for the next phase is therefore: 827 passing tests, build exit 0 — and the 22 pre-existing failures in §1.3 are the agreed debt, not a new regression.**

### 7.2 Third and fourth measurements — final re-verification (19:23:56 → 19:26:31)

Taken after the second wave of concurrent writes (§7) and after this phase's last two writes (this document + the `README.md` index row). The failing-test set was compared **name-by-name** against the 19:15 baseline, not just by count.

| Metric | Baseline 19:15 | After #1 19:21:52 | After #2 19:24 | Δ vs baseline | Attribution |
|---|---|---|---|---|---|
| Tests | 849 | 871 | 871 | +22 | `tests/design-system.test.js` (concurrent writer). `VERIFIED` |
| Suites | 22 | 27 | 27 | +5 | same. `VERIFIED` |
| **Pass** | **827** | **827** | **827** | **0** | **No regression. `REPRODUCED`** |
| Fail | 22 | 44 | 44 | +22 | all 22 in `tests/design-system.test.js`. `REPRODUCED` |
| Build exit code | 0 | 0 | 0 | 0 | `REPRODUCED` |
| Modules transformed | 2,915 | 2,915 | 2,920 | +5 | the 5 new source files of wave 2. `VERIFIED` |
| Build time | 2.57 s | — | 1.19 s | −1.38 s | `INFERRED` — warm Vite cache; not a performance claim |

**Name-by-name diff of the failing set, baseline vs. final:** every one of the 9 failing top-level groups in the 19:15 baseline is still present and unchanged; the only delta is 5 new top-level groups, all named `Design System …` (`Contrast Ratio`, `Theme Definitions`, `Contrast Assertion (WCAG 2.2 AA)`, `Utility Functions`, `Theme Token Values`) — all inside the concurrent writer's `tests/design-system.test.js`. **Zero baseline failures were fixed, zero baseline failures were introduced, zero new failures appeared outside the concurrent writer's own file.** `REPRODUCED`.

Raw evidence: `C:\Users\DELL\AppData\Local\Temp\opencode\fe00-tests-before-tap.txt` (baseline), `C:\Users\DELL\AppData\Local\Temp\fe00-tests-final-tap.txt` (final), `C:\Users\DELL\AppData\Local\Temp\opencode\fe00-build-final.txt` (final build).

**Fourth run, 19:26:20–19:26:31**, taken after wave 3 had finished landing (11 more files, 19:24:01–19:25:44): **871 tests / 827 pass / 44 fail, build exit 0, 2,920 modules, 1.22 s** — identical to the 19:24 figures. The wave-3 files are not yet reachable from the bundle (module count unchanged) and ship no tests, so they moved nothing. `REPRODUCED`.

---

## 8. OPEN DECISIONS AND NEW RISKS FOR THE OWNER

| ID | Item | Default if undecided | Needed from the owner |
|---|---|---|---|
| **D-FE00-1** | `tests/upgrade-orchestrator.test.js` fails because the temp fixture repo has no commit (§3.4). Remedy: one `git commit --allow-empty` in `Test-HeyUpgrade.ps1`, **or** make `HeyUpgrade.psm1` tolerate an unborn `HEAD`. | Fix the test fixture (one line, in `scripts/hey-upgrade/Test-HeyUpgrade.ps1`). | Owner approval to modify an existing script — FE-0 must not. |
| **D-FE00-2** | `tests/release-surfaces.test.js` expects the platform order `ios` before `android`; the code and the attached spec both say `android` before `ios` (§3.3). | **Fix the test**, not the code — the spec agrees with the code. | Owner approval to modify an existing test. |
| **D-FE00-3** | `.gitignore` no longer ignores `.env` / `.env.local` (§3.1 D-07). The 35-line version with `.env`, `.env.*`, `*.local` exists in history at `900d8f6`. | **Restore the env patterns** to `.gitignore`. | Owner approval to modify an existing file — and a decision on whether to restore the full 35-line file or add only the env patterns. |
| **D-FE00-4** | Should the FE checkpoint exclude `.git`? The current checkpoint is 1,125.8 MB, of which 938.1 MB is `.git` (§4.4). | Add `.git` to the `/XD` list for future phases. | One word. |
| **D-FE00-5** | The `winget` package index is broken and can only be repaired elevated (§2.2). | Leave it — the three toolchains are already installed and the frontend phases do not need `winget`. | None required for FE-1…FE-11. |
| **D-FE00-6** | Spec S-01/S-02: the spec says 40 capabilities; the code has 24, and uses a different state scale than the spec's four-state vocabulary. F-13's validation row and Part G condition 7 are written against "40". | **The repo wins for facts** (spec §Authority: "Where it conflicts with `docs/hey/*.md` on a fact, `docs/hey/` wins"; and the repo is the implementation). F-13 should assert against the **actual 24** and the **actual state scale**, and the spec's §0.7/§0.5 tables should be corrected. | Owner confirmation that "40" is an estimate to be corrected rather than a target to be built. |

### New risks raised by FE-0

| ID | Risk | Severity | Evidence | Status |
|---|---|---|---|---|
| **R-00-01** | `.env` and `.env.local` are **untracked but not ignored**. A single `git add -A` would stage `AUTH_SECRET`, `ADMIN_TOKEN`, `VAPID_PRIVATE_KEY`, `HEY_PG_PASSWORD` and `DATABASE_URL`. | **Critical** | `git status --short --ignored .env .env.local` → `?? .env`, `?? .env.local`; `git check-ignore --no-index` → no match; tracked `.gitignore` is a 4-line UTF-16 file. `VERIFIED` | Open — awaiting D-FE00-3 |
| **R-00-02** | A second agent is implementing FE-1/FE-2 in the same working tree, right now. Two writers will produce interleaved checkpoints and ambiguous provenance. | **High** | 24 files written 19:20:43–19:25:44 during this phase, in three waves; wave 2 rewrote the pre-existing `src/App.jsx`. `REPRODUCED` | Open — the owner should serialise phases, one chat at a time (this is R-02-17 recurring) |
| **R-00-03** | The `winget` package index source is corrupt and repair needs elevation; `winget install` fails with `0x8a15000f` for every package. | Low | All three install attempts failed identically; `winget source update` cancels on the `winget` source; reset/remove/add require admin. `REPRODUCED` | Open — not needed for FE-1…FE-11 |
| **R-00-04** | The Windows installer is no longer blocked by a missing toolchain, but it is **not proven**. `~/.cargo/registry` has **0** cached crates, so a Tauri build needs network access to crates.io and is untested. | Medium | `cargo 1.99.1` + MSVC `14.44.35207` present; registry cache empty; no Tauri build was attempted. `VERIFIED` / `UNKNOWN` | Open — a single `cargo build` in `src-tauri` would settle it |
| **R-00-05** | 21 test failures beyond the known one, and 22 more appeared with the concurrent writer's in-flight F-05 work. The suite's green baseline is 827, not "all green". | Medium | §1.3 triage, §7.1 before/after, §7.2 name-by-name diff. `REPRODUCED` | Open — triaged, not repaired |
| **R-00-06** | The concurrent writer overwrote an existing application file (`src/App.jsx`, 19:23:23) with no checkpoint of the previous content taken by anyone. The FE-0 checkpoint (19:18:40) holds the pre-overwrite copy, but it also holds 14 files that no longer match the tree. | **High** | `src/App.jsx` SHA256 `3CFCCC72…` / 12,760 B (checkpoint) → `798DE7DC…` / 12,863 B (current). §7 wave-2 table. `VERIFIED` | Open — any later checkpoint must be taken by one agent only, or the tree must be frozen first |

---

## 9. PROOF PACK — FE-0

```text
=== FE-0 PRE-FLIGHT PROOF PACK ===
Date:                     21 October 2026
Phase:                    FE-0 — PRE-FLIGHT (no product features)
Repository:               C:\Users\DELL\Documents\hey
Spec applied:             HEY_FRONTEND_SYSTEM_SPEC.md (HEY-FE-01, 20 Oct 2026) PART F / FE-0

--- BASELINE (measured 19:14-19:16) ---
Test command:             cmd /c "cd /d C:\Users\DELL\Documents\hey && node --test tests/*.test.js"
Test result:              849 tests / 827 pass / 22 fail / 22 suites    exit=1
  (tap reporter used for counts; spec reporter gave the same 22 failures)
Build command:            cmd /c "cd /d C:\Users\DELL\Documents\hey && node node_modules/vite/bin/vite.js build"
Build result:             success, vite v8.3.0, 2915 modules, 2.57s    exit=0
FLOOR FOR ALL LATER PHASES: 827 passing tests, build exit 0

--- TOOLCHAINS ---
rustc:                    1.99.1 (58cf8f9c3 2026-10-13)             VERIFIED
cargo:                    1.99.1 (5f94df478 2026-08-27)             VERIFIED
git:                      2.56.0.windows.2                            VERIFIED
rust host target:         x86_64-pc-windows-msvc (stable, default)   VERIFIED
VS Build Tools 2022:      17.14.42 (bc1708ea, installed 2026-10-20)  VERIFIED
VS Community 2022:        17.14.42 (1efa0cda, installed 2026-10-20)  VERIFIED
MSVC toolset:             14.44.35207 — cl.exe + link.exe present    VERIFIED
Windows SDK:              10.0.26100.0                               VERIFIED
Node / npm:               v24.21.0 / 11.19.0                         VERIFIED
winget:                   v1.29.380 — SOURCE BROKEN (0x8a15000f)      REPRODUCED
winget install x3:        all 3 FAILED (source broken, not network)   REPRODUCED
  → consequence:          the 3 toolchains were ALREADY installed    VERIFIED
  → repair needs:         administrator privileges                   BLOCKED
Tauri end-to-end build:   NOT ATTEMPTED — registry cache empty       UNKNOWN

--- CHECKPOINT ---
Path:                     C:\Users\DELL\Documents\hey-checkpoints\checkpoint-2026-10-21-fe00
Exists:                   True                                       VERIFIED
robocopy exit:            1  (7133 files copied, 0 failed)            REPRODUCED
Files / size:             7,133 files / 1,125.8 MB / 634 dirs        VERIFIED
Exclusions honoured:      node_modules, .pgdata, .next, dist,
                          target (incl. src-tauri\target), .opencode,
                          snapshots — all absent                     VERIFIED
NOTE:                     checkpoint contains .git (938.1 MB) and
                          .env / .env.local (secrets, in the clear)    VERIFIED
NOTE:                     checkpoint taken 19:18:40 — BEFORE the
                          concurrent writer's 7 files (§7)            VERIFIED
NOTE:                     the spec's cmd /c "...robocopy..." form is
                          BROKEN (exit 16, nothing copied)            REPRODUCED

--- DISCREPANCIES vs BASELINE.md ---
D-01 git absent                 → git 2.56.0 installed                VERIFIED
D-02 rust/cargo absent          → 1.99.1 installed                    VERIFIED
D-03 installer BLOCKED (no MSVC)→ MSVC 14.44.35207 present            VERIFIED
D-04 185/1/186 tests            → 827/22/849 tests                     REPRODUCED
D-05 2914 modules 1.74s         → 2915 modules 2.57s                  REPRODUCED
D-06 98 core modules            → 146 direct, 156 incl. infinity/     VERIFIED
D-07 ".env is gitignored"       → NOT gitignored (4-line UTF-16
                                 .gitignore at HEAD 9aecb07)          VERIFIED
D-08 "1 known failure"          → 22 failures; 21 unrelated to git   REPRODUCED

--- DISCREPANCIES vs SPEC (HEY-FE-01) ---
S-01 "40 capabilities"          → 24 registered                       REPRODUCED
S-02 4-state matrix             → platformCapabilities uses
                                 available/permission_required/
                                 restricted/unsupported                VERIFIED
S-03 "150 core modules"         → 146 direct / 156 total               VERIFIED
S-04 "27 exports" (island)      → 28                                  VERIFIED
S-05 designSystem.js missing    → EXISTS (F-05 API already there)     VERIFIED
S-06 no i18n runtime            → src/i18n/ exists but not the 4
                                 modules the spec names                VERIFIED
S-07 no accessibility.js        → still absent                          VERIFIED
S-08 git unblocks the test      → it does NOT (empty fixture repo)     REPRODUCED
S-09 24 byte sizes in §0.6      → 24/24 match exactly                  VERIFIED
S-10 Motion wrappers / --glass-blur → 14 (13+island) / defined in
                                 variables.css not theme.css           VERIFIED
S-11 backgroundConfig "new"     → now exists (concurrent writer)       VERIFIED
S-12 FE-0 exit condition        → MET (baseline + checkpoint)          VERIFIED

--- CONCURRENT WRITER (R-02-17 RECURRED) ---
Wave 1 — 7 files written 19:20:43-19:21:43 by another agent:
  src/core/designSystem.js, src/components/background/backgroundConfig.js,
  src/components/background/imagePipeline.js, src/components/background/
  BackgroundLayer.jsx, src/components/background/BackgroundLayer.module.css,
  tests/design-system.test.js, scripts/check-contrast.mjs             REPRODUCED
Wave 2 — 7 more writes 19:21:57-19:23:23:
  src/i18n/locales.js (new), src/components/Theme/ThemeProvider.jsx (new),
  src/components/background/BackgroundLayer.jsx (rewritten),
  src/hooks/useContrastAudit.js (new), src/hooks/useSettings.js (new),
  src/core/printGeometry.js (new), src/App.jsx (EXISTING file rewritten) REPRODUCED
Wave 3 — 11 more writes 19:24:01-19:25:44 (still going at 19:25:50):
  src/context/ThemeContext.jsx, src/core/printModel.js,
  src/components/background/ScenePicker.jsx,
  src/components/Customization/ThemeGallery.jsx,
  src/components/capabilities/capabilityReport.js,
  src/components/background/BackgroundControls.jsx, src/core/paginate.js,
  src/components/capabilities/CapabilityRow.jsx,
  src/components/background/BackgroundControls.module.css,
  src/core/answerKeyPolicy.js,
  src/components/capabilities/CapabilityRow.module.css (all new)     REPRODUCED
  → 24 files total from the concurrent writer, 19:20:43-19:25:44        REPRODUCED

--- NO-REGRESSION PROOF (19:21:52, after this phase's only writes) ---
Tests 849→871 (+22 new, not mine)   Pass 827→827 (0 delta)           REPRODUCED
Fail  22→44  (+22 concurrent writer's in-flight F-05 tests; the
                 pre-existing 22 are unchanged)                       REPRODUCED
Build exit 0→0, modules 2915→2915                                    REPRODUCED

--- FINAL RE-VERIFICATION (19:23:56-19:26:31, after waves 2-3 + README edit) ---
Run 3 — 19:23:56
  Tests 871 (0 delta)   Suites 27   Pass 827 (0 delta vs baseline)     REPRODUCED
  Fail  44 — name-by-name diff vs baseline: 0 baseline failures fixed,
           0 baseline failures introduced, 0 new failures outside
           tests/design-system.test.js                                 VERIFIED
  Build exit 0, 2920 modules (+5 = wave-2 source files), 1.19s        REPRODUCED
Run 4 — 19:26:20
  Tests 871   Suites 27   Pass 827   Fail 44   Build exit 0
  Modules 2920 (unchanged — wave-3 files not yet reachable from the
  bundle)   1.22s                                                     REPRODUCED

--- FILES ---
New:                        docs/hey/FE-00-PREFLIGHT.md
Modified:                   docs/hey/README.md  (+1 index line, additive)
Source code modified:       NONE
Dependencies added:         NONE
npm install run:            NONE
Network calls by HEY code:  NONE
API keys used:              NONE

--- OPEN ---
D-FE00-1 upgrade-orchestrator fixture needs a commit
D-FE00-2 release-surfaces test order is stale
D-FE00-3 .gitignore no longer ignores .env
D-FE00-4 exclude .git from future checkpoints
D-FE00-5 winget source repair needs elevation
D-FE00-6 "40 capabilities" and the 4-state scale vs the code
R-00-06 serialise writers: src/App.jsx was overwritten live, uncheckpointed

--- COMPLETION STATE ---
FE-0:                      TESTED  (baseline measured, toolchains verified,
                           checkpoint proven to exist, discrepancies recorded)
FE-1 … FE-11:             not started by this phase
```

> **A number not measured is a lie about to be handed over. Every number above was measured on 21 October 2026, with the command recorded.**

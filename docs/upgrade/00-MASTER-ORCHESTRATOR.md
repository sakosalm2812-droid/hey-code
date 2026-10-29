# 00 — Master orchestrator

Status: **verified-local**  
Verified transaction: `20260916-193823-00-MASTER-ORCHESTRATOR`

## Result

HEY now has a reusable transactional upgrade entry point at `HEY-UPGRADE.ps1`. Module plans are declarative JSON files under `scripts/hey-upgrade/modules/`, while `HeyUpgrade.psm1` owns repository path validation, preflight checks, baseline conflict detection, SHA-256 manifests, backups, redacted process logs, timeouts, state transitions, staged execution, and rollback.

Supported operations are `preflight`, `dry-run`, `apply`, `verify-only`, `rollback-last`, `list-backups`, and `status`. Supported states are `pending`, `applied`, `verified-local`, `verified-backend`, `verified-native`, `failed`, and `rolled-back`.

`-Force` does not bypass a source/target baseline mismatch and does not allow rollback to overwrite files changed after a module was applied. Production backend plans require `-ConfirmProductionDeploy` immediately before apply. Optional platform tools are reported per stage rather than used to fail unrelated web/local verification.

## Files changed

- Added `HEY-UPGRADE.ps1`.
- Added `scripts/hey-upgrade/HeyUpgrade.psm1`.
- Added `scripts/hey-upgrade/README.md`.
- Added `scripts/hey-upgrade/Test-HeyUpgrade.ps1`.
- Added `scripts/hey-upgrade/modules/00-MASTER-ORCHESTRATOR.json`.
- Added `tests/upgrade-orchestrator.test.js`.
- Updated `.gitignore` for generated upgrade state and transaction backups.
- Updated `eslint.config.js` so generated/legacy transaction copies are not linted as live source.

No product source file was moved or deleted. No dependency was added. No database migration or Edge Function was added or deployed.

## Architecture decisions

- Plans describe filesystem operations and `apply`, `verify`, `backend`, and `native` command stages; the engine stays independent of any feature module.
- Every path is resolved beneath the repository root before use.
- Target baselines use SHA-256 or the explicit `__absent__` marker. Copy/move sources can be hash-pinned too.
- Backups and the manifest are written before target mutation. Move operations preserve both source and destination for rollback.
- Execution captures exit code, timeout, stdout, and stderr in per-step JSON logs with credential-pattern redaction.
- Module state is stored under ignored `.hey-upgrade/state/`; transaction evidence and rollback material live under ignored `.hey-upgrade-backups/`.
- Rollback compares the current file hash with the applied hash and refuses to erase later work.

## Verification evidence

The framework's regression test applied a hashed replacement in a temporary repository, verified transaction state, refused rollback after simulated later user work, restored the exact original file after a safe rollback, rejected a baseline mismatch even with `-Force`, and checked log redaction.

The full gate ran through the orchestrator and recorded separate successful results:

- `npm test`: **43 passed, 0 failed**.
- `npm run lint`: **passed**.
- `npm run build`: **passed**; Vite completed in 4.79 seconds. It emitted existing chunking/dynamic-import warnings, but no build errors.
- `cargo check --manifest-path src-tauri/Cargo.toml`: **passed**; dev profile completed in 43.63 seconds.

The successful transaction metadata and redacted logs are stored at `.hey-upgrade-backups/20260916-193823-00-MASTER-ORCHESTRATOR/`. An earlier transaction, `20260916-193558-00-MASTER-ORCHESTRATOR`, correctly stopped on lint because ESLint traversed archived backup files; the live-source lint exclusion was then corrected and the entire gate was rerun.

## Preflight and limits

Detected locally: Node, npm, Git, Rust, Cargo, and Java. Supabase CLI and ADB were not found. This does not block module 00 because it performs no backend deployment or Android stage. iOS native verification is unavailable on this Windows host and requires macOS/Xcode.

No production backend, signed installer, Android device/build, iOS build, or deployed service was verified by this module. The successful web build and Rust `cargo check` do not establish those stronger release states.

## Rollback

For a later module with file operations, run `./HEY-UPGRADE.ps1 rollback-last -Module <module-id>`. Module 00's verified transaction changed no product targets, so its transaction manifest is intentionally empty; removing the newly added framework files would be a source-control change rather than a transaction rollback.

---

## Update — 2026-09-18 (master 100% build pass)

- All 34 module plans (00–33) now exist under `scripts/hey-upgrade/modules/`; see `scripts/hey-upgrade/generate-module-plans.ps1` (canonical evidence mapping) and `scripts/hey-upgrade/verify-module.mjs` (per-module probe: import-safe engines, path existence, test files).
- `HEY-UPGRADE.ps1` supports `-Module ALL` for `status`, `dry-run`, `apply`, `resume`, and `verify-only`. `resume` continues from the next non-verified module; `apply/resume` skip `verified-*` modules and stop at the first failure; `verify-only` re-runs every module gate. `status -Module ALL -WriteMasterStatus` regenerates `docs/upgrade/MASTER-STATUS.json`.
- Fixed a Windows PowerShell 5.1 process-handling defect in `Invoke-HeyProcess` (empty `ExitCode` after `WaitForExit` with output redirection) by refreshing the process object and coercing the exit code; also hardened `Get-HeyAllStatus`/ALL loop property access under `Set-StrictMode`.
- Full `verify-only -Module ALL` run: **34/34 modules reached `verified-local`** (19:28Z, 2026-09-18). Module 32's gate additionally ran `npm run lint`, `npm run build`, and `cargo check`; the whole automated matrix passed within the per-module probes.
- The live test suite is now **73 tests passed / 0 failed** (11 files).


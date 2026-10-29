# HEY transactional upgrades

Run all module operations from the repository root through `HEY-UPGRADE.ps1`.

```powershell
.\HEY-UPGRADE.ps1 preflight
.\HEY-UPGRADE.ps1 dry-run -Module 00-MASTER-ORCHESTRATOR
.\HEY-UPGRADE.ps1 apply -Module 01-CORE
.\HEY-UPGRADE.ps1 verify-only -Module 01-CORE
.\HEY-UPGRADE.ps1 status -Module 01-CORE
.\HEY-UPGRADE.ps1 list-backups
.\HEY-UPGRADE.ps1 rollback-last -Module 01-CORE
```

## All-module orchestration

The full 00–33 program runs through the same entry point, in module order:

```powershell
.\HEY-UPGRADE.ps1 status     -Module ALL -WriteMasterStatus   # table + docs/upgrade/MASTER-STATUS.json
.\HEY-UPGRADE.ps1 dry-run    -Module ALL                       # what apply would do
.\HEY-UPGRADE.ps1 apply      -Module ALL                       # apply every non-verified module in order
.\HEY-UPGRADE.ps1 resume     -Module ALL                       # continue from the next non-verified module
.\HEY-UPGRADE.ps1 verify-only -Module ALL                      # re-run every module's verification gate
```

- `apply/resume -Module ALL` skips only modules whose `verified-*` evidence still matches the current checkout, and stops at the first failure.
- `verify-only -Module ALL` re-runs every module's probes regardless of state (can repair a stale `failed` state).
- Every module state lives in `.hey-upgrade/state/<module-id>.json`. `status -Module ALL -WriteMasterStatus` regenerates `docs/upgrade/MASTER-STATUS.json`; the [Master Build Ledger](../../docs/upgrade/MASTER-BUILD-LEDGER.md) is the current coordination and evidence record.
- `rollback-last` needs a concrete `-Module` id; find it with `status`.

## Evidence freshness

A verified state records the current Git `HEAD` plus hashes of tracked changes and non-ignored untracked files. A later checkout change makes that evidence `stale`; it is shown as stale by both single-module and all-module status and is excluded from verified totals. `resume` will recheck stale modules. Old state files without a fingerprint are stale until their module verification runs again. Generated status/report files, the ledger itself, build outputs, and test-result folders are excluded so recording evidence does not invalidate itself.

The older complete implementation report, verification matrix, 100% build plan, and capability inventory are explicitly marked as historical or structural snapshots. They cannot establish current completion; use the Master Build Ledger and fresh orchestrator evidence.

## Plan contract

Each tracked module plan lives in `scripts/hey-upgrade/modules/`. File targets must carry a reviewed `baselineSha256` or `__absent__`; copy and move sources may also pin `sourceSha256`. A mismatch always stops the upgrade, and `-Force` never discards newer work. Every apply creates `.hey-upgrade-backups/<transaction>/manifest.json`, file copies, redacted logs, and transaction metadata before it changes a target. Plans may define `apply`, `verify`, `backend`, and `native` command stages.

\`scripts/hey-upgrade/generate-module-plans.ps1\` regenerates the 33 plans from the canonical evidence mapping. `scripts/hey-upgrade/verify-module.mjs` is the per-module probe (import-safe engine modules, path existence, optional test files).

Production backend work must be declared in the plan and invoked with `-ConfirmProductionDeploy`. Preparation and local verification remain separate from deployment.

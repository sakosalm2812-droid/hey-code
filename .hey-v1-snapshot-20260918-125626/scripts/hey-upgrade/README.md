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

Each tracked module plan lives in `scripts/hey-upgrade/modules/`. File targets must carry a reviewed `baselineSha256` or `__absent__`; copy and move sources may also pin `sourceSha256`. A mismatch always stops the upgrade, and `-Force` never discards newer work. Every apply creates `.hey-upgrade-backups/<transaction>/manifest.json`, file copies, redacted logs, and transaction metadata before it changes a target. Plans may define `apply`, `verify`, `backend`, and `native` command stages.

Production backend work must be declared in the plan and invoked with `-ConfirmProductionDeploy`. Preparation and local verification remain separate from deployment.

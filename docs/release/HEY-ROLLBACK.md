# HEY — Rollback Guide

Everything in this repo that changes leaves a recoverable trail. No source
file is mutated without a snapshot or transaction record.

## 1. Pre-edit snapshot (already exists)

`.hey-v1-snapshot-20260918-125626` — 554 files + `SHA256SUMS.txt`.

To verify integrity from the repo root:

```powershell
Get-ChildItem -Recurse -File .hey-v1-snapshot-20260918-125626 |
  ForEach-Object {
    $rel = $_.FullName.Replace((Get-Location).Path + '\.hey-v1-snapshot-20260918-125626\', '')
    $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName).Hash
    [PSCustomObject]@{ File = $rel; Hash = $hash }
  } | Export-Csv -NoTypeInformation -Path temp-snapshot-checks.csv
# compare hashes against SHA256SUMS.txt
```

## 2. Transactional rollback (module 00+ framework)

```powershell
.\HEY-UPGRADE.ps1 rollback-last -Module <module-id>
```

- Each apply writes a transaction dir in `.hey-upgrade-backups/<transaction>/` (manifest, file copies, redacted logs).
- Rollback refuses to overwrite files changed after the transaction.
- List available backups: `.\HEY-UPGRADE.ps1 list-backups`.

**Note:** Modules 00–32 currently have `verified-local` state with no filesystem mutations (the source already lives in the repository). If a future module mutates files, rollback applies normally.

## 3. Revert this session's evidence/artifact work

These files are evidence-only and can be regenerated:

| File / Dir | Regenerate via |
| --- | --- |
| `docs/upgrade/MASTER-STATUS.json` | `.\HEY-UPGRADE.ps1 status -Module ALL -WriteMasterStatus` |
| `docs/upgrade/01-CORE.md` … `32-FINAL-INTEGRATION.md` | `scripts/hey-upgrade/generate-module-reports.ps1` |
| `.hey-upgrade/state/<id>.json` | `.\HEY-UPGRADE.ps1 verify-only -Module <id>` |
| `docs/upgrade/HEY-CAPABILITY-LEDGER.json` | `node scripts/generate-capability-ledger.mjs E:\hey` |
| `AGENTS.md`, `.opencode/commands/hey-finish.md`, `docs/setup/API-SETUP.md`, `docs/release/*`, `docs/security/*`, `docs/platform/*` | hand-written this session; delete to revert |

## 4. Database / backend rollback

| Change | Rollback command |
| --- | --- |
| `hey_push_subscriptions` table + `hey_revoke_push_subscription` | `drop table if exists public.hey_push_subscriptions; drop function if exists public.hey_revoke_push_subscription;` |
| Entitlement union in `hey/index.ts` | redeploy previous `hey` function version |
| `admin-entitlements` function | `supabase functions deploy admin-entitlements` with previous source |
| `hey-studio` / `hey-push` functions | remove from `supabase/config.toml`, delete dirs, redeploy |

## 5. Full re-verification

After any rollback, re-run the gate:

```powershell
npm test          # expect 60/60
npm run lint      # expect 0 errors
npm run build     # expect exit 0
cargo check --manifest-path src-tauri/Cargo.toml
```
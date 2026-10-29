# HEY — Rollback Guide

Everything that changes leaves a trail. This repo deliberately never edits live
source without a recoverable snapshot.

## 1. Before any destructive change (already true here)

A hashed snapshot exists: `.hey-v1-snapshot-20260918-125626`.

- 554 files, `SHA256SUMS.txt` present.
- Manifest SHA: `0a22c4830d44980941ad425bd300f36254f5baf684f7ba3ab64478bff3b6bb04`
- Verify integrity from the repo root before rolling back:

```powershell
Get-FileHash -Algorithm SHA256 -LiteralPath (Get-ChildItem -Recurse -File .hey-v1-snapshot-20260918-125626).FullName |
  Where-Object Hash -ne ... # compare against SHA256SUMS.txt per file
```

## 2. Transactional restructuring (module 00)

Use the upgrade orchestrator, never ad-hoc file replacement:

```powershell
# from repo root
& .\scripts\hey-upgrade\invoke-upgrade.ps1 -TransactionId "20260918-XXXXXX-00-<NAME>"
```

- Backups go to `.hey-upgrade-backups/<transaction-id>/` automatically.
- `HeyUpgrade.psm1` implements baseline hashing, atomic apply, log, and rollback
  (`Restore-HeyBackup` path fixes PS 5.1 `ConvertFrom-Json` array nesting).
- Command layer: `Get-HeyUpgradeChannels`, `Invoke-HeyUpgradeApply`,
  `Restore-HeyUpgradeBackup`, tested in `tests/upgrade-orchestrator.test.js`.

## 3. File-level rollback of this session's edits

If any frontend change regresses, restore the pre-edit versions from the snapshot:

| File | Snapshot copy |
| --- | --- |
| `src/core/taskEngine.js` | `.hey-v1-snapshot-20260918-125626/src/core/taskEngine.js` |
| `src/core/voiceEngine.js` | `.../src/core/voiceEngine.js` |
| `src/core/religiousEngine.js` | `.../src/core/religiousEngine.js` |
| `src/HabitsPage.jsx` | `.../src/HabitsPage.jsx` |
| `src/lib/heyPush.js` (new) | delete — no prior live copy |
| `src/lib/habitStreak.js` (new) | delete |
| `src/ChatPage.jsx` | `.../src/ChatPage.jsx` |
| `src/pages/Home.jsx` | `.../src/pages/Home.jsx` |
| `src/SettingsPage.jsx` | `.../src/SettingsPage.jsx` |
| `src/styles/{variables.css,chat.css,infinity.css}` | `.../src/styles/...` |
| `eslint.config.js` | `.../eslint.config.js` |

Remove the new test file `tests/fix-pass.test.js` if you do not want it;
the ledger and docs under `docs/upgrade/` are regenerable
(`node scripts/generate-capability-ledger.mjs E:\hey`).

## 4. Database / backend rollback

| Change | Rollback |
| --- | --- |
| `20260918000000_push_subscriptions.sql` | `drop table if exists public.hey_push_subscriptions;` (also drop `hey_revoke_push_subscription`) |
| `20260918010000_entitlement_union.sql` | `drop function public.hey_reserve_generation(uuid,uuid,text,text);` then re-apply the body from `20260913223000_studio.sql` |
| `[functions.hey-push]` / `[functions.admin-entitlements]` in config.toml | remove those two blocks |
| `supabase/functions/hey-push/` | delete the directory; un-deploy via CLI |

Note: `hey/index.ts` entitlement union is inside the function body — rollback is
a redeploy of the previous `hey` version, not a schema change.

## 5. If something breaks during this session

1. Restore the snapshot dir over `E:\hey` (or the specific changed files).
2. Re-run the gate: `npm test` (expect 60/60), `npm run lint`, `npm run build`.
3. If the DB was touched, re-run migrations in order or revert the two dated
   migration files above and re-apply prior ones.
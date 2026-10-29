# hey-finish

Continue the HEY 100% build from the live repository state.

1. Re-read `HEY-MASTER-100-PERCENT-BUILD.md` at the repo root (the authoritative completion contract).
2. Inspect live status: `.\HEY-UPGRADE.ps1 status -Module ALL`, git status/log, and `docs/upgrade/MASTER-STATUS.json`.
3. Identify the next incomplete module(s); work module-by-module in order (00–33) until only explicit external-setup blockers remain (missing keys/accounts/signing/hardware/toolchains).
4. For each module: inspect live source first, implement the smallest truthful slice, add/repair tests before deleting legacy callers, run the full verification gate (`npm test`, lint, build, `cargo check --manifest-path src-tauri/Cargo.toml`), write `docs/upgrade/<module-id>.md` with evidence, and update `MASTER-STATUS.json`.
5. Never claim unverified behavior works; mark external integrations `EXTERNAL_SETUP_REQUIRED` with exact setup steps in `docs/setup/API-SETUP.md`.
6. Preserve verified work, RLS, authorization, high-risk confirmation, and rollback capability. `-Force` never bypasses baseline conflicts.
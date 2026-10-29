# 17-TASKS-PLANNER

## Tasks, planner, calendar, reminders and time-aware intelligence

Status: **verified-local**
Module id: ``17-TASKS-PLANNER``
Plan version: ``2026.09.18.1``
Verified at: 2026-09-18T19:26:20.6215099+03:00

## Mission

Tasks, planner, calendar, reminders and time-aware intelligence

## Dependencies

01-CORE

## Evidence (from the canonical plan)

Tasks + calendar engine with time-aware intelligence; habit streaks computed on local calendar days with pending-today semantics; proactive engine surfaces overdue-task signals. Covered by fix-pass.test.js. tasksCalendarEngine logs a localStorage availability warning in Node but the module still loads and the pure helpers are unit-tested.

## Verification gate

- **Verify command:** `node scripts/hey-upgrade/verify-module.mjs --import src/core/taskEngine.js --import src/core/tasksCalendarEngine.js --import src/lib/habitStreak.js --exists src/core/planner.js --exists src/core/briefingEngine.js --exists src/core/prayerTimes.js --exists src/core/proactiveEngine.js --exists src/TasksPage.jsx --exists src/CalendarPage.jsx --test tests/fix-pass.test.js`

## What is NOT verified in this local pass

- Real provider/edge-function execution: requires the secret/account and the backend deploy steps in `docs/setup/API-SETUP.md`; the code is fail-closed and mock-tested until then.
- Browser-only interactions (microphone, camera, screen share, PWA install, WCO geometry, gesture loops, live accessibility) cannot run headless in Node.
- iOS/macOS (Xcode + signing), Android toolchain builds, and signed Windows installers are unavailable on this Windows host; `src/core/platformMatrix.js` records them honestly.
- No module claims verified state beyond what `HEY-UPGRADE.ps1 verify-only` and the recorded tests actually executed.

## Rollback

Module plans declare no filesystem mutations (the source already lives in the repository), so no transaction rollback applies. Durable evidence is `.hey-upgrade/state/17-TASKS-PLANNER.json` (refreshed by `verify-only`) plus this report. Any future module that mutates files records a transactional backup and rollback path in `.hey-upgrade-backups/`.



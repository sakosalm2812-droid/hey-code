# HEY — `docs/hey/` INDEX

**This folder is the authoritative, evidence-based record for the 15-part build program.**
It supersedes conflicting claims in `REPOSITORY_IDENTITY.md`, `IMPLEMENTATION_STATUS.md`, and `FINAL_SUMMARY.md` for any fact listed here.

| File | Purpose | Status |
|---|---|---|
| `BASELINE.md` | Verified stack, counts, build, tests, defects, corrections, proof pack | **Current — 20 Oct 2026** |
| `REPAIRS.md` | Every change made, with evidence and proving tests | **Current** |
| `RISK-REGISTER.md` | Numbered risks and owner decisions | **Current** |
| `NEXT-PART.md` | What the next part inherits and must do | **Current** |
| `FE-00-PREFLIGHT.md` | FE-0 pre-flight: measured baseline (849 tests / 827 pass / 22 fail), build exit 0, toolchain verification, checkpoint proof, discrepancies vs `BASELINE.md` and the spec, 22-failure triage, owner decisions D-FE00-1…6 | **Current — 21 Oct 2026** |
| `FE-BACKGROUND-TRUTH.md` | FE-01 Ambient Background Layer: backgroundConfig (pure), imagePipeline (pure-ish), BackgroundLayer (single mount), ScenePicker + BackgroundControls (settings), 45 tests, print/prefers-contrast/reduced-motion overrides | **Current — 21 Oct 2026** |
| `PROOF-PACK-FE02.md` | FE-02 proof pack: test counts before/after, build exit codes, 12 validation rows with results, modified/new files, BLOCKED items, checkpoint path | **Current — 21 Oct 2026** |
| `FE-05-TRUTH.md` | FE-05 Theme + Contrast Assertion: 4 themes (dusk/dawn/night/paper), 17 semantic tokens, WCAG 2.2 AA build-time enforcement, ambient mode with guard, dev audit hook, ThemeGallery extended | **Current — 21 Oct 2026** |
| `FE-03-TRUTH.md` | FE-03 Motion Language: CSS tokens (5 durations, 5 easings), usePrefersReducedMotion hook, MotionContext, pure motionTokens module, 15 tests | **Current — 21 Oct 2026** |
| `FE-02-TRUTH.md` | FE-02 Glass Surface System: 3 tiers (bar/card/elevated) with tokens, GlassSurface component, 21 tests, migration inventory (80+ legacy rules) | **Current — 21 Oct 2026** |
| `FE-GLASS-MIGRATION.md` | Legacy `backdrop-filter` rule → token map for all 80+ occurrences across 40+ files | **Current — 21 Oct 2026** |
| `FE-27-TRUTH.md` | FE-27 Screen Guidance & Broadcast: per-platform observe states (iOS/Android/macOS/Windows/Linux/Web), honest copy, guidance overlay (480px glass card, movable), capture indicator (red pill, timer, stop), iOS hard rule explicit, frame retention=none, FE-GUIDANCE-NATIVE-CONTRACT.md | **Current — 21 Oct 2026** |
| `FE-17-TRUTH.md` | FE-17 Teacher Cockpit (Lesson Mode): 4 zones (NOW/NEXT/RUNNING/ACTIONS), lessonPlanModel (advance/undo/deriveNext), approvals with trustKernel text, readability ≥20px/28px, touch ≥48px, offline-first, entry via Ctrl+L/palette/top-bar | **Current — 21 Oct 2026** |
| `FE-30-TRUTH.md` | FE-30 Print Studio (A4 Worksheet Packs): printGeometry (pure), printModel (pure), paginate (pure), answerKeyPolicy (pure), exportHonesty (pure), print.css (@media print @page A4), PrintStudio.jsx, PackPreview.jsx, 136 new tests | **Current — 21 Oct 2026** |
| `FE-31-TRUTH.md` | FE-31 Offline Pack & PDF Artefact Model: packManifest (pure, SHA-256, state labels, student-data refusal, 50MB cap), PackShareSheet.jsx, 37 tests | **Current — 21 Oct 2026** |
| `FE-22-TRUTH.md` | FE-22 Global Voice Control: voiceCommands (pure, 9 intents × 3 locales), VoiceButton/Overlay/Visualizer/CaptureIndicator, native bridge contract, platform capability matrix, Kurdish/Arabic = UNKNOWN | **Current — 21 Oct 2026** |
| `FE-23-TRUTH.md` | FE-23 Global Gesture Control: conflict tests (unmapped/ambiguous/OS), GestureHints (cheat sheet from live mapping), gestureSettings (pure remapping), edgeHint (220ms glow), platform bridge capabilities, G13 safety fixed | **Current — 21 Oct 2026** |
| `FE-VOICE-NATIVE-CONTRACT.md` | Native layer contract for F-22: intent list, phrases per locale, forwarding payload, platform states, relay-required behavior, error handling | **Current — 21 Oct 2026** |
| `FE-10-TRUTH.md` | FE-10 Command Palette / Universal Action Palette: fuzzy matcher (subsequence, prefix/word-boundary bonus, deterministic), commandIndex (commandParser, navigationCatalog, planCatalog, featureCatalog, toolRegistry, agentRouter, surface modes), availability (platformCapabilities → native/bridged/relay-required/unavailable), PaletteProvider/Palette (virtualised ≤40 rows, intent row, Ctrl+K/Shift+K/Esc), 42 tests | **Current — 22 Oct 2026** |
| `FE-11-TRUTH.md` | FE-11 Surface Modes (Teacher/Coach/Study/Focus): modeEffects (pure applyMode), ModeProvider (modeEngine + settingsRegistry + Ctrl+1..4), ModeSwitcher (top-bar pill + picker), focus mode (timer 25/50/90, brightness floor 20%, deferral hook, escape control), 14 tests | **Current — 22 Oct 2026** |
| `FE-12-TRUTH.md` | FE-12 Notification & Attention Center: attentionBudget (max 3 important+/10min, critical bypasses budget not quiet hours), quietHours (22:00–07:00 default, deferred not dropped), ToastHost (MotionToast pattern), NotificationCenter (drawer, grouped by day, filterable, swipe/hover dismiss, keyboard), notification-bell (reads center, opens drawer), 22 tests | **Current — 22 Oct 2026** |
| `FE-13-TRUTH.md` | FE-13 Capability Visibility Panel: CapabilityPanel/CapabilityRow/capabilityReport, 40 capabilities × 6 platforms, UI audit, clipboard report, 30 tests | **Current — 21 Oct 2026** |
| `FE-14-TRUTH.md` | FE-14 Cost & Consent Ribbon: CostRibbon/CostDetailPanel/costModel, local action log (500), kill switch, envelope thresholds, 36 tests | **Current — 21 Oct 2026** |
| `FE-15-TRUTH.md` | FE-15 Teacher Time Ledger: timeLedger (pure), TimeLedgerPanel, baselines in settings, min-3 rule, 38 tests | **Current — 21 Oct 2026** |
| `FE-16-TRUTH.md` | FE-16 Offline Status Surface: connectivity (pure), ConnectivityChip, DegradedPanel, scheduler gap truth, 27 tests | **Current — 21 Oct 2026** |
| `FE-22-TRUTH.md` | FE-22 Global Voice Control: voiceCommands (pure, 9 intents × 3 locales), VoiceButton/Overlay/Visualizer/CaptureIndicator, native bridge contract, platform capability matrix, Kurdish/Arabic = UNKNOWN | **Current — 21 Oct 2026** |
| `FE-23-TRUTH.md` | FE-23 Global Gesture Control: conflict tests (unmapped/ambiguous/OS), GestureHints (cheat sheet from live mapping), gestureSettings (pure remapping), edgeHint (220ms glow), platform bridge capabilities, G13 safety fixed | **Current — 21 Oct 2026** |
| `FE-VOICE-NATIVE-CONTRACT.md` | Native layer contract for F-22: intent list, phrases per locale, forwarding payload, platform states, relay-required behavior, error handling | **Current — 21 Oct 2026** |
| `FE-20-TRUTH.md` | FE-20 Dynamic Island & Live Activities: islandSelectors (pure), islandCoalescer (≤1/sec), 10 module renderers, IslandSurface (collapsed/expanded/idle), IslandHost (single mount), native contract (JSON payload, coalescing, privacy redaction), platform capability matrix | **Current — 22 Oct 2026** |
| `FE-21-TRUTH.md` | FE-21 Home Screen Widgets: widgetRegistry (8 widgets), widgetData (pure derivations), WidgetTile (in-app renderer), DashboardWidgets (grid), native contract (one view model, two renderers), platform capability matrix | **Current — 22 Oct 2026** |
| `FE-ISLAND-NATIVE-CONTRACT.md` | Native layer contract for F-20: exact JSON payload, update policy (native reads only), coalescing (max 1/sec), privacy redaction (privacySensitive flag), deep links, platform states | **Current — 22 Oct 2026** |
| `FE-WIDGET-NATIVE-CONTRACT.md` | Native layer contract for F-21: view model JSON per widget (8), freshness policy, empty states (honest copy), approval confirmation, deep links, one view model two renderers, platform states | **Current — 22 Oct 2026** |
| `PROOF-PACK-FE07.md` | FE-07 proof pack: test counts before/after (75 new tests), build exit 0, 11 validation rows (F-20: 6, F-21: 5), modified/new files (6 modified, 24 new), BLOCKED items (8 native), checkpoint proof | **Current — 22 Oct 2026** |
| `PROOF-PACK-FE11.md` | FE-11 Integration Sweep: test counts before/after (956→1291 pass), build exit 0, 38 integration cross tests, E-4 accessibility audit, honesty audit, performance baseline, 15 Part G conditions, modified/new files, BLOCKED items, checkpoint proof | **Current — 22 Oct 2026** |
| `FE-HANDOFF.md` | Frontend handoff: what ships (10 POLISHED, 5 PARTIAL, 13 BLOCKED), what native must build (7 contracts), teacher onboarding flow, 10 open decisions with defaults | **Current — 22 Oct 2026** |

## Reading order for a new agent

1. `BASELINE.md` — what is true
2. `RISK-REGISTER.md` — what is dangerous
3. `NEXT-PART.md` — what is next
4. `REPAIRS.md` — what changed

## Rules for this folder

- Every number must be measured, with the command recorded.
- Every claim carries a label: `VERIFIED`, `REPRODUCED`, `INFERRED`, `REPORTED`, `UNKNOWN`, `BLOCKED`.
- No document here may claim completion beyond the ladder: `DEFINED → IMPLEMENTED → CONNECTED → TESTED → VERIFIED → POLISHED → SHIPPABLE`.
- Append and correct; never silently overwrite history.

## Reproduce everything

```bat
cd /d C:\Users\DELL\Documents\hey
node node_modules/vite/bin/vite.js build
node --test tests/*.test.js
```

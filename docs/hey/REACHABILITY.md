# HEY — REACHABILITY (Part 2)

**Date:** 20 October 2026
**Repository:** `C:\Users\DELL\Documents\hey`
**Method:** static import graph over `src/`, `tests/` and `supabase/` (666 files), built by resolving every static `import`, dynamic `import()` and `require()` specifier to a real file. Reachability is breadth-first from four declared entry points.
**Labels:** `VERIFIED` = read from the graph or the file; `REPRODUCED` = command re-run; `INFERRED` = reasoned from code, not executed; `REPORTED` = inherited; `UNKNOWN`; `BLOCKED`.

**Measurement window:** 16:17–16:20 on 20 October 2026. `src/core` held 98 direct `.js` files at that moment. From 16:21 onward a **concurrent process** began adding more (`costGovernor`, `modelRegistry`, `routingPolicy`, `modelEvaluator`, `agentContract`, `agentHealth`, `agentSelection`, …) and this part added `capabilityContract.js`; by 16:27:46 the directory held 107 files and was still growing. The 98 classified below are the 98 that existed when the graph was built, which is the count the brief specifies. `VERIFIED` — see `RISK-REGISTER.md` C-07.

---

## 1. What this measures, and what it does not

Two different questions are answered separately, because conflating them is how "98 engines" became folklore:

1. **Bundled** — is the module reachable from an entry point at all? This decides whether Rollup includes it in `dist/`.
2. **Invoked** — does any *application* file (`src/**` outside `src/core/`) reach it without passing through `src/core/index.js`?

`src/core/index.js` is a barrel: it imports every engine and builds one giant `HEY` object literal. Because three application files import that barrel (`DebugPage.jsx`, `ForgePage.jsx`, `components/tutorials/TutorialOverlay.jsx`), **every** engine in the barrel is technically "reachable" and therefore bundled. That is true and useless. The second question is the one that matters, and the answer is that the barrel pulls in 25 engines nobody calls.

Which barrel members are actually used by application code (`VERIFIED`, 6 call sites):

| Member | Call site |
|---|---|
| `HEY.capabilities.all()` | `src/DebugPage.jsx:19` |
| `HEY.tools.all()` | `src/DebugPage.jsx:20` |
| `HEY.state()` | `src/DebugPage.jsx:21` |
| `HEY.events.subscribe(...)` | `src/DebugPage.jsx:34` |
| `HEY.process(draft)` | `src/ForgePage.jsx:122` |
| `{ events, onboarding }` | `src/components/tutorials/TutorialOverlay.jsx:5` |

Everything else in the barrel is constructed at module-evaluation time and never called. That is not dead code in the bundler sense; it is dead *behaviour*.

---

## 2. Core modules — the boundary

**"Every core module" means every one of the 98 `.js` files directly inside `src/core/`** — exactly the Part 1 count, re-confirmed here as 98 (`VERIFIED`).

This boundary **excludes** `src/core/infinity/`, which holds 10 more modules (`actionTimeline`, `capabilityHealth`, `inboxEngine`, `infinityManifest`, `infinityRuntime`, `missionEngine`, `providerRouter`, `qualityGate`, `storage`, `worldStyleEngine`). Those are live: `src/main.jsx:27-28` installs them, and `/missions`, `/inbox`, `/world` and `InfinityStatusBar` import them directly (`VERIFIED`). So `src/core` actually contains **108** modules; the 98 in scope here are the top level. Stated so no later part mistakes 98 for "all of core".

## 3. Summary

| Class | Count | Meaning |
|---|---|---|
| **LIVE** | 43 | Reachable from a real entry point *and* imported directly by an application file |
| **INTERNAL-LIVE** | 54 | Reachable, but only through other src/core modules |
| **ORPHAN** | 1 | Imported by nothing |
| **TEST-ONLY** | 0 | Imported only by tests/ |
| **SELF-ONLY** | 0 | Imported only by itself, or by a barrel nothing consumes |
| **Total** | 98 | |

`INTERNAL-LIVE` is not one thing. Splitting the 54 by invocation evidence (`VERIFIED`):

| Invocation | Count | Meaning |
|---|---|---|
| direct | 43 | An application file imports it (one of these is the barrel itself) |
| chain | 29 | Only core modules import it, but the chain starts at an application import |
| barrel-only | 20 | Its only importer is src/core/index.js; no application file calls it |
| barrel-branch | 5 | Its importers are engines that are themselves barrel-only — the branch is dead |
| none | 1 | Orphan |

**Bottom line:** of 97 engines (98 files minus the barrel), **71 have a call path from application code** (42 direct + 29 chain), **25 load but are never called by application code** (20 barrel-only + 5 barrel-branch), and **1 is imported by nothing**. 

**Orphan rate:** 1/98 = **1.0 %** strictly orphaned; **25/98 = 25.5 %** loaded-but-never-called. Marking the 25 as dead code is a Part 5 decision, not this part's.

---

## 4. All 98 core modules

Columns: **Class** per §6.1 of the brief; **Invocation** = strongest evidence that a real call path exists; **Imp.** = number of distinct files importing it; **Shortest path** = from an entry point, excluding the barrel where one exists.

| # | Module | Class | Invocation | Imp. | Shortest path from an entry point |
|---|---|---|---|---|---|
| 1 | `accountState.js` | LIVE | direct | 1 | main › AuthContext › accountState |
| 2 | `accountsBillingEngine.js` | INTERNAL-LIVE | barrel-only | 1 | App › TutorialOverlay › index › accountsBillingEngine |
| 3 | `actionEngine.js` | INTERNAL-LIVE | chain | 3 | main › AuthContext › accountState › actionEngine |
| 4 | `agentEngine.js` | INTERNAL-LIVE | barrel-branch | 3 | App › TutorialOverlay › index › agentEngine |
| 5 | `agentRouter.js` | INTERNAL-LIVE | chain | 4 | App › ChatPage › heyAI › heyBrain › agentRouter |
| 6 | `agentToolMap.js` | INTERNAL-LIVE | chain | 2 | App › … › heyBrain › agentRouter › agentToolMap |
| 7 | `artifactEngine.js` | INTERNAL-LIVE | barrel-only | 1 | App › TutorialOverlay › index › artifactEngine |
| 8 | `auditLog.js` | LIVE | direct | 45 | main › completionRuntime › auditLog |
| 9 | `automationEngine.js` | LIVE | direct | 5 | main › completionRuntime › automationEngine |
| 10 | `backgroundHelper.js` | INTERNAL-LIVE | chain | 2 | main › completionRuntime › backgroundHelper |
| 11 | `backgroundRuntimeKeepAlive.js` | LIVE | direct | 2 | main › backgroundRuntimeKeepAlive |
| 12 | `briefingEngine.js` | LIVE | direct | 2 | App › MorningMode › briefingEngine |
| 13 | `capabilityExpansionEngine.js` | LIVE | direct | 3 | App › AgentsPage › capabilityExpansionEngine |
| 14 | `capabilityRegistry.js` | INTERNAL-LIVE | chain | 3 | App › … › heyBrain › computerTools › capabilityRegistry |
| 15 | `chatTransport.js` | INTERNAL-LIVE | barrel-only | 1 | App › TutorialOverlay › index › chatTransport |
| 16 | `commandParser.js` | INTERNAL-LIVE | chain | 5 | App › ChatPage › heyAI › heyBrain › commandParser |
| 17 | `communityEngine.js` | INTERNAL-LIVE | barrel-only | 1 | App › TutorialOverlay › index › communityEngine |
| 18 | `completionRuntime.js` | LIVE | direct | 2 | main › completionRuntime |
| 19 | `computerControl.js` | INTERNAL-LIVE | chain | 2 | main › completionRuntime › computerControl |
| 20 | `computerControlEngine.js` | ORPHAN | none | 0 | — |
| 21 | `computerTools.js` | INTERNAL-LIVE | chain | 3 | App › ChatPage › heyAI › heyBrain › computerTools |
| 22 | `contextManager.js` | LIVE | direct | 14 | main › WorkspaceWindows › ProactiveSuggestionsWidget › contextManager |
| 23 | `cosmosMemory.js` | INTERNAL-LIVE | barrel-only | 1 | App › TutorialOverlay › index › cosmosMemory |
| 24 | `desktopIslandBridge.js` | LIVE | direct | 2 | main › desktopIslandBridge |
| 25 | `developerEngine.js` | INTERNAL-LIVE | barrel-only | 1 | App › TutorialOverlay › index › developerEngine |
| 26 | `deviceFabric.js` | LIVE | direct | 3 | main › completionRuntime › deviceFabric |
| 27 | `deviceGateway.js` | INTERNAL-LIVE | chain | 3 | main › AuthContext › accountState › deviceGateway |
| 28 | `diagnosticsEngine.js` | INTERNAL-LIVE | barrel-only | 1 | App › TutorialOverlay › index › diagnosticsEngine |
| 29 | `dynamicIsland.js` | INTERNAL-LIVE | chain | 2 | main › desktopIslandBridge › dynamicIsland |
| 30 | `errorTaxonomy.js` | INTERNAL-LIVE | barrel-only | 1 | App › TutorialOverlay › index › errorTaxonomy |
| 31 | `eventBus.js` | LIVE | direct | 52 | main › heyLogger › eventBus |
| 32 | `executionAuthorization.js` | LIVE | direct | 12 | App › ChatPage › executionAuthorization |
| 33 | `executionController.js` | LIVE | direct | 5 | App › ChatPage › heyAI › executionController |
| 34 | `executionEngine.js` | INTERNAL-LIVE | barrel-branch | 3 | App › TutorialOverlay › index › executionEngine |
| 35 | `executionLoop.js` | INTERNAL-LIVE | chain | 4 | main › AuthContext › accountState › skillEngine › executionLoop |
| 36 | `externalControlBridge.js` | INTERNAL-LIVE | chain | 3 | main › gestureRuntimeBootstrap › gestureEngine › externalControlBridge |
| 37 | `featureCatalog.js` | LIVE | direct | 2 | App › CapabilitiesPage › featureCatalog |
| 38 | `filesEngine.js` | INTERNAL-LIVE | barrel-only | 1 | App › TutorialOverlay › index › filesEngine |
| 39 | `forgeEngine.js` | LIVE | direct | 5 | main › completionRuntime › forgeEngine |
| 40 | `generationEngine.js` | INTERNAL-LIVE | barrel-only | 1 | App › TutorialOverlay › index › generationEngine |
| 41 | `generationTools.js` | INTERNAL-LIVE | chain | 2 | App › ChatPage › heyAI › heyBrain › generationTools |
| 42 | `gestureEngine.js` | LIVE | direct | 2 | main › gestureRuntimeBootstrap › gestureEngine |
| 43 | `healthEngine.js` | INTERNAL-LIVE | barrel-only | 1 | App › TutorialOverlay › index › healthEngine |
| 44 | `heyBrain.js` | LIVE | direct | 2 | App › ChatPage › heyAI › heyBrain |
| 45 | `heyLive.js` | INTERNAL-LIVE | barrel-only | 1 | App › TutorialOverlay › index › heyLive |
| 46 | `heyLogger.js` | LIVE | direct | 4 | main › heyLogger |
| 47 | `heyVoiceSettings.js` | LIVE | direct | 4 | App › SettingsPage › heyVoiceSettings |
| 48 | `index.js` | LIVE | direct | 7 | App › TutorialOverlay › index |
| 49 | `inputFusion.js` | INTERNAL-LIVE | barrel-only | 1 | App › TutorialOverlay › index › inputFusion |
| 50 | `localIntelligence.js` | INTERNAL-LIVE | chain | 2 | App › ChatPage › heyAI › heyBrain › localIntelligence |
| 51 | `mediaAiPlanner.js` | LIVE | direct | 3 | App › MediaStudio › mediaAiPlanner |
| 52 | `mediaEditEngine.js` | LIVE | direct | 4 | App › MediaStudio › mediaEditEngine |
| 53 | `memoryEngine.js` | LIVE | direct | 6 | App › MemoryPage › memoryEngine |
| 54 | `memoryGraph.js` | LIVE | direct | 10 | App › Dashboard › memoryGraph |
| 55 | `memoryGraphService.js` | INTERNAL-LIVE | chain | 2 | App › MemoryPage › memoryEngine › memoryGraphService |
| 56 | `memoryInbox.js` | LIVE | direct | 5 | App › MemoryPage › memoryInbox |
| 57 | `memoryRanking.js` | INTERNAL-LIVE | chain | 2 | App › MemoryPage › memoryEngine › memoryRanking |
| 58 | `messageRouter.js` | INTERNAL-LIVE | chain | 5 | App › ChatPage › heyAI › heyBrain › messageRouter |
| 59 | `missionCenter.js` | INTERNAL-LIVE | barrel-only | 1 | App › TutorialOverlay › index › missionCenter |
| 60 | `modeEngine.js` | INTERNAL-LIVE | barrel-only | 1 | App › TutorialOverlay › index › modeEngine |
| 61 | `modeRegistry.js` | INTERNAL-LIVE | chain | 3 | main › … › contextManager › personality › modeRegistry |
| 62 | `navigationCatalog.js` | LIVE | direct | 6 | main › infinityRuntime › navigationCatalog |
| 63 | `notificationCenter.js` | LIVE | direct | 6 | main › completionRuntime › notificationCenter |
| 64 | `offlineEngine.js` | INTERNAL-LIVE | chain | 2 | main › completionRuntime › offlineEngine |
| 65 | `onboardingEngine.js` | LIVE | direct | 3 | App › TutorialOverlay › index › onboardingEngine |
| 66 | `osAdapter.js` | LIVE | direct | 7 | App › DeviceCenterPage › osAdapter |
| 67 | `ownerEntitlements.js` | LIVE | direct | 2 | App › OwnerAccessPage › ownerEntitlements |
| 68 | `permissionManager.js` | LIVE | direct | 12 | main › AuthContext › persistenceSync › permissionManager |
| 69 | `personality.js` | INTERNAL-LIVE | chain | 5 | main › WorkspaceWindows › ProactiveSuggestionsWidget › contextManager › personality |
| 70 | `pinpointPrecision.js` | INTERNAL-LIVE | barrel-only | 1 | App › TutorialOverlay › index › pinpointPrecision |
| 71 | `planCatalog.js` | LIVE | direct | 2 | App › Pricing › planCatalog |
| 72 | `planner.js` | INTERNAL-LIVE | chain | 6 | App › ChatPage › heyAI › heyBrain › planner |
| 73 | `platformMatrix.js` | LIVE | direct | 3 | App › Download › platformMatrix |
| 74 | `prayerTimes.js` | LIVE | direct | 7 | App › CalendarPage › prayerTimes |
| 75 | `proactiveEngine.js` | LIVE | direct | 3 | main › WorkspaceWindows › ProactiveSuggestionsWidget › proactiveEngine |
| 76 | `projectDNA.js` | INTERNAL-LIVE | barrel-only | 1 | App › TutorialOverlay › index › projectDNA |
| 77 | `providerRegistry.js` | INTERNAL-LIVE | chain | 2 | App › … › heyBrain › providerRouter › providerRegistry |
| 78 | `providerRouter.js` | INTERNAL-LIVE | chain | 3 | App › ChatPage › heyAI › heyBrain › providerRouter |
| 79 | `qualityEngine.js` | LIVE | direct | 4 | App › ChatPage › heyAI › qualityEngine |
| 80 | `religiousEngine.js` | INTERNAL-LIVE | barrel-branch | 2 | App › TutorialOverlay › index › religiousEngine |
| 81 | `responseStyleEngine.js` | INTERNAL-LIVE | chain | 3 | App › ChatPage › heyAI › heyBrain › responseStyleEngine |
| 82 | `scheduleCalculator.js` | INTERNAL-LIVE | chain | 3 | main › completionRuntime › scheduleCalculator |
| 83 | `settingsRegistry.js` | INTERNAL-LIVE | chain | 13 | main › completionRuntime › backgroundHelper › settingsRegistry |
| 84 | `skillEngine.js` | INTERNAL-LIVE | chain | 2 | main › AuthContext › accountState › skillEngine |
| 85 | `surfaceModes.js` | LIVE | direct | 3 | App › ModesPage › surfaceModes |
| 86 | `systemGestureRuntime.js` | LIVE | direct | 5 | main › DesktopIslandSurface › systemGestureRuntime |
| 87 | `taskEngine.js` | INTERNAL-LIVE | chain | 2 | main › AuthContext › accountState › taskEngine |
| 88 | `tasksCalendarEngine.js` | INTERNAL-LIVE | barrel-branch | 2 | App › TutorialOverlay › index › tasksCalendarEngine |
| 89 | `toolRegistry.js` | INTERNAL-LIVE | chain | 7 | App › DeviceCenterPage › visionEngine › toolRegistry |
| 90 | `trustCenterEngine.js` | INTERNAL-LIVE | barrel-only | 1 | App › TutorialOverlay › index › trustCenterEngine |
| 91 | `tutorialCatalog.js` | INTERNAL-LIVE | barrel-only | 1 | App › TutorialOverlay › index › tutorialCatalog |
| 92 | `v1CapabilityManifest.js` | LIVE | direct | 2 | App › Features › v1CapabilityManifest |
| 93 | `visionEngine.js` | LIVE | direct | 2 | App › DeviceCenterPage › visionEngine |
| 94 | `voiceEngine.js` | LIVE | direct | 4 | main › completionRuntime › voiceEngine |
| 95 | `voiceState.js` | LIVE | direct | 3 | App › ChatPage › voiceProviders › voiceState |
| 96 | `workflowEngine.js` | INTERNAL-LIVE | barrel-branch | 2 | App › TutorialOverlay › index › workflowEngine |
| 97 | `workspaceEngine.js` | INTERNAL-LIVE | barrel-only | 1 | App › TutorialOverlay › index › workspaceEngine |
| 98 | `workspaceManager.js` | LIVE | direct | 2 | main › WorkspaceWindows › workspaceManager |

### 4.1 The one orphan

| Module | Bytes | Why it is orphaned | Duplicate of |
|---|---|---|---|
| `computerControlEngine.js` | 19,168 | Nothing imports it, statically or dynamically, anywhere in `src/`, `tests/` or `supabase/` | `computerControl.js` — same class name, same 22 exported symbols |

It is a complete second implementation of computer control. `src/core/index.js:232` imports `computerControlEngine` from `./computerControl.js`, so the live path uses the other file. **Do not delete it in this part**; it is reported for the owner to rule on (see `RISK-REGISTER.md` R-02-03).

### 4.2 The 25 engines that load but are never called

| Module | Invocation | Only importer |
|---|---|---|
| `accountsBillingEngine.js` | barrel-only | `src/core/index.js` |
| `artifactEngine.js` | barrel-only | `src/core/index.js` |
| `chatTransport.js` | barrel-only | `src/core/index.js` |
| `communityEngine.js` | barrel-only | `src/core/index.js` |
| `cosmosMemory.js` | barrel-only | `src/core/index.js` |
| `developerEngine.js` | barrel-only | `src/core/index.js` |
| `diagnosticsEngine.js` | barrel-only | `src/core/index.js` |
| `errorTaxonomy.js` | barrel-only | `src/core/index.js` |
| `filesEngine.js` | barrel-only | `src/core/index.js` |
| `generationEngine.js` | barrel-only | `src/core/index.js` |
| `healthEngine.js` | barrel-only | `src/core/index.js` |
| `heyLive.js` | barrel-only | `src/core/index.js` |
| `inputFusion.js` | barrel-only | `src/core/index.js` |
| `missionCenter.js` | barrel-only | `src/core/index.js` |
| `modeEngine.js` | barrel-only | `src/core/index.js` |
| `pinpointPrecision.js` | barrel-only | `src/core/index.js` |
| `projectDNA.js` | barrel-only | `src/core/index.js` |
| `trustCenterEngine.js` | barrel-only | `src/core/index.js` |
| `tutorialCatalog.js` | barrel-only | `src/core/index.js` |
| `workspaceEngine.js` | barrel-only | `src/core/index.js` |
| `agentEngine.js` | barrel-branch | `src/core/index.js` |
| `executionEngine.js` | barrel-branch | `src/core/index.js` |
| `religiousEngine.js` | barrel-branch | `src/core/index.js` |
| `tasksCalendarEngine.js` | barrel-branch | `src/core/index.js` |
| `workflowEngine.js` | barrel-branch | `src/core/index.js` |

---

## 5. Routes — all 56

56 `path=` entries in `src/App.jsx` (`VERIFIED`). Every one resolves to an existing component file (`VERIFIED`) — there are no broken routes. **Core deps** counts distinct `src/core/**` modules reachable from that route's component (including `src/core/infinity/`), so it measures page weight, not page purpose.

| Route | Component | File | Core deps |
|---|---|---|---|
| `/` | Home | `src/pages/Home.jsx` | 20 |
| `/features` | Features | `src/pages/Features.jsx` | 12 |
| `/voice` | VoicePage | `src/pages/VoicePage.jsx` | 45 |
| `/customization` | Customization | `src/pages/Customization.jsx` | 0 |
| `/pricing` | Pricing | `src/pages/Pricing.jsx` | 1 |
| `/privacy` | LegalPage | `src/pages/Legal.jsx` | 0 |
| `/terms` | LegalPage | `src/pages/Legal.jsx` | 0 |
| `/cookies` | LegalPage | `src/pages/Legal.jsx` | 0 |
| `/dpa` | LegalPage | `src/pages/Legal.jsx` | 0 |
| `/about` | About | `src/pages/About.jsx` | 0 |
| `/support` | SupportPage | `src/pages/Support.jsx` | 0 |
| `/live` | LivePage | `src/pages/Live.jsx` | 0 |
| `/create` | CreatePage | `src/pages/Create.jsx` | 0 |
| `/download` | DownloadPage | `src/pages/Download.jsx` | 1 |
| `/login` | LoginPage | `src/LoginPage.jsx` | 20 |
| `/signup` | SignupPage | `src/SignupPage.jsx` | 20 |
| `/reset-password` | ResetPasswordPage | `src/ResetPasswordPage.jsx` | 20 |
| `/auth/callback` | AuthCallbackPage | `src/pages/AuthCallback.jsx` | 20 |
| `/dashboard` | Dashboard | `src/Dashboard.jsx` | 22 |
| `/chat` | ChatPage | `src/ChatPage.jsx` | 45 |
| `/voice/live` | Navigate | — | 0 |
| `/cosmos` | CosmosPage | `src/CosmosPage.jsx` | 20 |
| `/forge` | ForgePage | `src/ForgePage.jsx` | 98 |
| `/memory` | MemoryPage | `src/MemoryPage.jsx` | 24 |
| `/calendar` | CalendarPage | `src/CalendarPage.jsx` | 21 |
| `/deen` | DeenPage | `src/pages/DeenPage.jsx` | 0 |
| `/tasks` | TasksPage | `src/TasksPage.jsx` | 20 |
| `/learn` | LearnPage | `src/LearnPage.jsx` | 20 |
| `/studio` | StudioPage | `src/StudioPage.jsx` | 20 |
| `/media` | MediaStudio | `src/pages/MediaStudio.jsx` | 5 |
| `/agents` | AgentsPage | `src/AgentsPage.jsx` | 2 |
| `/analytics` | AnalyticsPage | `src/AnalyticsPage.jsx` | 20 |
| `/finance` | FinancePage | `src/FinancePage.jsx` | 20 |
| `/goals` | GoalsPage | `src/GoalsPage.jsx` | 20 |
| `/habits` | HabitsPage | `src/HabitsPage.jsx` | 20 |
| `/health` | HealthPage | `src/HealthPage.jsx` | 20 |
| `/journal` | JournalPage | `src/JournalPage.jsx` | 20 |
| `/notes` | NotesPage | `src/NotesPage.jsx` | 20 |
| `/projects` | ProjectsPage | `src/ProjectsPage.jsx` | 20 |
| `/morning` | MorningMode | `src/MorningMode.jsx` | 21 |
| `/crisis` | CrisisMode | `src/CrisisMode.jsx` | 0 |
| `/modes` | ModesPage | `src/pages/ModesPage.jsx` | 4 |
| `/settings` | SettingsPage | `src/SettingsPage.jsx` | 22 |
| `/permissions` | PermissionsPage | `src/PermissionsPage.jsx` | 20 |
| `/capabilities` | CapabilitiesPage | `src/CapabilitiesPage.jsx` | 1 |
| `/device` | DeviceCenterPage | `src/DeviceCenterPage.jsx` | 8 |
| `/debug` | DebugPage | `src/DebugPage.jsx` | 99 |
| `/missions` | MissionControl | `src/pages/MissionControl.jsx` | 51 |
| `/inbox` | InfinityInboxPage | `src/pages/InboxPage.jsx` | 11 |
| `/world` | WorldStudio | `src/pages/WorldStudio.jsx` | 11 |
| `/owner` | OwnerAccessPage | `src/pages/OwnerAccessPage.jsx` | 21 |
| `/error/401` | ErrorPage | `src/pages/ErrorPages.jsx` | 0 |
| `/error/403` | ErrorPage | `src/pages/ErrorPages.jsx` | 0 |
| `/error/429` | ErrorPage | `src/pages/ErrorPages.jsx` | 0 |
| `/error/500` | ErrorPage | `src/pages/ErrorPages.jsx` | 0 |
| `*` | NotFound | `src/pages/NotFound.jsx` | 0 |

### 5.1 Routes that touch no core module at all

17 of 56. Composition: 4 error pages, 1 redirect, 1 fallback, 7 public legal/marketing pages, and 4 product surfaces (`/live`, `/create`, `/deen`, `/crisis`) that render with no core engine at all.

| Route | Component | Note |
|---|---|---|
| `/customization` | Customization | Legal / marketing page |
| `/privacy` | LegalPage | Legal / marketing page |
| `/terms` | LegalPage | Legal / marketing page |
| `/cookies` | LegalPage | Legal / marketing page |
| `/dpa` | LegalPage | Legal / marketing page |
| `/about` | About | Legal / marketing page |
| `/support` | SupportPage | Legal / marketing page |
| `/live` | LivePage | Marketing page for live mode (`Landing.module.css`). `core/heyLive.js` exists and is barrel-only. |
| `/create` | CreatePage | Marketing page for creation (`Landing.module.css`). `core/generationEngine.js` exists and is barrel-only. |
| `/voice/live` | Navigate | `<Navigate to="/voice">` |
| `/deen` | DeenPage | The Islamic-practice page. Imports `src/lib/heyDeen.js` (`fetchHadith`, `fetchSurahList`, …) and **not** `core/religiousEngine.js` or `core/prayerTimes.js`. |
| `/crisis` | CrisisMode | Static UI only; no engine, no persistence. |
| `/error/401` | ErrorPage | Error page |
| `/error/403` | ErrorPage | Error page |
| `/error/429` | ErrorPage | Error page |
| `/error/500` | ErrorPage | Error page |
| `*` | NotFound | 404 fallback |

### 5.2 The engine-free feature pages

**Seventeen routes resolve to the identical set of 20 core modules, byte for byte** (`VERIFIED`): `/health`, `/habits`, `/goals`, `/finance`, `/journal`, `/notes`, `/projects`, `/tasks`, `/analytics`, `/learn`, `/studio`, `/permissions`, `/cosmos`, `/login`, `/signup`, `/reset-password`, `/auth/callback`. The 20 are `accountState`, `actionEngine`, `actionTimeline`, `auditLog`, `contextManager`, `deviceGateway`, `eventBus`, `executionAuthorization`, `executionLoop`, `inboxEngine`, `memoryGraph`, `missionEngine`, `modeRegistry`, `permissionManager`, `personality`, `proactiveEngine`, `settingsRegistry`, `skillEngine`, `storage`, `taskEngine`.

Those 20 come from the shared shell (`AppLayout`/`AuthContext`/dashboard widgets), not from the page. The consequence (`VERIFIED`): `healthEngine.js` — 20+ exported functions, a full health-record domain — is never imported by `/health`. `HealthPage.jsx:6` imports `createRecord`/`listRecords` from `src/lib/heyRecords.js` instead. The same pattern holds for the other pages in that list.

**This is the single most misleading thing about the "98 engines" count:** the pages exist, the engines exist, and they are not connected to each other.

---

## 6. Import cycles

**0** strongly connected components of size > 1, across all 666 files (`VERIFIED`; Tarjan SCC over the resolved graph, plus an independent DFS back-edge check that also returned 0).

There is exactly **one** dynamic-import inversion worth knowing about, and the build already reports it:

```
[INEFFECTIVE_DYNAMIC_IMPORT] src/core/contextManager.js is dynamically imported by
src/core/memoryInbox.js but also statically imported by ... 6 files
```

`memoryInbox.js` lazy-imports `contextManager.js` to avoid a cycle; the cycle is avoided by discipline, not by structure. Rewriting either file could reintroduce it. Recorded as `RISK-REGISTER.md` R-02-04.

---

## 7. Duplicate purpose

### 7.1 Same exported symbol from two modules

**47 shared exported symbols across 12 module pairs** (`VERIFIED`, computed from every `export` in all 98 files). A shared exported name is not proof of duplication, so each pair was read.

| Pair | Shared symbols | Finding |
|---|---|---|
| `computerControl.js` / `computerControlEngine.js` | 22 | The orphan `computerControlEngine.js` redeclares `class ComputerControlEngine` and re-exports `computerControlEngine`, `CONTROL_MODES`, `executeComputerCapability` and 18 more symbols already exported by `computerControl.js`. It is a fork, not a wrapper. |
| `artifactEngine.js` / `pinpointPrecision.js` | 11 | Both export `createVersion`, `mergeVersions`, `cherryPickChange`, `getVersion`, `getVersionHistory`, `getBranches`, `compareVersions`, `restoreVersion`, `markApproved`, `markFinal`, `getVersionGraph` — two independent version-control implementations. |
| `taskEngine.js` / `tasksCalendarEngine.js` | 4 | Both export `createTask`, `updateTask`, `getTask`, `getAllTasks` (plus `clearCompletedTasks` in `taskEngine` and `executionEngine`). |
| `deviceFabric.js` / `deviceGateway.js` | 2 | Both export `getDevice` and `getDeviceCapabilities`. |
| `memoryGraph.js` / `cosmosMemory.js` | 1 | Both export `getMemoryGraph`. |
| `memoryGraph.js` / `memoryEngine.js` | 1 | Both export `connectMemoryNodes`. |
| `automationEngine.js` / `workflowEngine.js` | 1 | Both export `createWorkflow`. |
| `voiceEngine.js` / `voiceState.js` | 1 | Both export `VOICE_STATES`. |
| `projectDNA.js` / `pinpointPrecision.js` | 1 | Both export `LOCK_TYPES`. |
| `artifactEngine.js` / `forgeEngine.js` | 1 | Both export `ARTIFACT_TYPES`. |
| `automationEngine.js` / `forgeEngine.js` | 1 | Both export `TRIGGER_TYPES`. |
| `completionRuntime.js` / `scheduleCalculator.js` | 1 | Both export `calculateNextScheduleRun`. |

### 7.2 Same concept, different modules

| Concept | Modules | Finding |
|---|---|---|
| Memory | `memoryEngine.js`, `memoryGraph.js`, `memoryGraphService.js`, `memoryInbox.js`, `memoryRanking.js`, `cosmosMemory.js` | 6 files, no single owner. `storeMemory` writes to an in-process array and fire-and-forgets to Supabase; `memoryGraph` keeps its own node/edge store; `cosmosMemory` wraps both. |
| Execution | `executionEngine.js`, `executionController.js`, `executionLoop.js`, `executionAuthorization.js` | Only `executionController.js` is on the chat path (`executeRequest`). `executionEngine.js` is reachable only through the barrel; `executionLoop.js` only through `skillEngine`. |
| Device | `deviceFabric.js`, `deviceGateway.js`, `trustCenterEngine.js` | 3 files describing device trust and capability. `deviceFabric` is live via `/device`; `trustCenterEngine` is barrel-only. |
| Mode | `modeEngine.js`, `modeRegistry.js`, `surfaceModes.js` | `modeEngine` (barrel-only), `modeRegistry` (chain), `surfaceModes` (live via `/modes`). Three answers to "what mode is active". |
| Capability | `capabilityRegistry.js`, `capabilityExpansionEngine.js`, `v1CapabilityManifest.js`, `featureCatalog.js` | 4 files describing "what HEY can do" in four different shapes. This is the direct justification for `capabilityContract.js`. |
| Provider | `providerRegistry.js`, `providerRouter.js`, `core/infinity/providerRouter.js` | **Two `providerRouter.js` files** exist. The infinity one is live (`/missions`, `/inbox`); the core one only produces an advisory `providerPlan` string that the edge function never reads. |
| Workspace | `workspaceEngine.js`, `workspaceManager.js` | `workspaceEngine` (barrel-only) vs `workspaceManager` (live via `WorkspaceWindows`). |

---

## 8. Event bus: how much of it is connected

143 distinct event names are published across `src/` (`VERIFIED`). **21 of them have at least one subscriber; 122 do not** (`VERIFIED`). The full producer/consumer table is in `ARCHITECTURE.md` §4.

A published event with no subscriber is not a bug in itself — it is a diagnostic channel. But 122 of 143 means the "event architecture" is overwhelmingly write-only, and any later part that assumes a listener exists will be wrong.

---

## 9. What this does not cover

- **NOT EXHAUSTIVE — SAMPLED:** the 249 files under `src/components/` are not individually classified. They are covered only as importers (each one appears in a chain above) and through the 56 route components.
- **NOT EXHAUSTIVE — SAMPLED:** `src/lib/` (128 files) is covered only where it participates in an entry-point chain.
- **Runtime invocation is not proven.** The graph proves a static import path. It does not prove a function is reached, because no provider keys are configured (R-04), so the chat path cannot be exercised end to end. Every "chain" claim is therefore `VERIFIED` for *import* and `INFERRED` for *call*.
- The `src-tauri` crate is not part of this graph; its 13 commands are covered in `ARCHITECTURE.md` §5.3.

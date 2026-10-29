# Generates all 33 module plans under scripts/hey-upgrade/modules/.
# Each plan is a self-describing upgrade-plan (title, notes, dependencies,
# verify stages). `files` is intentionally empty: module source already lives
# in the repository; these plans record state and re-run verification evidence.
# Run from the repository root: powershell -NoProfile -File scripts/hey-upgrade/generate-module-plans.ps1

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$outDir = Join-Path $repoRoot 'scripts/hey-upgrade/modules'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function New-HeyVerifyProbe {
    param([string[]]$Imports, [string[]]$Exists, [string[]]$Tests)
    $args = @('scripts/hey-upgrade/verify-module.mjs')
    foreach ($item in $Imports) { $args += @('--import', $item) }
    foreach ($item in $Exists) { $args += @('--exists', $item) }
    foreach ($item in $Tests) { $args += @('--test', $item) }
    return @(@{ file = 'node'; args = $args })
}

$modules = @(
    [ordered]@{
        id = '00-MASTER-ORCHESTRATOR'
        title = 'Master transactional upgrade/orchestration layer'
        version = '2026.09.18.1'
        dependencies = @()
        imports = @()
        exists = @('HEY-UPGRADE.ps1','scripts/hey-upgrade/HeyUpgrade.psm1','scripts/hey-upgrade/verify-module.mjs','scripts/hey-upgrade/Test-HeyUpgrade.ps1')
        tests = @('tests/upgrade-orchestrator.test.js')
        notes = 'Transactional backups + SHA-256 manifests, baseline conflict detection (Force never bypasses), secret redaction, state machine (pending/applied/verified-local/verified-backend/verified-native/failed/rolled-back), per-module and ALL/resume orchestration. Verified by tests/upgrade-orchestrator.test.js which drives Test-HeyUpgrade.ps1 (8 assertions).'
    }
    [ordered]@{
        id = '01-CORE'
        title = 'Canonical HEY core contracts and execution architecture'
        version = '2026.09.18.1'
        dependencies = @('00-MASTER-ORCHESTRATOR')
        imports = @('src/core/index.js','src/core/executionController.js','src/core/capabilityRegistry.js','src/core/eventBus.js','src/core/errorTaxonomy.js','src/core/artifactEngine.js')
        exists = @('src/core/executionEngine.js','src/core/executionLoop.js')
        tests = @('tests/journeys.test.js','tests/security-regressions.test.js')
        notes = 'Shared contract layer: RequestContext, capability registry, execution controller, HEYError taxonomy, EventEnvelope, artifact engine. Verified execution results only; audit receipts; cancellation/progress support. Covered by journeys + security-regressions suites.'
    }
    [ordered]@{
        id = '02-UI-DESIGN-SYSTEM'
        title = 'Premium adaptive design system, shell, landing benchmark, responsive behavior'
        version = '2026.09.18.1'
        dependencies = @('01-CORE')
        imports = @('src/lib/themes.js','src/lib/themeTokens.js')
        exists = @('src/lib/designTokens.js','src/styles/variables.css','src/styles/theme.css','src/components/Buttons.jsx','src/pages/Landing.module.css','src/theme','src/styles/utilities.css')
        tests = @('tests/theme-studio.test.js')
        notes = '27 themed design tokens; every theme passes >=4.5:1 contrast checks for action labels and body text; invalid custom accents rejected. Premium restrained landing direction. Verified by theme-studio.test.js.'
    }
    [ordered]@{
        id = '03-CHAT'
        title = 'Persistent multimodal conversation surface'
        version = '2026.09.18.1'
        dependencies = @('01-CORE')
        imports = @('src/core/chatTransport.js','src/core/messageRouter.js')
        exists = @('src/core/completionRuntime.js','src/ChatPage.jsx','src/styles/chat.css')
        tests = @('tests/journeys.test.js')
        notes = 'Persistent conversations via chatTransport; message routing; completion runtime forwards OS notifications into the notification center. Conversation persistence + HEY.remember journey covered by tests/journeys.test.js. completionRuntime is browser-only (window at import) so it is verified by presence + the notify path tests.'
    }
    [ordered]@{
        id = '04-VOICE'
        title = 'Hands-free natural realtime-capable Voice with free-first provider stack'
        version = '2026.09.18.1'
        dependencies = @('01-CORE')
        imports = @('src/lib/voiceProviders.js','src/core/voiceState.js','src/lib/wakeWordDetector.js')
        exists = @('src/core/voiceEngine.js','src/pages/VoicePage.jsx','src/pages/Voice.module.css','src/core/heyVoiceSettings.js')
        tests = @('tests/platform-capabilities.test.js','tests/fix-pass.test.js')
        notes = 'Free-first provider stack; honest unavailable/offline/permission states; state machine rejects impossible transitions; wake-word boundary matching. Dedicated /voice surface in the nav catalog. Real microphone/TTS cannot be headless-verified; provider behavior covered with mocks.'
    }
    [ordered]@{
        id = '05-COSMOS'
        title = 'Private timeline + semantic memory graph + retrieval intelligence'
        version = '2026.09.18.1'
        dependencies = @('01-CORE')
        imports = @('src/core/memoryGraph.js','src/core/memoryInbox.js','src/core/contextManager.js','src/core/cosmosMemory.js')
        exists = @('src/core/memoryEngine.js','src/core/memoryGraphService.js','src/core/memoryRanking.js','src/lib/heyMemory.js','src/MemoryPage.jsx','src/CosmosPage.jsx')
        tests = @('tests/journeys.test.js')
        notes = 'Automatic memories gate in an approval inbox; approved memories persist into a searchable memory graph; rejection writes a decision receipt. Multiple abstractions exist (memoryGraph, memoryEngine, memoryGraphService...); consolidation is tracked as a candidate in Module 32 and requires a migration plan before removal.'
    }
    [ordered]@{
        id = '06-AGENTS'
        title = '229 built-in specialists + custom executable agents and teams'
        version = '2026.09.18.1'
        dependencies = @('01-CORE')
        imports = @('src/core/agentEngine.js')
        exists = @('src/core/agentRouter.js','src/core/agentToolMap.js','src/core/capabilityExpansionEngine.js','src/AgentsPage.jsx')
        tests = @('tests/release-surfaces.test.js')
        notes = '229 canonical agents (IDs 843-1071). Agent execution fails closed without a verified provider; unverified outputs rejected; verified outputs accepted. Covered by release-surfaces.test.js.'
    }
    [ordered]@{
        id = '07-FORGE'
        title = 'Safe builder for agents, teams, workflows, skills, commands, automations, widgets and capabilities'
        version = '2026.09.18.1'
        dependencies = @('01-CORE')
        imports = @('src/core/forgeEngine.js')
        exists = @('src/ForgePage.jsx')
        tests = @('tests/release-surfaces.test.js')
        notes = 'Forge validates capabilities and never self-authorizes; generated artifacts run through the same permission/verification gates. Fail-closed tested in release-surfaces.test.js (forgeRunner returns success=false without real runner).'
    }
    [ordered]@{
        id = '08-WORKFLOWS-AUTOMATIONS'
        title = 'Durable workflows, schedules, triggers, retries and approvals'
        version = '2026.09.18.1'
        dependencies = @('01-CORE')
        imports = @('src/core/automationEngine.js','src/core/executionLoop.js')
        exists = @('src/core/workflowEngine.js','src/core/actionEngine.js')
        tests = @('tests/release-surfaces.test.js','tests/security-regressions.test.js')
        notes = 'Verified workflows stop on reported failure, respect cancellation and maxAttempts; automation execution fails closed without a real provider; queued actions require identity+permission+confirmation+verified results. Covered by security-regressions + release-surfaces tests.'
    }
    [ordered]@{
        id = '09-RESEARCH-WEB-FILES'
        title = 'Grounded research, web/source provenance, file intelligence and prompt-injection resistance'
        version = '2026.09.18.1'
        dependencies = @('01-CORE')
        imports = @('src/core/commandParser.js','src/core/infinity/missionEngine.js')
        exists = @('src/core/filesEngine.js','src/core/workspaceEngine.js','src/ProjectsPage.jsx')
        tests = @('tests/platform-capabilities.test.js')
        notes = 'Natural command parsing produces typed workflow steps with validated URLs (YouTube example asserted); research missions require a real output before completion. File intelligence surfaces exist (filesEngine) with permission gating.'
    }
    [ordered]@{
        id = '10-VISION'
        title = 'Camera/screen/image perception pipeline with consent and verified observations'
        version = '2026.09.18.1'
        dependencies = @('01-CORE')
        imports = @('src/core/visionEngine.js','src/lib/heyVision.js')
        exists = @('src/core/visionEngine.js')
        tests = @('tests/platform-capabilities.test.js')
        notes = 'Vision rejects invalid input and missing providers without inventing observations (VISION_PROVIDER_UNAVAILABLE); only structured verified provider observations pass. Camera consent delegated to permission system.'
    }
    [ordered]@{
        id = '11-MEDIA-STUDIO'
        title = 'Real local-first media editing + pluggable AI generation'
        version = '2026.09.18.2'
        dependencies = @('01-CORE')
        imports = @('src/core/mediaAiPlanner.js','src/core/mediaEditEngine.js','src/lib/generationProviders.js')
        exists = @('src/pages/MediaStudio.jsx','src/core/mediaEditEngine.js')
        tests = @('tests/mediaEditPlan.test.js')
        notes = 'Local editing plan parser (trim/crop/resize/speed/compress); semantic requests separated from exact local transforms; AI-proposed plans strip unapproved operations (execute_shell removed). FFmpeg WASM is the local-first engine. Verified by mediaEditPlan.test.js. Server-side hey-studio image generation is free-first: OpenAI when OPENAI_API_KEY is set, otherwise a no-key Pollinations fallback (see module 31).'
    }
    [ordered]@{
        id = '12-COMPUTER-CONTROL'
        title = 'Native verified computer control with scoped permissions and receipts'
        version = '2026.09.18.1'
        dependencies = @('01-CORE')
        imports = @('src/core/osAdapter.js','src/core/toolRegistry.js','src/core/permissionManager.js')
        exists = @('src/core/computerControl.js','src/core/computerControlEngine.js','src/core/computerTools.js')
        tests = @('tests/platform-capabilities.test.js','tests/security-regressions.test.js')
        notes = 'Adapters expose only declared executable capabilities; natural commands reach permission gates instead of self-approving; execution-time authorization re-checks plan/permission/risk/confirmation and ignores forged client overrides. Credentialed/screen-native control requires the Tauri native side (Module 23).'
    }
    [ordered]@{
        id = '13-DEVICE-FABRIC'
        title = 'Trusted device identity, pairing, capability negotiation and handoff'
        version = '2026.09.18.1'
        dependencies = @('12-COMPUTER-CONTROL')
        imports = @('src/core/deviceGateway.js','src/core/deviceFabric.js')
        exists = @('src/core/deviceFabric.js','src/DeviceCenterPage.jsx')
        tests = @('tests/journeys.test.js','tests/platform-capabilities.test.js')
        notes = 'Device registry exposes capabilities without allowing fake remote execution (unavailable+unverified when no real transport); fabric negotiates device identity and 6-char pair codes and reports handoff honestly. Covered by journeys + platform-capabilities tests.'
    }
    [ordered]@{
        id = '14-DYNAMIC-ISLAND'
        title = 'Platform-native live status surface, not a fake universal overlay'
        version = '2026.09.18.1'
        dependencies = @('13-DEVICE-FABRIC')
        imports = @('src/core/dynamicIsland.js')
        exists = @('src/core/desktopIslandBridge.js','src/components/desktop/DesktopIslandSurface.jsx','src/styles/desktopIsland.css')
        tests = @('tests/platform-capabilities.test.js','tests/runtime-integrity.test.js')
        notes = 'Desktop island bridge + surface page exist; Tauri bridge stays inactive in a normal web runtime (no fake native). The true OS live-status surface requires the Windows/Tauri host (Module 23), which is EXTERNAL until a signed native build exists.'
    }
    [ordered]@{
        id = '15-GESTURES'
        title = 'Camera hand-gesture control with calibration, debouncing and safe action mapping'
        version = '2026.09.18.1'
        dependencies = @('10-VISION')
        imports = @('src/lib/wakeWordDetector.js')
        exists = @('src/core/gestureEngine.js','src/core/systemGestureRuntime.js','src/lib/gestureControl.js')
        tests = @('tests/fix-pass.test.js')
        notes = 'Gesture control surface + system gesture runtime exist; wake-word boundary detection is unit-tested. gestureControl reads import.meta.env at load (browser-only), so it is verified by presence. Camera gesture loops are browser-only and cannot run headless in Node; safe action mapping requires explicit permission gates.'
    }
    [ordered]@{
        id = '16-WORKSPACE-WIDGETS'
        title = 'Persistent spatial workspace + widget runtime'
        version = '2026.09.18.1'
        dependencies = @('01-CORE')
        imports = @('src/core/eventBus.js','src/core/artifactEngine.js')
        exists = @('src/core/workspaceEngine.js','src/core/workspaceManager.js','src/core/infinity/actionTimeline.js','src/Dashboard.jsx')
        tests = @()
        notes = 'Workspace engine + manager (persistent spatial workspace) and an Infinity action/evidence timeline exist; widget runtime is exercised through event bus + artifact persistence paths. Two workspace abstractions are candidate consolidation targets tracked in Module 32.'
    }
    [ordered]@{
        id = '17-TASKS-PLANNER'
        title = 'Tasks, planner, calendar, reminders and time-aware intelligence'
        version = '2026.09.18.1'
        dependencies = @('01-CORE')
        imports = @('src/core/taskEngine.js','src/core/tasksCalendarEngine.js','src/lib/habitStreak.js')
        exists = @('src/core/planner.js','src/core/briefingEngine.js','src/core/prayerTimes.js','src/core/proactiveEngine.js','src/TasksPage.jsx','src/CalendarPage.jsx')
        tests = @('tests/fix-pass.test.js')
        notes = 'Tasks + calendar engine with time-aware intelligence; habit streaks computed on local calendar days with pending-today semantics; proactive engine surfaces overdue-task signals. Covered by fix-pass.test.js. tasksCalendarEngine logs a localStorage availability warning in Node but the module still loads and the pure helpers are unit-tested.'
    }
    [ordered]@{
        id = '18-MODES'
        title = 'Coherent HEY modes/workbenches without fragmenting the assistant'
        version = '2026.09.18.1'
        dependencies = @('01-CORE')
        imports = @('src/core/surfaceModes.js','src/core/modeRegistry.js')
        exists = @('src/core/modeEngine.js','src/pages/ModesPage.jsx','src/styles/modes.css','src/CrisisMode.jsx','src/MorningMode.jsx')
        tests = @()
        notes = 'Surface modes + mode registry produce coherent workbenches on top of one assistant; mode engine, Crisis and Morning modes and the Modes page exist. No dedicated mode transition test yet; covered structurally by the app shell and catalog (source-implemented, NOT TESTED for mode transitions).'
    }
    [ordered]@{
        id = '19-PROVIDER-ROUTER'
        title = 'Free-first multi-provider/model routing, health, fallback and future paid adapters'
        version = '2026.09.18.1'
        dependencies = @('01-CORE')
        imports = @('src/core/infinity/providerRouter.js','src/core/infinity/qualityGate.js','src/core/infinity/infinityManifest.js')
        exists = @('src/core/providerRouter.js','src/core/providerRegistry.js')
        tests = @('tests/infinityRuntime.test.js')
        notes = 'Provider router prefers compatible healthy higher-quality provider and honors localOnly; quality gate refuses empty output; provider descriptors carry cost/privacy/local fields so paid adapters can stay disabled by default. Covered by infinityRuntime.test.js.'
    }
    [ordered]@{
        id = '20-AUTH-SECURITY'
        title = 'Auth lifecycle, profiles, RLS, rate limiting, trust center and security hardening'
        version = '2026.09.18.1'
        dependencies = @('01-CORE')
        imports = @('src/core/permissionManager.js','src/core/auditLog.js','src/lib/authLifecycle.js','src/lib/permissionPolicy.js')
        exists = @('src/core/trustCenterEngine.js','src/core/ownerEntitlements.js','src/AuthContext.jsx','src/ProtectedRoute.jsx','src/PermissionsPage.jsx','supabase/migrations')
        tests = @('tests/security-regressions.test.js','tests/platform-capabilities.test.js')
        notes = 'Execution-time authorization enforces user identity, plan, permission, consent and forged-client defenses; hydrated permissions cannot cross account boundaries; audit receipts on every decision. Auth lifecycle + RLS migrations exist server-side. Service-role secrets live server-side only.'
    }
    [ordered]@{
        id = '21-PLANS-ENTITLEMENTS'
        title = 'Future-proof Free/Pro/Elite entitlements with launch-free operation'
        version = '2026.09.18.1'
        dependencies = @('20-AUTH-SECURITY')
        imports = @('src/lib/accountRecords.js','src/lib/permissionPolicy.js','src/core/ownerEntitlements.js')
        exists = @('src/core/planCatalog.js','src/core/accountsBillingEngine.js','src/pages/Pricing.jsx')
        tests = @('tests/platform-capabilities.test.js')
        notes = 'Tier resolution from explicit plan/entitlements (unknown -> free); permission policy enforces tier boundaries; server-enforced via admin-entitlements edge function and RLS; launch works entirely on the free tier. Client plan/entitlement overrides are ignored at the execution boundary.'
    }
    [ordered]@{
        id = '22-PWA'
        title = 'Installable resilient mobile-first PWA with truthful platform limits'
        version = '2026.09.18.1'
        dependencies = @('01-CORE')
        imports = @('src/core/platformMatrix.js','src/lib/badgeSync.js','src/lib/windowControlsOverlayAdapter.js')
        exists = @('public/sw.js','public/site.webmanifest','public/favicon.svg','index.html','src/styles/pwa.css','src/components/PWAInstallButton.jsx')
        tests = @('tests/release-surfaces.test.js','tests/runtime-integrity.test.js')
        notes = 'Service worker (install, notificationclick -> HEY_NOTIFICATION_OPEN) + manifest + install button; release matrix lists every HEY target without claiming unbuilt native releases. App badge sync and WCO adapter present with runtime-integrity coverage.'
    }
    [ordered]@{
        id = '23-WINDOWS'
        title = 'Windows/Tauri native product integration'
        version = '2026.09.18.1'
        dependencies = @('12-COMPUTER-CONTROL')
        imports = @('src/lib/tauriAdapter.js','src/core/osAdapter.js')
        exists = @('src-tauri/src/main.rs','src-tauri/tauri.conf.json','src-tauri/capabilities/default.json','src-tauri/build.rs','src-tauri/Cargo.toml')
        tests = @('tests/platform-capabilities.test.js','tests/runtime-integrity.test.js')
        notes = 'Tauri adapter stays inactive in a normal web runtime; WCO geometry adapters present. cargo check passes on the native adapter. Building a signed Windows installer is EXTERNAL (requires the Tauri CLI bundle step + signing); release status nativeBuildRequired.'
    }
    [ordered]@{
        id = '24-ANDROID'
        title = 'Android native/mobile integration with shared HEY core'
        version = '2026.09.18.1'
        dependencies = @('23-WINDOWS')
        imports = @('src/core/platformMatrix.js')
        exists = @('src-tauri/gen','src-tauri/tauri.conf.json','src-tauri/capabilities/default.json')
        tests = @('tests/release-surfaces.test.js')
        notes = 'Adaptive mobile surfaces + shared core; platform matrix marks Android honestly. Building an APK/AAB requires Java/Android SDK/ADB which are not installed on this host -> EXTERNAL_SETUP_REQUIRED (toolchain).'
    }
    [ordered]@{
        id = '25-IOS'
        title = 'iOS native integration using legitimate platform capabilities'
        version = '2026.09.18.1'
        dependencies = @('23-WINDOWS')
        imports = @('src/core/platformMatrix.js')
        exists = @()
        tests = @('tests/release-surfaces.test.js')
        notes = 'Release matrix marks iOS as nativeProjectRequired and isReleaseVerified=false. iOS builds require macOS + Xcode + Apple signing which are unavailable on this Windows host -> EXTERNAL_SETUP_REQUIRED (hardware/signing). No fake iOS automation claims are made.'
    }
    [ordered]@{
        id = '26-DREAM-WORLD-RUNTIME'
        title = 'Dream World prompt-to-interactive-world foundation using the right runtime'
        version = '2026.09.18.1'
        dependencies = @('01-CORE')
        imports = @('src/core/generationEngine.js')
        exists = @('src/pages/WorldStudio.jsx','src/core/infinity/worldStyleEngine.js','src/pages/WorldStudio.module.css')
        tests = @('tests/theme-studio.test.js')
        notes = 'World Studio surface + world style engine + generation engine produce themed interactive worlds from prompts/theme choices (local-first theme application). Real AI generation (image/video) depends on provider keys and is EXTERNAL; local theme generation is source-implemented.'
    }
    [ordered]@{
        id = '27-PERFORMANCE-OFFLINE'
        title = 'Performance budgets, workers, caching, offline/recovery and resource governance'
        version = '2026.09.18.1'
        dependencies = @('01-CORE')
        imports = @('src/core/heyLogger.js')
        exists = @('src/core/offlineEngine.js','src/core/backgroundRuntimeKeepAlive.js','public/sw.js','src/core/healthEngine.js')
        tests = @()
        notes = 'Offline engine + background keep-alive + service worker caching exist; health engine reports system state. Vite build emits only pre-existing chunk-size warnings (INEFFECTIVE_DYNAMIC_IMPORT) with no errors. No automated performance budget test yet -> NOT TESTED for byte-budget.'
    }
    [ordered]@{
        id = '28-ACCESSIBILITY'
        title = 'Keyboard, screen-reader, motion, contrast, touch and cognitive accessibility'
        version = '2026.09.18.1'
        dependencies = @('02-UI-DESIGN-SYSTEM')
        imports = @('src/lib/themeTokens.js')
        exists = @('src/styles/compliance.css','src/components/IdleScreensaver.jsx','src/styles/states.css')
        tests = @('tests/theme-studio.test.js')
        notes = 'Contrast >=4.5:1 enforced across 27 themes, reduced-motion + compliance styles exist. Real screen-reader/keyboard end-to-end checks require a browser/AT environment -> manual verification item (EXTERNAL/physical-device).'
    }
    [ordered]@{
        id = '29-OBSERVABILITY-DEBUG'
        title = 'Local/free structured logs, traces, health and diagnostics'
        version = '2026.09.18.1'
        dependencies = @('01-CORE')
        imports = @('src/core/heyLogger.js','src/core/errorTaxonomy.js')
        exists = @('src/core/diagnosticsEngine.js','src/core/healthEngine.js','src/DebugPage.jsx','scripts/hey-upgrade/HeyUpgrade.psm1')
        tests = @('tests/upgrade-orchestrator.test.js')
        notes = 'Logger, diagnostics engine, health engine and error taxonomy exist; upgrade orchestrator captures redacted, timed command logs with exit codes. Structured server-side tracing is a backend-deploy item (EXTERNAL).'
    }
    [ordered]@{
        id = '30-TESTING-E2E'
        title = 'Comprehensive automated and manual evidence matrix'
        version = '2026.09.18.1'
        dependencies = @('29-OBSERVABILITY-DEBUG')
        imports = @()
        exists = @('tests/journeys.test.js','tests/platform-capabilities.test.js','tests/security-regressions.test.js','tests/release-surfaces.test.js','tests/runtime-integrity.test.js','tests/infinityRuntime.test.js','tests/mediaEditPlan.test.js','tests/theme-studio.test.js','tests/fix-pass.test.js','tests/upgrade-orchestrator.test.js','docs/upgrade/HEY-VERIFICATION-MATRIX.md')
        tests = @('tests/journeys.test.js','tests/platform-capabilities.test.js','tests/security-regressions.test.js','tests/release-surfaces.test.js','tests/runtime-integrity.test.js','tests/infinityRuntime.test.js','tests/mediaEditPlan.test.js','tests/theme-studio.test.js','tests/fix-pass.test.js','tests/upgrade-orchestrator.test.js')
        notes = 'Full automated matrix: 60 tests across 10 files (journeys, platform capabilities, security regressions, release surfaces, runtime integrity, Infinity runtime, media edit plan, theme studio, fix-pass, upgrade orchestrator). Manual/browser-only journeys are recorded in HEY-KNOWN-LIMITS.md and the verification matrix.'
    }
    [ordered]@{
        id = '31-DEPLOYMENT-LAUNCH'
        title = 'Free-first release pipeline, backend migrations, rollback, launch truthfulness'
        version = '2026.09.18.2'
        dependencies = @('30-TESTING-E2E')
        imports = @('src/core/platformMatrix.js')
        exists = @('supabase/functions/hey','supabase/functions/hey-studio','supabase/functions/admin-entitlements','supabase/functions/hey-push','supabase/migrations','public/sw.js','.gitleaks.toml','DEPLOYMENT.md')
        tests = @('tests/release-surfaces.test.js')
        notes = 'Four edge functions + 15 migrations; gitleaks secret-scan config; rollback and known-limits docs. hey-studio now ships a no-key free image path (Pollinations fallback when OPENAI_API_KEY is absent); video still requires LUMA_API_KEY and reports an honest unavailable state without it. Live deployment to the hosted Supabase project and VAPID-key provisioning are EXTERNAL (operator must run; recorded in docs/setup/API-SETUP.md).'
    }
    [ordered]@{
        id = '32-FINAL-INTEGRATION'
        title = 'Cross-module consolidation, cleanup, evidence and release candidate'
        version = '2026.09.18.1'
        dependencies = @('31-DEPLOYMENT-LAUNCH')
        imports = @('src/core/index.js','src/core/executionController.js','src/core/agentEngine.js')
        exists = @('docs/upgrade/MASTER-STATUS.json','docs/upgrade/HEY-CAPABILITY-LEDGER.json','docs/upgrade/HEY-VERIFICATION-MATRIX.md','docs/upgrade/HEY-COMPLETE-IMPLEMENTATION-REPORT.md','docs/setup/API-SETUP.md','AGENTS.md','.opencode/commands/hey-finish.md')
        tests = @('tests/journeys.test.js','tests/platform-capabilities.test.js','tests/security-regressions.test.js','tests/release-surfaces.test.js','tests/runtime-integrity.test.js','tests/infinityRuntime.test.js','tests/mediaEditPlan.test.js','tests/theme-studio.test.js','tests/fix-pass.test.js','tests/upgrade-orchestrator.test.js')
        notes = 'Final integration: durable status file, capability ledger (2039 entries), verification matrix, implementation report, setup doc, AGENTS.md + hey-finish command, and the full automated test matrix. Candidate consolidations (memory abstractions, providerRouter x2, computerControl x2, workspaceEngine x2, voice files) are documented in reports with migration plans; none are removed without replacement tests.'
    }
    [ordered]@{
        id = '33-EXTERNAL-CONTROL'
        title = 'OS-level control bridge and native ladder (Windows daemon, Android accessibility, iOS facts)'
        version = '2026.09.18.1'
        dependencies = @('15-GESTURES','23-WINDOWS')
        imports = @('src/core/externalControlBridge.js')
        exists = @('src/core/externalControlBridge.js','native/external-control/README.md','native/external-control/android/ExternalHeyAccessibilityService.kt','native/external-control/windows/daemon-design.md','native/external-control/ios/APPLE-CONTROL-POLICY.md','src/core/gestureEngine.js')
        tests = @('tests/external-control.test.js')
        notes = 'Honest external-control contract: action envelopes, allowlisted commands, risk gates, and confirmation requirements live in externalControlBridge (13/13 tests). Gesture bindings with the external. prefix route through the bridge and fail closed (nativeTransportUnavailable) in a plain web runtime. Windows Tauri daemon: cargo check passes, signed installer EXTERNAL. Android accessibility service: source scaffold only, needs Android SDK (EXTERNAL_SETUP_REQUIRED). iOS: third-party control barred by Apple policy; Live Activity/widgets only.'
    }
)

foreach ($module in $modules) {
    $verify = @(New-HeyVerifyProbe -Imports @($module.imports) -Exists @($module.exists) -Tests @($module.tests))
    if ($module.id -eq '32-FINAL-INTEGRATION') {
        $verify += @(
            @{ file = 'npm.cmd'; args = @('run', 'lint') }
            @{ file = 'npm.cmd'; args = @('run', 'build') }
            @{ file = 'cargo.exe'; args = @('check', '--manifest-path', 'src-tauri/Cargo.toml') }
        )
    }
    $plan = [ordered]@{
        moduleId = $module.id
        title = $module.title
        version = $module.version
        files = @()
        dependencies = @($module.dependencies)
        migrations = @()
        functions = @()
        backendDeployment = $false
        productionBackend = $false
        nativeBuild = $false
        androidBuild = $false
        verify = $verify
        notes = $module.notes
    }
    $planPath = Join-Path $outDir ($module.id + '.json')
    $plan | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $planPath -Encoding utf8
    Write-Host "wrote $($module.id).json ($($verify.Count) verify command(s))"
}

Write-Host "Generated $($modules.Count) module plans."
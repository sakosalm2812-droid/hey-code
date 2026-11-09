# HEY Architecture

## Overview
HEY is a cross-platform personal intelligence platform (web/PWA, Windows/Tauri, Android, iOS/iPadOS) with closed-source, subscription-funded model. Core is shared; platform adapters provide native capabilities.

## Shared Contracts
`src/core/` implements the unified HEY core. Canonical contracts live in `src/core/agentContract.js`, `src/core/capabilityContract.js`, `src/core/deliveryContract.js`. All cross-cutting concerns converge on `RequestContext`, `CapabilityDescriptor`, `ExecutionRequest`/`ExecutionResult`, `ProviderDescriptor`/`ProviderResult`, `HEYError`, `EventEnvelope`, `Artifact`.

## Event/State Fabric
- `src/core/eventBus.js` — pub/sub backbone for UI, agents, OS adapters.
- `src/core/contextManager.js` — session/request context assembler, user/profile state.
- `src/core/componentState.js` — UI state machines, persisted per session.
- `src/core/traceSpine.js` / `heyLogger.js` — request tracing, audit trails.

## Provider Gateway
- `src/core/providerRouter.js` — model selection with cost/latency/risk constraints.
- `src/core/providerRegistry.js` / `src/core/modelRegistry.js` / `src/core/modelRouter.js` — provider capabilities, model definitions, routing.
- `src/core/aiRouter.js` — subject classification, local vs remote routing.
- Provider calls are interchangeable; cost controls enforced in `src/core/costGovernor.js`.

## Cosmos Memory
- `src/core/cosmosMemory.js` / `memoryEngine.js` — memory storage, retrieval, consolidation.
- `src/core/hybridSearch.js` — BM25 + semantic search.
- `src/core/memoryGraph.js` / `memoryGraphService.js` — relational memory graph.
- `src/core/memoryRanking.js` / `memoryConsolidation.js` — decay, deduplication, canonicalization.

## Agent Runtime
Three classes: always-active (research/monitoring), on-demand (invoked), user-created (Forge-born). Runtime:
- `src/core/agentContract.js` — agent schema validation, risk/privacy classes, tool permissions.
- `src/core/agentEngine.js` / `agentRouter.js` / `agentSelection.js` — selection, routing, team formation.
- `src/core/forgeEngine.js` — user-created agent designer, test generation.
- `src/core/agentHealth.js` — health states, degradation.
- `src/core/governedToolExecutor.js` — tool execution with permission checks.

## Chat/Voice/Live Unified
- `src/core/chatTransport.js` / `heyLive.js` — transport abstraction, live session streaming.
- `src/core/voiceEngine.js` / `voiceSessionMachine.js` — voice pipeline, wake word policy.
- `src/core/heyBrain.js` — central dispatch, intent analysis, context building.

## Dynamic Island / Surfaces
- `src/core/dynamicIsland.js` / `desktopIslandBridge.js` — native island UI, cross-platform bridge.
- `src/core/surfaceModes.js` — mode switching (chat, voice, live, task).

## Studios / Automation
- `src/core/workflowEngine.js` / `automationEngine.js` — no-code workflows, triggers.
- `src/core/planner.js` / `delegationPlan.js` — plan generation, task decomposition.
- `src/core/durableScheduler.js` — scheduled tasks, reminders.

## Evolution Engine
- `src/core/evolutionEngine.js` / `evolutionAgents.js` / `evolutionScheduler.js` — continuous improvement, capability expansion, auto-forge.

## Platform Adapters
- `src/core/osAdapter.js` / `systemIntegration.js` — OS-level capabilities via Tauri/native commands.
- `src/core/deviceFabric.js` / `deviceGateway.js` — device discovery, routing.
- `src/core/platformCapabilities.js` — capability matrix per platform.
- Web/PWA limited to browser APIs; native adapters provide OS control via agents.

## Education Mode
- `src/core/mentorCouncil.js` / `tutorialCatalog.js` / `onboardingEngine.js` — guided learning, skill progression.

## Security & Verification
- `src/core/verificationEngine.js` / `actionVerificationEngine.js` — evidence trace, independent reproduction required.
- `src/core/permissionManager.js` / `executionAuthorization.js` / `failClosedPermissionChecker.js` — fail-closed permissions.
- `src/core/auditLog.js` / `auditLogger.js` — immutable audit receipts.

## Key Files
- `src/core/index.js` — central re-exports.
- `src/core/heyBrain.js` — entry dispatch.
- `src/core/agentContract.js` — canonical agent contract with deepFreeze utility.
- `src/core/foundation/` — rebuilding (StateStore, EventBus, ModelGateway, CosmosMemory, PermissionManager, AgentContract, VerificationEngine, contracts).
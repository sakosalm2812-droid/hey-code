# HEY Core Canonical Map

Generated: 2026-11-09. This is the one source of truth per concern: ONE module for each concern. Duplicates flagged.

## Canonical Mapping (183 modules in src/core/)

| Concern | Canonical Module | Duplicates / Notes |
|---|---|---|
| provider routing | `src/core/providerRouter.js` | `src/core/providerRegistry.js`, `src/core/modelRouter.js`, `src/core/aiRouter.js`, `src/core/modelRegistry.js` are support; `providerRouter.js` is the gateway. |
| memory | `src/core/cosmosMemory.js` | Duplicates: `memoryEngine.js`, `memoryGraph.js`, `memoryGraphService.js`, `memoryRetrieval.js`, `memoryConsolidation.js`, `memoryRecord.js`, `memoryInbox.js`, `memoryRanking.js`, `cosmosMemoryLegacy.js`, `hybridSearch.js`. Cosmos is canonical; others are implementation layers. |
| permissions | `src/core/permissionManager.js` | `executionAuthorization.js`, `failClosedPermissionChecker.js` are policy layers. `permissionManager.js` is canonical registry. |
| execution | `src/core/executionEngine.js` | `executionController.js`, `executionLoop.js`, `governedToolExecutor.js`, `actionEngine.js` are implementation stages. |
| agents | `src/core/agentContract.js` | `agentRouter.js`, `agentEngine.js`, `agentSelection.js`, `agentToolMap.js`, `agentHealth.js`, `forgeEngine.js`, `developerEngine.js`, `mentorCouncil.js` are runtime components. Contract is canonical definition. |
| audit | `src/core/auditLog.js` | `auditLogger.js`, `traceSpine.js`, `decisionLedger.js`, `timeLedger.js` are audit components; `auditLog.js` is API. |
| gesture | `src/core/gestureEngine.js` | `gestureMapping.js`, `systemGestureRuntime.js`, `inputFusion.js` are support. Canonical is `gestureEngine`. |
| action | `src/core/actionEngine.js` | `actionVerificationEngine.js` is verification layer; `actionEngine` is canonical executor. |
| eventBus | `src/core/eventBus.js` | No duplicates found. |
| stateStore | `src/core/contextManager.js` | `componentState.js`, `accountState.js` are scoped state stores. `contextManager` is canonical session store. |
| tracer | `src/core/traceSpine.js` | `heyLogger.js` is console/logging wrapper; `traceSpine` is canonical trace. |
| verification | `src/core/verificationEngine.js` | `actionVerificationEngine.js`, `releaseGate.js`, `capabilityAdmissionTest.js` are verification components; `verificationEngine` is canonical. |
| context assembler | `src/core/contextAssembler.js` | `contextManager.js` is broader session manager. `contextAssembler` is reasoning-session specific. |
| capability | `src/core/capabilityContract.js` | `capabilityRegistry.js`, `capabilityVault.js`, `capabilityLedger.js`, `capabilityExpansionEngine.js`, `featureCatalog.js` are registry/implementation layers. |
| model | `src/core/modelRegistry.js` | `modelRegistry.data.js`, `modelRouter.js`, `modelEvaluator.js` are support. |
| cognitive fabric | `src/core/cognitiveFabric.js` | Topology + decision + evidence + council + response pipeline. `topologyRegistry.js`, `decisionFabric.js`, `evidenceBoard.js`, `dissentPreservation.js`, `deliberationBudgeter.js`, `intelligenceCouncil.js`, `contextAssembler.js`, `responsePipeline.js` are sub-modules. |
| hey brain | `src/core/heyBrain.js` | Main dispatcher. No duplicates. |
| personality | `src/core/personality.js` | No duplicates. |
| command parser | `src/core/commandParser.js` | No duplicates. |
| planner | `src/core/planner.js` | `delegationPlan.js`, `planCatalog.js` are support. |
| computer control | `src/core/computerControl.js` | `computerControlEngine.js`, `computerTools.js`, `externalControlBridge.js` are layers. |
| voice | `src/core/voiceEngine.js` | `voiceSessionMachine.js`, `voiceState.js`, `heyVoiceSettings.js`, `wakeWordPolicy.js`, `chatTransport.js` are components. |
| live | `src/core/heyLive.js` | No duplicates. |
| notifications | `src/core/notificationCenter.js` | `unifiedNotifier.js` is wrapper. |
| scheduler | `src/core/durableScheduler.js` | `tasksCalendarEngine.js`, `scheduleCalculator.js` are domain-specific. |
| os adapter | `src/core/osAdapter.js` | `systemIntegration.js`, `deviceFabric.js`, `deviceGateway.js`, `deviceRouting.js`, `platformCapabilities.js`, `platformMatrix.js` are adapters. |
| automation | `src/core/automationEngine.js` | `proactiveEngine.js` is layer. |
| research | `src/core/researchPipeline.js` | No duplicates. |
| media | `src/core/mediaAiPlanner.js` | `mediaEditEngine.js`, `unifiedMediaGenerator.js`, `generationEngine.js`, `generationTools.js` are components. |
| files | `src/core/filesEngine.js` | No duplicates. |
| accounts | `src/core/accountState.js` | `accountsBillingEngine.js`, `tenancyLifecycle.js`, `ownerEntitlements.js` are layers. |
| community | `src/core/communityEngine.js` | No duplicates. |
| onboarding | `src/core/onboardingEngine.js` | `tutorialCatalog.js` is content. |
| settings | `src/core/settingsRegistry.js` | No duplicates. |
| cost | `src/core/costGovernor.js` | No duplicates. |
| health | `src/core/healthEngine.js` | `diagnosticsEngine.js`, `agentHealth.js` are components. |
| error | `src/core/errorTaxonomy.js` | No duplicates. |
| degraded | `src/core/degradedMode.js` | `offlineEngine.js`, `backgroundRuntimeKeepAlive.js`, `backgroundHelper.js` are layers. |
| consequential | `src/core/consequentialApprovalGate.js` | No duplicates. |
| skill | `src/core/skillEngine.js` | No duplicates. |
| workflow | `src/core/workflowEngine.js` | No duplicates. |
| task | `src/core/taskEngine.js` | No duplicates. |
| workspace | `src/core/workspaceEngine.js` | `workspaceManager.js` is wrapper. |
| project | `src/core/projectDNA.js` | No duplicates. |
| vault | `src/core/vaultStaging.js` | `secretBroker.js`, `keyRotator.js` are layers. |
| schema | `src/core/schemaMigrationSystem.js` | No duplicates. |
| export | `src/core/exportHonesty.js` | `exportMatrix.js` is support. |
| design | `src/core/designSystem.js` | No duplicates. |
| navigation | `src/core/navigationCatalog.js` | No duplicates. |
| localization | `src/core/localizationPipeline.js` | No duplicates. |
| religious | `src/core/religiousEngine.js` | `prayerTimes.js` is component. |
| print | `src/core/printGeometry.js` | `printModel.js` is support. |
| paginate | `src/core/paginate.js` | No duplicates. |
| pack | `src/core/packManifest.js` | No duplicates. |
| component | `src/core/componentRegistry.js` | `componentState.js` is state. |
| evolution | `src/core/evolutionEngine.js` | `evolutionAgents.js`, `evolutionScheduler.js` are layers. |
| trust | `src/core/trustCenterEngine.js` | `trustKernel.js` is core. |
| product integrity | `src/core/productIntegrityEngine.js` | No duplicates. |
| outcome telemetry | `src/core/outcomeTelemetry.js` | No duplicates. |
| anti-gaming | `src/core/antiGaming.js` | No duplicates. |
| answer | `src/core/answerEnvelope.js` | `answerKeyPolicy.js` is policy. |
| artifact | `src/core/artifactEngine.js` | `artifactResponse.js` is response layer. |
| delivery | `src/core/deliveryContract.js` | No duplicates. |
| mode | `src/core/modeEngine.js` | `modeRegistry.js` is registry. |
| surface | `src/core/surfaceModes.js` | No duplicates. |
| dynamic island | `src/core/dynamicIsland.js` | `desktopIslandBridge.js` is bridge. |
| briefing | `src/core/briefingEngine.js` | No duplicates. |
| mission | `src/core/missionCenter.js` | No duplicates. |
| capture | `src/core/captureInbox.js` | `captureConsent.js` is policy. |
| e2e | `src/core/e2eTestHarness.js` | No duplicates. |
| pinpoint | `src/core/pinpointPrecision.js` | No duplicates. |
| quality | `src/core/qualityEngine.js` | No duplicates. |
| response style | `src/core/responseStyleEngine.js` | No duplicates. |
| routing policy | `src/core/routingPolicy.js` | No duplicates. |
| sandbox | `src/core/sandbox.js` | No duplicates. |
| v1 capability | `src/core/v1CapabilityManifest.js` | No duplicates. |
| index | `src/core/index.js` | Central barrel. |

## Duplicates Found

**Memory:** 11 modules. Canonical: `cosmosMemory.js`. Consolidate layers under Cosmos API.

**Provider/Model:** 6 modules. Canonical: `providerRouter.js` + `modelRegistry.js`. Keep registry separate.

**Agents:** 8+ modules. Canonical contract in `agentContract.js`. Runtime components are separate but distinct concerns.

**Capability:** 6 modules. Canonical contract in `capabilityContract.js`. Registry/vault/ledger are implementation details.

**Verification:** 3 modules. Canonical: `verificationEngine.js`.

**Event/State:** `contextManager.js` vs `componentState.js` vs `accountState.js`. Each scoped, not duplicate.

**Audit/Tracing:** `traceSpine.js` + `auditLog.js` + `auditLogger.js` + `heyLogger.js`. Different layers, acceptable.

**Execution:** multiple modules. Pipeline stages, not duplicates.

Total concerns mapped: 73. Total modules: 183. Average ~2.5 modules per concern, mostly layered.

**Note:** Step 3 modules intentionally import from `src/core/foundation/`. That directory was deleted; foundation must be rebuilt to satisfy contracts. No Step 3 modules import the canonical modules above — they import siblings only.
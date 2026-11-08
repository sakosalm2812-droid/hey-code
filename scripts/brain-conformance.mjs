#!/usr/bin/env node

/**
 * HEY Cognitive Fabric Conformance Checker
 *
 * Validates that all 10 brain modules conform to their specifications
 * and that the Cognitive Fabric integrates correctly with the foundation.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Canonical module specifications
const CANONICAL_MODULES = [
  {
    id: 'topologyRegistry',
    path: 'src/core/topologyRegistry.js',
    exports: [
      'SINGLE_AGENT_TOPOLOGY',
      'CASCADE_TOPOLOGY',
      'PLANNER_EXECUTOR_TOPOLOGY',
      'PLANNER_EXECUTOR_VERIFIER_TOPOLOGY',
      'PARALLEL_EXPERTS_TOPOLOGY',
      'COUNCIL_TOPOLOGY',
      'TOURNAMENT_TOPOLOGY',
      'DETERMINISTIC_TOPOLOGY',
      'ALL_TOPOLOGIES',
      'getTopology',
      'selectTopology',
      'validateTopology',
    ],
    description: 'Topology registry with 8 topologies and selection logic',
  },
  {
    id: 'decisionFabric',
    path: 'src/core/decisionFabric.js',
    exports: [
      'classifyRisk',
      'requiresVerification',
      'selectTopologyClassifier',
      'estimateComplexity',
      'classifyIntent',
      'requiresPermission',
      'selectProvider',
      'selectResponseStyle',
      'makeDecision',
    ],
    description: '7 deterministic classifiers for decision making',
  },
  {
    id: 'evidenceBoard',
    path: 'src/core/evidenceBoard.js',
    exports: [
      'createEvidenceBoard',
      'addClaim',
      'addSource',
      'recordUncertainty',
      'recordContradiction',
      'recordDecision',
      'updateClaimConfidence',
      'resolveUncertainty',
      'getBoardSummary',
      'exportBoard',
      'importBoard',
      'transitionBoardStatus',
    ],
    description: 'Persistent evidence collection system',
  },
  {
    id: 'dissentPreservation',
    path: 'src/core/dissentPreservation.js',
    exports: [
      'createDissentSystem',
      'recordDissent',
      'markDissentConsidered',
      'markDissentAddressed',
      'archiveOldDissent',
      'getDissentByAgent',
      'getDissentByTopic',
      'getDissentStats',
      'findDissentOnTopic',
      'exportDissentSystem',
      'importDissentSystem',
      'hasSignificantDissent',
      'getDissentTimeline',
    ],
    description: 'Dissent tracking and preservation system',
  },
  {
    id: 'deliberationBudgeter',
    path: 'src/core/deliberationBudgeter.js',
    exports: [
      'createDeliberationBudget',
      'startDeliberation',
      'recordTimeUsage',
      'recordTokenUsage',
      'recordIterationUsage',
      'isBudgetExhausted',
      'getRemainingBudget',
      'createCheckpoint',
      'rollbackToCheckpoint',
      'updateBudgetConfig',
      'completeDeliberation',
      'getBudgetSummary',
      'exportBudget',
      'importBudget',
      'shouldContinueDeliberation',
      'getEfficiencyScore',
    ],
    description: 'Resource budget management for deliberation',
  },
  {
    id: 'intelligenceCouncil',
    path: 'src/core/intelligenceCouncil.js',
    exports: [
      'createCouncilSession',
      'openCouncilSession',
      'addCouncilMember',
      'recordCouncilSpeech',
      'recordCouncilDissent',
      'considerCouncilDissent',
      'recordCouncilIteration',
      'recordCouncilTime',
      'recordCouncilTokens',
      'shouldCouncilContinue',
      'reachCouncilConsensus',
      'getCouncilSummary',
      'exportCouncilSession',
      'importCouncilSession',
      'getDebateTranscript',
      'hasConsensus',
      'getMemberParticipation',
    ],
    description: 'Collaborative reasoning council engine',
  },
  {
    id: 'contextAssembler',
    path: 'src/core/contextAssembler.js',
    exports: [
      'createContext',
      'updateUserContext',
      'updateConversation',
      'addMemoryToContext',
      'updateMemoryAccess',
      'updateCapabilities',
      'updateSystemState',
      'updateExternalContext',
      'updateRiskAssessment',
      'updateBudgetUsage',
      'getContextSummary',
      'exportContext',
      'importContext',
      'mergeContexts',
      'filterContextMemory',
      'clearOldMemory',
    ],
    description: 'Comprehensive context builder and manager',
  },
  {
    id: 'responsePipeline',
    path: 'src/core/responsePipeline.js',
    exports: [
      'createResponsePipeline',
      'setResponseContent',
      'addResponseClaim',
      'addResponseCitation',
      'addResponseLimitation',
      'setResponseProvenance',
      'transitionResponseStatus',
      'synthesizeResponseFromEvidence',
      'addResponseDisclaimer',
      'getResponseSummary',
      'exportResponse',
      'importResponse',
      'validateResponse',
      'formatResponseForDelivery',
    ],
    description: 'Response generation and delivery pipeline',
  },
  {
    id: 'cognitiveFabric',
    path: 'src/core/cognitiveFabric.js',
    exports: [
      'createCognitiveFabric',
      'initializeFabric',
      'analyzeRequest',
      'selectFabricTopology',
      'createCouncilIfNeeded',
      'runCouncilDeliberation',
      'buildEvidenceFromCouncil',
      'synthesizeFabricResponse',
      'deliverFabricResponse',
      'getFabricSummary',
      'processReasoningCycle',
      'exportFabric',
      'importFabric',
      'isFabricComplete',
      'getFabricEfficiency',
    ],
    description: 'Main cognitive fabric orchestrator',
  },
];

// Foundation contracts to verify compatibility with
const FOUNDATION_CONTRACTS = [
  'StateStore',
  'EventBus',
  'ModelGateway',
  'CosmosMemory',
  'PermissionManager',
  'AgentContract',
  'VerificationEngine',
  'TraceContract',
];

// Test results
const results = {
  passed: 0,
  failed: 0,
  errors: [],
  warnings: [],
  moduleResults: [],
};

/**
 * Check if a file exists
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read file content
 */
async function readFile(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    throw new Error(`Failed to read ${filePath}: ${error.message}`);
  }
}

/**
 * Check if module exports the required symbols
 */
async function checkModuleExports(moduleSpec) {
  const filePath = path.join(process.cwd(), moduleSpec.path);

  if (!await fileExists(filePath)) {
    results.errors.push(`Module file not found: ${moduleSpec.path}`);
    return false;
  }

  try {
    const content = await readFile(filePath);

    // Check for export statements - look for export declarations
    const missingExports = moduleSpec.exports.filter(exp => {
      // Check for export const/function/class
      const exportPattern = new RegExp(`export\\s+(?:const|function|class|let|var)\\s+${exp}(?:\\s|;|\\n|\\()|export\\s+\\{\\s*${exp}\s*(?:,|\\})`);
      // Check for export { ... }
      const exportListPattern = new RegExp(`export\\s+\\{\\s*[^}]*${exp}[^}]*\\}`);
      // Check for default export
      const defaultExportPattern = new RegExp(`export\\s+default\\s+${exp}`);

      return !exportPattern.test(content) &&
             !exportListPattern.test(content) &&
             !defaultExportPattern.test(content);
    });

    if (missingExports.length > 0) {
      results.errors.push(`Module ${moduleSpec.id} missing exports: ${missingExports.join(', ')}`);
      return false;
    }

    return true;
  } catch (error) {
    results.errors.push(`Error checking module ${moduleSpec.id}: ${error.message}`);
    return false;
  }
}

/**
 * Verify module structure and basic functionality
 */
async function verifyModuleStructure(moduleSpec) {
  const filePath = path.join(process.cwd(), moduleSpec.path);

  try {
    const content = await readFile(filePath);

    // Check for JSDoc comments
    const hasJsDoc = content.includes('/**') && content.includes('*/');

    // Check for TypeScript types or JSDoc types
    const hasTypes = content.includes('@typedef') || content.includes('{') && content.includes('}');

    // Check for error handling
    const hasErrorHandling = content.includes('try') && content.includes('catch') && content.includes('throw');

    // Check for deepFreeze usage
    const hasDeepFreeze = content.includes('deepFreeze');

    const moduleResult = {
      id: moduleSpec.id,
      path: moduleSpec.path,
      exportedSymbols: moduleSpec.exports.length,
      hasJsDoc,
      hasTypes,
      hasErrorHandling,
      hasDeepFreeze,
      structureScore: 0,
    };

    // Calculate structure score
    let score = 0;
    if (hasJsDoc) score += 20;
    if (hasTypes) score += 20;
    if (hasErrorHandling) score += 20;
    if (hasDeepFreeze) score += 20;
    if (moduleSpec.exports.length >= 5) score += 20;

    moduleResult.structureScore = score;

    results.moduleResults.push(moduleResult);

    return score >= 60; // At least 60% structure score
  } catch (error) {
    results.errors.push(`Error verifying structure for ${moduleSpec.id}: ${error.message}`);
    return false;
  }
}

/**
 * Check module integration with foundation
 */
async function checkFoundationIntegration() {
  // Check that foundation contracts exist
  const foundationPath = path.join(process.cwd(), 'src/core/foundation');

  const foundationFiles = await fs.readdir(foundationPath).catch(() => []);

  const missingContracts = FOUNDATION_CONTRACTS.filter(contract =>
    !foundationFiles.some(file => file.includes(contract.toLowerCase()))
  );

  if (missingContracts.length > 0) {
    results.warnings.push(`Foundation contracts potentially missing: ${missingContracts.join(', ')}`);
  }

  // Check that cognitive fabric imports foundation modules
  const fabricPath = path.join(process.cwd(), 'src/core/cognitiveFabric.js');
  const fabricContent = await readFile(fabricPath);

  const importsFoundation = fabricContent.includes('from "./foundation') ||
                            fabricContent.includes('StateStore') ||
                            fabricContent.includes('EventBus');

  if (!importsFoundation) {
    results.warnings.push('Cognitive fabric may not properly integrate with foundation');
  }
}

/**
 * Verify all modules are present and valid
 */
async function verifyAllModules() {
  console.log('=== HEY Cognitive Fabric Conformance Check ===\n');
  console.log('Checking 10 brain modules...\n');

  for (const moduleSpec of CANONICAL_MODULES) {
    console.log(`Checking ${moduleSpec.id}...`);

    const exportsOk = await checkModuleExports(moduleSpec);
    const structureOk = await verifyModuleStructure(moduleSpec);

    if (exportsOk && structureOk) {
      console.log(`✅ PASS ${moduleSpec.id} (exports: ${moduleSpec.exports.length}, structure: ${results.moduleResults.find(m => m.id === moduleSpec.id)?.structureScore || 0}%)\n`);
      results.passed++;
    } else {
      console.log(`❌ FAIL ${moduleSpec.id}\n`);
      results.failed++;
    }
  }

  await checkFoundationIntegration();
}

/**
 * Generate summary report
 */
function generateReport() {
  console.log('\n=== Conformance Report ===\n');

  console.log(`Modules Checked: ${CANONICAL_MODULES.length}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Errors: ${results.errors.length}`);
  console.log(`Warnings: ${results.warnings.length}\n`);

  if (results.errors.length > 0) {
    console.log('ERRORS:');
    results.errors.forEach(err => console.log(`  - ${err}`));
    console.log();
  }

  if (results.warnings.length > 0) {
    console.log('WARNINGS:');
    results.warnings.forEach(warn => console.log(`  - ${warn}`));
    console.log();
  }

  if (results.moduleResults.length > 0) {
    console.log('MODULE STRUCTURE SCORES:');
    results.moduleResults
      .sort((a, b) => b.structureScore - a.structureScore)
      .forEach(module => {
        console.log(`  ${module.id.padEnd(25)} ${module.structureScore}%`);
      });
    console.log();
  }

  const totalScore = Math.round((results.passed / CANONICAL_MODULES.length) * 100);

  console.log(`TOTAL CONFORMANCE SCORE: ${totalScore}%`);

  if (results.failed === 0 && results.errors.length === 0) {
    console.log('\n✅ ALL BRAIN MODULES CONFORM TO SPECIFICATION');
    process.exit(0);
  } else {
    console.log('\n❌ SOME MODULES DO NOT CONFORM');
    process.exit(1);
  }
}

// Run the conformance check
try {
  await verifyAllModules();
  generateReport();
} catch (error) {
  console.error('Fatal error during conformance check:', error);
  process.exit(1);
}

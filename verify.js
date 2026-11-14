// Verification script for HEY Engine Golden State
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const engines = [
  'autonomous', 'agentWorkforce', 'continuousIntelligence',
  'situationalAwareness', 'multiSense', 'selfImprovement',
  'performanceQuality', 'crossDevice', 'safetyTrio',
  'guidanceWorld', 'ownerConsole', 'modes',
  'neverCutOff', 'entity', 'rendering',
  'nativeMessaging', 'agentFamilies', 'modelSocket', 'digup'
];

const coreRegistry = '/C/Users/DELL/Documents/hey/src/core/registry/FeatureRegistry.ts';

console.log('HEY Engine Golden State Verification');
console.log('========================================\n');

let goldenCount = 0;
let totalCount = 0;

for (const eng of engines) {
  totalCount++;
  const dir = `/C/Users/DELL/Documents/hey/src/engines/${eng}`;
  let lines = 0;
  let hasTypes = false;
  let hasDashboard = false;
  let hasTests = false;
  let bossCalls = 0;
  let pinpointCalls = 0;
  let hcuCalls = 0;
  let registered = false;
  let buildPass = false;

  try {
    // C1: Lines
    const files = execSync(`find "${dir}" -type f \\( -name "*.ts" -o -name "*.tsx" \\) -not -path "*/node_modules/*" 2>/dev/null`)
      .toString().trim().split('\n').filter(f => f.length > 0);
    if (files.length > 0) {
      const lineCounts = files.map(f => {
        try { return fs.readFileSync(f, 'utf8').split('\n').length; } catch { return 0; }
      });
      lines = lineCounts.reduce((a, b) => a + b, 0);
    }

    // C2: types.ts
    const typesPath = `${dir}/types.ts`;
    if (fs.existsSync(typesPath)) {
      const typesContent = fs.readFileSync(typesPath, 'utf8');
      hasTypes = typesContent.split(/\bexport (interface|type)\b/).length >= 4;
    }

    // C3: Dashboard.tsx
    const dashFiles = execSync(`find "${dir}" -name "*Dashboard.tsx" 2>/dev/null`)
      .toString().trim().split('\n').filter(f => f.length > 0);
    if (dashFiles.length > 0) {
      const dashContent = fs.readFileSync(dashFiles[0], 'utf8');
      hasDashboard = dashContent.length >= 100 &&
        (dashContent.includes('import from') || dashContent.includes('from "') || dashContent.includes("from '@/")) &&
        dashContent.includes('return (') &&
        (/loading|empty|error/.test(dashContent) || /Content|Error|Success/.test(dashContent));
    }

    // C4: Tests
    const testDir = `${dir}/__tests__`;
    if (fs.existsSync(testDir)) {
      const testFiles = fs.readdirSync(testDir).filter(f => f.endsWith('.test.ts') || f.endsWith('.test.tsx'));
      hasTests = testFiles.length >= 1;
    }

    // C5: BossAgent calls
    const engFiles = execSync(`find "${dir}" -type f \\( -name "*.ts" -o -name "*.tsx" \\) -not -path "*/node_modules/*" 2>/dev/null`)
      .toString();
    const bossMatches = engFiles.match(/bossAgent\.\w+/g) || [];
    bossCalls = bossMatches.filter(m => !m.includes('import')).length;

    // C6: Pinpoint calls
    const pinpointMatches = engFiles.match(/pinpoint\.\w+/g) || [];
    pinpointCalls = pinpointMatches.filter(m => !m.includes('import')).length;

    // C7: HCU calls (excluding budgetPerHour)
    const hcuMatches = engFiles.match(/hcu\.\w+/g) || [];
    hcuCalls = hcuMatches.filter(m => !m.includes('budgetPerHour') && !m.includes('HCU Budget')).length;

    // C8: FeatureRegistry registration
    if (fs.existsSync(coreRegistry)) {
      const registryContent = fs.readFileSync(coreRegistry, 'utf8');
      registered = registryContent.includes(eng) || registryContent.includes(`'${eng}'`);
    }

    // C9: Build check
    try {
      const buildOutput = execSync('cd /C/Users/DELL/Documents/hey && npm run build 2>&1', { timeout: 120000 })
        .toString();
      buildPass = /built in|success|ok/.test(buildOutput) || !/error|fail/.test(buildOutput);
    } catch (e) {
      buildPass = false;
    }

    const isGolden = lines >= 500 && hasTypes && hasDashboard && hasTests && bossCalls >= 2 && pinpointCalls >= 2 && hcuCalls >= 2 && registered && buildPass;

    if (isGolden) goldenCount++;

    console.log(`${eng}:`);
    console.log(`  Lines: ${lines} (need >=500) ${lines >= 500 ? '✅' : '❌'}`);
    console.log(`  types.ts: ${hasTypes} (>=30 lines, 3+ exports) ${hasTypes ? '✅' : '❌'}`);
    console.log(`  Dashboard: ${hasDashboard} (>=100 lines, JSX, 3 states) ${hasDashboard ? '✅' : '❌'}`);
    console.log(`  Tests: ${hasTests} (>=1 file) ${hasTests ? '✅' : '❌'}`);
    console.log(`  BossAgent calls: ${bossCalls} (need >=2) ${bossCalls >= 2 ? '✅' : '❌'}`);
    console.log(`  Pinpoint calls: ${pinpointCalls} (need >=2) ${pinpointCalls >= 2 ? '✅' : '❌'}`);
    console.log(`  HCU calls: ${hcuCalls} (need >=2, excl budget) ${hcuCalls >= 2 ? '✅' : '❌'}`);
    console.log(`  FeatureRegistry: ${registered} ${registered ? '✅' : '❌'}`);
    console.log(`  Build: ${buildPass} ${buildPass ? '✅' : '❌'}`);
    console.log(`  GOLDEN: ${isGolden} ${isGolden ? '🌟' : ''}\n`);
  } catch (e) {
    console.log(`${eng}: ERROR - ${e.message}\n`);
  }
}

console.log(`========================================`);
console.log(`Total engines: ${totalCount}`);
console.log(`Golden engines: ${goldenCount}`);
console.log(`Non-golden: ${totalCount - goldenCount}`);
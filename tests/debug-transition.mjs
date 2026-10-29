import { createVault } from '../src/core/capabilityVault.js';
import { transition } from '../src/core/evolutionEngine.js';

const vault = createVault();
const proposed = vault.addRecord({
  id: "cap.test.proposed",
  title: "Proposed Record",
  category: "test",
  problem: "test",
  intendedOutcome: "test",
  dedupeKey: "cap.test.proposed",
  evidence: [{ url: "https://example.com", retrievedAt: new Date().toISOString(), kind: "primary" }],
  risk: "R0",
  changePlan: { components: [], newApis: [], changedApis: [], schemaChanges: [], permissionChanges: [], migrations: [], rollbackSteps: ["revert"] },
  killCriteria: { metric: "test", baseline: 0, threshold: 1, windowDays: 30, owner: "Sako" },
  cost: { perUseCents: 0, worstCaseCents: 0 },
});
console.log('addRecord:', proposed.ok);

let record = vault.getRecord("cap.test.proposed");
console.log('Initial record state:', record.state);

const validated = vault.advance("cap.test.proposed", "Validated", { actor: "Sako", evidence: { primarySource: "test", freshnessDate: new Date().toISOString(), dedupeKey: "cap.test.proposed" }, now: Date.now() });
console.log('Validated:', validated.ok, validated.reason);

record = vault.getRecord("cap.test.proposed");
console.log('After Validated state:', record.state);

const reviewed = vault.advance("cap.test.proposed", "Reviewed", { actor: "Sako", evidence: { flawHunterFindings: [{ finding: "test", severity: "low" }], solutionTwinRecommendation: { recommendation: "test" } }, now: Date.now() });
console.log('Reviewed:', reviewed.ok, reviewed.reason);

record = vault.getRecord("cap.test.proposed");
console.log('After Reviewed state:', record.state);
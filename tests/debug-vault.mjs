import { createVault } from '../src/core/capabilityVault.js';

const vault = createVault();
const added = vault.addRecord({
  id: 'cap.test.evidence',
  title: 'Evidence Test',
  category: 'test',
  problem: 'test',
  intendedOutcome: 'test',
  dedupeKey: 'cap.test.evidence',
  evidence: [{ url: 'https://example.com', retrievedAt: new Date().toISOString(), kind: 'primary' }],
  risk: 'R0',
  changePlan: { components: [], newApis: [], changedApis: [], schemaChanges: [], permissionChanges: [], migrations: [], rollbackSteps: ['revert'] },
  killCriteria: { metric: 'test', baseline: 0, threshold: 1, windowDays: 30, owner: 'Sako' },
  cost: { perUseCents: 0, worstCaseCents: 0 },
});
console.log('addRecord:', added);

const decided = vault.decide('cap.test.evidence', { decision: 'keep', ownerId: 'Sako', note: 'approved' });
console.log('decide:', decided);
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fork } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { ActionVerificationEngine } from '../src/core/actionVerificationEngine.js';

test('PRIM-005 Acceptance Test 1: All checks pass -> verified', () => {
  const auditEvents = [];
  const engine = new ActionVerificationEngine({
    auditLogger: (e) => auditEvents.push(e),
  });

  const testFile = path.resolve('tmp', 'test-verify-file.txt');
  fs.mkdirSync(path.dirname(testFile), { recursive: true });
  fs.writeFileSync(testFile, 'sample content', 'utf-8');

  const verdict = engine.verify({
    action_id: 'act-101',
    expected: {
      status: 200,
      text: 'sample',
      count: 5,
      filePath: testFile,
    },
    actual: {
      status: 200,
      text: 'sample content for check',
      count: 5,
      filePath: testFile,
    },
    criteria: [
      { type: 'equals', key: 'status' },
      { type: 'contains', key: 'text' },
      { type: 'db_row_count', key: 'count' },
      { type: 'file_exists', key: 'filePath' },
    ],
  });

  assert.equal(verdict.status, 'verified');
  assert.equal(verdict.evidence.passedCount, 4);
  assert.equal(verdict.evidence.failedCount, 0);
  assert.equal(auditEvents.length, 1);
  assert.equal(auditEvents[0].event_type, 'verification:completed');
});

test('PRIM-005 Acceptance Test 2: One check fails (all fail) -> failed', () => {
  const engine = new ActionVerificationEngine();
  const verdict = engine.verify({
    action_id: 'act-102',
    expected: { code: 'SUCCESS' },
    actual: { code: 'FAIL' },
    criteria: [{ type: 'equals', key: 'code' }],
  });

  assert.equal(verdict.status, 'failed');
  assert.equal(verdict.evidence.passedCount, 0);
  assert.equal(verdict.evidence.failedCount, 1);
});

test('PRIM-005 Acceptance Test 3: Some pass, some fail -> partial', () => {
  const engine = new ActionVerificationEngine();
  const verdict = engine.verify({
    action_id: 'act-103',
    expected: { a: 1, b: 2 },
    actual: { a: 1, b: 999 },
    criteria: [
      { type: 'equals', key: 'a' },
      { type: 'equals', key: 'b' },
    ],
  });

  assert.equal(verdict.status, 'partial');
  assert.equal(verdict.evidence.passedCount, 1);
  assert.equal(verdict.evidence.failedCount, 1);
});

test('PRIM-005 Acceptance Test 4: Missing evidence -> effect_unknown', () => {
  const engine = new ActionVerificationEngine();
  const verdict = engine.verify({
    action_id: 'act-104',
    expected: { result: 'ok' },
    actual: null, // missing actual evidence
    criteria: [{ type: 'equals' }],
  });

  assert.equal(verdict.status, 'effect_unknown');
});

test('PRIM-005 Acceptance Test 5: Verification runs in a separate process from the builder', async () => {
  // Spawn child node process to run verification
  const childScript = path.resolve('tmp', 'verify-subprocess.mjs');
  const engineUrl = pathToFileURL(path.resolve('src/core/actionVerificationEngine.js')).href;
  fs.writeFileSync(
    childScript,
    `
    import { verify } from '${engineUrl}';
    const verdict = verify({
      action_id: 'act-subproc',
      expected: 42,
      actual: 42,
      criteria: [{ type: 'equals' }]
    });
    process.send({ verdict });
  `,
    'utf-8'
  );

  const verdict = await new Promise((resolve, reject) => {
    const child = fork(childScript);
    child.on('message', (msg) => {
      resolve(msg.verdict);
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code !== 0) reject(new Error('Child process exited with code ' + code));
    });
  });

  assert.equal(verdict.status, 'verified');
  assert.equal(verdict.action_id, 'act-subproc');
});

test('PRIM-005 Acceptance Test 6: Verdict is immutable once written', () => {
  const engine = new ActionVerificationEngine();
  const verdict = engine.verify({
    action_id: 'act-106',
    expected: 'data',
    actual: 'data',
    criteria: [{ type: 'equals' }],
  });

  assert.throws(() => {
    verdict.status = 'tampered';
  }, /Cannot assign to read only property/);

  assert.throws(() => {
    verdict.evidence.tampered = true;
  }, /Cannot add property/);
});

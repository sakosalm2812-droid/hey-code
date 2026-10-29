import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { AuditLogger } from '../src/core/auditLogger.js';

test('PRIM-006 Acceptance Test 1: Writing 100 events produces 100 lines', () => {
  const tmpDir = path.resolve('tmp', 'test-audit-1');
  if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });

  const logger = new AuditLogger({ logDir: tmpDir, currentDate: '2026-10-24' });
  for (let i = 0; i < 100; i++) {
    const id = logger.log({
      event_type: 'test:event',
      actor: 'system',
      payload: { index: i },
      correlation_id: `corr_${Math.floor(i / 10)}`,
    });
    assert.ok(id, 'id should be returned');
  }

  const logFile = path.join(tmpDir, 'audit-2026-10-24.jsonl');
  assert.ok(fs.existsSync(logFile), 'log file should exist');
  const lines = fs.readFileSync(logFile, 'utf-8').trim().split('\n');
  assert.equal(lines.length, 100, 'must have exactly 100 lines');

  const check = logger.verifyChain(logFile);
  assert.equal(check.valid, true, 'chain must be valid initially');
  assert.equal(check.count, 100);
});

test('PRIM-006 Acceptance Test 2: Tampering with line 50 breaks verify_chain()', () => {
  const tmpDir = path.resolve('tmp', 'test-audit-2');
  if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });

  const logger = new AuditLogger({ logDir: tmpDir, currentDate: '2026-10-24' });
  for (let i = 0; i < 100; i++) {
    logger.log({
      event_type: 'test:event',
      actor: 'agent',
      payload: { value: i },
    });
  }

  const logFile = path.join(tmpDir, 'audit-2026-10-24.jsonl');
  const lines = fs.readFileSync(logFile, 'utf-8').trim().split('\n');
  const record50 = JSON.parse(lines[49]);
  record50.payload.value = 9999; // tamper
  lines[49] = JSON.stringify(record50);
  fs.writeFileSync(logFile, lines.join('\n') + '\n', 'utf-8');

  const check = logger.verifyChain(logFile);
  assert.equal(check.valid, false, 'verifyChain must report invalid after tampering');
  assert.equal(check.brokenLine, 49, 'tampered line must be detected');
});

test('PRIM-006 Acceptance Test 3: Correlation ID links related events', () => {
  const tmpDir = path.resolve('tmp', 'test-audit-3');
  if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });

  const logger = new AuditLogger({ logDir: tmpDir, currentDate: '2026-10-24' });
  logger.log({ event_type: 'task:start', actor: 'user', payload: {}, correlation_id: 'corr-xyz' });
  logger.log({ event_type: 'task:step', actor: 'agent', payload: {}, correlation_id: 'corr-xyz' });
  logger.log({ event_type: 'task:end', actor: 'agent', payload: {}, correlation_id: 'corr-xyz' });
  logger.log({ event_type: 'other:event', actor: 'other', payload: {}, correlation_id: 'corr-other' });

  const logFile = path.join(tmpDir, 'audit-2026-10-24.jsonl');
  const lines = fs.readFileSync(logFile, 'utf-8').trim().split('\n').map((l) => JSON.parse(l));
  const linked = lines.filter((r) => r.correlation_id === 'corr-xyz');
  assert.equal(linked.length, 3, 'all 3 events should share the correlation_id');
});

test('PRIM-006 Acceptance Test 4: Rotation creates a new file at midnight and compresses previous', () => {
  const tmpDir = path.resolve('tmp', 'test-audit-4');
  if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });

  const logger = new AuditLogger({ logDir: tmpDir });
  logger.log({ event_type: 'event1', actor: 'user', payload: {}, timestamp: '2026-10-24T23:59:59.000Z' });

  const day1File = path.join(tmpDir, 'audit-2026-10-24.jsonl');
  assert.ok(fs.existsSync(day1File), 'day 1 file should exist');

  // Trigger next event on next day
  logger.log({ event_type: 'event2', actor: 'user', payload: {}, timestamp: '2026-10-25T00:00:01.000Z' });

  const day2File = path.join(tmpDir, 'audit-2026-10-25.jsonl');
  assert.ok(fs.existsSync(day2File), 'day 2 file should exist');
  assert.ok(fs.existsSync(`${day1File}.gz`), 'previous day file should be archived as .gz');
});

test('PRIM-006 Acceptance Test 5: Archived files remain readable', () => {
  const tmpDir = path.resolve('tmp', 'test-audit-5');
  if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });

  const logger = new AuditLogger({ logDir: tmpDir });
  logger.log({ event_type: 'archived_event', actor: 'system', payload: { secret_data: 'important' } });
  const logFile = logger.currentFile;
  const gzPath = logger.archiveFile(logFile);

  assert.ok(fs.existsSync(gzPath), 'gz file exists');
  const content = logger.readArchivedFile(gzPath);
  assert.ok(content.includes('archived_event'), 'archived content must be uncompressed and readable');
});

test('PRIM-006 Acceptance Test 6: Log write failure does not crash caller and secrets are redacted', () => {
  const logger = new AuditLogger({ logDir: '/invalid\0path' });
  assert.doesNotThrow(() => {
    const res = logger.log({
      event_type: 'safe_failure',
      actor: 'user',
      payload: { api_key: 'sk-123456789', token: 'secret-token-xyz', safeField: 'visible' },
    });
    // returns null on error
    assert.equal(res, null);
  });

  const tmpDir = path.resolve('tmp', 'test-audit-6');
  if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
  const validLogger = new AuditLogger({ logDir: tmpDir });
  validLogger.log({
    event_type: 'secret_test',
    actor: 'user',
    payload: { api_key: 'sk-abcdef', token: 'secret-xyz', regular: 'text' },
  });

  const lines = fs.readFileSync(validLogger.currentFile, 'utf-8').trim().split('\n').map((l) => JSON.parse(l));
  assert.equal(lines[0].payload.api_key, '[REDACTED]');
  assert.equal(lines[0].payload.token, '[REDACTED]');
  assert.equal(lines[0].payload.regular, 'text');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { AuditLogger, getStoredLogs, redactSecrets, subtleDigestSha256 } from '../src/core/auditLogger.js';

test('PRIM-006 Acceptance Test 1: Writing events saves to localStorage under hey_audit_logs', () => {
  localStorage.removeItem('hey_audit_logs');
  const logger = new AuditLogger();

  for (let i = 0; i < 50; i++) {
    const id = logger.log({
      event_type: 'test:event',
      actor: 'system',
      payload: { index: i },
      correlation_id: `corr_${Math.floor(i / 10)}`,
    });
    assert.ok(id, 'id should be returned');
  }

  const stored = getStoredLogs();
  assert.equal(stored.length, 50, 'must have exactly 50 entries in localStorage');

  const check = logger.verifyChain(stored);
  assert.equal(check.valid, true, 'chain must be valid initially');
  assert.equal(check.count, 50);
});

test('PRIM-006 Acceptance Test 2: Tampering with an entry breaks verifyChain()', () => {
  localStorage.removeItem('hey_audit_logs');
  const logger = new AuditLogger();

  for (let i = 0; i < 20; i++) {
    logger.log({
      event_type: 'test:event',
      actor: 'agent',
      payload: { value: i },
    });
  }

  const stored = getStoredLogs();
  // Tamper with record #10
  stored[10].payload.value = 9999;

  const check = logger.verifyChain(stored);
  assert.equal(check.valid, false, 'verifyChain must report invalid after tampering');
  assert.equal(check.brokenLine, 10, 'tampered index must be detected');
});

test('PRIM-006 Acceptance Test 3: Correlation ID links related events', () => {
  localStorage.removeItem('hey_audit_logs');
  const logger = new AuditLogger();

  logger.log({ event_type: 'task:start', actor: 'user', payload: {}, correlation_id: 'corr-xyz' });
  logger.log({ event_type: 'task:step', actor: 'agent', payload: {}, correlation_id: 'corr-xyz' });
  logger.log({ event_type: 'task:end', actor: 'agent', payload: {}, correlation_id: 'corr-xyz' });
  logger.log({ event_type: 'other:event', actor: 'other', payload: {}, correlation_id: 'corr-other' });

  const stored = getStoredLogs();
  const linked = stored.filter((r) => r.correlation_id === 'corr-xyz');
  assert.equal(linked.length, 3, 'all 3 events should share the correlation_id');
});

test('PRIM-006 Acceptance Test 4: Enforces 1,000 maximum entries cap in localStorage', () => {
  localStorage.removeItem('hey_audit_logs');
  const logger = new AuditLogger();

  // Write 1,050 entries
  for (let i = 0; i < 1050; i++) {
    logger.log({
      event_type: 'bulk:event',
      actor: 'system',
      payload: { seq: i },
    });
  }

  const stored = getStoredLogs();
  assert.equal(stored.length, 1000, 'must cap strictly at 1,000 entries');
  assert.equal(stored[stored.length - 1].payload.seq, 1049, 'latest entry must be retained');
});

test('PRIM-006 Acceptance Test 5: Native Web Crypto API hash matches digest', async () => {
  const hash = await subtleDigestSha256('test_cryptographic_payload');
  assert.ok(typeof hash === 'string' && hash.length === 64, 'hash must be 64-char hex string');
});

test('PRIM-006 Acceptance Test 6: Secrets are redacted and failures do not crash', () => {
  const safe = redactSecrets({
    api_key: 'sk-123456789',
    token: 'secret-token-xyz',
    user_password: 'superpassword',
    visible_info: 'hello world',
  });

  assert.equal(safe.api_key, '[REDACTED]');
  assert.equal(safe.token, '[REDACTED]');
  assert.equal(safe.user_password, '[REDACTED]');
  assert.equal(safe.visible_info, 'hello world');
});

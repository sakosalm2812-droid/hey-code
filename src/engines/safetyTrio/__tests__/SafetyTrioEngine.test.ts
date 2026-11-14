// src/engines/safetyTrio/__tests__/SafetyTrioEngine.test.ts
// Tests for Safety Trio Engine

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SafetyTrioEngine, createSafetyTrioEngine } from '../SafetyTrioEngine';
import type { SafetyConfig, AuditEvent, PrivacyEvent, TrustEvent, SecurityAlert, TrustLevel } from '../types';
import { logToCosmos } from '../../../core/cosmosMemory';

vi.mock('../../../core/cosmosMemory', () => ({
  logToCosmos: vi.fn().mockResolvedValue(undefined),
}));

describe('SafetyTrioEngine', () => {
  let engine: SafetyTrioEngine;

  const testConfig: Partial<SafetyConfig> = {
    privacy: {
      dataRetentionDays: 1,
      telemetryEnabled: false,
      analyticsEnabled: false,
      crashReportingEnabled: false,
      localProcessingOnly: true,
      encryptionAtRest: true,
    },
    security: {
      sessionTimeoutMs: 3600000,
      maxFailedAuthAttempts: 3,
      lockoutDurationMs: 1000,
      requireMfa: false,
      auditLogRetentionDays: 1,
      encryptSensitiveFields: true,
    },
    trust: {
      defaultTrustLevel: 'neutral',
      trustedDomains: ['test.local'],
      blockedDomains: ['blocked.com'],
      autoTrustOwners: true,
      requireVerificationFor: ['computer_control', 'filesystem_write'],
    },
    hcuBudgetPerHour: 10.0,
  };

  beforeEach(async () => {
    engine = createSafetyTrioEngine(testConfig);
    await engine.initialize();
  });

  afterEach(async () => {
    await engine.shutdown();
  });

  describe('Initialization', () => {
    it('initializes with default config', async () => {
      const defaultEngine = createSafetyTrioEngine();
      await defaultEngine.initialize();
      const health = defaultEngine.getHealth();
      expect(health.isRunning).toBe(true);
      expect(health.hcuBudgetPerHour).toBe(0.5);
      expect(health.trustEntitiesTracked).toBeGreaterThan(0); // default trusted domains
      await defaultEngine.shutdown();
    });

    it('initializes with custom config', () => {
      const health = engine.getHealth();
      expect(health.isRunning).toBe(true);
      expect(health.hcuBudgetPerHour).toBe(10.0);
    });

    it('pre-populates trust levels for trusted/blocked domains', () => {
      expect(engine.isTrusted('test.local', 'domain')).toBe(true);
      expect(engine.isBlocked('blocked.com', 'domain')).toBe(true);
    });
  });

  describe('Audit Logging', () => {
    it('logs audit event', () => {
      const event = engine.logAuditEvent({
        type: 'access',
        actor: 'user1',
        resource: 'file.txt',
        action: 'read',
        result: 'success',
        riskLevel: 'low',
      });

      expect(event.id).toMatch(/^audit_/);
      expect(event.actor).toBe('user1');
      expect(event.type).toBe('access');
    });

    it('retrieves audit log', () => {
      engine.logAuditEvent({ type: 'access', actor: 'user1', resource: 'a', action: 'read', result: 'success', riskLevel: 'low' });
      engine.logAuditEvent({ type: 'modification', actor: 'user2', resource: 'b', action: 'write', result: 'success', riskLevel: 'medium' });

      const log = engine.getAuditLog(10);
      expect(log.length).toBe(2);
    });

    it('filters audit log by actor', () => {
      engine.logAuditEvent({ type: 'access', actor: 'user1', resource: 'a', action: 'read', result: 'success', riskLevel: 'low' });
      engine.logAuditEvent({ type: 'access', actor: 'user2', resource: 'b', action: 'read', result: 'success', riskLevel: 'low' });

      const user1Log = engine.getAuditLogByActor('user1', 10);
      expect(user1Log.length).toBe(1);
      expect(user1Log[0].actor).toBe('user1');
    });

    it('filters audit log by type', () => {
      engine.logAuditEvent({ type: 'access', actor: 'user1', resource: 'a', action: 'read', result: 'success', riskLevel: 'low' });
      engine.logAuditEvent({ type: 'deletion', actor: 'user1', resource: 'b', action: 'delete', result: 'success', riskLevel: 'high' });

      const accessLog = engine.getAuditLogByType('access', 10);
      expect(accessLog.length).toBe(1);
      expect(accessLog[0].type).toBe('access');
    });
  });

  describe('Security Alerts & Failed Auth', () => {
    it('tracks failed auth attempts', () => {
      engine.logAuditEvent({ type: 'auth', actor: 'attacker', resource: 'login', action: 'login', result: 'failure', riskLevel: 'medium' });
      engine.logAuditEvent({ type: 'auth', actor: 'attacker', resource: 'login', action: 'login', result: 'failure', riskLevel: 'medium' });

      expect(engine.getFailedAuthAttempts('attacker')).toBe(2);
    });

    it('locks out after max failed attempts', () => {
      engine.logAuditEvent({ type: 'auth', actor: 'attacker', resource: 'login', action: 'login', result: 'failure', riskLevel: 'medium' });
      engine.logAuditEvent({ type: 'auth', actor: 'attacker', resource: 'login', action: 'login', result: 'failure', riskLevel: 'medium' });
      engine.logAuditEvent({ type: 'auth', actor: 'attacker', resource: 'login', action: 'login', result: 'failure', riskLevel: 'medium' });

      expect(engine.isLockedOut('attacker')).toBe(true);

      const alerts = engine.getActiveAlerts();
      expect(alerts.some(a => a.type === 'failed_auth')).toBe(true);
    });

    it('resets failed attempts on successful auth', () => {
      engine.logAuditEvent({ type: 'auth', actor: 'user', resource: 'login', action: 'login', result: 'failure', riskLevel: 'medium' });
      engine.logAuditEvent({ type: 'auth', actor: 'user', resource: 'login', action: 'login', result: 'success', riskLevel: 'low' });

      expect(engine.getFailedAuthAttempts('user')).toBe(0);
      expect(engine.isLockedOut('user')).toBe(false);
    });

    it('detects privilege escalation', () => {
      engine.logAuditEvent({
        type: 'permission_change',
        actor: 'user1',
        resource: 'admin_panel',
        action: 'grant',
        result: 'success',
        riskLevel: 'critical',
        details: { escalated: true },
      });

      const alerts = engine.getActiveAlerts();
      expect(alerts.some(a => a.type === 'privilege_escalation')).toBe(true);
    });

    it('detects large data export', () => {
      engine.logAuditEvent({
        type: 'export',
        actor: 'user1',
        resource: 'database',
        action: 'export',
        result: 'success',
        riskLevel: 'high',
        details: { size: 20000000 }, // 20MB
      });

      const alerts = engine.getActiveAlerts();
      expect(alerts.some(a => a.type === 'data_exfiltration')).toBe(true);
    });

    it('detects critical config tampering', () => {
      engine.logAuditEvent({
        type: 'config_change',
        actor: 'user1',
        resource: 'security_config',
        action: 'update',
        result: 'success',
        riskLevel: 'critical',
        details: { critical: true },
      });

      const alerts = engine.getActiveAlerts();
      expect(alerts.some(a => a.type === 'config_tampering')).toBe(true);
    });

    it('acknowledges alerts', () => {
      engine.logAuditEvent({ type: 'auth', actor: 'attacker', resource: 'login', action: 'login', result: 'failure', riskLevel: 'medium' });
      engine.logAuditEvent({ type: 'auth', actor: 'attacker', resource: 'login', action: 'login', result: 'failure', riskLevel: 'medium' });
      engine.logAuditEvent({ type: 'auth', actor: 'attacker', resource: 'login', action: 'login', result: 'failure', riskLevel: 'medium' });

      const alerts = engine.getActiveAlerts();
      expect(alerts.length).toBeGreaterThan(0);

      const alertId = alerts[0].id;
      const result = engine.acknowledgeAlert(alertId);
      expect(result).toBe(true);

      const activeAfter = engine.getActiveAlerts();
      expect(activeAfter.find(a => a.id === alertId)).toBeUndefined();
    });
  });

  describe('Privacy', () => {
    it('logs privacy event', () => {
      const event = engine.logPrivacyEvent({
        type: 'data_accessed',
        dataType: 'personal',
        subjectId: 'user1',
        actorId: 'agent1',
        lawfulBasis: 'consent',
      });

      expect(event.id).toMatch(/^privacy_/);
      expect(event.subjectId).toBe('user1');
    });

    it('retrieves privacy events', () => {
      engine.logPrivacyEvent({ type: 'data_accessed', dataType: 'a', subjectId: 'user1', actorId: 'agent1' });
      engine.logPrivacyEvent({ type: 'data_exported', dataType: 'b', subjectId: 'user1', actorId: 'agent1' });

      const events = engine.getPrivacyEvents(10);
      expect(events.length).toBe(2);
    });

    it('filters privacy events by subject', () => {
      engine.logPrivacyEvent({ type: 'data_accessed', dataType: 'a', subjectId: 'user1', actorId: 'agent1' });
      engine.logPrivacyEvent({ type: 'data_accessed', dataType: 'b', subjectId: 'user2', actorId: 'agent1' });

      const user1Events = engine.getPrivacyEventsBySubject('user1', 10);
      expect(user1Events.length).toBe(1);
      expect(user1Events[0].subjectId).toBe('user1');
    });

    it('exports user data', () => {
      engine.logAuditEvent({ type: 'access', actor: 'user1', resource: 'a', action: 'read', result: 'success', riskLevel: 'low' });
      engine.logPrivacyEvent({ type: 'data_accessed', dataType: 'personal', subjectId: 'user1', actorId: 'agent1' });

      const exportData = engine.exportUserData('user1');
      expect(exportData.audit.length).toBeGreaterThan(0);
      expect(exportData.privacy.length).toBeGreaterThan(0);
    });

    it('deletes user data', () => {
      engine.logAuditEvent({ type: 'access', actor: 'user1', resource: 'a', action: 'read', result: 'success', riskLevel: 'low' });
      engine.logPrivacyEvent({ type: 'data_accessed', dataType: 'personal', subjectId: 'user1', actorId: 'agent1' });

      const deletedCount = engine.deleteUserData('user1');
      expect(deletedCount).toBe(1);

      const auditAfter = engine.getAuditLogByActor('user1', 10);
      expect(auditAfter.length).toBe(0);
    });

    it('applies retention policy', async () => {
      // Create an event with old timestamp by manipulating internal state
      const oldEvent: any = {
        id: 'audit_old',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        type: 'access',
        actor: 'user1',
        resource: 'old',
        action: 'read',
        result: 'success',
        riskLevel: 'low',
      };
      (engine as any).auditLog.unshift(oldEvent);

      const removed = engine.applyRetention();
      expect(removed).toBeGreaterThan(0);
    });
  });

  describe('Trust Management', () => {
    it('sets and gets trust level', () => {
      const result = engine.setTrustLevel('agent1', 'agent', 'trusted', 'admin', 'Verified agent');
      expect(result).toBe(true);

      const level = engine.getTrustLevel('agent1', 'agent');
      expect(level).toBe('trusted');
    });

    it('returns default trust level for unknown entity', () => {
      const level = engine.getTrustLevel('unknown', 'agent');
      expect(level).toBe('neutral'); // default from test config
    });

    it('detects trusted entities', () => {
      engine.setTrustLevel('agent1', 'agent', 'trusted', 'admin', 'test');
      expect(engine.isTrusted('agent1', 'agent')).toBe(true);
      expect(engine.isBlocked('agent1', 'agent')).toBe(false);
    });

    it('detects blocked entities', () => {
      engine.setTrustLevel('agent2', 'agent', 'blocked', 'admin', 'malicious');
      expect(engine.isBlocked('agent2', 'agent')).toBe(true);
      expect(engine.isTrusted('agent2', 'agent')).toBe(false);
    });

    it('does not change if level is same', () => {
      engine.setTrustLevel('agent1', 'agent', 'trusted', 'admin', 'test');
      const result = engine.setTrustLevel('agent1', 'agent', 'trusted', 'admin', 'test again');
      expect(result).toBe(false);
    });

    it('tracks trust events', () => {
      engine.setTrustLevel('agent1', 'agent', 'trusted', 'admin', 'test');
      engine.setTrustLevel('agent2', 'agent', 'blocked', 'admin', 'test');

      const events = engine.getTrustEvents(10);
      expect(events.length).toBe(2);
      expect(events[0].entityId).toBe('agent2');
      expect(events[0].newLevel).toBe('blocked');
    });

    it('checks verification requirements', () => {
      expect(engine.requiresVerification('computer_control')).toBe(true);
      expect(engine.requiresVerification('filesystem_write')).toBe(true);
      expect(engine.requiresVerification('safe_capability')).toBe(false);
    });

    it('gets all trust levels', () => {
      engine.setTrustLevel('agent1', 'agent', 'trusted', 'admin', 'test');
      engine.setTrustLevel('domain1', 'domain', 'blocked', 'admin', 'test');

      const all = engine.getAllTrustLevels();
      expect(all.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Config', () => {
    it('returns config', () => {
      const config = engine.getConfig();
      expect(config.privacy.dataRetentionDays).toBe(1);
      expect(config.security.maxFailedAuthAttempts).toBe(3);
      expect(config.trust.defaultTrustLevel).toBe('neutral');
    });

    it('updates config and emits event', () => {
      let configChanged = false;
      engine.onEvent('config_changed', () => { configChanged = true; });

      engine.updateConfig({ privacy: { ...engine.getConfig().privacy, telemetryEnabled: true } });

      expect(configChanged).toBe(true);
      expect(engine.getConfig().privacy.telemetryEnabled).toBe(true);
    });
  });

  describe('Health & Cleanup', () => {
    it('reports health metrics', () => {
      const health = engine.getHealth();
      expect(health.isRunning).toBe(true);
      expect(health.auditLogSize).toBeGreaterThanOrEqual(0);
      expect(health.trustEntitiesTracked).toBeGreaterThan(0);
      expect(health.totalHCUSpent).toBeGreaterThanOrEqual(0);
    });

    it('cleans up expired lockouts', async () => {
      // Trigger lockout
      engine.logAuditEvent({ type: 'auth', actor: 'attacker', resource: 'login', action: 'login', result: 'failure', riskLevel: 'medium' });
      engine.logAuditEvent({ type: 'auth', actor: 'attacker', resource: 'login', action: 'login', result: 'failure', riskLevel: 'medium' });
      engine.logAuditEvent({ type: 'auth', actor: 'attacker', resource: 'login', action: 'login', result: 'failure', riskLevel: 'medium' });

      expect(engine.isLockedOut('attacker')).toBe(true);

      // Wait for lockout to expire (1 second in test config)
      await new Promise(r => setTimeout(r, 1100));

      // Trigger cleanup manually
      (engine as any).cleanup();

      expect(engine.isLockedOut('attacker')).toBe(false);
    });
  });

  describe('Event System', () => {
    it('emits audit_logged event', () => {
      let eventReceived = false;
      engine.onEvent('audit_logged', () => { eventReceived = true; });

      engine.logAuditEvent({ type: 'access', actor: 'user1', resource: 'a', action: 'read', result: 'success', riskLevel: 'low' });

      expect(eventReceived).toBe(true);
    });

    it('emits privacy_event', () => {
      let eventReceived = false;
      engine.onEvent('privacy_event', () => { eventReceived = true; });

      engine.logPrivacyEvent({ type: 'data_accessed', dataType: 'test', subjectId: 'user1', actorId: 'agent1' });

      expect(eventReceived).toBe(true);
    });

    it('emits trust_changed event', () => {
      let eventReceived = false;
      engine.onEvent('trust_changed', () => { eventReceived = true; });

      engine.setTrustLevel('agent1', 'agent', 'trusted', 'admin', 'test');

      expect(eventReceived).toBe(true);
    });

    it('emits security_alert event', () => {
      let eventReceived = false;
      engine.onEvent('security_alert', () => { eventReceived = true; });

      engine.logAuditEvent({ type: 'auth', actor: 'attacker', resource: 'login', action: 'login', result: 'failure', riskLevel: 'medium' });
      engine.logAuditEvent({ type: 'auth', actor: 'attacker', resource: 'login', action: 'login', result: 'failure', riskLevel: 'medium' });
      engine.logAuditEvent({ type: 'auth', actor: 'attacker', resource: 'login', action: 'login', result: 'failure', riskLevel: 'medium' });

      expect(eventReceived).toBe(true);
    });

    it('emits config_changed event', () => {
      let eventReceived = false;
      engine.onEvent('config_changed', () => { eventReceived = true; });

      engine.updateConfig({ privacy: { ...engine.getConfig().privacy, telemetryEnabled: true } });

      expect(eventReceived).toBe(true);
    });
  });
});
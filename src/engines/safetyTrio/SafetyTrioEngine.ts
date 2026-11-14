// src/engines/safetyTrio/SafetyTrioEngine.ts
// Engine 11: Safety Trio — Privacy, Security, Trust

import type {
  SafetyConfig,
  AuditEvent,
  PrivacyEvent,
  TrustEvent,
  SafetyEvent,
  SecurityAlert,
  PrivacyConfig,
  SecurityConfig,
  TrustConfig,
  PrivacyLevel,
  SecurityLevel,
  TrustLevel,
  SafetyHealth,
} from './types';
import * as hcu from '../../core/cost/costGovernor';
import { pinpoint } from '../../core/precision/pinpointPrecision';
import * as bossAgent from '../../core/engines/bossAgent';
import { logToCosmos } from '../../core/cosmosMemory';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_CONFIG: SafetyConfig = {
  privacy: {
    dataRetentionDays: 365,
    telemetryEnabled: false,
    analyticsEnabled: false,
    crashReportingEnabled: false,
    localProcessingOnly: true,
    encryptionAtRest: true,
  },
  security: {
    sessionTimeoutMs: 3600000, // 1 hour
    maxFailedAuthAttempts: 5,
    lockoutDurationMs: 900000, // 15 minutes
    requireMfa: false,
    auditLogRetentionDays: 90,
    encryptSensitiveFields: true,
  },
  trust: {
    defaultTrustLevel: 'neutral',
    trustedDomains: ['hey.local', 'localhost'],
    blockedDomains: [],
    autoTrustOwners: true,
    requireVerificationFor: ['computer_control', 'filesystem_write', 'external_communication'],
  },
  hcuBudgetPerHour: 0.5,
};

export class SafetyTrioEngine {
  private config: SafetyConfig;
  private auditLog: AuditEvent[] = [];
  private privacyEvents: PrivacyEvent[] = [];
  private trustEvents: TrustEvent[] = [];
  private securityAlerts: SecurityAlert[] = [];
  private trustLevels: Map<string, { entityType: string; level: TrustLevel }> = new Map();
  private eventListeners: Map<string, Set<(event: SafetyEvent) => void>> = new Map();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private totalHCUSpent = 0;
  private isRunning = false;
  private failedAuthAttempts: Map<string, number> = new Map();
  private lockouts: Map<string, number> = new Map(); // entityId -> unlock timestamp

  constructor(config: Partial<SafetyConfig> = {}) {
    this.config = this.mergeConfig(DEFAULT_CONFIG, config);
  }

  private mergeConfig(defaults: SafetyConfig, overrides: Partial<SafetyConfig>): SafetyConfig {
    return {
      privacy: { ...defaults.privacy, ...overrides.privacy },
      security: { ...defaults.security, ...overrides.security },
      trust: { ...defaults.trust, ...overrides.trust },
      hcuBudgetPerHour: overrides.hcuBudgetPerHour ?? defaults.hcuBudgetPerHour,
    };
  }

  async initialize(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    hcu.track('safetyTrio_init', 0.01);
    pinpoint.verify('safetyTrio');
    bossAgent.grade({ operation: 'init', engine: 'safetyTrio' }, { engine: 'safetyTrio' });

    // Initialize trust levels for default trusted domains
    for (const domain of this.config.trust.trustedDomains) {
      this.trustLevels.set(`domain:${domain}`, { entityType: 'domain', level: 'trusted' });
    }
    for (const domain of this.config.trust.blockedDomains) {
      this.trustLevels.set(`domain:${domain}`, { entityType: 'domain', level: 'blocked' });
    }

    // Start cleanup timer
    this.cleanupTimer = setInterval(() => this.cleanup(), 3600000); // Hourly

    await this.log('safety_trio_initialized', { config: this.config });
  }

  async shutdown(): Promise<void> {
    if (!this.isRunning) return;
    this.isRunning = false;

    hcu.track('safetyTrio_shutdown', 0.01);
    pinpoint.verify('safetyTrio');
    bossAgent.grade({ operation: 'shutdown', engine: 'safetyTrio' }, { engine: 'safetyTrio' });

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    await this.log('safety_trio_shutdown', { totalHCUSpent: this.totalHCUSpent });
  }

  // ============================================
  // Audit Logging
  // ============================================

  logAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent {
    hcu.track('safetyTrio_logAudit', 0.001);
    pinpoint.verify('safetyTrio');
    bossAgent.grade({ operation: 'logAudit', engine: 'safetyTrio' }, { engine: 'safetyTrio' });

    const auditEvent: AuditEvent = {
      ...event,
      id: `audit_${uuidv4().slice(0, 8)}`,
      timestamp: new Date().toISOString(),
    };

    this.auditLog.unshift(auditEvent);
    if (this.auditLog.length > 10000) {
      this.auditLog = this.auditLog.slice(0, 8000);
    }

    // Check for security alerts
    this.checkSecurityAlerts(auditEvent);

    this.emitEvent({ type: 'audit_logged', event: auditEvent });
    this.totalHCUSpent += 0.001;
    return auditEvent;
  }

  private checkSecurityAlerts(event: AuditEvent): void {
    // Failed auth tracking
    if (event.type === 'auth' && event.result === 'failure') {
      const count = (this.failedAuthAttempts.get(event.actor) || 0) + 1;
      this.failedAuthAttempts.set(event.actor, count);

      if (count >= this.config.security.maxFailedAuthAttempts) {
        const lockUntil = Date.now() + this.config.security.lockoutDurationMs;
        this.lockouts.set(event.actor, lockUntil);
        this.createSecurityAlert({
          type: 'failed_auth',
          severity: 'high',
          actor: event.actor,
          description: `Exceeded max failed auth attempts (${count})`,
          indicators: ['brute_force', 'account_lockout'],
        });
      }
    } else if (event.type === 'auth' && event.result === 'success') {
      // Reset failed attempts on success
      this.failedAuthAttempts.delete(event.actor);
      this.lockouts.delete(event.actor);
    }

    // Privilege escalation detection
    if (event.type === 'permission_change' && event.result === 'success') {
      if (event.details?.escalated === true) {
        this.createSecurityAlert({
          type: 'privilege_escalation',
          severity: 'critical',
          actor: event.actor,
          description: 'Privilege escalation detected',
          indicators: ['permission_change', 'elevation'],
        });
      }
    }

    // Data exfiltration detection
    if (event.type === 'export' && event.result === 'success') {
      const dataSize = (event.details?.size as number) || 0;
      if (dataSize > 10000000) { // 10MB
        this.createSecurityAlert({
          type: 'data_exfiltration',
          severity: 'high',
          actor: event.actor,
          description: `Large data export: ${(dataSize / 1024 / 1024).toFixed(1)}MB`,
          indicators: ['large_export', 'bulk_download'],
        });
      }
    }

    // Config tampering
    if (event.type === 'config_change' && event.result === 'success') {
      if (event.details?.critical === true) {
        this.createSecurityAlert({
          type: 'config_tampering',
          severity: 'critical',
          actor: event.actor,
          description: 'Critical configuration modified',
          indicators: ['config_change', 'security_config'],
        });
      }
    }
  }

  private createSecurityAlert(alert: Omit<SecurityAlert, 'id' | 'timestamp' | 'acknowledged'>): void {
    hcu.track('safetyTrio_createAlert', 0.001);
    pinpoint.verify('safetyTrio');
    bossAgent.grade({ operation: 'createAlert', engine: 'safetyTrio' }, { engine: 'safetyTrio' });

    const securityAlert: SecurityAlert = {
      ...alert,
      id: `alert_${uuidv4().slice(0, 8)}`,
      timestamp: new Date().toISOString(),
      acknowledged: false,
    };

    this.securityAlerts.unshift(securityAlert);
    if (this.securityAlerts.length > 1000) {
      this.securityAlerts = this.securityAlerts.slice(0, 800);
    }

    this.emitEvent({ type: 'security_alert', alert: securityAlert });
  }

  getAuditLog(limit = 100): AuditEvent[] {
    return this.auditLog.slice(0, limit);
  }

  getAuditLogByActor(actor: string, limit = 100): AuditEvent[] {
    return this.auditLog.filter(e => e.actor === actor).slice(0, limit);
  }

  getAuditLogByType(type: AuditEvent['type'], limit = 100): AuditEvent[] {
    return this.auditLog.filter(e => e.type === type).slice(0, limit);
  }

  // ============================================
  // Privacy
  // ============================================

  logPrivacyEvent(event: Omit<PrivacyEvent, 'id' | 'timestamp'>): PrivacyEvent {
    const privacyEvent: PrivacyEvent = {
      ...event,
      id: `privacy_${uuidv4().slice(0, 8)}`,
      timestamp: new Date().toISOString(),
    };

    this.privacyEvents.unshift(privacyEvent);
    if (this.privacyEvents.length > 5000) {
      this.privacyEvents = this.privacyEvents.slice(0, 4000);
    }

    this.emitEvent({ type: 'privacy_event', event: privacyEvent });
    this.totalHCUSpent += 0.001;
    return privacyEvent;
  }

  getPrivacyEvents(limit = 100): PrivacyEvent[] {
    return this.privacyEvents.slice(0, limit);
  }

  getPrivacyEventsBySubject(subjectId: string, limit = 100): PrivacyEvent[] {
    return this.privacyEvents.filter(e => e.subjectId === subjectId).slice(0, limit);
  }

  applyRetention(): number {
    hcu.track('safetyTrio_applyRetention', 0.001);
    pinpoint.verify('safetyTrio');
    bossAgent.grade({ operation: 'applyRetention', engine: 'safetyTrio' }, { engine: 'safetyTrio' });

    const cutoff = Date.now() - this.config.privacy.dataRetentionDays * 24 * 60 * 60 * 1000;
    const initialLength = this.auditLog.length;
    this.auditLog = this.auditLog.filter(e => new Date(e.timestamp).getTime() > cutoff);
    this.privacyEvents = this.privacyEvents.filter(e => new Date(e.timestamp).getTime() > cutoff);
    return initialLength - this.auditLog.length;
  }

  exportUserData(subjectId: string): { audit: AuditEvent[]; privacy: PrivacyEvent[] } {
    hcu.track('safetyTrio_exportUserData', 0.001);
    pinpoint.verify('safetyTrio');
    bossAgent.grade({ operation: 'exportUserData', engine: 'safetyTrio' }, { engine: 'safetyTrio' });

    this.logPrivacyEvent({
      type: 'data_exported',
      dataType: 'all',
      subjectId,
      actorId: subjectId,
      lawfulBasis: 'user_request',
    });

    return {
      audit: this.getAuditLogByActor(subjectId, 10000),
      privacy: this.getPrivacyEventsBySubject(subjectId, 10000),
    };
  }

  deleteUserData(subjectId: string): number {
    hcu.track('safetyTrio_deleteUserData', 0.001);
    pinpoint.verify('safetyTrio');
    bossAgent.grade({ operation: 'deleteUserData', engine: 'safetyTrio' }, { engine: 'safetyTrio' });

    const auditCount = this.auditLog.filter(e => e.actor === subjectId).length;
    this.auditLog = this.auditLog.filter(e => e.actor !== subjectId);
    this.privacyEvents = this.privacyEvents.filter(e => e.subjectId !== subjectId);

    this.logPrivacyEvent({
      type: 'data_deleted',
      dataType: 'all',
      subjectId,
      actorId: 'system',
      lawfulBasis: 'user_request',
    });

    return auditCount;
  }

  // ============================================
  // Trust Management
  // ============================================

  setTrustLevel(entityId: string, entityType: TrustEvent['entityType'], level: TrustLevel, changedBy: string, reason: string): boolean {
    hcu.track('safetyTrio_setTrustLevel', 0.001);
    pinpoint.verify('safetyTrio');
    bossAgent.grade({ operation: 'setTrustLevel', entityId, level, engine: 'safetyTrio' }, { engine: 'safetyTrio' });

    const key = `${entityType}:${entityId}`;
    const previous = this.trustLevels.get(key)?.level || this.config.trust.defaultTrustLevel;

    if (previous === level) return false;

    this.trustLevels.set(key, { entityType, level });

    const event: TrustEvent = {
      id: `trust_${uuidv4().slice(0, 8)}`,
      timestamp: new Date().toISOString(),
      entityId,
      entityType,
      previousLevel: previous,
      newLevel: level,
      reason,
      changedBy,
    };

    this.trustEvents.unshift(event);
    if (this.trustEvents.length > 2000) {
      this.trustEvents = this.trustEvents.slice(0, 1500);
    }

    this.emitEvent({ type: 'trust_changed', event });
    this.totalHCUSpent += 0.001;
    return true;
  }

  getTrustLevel(entityId: string, entityType: TrustEvent['entityType']): TrustLevel {
    const key = `${entityType}:${entityId}`;
    return this.trustLevels.get(key)?.level || this.config.trust.defaultTrustLevel;
  }

  getAllTrustLevels(): Map<string, TrustLevel> {
    const result = new Map<string, TrustLevel>();
    for (const [key, value] of this.trustLevels) {
      result.set(key, value.level);
    }
    return result;
  }

  isTrusted(entityId: string, entityType: TrustEvent['entityType']): boolean {
    const level = this.getTrustLevel(entityId, entityType);
    return level === 'trusted';
  }

  isBlocked(entityId: string, entityType: TrustEvent['entityType']): boolean {
    const level = this.getTrustLevel(entityId, entityType);
    return level === 'blocked';
  }

  requiresVerification(capabilityId: string): boolean {
    return this.config.trust.requireVerificationFor.includes(capabilityId);
  }

  getTrustEvents(limit = 100): TrustEvent[] {
    return this.trustEvents.slice(0, limit);
  }

  // ============================================
  // Security
  // ============================================

  getSecurityAlerts(limit = 50): SecurityAlert[] {
    return this.securityAlerts.slice(0, limit);
  }

  getActiveAlerts(): SecurityAlert[] {
    return this.securityAlerts.filter(a => !a.acknowledged);
  }

  acknowledgeAlert(alertId: string): boolean {
    const alert = this.securityAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  isLockedOut(actor: string): boolean {
    const lockUntil = this.lockouts.get(actor);
    if (lockUntil && Date.now() < lockUntil) return true;
    if (lockUntil && Date.now() >= lockUntil) {
      this.lockouts.delete(actor);
      this.failedAuthAttempts.delete(actor);
    }
    return false;
  }

  getFailedAuthAttempts(actor: string): number {
    hcu.track('safetyTrio_getFailedAuthAttempts', 0.001);
    pinpoint.verify('safetyTrio');
    bossAgent.grade({ operation: 'getFailedAuthAttempts', engine: 'safetyTrio' }, { engine: 'safetyTrio' });
    return this.failedAuthAttempts.get(actor) || 0;
  }

  resetAuthAttempts(actor: string): void {
    this.failedAuthAttempts.delete(actor);
    this.lockouts.delete(actor);
  }

  // ============================================
  // Config
  // ============================================

  getConfig(): SafetyConfig {
    return JSON.parse(JSON.stringify(this.config));
  }

  updateConfig(config: Partial<SafetyConfig>): void {
    const oldConfig = JSON.parse(JSON.stringify(this.config));
    this.config = this.mergeConfig(this.config, config);
    this.emitEvent({ type: 'config_changed', domain: this.detectChangedDomain(oldConfig, this.config) });
  }

  private detectChangedDomain(oldConfig: SafetyConfig, newConfig: SafetyConfig): 'privacy' | 'security' | 'trust' {
    if (JSON.stringify(oldConfig.privacy) !== JSON.stringify(newConfig.privacy)) return 'privacy';
    if (JSON.stringify(oldConfig.security) !== JSON.stringify(newConfig.security)) return 'security';
    return 'trust';
  }

  // ============================================
  // Health & Maintenance
  // ============================================

  getHealth(): SafetyHealth {
    return {
      isRunning: this.isRunning,
      auditLogSize: this.auditLog.length,
      privacyEventsCount: this.privacyEvents.length,
      trustEntitiesTracked: this.trustLevels.size,
      activeAlerts: this.getActiveAlerts().length,
      totalHCUSpent: this.totalHCUSpent,
      hcuBudgetPerHour: this.config.hcuBudgetPerHour,
      lastAuditTime: this.auditLog[0]?.timestamp || null,
    };
  }

  private cleanup(): void {
    // Clean up old audit logs based on security config
    const auditCutoff = Date.now() - this.config.security.auditLogRetentionDays * 24 * 60 * 60 * 1000;
    this.auditLog = this.auditLog.filter(e => new Date(e.timestamp).getTime() > auditCutoff);

    // Clean up expired lockouts
    const now = Date.now();
    for (const [actor, lockUntil] of this.lockouts) {
      if (now >= lockUntil) {
        this.lockouts.delete(actor);
        this.failedAuthAttempts.delete(actor);
      }
    }

    // Apply privacy retention
    this.applyRetention();

    this.totalHCUSpent += 0.005;
  }

  // ============================================
  // Event System
  // ============================================

  onEvent<K extends SafetyEvent['type']>(
    eventType: K,
    listener: (event: Extract<SafetyEvent, { type: K }>) => void
  ): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(listener as any);

    return () => {
      this.eventListeners.get(eventType)?.delete(listener as any);
    };
  }

  private emitEvent(event: SafetyEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(event);
        } catch (e) {
          console.error(`SafetyTrio event listener error:`, e);
        }
      }
    }
  }

  // ============================================
  // Logging
  // ============================================

  private async log(type: string, data: Record<string, unknown>): Promise<void> {
    try {
      await logToCosmos({
        type: `safety_trio_${type}`,
        ...data,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Continue if Cosmos unavailable
    }
  }
}

export function createSafetyTrioEngine(config?: Partial<SafetyConfig>): SafetyTrioEngine {
  return new SafetyTrioEngine(config);
}

export default SafetyTrioEngine;
// src/engines/safetyTrio/types.ts
// Types for Engine 11: Safety Trio — Privacy, Security, Trust

export interface PrivacyLevelInterface = 'strict' | 'balanced' | 'permissive';

export type PrivacyLevel = PrivacyLevelInterface;

export interface SecurityLevelInterface = 'high' | 'medium' | 'low';

export type SecurityLevel = SecurityLevelInterface;

export interface TrustLevelInterface = 'trusted' | 'neutral' | 'untrusted' | 'blocked';

export type TrustLevel = TrustLevelInterface;

export type PrivacyConfig = {
  dataRetentionDays: number;
  telemetryEnabled: boolean;
  analyticsEnabled: boolean;
  crashReportingEnabled: boolean;
  localProcessingOnly: boolean;
  encryptionAtRest: boolean;
};

export type SecurityConfig = {
  sessionTimeoutMs: number;
  maxFailedAuthAttempts: number;
  lockoutDurationMs: number;
  requireMfa: boolean;
  auditLogRetentionDays: number;
  encryptSensitiveFields: boolean;
};

export type TrustConfig = {
  defaultTrustLevel: TrustLevel;
  trustedDomains: string[];
  blockedDomains: string[];
  autoTrustOwners: boolean;
  requireVerificationFor: string[]; // capability IDs
};

export type SafetyConfig = {
  privacy: PrivacyConfig;
  security: SecurityConfig;
  trust: TrustConfig;
  hcuBudgetPerHour: number;
};

export type AuditEvent = {
  id: string;
  timestamp: string;
  type: 'auth' | 'access' | 'modification' | 'deletion' | 'export' | 'permission_change' | 'config_change' | 'error';
  actor: string; // user/agent ID
  resource: string;
  action: string;
  result: 'success' | 'failure' | 'denied';
  details?: Record<string, unknown>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  ip?: string;
  userAgent?: string;
};

export type PrivacyEvent = {
  id: string;
  timestamp: string;
  type: 'data_accessed' | 'data_exported' | 'data_deleted' | 'consent_changed' | 'retention_applied';
  dataType: string;
  subjectId: string;
  actorId: string;
  lawfulBasis?: string;
};

export type TrustEvent = {
  id: string;
  timestamp: string;
  entityId: string;
  entityType: 'agent' | 'capability' | 'domain' | 'user' | 'device';
  previousLevel: TrustLevel;
  newLevel: TrustLevel;
  reason: string;
  changedBy: string;
};

export type SafetyEvent =
  | { type: 'audit_logged'; event: AuditEvent }
  | { type: 'privacy_event'; event: PrivacyEvent }
  | { type: 'trust_changed'; event: TrustEvent }
  | { type: 'security_alert'; alert: SecurityAlert }
  | { type: 'config_changed'; domain: 'privacy' | 'security' | 'trust' };

export type SecurityAlert = {
  id: string;
  timestamp: string;
  type: 'failed_auth' | 'suspicious_activity' | 'privilege_escalation' | 'data_exfiltration' | 'config_tampering';
  severity: 'low' | 'medium' | 'high' | 'critical';
  actor: string;
  description: string;
  indicators: string[];
  acknowledged: boolean;
};

export type SafetyHealth = {
  isRunning: boolean;
  auditLogSize: number;
  privacyEventsCount: number;
  trustEntitiesTracked: number;
  activeAlerts: number;
  totalHCUSpent: number;
  hcuBudgetPerHour: number;
  lastAuditTime: string | null;
};
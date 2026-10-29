import { log as auditLog } from './auditLogger.js';

export const HIGH_RISK_ACTIONS = new Set([
  'delete',
  'execute',
  'terminal.execute',
  'filesystem.delete',
  'payment',
  'transfer',
  'send_email',
  'destroy',
  'high_risk_action',
]);

export class PermissionChecker {
  constructor(options = {}) {
    this.auditLogger = options.auditLogger || auditLog;
    this.highRiskActions = new Set([...HIGH_RISK_ACTIONS, ...(options.highRiskActions || [])]);
    // Map<grantKey, grantRecord>
    this.grants = new Map();
  }

  isHighRisk(action) {
    if (!action) return false;
    const norm = String(action).toLowerCase();
    return this.highRiskActions.has(norm) || norm.includes('delete') || norm.includes('execute') || norm.includes('payment');
  }

  _grantKey(subject, resource, action) {
    return `${subject}::${resource}::${action}`;
  }

  grant({ subject, resource, action, scope = 'default', expires_at = null }) {
    if (!subject || !resource || !action) {
      throw new TypeError('PermissionChecker: subject, resource, and action are required');
    }

    const key = this._grantKey(subject, resource, action);
    const grantRecord = {
      subject,
      resource,
      action,
      scope,
      expires_at: expires_at ? new Date(expires_at).toISOString() : null,
      granted_at: new Date().toISOString(),
    };

    this.grants.set(key, grantRecord);

    if (typeof this.auditLogger === 'function') {
      this.auditLogger({
        event_type: 'permission:granted',
        actor: subject,
        payload: { subject, resource, action, scope, expires_at: grantRecord.expires_at },
      });
    }

    return true;
  }

  check({ subject, resource, action, now = Date.now() }) {
    // Fail-closed: deny by default
    if (!subject || !resource || !action) {
      return { allowed: false, reason: 'missing_parameters' };
    }

    const highRisk = this.isHighRisk(action);

    // Look for exact grant
    const exactKey = this._grantKey(subject, resource, action);
    let grant = this.grants.get(exactKey);

    // Look for wildcard grant (resource: "*") ONLY if not high-risk
    if (!grant && !highRisk) {
      const wildcardKey = this._grantKey(subject, '*', action);
      grant = this.grants.get(wildcardKey);
    }

    if (!grant) {
      if (highRisk) {
        const wildcardKey = this._grantKey(subject, '*', action);
        if (this.grants.has(wildcardKey)) {
          this._emitDecision('permission:denied', subject, resource, action, 'wildcard_not_allowed_for_high_risk');
          return { allowed: false, reason: 'wildcard_not_allowed_for_high_risk' };
        }
      }
      this._emitDecision('permission:denied', subject, resource, action, 'no_grant');
      return { allowed: false, reason: 'no_grant' };
    }

    // Check expiration
    if (grant.expires_at) {
      const expiryTime = new Date(grant.expires_at).getTime();
      if (expiryTime <= now) {
        this.grants.delete(exactKey);
        this._emitDecision('permission:denied', subject, resource, action, 'grant_expired');
        return { allowed: false, reason: 'grant_expired' };
      }
    }

    this._emitDecision('permission:allowed', subject, resource, action, 'grant_valid');
    return { allowed: true, reason: 'grant_valid', scope: grant.scope };
  }

  revoke({ subject, resource, action }) {
    const key = this._grantKey(subject, resource, action);
    const deleted = this.grants.delete(key);

    if (deleted && typeof this.auditLogger === 'function') {
      this.auditLogger({
        event_type: 'permission:revoked',
        actor: subject,
        payload: { subject, resource, action },
      });
    }
    return deleted;
  }

  revoke_all({ subject }) {
    if (!subject) return 0;
    let count = 0;
    for (const [key, grant] of this.grants.entries()) {
      if (grant.subject === subject) {
        this.grants.delete(key);
        count++;
      }
    }

    if (count > 0 && typeof this.auditLogger === 'function') {
      this.auditLogger({
        event_type: 'permission:revoked_all',
        actor: subject,
        payload: { subject, count },
      });
    }
    return count;
  }

  _emitDecision(event_type, subject, resource, action, reason) {
    if (typeof this.auditLogger === 'function') {
      this.auditLogger({
        event_type,
        actor: subject,
        payload: { subject, resource, action, reason },
      });
    }
  }
}

export const defaultPermissionChecker = new PermissionChecker();

export function grant(input) {
  return defaultPermissionChecker.grant(input);
}

export function check(input) {
  return defaultPermissionChecker.check(input);
}

export function revoke(input) {
  return defaultPermissionChecker.revoke(input);
}

export function revoke_all(input) {
  return defaultPermissionChecker.revoke_all(input);
}

export default {
  PermissionChecker,
  defaultPermissionChecker,
  grant,
  check,
  revoke,
  revoke_all,
  HIGH_RISK_ACTIONS,
};

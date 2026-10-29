import crypto from 'node:crypto';
import { log as auditLog } from './auditLogger.js';
import { defaultPermissionChecker } from './failClosedPermissionChecker.js';

export const DEFAULT_APPROVAL_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

export class ApprovalGate {
  constructor(options = {}) {
    this.auditLogger = options.auditLogger || auditLog;
    this.permissionChecker = options.permissionChecker || defaultPermissionChecker;
    this.expiryMs = options.expiryMs || DEFAULT_APPROVAL_EXPIRY_MS;
    this.records = new Map(); // approval_id -> record
    this.usedNonces = new Set();
  }

  request({ action, content_hash, risk = 'high', preview = '', actor = 'system', ttlMs = null }) {
    if (!action || !content_hash) {
      throw new TypeError('ApprovalGate: action and content_hash are required');
    }

    const id = `appr_${crypto.randomUUID()}`;
    const now = Date.now();
    const duration = ttlMs !== null ? ttlMs : this.expiryMs;
    const expires_at = new Date(now + duration).toISOString();

    const record = {
      id,
      action,
      content_hash,
      risk,
      preview,
      actor,
      status: 'pending',
      approver: null,
      approved_at: null,
      expires_at,
      nonce: null,
      rejection_reason: null,
    };

    this.records.set(id, record);

    if (typeof this.auditLogger === 'function') {
      this.auditLogger({
        event_type: 'approval:requested',
        actor,
        correlation_id: id,
        payload: { approval_id: id, action, content_hash, risk },
      });
    }

    return id;
  }

  approve({ approval_id, approver, nonce, current_content_hash = null, now = Date.now() }) {
    if (!approval_id || !approver || !nonce) {
      throw new Error('ApprovalGate: approval_id, approver, and nonce are required');
    }

    if (this.usedNonces.has(nonce)) {
      throw new Error('ApprovalGate: Nonce has already been used (replay detected)');
    }

    const record = this.records.get(approval_id);
    if (!record) {
      throw new Error('ApprovalGate: Unknown approval request');
    }

    if (record.status === 'rejected') {
      throw new Error('ApprovalGate: This action was rejected');
    }

    if (record.status === 'approved') {
      throw new Error('ApprovalGate: Approval has already been granted');
    }

    // Check expiration
    if (new Date(record.expires_at).getTime() <= now) {
      throw new Error('ApprovalGate: Approval request has expired');
    }

    // Validate content hash if provided
    if (current_content_hash && current_content_hash !== record.content_hash) {
      throw new Error('ApprovalGate: Content hash mismatch. Action content was altered');
    }

    // Validate approver permission if permissionChecker present
    if (this.permissionChecker) {
      const perm = this.permissionChecker.check({
        subject: approver,
        resource: record.action,
        action: 'approve',
      });
      // Allow if explicit 'approve' permission granted OR approver is designated admin
      if (!perm.allowed && approver !== 'admin' && approver !== 'owner') {
        const executePerm = this.permissionChecker.check({
          subject: approver,
          resource: record.action,
          action: 'execute',
        });
        if (!executePerm.allowed) {
          throw new Error(`ApprovalGate: Approver "${approver}" is not authorized to approve "${record.action}"`);
        }
      }
    }

    // Mark nonce as used
    this.usedNonces.add(nonce);

    record.status = 'approved';
    record.approver = approver;
    record.approved_at = new Date(now).toISOString();
    record.nonce = nonce;

    if (typeof this.auditLogger === 'function') {
      this.auditLogger({
        event_type: 'approval:approved',
        actor: approver,
        correlation_id: approval_id,
        payload: { approval_id, action: record.action, approver, nonce },
      });
    }

    return { ok: true, approval_id };
  }

  reject({ approval_id, approver, reason = 'User rejected action' }) {
    const record = this.records.get(approval_id);
    if (!record) {
      throw new Error('ApprovalGate: Unknown approval request');
    }

    record.status = 'rejected';
    record.approver = approver;
    record.rejection_reason = reason;

    if (typeof this.auditLogger === 'function') {
      this.auditLogger({
        event_type: 'approval:rejected',
        actor: approver,
        correlation_id: approval_id,
        payload: { approval_id, action: record.action, reason },
      });
    }

    return { ok: true, rejected: true };
  }

  isActionApproved({ approval_id, action, content_hash, now = Date.now() }) {
    const record = this.records.get(approval_id);
    if (!record) return { allowed: false, reason: 'unknown_approval' };
    if (record.status !== 'approved') return { allowed: false, reason: `status_${record.status}` };
    if (record.action !== action) return { allowed: false, reason: 'action_mismatch' };
    if (record.content_hash !== content_hash) return { allowed: false, reason: 'content_hash_mismatch' };
    if (new Date(record.expires_at).getTime() <= now) return { allowed: false, reason: 'expired' };

    return { allowed: true, approver: record.approver };
  }
}

export const defaultApprovalGate = new ApprovalGate();

export function request(input) {
  return defaultApprovalGate.request(input);
}

export function approve(input) {
  return defaultApprovalGate.approve(input);
}

export function reject(input) {
  return defaultApprovalGate.reject(input);
}

export default {
  ApprovalGate,
  defaultApprovalGate,
  request,
  approve,
  reject,
  DEFAULT_APPROVAL_EXPIRY_MS,
};

// src/engines/autonomous/ApprovalGates.ts
// Approval Gates — Enforces money thresholds and destructive action confirmations.
// Integrates with PermissionManager from core.

import type {
  ActionStep,
  ExecutionContext,
  RiskLevel,
  Platform,
} from './types';
import { hasPermission, authorizeExecution, executeWithPermission } from '../../core/permissionManager';

export interface ApprovalGateConfig {
  moneyThresholdUsd: number;
  destructiveActionsRequireApproval: boolean;
  routineActionsAutoApprove: boolean;
  highRiskActionsRequireApproval: boolean;
  criticalActionsAlwaysRequireApproval: boolean;
  approvalTimeoutMs: number;
  autoApproveTrustedSources: boolean;
}

const DEFAULT_CONFIG: ApprovalGateConfig = {
  moneyThresholdUsd: 10,
  destructiveActionsRequireApproval: true,
  routineActionsAutoApprove: false,
  highRiskActionsRequireApproval: true,
  criticalActionsAlwaysRequireApproval: true,
  approvalTimeoutMs: 30000, // 30 seconds
  autoApproveTrustedSources: false,
};

export interface ApprovalRequest {
  id: string;
  planId: string;
  stepId: string;
  step: ActionStep;
  context: ExecutionContext;
  reason: string;
  riskLevel: RiskLevel;
  estimatedCostUsd?: number;
  requiredApprovals: string[]; // role IDs or user IDs
  createdAt: string;
  expiresAt: string;
  status: 'pending' | 'approved' | 'denied' | 'expired';
  approvedBy?: string;
  approvedAt?: string;
  deniedBy?: string;
  deniedAt?: string;
  denialReason?: string;
}

export interface ApprovalResult {
  approved: boolean;
  reason?: string;
  requestId?: string;
}

// Destructive capabilities that require approval
const DESTRUCTIVE_CAPABILITIES: string[] = [
  'computer.execute_terminal',
  'computer.kill_process',
  'computer.change_setting',
  'computer.organize_files',
  'computer.delete_file',
  'browser.submit_form',
  'browser.handle_dialog',
  'phone.wipe_data',
  'phone.reset_settings',
];

// High-risk capabilities
const HIGH_RISK_CAPABILITIES: string[] = [
  'computer.execute_terminal',
  'computer.change_setting',
  'computer.organize_files',
  'browser.submit_form',
];

// Critical capabilities
const CRITICAL_CAPABILITIES: string[] = [
  'computer.kill_process',
  'computer.delete_file',
  'phone.wipe_data',
  'phone.reset_settings',
];

// Cost estimation per capability (USD)
const CAPABILITY_COSTS: Record<string, number> = {
  'computer.execute_terminal': 0.001, // Local execution
  'computer.open_url': 0.0001,
  'browser.navigate': 0.0001,
  'browser.fill_form': 0.0001,
  'browser.submit_form': 0.0005, // Could trigger payments
  'computer.organize_files': 0.0001,
  'computer.kill_process': 0.0001,
  'computer.change_setting': 0.0001,
  'computer.take_screenshot': 0.0001,
};

export class ApprovalGates {
  private config: ApprovalGateConfig;
  private pendingRequests: Map<string, ApprovalRequest> = new Map();
  private approvalHistory: ApprovalRequest[] = [];

  constructor(config: Partial<ApprovalGateConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Check if a step requires approval and handle the approval flow.
   */
  async checkApproval(step: ActionStep, context: ExecutionContext): Promise<ApprovalResult> {
    // 1. Check if capability is critical (always requires approval)
    if (this.isCritical(step.capability) && this.config.criticalActionsAlwaysRequireApproval) {
      return this.requestApproval(step, context, 'critical', 'Critical action always requires explicit approval');
    }

    // 2. Check if capability is destructive
    if (this.isDestructive(step.capability) && this.config.destructiveActionsRequireApproval) {
      return this.requestApproval(step, context, 'destructive', 'Destructive action requires approval');
    }

    // 3. Check if capability is high-risk
    if (this.isHighRisk(step.capability) && this.config.highRiskActionsRequireApproval) {
      return this.requestApproval(step, context, 'high_risk', 'High-risk action requires approval');
    }

    // 4. Check money threshold
    const estimatedCost = this.estimateCost(step);
    if (estimatedCost >= this.config.moneyThresholdUsd) {
      return this.requestApproval(step, context, 'cost_threshold', `Estimated cost $${estimatedCost} exceeds threshold $${this.config.moneyThresholdUsd}`, estimatedCost);
    }

    // 5. Check routine auto-approval
    if (this.config.routineActionsAutoApprove && this.isRoutine(step.capability)) {
      return { approved: true };
    }

    // 6. Check trusted source auto-approval
    if (this.config.autoApproveTrustedSources && await this.isTrustedSource(context)) {
      return { approved: true };
    }

    // 7. Check PermissionManager for existing grants
    const permissionCheck = await this.checkPermissionManager(step, context);
    if (permissionCheck.granted) {
      return { approved: true };
    }

    // Default: require approval for anything not explicitly allowed
    return this.requestApproval(step, context, 'default', 'Action requires approval');
  }

  private isDestructive(capability: string): boolean {
    return DESTRUCTIVE_CAPABILITIES.includes(capability);
  }

  private isHighRisk(capability: string): boolean {
    return HIGH_RISK_CAPABILITIES.includes(capability);
  }

  private isCritical(capability: string): boolean {
    return CRITICAL_CAPABILITIES.includes(capability);
  }

  private isRoutine(capability: string): boolean {
    const routineCapabilities = [
      'computer.open_url',
      'browser.navigate',
      'browser.click_element',
      'browser.extract_text',
      'computer.click',
      'computer.type_text',
      'computer.scroll',
      'computer.take_screenshot',
      'browser.wait_for',
    ];
    return routineCapabilities.includes(capability);
  }

  private estimateCost(step: ActionStep): number {
    return CAPABILITY_COSTS[step.capability] || 0.001;
  }

  private async isTrustedSource(context: ExecutionContext): Promise<boolean> {
    // Check if the request comes from a trusted workflow/agent
    // In production, this would check agent signatures, workflow IDs, etc.
    return false;
  }

  private async checkPermissionManager(step: ActionStep, context: ExecutionContext): Promise<{ granted: boolean; reason?: string }> {
    try {
      // Map capability to permission
      const permission = this.capabilityToPermission(step.capability);
      if (!permission) return { granted: false, reason: 'No permission mapping' };

      // Check if user has granted this permission
      const hasPerm = hasPermission(permission, 'account', context.userId);

      return { granted: hasPerm, reason: hasPerm ? undefined : 'Permission not granted' };
    } catch {
      return { granted: false, reason: 'Permission check failed' };
    }
  }

  private capabilityToPermission(capability: string): string | null {
    const mapping: Record<string, string> = {
      'computer.execute_terminal': 'system.terminal.execute',
      'computer.kill_process': 'system.process.kill',
      'computer.change_setting': 'system.settings.modify',
      'computer.organize_files': 'filesystem.organize',
      'computer.delete_file': 'filesystem.delete',
      'computer.open_url': 'browser.navigate',
      'browser.navigate': 'browser.navigate',
      'browser.fill_form': 'browser.form.fill',
      'browser.submit_form': 'browser.form.submit',
      'browser.click_element': 'browser.click',
      'browser.extract_text': 'browser.read',
      'browser.extract_table': 'browser.read',
      'browser.wait_for': 'browser.wait',
      'browser.handle_dialog': 'browser.dialog',
      'phone.open_app': 'phone.app.open',
      'phone.tap': 'phone.input.tap',
      'phone.swipe': 'phone.input.swipe',
      'phone.type': 'phone.input.type',
    };
    return mapping[capability] || null;
  }

  private async requestApproval(
    step: ActionStep,
    context: ExecutionContext,
    type: string,
    reason: string,
    estimatedCostUsd?: number
  ): Promise<ApprovalResult> {
    const requestId = `approval_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const riskLevel = this.getRiskLevel(step.capability);

    const request: ApprovalRequest = {
      id: requestId,
      planId: context.workflowId || 'unknown',
      stepId: step.id,
      step,
      context,
      reason: `${type}: ${reason}`,
      riskLevel,
      estimatedCostUsd,
      requiredApprovals: [context.userId], // In production, could include role-based approvers
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + this.config.approvalTimeoutMs).toISOString(),
      status: 'pending',
    };

    this.pendingRequests.set(requestId, request);

    // Check if there's already an approval in context
    if (context.approval) {
      // In production, validate the approval token
      const isValid = await this.validateApproval(context.approval, request);
      if (isValid) {
        request.status = 'approved';
        request.approvedBy = context.userId;
        request.approvedAt = new Date().toISOString();
        this.pendingRequests.delete(requestId);
        this.approvalHistory.push(request);
        return { approved: true, requestId };
      }
    }

    // No valid approval in context - return pending with request ID for UI to handle
    // Keep the request in pending state for the UI to approve/deny
    return {
      approved: false,
      reason: `Approval required: ${reason}. Request ID: ${requestId}`,
      requestId,
    };
  }

  private getRiskLevel(capability: string): RiskLevel {
    if (CRITICAL_CAPABILITIES.includes(capability)) return 'critical';
    if (HIGH_RISK_CAPABILITIES.includes(capability)) return 'high';
    if (DESTRUCTIVE_CAPABILITIES.includes(capability)) return 'medium';
    return 'low';
  }

  private async validateApproval(approval: unknown, request: ApprovalRequest): Promise<boolean> {
    // In production, validate JWT, signature, or token
    // For now, simple check
    if (typeof approval === 'object' && approval !== null) {
      const approvalObj = approval as { requestId?: string; approved?: boolean };
      return approvalObj.requestId === request.id && approvalObj.approved === true;
    }
    return false;
  }

  /**
   * Approve a pending request (called by UI or API).
   */
  async approveRequest(requestId: string, approverId: string): Promise<boolean> {
    const request = this.pendingRequests.get(requestId);
    if (!request || request.status !== 'pending') return false;

    request.status = 'approved';
    request.approvedBy = approverId;
    request.approvedAt = new Date().toISOString();
    this.pendingRequests.delete(requestId);
    this.approvalHistory.push(request);

    // Log to Cosmos
    await this.logApproval(request);
    return true;
  }

  /**
   * Deny a pending request.
   */
  async denyRequest(requestId: string, denierId: string, reason: string): Promise<boolean> {
    const request = this.pendingRequests.get(requestId);
    if (!request || request.status !== 'pending') return false;

    request.status = 'denied';
    request.deniedBy = denierId;
    request.deniedAt = new Date().toISOString();
    request.denialReason = reason;
    this.pendingRequests.delete(requestId);
    this.approvalHistory.push(request);

    await this.logApproval(request);
    return true;
  }

  /**
   * Get a pending approval request.
   */
  getPendingRequest(requestId: string): ApprovalRequest | undefined {
    return this.pendingRequests.get(requestId);
  }

  /**
   * Get all pending requests for a user.
   */
  getPendingRequestsForUser(userId: string): ApprovalRequest[] {
    return Array.from(this.pendingRequests.values())
      .filter(r => r.requiredApprovals.includes(userId) && r.status === 'pending');
  }

  /**
   * Get approval history.
   */
  getHistory(limit = 100): ApprovalRequest[] {
    return this.approvalHistory.slice(-limit);
  }

  /**
   * Clean up expired requests.
   */
  cleanupExpired(): number {
    const now = new Date().toISOString();
    let cleaned = 0;

    for (const [id, request] of this.pendingRequests.entries()) {
      if (request.expiresAt < now && request.status === 'pending') {
        request.status = 'expired';
        request.deniedBy = 'system';
        request.deniedAt = now;
        request.denialReason = 'Approval request expired';
        this.pendingRequests.delete(id);
        this.approvalHistory.push(request);
        cleaned++;
      }
    }

    return cleaned;
  }

  private async logApproval(request: ApprovalRequest): Promise<void> {
    try {
      const { logToCosmos } = await import('../../core/cosmosMemory');
      await logToCosmos({
        type: 'approval_decision',
        requestId: request.id,
        planId: request.planId,
        stepId: request.stepId,
        capability: request.step.capability,
        status: request.status,
        riskLevel: request.riskLevel,
        estimatedCostUsd: request.estimatedCostUsd,
        approver: request.approvedBy || request.deniedBy,
        reason: request.reason,
        denialReason: request.denialReason,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Continue if Cosmos unavailable
    }
  }

  getConfig(): ApprovalGateConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<ApprovalGateConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

export function createApprovalGates(config?: Partial<ApprovalGateConfig>): ApprovalGates {
  return new ApprovalGates(config);
}

export default ApprovalGates;
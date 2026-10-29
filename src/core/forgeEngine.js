import { publish } from "./eventBus.js";
import { recordAudit } from "./auditLog.js";
import { readJson, writeJson, subscribeStorageAccount, getStorageAccount, getStorageAccountRevision } from './infinity/storage.js';

async function fingerprint(artifact) {
  const source = JSON.stringify({ id: artifact.id, version: artifact.version, type: artifact.type, manifest: artifact.manifest, steps: artifact.steps, files: artifact.files, tests: artifact.tests, requiredPermissions: artifact.requiredPermissions, inputSchema: artifact.inputSchema, outputSchema: artifact.outputSchema, costBudget: artifact.costBudget, timeBudget: artifact.timeBudget, triggers: artifact.triggers, outputTemplate: artifact.outputTemplate, capabilities: artifact.capabilities, description: artifact.description });
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(source));
  return [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

const FORGE_STATES = Object.freeze({
  DRAFT: "draft",
  DUPLICATE_CHECK: "duplicate_check",
  DESIGNING: "designing",
  PERMISSIONS: "permissions",
  GENERATING: "generating",
  TESTING: "testing",
  VALIDATING: "validating",
  PREVIEW: "preview",
  INSTALL_APPROVAL: "install_approval",
  INSTALLED: "installed",
  MONITORING: "monitoring",
  UPDATED: "updated",
  ROLLED_BACK: "rolled_back",
  DISABLED: "disabled",
  REVOKED: "revoked",
});

const ARTIFACT_TYPES = Object.freeze({
  AGENT: "agent",
  AGENT_TEAM: "agent_team",
  WORKFLOW: "workflow",
  SKILL: "skill",
  COMMAND: "command",
  AUTOMATION: "automation",
  WIDGET_TEMPLATE: "widget_template",
  DASHBOARD: "dashboard",
  CAPABILITY_PACK: "capability_pack",
  ADAPTER: "adapter",
  MINI_APP: "mini_app",
});

const TRIGGER_TYPES = Object.freeze({
  MANUAL: "manual",
  VOICE: "voice",
  TEXT: "text",
  GESTURE: "gesture",
  SHORTCUT: "shortcut",
  SCHEDULE: "schedule",
  EVENT: "event",
  WEBHOOK: "webhook",
  FILE: "file",
  INTEGRATION: "integration",
  DEVICE: "device",
  CONDITION: "condition",
});

function generateArtifactId() {
  return `forge_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function generateVersionId() {
  return `ver_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function generateTestId() {
  return `test_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

class ForgeEngine {
  constructor() {
    this.artifacts = new Map();
    this.versions = new Map();
    this.testFixtures = new Map();
    this.validationReports = new Map();
    this.installationApprovals = new Map();
    this.dependencyLocks = new Map();
    this.testRunner = null;
    this.listeners = new Set();
    this.installers = new Map();
    this.installControllers = new Map();
    this.load();
    subscribeStorageAccount(() => {
      for (const controller of this.installControllers.values()) controller.abort();
      for (const name of ['artifacts', 'versions', 'testFixtures', 'validationReports', 'installationApprovals', 'dependencyLocks', 'installers']) this[name].clear();
      this.load(); this.notify('account_changed', {});
    });
  }

  load() {
    try {
      const parsed = readJson('hey_infinity_forge_engine', {});
      for (const name of ['artifacts', 'versions', 'testFixtures', 'validationReports', 'installationApprovals', 'dependencyLocks']) if (parsed[name] && typeof parsed[name] === 'object') Object.entries(parsed[name]).forEach(([key, value]) => this[name].set(key, value));
    } catch (err) {
      console.warn("Failed to load Forge:", err);
    }
  }

  save() {
    const state = {};
    for (const name of ['artifacts', 'versions', 'testFixtures', 'validationReports', 'installationApprovals', 'dependencyLocks']) state[name] = Object.fromEntries(this[name]);
    if (!writeJson('hey_infinity_forge_engine', state)) throw new Error('Forge checkpoint could not be saved.');
  }

  async createArtifact(input) {
    const artifactId = generateArtifactId();
    const now = new Date().toISOString();
    
    const artifact = {
      id: artifactId,
      type: input.type,
      name: input.name,
      displayName: input.displayName || input.name,
      description: input.description,
      version: "1.0.0",
      state: FORGE_STATES.DRAFT,
      triggers: input.triggers || [],
      parameters: input.parameters || {},
      outputTemplate: input.outputTemplate || null,
      allowedProviders: input.allowedProviders || [],
      timeBudget: input.timeBudget || 300000,
      costBudget: input.costBudget || 100,
      resourceScope: input.resourceScope || {},
      notificationBehavior: input.notificationBehavior || "normal",
      visibility: input.visibility || "private",
      manifest: input.manifest || {},
      tests: input.tests || [],
      validation: null,
      preview: null,
      installationApproval: null,
      health: { successRate: 0, latency: 0, errorRate: 0, cost: 0 },
      createdAt: now,
      updatedAt: now,
      installedAt: null,
      disabledAt: null,
      revokedAt: null,
    };

    this.artifacts.set(artifactId, artifact);
    this.save();
    this.notify("artifact_created", artifact);
    return artifact;
  }

  getArtifact(id) {
    return this.artifacts.get(id) || null;
  }

  getAllArtifacts() {
    return Array.from(this.artifacts.values());
  }

  async searchDuplicates(input) {
    const artifacts = this.getAllArtifacts();
    return artifacts.filter(a => 
      a.name.toLowerCase().includes(input.name.toLowerCase()) ||
      (a.description && a.description.toLowerCase().includes(input.description.toLowerCase()))
    );
  }

  updateArtifact(id, updates) {
    const artifact = this.artifacts.get(id);
    if (!artifact) return null;

    const updated = { ...artifact, ...updates, updatedAt: new Date().toISOString() };
    this.artifacts.set(id, updated);
    this.save();
    this.notify("artifact_updated", updated);
    return updated;
  }

  setState(id, state) {
    const artifact = this.artifacts.get(id);
    if (!artifact) return null;

    artifact.state = state;
    artifact.updatedAt = new Date().toISOString();
    this.artifacts.set(id, artifact);
    this.save();
    this.notify("state_changed", { id, state });
    return artifact;
  }

  async generateTests(artifactId) {
    const artifact = this.artifacts.get(artifactId);
    if (!artifact) return { error: "Artifact not found" };

    const tests = artifact.triggers.map(trigger => ({
      id: generateTestId(),
      artifactId,
      trigger: trigger,
      fixtures: this.generateFixtures(trigger),
      expectedEffects: this.generateExpectedEffects(trigger),
      createdAt: new Date().toISOString(),
    }));

    artifact.tests = tests;
    this.artifacts.set(artifactId, artifact);
    this.save();
    return tests;
  }

  generateFixtures() {
    return { positive: [], negative: [], fault: [] };
  }

  generateExpectedEffects() {
    return [];
  }

  async runSandboxTests(artifactId) {
    const artifact = this.artifacts.get(artifactId);
    if (!artifact) return { error: "Artifact not found" };
    if (!Array.isArray(artifact.tests) || !artifact.tests.length || artifact.tests.length > 100 || !this.testRunner) return { error: 'Provide 1 to 100 tests and a real sandbox test adapter before verification.' };
    const revision = getStorageAccountRevision();
    const artifactHash = await fingerprint(artifact);

    this.setState(artifactId, FORGE_STATES.TESTING);
    
    const results = {
      passed: 0,
      failed: 0,
      errors: [],
      productionEndpointsCalled: null,
    };

    for (const test of artifact.tests) {
      try {
        const result = await this.runTest(test, { artifact: structuredClone(artifact), artifactHash });
        if (result.success) results.passed++;
        else {
          results.failed++;
          results.errors.push({ testId: test.id, error: result.error });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({ testId: test.id, error: error.message });
      }
    }

    if (revision !== getStorageAccountRevision() || artifactHash !== await fingerprint(artifact)) return { error: 'The account or artifact changed during testing.' };
    results.productionEndpointsCalled = results.failed === 0 ? false : null;
    artifact.sandboxVerification = { ...results, verified: results.failed === 0 && results.passed === artifact.tests.length, artifactHash, testedAt: new Date().toISOString() };
    this.setState(artifactId, FORGE_STATES.VALIDATING);
    return results;
  }

  setTestRunner(runner) {
    if (typeof runner !== "function") throw new TypeError("Forge test runner must be a function.");
    this.testRunner = runner;
  }

  async runTest(test, context = {}) {
    if (!this.testRunner) {
      return { success: false, verified: false, error: "No Forge sandbox test runner is configured." };
    }
    const result = await this.testRunner(test, context);
    if (!result || result.success !== true || result.verified !== true || result.sandboxed !== true || result.productionEndpointsCalled !== false) {
      return { success: false, verified: false, error: result?.error || "Forge test result was not verified." };
    }
    return result;
  }

  validateArtifact(artifactId) {
    const artifact = this.artifacts.get(artifactId);
    if (!artifact) return { valid: false, error: "Artifact not found" };

    const checks = {
      hasManifest: Boolean(artifact.manifest),
      hasValidSchema: Boolean(artifact.inputSchema && artifact.outputSchema),
      hasTests: artifact.tests.length > 0,
      testsPass: artifact.sandboxVerification?.verified === true && artifact.sandboxVerification.passed === artifact.tests.length,
      permissionsValid: this.validatePermissions(artifact),
      securityValid: this.validateSecurity(artifact),
      budgetValid: this.validateBudget(artifact),
    };

    const valid = Object.values(checks).every(v => v === true);
    
    const report = {
      artifactId,
      checks,
      valid,
      score: Math.round((Object.values(checks).filter(v => v).length / Object.keys(checks).length) * 100),
      createdAt: new Date().toISOString(),
    };

    this.validationReports.set(artifactId, report);
    this.save();
    return report;
  }

  validatePermissions(artifact) {
    const permissions = artifact?.requiredPermissions || artifact?.manifest?.requiredPermissions;
    return Array.isArray(permissions) && permissions.every(permission => typeof permission === 'string' && permission.trim() && !permission.includes('*'));
  }

  validateSecurity(artifact) {
    if (!artifact || typeof artifact !== 'object') return false;
    if (/(sk-[A-Za-z0-9_-]{16,}|(?:api|secret|access)[_-]?key\s*[=:]\s*["']?[A-Za-z0-9_-]{16,})/i.test(JSON.stringify(artifact))) return false;
    const egress = artifact.manifest?.dataEgress || [];
    return Array.isArray(egress) && egress.every(entry => {
      try { return new URL(typeof entry === 'string' ? entry : entry?.url).protocol === 'https:'; } catch { return false; }
    });
  }

  validateBudget(artifact) {
    return Number.isFinite(artifact?.timeBudget) && artifact.timeBudget > 0 && artifact.timeBudget <= 3600000 && Number.isFinite(artifact?.costBudget) && artifact.costBudget >= 0 && artifact.costBudget <= 10000;
  }

  createPreview(artifactId) {
    const artifact = this.artifacts.get(artifactId);
    if (!artifact) return null;

    const preview = {
      triggers: artifact.triggers,
      tools: artifact.manifest.tools || [],
      dataEgress: artifact.manifest.dataEgress || [],
      permissions: artifact.requiredPermissions || [],
      costs: { estimated: artifact.costBudget, currency: "USD" },
      outputs: artifact.outputTemplate ? ["output"] : [],
      undo: artifact.manifest.undo || "Manual rollback required",
    };

    this.updateArtifact(artifactId, { preview });
    return preview;
  }

  async requestInstallApproval(artifactId, userId) {
    const revision = getStorageAccountRevision();
    const artifact = this.artifacts.get(artifactId);
    if (!artifact) return { error: "Artifact not found" };
    if (getStorageAccount() === 'signed-out' || userId !== getStorageAccount()) return { error: 'Sign in with the account installing this artifact.' };
    if (artifact.sandboxVerification?.verified !== true || artifact.sandboxVerification.artifactHash !== await fingerprint(artifact)) return { error: 'Run verified sandbox tests against this exact artifact before installation.' };
    if (!this.validateArtifact(artifactId).valid) return { error: 'The artifact must pass validation before installation can be reviewed.' };

    const approval = {
      id: `approval_${Date.now()}`,
      artifactId,
      userId,
      state: "pending",
      requestedAt: new Date().toISOString(),
      decidedAt: null,
      decision: null,
      artifactHash: await fingerprint(artifact),
    };
    if (revision !== getStorageAccountRevision()) return { error: 'The active account changed before approval could be saved.' };

    this.installationApprovals.set(approval.id, approval);
    this.setState(artifactId, FORGE_STATES.INSTALL_APPROVAL);
    this.save();
    return approval;
  }

  async decideInstallApproval(approvalId, decision, userId) {
    const revision = getStorageAccountRevision();
    const approval = this.installationApprovals.get(approvalId);
    if (!approval) return { error: "Approval not found" };
    if (approval.state !== 'pending' || !['approved', 'rejected'].includes(decision) || approval.userId !== userId || userId !== getStorageAccount()) return { error: 'The approval must be pending and belong to the current account.' };
    const artifact = this.artifacts.get(approval.artifactId);
    if (!artifact || approval.artifactHash !== await fingerprint(artifact)) return { error: 'The artifact changed. Review a new installation request.' };
    if (revision !== getStorageAccountRevision()) return { error: 'The active account changed.' };

    approval.decision = decision;
    approval.decidedAt = new Date().toISOString();
    approval.decidedBy = userId;
    approval.state = decision;
    this.installationApprovals.set(approvalId, approval);
    this.save();
    
    if (decision === "approved") {
      const installed = await this.installArtifact(approval.artifactId, approvalId);
      if (installed.error) return installed;
    }
    
    this.installationApprovals.set(approvalId, approval);
    this.save();
    return approval;
  }

  setInstaller(type, installer) {
    if (typeof installer !== 'function') throw new Error('A verified installation adapter is required.');
    this.installers.set(type, installer);
  }

  async installArtifact(artifactId, approvalId) {
    const revision = getStorageAccountRevision();
    const artifact = this.artifacts.get(artifactId);
    if (!artifact) return { error: "Artifact not found" };
    const approval = this.installationApprovals.get(approvalId);
    if (!approval || approval.artifactId !== artifactId || approval.state !== 'approved' || approval.userId !== getStorageAccount()) return { error: 'An explicit installation approval for this artifact is required.' };
    if (artifact.sandboxVerification?.verified !== true || artifact.sandboxVerification.artifactHash !== await fingerprint(artifact)) return { error: 'The exact artifact needs current sandbox verification.' };
    if (approval.artifactHash !== await fingerprint(artifact) || !this.validateArtifact(artifactId).valid) return { error: 'The approved artifact changed or failed validation.' };
    if (revision !== getStorageAccountRevision()) return { error: 'The active account changed.' };
    const installer = this.installers.get(artifact.type);
    if (!installer) return { error: `No installation adapter is configured for ${artifact.type}.` };
    if (this.installControllers.has(artifactId)) return { error: 'Installation is already running.' };
    const controller = new AbortController();
    this.installControllers.set(artifactId, controller);
    approval.state = 'installing'; approval.startedAt = new Date().toISOString(); this.save();
    let timer;
    try {
      const stopped = new Promise((_resolve, reject) => {
        controller.signal.addEventListener('abort', () => reject(new Error('Installation stopped before its outcome was verified.')), { once: true });
        timer = setTimeout(() => controller.abort(), Math.min(artifact.timeBudget, 300000));
      });
      const receipt = await Promise.race([Promise.resolve().then(() => installer(structuredClone(artifact), { signal: controller.signal, artifactHash: approval.artifactHash, userId: approval.userId, requestId: approval.id })), stopped]);
      if (revision !== getStorageAccountRevision()) return { error: 'The account changed during installation. Review the destination before repeating it.' };
      if (receipt?.success !== true || receipt.verified !== true || typeof receipt.receiptId !== 'string' || !receipt.receiptId) throw new Error('Installation returned no verified receipt.');
      if (approval.artifactHash !== await fingerprint(artifact)) throw new Error('The artifact changed during installation. Review the installed destination.');
      approval.state = 'consumed'; approval.receiptId = receipt.receiptId;

    artifact.state = FORGE_STATES.INSTALLED;
    artifact.installedAt = new Date().toISOString();
    
    const version = {
      id: generateVersionId(),
      artifactId,
      version: artifact.version,
      manifest: artifact.manifest,
      installedAt: artifact.installedAt,
      health: { ...artifact.health },
    };
    
    this.versions.set(version.id, version);
    this.artifacts.set(artifactId, artifact);
    this.save();
    
    this.notify("artifact_installed", artifact);
    publish("forge.artifact_installed", artifact);
    recordAudit({ action: "forge.artifact_installed", status: "completed", metadata: { artifactId, version: artifact.version } });
    
    return artifact;
    } catch (error) {
      if (revision === getStorageAccountRevision()) { approval.state = 'uncertain'; try { this.save(); } catch { /* Preserve the last durable installing marker. */ } }
      return { error: error.message || 'Installation outcome is uncertain.', requiresReconciliation: true };
    } finally { clearTimeout(timer); this.installControllers.delete(artifactId); }
  }

  incrementVersion(version) {
    const parts = version.split(".");
    parts[2] = parseInt(parts[2] || 0) + 1;
    return parts.join(".");
  }

  rollbackArtifact(artifactId, targetVersion) {
    const artifact = this.artifacts.get(artifactId);
    if (!artifact) return { error: "Artifact not found" };

    const version = Array.from(this.versions.values()).find(v => v.artifactId === artifactId && v.version === targetVersion);
    if (!version) return { error: "Version not found" };

    artifact.manifest = version.manifest;
    artifact.version = targetVersion;
    artifact.state = FORGE_STATES.ROLLED_BACK;
    artifact.updatedAt = new Date().toISOString();
    
    this.artifacts.set(artifactId, artifact);
    this.save();
    
    this.notify("artifact_rolled_back", { artifactId, targetVersion });
    return artifact;
  }

  disableArtifact(artifactId) {
    const artifact = this.artifacts.get(artifactId);
    if (!artifact) return { error: "Artifact not found" };

    artifact.state = FORGE_STATES.DISABLED;
    artifact.disabledAt = new Date().toISOString();
    this.artifacts.set(artifactId, artifact);
    this.save();
    return artifact;
  }

  revokeArtifact(artifactId, reason) {
    const artifact = this.artifacts.get(artifactId);
    if (!artifact) return { error: "Artifact not found" };

    artifact.state = FORGE_STATES.REVOKED;
    artifact.revokedAt = new Date().toISOString();
    artifact.revokedReason = reason;
    this.artifacts.set(artifactId, artifact);
    this.save();
    
    publish("forge.artifact_revoked", { artifactId, reason });
    recordAudit({ action: "forge.artifact_revoked", status: "completed", metadata: { artifactId, reason } });
    return artifact;
  }

  getValidationReport(artifactId) {
    return this.validationReports.get(artifactId) || null;
  }

  getInstallationApproval(approvalId) {
    return this.installationApprovals.get(approvalId) || null;
  }

  getVersions(artifactId) {
    return Array.from(this.versions.values()).filter(v => v.artifactId === artifactId);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(event, data) {
    this.listeners.forEach(l => {
      try { l(event, data); } catch (err) { console.error("Forge listener error:", err); }
    });
  }
}

export const forgeEngine = new ForgeEngine();

export function createForgeArtifact(input) {
  return forgeEngine.createArtifact(input);
}

export function getForgeArtifact(id) {
  return forgeEngine.getArtifact(id);
}

export function getAllForgeArtifacts() {
  return forgeEngine.getAllArtifacts();
}

export function searchForgeDuplicates(input) {
  return forgeEngine.searchDuplicates(input);
}

export function updateForgeArtifact(id, updates) {
  return forgeEngine.updateArtifact(id, updates);
}

export function setForgeState(id, state) {
  return forgeEngine.setState(id, state);
}

export function generateForgeTests(artifactId) {
  return forgeEngine.generateTests(artifactId);
}

export function runForgeSandboxTests(artifactId) {
  return forgeEngine.runSandboxTests(artifactId);
}

export function setForgeTestRunner(runner) {
  return forgeEngine.setTestRunner(runner);
}

export function validateForgeArtifact(artifactId) {
  return forgeEngine.validateArtifact(artifactId);
}

export function createForgePreview(artifactId) {
  return forgeEngine.createPreview(artifactId);
}

export function requestForgeInstallApproval(artifactId, userId) {
  return forgeEngine.requestInstallApproval(artifactId, userId);
}

export function decideForgeInstallApproval(approvalId, decision, userId) {
  return forgeEngine.decideInstallApproval(approvalId, decision, userId);
}

export function rollbackForgeArtifact(artifactId, targetVersion) {
  return forgeEngine.rollbackArtifact(artifactId, targetVersion);
}

export function disableForgeArtifact(artifactId) {
  return forgeEngine.disableArtifact(artifactId);
}

export function revokeForgeArtifact(artifactId, reason) {
  return forgeEngine.revokeArtifact(artifactId, reason);
}

export function getForgeValidationReport(artifactId) {
  return forgeEngine.getValidationReport(artifactId);
}

export function getForgeInstallationApproval(approvalId) {
  return forgeEngine.getInstallationApproval(approvalId);
}

export function getForgeVersions(artifactId) {
  return forgeEngine.getVersions(artifactId);
}

export function subscribeToForge(listener) {
  return forgeEngine.subscribe(listener);
}

export function forgeAgentDefinition(input) {
  return forgeEngine.createArtifact({
    ...input,
    type: "agent",
  });
}

export function forgeWorkflowDefinition(input) {
  return forgeEngine.createArtifact({
    ...input,
    type: "workflow",
  });
}

export function findExistingAgentForCapability(capability) {
  const artifacts = forgeEngine.getAllArtifacts();
  return artifacts.find(a => a.type === "agent" && a.manifest?.capabilities?.includes(capability)) || null;
}

export { FORGE_STATES, ARTIFACT_TYPES, TRIGGER_TYPES };

export default forgeEngine;

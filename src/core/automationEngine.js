import { readJson, writeJson, subscribeStorageAccount, getStorageAccountRevision } from './infinity/storage.js';
import { calculateNextScheduleRun } from './scheduleCalculator.js';

const RECORDER_STATES = Object.freeze({
  IDLE: "idle",
  RECORDING: "recording",
  PROCESSING: "processing",
  PROPOSAL: "proposal",
  TESTING: "testing",
  APPROVED: "approved",
  INSTALLED: "installed",
});

const WORKFLOW_STATES = Object.freeze({
  DRAFT: "draft",
  TESTED: "tested",
  ENABLED: "enabled",
  DUE: "due",
  ADMITTED: "admitted",
  RUNNING: "running",
  VERIFYING: "verifying",
  SUCCEEDED: "succeeded",
  PARTIAL: "partial",
  FAILED: "failed",
  PAUSED: "paused",
  DISABLED: "disabled",
});

const TRIGGER_TYPES = Object.freeze({
  MANUAL: "manual",
  TEXT: "text",
  VOICE: "voice",
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

const MISSED_RUN_POLICIES = Object.freeze({
  SKIP: "skip",
  RUN_LATEST: "run_latest",
  BOUNDED_CATCH_UP: "bounded_catch_up",
});

const CONTINUE_ON_ERROR = Object.freeze({
  NONE: "none",
  INDEPENDENT_SAFE: "independent_safe",
  ALL: "all",
});

function generateRecorderId() {
  return `rec_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function generateWorkflowId() {
  return `wf_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function generateVersionId() {
  return `ver_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function generateRunId() {
  return `run_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function generateOccurrenceId() {
  return `occ_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

class AutomationEngine {
  constructor() {
    this.recorders = new Map();
    this.workflows = new Map();
    this.versions = new Map();
    this.runs = new Map();
    this.occurrences = new Map();
    this.dedupKeys = new Set();
    this.stepExecutor = null;
    this.listeners = new Set();
    this.controllers = new Set();
    this.scheduleTimers = new Map();
    this.load();
    subscribeStorageAccount(() => {
      for (const controller of this.controllers) controller.abort();
      for (const timer of this.scheduleTimers.values()) clearTimeout(timer);
      this.scheduleTimers.clear();
      this.recorders.clear(); this.workflows.clear(); this.versions.clear(); this.runs.clear(); this.occurrences.clear(); this.dedupKeys.clear();
      this.load();
      this.notify('account_changed', {});
    });
  }

  load() {
    try {
      const parsed = readJson('hey_infinity_automation_engine', {});
      for (const name of ['recorders', 'workflows', 'versions', 'runs', 'occurrences']) {
        if (parsed[name] && typeof parsed[name] === 'object') Object.entries(parsed[name]).forEach(([key, value]) => this[name].set(key, value));
      }
      this.dedupKeys = new Set(Array.isArray(parsed.dedupKeys) ? parsed.dedupKeys : []);
      for (const run of this.runs.values()) if (run.state === 'running') {
        run.state = run.inFlight ? 'interrupted' : 'paused'; run.requiresReconciliation = Boolean(run.inFlight);
        const workflow = this.workflows.get(run.workflowId);
        if (workflow) workflow.state = WORKFLOW_STATES.PAUSED;
      }
    } catch (err) {
      console.warn("Failed to load automation:", err);
    }
  }

  save() {
    const state = { dedupKeys: [...this.dedupKeys] };
    for (const name of ['recorders', 'workflows', 'versions', 'runs', 'occurrences']) state[name] = Object.fromEntries(this[name]);
    if (!writeJson('hey_infinity_automation_engine', state)) throw new Error('Automation checkpoint could not be saved.');
  }

  startRecording(input = {}) {
    const recorderId = generateRecorderId();
    const now = new Date().toISOString();
    
    const recorder = {
      id: recorderId,
      name: input.name || "Untitled Recording",
      description: input.description || "",
      state: RECORDER_STATES.RECORDING,
      excludedApps: input.excludedApps || [],
      excludedPasswordFields: input.excludedPasswordFields !== false,
      steps: [],
      variables: {},
      constants: {},
      appDependencies: [],
      permissions: [],
      successCriteria: input.successCriteria || "",
      startedAt: now,
      stoppedAt: null,
    };

    this.recorders.set(recorderId, recorder);
    this.save();
    this.notify("recording_started", recorder);
    return recorder;
  }

  addRecordingStep(recorderId, step) {
    const recorder = this.recorders.get(recorderId);
    if (!recorder) return { error: "Recorder not found" };
    if (recorder.state !== RECORDER_STATES.RECORDING) return { error: "Not recording" };

    recorder.steps.push({
      id: `step_${Date.now()}`,
      action: step.action,
      target: step.target,
      input: step.input,
      output: step.output,
      timestamp: new Date().toISOString(),
      app: step.app,
      window: step.window,
    });

    this.recorders.set(recorderId, recorder);
    this.save();
    return recorder;
  }

  stopRecording(recorderId) {
    const recorder = this.recorders.get(recorderId);
    if (!recorder) return { error: "Recorder not found" };

    recorder.state = RECORDER_STATES.PROCESSING;
    recorder.stoppedAt = new Date().toISOString();
    this.recorders.set(recorderId, recorder);
    this.save();

    return this.processRecording(recorderId);
  }

  processRecording(recorderId) {
    const recorder = this.recorders.get(recorderId);
    if (!recorder) return { error: "Recorder not found" };

    const workflow = this.generateWorkflowFromRecording(recorder);
    recorder.state = RECORDER_STATES.PROPOSAL;
    recorder.proposedWorkflow = workflow.id;
    this.recorders.set(recorderId, recorder);
    this.save();

    return { recorder, workflow };
  }

  generateWorkflowFromRecording(recorder) {
    const workflowId = generateWorkflowId();
    const now = new Date().toISOString();

    const workflow = {
      id: workflowId,
      name: recorder.name,
      description: recorder.description,
      version: "1.0.0",
      state: WORKFLOW_STATES.DRAFT,
      trigger: { type: TRIGGER_TYPES.MANUAL },
      steps: recorder.steps.map((step, index) => ({
        id: `step_${index}`,
        name: step.action,
        type: "action",
        action: step.action,
        target: step.target,
        input: step.input,
        dependencies: [],
        condition: null,
        wait: null,
        timeout: 30000,
        retry: { maxAttempts: 2, backoff: 1000 },
        approval: null,
        verifier: null,
        compensation: null,
        continueOnError: CONTINUE_ON_ERROR.NONE,
      })),
      variables: recorder.variables,
      constants: recorder.constants,
      appDependencies: [...new Set(recorder.steps.map(s => s.app).filter(Boolean))],
      permissions: [...new Set(recorder.permissions)],
      successCriteria: recorder.successCriteria,
      budget: { maxCost: 100, maxTime: 300000 },
      overlapPolicy: "disallow",
      missedRunPolicy: MISSED_RUN_POLICIES.RUN_LATEST,
      createdAt: now,
      updatedAt: now,
      createdBy: "recorder",
      recorderId: recorder.id,
    };

    this.workflows.set(workflowId, workflow);
    this.save();
    return workflow;
  }

  getRecorder(id) {
    return this.recorders.get(id) || null;
  }

  getAllRecorders() {
    return Array.from(this.recorders.values());
  }

  createWorkflow(input) {
    const workflowId = generateWorkflowId();
    const now = new Date().toISOString();

    const workflow = {
      id: workflowId,
      name: input.name,
      description: input.description || "",
      version: "1.0.0",
      state: WORKFLOW_STATES.DRAFT,
      trigger: input.trigger || { type: TRIGGER_TYPES.MANUAL },
      steps: input.steps || [],
      variables: input.variables || {},
      constants: input.constants || {},
      appDependencies: input.appDependencies || [],
      permissions: input.permissions || [],
      successCriteria: input.successCriteria || "",
      budget: input.budget || { maxCost: 100, maxTime: 300000 },
      overlapPolicy: input.overlapPolicy || "disallow",
      missedRunPolicy: input.missedRunPolicy || MISSED_RUN_POLICIES.RUN_LATEST,
      continueOnError: input.continueOnError || CONTINUE_ON_ERROR.NONE,
      conditions: input.conditions || [],
      branches: input.branches || {},
      waits: input.waits || {},
      timeouts: input.timeouts || {},
      retries: input.retries || { maxAttempts: 2, backoff: 1000 },
      approvals: input.approvals || [],
      verifier: input.verifier || null,
      compensation: input.compensation || {},
      createdAt: now,
      updatedAt: now,
    };

    this.workflows.set(workflowId, workflow);
    this.save();
    this.notify("workflow_created", workflow);
    return workflow;
  }

  getWorkflow(id) {
    return this.workflows.get(id) || null;
  }

  getAllWorkflows() {
    return Array.from(this.workflows.values());
  }

  updateWorkflow(id, updates) {
    const workflow = this.workflows.get(id);
    if (!workflow) return null;
    if (updates.id && updates.id !== id) throw new Error('Workflow identity cannot be changed.');
    if (Array.from(this.runs.values()).some(run => run.workflowId === id && (run.state === 'running' || run.state === 'paused' || run.inFlight || run.requiresReconciliation))) throw new Error('Finish or review the active run before changing its workflow.');

    const updated = { ...workflow, ...updates, updatedAt: new Date().toISOString() };
    this.workflows.set(id, updated);
    this.save();
    this.notify("workflow_updated", updated);
    return updated;
  }

  createVersion(workflowId) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return { error: "Workflow not found" };

    const versionId = generateVersionId();
    const version = {
      id: versionId,
      workflowId,
      version: workflow.version,
      definition: { ...workflow },
      createdAt: new Date().toISOString(),
      createdBy: "user",
    };

    this.versions.set(versionId, version);
    this.save();
    return version;
  }

  getVersions(workflowId) {
    return Array.from(this.versions.values()).filter(v => v.workflowId === workflowId);
  }

  async testWorkflow(workflowId, fixtures = {}) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return { error: "Workflow not found" };
    if (Array.from(this.runs.values()).some(run => run.workflowId === workflowId && (run.inFlight || ['running', 'paused'].includes(run.state) || run.requiresReconciliation))) return { success: false, requiresReconciliation: true, error: 'Review and resume the previous execution before running this workflow again.' };

    const revision = getStorageAccountRevision();

    const runId = generateRunId();
    const run = {
      id: runId,
      workflowId,
      version: workflow.version,
      input: fixtures,
      state: "running",
      stepResults: {},
      startedAt: new Date().toISOString(),
      completedAt: null,
      success: false,
      error: null,
    };

    this.runs.set(runId, run);
    this.save();

    try {
      const results = await this.executeWorkflow(workflow, fixtures, run);
      run.state = "completed";
      run.stepResults = results;
      run.success = Object.values(results).every(result => result.success === true && result.verified === true);
      if (!run.success) run.state = WORKFLOW_STATES.PARTIAL;
      if (run.success) workflow.state = WORKFLOW_STATES.TESTED;
      run.completedAt = new Date().toISOString();
    } catch (error) {
      run.state = "failed";
      run.error = error.message;
      run.completedAt = new Date().toISOString();
    }

    if (revision !== getStorageAccountRevision()) return { ...run, state: 'cancelled', success: false, error: 'The active account changed.' };
    this.runs.set(runId, run);
    this.save();
    return run;
  }

  async executeWorkflow(workflow, input, run = null) {
    if (!Array.isArray(workflow.steps) || !workflow.steps.length || workflow.steps.length > 100 || workflow.steps.some(step => !step?.id) || new Set(workflow.steps.map(step => step.id)).size !== workflow.steps.length) throw new Error('Workflow needs 1 to 100 uniquely identified steps.');
    const results = { ...(run?.stepResults || {}) };
    const revision = getStorageAccountRevision();
    const controller = new AbortController();
    this.controllers.add(controller);
    try {
    for (const step of workflow.steps) {
      if (results[step.id]?.success === true && results[step.id]?.verified === true) continue;
      if (controller.signal.aborted || revision !== getStorageAccountRevision()) throw new Error('Automation cancelled because the account changed.');
      if (run) { run.inFlight = { stepId: step.id, startedAt: new Date().toISOString() }; this.save(); }
      const stepResult = await this.executeStep(step, input, results, { signal: controller.signal });
      if (controller.signal.aborted || revision !== getStorageAccountRevision()) throw new Error('Automation cancelled because the account changed.');
      results[step.id] = stepResult;
      if (run) {
        run.stepResults = { ...results };
        if (stepResult.success === true && stepResult.verified === true) run.inFlight = null;
        else run.requiresReconciliation = true;
        this.save();
      }
      
      if (!stepResult.success) {
        throw new Error(`Step ${step.id} failed: ${stepResult.error}`);
      }
    }

    return results;
    } finally { this.controllers.delete(controller); }
  }

  setStepExecutor(executor) {
    if (typeof executor !== "function") throw new TypeError("Automation step executor must be a function.");
    this.stepExecutor = executor;
  }

  async executeStep(step, input, priorResults, context = {}) {
    if (!this.stepExecutor) {
      return { success: false, verified: false, error: "No automation execution provider is configured." };
    }
    const timeoutMs = step.timeoutMs ?? 60000;
    if (!Number.isFinite(timeoutMs) || timeoutMs < 1 || timeoutMs > 300000) return { success: false, verified: false, error: 'Invalid automation step timeout.' };
    const controller = new AbortController();
    const abort = () => controller.abort(context.signal.reason);
    if (context.signal?.aborted) abort(); else context.signal?.addEventListener('abort', abort, { once: true });
    let timer;
    try {
      controller.signal.throwIfAborted();
      const stopped = new Promise((_resolve, reject) => {
        controller.signal.addEventListener('abort', () => reject(controller.signal.reason || new Error('Automation cancelled.')), { once: true });
        timer = setTimeout(() => controller.abort(new Error('Automation step timed out.')), timeoutMs);
      });
      const result = await Promise.race([Promise.resolve().then(() => this.stepExecutor(step, input, priorResults, { ...context, signal: controller.signal })), stopped]);
      if (!result || result.success !== true || result.verified !== true) return { success: false, verified: false, error: result?.error || 'Automation step was not verified.' };
      return result;
    } catch (error) { return { success: false, verified: false, requiresReconciliation: true, error: error.message || 'Automation outcome is uncertain.' }; }
    finally { clearTimeout(timer); context.signal?.removeEventListener('abort', abort); }
  }

  enableWorkflow(workflowId) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return { error: "Workflow not found" };
    if (Array.from(this.runs.values()).some(run => run.workflowId === workflowId && (run.inFlight || ['running', 'paused'].includes(run.state) || run.requiresReconciliation))) return { error: 'Review and resume the interrupted execution before enabling this workflow.', requiresReconciliation: true };
    if (!Array.isArray(workflow.steps) || !workflow.steps.length) return { error: 'Add executable steps before enabling this workflow.' };
    if (workflow.trigger?.type === TRIGGER_TYPES.SCHEDULE && !this.calculateNextRun(workflow.trigger.schedule)) return { error: 'The schedule is invalid or has no supported future occurrence.' };

    workflow.state = WORKFLOW_STATES.ENABLED;
    workflow.enabledAt = new Date().toISOString();
    this.workflows.set(workflowId, workflow);
    this.save();
    
    if (workflow.trigger.type === TRIGGER_TYPES.SCHEDULE) {
      this.scheduleWorkflow(workflowId);
    }
    
    this.notify("workflow_enabled", workflow);
    return workflow;
  }

  disableWorkflow(workflowId) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return { error: "Workflow not found" };

    workflow.state = WORKFLOW_STATES.DISABLED;
    workflow.disabledAt = new Date().toISOString();
    this.workflows.set(workflowId, workflow);
    this.save();
    
    this.unscheduleWorkflow(workflowId);
    this.notify("workflow_disabled", workflow);
    return workflow;
  }

  scheduleWorkflow(workflowId) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow || workflow.trigger.type !== TRIGGER_TYPES.SCHEDULE) return;
    this.unscheduleWorkflow(workflowId);

    const schedule = workflow.trigger.schedule;
    if (!schedule) return;

    const nextRun = this.calculateNextRun(schedule);
    if (!nextRun) return;

    const occurrenceId = generateOccurrenceId();
    const occurrence = {
      id: occurrenceId,
      workflowId,
      scheduledAt: nextRun.toISOString(),
      state: "pending",
      createdAt: new Date().toISOString(),
    };

    this.occurrences.set(occurrenceId, occurrence);
    this.save();

    const revision = getStorageAccountRevision();
    const arm = () => {
      if (revision !== getStorageAccountRevision() || this.getWorkflow(workflowId)?.state !== WORKFLOW_STATES.ENABLED) return;
      const remaining = nextRun.getTime() - Date.now();
      if (remaining <= 0) { this.scheduleTimers.delete(workflowId); void this.admitOccurrence(occurrenceId).catch(() => {}); return; }
      const timer = setTimeout(arm, Math.min(remaining, 2147483647));
      timer.unref?.(); this.scheduleTimers.set(workflowId, timer);
    };
    arm();
  }

  unscheduleWorkflow(workflowId) {
    clearTimeout(this.scheduleTimers.get(workflowId)); this.scheduleTimers.delete(workflowId);
    for (const [id, occ] of this.occurrences) {
      if (occ.workflowId === workflowId && occ.state === "pending") {
        this.occurrences.delete(id);
      }
    }
    this.save();
  }

  calculateNextRun(schedule) {
    return calculateNextScheduleRun(schedule);
  }

  async admitOccurrence(occurrenceId) {
    const occurrence = this.occurrences.get(occurrenceId);
    if (!occurrence || occurrence.state !== 'pending') return;

    const workflow = this.workflows.get(occurrence.workflowId);
    if (!workflow || workflow.state !== WORKFLOW_STATES.ENABLED) {
      occurrence.state = "skipped";
      this.occurrences.set(occurrenceId, occurrence);
      this.save();
      return;
    }

    if (workflow.overlapPolicy === "disallow") {
      const running = Array.from(this.runs.values()).some(r => 
        r.workflowId === occurrence.workflowId && r.state === "running"
      );
      if (running) {
        occurrence.state = "skipped_overlap";
        this.occurrences.set(occurrenceId, occurrence);
        this.save();
        return;
      }
    }

    occurrence.state = "admitted";
    this.occurrences.set(occurrenceId, occurrence);
    this.save();

    return this.executeWorkflowRun(occurrenceId);
  }

  async executeWorkflowRun(occurrenceId) {
    const revision = getStorageAccountRevision();
    const occurrence = this.occurrences.get(occurrenceId);
    if (!occurrence || occurrence.state !== 'admitted') return;

    const workflow = this.workflows.get(occurrence.workflowId);
    if (!workflow) return;

    const runId = generateRunId();
    const run = {
      id: runId,
      workflowId: occurrence.workflowId,
      occurrenceId,
      version: workflow.version,
      input: {},
      state: WORKFLOW_STATES.RUNNING,
      stepResults: {},
      startedAt: new Date().toISOString(),
      completedAt: null,
      success: false,
      error: null,
    };

    this.runs.set(runId, run);
    occurrence.state = 'running';
    this.save();

    try {
      const results = await this.executeWorkflow(workflow, {}, run);
      run.state = WORKFLOW_STATES.SUCCEEDED;
      run.stepResults = results;
      run.success = Object.values(results).every(result => result.success === true && result.verified === true);
      if (!run.success) run.state = WORKFLOW_STATES.PARTIAL;
      run.completedAt = new Date().toISOString();
    } catch (error) {
      run.state = WORKFLOW_STATES.FAILED;
      run.error = error.message;
      run.completedAt = new Date().toISOString();
    }

    if (revision !== getStorageAccountRevision()) return { ...run, state: 'cancelled', success: false, error: 'The active account changed.' };
    this.runs.set(runId, run);
    this.occurrences.set(occurrenceId, { ...occurrence, state: "completed", completedAt: new Date().toISOString() });
    this.save();

    if (run.success) this.scheduleNextOccurrence(occurrence.workflowId);
    else { workflow.state = WORKFLOW_STATES.PAUSED; this.save(); }
    this.notify("workflow_run_completed", run);
  }

  scheduleNextOccurrence(workflowId) {
    return this.scheduleWorkflow(workflowId);
  }

  getRun(id) {
    return this.runs.get(id) || null;
  }

  getAllRuns() {
    return Array.from(this.runs.values());
  }

  reconcileRun(runId, outcome, evidence) {
    const run = this.runs.get(runId);
    if (!run?.inFlight || run.state === 'running') throw new Error('Only an interrupted automation step can be reviewed.');
    if (!['completed', 'not-executed'].includes(outcome) || typeof evidence !== 'string' || evidence.trim().length < 10 || evidence.length > 4000) throw new Error('Record the observed outcome and the external state or receipt you checked.');
    const review = { stepId: run.inFlight.stepId, outcome, evidence: evidence.trim(), source: 'user-review', reviewedAt: new Date().toISOString() };
    run.reviews = [...(run.reviews || []), review];
    if (outcome === 'completed') run.stepResults[run.inFlight.stepId] = { success: true, verified: true, output: evidence.trim(), verificationSource: 'user-review' };
    else delete run.stepResults[run.inFlight.stepId];
    run.inFlight = null; run.requiresReconciliation = false; run.state = 'paused';
    this.save(); return run;
  }

  async resumeRun(runId) {
    const run = this.runs.get(runId);
    const workflow = run && this.workflows.get(run.workflowId);
    if (!run || !workflow || run.inFlight || run.requiresReconciliation || run.state !== 'paused' || workflow.version !== run.version) return { success: false, error: 'Review the interrupted step and preserve its workflow version before resuming.' };
    const revision = getStorageAccountRevision();
    run.state = 'running'; run.error = null; this.save();
    try {
      run.stepResults = await this.executeWorkflow(workflow, run.input, run);
      run.success = true; run.state = 'succeeded'; run.completedAt = new Date().toISOString();
    } catch (error) { run.success = false; run.state = 'failed'; run.error = error.message; }
    if (revision !== getStorageAccountRevision()) return { success: false, state: 'cancelled', error: 'The active account changed.' };
    this.save(); this.notify('workflow_run_completed', run); return run;
  }

  getOccurrence(id) {
    return this.occurrences.get(id) || null;
  }

  getAllOccurrences() {
    return Array.from(this.occurrences.values());
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(event, data) {
    this.listeners.forEach(l => {
      try { l(event, data); } catch (err) { console.error("Automation listener error:", err); }
    });
  }
}

export const automationEngine = new AutomationEngine();

export function startRecording(input) {
  return automationEngine.startRecording(input);
}

export function addRecordingStep(recorderId, step) {
  return automationEngine.addRecordingStep(recorderId, step);
}

export function stopRecording(recorderId) {
  return automationEngine.stopRecording(recorderId);
}

export function getRecorder(id) {
  return automationEngine.getRecorder(id);
}

export function getAllRecorders() {
  return automationEngine.getAllRecorders();
}

export function createWorkflow(input) {
  return automationEngine.createWorkflow(input);
}

export function getWorkflow(id) {
  return automationEngine.getWorkflow(id);
}

export function getAllWorkflows() {
  return automationEngine.getAllWorkflows();
}

export function updateWorkflow(id, updates) {
  return automationEngine.updateWorkflow(id, updates);
}

export function createWorkflowVersion(workflowId) {
  return automationEngine.createVersion(workflowId);
}

export function getWorkflowVersions(workflowId) {
  return automationEngine.getVersions(workflowId);
}

export function testWorkflow(workflowId, fixtures) {
  return automationEngine.testWorkflow(workflowId, fixtures);
}

export function setAutomationStepExecutor(executor) {
  return automationEngine.setStepExecutor(executor);
}

export function enableWorkflow(workflowId) {
  return automationEngine.enableWorkflow(workflowId);
}

export function disableWorkflow(workflowId) {
  return automationEngine.disableWorkflow(workflowId);
}

export function getWorkflowRun(id) {
  return automationEngine.getRun(id);
}

export function getAllWorkflowRuns() {
  return automationEngine.getAllRuns();
}

export function subscribeToAutomation(listener) {
  return automationEngine.subscribe(listener);
}

export { RECORDER_STATES, WORKFLOW_STATES, TRIGGER_TYPES, MISSED_RUN_POLICIES, CONTINUE_ON_ERROR };

export default automationEngine;

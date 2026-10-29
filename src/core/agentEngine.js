import { publish } from "./eventBus.js";
import { runQualityGate } from './infinity/qualityGate.js';
import { readJson, writeJson, subscribeStorageAccount, getStorageAccountRevision } from './infinity/storage.js';

const AGENT_STATES = Object.freeze({
  REGISTERED: "registered",
  HEALTHY: "healthy",
  DEGRADED: "degraded",
  ASSIGNED: "assigned",
  RUNNING: "running",
  RESULT_SUBMITTED: "result_submitted",
  VERIFYING: "verifying",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  PAUSED: "paused",
  RETIRED: "retired",
});

const TEAM_TEMPLATES = Object.freeze({
  RESEARCH: "research",
  BUILD: "build",
  DESIGN: "design",
  LAUNCH: "launch",
  STUDY: "study",
  SECURITY: "security",
  CREATOR: "creator",
  DATA: "data",
});

function generateAgentId() {
  return `agent_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function generateTeamId() {
  return `team_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function generateRunId() {
  return `run_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

class AgentEngine {
  constructor() {
    this.agents = new Map();
    this.teams = new Map();
    this.runs = new Map();
    this.verifiers = new Map();
    this.executors = new Map();
    this.healthMetrics = new Map();
    this.listeners = new Set();
    this.controllers = new Map();
    this.load();
    subscribeStorageAccount(() => {
      for (const controller of this.controllers.values()) controller.abort();
      this.agents.clear(); this.teams.clear(); this.runs.clear(); this.verifiers.clear(); this.executors.clear(); this.healthMetrics.clear();
      this.load(); this.notify('account_changed', {});
    });
  }

  load() {
    try {
      const parsed = readJson('hey_infinity_agent_engine', {});
      for (const name of ['agents', 'teams', 'runs', 'verifiers', 'healthMetrics']) if (parsed[name] && typeof parsed[name] === 'object') Object.entries(parsed[name]).forEach(([key, value]) => this[name].set(key, value));
      for (const run of this.runs.values()) if (['planning', 'specialists_running', 'integrating', 'verifying', 'running'].includes(run.state)) { run.state = 'interrupted'; run.requiresReconciliation = true; }
    } catch (err) {
      console.warn("Failed to load agents:", err);
    }
  }

  save() {
    const state = {};
    for (const name of ['agents', 'teams', 'runs', 'verifiers', 'healthMetrics']) state[name] = Object.fromEntries(this[name]);
    if (!writeJson('hey_infinity_agent_engine', state)) throw new Error('Agent checkpoint could not be saved.');
  }

  registerAgent(manifest) {
    const agentId = manifest.id || generateAgentId();
    const now = new Date().toISOString();
    
    const agent = {
      id: agentId,
      version: manifest.version || "1.0.0",
      name: manifest.name,
      displayName: manifest.displayName || manifest.name,
      category: manifest.category,
      purpose: manifest.purpose,
      scope: manifest.scope,
      inputSchema: manifest.inputSchema,
      outputSchema: manifest.outputSchema,
      allowedTools: manifest.allowedTools || [],
      requiredPermissions: manifest.requiredPermissions || [],
      riskLevel: manifest.riskLevel || "low",
      providerConstraints: manifest.providerConstraints || {},
      contextLimits: manifest.contextLimits || { maxTokens: 4000 },
      timeout: manifest.timeout || 30000,
      retries: manifest.retries || 2,
      verifier: manifest.verifier || null,
      tests: manifest.tests || [],
      health: { successRate: 0, latency: 0, errorRate: 0, verifierRejectionRate: 0, cost: 0 },
      state: AGENT_STATES.REGISTERED,
      dependencies: manifest.dependencies || [],
      owner: manifest.owner || "system",
      createdAt: now,
      updatedAt: now,
    };

    this.agents.set(agentId, agent);
    if (typeof manifest.execute === "function") this.executors.set(agentId, manifest.execute);
    this.healthMetrics.set(agentId, agent.health);
    this.save();
    this.notify("agent_registered", agent);
    return agent;
  }

  setAgentExecutor(agentId, executor) {
    if (!this.agents.has(agentId)) throw new Error(`Agent ${agentId} is not registered.`);
    if (typeof executor !== "function") throw new TypeError("Agent executor must be a function.");
    this.executors.set(agentId, executor);
  }

  getAgent(id) {
    return this.agents.get(id) || null;
  }

  getAllAgents() {
    return Array.from(this.agents.values());
  }

  getAgentsByCategory(category) {
    return this.getAllAgents().filter(a => a.category === category);
  }

  updateAgent(id, updates) {
    const agent = this.agents.get(id);
    if (!agent) return null;

    const updated = { ...agent, ...updates, updatedAt: new Date().toISOString() };
    this.agents.set(id, updated);
    this.save();
    this.notify("agent_updated", updated);
    return updated;
  }

  setAgentState(id, state) {
    const agent = this.agents.get(id);
    if (!agent) return null;

    agent.state = state;
    agent.updatedAt = new Date().toISOString();
    this.agents.set(id, agent);
    this.save();
    this.notify("agent_state_changed", { id, state });
    return agent;
  }

  createTeam(input) {
    const teamId = generateTeamId();
    const now = new Date().toISOString();
    
    const team = {
      id: teamId,
      name: input.name,
      template: input.template,
      purpose: input.purpose,
      agents: input.agents || [],
      planner: input.planner || null,
      integrator: input.integrator || null,
      verifier: input.verifier || null,
      permissions: input.permissions || [],
      budget: input.budget || { maxCost: 100, maxTime: 3600000 },
      qualityGates: input.qualityGates || [],
      maxConcurrentSpecialists: input.maxConcurrentSpecialists ?? 4,
      state: "active",
      createdAt: now,
      updatedAt: now,
    };

    this.teams.set(teamId, team);
    this.save();
    this.notify("team_created", team);
    return team;
  }

  getTeam(id) {
    return this.teams.get(id) || null;
  }

  getAllTeams() {
    return Array.from(this.teams.values());
  }

  runTeam(teamId, input) {
    const team = this.teams.get(teamId);
    if (!team) return { error: "Team not found" };
    if (!Array.isArray(team.agents) || !team.agents.length || !Number.isInteger(team.maxConcurrentSpecialists) || team.maxConcurrentSpecialists < 1 || team.maxConcurrentSpecialists > 16) return { error: 'Choose specialists and a concurrency limit between 1 and 16.' };
    if (new Set(team.agents).size !== team.agents.length) return { error: 'Each specialist must have a distinct identity.' };
    if (!team.planner || !team.integrator || !team.verifier || team.verifier === team.planner || team.verifier === team.integrator || team.agents.includes(team.verifier)) return { error: 'A team needs a planner, integrator and a separate verifier.' };
    if ([team.planner, ...team.agents, team.integrator, team.verifier].some(id => !this.agents.has(id) || !this.executors.has(id))) return { error: 'Every selected role needs a configured execution provider.' };
    if (Array.from(this.runs.values()).some(run => run.teamId === teamId && (run.requiresReconciliation || ['planning', 'specialists_running', 'integrating', 'verifying'].includes(run.state)))) return { error: 'Review the previous team run before starting another.', requiresReconciliation: true };

    const runId = generateRunId();
    const run = {
      id: runId,
      teamId,
      input,
      state: "planning",
      plannerOutput: null,
      specialistResults: {},
      integratorOutput: null,
      verifierResult: null,
      finalOutput: null,
      startedAt: new Date().toISOString(),
      completedAt: null,
      cost: 0,
      health: {},
    };

    this.runs.set(runId, run);
    this.save();
    void this.executeTeamRun(runId).catch(() => {});
    return run;
  }

  async executeTeamRun(runId) {
    const run = this.runs.get(runId);
    if (!run) return;

    const team = this.teams.get(run.teamId);
    if (!team) return;
    const revision = getStorageAccountRevision();
    const controller = new AbortController();
    this.controllers.set(runId, controller);
    const execute = async (agent, input) => {
      if (controller.signal.aborted || revision !== getStorageAccountRevision()) throw new Error('Agent team cancelled.');
      const result = await this.executeAgent(agent, input, { signal: controller.signal });
      if (controller.signal.aborted || revision !== getStorageAccountRevision()) throw new Error('Agent team cancelled.');
      if (!result.success) throw new Error(result.error || 'A required agent did not complete.');
      return result;
    };

    try {
      run.state = "planning";
      this.notify("run_progress", run);
      
      const planner = this.agents.get(team.planner);
      if (planner) {
        run.plannerOutput = await execute(planner, run.input);
      }

      run.state = "specialists_running";
      this.notify("run_progress", run);

      let cursor = 0;
      const worker = async () => {
        while (cursor < team.agents.length) {
          const agentId = team.agents[cursor++];
          run.specialistResults[agentId] = await execute(this.agents.get(agentId), run.input);
          this.save();
        }
      };
      await Promise.all(Array.from({ length: Math.min(team.maxConcurrentSpecialists, team.agents.length) }, worker));

      run.state = "integrating";
      this.notify("run_progress", run);

      const integrator = this.agents.get(team.integrator);
      if (integrator) {
        run.integratorOutput = await execute(integrator, {
          input: run.input,
          specialistResults: run.specialistResults,
        });
      }

      run.state = "verifying";
      this.notify("run_progress", run);
      const quality = await runQualityGate(run.integratorOutput.value, {}, ['non-empty', ...team.qualityGates]);
      if (!quality.ok) throw new Error('The integrated output failed its required quality checks.');

      const verifier = this.agents.get(team.verifier);
      if (verifier) {
        run.verifierResult = await execute(verifier, {
          input: run.input,
          integratorOutput: run.integratorOutput,
        });
        
        if (!run.verifierResult.success || run.verifierResult.value?.accepted !== true) {
          run.state = "rejected";
          run.completedAt = new Date().toISOString();
          this.save();
          this.notify("run_completed", run);
          return;
        }
      }

      run.finalOutput = run.integratorOutput.value;
      run.state = "accepted";
      run.completedAt = new Date().toISOString();
      
      this.save();
      this.notify("run_completed", run);
      publish("agent.team_run_completed", run);
    } catch (error) {
      controller.abort();
      if (revision !== getStorageAccountRevision()) return;
      if (run.state === 'cancelled') return;
      run.state = "failed";
      run.requiresReconciliation = true;
      run.error = error.message;
      run.completedAt = new Date().toISOString();
      this.save();
      this.notify("run_failed", run);
    } finally { this.controllers.delete(runId); }
  }

  async executeAgent(agent, input, context = {}) {
    const revision = getStorageAccountRevision();
    const runId = generateRunId();
    const agentRun = {
      id: runId,
      agentId: agent.id,
      input,
      state: AGENT_STATES.RUNNING,
      output: null,
      error: null,
      startedAt: new Date().toISOString(),
      completedAt: null,
      cost: 0,
      latency: 0,
    };

    this.runs.set(runId, agentRun);
    this.save();
    
    try {
      const output = await this.callAgent(agent, input, context);
      if (revision !== getStorageAccountRevision()) throw new Error('The active account changed.');
      agentRun.output = output;
      agentRun.state = AGENT_STATES.RESULT_SUBMITTED;
      agentRun.completedAt = new Date().toISOString();
      agentRun.latency = new Date() - new Date(agentRun.startedAt);
      
      this.updateHealthMetrics(agent.id, true, agentRun.latency, 0);
      return { success: true, output: agentRun.output, value: output.output, runId };
    } catch (error) {
      if (revision !== getStorageAccountRevision()) return { success: false, error: 'The active account changed.', runId };
      agentRun.error = error.message;
      agentRun.state = AGENT_STATES.REJECTED;
      agentRun.completedAt = new Date().toISOString();
      
      this.updateHealthMetrics(agent.id, false, 0, 0);
      return { success: false, error: error.message, runId };
    }
  }

  async callAgent(agent, input, context = {}) {
    const executor = this.executors.get(agent.id);
    if (!executor) throw new Error(`No execution provider is configured for agent ${agent.id}.`);

    const controller = new AbortController();
    const abort = () => controller.abort(context.signal.reason);
    if (context.signal?.aborted) abort(); else context.signal?.addEventListener('abort', abort, { once: true });
    const timeoutMs = agent.timeout ?? 60000;
    if (!Number.isFinite(timeoutMs) || timeoutMs < 1 || timeoutMs > 300000) throw new Error('Invalid agent timeout.');
    let timer;
    let result;
    try {
      controller.signal.throwIfAborted();
      const stopped = new Promise((_resolve, reject) => {
        controller.signal.addEventListener('abort', () => reject(controller.signal.reason || new Error('Agent cancelled.')), { once: true });
        timer = setTimeout(() => controller.abort(new Error('Agent timed out.')), timeoutMs);
      });
      result = await Promise.race([Promise.resolve().then(() => executor(input, agent, { ...context, signal: controller.signal })), stopped]);
    } finally { clearTimeout(timer); context.signal?.removeEventListener('abort', abort); }
    if (!result || result.success !== true || result.verified !== true) {
      throw new Error(`Agent ${agent.id} did not return a verified success result.`);
    }
    if (result.output == null || (typeof result.output === 'string' && !result.output.trim()) || (typeof result.output === 'object' && !Object.keys(result.output).length)) throw new Error(`Agent ${agent.id} returned no usable output.`);
    return result;
  }

  cancelRun(runId) {
    const run = this.runs.get(runId);
    if (!run || !this.controllers.has(runId)) return { success: false, error: 'No active team run was found.' };
    run.state = 'cancelled'; run.requiresReconciliation = true; run.completedAt = new Date().toISOString();
    this.save(); this.controllers.get(runId).abort(); this.notify('run_completed', run);
    return { success: true, run };
  }

  updateHealthMetrics(agentId, success, latency, cost) {
    const metrics = this.healthMetrics.get(agentId) || { successRate: 0, latency: 0, errorRate: 0, verifierRejectionRate: 0, cost: 0, totalRuns: 0 };
    metrics.totalRuns++;
    
    if (success) {
      metrics.successRate = (metrics.successRate * (metrics.totalRuns - 1) + 1) / metrics.totalRuns;
    } else {
      metrics.successRate = (metrics.successRate * (metrics.totalRuns - 1)) / metrics.totalRuns;
    }
    
    metrics.latency = (metrics.latency * (metrics.totalRuns - 1) + latency) / metrics.totalRuns;
    metrics.cost = (metrics.cost * (metrics.totalRuns - 1) + cost) / metrics.totalRuns;
    metrics.errorRate = 1 - metrics.successRate;
    
    this.healthMetrics.set(agentId, metrics);
    
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.health = metrics;
      this.agents.set(agentId, agent);
    }
    
    this.save();
  }

  getHealthMetrics(agentId) {
    return this.healthMetrics.get(agentId) || null;
  }

  registerVerifier(verifierManifest) {
    const verifierId = `verifier_${Date.now()}`;
    const verifier = {
      id: verifierId,
      ...verifierManifest,
      state: "active",
      createdAt: new Date().toISOString(),
    };
    this.verifiers.set(verifierId, verifier);
    this.save();
    return verifier;
  }

  getVerifier(id) {
    return this.verifiers.get(id) || null;
  }

  getAllVerifiers() {
    return Array.from(this.verifiers.values());
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(event, data) {
    this.listeners.forEach(l => {
      try { l(event, data); } catch (err) { console.error("Agent listener error:", err); }
    });
  }
}

export const agentEngine = new AgentEngine();

export function registerAgent(manifest) {
  return agentEngine.registerAgent(manifest);
}

export function getAgent(id) {
  return agentEngine.getAgent(id);
}

export function getAllAgents() {
  return agentEngine.getAllAgents();
}

export function getAgentsByCategory(category) {
  return agentEngine.getAgentsByCategory(category);
}

export function updateAgent(id, updates) {
  return agentEngine.updateAgent(id, updates);
}

export function setAgentState(id, state) {
  return agentEngine.setAgentState(id, state);
}

export function createTeam(input) {
  return agentEngine.createTeam(input);
}

export function getTeam(id) {
  return agentEngine.getTeam(id);
}

export function getAllTeams() {
  return agentEngine.getAllTeams();
}

export function runTeam(teamId, input) {
  return agentEngine.runTeam(teamId, input);
}

export function setAgentExecutor(agentId, executor) {
  return agentEngine.setAgentExecutor(agentId, executor);
}

export function registerVerifier(manifest) {
  return agentEngine.registerVerifier(manifest);
}

export function getVerifier(id) {
  return agentEngine.getVerifier(id);
}

export function getAllVerifiers() {
  return agentEngine.getAllVerifiers();
}

export function subscribeToAgents(listener) {
  return agentEngine.subscribe(listener);
}

export { AGENT_STATES, TEAM_TEMPLATES };

export default agentEngine;

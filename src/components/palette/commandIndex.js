/**
 * Command index builder for the Command Palette.
 * Pure function — builds a unified index from all command sources.
 */

import { parseNaturalCommand } from '../../core/commandParser.js';
import { HEY_PAGES, resolvePageCommand } from '../../core/navigationCatalog.js';
import { PLAN_CATALOG } from '../../core/planCatalog.js';
import { HEY_FEATURES } from '../../core/featureCatalog.js';
import { listTools } from '../../core/toolRegistry.js';
import { getAvailableAgents } from '../../core/agentRouter.js';
import { declareStandardCapabilities, getCapabilityAvailability, getRelayRequiredMessage, PLATFORMS } from '../../core/platformCapabilities.js';
import { getSurfaceMode } from '../../core/surfaceModes.js';

const STATE_MAP = {
  available: 'native',
  permission_required: 'bridged',
  restricted: 'relay-required',
  unsupported: 'unavailable',
};

function inferCapabilityFromCommand(command) {
  const id = command.id || '';
  const label = (command.label || '').toLowerCase();

  // Navigation commands
  if (id.startsWith('/') || label.includes('open') || label.includes('go to')) {
    return 'navigation.navigate';
  }

  // Voice commands
  if (label.includes('voice') || label.includes('speak') || label.includes('listen')) {
    return 'voice.listen';
  }

  // Creation/forge commands
  if (label.includes('create') || label.includes('generate') || label.includes('build') || label.includes('forge')) {
    return 'artifact.write';
  }

  // Computer control
  if (label.includes('computer') || label.includes('app') || label.includes('terminal') || label.includes('file')) {
    return 'computer.open_app';
  }

  // Memory
  if (label.includes('memory') || label.includes('remember') || label.includes('recall')) {
    return 'memory.read';
  }

  // Settings
  if (label.includes('setting') || label.includes('preference') || label.includes('config')) {
    return 'settings.write';
  }

  return 'general.action';
}

function inferCapabilityFromAgent(agent) {
  const caps = agent.capabilities || [];
  if (caps.includes('research') || caps.includes('web.search')) return 'web.search';
  if (caps.includes('code') || caps.includes('code.edit') || caps.includes('code.run')) return 'code.edit';
  if (caps.includes('generate') || caps.includes('artifact.write')) return 'artifact.write';
  if (caps.includes('memory.read') || caps.includes('memory.write')) return 'memory.read';
  if (caps.includes('computer') || caps.includes('device')) return 'computer.open_app';
  return 'agent.invoke';
}

function inferCapabilityFromFeature(feature) {
  const cat = feature.category.toLowerCase();
  if (cat === 'execution') return 'action.execute';
  if (cat === 'voice') return 'voice.listen';
  if (cat === 'research') return 'web.search';
  if (cat === 'creative') return 'artifact.write';
  if (cat === 'forge') return 'forge.create';
  if (cat === 'memory') return 'memory.read';
  if (cat === 'trust') return 'permission.manage';
  return 'feature.access';
}

function inferCapabilityFromTool(tool) {
  const caps = tool.metadata?.capabilities || [];
  if (caps.length > 0) return caps[0];
  const perm = tool.metadata?.permission || tool.metadata?.permissions?.[0];
  if (perm) return perm;
  return 'tool.execute';
}

export function buildCommandIndex(platform = 'web') {
  // Ensure capabilities are declared
  declareStandardCapabilities();

  const index = [];
  const seenIds = new Set();

  function addRow(row) {
    const key = row.id;
    if (seenIds.has(key)) return;
    seenIds.add(key);
    index.push(row);
  }

  // 1. Navigation commands from HEY_PAGES
  for (const page of HEY_PAGES) {
    addRow({
      id: `nav:${page.id}`,
      type: 'navigate',
      label: page.title,
      description: page.keywords,
      path: page.path,
      group: page.group,
      primary: page.primary,
      keywords: page.keywords,
      capabilityId: 'navigation.navigate',
      platform,
    });
  }

  // 2. Feature catalog entries (as discoverable capabilities)
  for (const feature of HEY_FEATURES) {
    addRow({
      id: `feature:${feature.id}`,
      type: 'feature',
      label: feature.name,
      description: feature.description,
      category: feature.category,
      status: feature.status,
      capabilityId: inferCapabilityFromFeature(feature),
      platform,
    });
  }

  // 3. Registered tools from toolRegistry
  const tools = listTools();
  for (const tool of tools) {
    addRow({
      id: `tool:${tool.name}`,
      type: 'command',
      label: tool.name,
      description: tool.metadata?.description || tool.metadata?.confirmationReason || `Run ${tool.name}`,
      metadata: tool.metadata,
      capabilityId: inferCapabilityFromTool(tool),
      platform,
    });
  }

  // 4. Available agents
  const agents = getAvailableAgents();
  for (const agent of agents) {
    addRow({
      id: `agent:${agent.id}`,
      type: 'agent',
      label: agent.name,
      description: agent.description || agent.purpose || 'Specialist agent',
      role: agent.role,
      capabilities: agent.capabilities,
      intents: agent.intents,
      capabilityId: inferCapabilityFromAgent(agent),
      platform,
    });
  }

  // 5. Surface modes (teacher, coach, study, focus from F-11 spec)
  const surfaceModes = [
    { id: 'teacher', name: 'Teacher', purpose: 'Plan, prepare, print' },
    { id: 'coach', name: 'Coach', purpose: 'Review runs, check evidence' },
    { id: 'study', name: 'Study', purpose: 'Learn, be quizzed, take notes' },
    { id: 'focus', name: 'Focus', purpose: 'Deep work session with timer' },
  ];
  for (const mode of surfaceModes) {
    addRow({
      id: `mode:${mode.id}`,
      type: 'mode',
      label: mode.name,
      description: mode.purpose,
      capabilityId: 'mode.switch',
      platform,
    });
  }

  // 6. Plan catalog (subscription actions)
  for (const [planId, plan] of Object.entries(PLAN_CATALOG)) {
    addRow({
      id: `plan:${planId}`,
      type: 'plan',
      label: plan.name,
      description: plan.tagline,
      price: plan.price,
      capabilityId: 'billing.change_plan',
      platform,
    });
  }

  // 7. Built-in command parser patterns (from commandParser.js)
  const parserCommands = [
    { id: 'cmd:reminder', label: 'Set Reminder', description: 'Remind me to do something at a time', capabilityId: 'notification.create' },
    { id: 'cmd:expense', label: 'Log Expense', description: 'Record a purchase or spending', capabilityId: 'finance.log_expense' },
    { id: 'cmd:task', label: 'Create Task', description: 'Add a task or to-do item', capabilityId: 'task.create' },
    { id: 'cmd:search', label: 'Web Search', description: 'Search the web for information', capabilityId: 'web.search' },
    { id: 'cmd:read', label: 'Read/Summarize', description: 'Read and summarize a document or page', capabilityId: 'document.read' },
    { id: 'cmd:save', label: 'Save Memory', description: 'Remember something for later', capabilityId: 'memory.write' },
    { id: 'cmd:screen', label: 'Inspect Screen', description: 'Analyze what is on screen', capabilityId: 'vision.inspect_screen' },
  ];
  for (const cmd of parserCommands) {
    addRow({
      ...cmd,
      type: 'command',
      platform,
    });
  }

  return index;
}

export function resolveCommandRow(row, platform = 'web') {
  // Returns the executable action for a row, or null if not resolvable
  switch (row.type) {
    case 'navigate':
      return { kind: 'navigate', path: row.path };
    case 'command':
      if (row.id.startsWith('tool:')) {
        return { kind: 'tool', toolName: row.id.slice(5) };
      }
      if (row.id.startsWith('cmd:')) {
        return { kind: 'parser', commandId: row.id };
      }
      return { kind: 'command', commandId: row.id };
    case 'agent':
      return { kind: 'agent', agentId: row.id.slice(6) };
    case 'mode':
      return { kind: 'mode', modeId: row.id.slice(5) };
    case 'feature':
      return { kind: 'feature', featureId: row.id.slice(8) };
    case 'plan':
      return { kind: 'plan', planId: row.id.slice(5) };
    default:
      return null;
  }
}

export function getCapabilityAvailabilityForRow(row, platform = 'web') {
  const capabilityId = row.capabilityId;
  if (!capabilityId) {
    return { available: true, state: 'native', reason: null };
  }

  const availability = getCapabilityAvailability(capabilityId, platform);
  const mappedState = STATE_MAP[availability.state] || 'unavailable';

  if (availability.available) {
    return { available: true, state: 'native', reason: null };
  }

  if (availability.requiresPermission) {
    return {
      available: true,
      state: 'bridged',
      reason: `Requires permission: ${capabilityId}`,
    };
  }

  if (availability.restricted) {
    const reason = getRelayRequiredMessage(capabilityId, platform);
    return {
      available: false,
      state: 'relay-required',
      reason,
    };
  }

  return {
    available: false,
    state: 'unavailable',
    reason: `${capabilityId} is not supported on ${platform}`,
  };
}

export default {
  buildCommandIndex,
  resolveCommandRow,
  getCapabilityAvailabilityForRow,
};
/**
 * Island Selectors — pure functions for deriving island UI state from activities.
 * No side effects, no DOM, no imports from React.
 */

/**
 * Picks the primary activity from a list of activities.
 * Priority: pinned > priority (high > normal > low) > most recent.
 *
 * @param {Array<Object>} activities - Array of activity objects
 * @returns {Object|null} The primary activity or null if none
 */
export function pickPrimary(activities) {
  if (!activities || activities.length === 0) return null;

  // Filter out dismissed activities
  const visible = activities.filter(a => !a.dismissed);

  if (visible.length === 0) return null;

  // Sort by: pinned desc, priority desc, createdAt desc
  const priorityOrder = { high: 3, normal: 2, low: 1 };

  const sorted = [...visible].sort((a, b) => {
    if (a.pinned !== b.pinned) return b.pinned - a.pinned;
    const pa = priorityOrder[a.priority] || 2;
    const pb = priorityOrder[b.priority] || 2;
    if (pa !== pb) return pb - pa;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return sorted[0];
}

/**
 * Counts non-primary activities for the badge.
 *
 * @param {Array<Object>} activities - Array of activity objects
 * @param {Object|null} primary - The primary activity (from pickPrimary)
 * @returns {number} Count of additional activities
 */
export function badgeCount(activities, primary) {
  if (!activities || activities.length === 0) return 0;
  const visible = activities.filter(a => !a.dismissed);
  if (!primary) return visible.length;
  return Math.max(0, visible.length - 1);
}

/**
 * Determines which modules should be visible in the expanded island.
 * Priority order: Actions > Progress > Detail (max 3 modules).
 *
 * @param {Array<Object>} activities - Array of activity objects
 * @param {Object|null} primary - The primary activity
 * @returns {Array<string>} Array of module type strings to render
 */
export function visibleModules(activities, primary) {
  if (!primary) return [];

  const modules = [];
  const type = primary.type;

  // Module type mappings based on activity type
  const moduleMap = {
    // Approval activities show: actions (approve/deny), progress (risk), detail (context)
    pending_confirmation: ['approval', 'approval-timer', 'sync-state'],
    // Task/workflow/agent activities show: progress, detail, controls
    task: ['mission-progress', 'sync-state', 'catch-up'],
    workflow: ['mission-progress', 'sync-state', 'catch-up'],
    agent: ['mission-progress', 'sync-state', 'catch-up'],
    // Timer/reminder activities
    timer: ['approval-timer', 'mission-progress', 'sync-state'],
    reminder: ['approval-timer', 'mission-progress', 'sync-state'],
    // Media activities
    media: ['mission-progress', 'controls', 'sync-state'],
    // Download/upload/file transfer
    download: ['mission-progress', 'sync-state', 'controls'],
    upload: ['mission-progress', 'sync-state', 'controls'],
    file_transfer: ['mission-progress', 'sync-state', 'controls'],
    // Voice activities
    listening: ['voice-session', 'capture-indicator', 'sync-state'],
    thinking: ['voice-session', 'capture-indicator', 'sync-state'],
    speaking: ['voice-session', 'capture-indicator', 'sync-state'],
    // Generation/render/research
    generation: ['mission-progress', 'cost-warning', 'sync-state'],
    render: ['mission-progress', 'cost-warning', 'sync-state'],
    research: ['mission-progress', 'cost-warning', 'sync-state'],
    // Device handoff
    device_handoff: ['relay-state', 'sync-state', 'catch-up'],
    // Calendar/prayer
    calendar_event: ['mission-progress', 'catch-up', 'sync-state'],
    prayer_countdown: ['approval-timer', 'mission-progress', 'sync-state'],
    // Cost warning
    error: ['cost-warning', 'sync-state', 'catch-up'],
    // Custom fallback
    custom: ['mission-progress', 'sync-state', 'catch-up'],
  };

  const typeModules = moduleMap[type] || moduleMap.custom;

  // Add modules based on activity metadata
  for (const moduleType of typeModules) {
    if (modules.length >= 3) break;

    // Check if module is relevant for this activity
    if (isModuleRelevant(moduleType, primary, activities)) {
      modules.push(moduleType);
    }
  }

  // Always ensure we have at least one module if there's a primary activity
  if (modules.length === 0 && typeModules.length > 0) {
    modules.push(typeModules[0]);
  }

  return modules.slice(0, 3);
}

/**
 * Checks if a module type is relevant for the given activity.
 *
 * @param {string} moduleType - The module type to check
 * @param {Object} activity - The primary activity
 * @param {Array<Object>} allActivities - All activities (for context modules)
 * @returns {boolean}
 */
function isModuleRelevant(moduleType, activity, allActivities) {
  switch (moduleType) {
    case 'approval':
      return activity.type === 'pending_confirmation' && activity.actions && activity.actions.length > 0;
    case 'mission-progress':
      return typeof activity.progress === 'number' || activity.type === 'task' || activity.type === 'workflow';
    case 'voice-session':
      return ['listening', 'thinking', 'speaking'].includes(activity.type);
    case 'print-job':
      return activity.type === 'task' && activity.metadata?.printJob === true;
    case 'cost-warning':
      return activity.metadata?.costCents !== undefined || ['generation', 'render', 'research'].includes(activity.type);
    case 'approval-timer':
      return activity.expiresAt !== null && activity.expiresAt !== undefined;
    case 'sync-state':
      return allActivities.some(a => a.metadata?.pendingSync === true) || activity.metadata?.offline === true;
    case 'relay-state':
      return activity.type === 'device_handoff' || activity.metadata?.relay !== undefined;
    case 'catch-up':
      return allActivities.length > 1 || activity.metadata?.notifications !== undefined;
    case 'capture-indicator':
      return ['listening', 'thinking', 'speaking'].includes(activity.type) || activity.metadata?.capturing === true;
    case 'controls':
      return activity.actions && activity.actions.length > 0;
    default:
      return true;
  }
}

/**
 * Gets the display label for an activity type.
 *
 * @param {string} type - Activity type
 * @returns {string} Human-readable label
 */
export function activityLabel(type) {
  const labels = {
    task: 'Task',
    workflow: 'Workflow',
    agent: 'Agent',
    timer: 'Timer',
    reminder: 'Reminder',
    media: 'Media',
    download: 'Download',
    upload: 'Upload',
    file_transfer: 'File Transfer',
    notification: 'Notification',
    pending_confirmation: 'Approval Needed',
    success: 'Completed',
    error: 'Error',
    recovery: 'Recovery',
    device_handoff: 'Device Handoff',
    calendar_event: 'Calendar',
    prayer_countdown: 'Prayer',
    generation: 'Generating',
    render: 'Rendering',
    research: 'Researching',
    listening: 'Listening',
    thinking: 'Thinking',
    speaking: 'Speaking',
    muted: 'Muted',
    custom: 'Activity',
  };
  return labels[type] || 'Activity';
}

/**
 * Gets the icon name for an activity type (for Lucide icons).
 *
 * @param {string} type - Activity type
 * @returns {string} Icon name
 */
export function activityIcon(type) {
  const icons = {
    task: 'Activity',
    workflow: 'GitBranch',
    agent: 'Bot',
    timer: 'Timer',
    reminder: 'Bell',
    media: 'Music',
    download: 'Download',
    upload: 'Upload',
    file_transfer: 'FileText',
    notification: 'MessageSquare',
    pending_confirmation: 'AlertTriangle',
    success: 'CheckCircle',
    error: 'AlertCircle',
    recovery: 'RefreshCw',
    device_handoff: 'Smartphone',
    calendar_event: 'Calendar',
    prayer_countdown: 'Sunrise',
    generation: 'Sparkles',
    render: 'Image',
    research: 'Search',
    listening: 'Mic',
    thinking: 'Cpu',
    speaking: 'Volume2',
    muted: 'VolumeX',
    custom: 'Activity',
  };
  return icons[type] || 'Activity';
}

export default {
  pickPrimary,
  badgeCount,
  visibleModules,
  activityLabel,
  activityIcon,
};
/**
 * HEY Relay State — Pure View Model for Relay Pairing & Status
 *
 * Pure by construction: no I/O, no network, no side effects.
 * Derives UI state from device fabric and gateway state.
 */

export const RELAY_STATES = Object.freeze([
  'disconnected',
  'pairing',
  'paired',
  'degraded',
  'revoked',
]);

export const RELAY_SCOPES = Object.freeze([
  'read-and-act',  // Can read state and execute safe actions
  'read-only',     // Can only read state
  'paused',        // Temporarily disabled
]);

export const SAFE_ACTIONS = Object.freeze([
  'open-cockpit',
  'open-palette',
  'quick-capture',
  'ask-hey-text',
  'print-current-artefact',
]);

export const DESTRUCTIVE_ACTIONS = Object.freeze([
  'file:delete',
  'permission:grant',
  'spend:budget',
  'agent:spawn',
  'vault:promote',
  'secret:read',
]);

function generatePairCode() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function generateToken() {
  return `relay_${Date.now()}_${Math.random().toString(36).slice(2, 16)}`;
}

/**
 * Creates initial relay state.
 * @returns {Object}
 */
export function createRelayState() {
  return {
    status: 'disconnected',
    scope: 'read-and-act',
    pairCode: null,
    pairCodeExpiresAt: null,
    token: null,
    tokenExpiresAt: null,
    pairedDevices: [],
    lastActivity: null,
    error: null,
  };
}

/**
 * Derives relay view model from device fabric and gateway.
 * @param {Object} deviceFabricState - From deviceFabricEngine
 * @param {Object} gatewayState - From deviceGateway
 * @param {Object} options
 * @returns {Object} Relay view model
 */
export function deriveRelayViewModel(deviceFabricState, gatewayState, options = {}) {
  const { localDeviceId, now = Date.now() } = options;

  const trustedDevices = (deviceFabricState?.getTrustedDevices?.() || []).filter(d => d.id !== localDeviceId);
  const gatewayDevices = (gatewayState?.listDevices?.() || []).filter(d => d.id !== localDeviceId);

  // Merge and deduplicate
  const allDevices = [...trustedDevices, ...gatewayDevices];
  const seen = new Set();
  const pairedDevices = allDevices.filter(d => {
    if (seen.has(d.id)) return false;
    seen.add(d.id);
    return true;
  }).map(d => ({
    id: d.id,
    name: d.name,
    platform: d.platform,
    deviceType: d.deviceType,
    role: d.role,
    status: d.status,
    lastSeen: d.lastSeen || d.lastSeenAt,
    capabilities: d.capabilities || [],
    scope: d.scope || 'read-and-act',
    trusted: d.trusted !== false,
  }));

  const activePairCode = deviceFabricState?.getPairCode?.() || null;
  const pairCodeExpiresAt = deviceFabricState?.pairCodeExpiry || null;

  // Determine overall status
  let status = 'disconnected';
  if (activePairCode && new Date(pairCodeExpiresAt) > new Date(now)) {
    status = 'pairing';
  } else if (pairedDevices.length > 0) {
    const hasOnline = pairedDevices.some(d => d.status === 'online');
    const hasDegraded = pairedDevices.some(d => d.status === 'degraded' || d.status === 'reconnecting');
    if (hasDegraded) status = 'degraded';
    else if (hasOnline) status = 'paired';
    else status = 'disconnected';
  }

  return {
    status,
    scope: pairedDevices[0]?.scope || 'read-and-act',
    pairCode: activePairCode,
    pairCodeExpiresAt,
    token: gatewayState?.currentToken || null,
    tokenExpiresAt: gatewayState?.tokenExpiresAt || null,
    pairedDevices,
    lastActivity: pairedDevices.length > 0
      ? pairedDevices.reduce((latest, d) => {
          const dTime = new Date(d.lastSeen || 0).getTime();
          return dTime > latest ? dTime : latest;
        }, 0)
      : null,
    error: gatewayState?.lastError || null,
    canPair: status === 'disconnected' || status === 'degraded',
    canRevoke: pairedDevices.length > 0,
    safeActions: [...SAFE_ACTIONS],
    destructiveActions: [...DESTRUCTIVE_ACTIONS],
  };
}

/**
 * Validates a pair code format.
 * @param {string} code
 * @returns {boolean}
 */
export function validatePairCode(code) {
  if (!code || typeof code !== 'string') return false;
  return /^[2-9A-HJ-NP-Z]{6}$/.test(code.toUpperCase());
}

/**
 * Creates a pairing request payload.
 * @param {Object} deviceInfo
 * @returns {Object}
 */
export function createPairingRequest(deviceInfo) {
  return {
    pairCode: generatePairCode(),
    deviceInfo: {
      id: deviceInfo.id || `dev_${Date.now()}`,
      name: deviceInfo.name || 'Unknown Device',
      platform: deviceInfo.platform || 'unknown',
      deviceType: deviceInfo.deviceType || 'unknown',
      capabilities: deviceInfo.capabilities || [],
      role: deviceInfo.role || 'mobile',
    },
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  };
}

/**
 * Validates a pairing response.
 * @param {Object} response
 * @returns {{ ok: boolean, error?: string, deviceId?: string }}
 */
export function validatePairingResponse(response) {
  if (!response || typeof response !== 'object') {
    return { ok: false, error: 'Invalid response' };
  }
  if (response.error) {
    return { ok: false, error: response.error };
  }
  if (!response.deviceId) {
    return { ok: false, error: 'Missing deviceId' };
  }
  return { ok: true, deviceId: response.deviceId };
}

/**
 * Derives token rotation schedule.
 * @param {number} tokenAgeMs
 * @returns {Object}
 */
export function deriveTokenRotation(tokenAgeMs) {
  const ROTATION_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
  const WARNING_THRESHOLD_MS = 6 * 60 * 60 * 1000; // 6 hours before expiry

  return {
    shouldRotate: tokenAgeMs >= ROTATION_INTERVAL_MS,
    expiresSoon: tokenAgeMs >= ROTATION_INTERVAL_MS - WARNING_THRESHOLD_MS,
    timeUntilRotation: Math.max(0, ROTATION_INTERVAL_MS - tokenAgeMs),
    timeUntilExpiry: Math.max(0, ROTATION_INTERVAL_MS - tokenAgeMs),
  };
}

/**
 * Checks if an action is safe for relay execution.
 * @param {string} action
 * @returns {boolean}
 */
export function isSafeAction(action) {
  return SAFE_ACTIONS.includes(action);
}

/**
 * Checks if an action requires trust kernel approval.
 * @param {string} action
 * @returns {boolean}
 */
export function requiresTrustKernel(action) {
  return DESTRUCTIVE_ACTIONS.includes(action) || action.startsWith('file:') || action.startsWith('permission:');
}

/**
 * Creates a relay status summary for display.
 * @param {Object} viewModel
 * @returns {Object}
 */
export function createStatusSummary(viewModel) {
  const statusLabels = {
    disconnected: 'Not connected',
    pairing: 'Pairing…',
    paired: 'Connected',
    degraded: 'Degraded',
    revoked: 'Revoked',
  };

  const scopeLabels = {
    'read-and-act': 'Read and act',
    'read-only': 'Read only',
    paused: 'Paused',
  };

  return {
    statusLabel: statusLabels[viewModel.status] || viewModel.status,
    scopeLabel: scopeLabels[viewModel.scope] || viewModel.scope,
    deviceCount: viewModel.pairedDevices.length,
    onlineCount: viewModel.pairedDevices.filter(d => d.status === 'online').length,
    lastActivity: viewModel.lastActivity ? new Date(viewModel.lastActivity).toISOString() : null,
    canPair: viewModel.canPair,
    canRevoke: viewModel.canRevoke,
  };
}

export default {
  RELAY_STATES,
  RELAY_SCOPES,
  SAFE_ACTIONS,
  DESTRUCTIVE_ACTIONS,
  createRelayState,
  deriveRelayViewModel,
  validatePairCode,
  createPairingRequest,
  validatePairingResponse,
  deriveTokenRotation,
  isSafeAction,
  requiresTrustKernel,
  createStatusSummary,
};
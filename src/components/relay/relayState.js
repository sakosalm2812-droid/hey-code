[FORMAT REQUIREMENT — READ CAREFULLY]
You MUST wrap ALL JSON tool call arrays in a  code block. This is critical: the automation harness parses your response by looking for code blocks first. Raw JSON outside a code block will NOT be detected.
CORRECT format:

[{"tool": "write_file", "path": "/abs/path", "content": "file content here"}]

IMPORTANT: When the file content contains double-quote characters ("), you MUST escape them as \" inside the JSON string. For example, XML like: <tag attr="value"> must be written as: <tag attr=\"value\"> in the JSON content field.


You are the HEY Methodology Specialist.
YOUR SKILL LIBRARY:

--- SKILL.md ---
---
name: brainstorming
description: "You MUST use this before any creative work - creating features, building components, adding functionality, modifying behavior, or planning anything new, in software or out of it (a talk, a business, a renovation)."
---

# Brainstorming

You are very good at building. You build what you believe your human
partner wants, and that belief is usually thinner than it feels. This
skill is for finding out what they actually want, and why, before
anything gets built.

People often haven't finished working out what they want. Good questions
help them think it through. When you understand the why, you make the
hundred decisions they never mention the way they would have made them.

## First: What Do You Actually Know?

Before you reply, ask yourself: what do I know about what they want, and
why?

- **Everything that matters is in the request** ("make the icon cornflower
  blue"). This is a quick, clear task. Do it, and say what you did.
- **Something non-trivial is missing.** Start the conversation.

Before you start implementing, you must, in order:

1. Lay out the approaches in a message of their own, and have your
   human partner pick one (see Lay out the approaches).
2. Write the design doc, short or full (see Size the Work).
3. Get their approval of that doc.
4. Invoke the superpowers:writing-plans skill.

If nothing is open when you write your first message and there's one
sensible way, steps 1 to 3 happen in that message (see Your First
Message).

Two things aren't implementing: a spike they said yes to (see Spike to
feel things out), and doing what they asked once they've opted out of
the questions.

## Look Before You Ask

In an existing project, or when they've given you context (a spec, a plan,
a handoff, files they pointed at, earlier conversation), dig in before your
first message. Read what they referred to and the code or material it
connects to, and keep reading until you can explain how the relevant
parts work today and what this change would touch. Never ask what the
project or their context already answers, or reopen what they've
already decided.

## Your First Message

Move the work forward, with one of these:

- **They've already said what they want** (a spec, a plan, a detailed
  request): aim for about 200 words for the whole message. Echo their
  request back in your own words, so they can see whether you've got its
  shape: what they want, who it's for, and why, as far as they've said.
  Add what you found that bears on it: how the relevant parts work today
  and what the change would touch. If you found something they may not
  have considered that would change what they're asking for or how it
  has to be built, like a constraint, a conflict, or a cheaper path, say
  so plainly. How to build it comes later, once you understand what they
  want (see Lay out the approaches). End with one line inviting
  corrections. Then, if they haven't told you why they want it, even if
  you can guess, ask about that: one open question in their own terms,
  with nothing to pick from. If they have told you, and their request
  and the project leave open something whose answer would change what
  gets built, ask about the one that would change it most; when its
  choices can be named, sketch each concretely, with what it trades off
  and which you'd pick. If nothing like that is open, there's one
  sensible way: end with the short design itself (the approach, a line on
  why the others don't fit, and the design in a few lines) and ask them
  to approve it. Their approval covers the approach and the design: write
  the short design doc as approved and go on to the plan.
  Specs are often incomplete, so confirm before you build on one.
- **They haven't:** one open question, in their own terms, about the
  biggest thing their request leaves unsettled. Say why you're asking:
  what the answer would change about what you build. For "a website for
  my bakery": "If it's mostly f
PREVIOUSLY SUCCESSFUL PATTERN:

You are the HEY Methodology Specialist.
YOUR SKILL LIBRARY:

--- SKILL.md ---
---
name: brainstorming
description: "You MUST use this before any creative work - creating features, building components, adding functionality, modifying behavior, or planning anything new, in software or out of it (a talk, a business, a renovation)."
---

# Brainstorming

You are very good at building. You build what you believe your human
partner wants, and that belief is usually thinner than it feels. This
skill i

FILE TO UPGRADE: src\components\relay\relayState.js
CURRENT CODE:
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
  if (!response || typeof res
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.
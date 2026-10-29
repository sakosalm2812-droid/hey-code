/**
 * HEY Voice Session Machine.
 *
 * A deterministic, 10-state machine for voice sessions. Every transition is
 * explicit; impossible transitions are refused with a reason. The machine holds
 * no timers, starts no listeners, and performs no I/O. Privacy indicator is
 * derived from state, never set by UI.
 *
 * States (10):
 *   idle, listening, processing, speaking, interrupted, muted,
 *   permission_required, error, offline, calibrating
 *
 * @module core/voiceSessionMachine
 */

export const VOICE_SESSION_STATES = Object.freeze([
  "idle",
  "listening",
  "processing",
  "speaking",
  "interrupted",
  "muted",
  "permission_required",
  "error",
  "offline",
  "calibrating",
]);

/**
 * Allowed transitions. Key = fromState, Value = array of allowed toStates.
 * Any transition not listed here is illegal and will be refused.
 */
const ALLOWED_TRANSITIONS = Object.freeze({
  idle: ["listening", "muted", "permission_required", "offline", "error", "calibrating"],
  listening: ["processing", "idle", "interrupted", "muted", "permission_required", "offline", "error"],
  processing: ["speaking", "idle", "interrupted", "offline", "error"],
  speaking: ["idle", "interrupted", "processing", "muted", "error"],
  interrupted: ["idle", "listening", "processing", "error"],
  muted: ["idle", "permission_required", "offline", "error"],
  permission_required: ["idle", "listening", "error"],
  error: ["idle", "offline", "permission_required"],
  offline: ["idle", "error", "permission_required"],
  calibrating: ["listening", "idle", "permission_required", "offline", "error"],
});

/**
 * States where audio capture is actively happening.
 * @type {ReadonlySet<string>}
 */
const CAPTURE_STATES = Object.freeze(new Set(["listening", "calibrating"]));

/**
 * States where audio playback is actively happening.
 * @type {ReadonlySet<string>}
 */
const PLAYBACK_STATES = Object.freeze(new Set(["speaking"]));

/**
 * States that require explicit user action to enter.
 * @type {ReadonlySet<string>}
 */
const USER_ACTION_REQUIRED_STATES = Object.freeze(new Set(["listening", "calibrating"]));

/**
 * @typedef {Object} VoiceSessionSnapshot
 * @property {string} state
 * @property {string} updatedAt
 * @property {boolean} isCapturing
 * @property {boolean} isPlaying
 * @property {boolean} requiresUserAction
 * @property {string[]} allowedNext
 */

/**
 * @typedef {Object} TransitionResult
 * @property {boolean} success
 * @property {string} state
 * @property {string} updatedAt
 * @property {string} [error]
 */

/**
 * Creates a new voice session machine.
 *
 * @param {string} [initialState="idle"]
 * @returns {{
 *   get state(): string,
 *   get updatedAt(): string,
 *   get isCapturing(): boolean,
 *   get isPlaying(): boolean,
 *   get requiresUserAction(): boolean,
 *   get allowedNext(): string[],
 *   transition: (nextState: string) => TransitionResult,
 *   bargeIn: () => TransitionResult,
 *   snapshot: () => VoiceSessionSnapshot,
 * }}
 */
export function createVoiceSessionMachine(initialState = "idle") {
  if (!VOICE_SESSION_STATES.includes(initialState)) {
    throw new TypeError(`Unknown initial voice state: ${initialState}`);
  }

  let current = initialState;
  let updatedAt = new Date().toISOString();

  const self = {
    get state() { return current; },
    get updatedAt() { return updatedAt; },
    get isCapturing() { return CAPTURE_STATES.has(current); },
    get isPlaying() { return PLAYBACK_STATES.has(current); },
    get requiresUserAction() { return USER_ACTION_REQUIRED_STATES.has(current); },
    get allowedNext() { return [...(ALLOWED_TRANSITIONS[current] || [])]; },

    /**
     * Attempts a state transition.
     * @param {string} nextState
     * @returns {TransitionResult}
     */
    transition(nextState) {
      if (!VOICE_SESSION_STATES.includes(nextState)) {
        return {
          success: false,
          state: current,
          updatedAt,
          error: `Unknown voice state: ${nextState}`,
        };
      }
      if (nextState !== current && !ALLOWED_TRANSITIONS[current]?.includes(nextState)) {
        return {
          success: false,
          state: current,
          updatedAt,
          error: `Cannot transition voice from ${current} to ${nextState}.`,
        };
      }
      current = nextState;
      updatedAt = new Date().toISOString();
      return { success: true, state: current, updatedAt };
    },

    /**
     * Barge-in: interrupts speaking to start listening.
     * Only allowed from speaking -> listening.
     * @returns {TransitionResult}
     */
    bargeIn() {
      if (current !== "speaking") {
        return {
          success: false,
          state: current,
          updatedAt,
          error: `Barge-in only allowed from speaking, not ${current}.`,
        };
      }
      return self.transition("listening");
    },

    /**
     * Returns a full snapshot including derived privacy indicators.
     * @returns {VoiceSessionSnapshot}
     */
    snapshot() {
      return {
        state: current,
        updatedAt,
        isCapturing: CAPTURE_STATES.has(current),
        isPlaying: PLAYBACK_STATES.has(current),
        requiresUserAction: USER_ACTION_REQUIRED_STATES.has(current),
        allowedNext: [...(ALLOWED_TRANSITIONS[current] || [])],
      };
    },
  };

  return self;
}

/**
 * Derives the privacy indicator text for a given state.
 * Never relies on UI state; purely derived from the machine state.
 *
 * @param {string} state
 * @returns {{ visible: boolean, text: string, tone: "recording" | "playing" | "idle" | "error" }}
 */
export function derivePrivacyIndicator(state) {
  if (!VOICE_SESSION_STATES.includes(state)) {
    return { visible: false, text: "Unknown state", tone: "idle" };
  }

  if (CAPTURE_STATES.has(state)) {
    return {
      visible: true,
      text: state === "calibrating" ? "Calibrating microphone…" : "Listening…",
      tone: "recording",
    };
  }
  if (PLAYBACK_STATES.has(state)) {
    return { visible: true, text: "Speaking…", tone: "playing" };
  }
  if (state === "error") {
    return { visible: true, text: "Voice error", tone: "error" };
  }
  if (state === "permission_required") {
    return { visible: true, text: "Microphone permission required", tone: "error" };
  }
  return { visible: false, text: "", tone: "idle" };
}

/**
 * Validates that a transition sequence is legal.
 * @param {string[]} states
 * @returns {{ ok: boolean, error?: string }}
 */
export function validateTransitionSequence(states) {
  if (!Array.isArray(states) || states.length === 0) {
    return { ok: false, error: "Sequence must be a non-empty array" };
  }
  let current = states[0];
  if (!VOICE_SESSION_STATES.includes(current)) {
    return { ok: false, error: `Invalid initial state: ${current}` };
  }
  for (let i = 1; i < states.length; i++) {
    const next = states[i];
    if (!VOICE_SESSION_STATES.includes(next)) {
      return { ok: false, error: `Invalid state at index ${i}: ${next}` };
    }
    if (!ALLOWED_TRANSITIONS[current]?.includes(next)) {
      return { ok: false, error: `Illegal transition at index ${i}: ${current} -> ${next}` };
    }
    current = next;
  }
  return { ok: true };
}

export default {
  VOICE_SESSION_STATES,
  ALLOWED_TRANSITIONS,
  CAPTURE_STATES,
  PLAYBACK_STATES,
  USER_ACTION_REQUIRED_STATES,
  createVoiceSessionMachine,
  derivePrivacyIndicator,
  validateTransitionSequence,
};
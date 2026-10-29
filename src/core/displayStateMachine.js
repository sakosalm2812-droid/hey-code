import { log as auditLog } from './auditLogger.js';

export const DISPLAY_STATES = Object.freeze([
  'idle',
  'listening',
  'thinking',
  'speaking',
  'generating',
  'verifying',
  'approval_required',
  'error',
  'recovery',
  'complete',
]);

export const VALID_TRANSITIONS = Object.freeze({
  idle: ['listening', 'thinking', 'generating', 'verifying', 'approval_required', 'error'],
  listening: ['thinking', 'idle', 'error'],
  thinking: ['speaking', 'generating', 'verifying', 'approval_required', 'idle', 'error'],
  speaking: ['idle', 'listening', 'thinking', 'complete', 'error'],
  generating: ['verifying', 'speaking', 'thinking', 'error'],
  verifying: ['complete', 'recovery', 'error', 'thinking'],
  approval_required: ['thinking', 'generating', 'verifying', 'idle', 'error'],
  recovery: ['thinking', 'idle', 'error'],
  error: ['recovery', 'idle'],
  complete: ['idle', 'listening', 'thinking'],
});

export class DisplayStateMachine {
  constructor(options = {}) {
    this.state = options.initialState || 'idle';
    this.metadata = options.initialMetadata || {};
    this.since = options.initialSince || new Date().toISOString();
    this.subscribers = new Set();
    this.auditLogger = options.auditLogger || auditLog;
    this.storage = options.storage || null; // optional persistent store
  }

  getState() {
    return {
      state: this.state,
      metadata: { ...this.metadata },
      since: this.since,
    };
  }

  setState(nextState, metadata = {}) {
    if (!DISPLAY_STATES.includes(nextState)) {
      console.warn(`[DisplayStateMachine] Invalid state: "${nextState}". Ignored.`);
      return false;
    }

    const allowed = VALID_TRANSITIONS[this.state] || [];
    if (!allowed.includes(nextState)) {
      console.warn(
        `[DisplayStateMachine] Invalid transition from "${this.state}" to "${nextState}". Ignored.`
      );
      return false;
    }

    // Constraint: Do not allow `complete` without verification evidence
    if (nextState === 'complete') {
      const hasEvidence =
        Boolean(metadata.evidence) ||
        Boolean(metadata.verification) ||
        Boolean(this.metadata.evidence) ||
        Boolean(this.metadata.verification);

      if (!hasEvidence) {
        console.warn(
          `[DisplayStateMachine] Transition to 'complete' rejected: missing verification evidence.`
        );
        return false;
      }
    }

    const prevState = this.state;
    this.state = nextState;
    this.metadata = { ...metadata };
    this.since = new Date().toISOString();

    if (this.storage) {
      try {
        this.storage.setItem(
          'hey_display_state',
          JSON.stringify({ state: this.state, metadata: this.metadata, since: this.since })
        );
      } catch {}
    }

    // Emit to audit log
    if (typeof this.auditLogger === 'function') {
      this.auditLogger({
        event_type: 'display:state_changed',
        actor: 'display_state_machine',
        payload: {
          from: prevState,
          to: nextState,
          metadata: this.metadata,
        },
      });
    }

    // Notify subscribers
    const snapshot = this.getState();
    for (const subscriber of this.subscribers) {
      try {
        subscriber(snapshot);
      } catch (err) {
        console.error('[DisplayStateMachine] Subscriber error:', err);
      }
    }

    return true;
  }

  subscribe(callback) {
    if (typeof callback !== 'function') {
      throw new TypeError('Subscriber must be a function');
    }
    this.subscribers.add(callback);
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }
}

export const defaultDisplayStateMachine = new DisplayStateMachine();

export function set_state(state, metadata) {
  return defaultDisplayStateMachine.setState(state, metadata);
}

export function get_state() {
  return defaultDisplayStateMachine.getState();
}

export function subscribe(fn) {
  return defaultDisplayStateMachine.subscribe(fn);
}

export default {
  DisplayStateMachine,
  defaultDisplayStateMachine,
  set_state,
  get_state,
  subscribe,
  DISPLAY_STATES,
  VALID_TRANSITIONS,
};

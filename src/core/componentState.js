/**
 * HEY Component State Model.
 *
 * Every component a Living Answer can render is in exactly one of seven states,
 * and the state is *derived from evidence*, never chosen to look good. The rules
 * that matter:
 *
 *  - `permission-denied` is never reported as `error`. A missing grant is a
 *    request the user can answer; an error is a fault. Collapsing the two sends
 *    the user to a retry that can never succeed.
 *  - `stale` is never reported as `ready`. Data older than the freshness limit is
 *    labelled as old, even when it renders perfectly.
 *  - `unavailable` names the missing dependency. "Unavailable" with no noun is a
 *    dead end for the user and a hiding place for a defect.
 *
 * This module holds no state, performs no I/O, reads no clock, and imports
 * nothing. Every function is pure and deterministic. It is deliberately not
 * wired into any renderer: Part 11 renders, Part 7 decides.
 *
 * @module core/componentState
 */

/**
 * The seven states, in precedence order used by {@link deriveState}: the first
 * state whose condition is true wins, so a later condition can never mask an
 * earlier one.
 *
 * @type {ReadonlyArray<'loading'|'ready'|'empty'|'stale'|'error'|'permission-denied'|'unavailable'>}
 */
export const COMPONENT_STATES = Object.freeze([
  "loading",
  "ready",
  "empty",
  "stale",
  "error",
  "permission-denied",
  "unavailable",
]);

/**
 * Precedence order used when several conditions are true at once. Read top to
 * bottom: `unavailable` is the root cause and outranks everything; a missing
 * permission outranks an error because it is not a fault; `error` outranks
 * `loading` so a failed request that is still marked as fetching reports the
 * failure; `empty` outranks `stale` because there is no age to report on data
 * that does not exist.
 *
 * @type {ReadonlyArray<string>}
 */
export const STATE_PRECEDENCE = Object.freeze([
  "unavailable",
  "permission-denied",
  "error",
  "loading",
  "empty",
  "stale",
  "ready",
]);

/**
 * Tone vocabulary for a state. `neutral` and `positive` are informational,
 * `caution` means the user should look before acting, `danger` means the content
 * is not trustworthy or not present.
 *
 * @type {ReadonlyArray<'neutral'|'positive'|'caution'|'danger'>}
 */
export const STATE_TONES = Object.freeze([
  "neutral",
  "positive",
  "caution",
  "danger",
]);

/**
 * User-facing description of one state.
 *
 * @typedef {Object} StateDescription
 * @property {string}  state        The state this describes.
 * @property {string}  label        Short label suitable for a status chip.
 * @property {'neutral'|'positive'|'caution'|'danger'} tone
 * @property {boolean} retryable    Whether asking again can plausibly succeed.
 * @property {string}  userMessage  A complete sentence the user can read.
 */

/**
 * Fixed copy per state. Deliberately not parameterised except for
 * `unavailable`, whose message must name the missing dependency.
 *
 * @type {Record<string, { label: string, tone: string, retryable: boolean, userMessage: string }>}
 */
const STATE_COPY = Object.freeze({
  loading: {
    label: "Loading",
    tone: "neutral",
    retryable: false,
    userMessage: "This part of the answer is still loading.",
  },
  ready: {
    label: "Ready",
    tone: "positive",
    retryable: false,
    userMessage: "This is showing the current answer data.",
  },
  empty: {
    label: "Nothing to show",
    tone: "neutral",
    retryable: false,
    userMessage: "There is no data to show here yet.",
  },
  stale: {
    label: "May be out of date",
    tone: "caution",
    retryable: true,
    userMessage: "This data is older than the freshness limit, so refresh it before relying on it.",
  },
  error: {
    label: "Something went wrong",
    tone: "danger",
    retryable: true,
    userMessage: "HEY could not load this. You can try again.",
  },
  "permission-denied": {
    label: "Permission needed",
    tone: "caution",
    retryable: false,
    userMessage: "HEY does not have permission to show this. Grant access to see it.",
  },
  unavailable: {
    label: "Unavailable",
    tone: "danger",
    retryable: false,
    userMessage: "This is unavailable because a dependency HEY needs is not available.",
  },
});

/**
 * Total fallback used for `unavailable` when the caller did not name the
 * dependency. It is still a complete sentence; it simply does not pretend to
 * know which dependency is missing.
 */
const UNNAMED_DEPENDENCY = "a dependency HEY needs";

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * @param {unknown} value
 * @returns {value is string}
 */
function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

/**
 * True when `error` carries a failure. `undefined`, `null`, `false` and an empty
 * or whitespace-only string mean "no error"; anything else means "failed".
 *
 * @param {unknown} error
 * @returns {boolean}
 */
function hasError(error) {
  if (error === undefined || error === null || error === false) return false;
  if (typeof error === "string") return error.trim() !== "";
  return true;
}

/**
 * True when `ageMs` has passed `staleAfterMs`. Both must be finite numbers and
 * `staleAfterMs` must be positive; anything else means freshness cannot be
 * judged, so the caller falls through to `ready` rather than inventing staleness.
 *
 * @param {unknown} ageMs
 * @param {unknown} staleAfterMs
 * @returns {boolean}
 */
function isStale(ageMs, staleAfterMs) {
  if (typeof ageMs !== "number" || !Number.isFinite(ageMs)) return false;
  if (typeof staleAfterMs !== "number" || !Number.isFinite(staleAfterMs)) return false;
  if (staleAfterMs <= 0 || ageMs < 0) return false;
  return ageMs >= staleAfterMs;
}

/**
 * @param {unknown} state
 * @returns {boolean}
 */
export function isKnownState(state) {
  return typeof state === "string" && COMPONENT_STATES.includes(state);
}

/**
 * Derives the one state that is true for a component.
 *
 * Every input is optional and is read as a positive fact only when it is
 * explicit:
 *
 *  - `available: false`      → `unavailable`
 *  - `permissionGranted: false` → `permission-denied`
 *  - a non-empty `error`     → `error`
 *  - `isFetching: true`      → `loading`
 *  - `hasData !== true`      → `empty`
 *  - `ageMs >= staleAfterMs` → `stale`
 *  - otherwise               → `ready`
 *
 * A missing or malformed input never produces a more confident state: for
 * example, a component with no `hasData` flag is `empty`, not `ready`.
 *
 * @param {Object} [input]
 * @param {boolean} [input.hasData]           Whether any rows/values arrived.
 * @param {boolean} [input.isFetching]        Whether a request is in flight.
 * @param {unknown} [input.error]             Failure value, if any.
 * @param {boolean} [input.permissionGranted] Explicit grant; `false` denies.
 * @param {boolean} [input.available]         Explicit availability; `false` wins.
 * @param {number}  [input.ageMs]             Age of the data in milliseconds.
 * @param {number}  [input.staleAfterMs]      Freshness limit in milliseconds.
 * @returns {'loading'|'ready'|'empty'|'stale'|'error'|'permission-denied'|'unavailable'}
 */
export function deriveState(input = {}) {
  const facts = isPlainObject(input) ? input : {};

  if (facts.available === false) return "unavailable";
  if (facts.permissionGranted === false) return "permission-denied";
  if (hasError(facts.error)) return "error";
  if (facts.isFetching === true) return "loading";
  if (facts.hasData !== true) return "empty";
  if (isStale(facts.ageMs, facts.staleAfterMs)) return "stale";
  return "ready";
}

/**
 * Describes one state for the user.
 *
 * `unavailable` must name the missing dependency, so pass
 * `{ missingDependency }` when you know it. Without it the message is still a
 * complete sentence and says only what is true.
 *
 * @param {string} state
 * @param {{ missingDependency?: string }} [context]
 * @returns {Readonly<StateDescription>}
 * @throws {TypeError} When `state` is not one of the seven states.
 */
export function describeState(state, context = {}) {
  if (!isKnownState(state)) {
    throw new TypeError(
      `Unknown component state ${JSON.stringify(state)}; expected one of ${COMPONENT_STATES.join(", ")}`,
    );
  }

  const copy = STATE_COPY[state];
  const facts = isPlainObject(context) ? context : {};
  const dependency = isNonEmptyString(facts.missingDependency)
    ? facts.missingDependency.trim()
    : null;

  const userMessage =
    state === "unavailable"
      ? dependency
        ? `This is unavailable: ${dependency} is not available to HEY.`
        : `This is unavailable because ${UNNAMED_DEPENDENCY} is not available.`
      : copy.userMessage;

  return Object.freeze({
    state,
    label: copy.label,
    tone: copy.tone,
    retryable: copy.retryable,
    userMessage,
  });
}

/**
 * Whether asking again can plausibly succeed for this state.
 *
 * `loading` is not retryable — the request is already running. `permission-denied`
 * is not retryable — it needs a grant, not another attempt.
 *
 * @param {string} state
 * @returns {boolean}
 * @throws {TypeError} When `state` is not one of the seven states.
 */
export function canRetry(state) {
  if (!isKnownState(state)) {
    throw new TypeError(
      `Unknown component state ${JSON.stringify(state)}; expected one of ${COMPONENT_STATES.join(", ")}`,
    );
  }
  return STATE_COPY[state].retryable;
}

/**
 * Convenience composition: derives the state from the same facts and returns the
 * description, forwarding `missingDependency` so an `unavailable` message can
 * name it.
 *
 * @param {Object} [input] Same facts as {@link deriveState}, plus
 *   `missingDependency?: string`.
 * @returns {Readonly<StateDescription>}
 */
export function deriveAndDescribe(input = {}) {
  const facts = isPlainObject(input) ? input : {};
  const state = deriveState(facts);
  return describeState(state, { missingDependency: facts.missingDependency });
}

export default {
  COMPONENT_STATES,
  STATE_PRECEDENCE,
  STATE_TONES,
  isKnownState,
  deriveState,
  describeState,
  canRetry,
  deriveAndDescribe,
};

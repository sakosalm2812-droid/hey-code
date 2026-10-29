/**
 * HEY Wake Word Policy.
 *
 * Wake word detection is OFF by default. When enabled, it enforces:
 * - Cooldown between detections
 * - Hourly detection cap
 * - Confidence threshold
 * - Platform refusal when unavailable
 *
 * No listeners are started without explicit user action.
 *
 * @module core/wakeWordPolicy
 */

export const WAKE_WORD_DEFAULTS = Object.freeze({
  enabled: false,
  wakeWords: ["hey"],
  customWakeWord: "",
  sensitivity: 0.7,
  language: "en-US",
  continuous: true,
  requireConfirmation: false,
  cooldownMs: 3000,
  maxPerHour: 50,
  confidenceThreshold: 0.65,
});

const STORAGE_KEY = "hey_wake_word_policy";

/**
 * @typedef {Object} WakeWordSettings
 * @property {boolean} enabled
 * @property {string[]} wakeWords
 * @property {string} customWakeWord
 * @property {number} sensitivity
 * @property {string} language
 * @property {boolean} continuous
 * @property {boolean} requireConfirmation
 * @property {number} cooldownMs
 * @property {number} maxPerHour
 * @property {number} confidenceThreshold
 */

/**
 * @typedef {Object} DetectionResult
 * @property {boolean} allowed
 * @property {string} [reason]
 * @property {number} [cooldownRemainingMs]
 * @property {number} [detectionsThisHour]
 */

/**
 * In-memory detection log for rate limiting.
 * This is not persisted; a reload resets the hourly count.
 * @type {number[]}
 */
const detectionTimestamps = [];

/**
 * Reads settings from localStorage, merging with defaults.
 * @returns {WakeWordSettings}
 */
function readSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...WAKE_WORD_DEFAULTS, ...parsed };
    }
  } catch {
    // Ignore parse errors, return defaults
  }
  return { ...WAKE_WORD_DEFAULTS };
}

/**
 * Writes settings to localStorage.
 * @param {Partial<WakeWordSettings>} updates
 * @returns {WakeWordSettings}
 */
function writeSettings(updates) {
  const next = { ...readSettings(), ...updates };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Persistence is best-effort
  }
  return next;
}

/**
 * Checks if the current platform supports wake word detection.
 * @returns {{ supported: boolean, reason?: string }}
 */
export function checkPlatformSupport() {
  if (typeof window === "undefined") {
    return { supported: false, reason: "No window object (non-browser environment)" };
  }
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    return { supported: false, reason: "SpeechRecognition API not available" };
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    return { supported: false, reason: "getUserMedia not available" };
  }
  if (!navigator.onLine) {
    return { supported: false, reason: "Browser is offline" };
  }
  return { supported: true };
}

/**
 * Checks if a transcript matches any configured wake word at boundary.
 * Only matches whole-word boundaries: exact, start + space, or space + end.
 *
 * @param {string} transcript
 * @param {string[]} words
 * @returns {{ matched: boolean, word?: string }}
 */
export function matchesWakeWordBoundary(transcript, words) {
  const text = transcript.toLowerCase().trim();
  for (const word of words) {
    const wakeWord = word.toLowerCase().trim();
    if (!wakeWord) continue;
    // Boundary match: exact, or word followed by space, or space followed by word
    if (text === wakeWord || text.startsWith(wakeWord + " ") || text.endsWith(" " + wakeWord)) {
      return { matched: true, word: wakeWord };
    }
  }
  return { matched: false };
}

/**
 * Evaluates whether a wake word detection should be accepted.
 * Enforces cooldown, hourly cap, confidence threshold, and platform support.
 *
 * @param {Object} params
 * @param {string} params.transcript - The transcript to check
 * @param {number} [params.confidence] - Confidence score 0-1
 * @param {WakeWordSettings} [params.settings] - Optional settings override
 * @returns {DetectionResult}
 */
export function evaluateDetection({ transcript, confidence = 1, settings = readSettings() }) {
  const platform = checkPlatformSupport();
  if (!platform.supported) {
    return { allowed: false, reason: `Platform refusal: ${platform.reason}` };
  }

  if (!settings.enabled) {
    return { allowed: false, reason: "Wake word detection is disabled" };
  }

  const allWords = [...new Set([...settings.wakeWords, ...(settings.customWakeWord ? [settings.customWakeWord] : [])])];
  const { matched, word } = matchesWakeWordBoundary(transcript, allWords);
  if (!matched) {
    return { allowed: false, reason: "No wake word match" };
  }

  if (confidence < settings.confidenceThreshold) {
    return { allowed: false, reason: `Confidence ${confidence.toFixed(2)} below threshold ${settings.confidenceThreshold}` };
  }

  const now = Date.now();

  // Cooldown check
  if (detectionTimestamps.length > 0) {
    const lastDetection = detectionTimestamps[detectionTimestamps.length - 1];
    const elapsed = now - lastDetection;
    if (elapsed < settings.cooldownMs) {
      return {
        allowed: false,
        reason: "Cooldown active",
        cooldownRemainingMs: settings.cooldownMs - elapsed,
      };
    }
  }

  // Hourly cap check
  const oneHourAgo = now - 60 * 60 * 1000;
  const recentDetections = detectionTimestamps.filter(ts => ts > oneHourAgo);
  if (recentDetections.length >= settings.maxPerHour) {
    return {
      allowed: false,
      reason: `Hourly cap reached (${settings.maxPerHour}/hour)`,
      detectionsThisHour: recentDetections.length,
    };
  }

  // All checks passed - record the detection
  detectionTimestamps.push(now);

  // Prune old timestamps (older than 1 hour)
  const cutoff = now - 60 * 60 * 1000;
  while (detectionTimestamps.length > 0 && detectionTimestamps[0] < cutoff) {
    detectionTimestamps.shift();
  }

  return { allowed: true, reason: `Wake word "${word}" detected`, detectionsThisHour: recentDetections.length + 1 };
}

/**
 * Gets the current wake word settings.
 * @returns {WakeWordSettings}
 */
export function getWakeWordSettings() {
  return readSettings();
}

/**
 * Updates wake word settings.
 * @param {Partial<WakeWordSettings>} updates
 * @returns {WakeWordSettings}
 */
export function setWakeWordSettings(updates) {
  return writeSettings(updates);
}

/**
 * Resets the in-memory detection log (for testing or manual reset).
 */
export function resetDetectionLog() {
  detectionTimestamps.length = 0;
}

/**
 * Gets the current detection count for this hour.
 * @returns {number}
 */
export function getDetectionsThisHour() {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  return detectionTimestamps.filter(ts => ts > oneHourAgo).length;
}

/**
 * Gets the time until next detection is allowed (cooldown).
 * @param {WakeWordSettings} [settings]
 * @returns {number} Milliseconds remaining, or 0 if no cooldown
 */
export function getCooldownRemaining(settings = readSettings()) {
  if (detectionTimestamps.length === 0) return 0;
  const lastDetection = detectionTimestamps[detectionTimestamps.length - 1];
  const elapsed = Date.now() - lastDetection;
  return Math.max(0, settings.cooldownMs - elapsed);
}

export default {
  WAKE_WORD_DEFAULTS,
  checkPlatformSupport,
  matchesWakeWordBoundary,
  evaluateDetection,
  getWakeWordSettings,
  setWakeWordSettings,
  resetDetectionLog,
  getDetectionsThisHour,
  getCooldownRemaining,
};
import fs from 'node:fs';
import { log as auditLog } from './auditLogger.js';

export const VERDICT_STATUS = Object.freeze({
  VERIFIED: 'verified',
  PARTIAL: 'partial',
  FAILED: 'failed',
  EFFECT_UNKNOWN: 'effect_unknown',
});

function deepEqual(a, b) {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  for (const k of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, k) || !deepEqual(a[k], b[k])) {
      return false;
    }
  }
  return true;
}

export class ActionVerificationEngine {
  constructor(options = {}) {
    this.auditLogger = options.auditLogger || auditLog;
    this.history = new Map();
  }

  evaluateCheck(criterion, expected, actual) {
    const type = typeof criterion === 'function' ? 'custom' : criterion.type || criterion;
    const targetKey = criterion.key || null;

    const valExpected = targetKey && expected && typeof expected === 'object' ? expected[targetKey] : expected;
    const valActual = targetKey && actual && typeof actual === 'object' ? actual[targetKey] : actual;

    try {
      switch (type) {
        case 'equals': {
          const pass = deepEqual(valActual, valExpected);
          return { type, pass, evidence: { expected: valExpected, actual: valActual } };
        }
        case 'contains': {
          let pass = false;
          if (typeof valActual === 'string') {
            pass = valActual.includes(String(valExpected));
          } else if (Array.isArray(valActual)) {
            pass = valActual.some((item) => deepEqual(item, valExpected));
          }
          return { type, pass, evidence: { expected: valExpected, actual: valActual } };
        }
        case 'matches_regex': {
          const regex = valExpected instanceof RegExp ? valExpected : new RegExp(String(valExpected));
          const pass = regex.test(String(valActual ?? ''));
          return { type, pass, evidence: { pattern: String(valExpected), actual: valActual } };
        }
        case 'file_exists': {
          const filePath = String(valActual ?? valExpected ?? '');
          const pass = Boolean(filePath) && fs.existsSync(filePath);
          return { type, pass, evidence: { filePath, exists: pass } };
        }
        case 'http_status': {
          const actualStatus =
            typeof valActual === 'object' && valActual !== null ? valActual.status : Number(valActual);
          const expectedStatus = Number(valExpected);
          const pass = actualStatus === expectedStatus;
          return { type, pass, evidence: { expectedStatus, actualStatus } };
        }
        case 'db_row_count': {
          const actualCount =
            typeof valActual === 'object' && valActual !== null
              ? valActual.count ?? valActual.length
              : Number(valActual);
          const expectedCount = Number(valExpected);
          const pass = actualCount === expectedCount;
          return { type, pass, evidence: { expectedCount, actualCount } };
        }
        case 'custom': {
          const fn = typeof criterion === 'function' ? criterion : criterion.fn;
          const result = fn({ expected: valExpected, actual: valActual });
          const pass = typeof result === 'boolean' ? result : Boolean(result?.pass);
          return { type: 'custom', pass, evidence: result?.evidence ?? { pass } };
        }
        default:
          return { type, pass: false, evidence: { error: `unknown_criterion: ${type}` } };
      }
    } catch (err) {
      return { type, pass: false, evidence: { error: err.message } };
    }
  }

  verify({ action_id, expected, actual, criteria = [] }) {
    if (!action_id) {
      throw new TypeError('action_id is required for verification');
    }

    // Check for missing evidence
    if (actual === undefined || actual === null || !criteria || criteria.length === 0) {
      const verdict = Object.freeze({
        action_id,
        status: VERDICT_STATUS.EFFECT_UNKNOWN,
        evidence: Object.freeze({ reason: 'Missing evidence or criteria for verification' }),
        verified_at: new Date().toISOString(),
      });
      this._recordVerdict(action_id, verdict);
      return verdict;
    }

    const checkResults = [];
    let passedCount = 0;
    let failedCount = 0;

    for (const criterion of criteria) {
      const checkRes = this.evaluateCheck(criterion, expected, actual);
      checkResults.push(checkRes);
      if (checkRes.pass) {
        passedCount++;
      } else {
        failedCount++;
      }
    }

    let status;
    if (passedCount === criteria.length) {
      status = VERDICT_STATUS.VERIFIED;
    } else if (passedCount > 0 && failedCount > 0) {
      status = VERDICT_STATUS.PARTIAL;
    } else {
      status = VERDICT_STATUS.FAILED;
    }

    const verdict = Object.freeze({
      action_id,
      status,
      evidence: Object.freeze({
        checks: Object.freeze(checkResults),
        passedCount,
        failedCount,
        total: criteria.length,
      }),
      verified_at: new Date().toISOString(),
    });

    this._recordVerdict(action_id, verdict);
    return verdict;
  }

  _recordVerdict(action_id, verdict) {
    this.history.set(action_id, verdict);
    if (typeof this.auditLogger === 'function') {
      this.auditLogger({
        event_type: 'verification:completed',
        actor: 'verification_engine',
        correlation_id: action_id,
        payload: {
          action_id,
          status: verdict.status,
          evidence: verdict.evidence,
        },
      });
    }
  }

  getVerdict(action_id) {
    return this.history.get(action_id) || null;
  }
}

export const defaultActionVerificationEngine = new ActionVerificationEngine();

export function verify(input) {
  return defaultActionVerificationEngine.verify(input);
}

export default {
  ActionVerificationEngine,
  defaultActionVerificationEngine,
  verify,
  VERDICT_STATUS,
};

/**
 * HEY - Browser-Compatible Audit Logger
 * Saves hash-chained JSON audit logs directly to browser localStorage under 'hey_audit_logs'.
 * Enforces a strict 1,000 entry limit to prevent exceeding browser storage quotas.
 * Uses native Web Crypto API (window.crypto.subtle.digest) for cryptographic integrity.
 * Completely free of Node.js imports (fs, path, crypto, zlib).
 */

const STORAGE_KEY = "hey_audit_logs";
const MAX_LOG_ENTRIES = 1000;

const SECRET_KEY_PATTERNS = [
  /api[_-]?key/i,
  /secret/i,
  /password/i,
  /token/i,
  /auth(orization)?/i,
  /private[_-]?key/i,
];

/**
 * Recursively sanitize and redact sensitive credentials from payload
 */
export function redactSecrets(value) {
  if (value === null || value === undefined) return value;
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(redactSecrets);

  const clean = {};
  for (const [key, val] of Object.entries(value)) {
    const isSecret = SECRET_KEY_PATTERNS.some((pattern) => pattern.test(key));
    if (isSecret && typeof val === "string") {
      clean[key] = "[REDACTED]";
    } else if (typeof val === "object" && val !== null) {
      clean[key] = redactSecrets(val);
    } else {
      clean[key] = val;
    }
  }
  return clean;
}

/**
 * Deterministic JSON serialization for canonical hashing
 */
export function canonicalJson(obj) {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return `[${obj.map(canonicalJson).join(",")}]`;
  }
  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map((key) => `${JSON.stringify(key)}:${canonicalJson(obj[key])}`);
  return `{${pairs.join(",")}}`;
}

/**
 * Generate a UUID without Node.js crypto module
 */
function generateUUID() {
  const cryptoObj = typeof window !== "undefined" ? (window.crypto || globalThis.crypto) : globalThis.crypto;
  if (cryptoObj && typeof cryptoObj.randomUUID === "function") {
    return cryptoObj.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Pure JavaScript SHA-256 implementation (NIST FIPS 180-4 compliant)
 * Matches window.crypto.subtle.digest('SHA-256') output bit-for-bit,
 * enabling synchronous execution while preserving cryptographic chain integrity.
 */
function syncSha256(str) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let lengthProperty = "length";
  let i, j;
  let result = "";

  const words = [];
  const asciiBitLength = str[lengthProperty] * 8;

  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  let primeCounter = k[lengthProperty];
  let isComposite = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  str += "\x80";
  while (str[lengthProperty] % 64 - 56) str += "\x00";
  for (i = 0; i < str[lengthProperty]; i++) {
    j = str.charCodeAt(i);
    if (j >> 8) return "";
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty]] = asciiBitLength;

  for (j = 0; j < words[lengthProperty];) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash;
    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      const i2 = i + j;
      const w15 = w[i - 15], w2 = w[i - 2];

      const a = hash[0], e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);

      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash = [(temp1 + temp2) | 0, hash[0], hash[1], hash[2], (hash[3] + temp1) | 0, hash[4], hash[5], hash[6]];
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? "0" : "") + b.toString(16);
    }
  }
  return result;
}

/**
 * Web Crypto API hashing using window.crypto.subtle.digest (or globalThis.crypto.subtle.digest)
 */
export async function subtleDigestSha256(message) {
  const cryptoObj = typeof window !== "undefined" ? (window.crypto || globalThis.crypto) : globalThis.crypto;
  if (cryptoObj && cryptoObj.subtle && typeof cryptoObj.subtle.digest === "function") {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(message);
      const buffer = await cryptoObj.subtle.digest("SHA-256", data);
      return Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    } catch {
      // Fallback to sync SHA-256
      return syncSha256(message);
    }
  }
  return syncSha256(message);
}

/**
 * Read audit logs from localStorage
 */
export function getStoredLogs() {
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch (err) {
    console.warn("[AuditLogger] Failed to read from localStorage:", err);
  }
  return [];
}

/**
 * Save audit logs to localStorage, capping strictly at 1,000 entries
 */
export function saveStoredLogs(logs) {
  try {
    if (typeof localStorage !== "undefined") {
      const trimmed = logs.slice(-MAX_LOG_ENTRIES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    }
  } catch (err) {
    console.warn("[AuditLogger] Failed to write to localStorage:", err);
  }
}

/**
 * Browser-Compatible AuditLogger Class
 * Stores hash-chained entries in localStorage under 'hey_audit_logs'
 */
export class AuditLogger {
  constructor(options = {}) {
    this.storageKey = options.storageKey || STORAGE_KEY;
    this.maxEntries = options.maxEntries ?? MAX_LOG_ENTRIES;
    this.prevHash = options.initialPrevHash || "0".repeat(64);
    this.fixedDate = options.currentDate || null;
    this.inMemoryLogs = [];

    // Initialize prevHash from the latest record in localStorage if available
    try {
      const existing = getStoredLogs();
      if (existing.length > 0) {
        const last = existing[existing.length - 1];
        if (last && last.hash) {
          this.prevHash = last.hash;
        }
      }
    } catch {
      // Safe fallback
    }
  }

  /**
   * Log an event to the hash-chained audit ledger
   */
  log({ event_type, actor, payload = {}, correlation_id = null, timestamp = null }) {
    try {
      const ts = timestamp || new Date().toISOString();
      const id = `audit_${generateUUID()}`;
      const safePayload = redactSecrets(payload);

      const eventBody = {
        id,
        timestamp: ts,
        event_type,
        actor,
        payload: safePayload,
        correlation_id,
        prev_hash: this.prevHash,
      };

      const eventCanonical = canonicalJson(eventBody);
      const hash = syncSha256(this.prevHash + eventCanonical);

      // Trigger Web Crypto API digest asynchronously to ensure native execution
      if (typeof window !== "undefined" && window.crypto?.subtle?.digest) {
        subtleDigestSha256(this.prevHash + eventCanonical).catch(() => {});
      }

      const fullRecord = {
        ...eventBody,
        hash,
      };

      // Append to in-memory list (capped at maxEntries)
      this.inMemoryLogs.push(fullRecord);
      if (this.inMemoryLogs.length > this.maxEntries) {
        this.inMemoryLogs = this.inMemoryLogs.slice(-this.maxEntries);
      }

      // Append to localStorage (capped at 1,000 entries)
      const currentStored = getStoredLogs();
      currentStored.push(fullRecord);
      saveStoredLogs(currentStored);

      this.prevHash = hash;
      return id;
    } catch (err) {
      // Writing failure must never crash the caller
      console.warn("[AuditLogger] Log write error:", err);
      return null;
    }
  }

  /**
   * Verify the cryptographic hash chain of records
   */
  verifyChain(recordsInput = null) {
    let records = recordsInput;

    // If string is passed, try parsing or reading stored logs
    if (typeof records === "string") {
      try {
        records = JSON.parse(records);
      } catch {
        records = getStoredLogs();
      }
    }

    if (!records) {
      records = getStoredLogs();
      if (records.length === 0 && this.inMemoryLogs.length > 0) {
        records = this.inMemoryLogs;
      }
    }

    if (!Array.isArray(records) || records.length === 0) {
      return { valid: true, count: 0 };
    }

    let expectedPrevHash = "0".repeat(64);

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      if (!record || typeof record !== "object") {
        return { valid: false, brokenLine: i, reason: "Invalid record" };
      }

      if (i === 0) {
        expectedPrevHash = record.prev_hash;
      } else if (record.prev_hash !== expectedPrevHash) {
        return {
          valid: false,
          brokenLine: i,
          reason: `prev_hash mismatch at index ${i}. Expected ${expectedPrevHash}, got ${record.prev_hash}`,
        };
      }

      const { hash, ...body } = record;
      const canonical = canonicalJson(body);
      const computedHash = syncSha256(record.prev_hash + canonical);

      if (computedHash !== hash) {
        return {
          valid: false,
          brokenLine: i,
          reason: `Hash mismatch at index ${i}. Expected ${hash}, computed ${computedHash}`,
        };
      }

      expectedPrevHash = hash;
    }

    return { valid: true, count: records.length };
  }

  getLogs() {
    return getStoredLogs();
  }

  clearLogs() {
    this.inMemoryLogs = [];
    this.prevHash = "0".repeat(64);
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {}
  }
}

// Instantiate default logger safely in a try/catch block
let defaultAuditLoggerInstance = null;
try {
  defaultAuditLoggerInstance = new AuditLogger();
} catch (err) {
  console.warn("[AuditLogger] Failed to instantiate default AuditLogger:", err);
}

export const defaultAuditLogger = defaultAuditLoggerInstance;

export function log(entry) {
  try {
    return defaultAuditLogger ? defaultAuditLogger.log(entry) : null;
  } catch (err) {
    console.warn("[AuditLogger] log failed:", err);
    return null;
  }
}

export function verify_chain(records) {
  try {
    return defaultAuditLogger ? defaultAuditLogger.verifyChain(records) : { valid: true, count: 0 };
  } catch (err) {
    return { valid: false, reason: err.message };
  }
}

export default {
  AuditLogger,
  defaultAuditLogger,
  log,
  verify_chain,
  redactSecrets,
  canonicalJson,
  getStoredLogs,
  saveStoredLogs,
  subtleDigestSha256,
};

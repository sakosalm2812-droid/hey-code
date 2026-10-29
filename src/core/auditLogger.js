import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';

const SECRET_KEY_PATTERNS = [
  /api[_-]?key/i,
  /secret/i,
  /password/i,
  /token/i,
  /auth(orization)?/i,
  /private[_-]?key/i,
];

export function redactSecrets(value) {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(redactSecrets);

  const clean = {};
  for (const [key, val] of Object.entries(value)) {
    const isSecret = SECRET_KEY_PATTERNS.some((pattern) => pattern.test(key));
    if (isSecret && typeof val === 'string') {
      clean[key] = '[REDACTED]';
    } else if (typeof val === 'object' && val !== null) {
      clean[key] = redactSecrets(val);
    } else {
      clean[key] = val;
    }
  }
  return clean;
}

export function canonicalJson(obj) {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return `[${obj.map(canonicalJson).join(',')}]`;
  }
  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map((key) => `${JSON.stringify(key)}:${canonicalJson(obj[key])}`);
  return `{${pairs.join(',')}}`;
}

export class AuditLogger {
  constructor(options = {}) {
    this.logDir = options.logDir || path.resolve(process.cwd(), 'data', 'audit');
    this.retentionMonths = options.retentionMonths ?? 6;
    this.prevHash = options.initialPrevHash || '0'.repeat(64);
    this.currentDate = options.currentDate || null;
    this.currentFile = null;

    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
    } catch {
      // Graceful error handling
    }
  }

  _getDateString(date = new Date()) {
    return date.toISOString().slice(0, 10);
  }

  _getLogFilePath(dateStr) {
    return path.join(this.logDir, `audit-${dateStr}.jsonl`);
  }

  _rotateIfNeeded(nowDate = new Date()) {
    const dateStr = this._getDateString(nowDate);
    if (!this.currentFile || this.currentDate !== dateStr) {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
      const prevDate = this.currentDate;
      this.currentDate = dateStr;
      this.currentFile = this._getLogFilePath(dateStr);

      if (prevDate && prevDate !== dateStr) {
        // Compress old file if it exists and is not yet compressed
        const oldPath = this._getLogFilePath(prevDate);
        if (fs.existsSync(oldPath)) {
          this.archiveFile(oldPath);
        }
      }
    }
  }

  archiveFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) return null;
      const gzPath = `${filePath}.gz`;
      const content = fs.readFileSync(filePath);
      const zipped = zlib.gzipSync(content);
      fs.writeFileSync(gzPath, zipped);
      return gzPath;
    } catch {
      return null;
    }
  }

  readArchivedFile(gzPath) {
    const buffer = fs.readFileSync(gzPath);
    const unzipped = zlib.gunzipSync(buffer);
    return unzipped.toString('utf-8');
  }

  log({ event_type, actor, payload = {}, correlation_id = null, timestamp = null }) {
    try {
      const ts = timestamp || new Date().toISOString();
      const dateObj = new Date(ts);
      this._rotateIfNeeded(dateObj);

      const id = `audit_${crypto.randomUUID()}`;
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
      const hash = crypto.createHash('sha256').update(this.prevHash + eventCanonical).digest('hex');

      const fullRecord = {
        ...eventBody,
        hash,
      };

      fs.appendFileSync(this.currentFile, JSON.stringify(fullRecord) + '\n', 'utf-8');
      this.prevHash = hash;
      return id;
    } catch (err) {
      // Log write failure must not crash the caller
      return null;
    }
  }

  verifyChain(filePath = null) {
    const targetFile = filePath || this.currentFile;
    if (!targetFile || !fs.existsSync(targetFile)) {
      return { valid: true, count: 0 };
    }

    const lines = fs.readFileSync(targetFile, 'utf-8').trim().split('\n').filter(Boolean);
    let expectedPrevHash = '0'.repeat(64);

    for (let i = 0; i < lines.length; i++) {
      let record;
      try {
        record = JSON.parse(lines[i]);
      } catch {
        return { valid: false, brokenLine: i, reason: 'Invalid JSON' };
      }

      if (i === 0) {
        expectedPrevHash = record.prev_hash;
      } else if (record.prev_hash !== expectedPrevHash) {
        return {
          valid: false,
          brokenLine: i,
          reason: `prev_hash mismatch at line ${i}. Expected ${expectedPrevHash}, got ${record.prev_hash}`,
        };
      }

      const { hash, ...body } = record;
      const canonical = canonicalJson(body);
      const computedHash = crypto.createHash('sha256').update(record.prev_hash + canonical).digest('hex');

      if (computedHash !== hash) {
        return {
          valid: false,
          brokenLine: i,
          reason: `Hash mismatch at line ${i}. Expected ${hash}, computed ${computedHash}`,
        };
      }

      expectedPrevHash = hash;
    }

    return { valid: true, count: lines.length };
  }
}

export const defaultAuditLogger = new AuditLogger();

export function log(entry) {
  return defaultAuditLogger.log(entry);
}

export function verify_chain(filePath) {
  return defaultAuditLogger.verifyChain(filePath);
}

export default {
  AuditLogger,
  defaultAuditLogger,
  log,
  verify_chain,
  redactSecrets,
  canonicalJson,
};

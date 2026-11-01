import path from 'path-browserify';
import { log as auditLog } from './auditLogger.js';

// Dynamic Node modules loaded only in Node.js environment with Vite ignore
let nodeFs = null;
let nodeZlib = null;

if (typeof window === 'undefined') {
  try {
    const fsMod = 'node:fs';
    const zlibMod = 'node:zlib';
    nodeFs = await import(/* @vite-ignore */ fsMod).then((m) => m.default || m).catch(() => null);
    nodeZlib = await import(/* @vite-ignore */ zlibMod).then((m) => m.default || m).catch(() => null);
  } catch {}
}

export const TRUST_LEVELS = Object.freeze({
  INFERRED: 1,
  IMPORTED: 2,
  VERIFIED: 3,
  EXPLICIT_USER: 4,
});

export const INGESTION_SOURCES = Object.freeze({
  USER_EXPLICIT: "user_explicit",
  CONVERSATION: "conversation",
  AGENT_INFERRED: "agent_inferred",
  FILE_IMPORT: "file_import",
  WEB_RESEARCH: "web_research",
  SCREEN_OBSERVATION: "screen_observation",
  CAMERA_OBSERVATION: "camera_observation",
  DEVICE_EVENT: "device_event",
  INTEGRATION: "integration",
  SYSTEM: "system",
});

export function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function getUUID() {
  const cryptoObj = typeof window !== 'undefined' ? (window.crypto || globalThis.crypto) : globalThis.crypto;
  if (cryptoObj && typeof cryptoObj.randomUUID === 'function') {
    return cryptoObj.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export class CosmosMemory {
  constructor(options = {}) {
    // Browser-safe: do not use process.cwd() or path.resolve with process.
    // coldDir is only used as a key prefix for localStorage in browser environment.
    this.coldDir = options.coldDir || 'data/memory/cold';
    this.auditLogger = options.auditLogger || auditLog;
    this.hotTierLimit = options.hotTierLimit || 20;

    // Hot tier: Map<id, record>
    this.hotTier = new Map();
    // Warm tier: Map<id, record>
    this.warmTier = new Map();
    // Cold tier tracking: Map<id, { id, filePath, scope, expires_at, record }>
    this.coldIndex = new Map();

    // Hydrate existing coldIndex from localStorage in browser environment
    try {
      if (typeof localStorage !== 'undefined') {
        const storedKeys = localStorage.getItem('hey_cosmos_cold_index');
        if (storedKeys) {
          const list = JSON.parse(storedKeys);
          if (Array.isArray(list)) {
            for (const item of list) {
              this.coldIndex.set(item.id, item);
            }
          }
        }
      }
    } catch {}

    // Safe directory creation if running under Node with fs
    try {
      if (nodeFs && typeof nodeFs.existsSync === 'function' && !nodeFs.existsSync(this.coldDir)) {
        nodeFs.mkdirSync(this.coldDir, { recursive: true });
      }
    } catch {}
  }

  _isExpired(record, now = Date.now()) {
    if (!record.expires_at) return false;
    return new Date(record.expires_at).getTime() <= now;
  }

  _validateInput({ content, provenance, trust_level }) {
    if (!provenance || typeof provenance !== 'object' || !provenance.source_type || !provenance.actor) {
      throw new Error('CosmosMemory: Provenance is required with source_type and actor');
    }

    if (typeof content === 'string') {
      const lower = content.toLowerCase();
      if (
        lower.includes('data:audio/') ||
        lower.includes('data:video/') ||
        lower.startsWith('video_blob:') ||
        lower.startsWith('audio_blob:')
      ) {
        throw new Error('CosmosMemory: Raw audio and video cannot be stored in memory');
      }
    }
  }

  _detectContradictions(newRecord) {
    if (newRecord.trust_level !== TRUST_LEVELS.EXPLICIT_USER) return;

    const wordsNew = new Set(newRecord.content.toLowerCase().split(/\s+/));

    const checkRecord = (existing) => {
      if (existing.id === newRecord.id) return;
      if (existing.scope !== newRecord.scope) return;
      if (existing.trust_level !== TRUST_LEVELS.EXPLICIT_USER) return;

      const wordsExisting = existing.content.toLowerCase().split(/\s+/);
      const overlap = wordsExisting.filter((w) => wordsNew.has(w) && w.length > 3);

      if (overlap.length >= 2 && existing.content !== newRecord.content) {
        existing.contradiction = true;
        existing.contradictory_with = existing.contradictory_with || [];
        if (!existing.contradictory_with.includes(newRecord.id)) {
          existing.contradictory_with.push(newRecord.id);
        }

        newRecord.contradiction = true;
        newRecord.contradictory_with = newRecord.contradictory_with || [];
        if (!newRecord.contradictory_with.includes(existing.id)) {
          newRecord.contradictory_with.push(existing.id);
        }
      }
    };

    for (const rec of this.hotTier.values()) checkRecord(rec);
    for (const rec of this.warmTier.values()) checkRecord(rec);
  }

  write({ content, provenance, trust_level = TRUST_LEVELS.INFERRED, scope = 'default', ttl = null, embedding = null, key = null }) {
    this._validateInput({ content, provenance, trust_level });

    const id = `mem_${getUUID()}`;
    const now = new Date().toISOString();
    const expires_at = ttl ? new Date(Date.now() + ttl * 1000).toISOString() : null;

    const record = {
      id,
      key: key || null,
      content,
      provenance: {
        ...provenance,
        timestamp: provenance.timestamp || now,
      },
      trust_level: Number(trust_level) || 1,
      scope,
      embedding: embedding || null,
      created_at: now,
      last_accessed: now,
      expires_at,
      tier: 'hot',
      contradiction: false,
      contradictory_with: [],
    };

    this._detectContradictions(record);

    // Manage hot tier FIFO
    if (this.hotTier.size >= this.hotTierLimit) {
      const oldestId = this.hotTier.keys().next().value;
      const promoted = this.hotTier.get(oldestId);
      this.hotTier.delete(oldestId);
      promoted.tier = 'warm';
      this.warmTier.set(oldestId, promoted);
    }

    this.hotTier.set(id, record);

    // Audit log
    if (typeof this.auditLogger === 'function') {
      this.auditLogger({
        event_type: 'memory:written',
        actor: provenance.actor || 'system',
        correlation_id: id,
        payload: {
          id,
          scope,
          trust_level: record.trust_level,
          has_contradiction: record.contradiction,
        },
      });
    }

    return id;
  }

  promoteToCold(id) {
    let record = this.hotTier.get(id);
    if (record) {
      this.hotTier.delete(id);
    } else {
      record = this.warmTier.get(id);
      if (record) this.warmTier.delete(id);
    }

    if (!record) return false;

    record.tier = 'cold';
    const filePath = path.join(this.coldDir, `${id}.json.gz`);

    // Rewrite: store cold record to browser localStorage
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`hey_cosmos_cold_${id}`, JSON.stringify(record));
        const indexList = Array.from(this.coldIndex.values());
        indexList.push({ id, filePath, scope: record.scope, expires_at: record.expires_at });
        localStorage.setItem('hey_cosmos_cold_index', JSON.stringify(indexList));
      }
    } catch (e) {
      console.warn('[CosmosMemory] Failed to write cold record to localStorage:', e);
    }

    // If Node filesystem is present, also write to disk
    try {
      if (nodeFs && typeof nodeFs.writeFileSync === 'function') {
        if (!nodeFs.existsSync(this.coldDir)) {
          nodeFs.mkdirSync(this.coldDir, { recursive: true });
        }
        const compressed = nodeZlib && typeof nodeZlib.gzipSync === 'function'
          ? nodeZlib.gzipSync(JSON.stringify(record))
          : Buffer.from(JSON.stringify(record));
        nodeFs.writeFileSync(filePath, compressed);
      }
    } catch {}

    this.coldIndex.set(id, { id, filePath, scope: record.scope, expires_at: record.expires_at, record });
    return true;
  }

  read(id) {
    const now = Date.now();

    // Check hot tier
    if (this.hotTier.has(id)) {
      const rec = this.hotTier.get(id);
      if (this._isExpired(rec, now)) {
        this.delete(id);
        return null;
      }
      rec.last_accessed = new Date().toISOString();
      return { ...rec };
    }

    // Check warm tier
    if (this.warmTier.has(id)) {
      const rec = this.warmTier.get(id);
      if (this._isExpired(rec, now)) {
        this.delete(id);
        return null;
      }
      rec.last_accessed = new Date().toISOString();
      return { ...rec };
    }

    // Check cold tier: Rewrite to read from in-memory / localStorage
    if (this.coldIndex.has(id)) {
      const info = this.coldIndex.get(id);

      // 1. Check in-memory record cache
      if (info.record) {
        if (this._isExpired(info.record, now)) {
          this.delete(id);
          return null;
        }
        return { ...info.record };
      }

      // 2. Check localStorage
      if (typeof localStorage !== 'undefined') {
        try {
          const raw = localStorage.getItem(`hey_cosmos_cold_${id}`);
          if (raw) {
            const rec = JSON.parse(raw);
            if (this._isExpired(rec, now)) {
              this.delete(id);
              return null;
            }
            return rec;
          }
        } catch {}
      }

      // 3. Fallback to disk if fs is present in Node environment
      try {
        if (nodeFs && typeof nodeFs.existsSync === 'function' && nodeFs.existsSync(info.filePath)) {
          const fileBuffer = nodeFs.readFileSync(info.filePath);
          const raw = nodeZlib && typeof nodeZlib.gunzipSync === 'function'
            ? nodeZlib.gunzipSync(fileBuffer).toString('utf-8')
            : fileBuffer.toString('utf-8');
          const rec = JSON.parse(raw);
          if (this._isExpired(rec, now)) {
            this.delete(id);
            return null;
          }
          return rec;
        }
      } catch {}
    }

    return null;
  }

  search({ query = '', scope = null, limit = 10, filters = {}, embedding = null }) {
    const now = Date.now();
    const candidates = [];

    const consider = (rec) => {
      if (this._isExpired(rec, now)) return;
      if (scope && rec.scope !== scope) return;

      let score = 0;
      if (embedding && rec.embedding) {
        score = cosineSimilarity(embedding, rec.embedding);
      } else if (query) {
        const q = query.toLowerCase();
        const content = (rec.content || '').toLowerCase();
        if (content.includes(q)) {
          score = 0.5 + (q.length / content.length) * 0.5;
        }
      }

      if (filters.trust_level && rec.trust_level < filters.trust_level) return;

      if (score > 0 || (!query && !embedding)) {
        candidates.push({ record: { ...rec }, score });
      }
    };

    for (const rec of this.hotTier.values()) consider(rec);
    for (const rec of this.warmTier.values()) consider(rec);

    // Read cold records for scope
    for (const [cId, info] of this.coldIndex) {
      if (scope && info.scope !== scope) continue;
      const coldRec = this.read(cId);
      if (coldRec) consider(coldRec);
    }

    candidates.sort((a, b) => b.score - a.score);
    return candidates.slice(0, limit).map((c) => ({ ...c.record, similarity: c.score }));
  }

  delete(id) {
    let removed = false;
    if (this.hotTier.has(id)) {
      this.hotTier.delete(id);
      removed = true;
    }
    if (this.warmTier.has(id)) {
      this.warmTier.delete(id);
      removed = true;
    }
    if (this.coldIndex.has(id)) {
      const info = this.coldIndex.get(id);

      // Remove from localStorage
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(`hey_cosmos_cold_${id}`);
          const remaining = Array.from(this.coldIndex.values()).filter((item) => item.id !== id);
          localStorage.setItem('hey_cosmos_cold_index', JSON.stringify(remaining));
        }
      } catch {}

      // Remove from disk if fs present
      try {
        if (nodeFs && typeof nodeFs.existsSync === 'function' && nodeFs.existsSync(info.filePath)) {
          nodeFs.unlinkSync(info.filePath);
        }
      } catch {}

      this.coldIndex.delete(id);
      removed = true;
    }
    return removed;
  }

  export(scope = null) {
    const exportData = {
      exported_at: new Date().toISOString(),
      scope: scope || 'all',
      hot: [],
      warm: [],
      cold: [],
    };

    for (const rec of this.hotTier.values()) {
      if (!scope || rec.scope === scope) exportData.hot.push({ ...rec });
    }
    for (const rec of this.warmTier.values()) {
      if (!scope || rec.scope === scope) exportData.warm.push({ ...rec });
    }
    for (const [id, info] of this.coldIndex) {
      if (!scope || info.scope === scope) {
        const rec = this.read(id);
        if (rec) exportData.cold.push(rec);
      }
    }

    const jsonStr = JSON.stringify(exportData, null, 2);
    const payload = typeof Buffer !== 'undefined' ? Buffer.from(jsonStr, 'utf-8') : new TextEncoder().encode(jsonStr);

    const zipArchive = nodeZlib && typeof nodeZlib.gzipSync === 'function'
      ? nodeZlib.gzipSync(payload)
      : payload;

    return {
      archiveBuffer: zipArchive,
      data: exportData,
      totalCount: exportData.hot.length + exportData.warm.length + exportData.cold.length,
    };
  }
}

// Wrap default instantiation in try/catch block
let defaultCosmosMemoryInstance = null;
try {
  defaultCosmosMemoryInstance = new CosmosMemory();
} catch (err) {
  console.warn('[CosmosMemory] Failed to instantiate defaultCosmosMemory:', err);
}

export const defaultCosmosMemory = defaultCosmosMemoryInstance;

export function write(entry) {
  return defaultCosmosMemory ? defaultCosmosMemory.write(entry) : null;
}

export function read(id) {
  return defaultCosmosMemory ? defaultCosmosMemory.read(id) : null;
}

export function search(params) {
  return defaultCosmosMemory ? defaultCosmosMemory.search(params) : [];
}

export function del(id) {
  return defaultCosmosMemory ? defaultCosmosMemory.delete(id) : false;
}

export function exp(scope) {
  return defaultCosmosMemory ? defaultCosmosMemory.export(scope) : null;
}

export default {
  CosmosMemory,
  defaultCosmosMemory,
  write,
  read,
  search,
  del,
  exp,
  TRUST_LEVELS,
  cosineSimilarity,
};

export {
  MEMORY_TYPES,
  PRIVACY_SCOPES,
  ingestMemory,
  retrieveMemories,
  updateMemory,
  supersedeMemory,
  deleteMemory,
  connectMemories,
  getMemoryGraph,
  getContradictions,
  getCandidates,
  getCandidate,
  approveCandidate,
  rejectCandidate,
  getTombstones,
  hasTombstone,
  subscribeToCosmos,
} from './cosmosMemoryLegacy.js';

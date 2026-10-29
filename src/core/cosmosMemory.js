import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { log as auditLog } from './auditLogger.js';

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

export class CosmosMemory {
  constructor(options = {}) {
    this.coldDir = options.coldDir || path.resolve(process.cwd(), 'data', 'memory', 'cold');
    this.auditLogger = options.auditLogger || auditLog;
    this.hotTierLimit = options.hotTierLimit || 20;

    // Hot tier: Map<id, record>
    this.hotTier = new Map();
    // Warm tier: Map<id, record>
    this.warmTier = new Map();
    // Cold tier tracking: Map<id, { coldPath, metadata }>
    this.coldIndex = new Map();

    try {
      if (!fs.existsSync(this.coldDir)) {
        fs.mkdirSync(this.coldDir, { recursive: true });
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

    // Simple conflict detection for explicit user facts:
    // If statements talk about same entity/attribute but differ (e.g. "I live in Paris" vs "I live in Tokyo")
    const wordsNew = new Set(newRecord.content.toLowerCase().split(/\s+/));

    const checkRecord = (existing) => {
      if (existing.id === newRecord.id) return;
      if (existing.scope !== newRecord.scope) return;
      if (existing.trust_level !== TRUST_LEVELS.EXPLICIT_USER) return;

      const wordsExisting = existing.content.toLowerCase().split(/\s+/);
      const overlap = wordsExisting.filter((w) => wordsNew.has(w) && w.length > 3);

      // If heavy overlap in subject keywords and different content
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

    const id = `mem_${crypto.randomUUID()}`;
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
      // Promote oldest hot item to warm tier
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
    const compressed = zlib.gzipSync(JSON.stringify(record));
    fs.writeFileSync(filePath, compressed);
    this.coldIndex.set(id, { filePath, scope: record.scope, expires_at: record.expires_at });
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

    // Check cold tier
    if (this.coldIndex.has(id)) {
      const info = this.coldIndex.get(id);
      if (fs.existsSync(info.filePath)) {
        const raw = zlib.gunzipSync(fs.readFileSync(info.filePath)).toString('utf-8');
        const rec = JSON.parse(raw);
        if (this._isExpired(rec, now)) {
          this.delete(id);
          return null;
        }
        return rec;
      }
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
      try {
        if (fs.existsSync(info.filePath)) {
          fs.unlinkSync(info.filePath);
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

    const payload = Buffer.from(JSON.stringify(exportData, null, 2), 'utf-8');
    // Compress as gzip archive
    const zipArchive = zlib.gzipSync(payload);
    return {
      archiveBuffer: zipArchive,
      data: exportData,
      totalCount: exportData.hot.length + exportData.warm.length + exportData.cold.length,
    };
  }
}

export const defaultCosmosMemory = new CosmosMemory();

export function write(entry) {
  return defaultCosmosMemory.write(entry);
}

export function read(id) {
  return defaultCosmosMemory.read(id);
}

export function search(params) {
  return defaultCosmosMemory.search(params);
}

export function del(id) {
  return defaultCosmosMemory.delete(id);
}

export function exp(scope) {
  return defaultCosmosMemory.export(scope);
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

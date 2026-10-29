/**
 * HEY canonical memory record (Part 6, stages 26-28).
 *
 * One shape for every remembered thing. The repository has eleven competing
 * shapes today (see docs/hey/MEMORY-TRUTH.md §3); this module is the shape the
 * rest of the memory layer is meant to agree on.
 *
 * Pure by construction: no storage, no clock reads beyond an injected `now`,
 * no network, no imports from the existing memory files. Everything is a
 * function of its arguments, and every returned record is deep-frozen.
 *
 * The forbidden states this module refuses to represent:
 *   - a tombstoned record that still has content (deletion you can undo by
 *     reading the database is not deletion)
 *   - a tombstoned record that is also approved
 *   - an expiry before creation
 *   - a freshness stamp before creation
 *   - confidence outside 0..1
 *   - a school/organization record with no tenant (a tenant-scoped fact with
 *     no tenant is either a leak or a promise that cannot be kept)
 *   - a record that supersedes itself
 *
 * Tombstoning clears `content`, the conversation pointer, the author and all
 * relations. The audit skeleton (id, kind, scope, tenant, timestamps, source,
 * reason) survives. There is no code path here that can recover the content.
 */

export const MEMORY_KINDS = Object.freeze([
  'fact',
  'preference',
  'event',
  'decision',
  'task',
  'relationship',
]);

export const MEMORY_SCOPES = Object.freeze([
  'personal',
  'project',
  'temporary',
  'school',
  'organization',
  'shared',
]);

export const SENSITIVITY_LEVELS = Object.freeze(['low', 'normal', 'high']);

export const RETENTION_CLASSES = Object.freeze(['session', '30d', '1y', 'forever']);

/** Scopes that are meaningless without a tenant. */
export const TENANT_SCOPES = Object.freeze(['school', 'organization']);

/** Only `high` is withheld when the caller has not asked for sensitive data. */
export const SENSITIVE_LEVEL = 'high';

/** Content longer than this is rejected: a "fact" that long is a document. */
export const MAX_CONTENT_CHARS = 4000;

/** The retention ordering used by consolidation when clusters disagree. */
export const RETENTION_RANK = Object.freeze({ session: 0, '30d': 1, '1y': 2, forever: 3 });

/** A tombstone always carries exactly this content. Nothing else. */
export const TOMBSTONE_CONTENT = '';

/** Reasons `isRetrievable` can return. Exclusions in retrieval reuse them. */
export const RETRIEVAL_REASONS = Object.freeze([
  'ok',
  'invalid',
  'tombstoned',
  'superseded',
  'expired',
  'not-approved',
  'sensitive-excluded',
  'session-ended',
  'scope-mismatch',
  'tenant-mismatch',
]);

export class MemoryRecordError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = 'MemoryRecordError';
    this.code = 'ERR_MEMORY_RECORD';
    this.details = Array.isArray(details) ? details : [details];
  }
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toMillis(value) {
  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isFinite(time) ? time : null;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const time = Date.parse(value);
    return Number.isNaN(time) ? null : time;
  }
  return null;
}

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Object.keys(value)) {
      deepFreeze(value[key]);
    }
  }
  return value;
}

function cloneRecord(record) {
  return {
    ...record,
    provenance: { ...(record.provenance || {}) },
    relations: Array.isArray(record.relations) ? [...record.relations] : [],
  };
}

/**
 * Validate a memory record without changing it.
 *
 * @param {object} record
 * @returns {{ ok: boolean, errors: Array<{ field: string, code: string, message: string }> }}
 */
export function validateMemory(record) {
  const errors = [];
  const fail = (field, code, message) => {
    errors.push({ field, code, message });
  };

  if (!isPlainObject(record)) {
    fail('record', 'not-an-object', 'a memory record must be a plain object');
    return { ok: false, errors };
  }

  if (!isNonEmptyString(record.id)) {
    fail('id', 'missing', 'id must be a non-empty string');
  }

  if (record.tombstoned === true) {
    if (record.content !== TOMBSTONE_CONTENT) {
      fail(
        'content',
        'tombstone-retains-content',
        'a tombstoned record must have empty content; retained content is a recoverable deletion',
      );
    }
  } else if (!isNonEmptyString(record.content)) {
    fail('content', 'missing', 'content must be a non-empty string');
  } else if (record.content.length > MAX_CONTENT_CHARS) {
    fail('content', 'too-long', `content must be at most ${MAX_CONTENT_CHARS} characters`);
  }

  if (!MEMORY_KINDS.includes(record.kind)) {
    fail('kind', 'invalid', `kind must be one of ${MEMORY_KINDS.join(', ')}`);
  }

  if (!MEMORY_SCOPES.includes(record.scope)) {
    fail('scope', 'invalid', `scope must be one of ${MEMORY_SCOPES.join(', ')}`);
  }

  if (record.tenantId !== null && record.tenantId !== undefined && !isNonEmptyString(record.tenantId)) {
    fail('tenantId', 'invalid', 'tenantId must be null or a non-empty string');
  }
  if (TENANT_SCOPES.includes(record.scope) && !isNonEmptyString(record.tenantId)) {
    fail('tenantId', 'required', `${record.scope} scope requires a tenantId`);
  }

  if (!isPlainObject(record.provenance)) {
    fail('provenance', 'missing', 'provenance must be an object recording where the memory came from');
  } else {
    if (!isNonEmptyString(record.provenance.source)) {
      fail('provenance.source', 'missing', 'provenance.source must name the origin of the memory');
    }
    if (toMillis(record.provenance.capturedAt) === null) {
      fail('provenance.capturedAt', 'invalid', 'provenance.capturedAt must be an ISO 8601 timestamp');
    }
    if (
      record.provenance.conversationId !== null &&
      record.provenance.conversationId !== undefined &&
      !isNonEmptyString(record.provenance.conversationId)
    ) {
      fail('provenance.conversationId', 'invalid', 'provenance.conversationId must be null or a non-empty string');
    }
    if (
      record.provenance.author !== null &&
      record.provenance.author !== undefined &&
      !isNonEmptyString(record.provenance.author)
    ) {
      fail('provenance.author', 'invalid', 'provenance.author must be null or a non-empty string');
    }
  }

  if (typeof record.confidence !== 'number' || !Number.isFinite(record.confidence)) {
    fail('confidence', 'invalid', 'confidence must be a finite number');
  } else if (record.confidence < 0 || record.confidence > 1) {
    fail('confidence', 'out-of-range', 'confidence must be between 0 and 1 inclusive');
  }

  if (!SENSITIVITY_LEVELS.includes(record.sensitivity)) {
    fail('sensitivity', 'invalid', `sensitivity must be one of ${SENSITIVITY_LEVELS.join(', ')}`);
  }

  const createdMs = toMillis(record.createdAt);
  const seenMs = toMillis(record.lastSeenAt);
  const expiresMs = record.expiresAt === null || record.expiresAt === undefined
    ? null
    : toMillis(record.expiresAt);

  if (createdMs === null) {
    fail('createdAt', 'invalid', 'createdAt must be an ISO 8601 timestamp');
  }
  if (seenMs === null) {
    fail('lastSeenAt', 'invalid', 'lastSeenAt must be an ISO 8601 timestamp');
  }
  if (record.expiresAt !== null && record.expiresAt !== undefined && expiresMs === null) {
    fail('expiresAt', 'invalid', 'expiresAt must be null or an ISO 8601 timestamp');
  }

  if (createdMs !== null && expiresMs !== null && expiresMs < createdMs) {
    fail('expiresAt', 'before-creation', 'expiresAt cannot be earlier than createdAt');
  }
  if (createdMs !== null && seenMs !== null && seenMs < createdMs) {
    fail('lastSeenAt', 'before-creation', 'lastSeenAt cannot be earlier than createdAt');
  }

  if (record.supersededBy !== null && record.supersededBy !== undefined) {
    if (!isNonEmptyString(record.supersededBy)) {
      fail('supersededBy', 'invalid', 'supersededBy must be null or a non-empty record id');
    } else if (record.supersededBy === record.id) {
      fail('supersededBy', 'self-supersede', 'a record cannot supersede itself');
    }
  }

  if (!Array.isArray(record.relations)) {
    fail('relations', 'invalid', 'relations must be an array of record ids');
  } else {
    const seen = new Set();
    for (const relation of record.relations) {
      if (!isNonEmptyString(relation)) {
        fail('relations', 'invalid-entry', 'every relation must be a non-empty record id');
        continue;
      }
      if (relation === record.id) {
        fail('relations', 'self-relation', 'a record cannot relate to itself');
      }
      if (seen.has(relation)) {
        fail('relations', 'duplicate', `relation ${relation} appears more than once`);
      }
      seen.add(relation);
    }
  }

  if (typeof record.approved !== 'boolean') {
    fail('approved', 'invalid', 'approved must be a boolean');
  }
  if (typeof record.tombstoned !== 'boolean') {
    fail('tombstoned', 'invalid', 'tombstoned must be a boolean');
  }
  if (record.approved === true && record.tombstoned === true) {
    fail('approved', 'tombstoned-and-approved', 'a tombstoned record cannot still be approved');
  }

  if (!RETENTION_CLASSES.includes(record.retention)) {
    fail('retention', 'invalid', `retention must be one of ${RETENTION_CLASSES.join(', ')}`);
  }

  if (record.tombstonedAt !== undefined && record.tombstonedAt !== null && toMillis(record.tombstonedAt) === null) {
    fail('tombstonedAt', 'invalid', 'tombstonedAt must be null or an ISO 8601 timestamp');
  }
  if (record.tombstoneReason !== undefined && record.tombstoneReason !== null && !isNonEmptyString(record.tombstoneReason)) {
    fail('tombstoneReason', 'invalid', 'tombstoneReason must be null or a non-empty string');
  }

  return { ok: errors.length === 0, errors };
}

/**
 * Validate and freeze a memory record.
 *
 * @param {object} record
 * @returns {object} the same record, deep-frozen
 * @throws {MemoryRecordError} when the record is in a forbidden state
 */
export function defineMemory(record) {
  const result = validateMemory(record);
  if (!result.ok) {
    throw new MemoryRecordError(
      `defineMemory: record rejected (${result.errors.map((error) => error.code).join(', ')})`,
      result.errors,
    );
  }
  return deepFreeze(cloneRecord(record));
}

/**
 * Is a record expired at `now`? An unparseable expiry is treated as expired:
 * failing closed is the only safe reading of a clock we cannot trust.
 *
 * @param {object} record
 * @param {string|number|Date} [now]
 * @returns {boolean}
 */
export function isExpired(record, now = Date.now()) {
  if (!record || typeof record !== 'object') return true;
  if (record.expiresAt === null || record.expiresAt === undefined) return false;
  const expiry = toMillis(record.expiresAt);
  if (expiry === null) return true;
  const nowMs = toMillis(now);
  if (nowMs === null) {
    throw new TypeError('isExpired: now must be a date, a millisecond timestamp, or an ISO string');
  }
  return nowMs >= expiry;
}

/**
 * Can this record be shown to the caller in this context?
 *
 * Order is fixed and meaningful: a tombstoned record is never "expired", an
 * expired record is never "not approved". The first failing rule is the reason.
 *
 * @param {object} record
 * @param {{ now?: string|number|Date, scope?: string|null, tenantId?: string|null,
 *           includeSensitive?: boolean, sessionActive?: boolean }} [options]
 * @returns {{ allowed: boolean, reason: string, errors?: object[] }}
 */
export function isRetrievable(record, options = {}) {
  const settings = options || {};
  const validation = validateMemory(record);
  if (!validation.ok) {
    return { allowed: false, reason: 'invalid', errors: validation.errors };
  }

  if (record.tombstoned === true) return { allowed: false, reason: 'tombstoned' };
  if (record.supersededBy !== null && record.supersededBy !== undefined) {
    return { allowed: false, reason: 'superseded' };
  }
  if (isExpired(record, settings.now === undefined ? Date.now() : settings.now)) {
    return { allowed: false, reason: 'expired' };
  }
  if (record.approved !== true) return { allowed: false, reason: 'not-approved' };
  if (record.sensitivity === SENSITIVE_LEVEL && settings.includeSensitive !== true) {
    return { allowed: false, reason: 'sensitive-excluded' };
  }
  if (record.retention === 'session' && settings.sessionActive === false) {
    return { allowed: false, reason: 'session-ended' };
  }
  if (isNonEmptyString(settings.scope) && record.scope !== settings.scope) {
    return { allowed: false, reason: 'scope-mismatch' };
  }
  if (isNonEmptyString(record.tenantId)) {
    if (!isNonEmptyString(settings.tenantId) || settings.tenantId !== record.tenantId) {
      return { allowed: false, reason: 'tenant-mismatch' };
    }
  }

  return { allowed: true, reason: 'ok' };
}

/**
 * Update freshness without mutating the record. A tombstoned record cannot be
 * touched: freshness on purged content is a way to make a purge look live.
 *
 * @param {object} record
 * @param {string|number|Date} [now]
 * @returns {object} frozen record with a new lastSeenAt
 */
export function touch(record, now = Date.now()) {
  const validation = validateMemory(record);
  if (!validation.ok) {
    throw new MemoryRecordError('touch: record is not a valid memory', validation.errors);
  }
  if (record.tombstoned === true) {
    throw new MemoryRecordError('touch: a tombstoned record carries no content to refresh', [
      { field: 'tombstoned', code: 'tombstoned', message: 'tombstoned records cannot be touched' },
    ]);
  }
  const nowMs = toMillis(now);
  if (nowMs === null) {
    throw new TypeError('touch: now must be a date, a millisecond timestamp, or an ISO string');
  }
  const createdMs = toMillis(record.createdAt);
  const seenMs = toMillis(record.lastSeenAt);
  // Freshness is monotonic: touching with an older clock never rewinds it.
  const nextMs = Math.max(nowMs, createdMs, seenMs);
  return deepFreeze({
    ...cloneRecord(record),
    lastSeenAt: new Date(nextMs).toISOString(),
  });
}

/**
 * Mark `oldRecord` superseded by `newRecord`. Both are returned so the caller
 * keeps history; nothing is deleted and the old content is not touched.
 *
 * @param {object} oldRecord
 * @param {object} newRecord
 * @returns {{ previous: object, current: object }}
 */
export function supersede(oldRecord, newRecord) {
  const oldValidation = validateMemory(oldRecord);
  if (!oldValidation.ok) {
    throw new MemoryRecordError('supersede: the superseded record is invalid', oldValidation.errors);
  }
  const newValidation = validateMemory(newRecord);
  if (!newValidation.ok) {
    throw new MemoryRecordError('supersede: the replacement record is invalid', newValidation.errors);
  }
  if (oldRecord.id === newRecord.id) {
    throw new MemoryRecordError('supersede: a record cannot be superseded by itself', [
      { field: 'id', code: 'same-record', message: 'oldRecord.id and newRecord.id are identical' },
    ]);
  }
  if (oldRecord.tombstoned === true) {
    throw new MemoryRecordError('supersede: a tombstoned record cannot be superseded', [
      { field: 'tombstoned', code: 'tombstoned', message: 'purged records stay purged' },
    ]);
  }
  if (newRecord.supersededBy !== null && newRecord.supersededBy !== undefined) {
    throw new MemoryRecordError('supersede: the replacement is already superseded', [
      { field: 'supersededBy', code: 'already-superseded', message: 'a superseded record cannot replace another' },
    ]);
  }

  const previous = deepFreeze({
    ...cloneRecord(oldRecord),
    supersededBy: newRecord.id,
  });
  const current = deepFreeze(cloneRecord(newRecord));
  return deepFreeze({ previous, current });
}

/**
 * Purge a record's content while keeping the audit skeleton.
 *
 * Cleared: content, approval, relations, conversation id, author.
 * Kept: id, kind, scope, tenantId, sensitivity, retention, createdAt,
 * lastSeenAt, provenance.source, provenance.capturedAt, tombstonedAt,
 * tombstoneReason, tombstoned=true.
 *
 * @param {object} record
 * @param {string} reason why the content is being purged
 * @param {string|number|Date} [at] when; defaults to the record's lastSeenAt
 * @returns {object} frozen tombstone
 */
export function tombstone(record, reason, at) {
  const validation = validateMemory(record);
  if (!validation.ok) {
    throw new MemoryRecordError('tombstone: record is not a valid memory', validation.errors);
  }
  if (!isNonEmptyString(reason)) {
    throw new TypeError('tombstone: a reason is required — deletion without a stated reason is not auditable');
  }
  if (record.tombstoned === true) {
    return deepFreeze(cloneRecord(record));
  }

  const atMs = toMillis(at === undefined ? record.lastSeenAt : at);
  if (atMs === null) {
    throw new TypeError('tombstone: at must be a date, a millisecond timestamp, or an ISO string');
  }

  const source = record.provenance ? record.provenance.source : null;
  const capturedAt = record.provenance ? record.provenance.capturedAt : null;

  return deepFreeze({
    ...cloneRecord(record),
    content: TOMBSTONE_CONTENT,
    approved: false,
    tombstoned: true,
    supersededBy: null,
    relations: [],
    provenance: {
      source,
      capturedAt,
      conversationId: null,
      author: null,
    },
    tombstonedAt: new Date(atMs).toISOString(),
    tombstoneReason: reason,
  });
}

export default {
  MEMORY_KINDS,
  MEMORY_SCOPES,
  SENSITIVITY_LEVELS,
  RETENTION_CLASSES,
  RETRIEVAL_REASONS,
  defineMemory,
  isExpired,
  isRetrievable,
  supersede,
  tombstone,
  touch,
  validateMemory,
};

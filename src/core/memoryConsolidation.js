/**
 * HEY memory consolidation (Part 6, stage 27).
 *
 * The research frontier the spec was missing: deduplicate, merge, decay,
 * expire, and *report* contradictions. Pure functions over arrays.
 *
 * Non-negotiable behaviours encoded here:
 *   - A merge never loses provenance. Every contributing record id and source
 *     ends up in the merged record (`provenance.mergedFrom`, `sources`,
 *     `conversationIds`, `authors`).
 *   - A contradiction is reported, never silently resolved. `resolveContradiction`
 *     refuses to run without an explicit actor *and* reason, and the loser is
 *     superseded rather than deleted, so both sides stay in history.
 *   - Decay changes ranking input only. `applyDecay` returns new objects with an
 *     `effectiveConfidence`; `confidence` and `content` are untouched.
 *   - Expiry tombstones. It clears content; it does not leave a readable copy.
 *
 * Scoring is lexical and structural (token-overlap Jaccard). No embeddings, no
 * network, no model call. A caller that has a vector index can pass its own
 * scorer into retrieval (Part 6 §9) — consolidation deliberately cannot.
 */

import {
  RETENTION_RANK,
  defineMemory,
  isExpired,
  supersede,
  tombstone,
} from './memoryRecord.js';

/** Beyond this, two records are not "near-identical". */
export const DEFAULT_DUPLICATE_THRESHOLD = 0.8;

/** Default decay half-life for consolidation. */
export const DEFAULT_HALF_LIFE_DAYS = 30;

/** Kinds that can assert a fact about the world. */
export const CONTRASTABLE_KINDS = Object.freeze(['fact', 'preference', 'decision']);

/**
 * Words that flip the polarity of an assertion. Antonyms ("enabled"/"disabled")
 * are handled by ANTONYM_PAIRS, not here, so the two reasons stay distinguishable.
 */
const NEGATION_WORDS = new Set(['not', 'never', 'no', 'cannot', 'none']);

/** Pairs that cannot both be the value of one functional attribute. */
const ANTONYM_PAIRS = Object.freeze([
  ['enabled', 'disabled'],
  ['active', 'inactive'],
  ['true', 'false'],
  ['yes', 'no'],
  ['on', 'off'],
  ['open', 'closed'],
  ['public', 'private'],
  ['allowed', 'blocked'],
  ['present', 'absent'],
  ['valid', 'invalid'],
]);

/** Subjects that hold one value at a time, so two values contradict. */
const FUNCTIONAL_SUBJECTS = Object.freeze([
  'name',
  'favourite',
  'favorite',
  'age',
  'birthday',
  'email',
  'phone',
  'address',
  'location',
  'city',
  'country',
  'employer',
  'school',
  'colour',
  'color',
  'language',
  'timezone',
]);

/** Predicates normalised to one canonical verb so "is"/"are" compare equal. */
const PREDICATE_ALIASES = Object.freeze({
  is: 'be',
  are: 'be',
  was: 'be',
  were: 'be',
  be: 'be',
  has: 'have',
  have: 'have',
  had: 'have',
  uses: 'use',
  use: 'use',
  prefers: 'prefer',
  prefer: 'prefer',
  likes: 'like',
  like: 'like',
  lives: 'live',
  live: 'live',
  works: 'work',
  work: 'work',
  requires: 'require',
  require: 'require',
  supports: 'support',
  support: 'support',
});

/** Dropped when comparing text for similarity. Negations are kept on purpose. */
const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'to', 'of', 'in', 'on', 'for', 'with',
  'as', 'at', 'by', 'from', 'if', 'then', 'than', 'so', 'do', 'does', 'did',
  'it', 'this', 'that', 'these', 'those', 'there', 'here', 'i', 'me', 'my',
  'we', 'our', 'you', 'your', 'he', 'she', 'they', 'them', 'his', 'her',
  'their', 'its', 's', 'am',
]);

function ensureRecords(records, fn) {
  if (!Array.isArray(records)) {
    throw new TypeError(`${fn}: records must be an array`);
  }
  return records.filter((record) => record && typeof record === 'object');
}

function compareIds(left, right) {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function isLive(record) {
  return record.tombstoned !== true && (record.supersededBy === null || record.supersededBy === undefined);
}

function toMillis(value) {
  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isFinite(time) ? time : null;
  }
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const time = Date.parse(value);
    return Number.isNaN(time) ? null : time;
  }
  return null;
}

function round6(value) {
  return Number(value.toFixed(6));
}

/**
 * Normalise text for similarity: lowercase, punctuation to spaces, stopwords
 * removed. Negations are deliberately preserved — "is" and "is not" must never
 * look identical.
 *
 * @param {string} text
 * @returns {string}
 */
export function normalizeText(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[^\p{L}\p{N}'\s-]/gu, ' ')
    .split(/\s+/)
    .map((token) => token.replace(/^[-']+|[-']+$/g, ''))
    .filter((token) => token.length > 0 && !STOPWORDS.has(token))
    .join(' ');
}

function tokenize(text) {
  const normalized = normalizeText(text);
  return normalized.length === 0 ? [] : normalized.split(' ');
}

function tokenSet(text) {
  return new Set(tokenize(text));
}

/**
 * Jaccard similarity of two texts, 0..1. Deterministic; no embeddings.
 *
 * @param {string} left
 * @param {string} right
 * @returns {number}
 */
export function similarity(left, right) {
  const a = tokenSet(left);
  const b = tokenSet(right);
  if (a.size === 0 && b.size === 0) return 1;
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function hasNegation(text) {
  const tokens = tokenize(text);
  return tokens.some((token) => NEGATION_WORDS.has(token));
}

function clusterKey(record) {
  return [record.kind ?? '', record.scope ?? '', record.tenantId ?? ''].join('|');
}

/**
 * Choose the member that best represents a cluster.
 *
 * strategy:
 *   'confidence' (default) — highest confidence, then earliest, then id
 *   'recency'               — latest lastSeenAt, then highest confidence, then id
 *   'earliest'              — earliest createdAt, then id
 *
 * @param {object[]} members
 * @param {'confidence'|'recency'|'earliest'} [strategy]
 * @returns {object}
 */
export function pickCanonical(members, strategy = 'confidence') {
  if (!Array.isArray(members) || members.length === 0) {
    throw new TypeError('pickCanonical: at least one member is required');
  }
  if (!['confidence', 'recency', 'earliest'].includes(strategy)) {
    throw new TypeError(`pickCanonical: unknown strategy "${strategy}"`);
  }
  const ranked = [...members].sort((left, right) => {
    if (strategy === 'recency') {
      const diff = (toMillis(right.lastSeenAt) ?? 0) - (toMillis(left.lastSeenAt) ?? 0);
      if (diff !== 0) return diff;
    } else if (strategy === 'earliest') {
      const diff = (toMillis(left.createdAt) ?? 0) - (toMillis(right.createdAt) ?? 0);
      if (diff !== 0) return diff;
      return compareIds(left.id, right.id);
    }

    const confidenceDiff = (right.confidence ?? 0) - (left.confidence ?? 0);
    if (confidenceDiff !== 0) return confidenceDiff;

    const createdDiff = (toMillis(left.createdAt) ?? 0) - (toMillis(right.createdAt) ?? 0);
    if (createdDiff !== 0) return createdDiff;

    return compareIds(left.id, right.id);
  });

  return ranked[0];
}

/**
 * Find clusters of near-identical live records.
 *
 * Two records can only be duplicates when they share kind, scope and tenant —
 * the same sentence in a personal scope and in a school tenant is not one fact.
 * Records with opposite negation polarity are never clustered.
 *
 * @param {object[]} records
 * @param {{ threshold?: number }} [options]
 * @returns {Array<{ id: string, canonicalId: string, kind: string, scope: string,
 *   tenantId: string|null, size: number, similarity: number, members: object[] }>}
 */
export function findDuplicates(records, options = {}) {
  const input = ensureRecords(records, 'findDuplicates');
  const threshold = options.threshold === undefined ? DEFAULT_DUPLICATE_THRESHOLD : options.threshold;

  if (typeof threshold !== 'number' || !Number.isFinite(threshold) || threshold < 0 || threshold > 1) {
    throw new TypeError('findDuplicates: threshold must be a number between 0 and 1');
  }

  const groups = new Map();
  for (const record of input) {
    if (!isLive(record)) continue;
    const key = clusterKey(record);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
  }

  const clusters = [];

  for (const group of groups.values()) {
    if (group.length < 2) continue;

    const members = [...group].sort((left, right) => compareIds(left.id, right.id));
    const parent = members.map((_, index) => index);
    const find = (index) => {
      let cursor = index;
      while (parent[cursor] !== cursor) {
        parent[cursor] = parent[parent[cursor]];
        cursor = parent[cursor];
      }
      return cursor;
    };
    const union = (left, right) => {
      const rootLeft = find(left);
      const rootRight = find(right);
      if (rootLeft !== rootRight) parent[rootRight] = rootLeft;
    };

    let pairsConsidered = 0;
    let pairsMatched = 0;

    for (let i = 0; i < members.length; i += 1) {
      for (let j = i + 1; j < members.length; j += 1) {
        pairsConsidered += 1;
        const left = members[i];
        const right = members[j];
        if (hasNegation(left.content) !== hasNegation(right.content)) continue;
        if (similarity(left.content, right.content) < threshold) continue;
        pairsMatched += 1;
        union(i, j);
      }
    }

    const byRoot = new Map();
    members.forEach((record, index) => {
      const root = find(index);
      if (!byRoot.has(root)) byRoot.set(root, []);
      byRoot.get(root).push(record);
    });

    for (const clusterMembers of byRoot.values()) {
      if (clusterMembers.length < 2) continue;
      const canonical = pickCanonical(clusterMembers, 'confidence');
      let worst = 1;
      for (let i = 0; i < clusterMembers.length; i += 1) {
        for (let j = i + 1; j < clusterMembers.length; j += 1) {
          worst = Math.min(worst, similarity(clusterMembers[i].content, clusterMembers[j].content));
        }
      }
      clusters.push({
        id: `cluster-${canonical.id}`,
        canonicalId: canonical.id,
        kind: canonical.kind,
        scope: canonical.scope,
        tenantId: canonical.tenantId ?? null,
        size: clusterMembers.length,
        similarity: round6(worst),
        members: clusterMembers,
        pairsConsidered,
        pairsMatched,
      });
    }
  }

  clusters.sort((left, right) => compareIds(left.canonicalId, right.canonicalId));
  return clusters;
}

function mostSevereSensitivity(members) {
  const order = { low: 0, normal: 1, high: 2 };
  return members.reduce(
    (severest, member) => (order[member.sensitivity] > order[severest] ? member.sensitivity : severest),
    'low',
  );
}

function longestRetention(members) {
  return members.reduce(
    (best, member) => (RETENTION_RANK[member.retention] > RETENTION_RANK[best] ? member.retention : best),
    'session',
  );
}

function uniqueSorted(values) {
  return Array.from(new Set(values.filter((value) => typeof value === 'string' && value.length > 0))).sort();
}

/**
 * Merge a cluster into one canonical record without losing provenance.
 *
 * @param {object|object[]} cluster cluster from findDuplicates, or an array of records
 * @param {{ strategy?: 'confidence'|'recency'|'earliest' }} [options]
 * @returns {object} frozen canonical record with `provenance.mergedFrom`
 */
export function mergeCluster(cluster, options = {}) {
  const members = Array.isArray(cluster)
    ? cluster
    : cluster && Array.isArray(cluster.members)
      ? cluster.members
      : null;

  if (!members) {
    throw new TypeError('mergeCluster: expected a cluster from findDuplicates or an array of records');
  }

  const live = members.filter((member) => member && typeof member === 'object' && isLive(member));
  if (live.length === 0) {
    throw new TypeError('mergeCluster: a cluster with no live records cannot be merged');
  }

  const strategy = options.strategy ?? 'confidence';
  if (!['confidence', 'recency', 'earliest'].includes(strategy)) {
    throw new TypeError(`mergeCluster: unknown strategy "${strategy}"`);
  }

  const canonical = pickCanonical(live, strategy);
  const memberIds = live.map((member) => member.id).sort(compareIds);

  const sources = uniqueSorted(live.map((member) => member.provenance && member.provenance.source));
  const conversationIds = uniqueSorted(
    live.map((member) => member.provenance && member.provenance.conversationId),
  );
  const authors = uniqueSorted(live.map((member) => member.provenance && member.provenance.author));

  const capturedAts = live
    .map((member) => member.provenance && member.provenance.capturedAt)
    .filter((value) => toMillis(value) !== null)
    .sort((left, right) => toMillis(left) - toMillis(right));

  const createdAts = live
    .map((member) => member.createdAt)
    .filter((value) => toMillis(value) !== null)
    .sort((left, right) => toMillis(left) - toMillis(right));

  const seenAts = live
    .map((member) => member.lastSeenAt)
    .filter((value) => toMillis(value) !== null)
    .sort((left, right) => toMillis(left) - toMillis(right));

  // A merged record never expires earlier than any duplicate it absorbed.
  const anyNeverExpires = live.some((member) => member.expiresAt === null || member.expiresAt === undefined);
  const expiries = live
    .map((member) => member.expiresAt)
    .filter((value) => toMillis(value) !== null)
    .sort((left, right) => toMillis(left) - toMillis(right));

  const relations = uniqueSorted([
    ...live.flatMap((member) => (Array.isArray(member.relations) ? member.relations : [])),
    ...memberIds,
  ]).filter((relation) => relation !== canonical.id);

  const merged = {
    ...canonical,
    content: canonical.content,
    confidence: canonical.confidence,
    sensitivity: mostSevereSensitivity(live),
    approved: live.every((member) => member.approved === true),
    createdAt: createdAts[0] ?? canonical.createdAt,
    lastSeenAt: seenAts[seenAts.length - 1] ?? canonical.lastSeenAt,
    expiresAt: anyNeverExpires ? null : (expiries[expiries.length - 1] ?? null),
    supersededBy: null,
    tombstoned: false,
    relations,
    retention: longestRetention(live),
    provenance: {
      source: canonical.provenance ? canonical.provenance.source : null,
      conversationId: canonical.provenance ? canonical.provenance.conversationId : null,
      capturedAt: capturedAts[0] ?? (canonical.provenance ? canonical.provenance.capturedAt : null),
      author: canonical.provenance ? canonical.provenance.author : null,
      sources,
      conversationIds,
      authors,
      mergedFrom: memberIds,
    },
  };

  // defineMemory is the single door: it validates and deep-freezes.
  return defineMemorySafely(merged, live);
}

// defineMemory is the single door: it validates and deep-freezes.
function defineMemorySafely(record, members) {
  try {
    return defineMemory(record);
  } catch (error) {
    throw new TypeError(
      `mergeCluster: merged record is not a valid memory (members: ${members.map((member) => member.id).join(', ')}): ${error.message}`,
    );
  }
}

/**
 * Normalise text for assertion parsing: lowercase, punctuation to spaces,
 * determiners and possessives dropped so "my favourite colour" and "the
 * favourite colour" share a subject.
 */
function normalizeAssertion(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[^\p{L}\p{N}'\s-]/gu, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 0 && !['a', 'an', 'the', 'my', 'our', 'your', 'his', 'her', 'their', 'its', 'this', 'that', 'these', 'those'].includes(token))
    .join(' ');
}

/**
 * Split a record into subject / predicate / object.
 *
 * Structured records (`subject`, `predicate`, `object` fields) win over text
 * parsing. Text parsing looks for a known copula or verb; anything else becomes
 * a bare assertion whose whole text is the subject, which never contradicts.
 *
 * @param {object} record
 * @returns {{ subject: string, predicate: string, object: string }}
 */
export function parseAssertion(record) {
  if (record && typeof record.subject === 'string' && typeof record.predicate === 'string') {
    return {
      subject: normalizeAssertion(record.subject),
      predicate: PREDICATE_ALIASES[String(record.predicate).toLowerCase()] ?? String(record.predicate).toLowerCase(),
      object: normalizeAssertion(record.object ?? ''),
    };
  }

  const text = normalizeAssertion(record && record.content);
  const tokens = text.length === 0 ? [] : text.split(' ');

  for (let index = 1; index < tokens.length - 1; index += 1) {
    const alias = PREDICATE_ALIASES[tokens[index]];
    if (!alias) continue;
    return {
      subject: tokens.slice(0, index).join(' '),
      predicate: alias,
      object: tokens.slice(index + 1).join(' '),
    };
  }

  return { subject: text, predicate: '=', object: '' };
}

function objectsAreAntonyms(left, right) {
  const leftTokens = new Set(left.split(' '));
  const rightTokens = new Set(right.split(' '));
  for (const [a, b] of ANTONYM_PAIRS) {
    if ((leftTokens.has(a) && rightTokens.has(b)) || (leftTokens.has(b) && rightTokens.has(a))) {
      return true;
    }
  }
  return false;
}

function negationPolarity(text) {
  return hasNegation(text);
}

/**
 * Detect pairs of records asserting incompatible facts.
 *
 * A pair is reported when it shares subject and predicate and disagrees in one
 * of three ways:
 *   'negation'         — one object negates the other ("enabled" vs "not enabled")
 *   'antonym'          — the objects are a known antonym pair
 *   'functional-value' — the subject names a single-valued attribute
 *                        (name, favourite, age, email, address, colour, …) and
 *                        the two values differ
 *
 * Never resolves anything. Never mutates. `resolved` is always false.
 *
 * @param {object[]} records
 * @returns {Array<{ a: object, b: object, reason: string, subject: string,
 *   predicate: string, objectA: string, objectB: string, resolved: false,
 *   requiresResolution: true }>}
 */
export function detectContradictions(records) {
  const input = ensureRecords(records, 'detectContradictions').filter(isLive);
  const ordered = [...input].sort((left, right) => compareIds(left.id, right.id));

  const pairs = [];

  for (let i = 0; i < ordered.length; i += 1) {
    for (let j = i + 1; j < ordered.length; j += 1) {
      const a = ordered[i];
      const b = ordered[j];

      if (!CONTRASTABLE_KINDS.includes(a.kind) || !CONTRASTABLE_KINDS.includes(b.kind)) continue;
      if (a.scope !== b.scope) continue;
      if ((a.tenantId ?? null) !== (b.tenantId ?? null)) continue;

      const assertionA = parseAssertion(a);
      const assertionB = parseAssertion(b);
      if (assertionA.subject.length === 0 || assertionA.subject !== assertionB.subject) continue;
      if (assertionA.predicate !== assertionB.predicate) continue;
      if (assertionA.object === assertionB.object) continue;
      if (assertionA.object.length === 0 || assertionB.object.length === 0) continue;

      let reason = null;

      if (negationPolarity(assertionA.object) !== negationPolarity(assertionB.object)) {
        reason = 'negation';
      } else if (objectsAreAntonyms(assertionA.object, assertionB.object)) {
        reason = 'antonym';
      } else if (
        (assertionA.predicate === 'be' || assertionA.predicate === 'have') &&
        FUNCTIONAL_SUBJECTS.some((word) => assertionA.subject.split(' ').includes(word)) &&
        assertionA.object.split(' ').length <= 6 &&
        assertionB.object.split(' ').length <= 6
      ) {
        reason = 'functional-value';
      }

      if (!reason) continue;

      pairs.push({
        id: `contradiction-${a.id}-${b.id}`,
        a,
        b,
        reason,
        subject: assertionA.subject,
        predicate: assertionA.predicate,
        objectA: assertionA.object,
        objectB: assertionB.object,
        resolved: false,
        requiresResolution: true,
      });
    }
  }

  return pairs;
}

function resolvePairSides(pair) {
  if (Array.isArray(pair)) {
    if (pair.length !== 2) throw new TypeError('resolveContradiction: expected exactly two records');
    return { a: pair[0], b: pair[1] };
  }
  if (pair && pair.a && pair.b) return { a: pair.a, b: pair.b };
  throw new TypeError('resolveContradiction: expected a pair from detectContradictions or [a, b]');
}

/**
 * Resolve a contradiction by explicit decision. There is no default winner:
 * an actor and a reason are mandatory, because a silent resolution is a lie
 * about who decided and why.
 *
 * The loser is superseded, not deleted. Both records are returned.
 *
 * @param {object|object[]} pair
 * @param {{ winner: 'a'|'b'|string|object, reason: string, actor: string,
 *           at?: string|number|Date }} options
 * @returns {{ winner: object, loser: object, resolution: object }}
 */
export function resolveContradiction(pair, options = {}) {
  const { a, b } = resolvePairSides(pair);
  const actor = options.actor;
  const reason = options.reason;

  if (typeof actor !== 'string' || actor.trim().length === 0) {
    throw new TypeError('resolveContradiction: an explicit actor is required — contradictions are never resolved silently');
  }
  if (typeof reason !== 'string' || reason.trim().length === 0) {
    throw new TypeError('resolveContradiction: an explicit reason is required — a resolution without a reason is unauditable');
  }

  const choice = options.winner;
  let winner = null;
  let loser = null;

  if (choice === 'a') {
    winner = a;
    loser = b;
  } else if (choice === 'b') {
    winner = b;
    loser = a;
  } else if (choice && typeof choice === 'object' && typeof choice.id === 'string') {
    if (choice.id === a.id) {
      winner = a;
      loser = b;
    } else if (choice.id === b.id) {
      winner = b;
      loser = a;
    }
  } else if (typeof choice === 'string') {
    if (choice === a.id) {
      winner = a;
      loser = b;
    } else if (choice === b.id) {
      winner = b;
      loser = a;
    }
  }

  if (!winner || !loser) {
    throw new TypeError('resolveContradiction: winner must be one of the two records in the pair');
  }

  const alreadyResolved = (record) =>
    record.supersededBy !== null && record.supersededBy !== undefined;
  if (alreadyResolved(winner) || alreadyResolved(loser)) {
    throw new TypeError('resolveContradiction: this pair is already resolved — a resolved contradiction is not re-decided silently');
  }

  const { previous, current } = supersede(loser, winner);
  const atMs = toMillis(options.at === undefined ? winner.lastSeenAt : options.at);
  if (atMs === null) {
    throw new TypeError('resolveContradiction: at must be a date, a millisecond timestamp, or an ISO string');
  }

  return {
    winner: current,
    loser: previous,
    resolution: {
      id: `resolution-${loser.id}-${winner.id}`,
      winnerId: winner.id,
      loserId: loser.id,
      actor,
      reason,
      at: new Date(atMs).toISOString(),
    },
  };
}

/**
 * Lower effective confidence with age. The stored fact is untouched: decay is a
 * ranking input, never an edit.
 *
 * @param {object[]} records
 * @param {{ now?: string|number|Date, halfLifeDays?: number }} [options]
 * @returns {Array<object>} new records with `effectiveConfidence`, `ageDays`, `decayed`
 */
export function applyDecay(records, options = {}) {
  const input = ensureRecords(records, 'applyDecay');
  const halfLifeDays = options.halfLifeDays === undefined ? DEFAULT_HALF_LIFE_DAYS : options.halfLifeDays;

  if (typeof halfLifeDays !== 'number' || !Number.isFinite(halfLifeDays) || halfLifeDays <= 0) {
    throw new TypeError('applyDecay: halfLifeDays must be a positive number');
  }

  const nowMs = toMillis(options.now === undefined ? Date.now() : options.now);
  if (nowMs === null) {
    throw new TypeError('applyDecay: now must be a date, a millisecond timestamp, or an ISO string');
  }

  return input.map((record) => {
    const seenMs = toMillis(record.lastSeenAt) ?? toMillis(record.createdAt) ?? nowMs;
    const ageDays = Math.max(0, (nowMs - seenMs) / 86_400_000);
    const stored = typeof record.confidence === 'number' ? record.confidence : 0;

    if (record.tombstoned === true) {
      return {
        ...record,
        effectiveConfidence: 0,
        ageDays: round6(ageDays),
        decayed: false,
      };
    }

    const effectiveConfidence = Math.max(
      0,
      Math.min(1, stored * Math.pow(0.5, ageDays / halfLifeDays)),
    );

    return {
      ...record,
      effectiveConfidence: round6(effectiveConfidence),
      ageDays: round6(ageDays),
      decayed: effectiveConfidence < stored,
    };
  });
}

/**
 * Expire records that are past their expiry. Expiry is a tombstone: content is
 * cleared, the audit skeleton survives.
 *
 * @param {object[]} records
 * @param {{ now?: string|number|Date }} [options]
 * @returns {{ expired: object[], retained: object[], count: number }}
 */
export function expire(records, options = {}) {
  const input = ensureRecords(records, 'expire');
  const now = options.now === undefined ? Date.now() : options.now;
  if (toMillis(now) === null) {
    throw new TypeError('expire: now must be a date, a millisecond timestamp, or an ISO string');
  }

  const expired = [];
  const retained = [];

  for (const record of input) {
    if (record.tombstoned === true) {
      retained.push(record);
      continue;
    }
    if (isExpired(record, now)) {
      expired.push(tombstone(record, 'expired', now));
      continue;
    }
    retained.push(record);
  }

  return { expired, retained, count: expired.length };
}

export default {
  CONTRASTABLE_KINDS,
  DEFAULT_DUPLICATE_THRESHOLD,
  DEFAULT_HALF_LIFE_DAYS,
  applyDecay,
  detectContradictions,
  expire,
  findDuplicates,
  mergeCluster,
  normalizeText,
  parseAssertion,
  pickCanonical,
  resolveContradiction,
  similarity,
};

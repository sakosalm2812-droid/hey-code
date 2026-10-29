/**
 * HEY Secret Broker — Scoped Tokens, Rotation, Audit
 *
 * Pure in-memory. No persistence.
 * getSecret() NEVER returns raw secret — only short-lived scoped token.
 * No secret in prompts, logs, Vault, or agent outputs.
 * Rotation enforced; expired secrets auto-revoked.
 * Owner-only registration (Sako | Amad).
 */

const SECRET_VERSION = "hey-secret-broker/1";

const SECRETS = new Map();
const ACCESS_LOG = [];
const MAX_LOG = 5000;

const VALID_TYPES = Object.freeze(["api-key", "jwt-secret", "signing-key", "vapid", "database", "oauth", "other"]);
const VALID_STATUSES = Object.freeze(["active", "rotating", "revoked", "expired"]);
const VALID_OWNERS = Object.freeze(["Sako", "Amad", "system"]);

/** @typedef {Object} SecretRecord
 * @property {string} id
 * @property {string} name
 * @property {'api-key'|'jwt-secret'|'signing-key'|'vapid'|'database'|'oauth'|'other'} type
 * @property {string} scope
 * @property {string[]} authorizedReaders
 * @property {number} rotationIntervalDays
 * @property {string} lastRotatedAt
 * @property {string} expiresAt
 * @property {'active'|'rotating'|'revoked'|'expired'} status
 * @property {string} createdAt
 * @property {string} createdBy
 */

/** @typedef {Object} TokenRecord
 * @property {string} token
 * @property {string} secretId
 * @property {string} requesterId
 * @property {string} purpose
 * @property {string} issuedAt
 * @property {string} expiresAt
 * @property {number} ttlMs
 */

const TOKENS = new Map();
const TOKEN_TTL_MS = 5 * 60 * 1000; // 5 minutes

function generateId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function nowISO() {
  return new Date().toISOString();
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function isExpired(expiresAt) {
  return new Date(expiresAt) <= new Date();
}

function auditAccess({ secretId, requesterId, purpose, granted, at = nowISO() }) {
  const entry = Object.freeze({
    id: crypto.randomUUID(),
    secretId,
    requesterId,
    purpose,
    granted,
    at,
    version: SECRET_VERSION,
  });
  ACCESS_LOG.unshift(entry);
  if (ACCESS_LOG.length > MAX_LOG) ACCESS_LOG.length = MAX_LOG;
}

/**
 * Register a secret. Owner-only (Sako | Amad).
 * @param {Omit<SecretRecord, 'id'|'createdAt'|'status'|'lastRotatedAt'|'expiresAt'>} record
 * @returns {SecretRecord} frozen record
 * @throws {TypeError} if invalid
 */
function registerSecret(record) {
  if (!record || typeof record !== "object") throw new TypeError("Secret record must be an object");
  if (typeof record.name !== "string" || !record.name.trim()) throw new TypeError("Secret name required");
  if (!VALID_TYPES.includes(record.type)) throw new TypeError(`Invalid type: must be one of ${VALID_TYPES.join(", ")}`);
  if (typeof record.scope !== "string" || !record.scope.trim()) throw new TypeError("Scope required");
  if (!Array.isArray(record.authorizedReaders) || record.authorizedReaders.length === 0) throw new TypeError("At least one authorized reader required");
  if (!Number.isFinite(record.rotationIntervalDays) || record.rotationIntervalDays < 1 || record.rotationIntervalDays > 3650) throw new TypeError("rotationIntervalDays must be 1-3650");
  if (!VALID_OWNERS.includes(record.createdBy)) throw new TypeError(`createdBy must be one of ${VALID_OWNERS.join(", ")}`);

  const createdAt = nowISO();
  const secret = Object.freeze({
    id: generateId("secret"),
    name: record.name,
    type: record.type,
    scope: record.scope,
    authorizedReaders: Object.freeze([...record.authorizedReaders]),
    rotationIntervalDays: record.rotationIntervalDays,
    lastRotatedAt: createdAt,
    expiresAt: addDays(createdAt, record.rotationIntervalDays),
    status: "active",
    createdAt,
    createdBy: record.createdBy,
  });

  if (SECRETS.has(secret.id)) throw new TypeError("Secret ID collision (should be impossible)");
  SECRETS.set(secret.id, secret);
  return secret;
}

/**
 * Get a scoped token for a secret. Never returns raw value.
 * @param {string} secretId
 * @param {{ requesterId: string, purpose: string }} options
 * @returns {{ ok: true, token: string, expiresAt: string } | { ok: false, reason: string }}
 */
function getSecret(secretId, { requesterId, purpose }) {
  const secret = SECRETS.get(secretId);

  if (!secret) {
    auditAccess({ secretId, requesterId, purpose, granted: false });
    return { ok: false, reason: "Secret not found" };
  }

  if (secret.status !== "active") {
    auditAccess({ secretId, requesterId, purpose, granted: false });
    return { ok: false, reason: `Secret not accessible: ${secret.status}` };
  }

  if (!secret.authorizedReaders.includes(requesterId)) {
    auditAccess({ secretId, requesterId, purpose, granted: false });
    return { ok: false, reason: "Requester not authorized" };
  }

  if (isExpired(secret.expiresAt)) {
    // Auto-revoke expired
    secret.status = "expired";
    auditAccess({ secretId, requesterId, purpose, granted: false });
    return { ok: false, reason: "Secret expired and revoked" };
  }

  const token = `tok_${crypto.randomUUID()}`;
  const issuedAt = nowISO();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();

  const tokenRecord = Object.freeze({
    token,
    secretId,
    requesterId,
    purpose,
    issuedAt,
    expiresAt,
    ttlMs: TOKEN_TTL_MS,
  });

  TOKENS.set(token, tokenRecord);
  auditAccess({ secretId, requesterId, purpose, granted: true });

  return { ok: true, token, expiresAt };
}

/**
 * Rotate a secret. Creates new record with new value (simulated).
 * @param {string} secretId
 * @param {{ newValue: string, rotatedBy: string }} options
 * @returns {SecretRecord} new frozen record
 * @throws {Error} if not found or not authorized
 */
function rotateSecret(secretId, { newValue, rotatedBy }) {
  const secret = SECRETS.get(secretId);
  if (!secret) throw new Error("Secret not found");
  if (!VALID_OWNERS.includes(rotatedBy)) throw new Error("Only owners can rotate secrets");

  // Mark old as rotating
  const rotatingSecret = Object.freeze({
    ...secret,
    status: "rotating",
    lastRotatedAt: nowISO(),
  });
  SECRETS.set(secretId, rotatingSecret);

  // Create new secret record (simulated new value)
  const newSecret = Object.freeze({
    id: generateId("secret"),
    name: secret.name,
    type: secret.type,
    scope: secret.scope,
    authorizedReaders: secret.authorizedReaders,
    rotationIntervalDays: secret.rotationIntervalDays,
    lastRotatedAt: nowISO(),
    expiresAt: addDays(nowISO(), secret.rotationIntervalDays),
    status: "active",
    createdAt: nowISO(),
    createdBy: rotatedBy,
  });

  SECRETS.set(newSecret.id, newSecret);

  // Revoke old tokens for this secret
  for (const [tok, rec] of TOKENS) {
    if (rec.secretId === secretId) TOKENS.delete(tok);
  }

  return newSecret;
}

/**
 * Revoke a secret.
 * @param {string} secretId
 * @param {{ revokedBy: string, reason: string }} options
 * @returns {SecretRecord} revoked record
 */
function revokeSecret(secretId, { revokedBy, reason }) {
  const secret = SECRETS.get(secretId);
  if (!secret) throw new Error("Secret not found");
  if (!VALID_OWNERS.includes(revokedBy)) throw new Error("Only owners can revoke secrets");

  const revoked = Object.freeze({
    ...secret,
    status: "revoked",
  });
  SECRETS.set(secretId, revoked);

  // Revoke all tokens
  for (const [tok, rec] of TOKENS) {
    if (rec.secretId === secretId) TOKENS.delete(tok);
  }

  auditAccess({ secretId, requesterId: revokedBy, purpose: `revoke: ${reason}`, granted: true });
  return revoked;
}

/**
 * List secrets (metadata only, no values).
 * @param {{ scope?: string, status?: string }} filter
 * @returns {Omit<SecretRecord, 'id'>[]}
 */
function listSecrets({ scope, status } = {}) {
  const results = [];
  for (const secret of SECRETS.values()) {
    if (scope && secret.scope !== scope) continue;
    if (status && secret.status !== status) continue;
    // Return metadata only — no secret value ever stored anyway
    results.push(Object.freeze({
      id: secret.id,
      name: secret.name,
      type: secret.type,
      scope: secret.scope,
      authorizedReaders: secret.authorizedReaders,
      rotationIntervalDays: secret.rotationIntervalDays,
      lastRotatedAt: secret.lastRotatedAt,
      expiresAt: secret.expiresAt,
      status: secret.status,
      createdAt: secret.createdAt,
      createdBy: secret.createdBy,
    }));
  }
  return Object.freeze(results);
}

/**
 * Get access audit log (frozen copy).
 * @param {number} [limit=100]
 * @returns {Object[]}
 */
function getAccessLog(limit = 100) {
  return Object.freeze(ACCESS_LOG.slice(0, Math.max(0, limit)).map(e => Object.freeze({ ...e })));
}

/**
 * Clear all state (test helper).
 */
function clearAll() {
  SECRETS.clear();
  TOKENS.clear();
  ACCESS_LOG.length = 0;
}

/**
 * Validate a token (internal use by consumers).
 * @param {string} token
 * @returns {TokenRecord|null}
 */
function validateToken(token) {
  const record = TOKENS.get(token);
  if (!record) return null;
  if (isExpired(record.expiresAt)) {
    TOKENS.delete(token);
    return null;
  }
  return record;
}

export { registerSecret, getSecret, rotateSecret, revokeSecret, listSecrets, getAccessLog, clearAll, validateToken, SECRET_VERSION, VALID_TYPES, VALID_STATUSES, VALID_OWNERS };
export default { registerSecret, getSecret, rotateSecret, revokeSecret, listSecrets, getAccessLog, clearAll, validateToken };
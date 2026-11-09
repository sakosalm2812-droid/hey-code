/**
 * HEY Foundation PermissionManager
 *
 * Fail-closed permission system for actions and resources.
 * Unknown actions are denied by default.
 *
 * @module core/foundation/permissions
 */

import { deepFreeze, validators, generateId, now, FoundationError, UnauthorizedError } from "./contracts.js";

/**
 * PermissionManager class
 */
export class PermissionManager {
  constructor(options = {}) {
    this.id = options.id || generateId("perm");
    this._grants = new Map(); // userId -> Map<action+resource, grant>
    this._policies = new Map(); // policyId -> Policy
    this._defaultDeny = options.defaultDeny !== false; // fail-closed by default
    this._createdAt = now();
  }

  /**
   * Check if user has permission for action on resource
   * @param {Object} options
   * @param {string} options.userId
   * @param {string} options.action
   * @param {string} options.resource
   * @param {Object} [options.context] - Additional context for policy evaluation
   * @returns {Object} { allowed: boolean, reason: string, grantId?: string }
   */
  check({ userId, action, resource, context = {} }) {
    validators.requiredString(userId, "userId");
    validators.requiredString(action, "action");
    validators.requiredString(resource, "resource");

    const userGrants = this._grants.get(userId);
    if (!userGrants) {
      return this._deny("no grants for user", { userId, action, resource });
    }

    const grantKey = `${action}:${resource}`;
    const grant = userGrants.get(grantKey);

    if (!grant) {
      // Check policies
      for (const policy of this._policies.values()) {
        if (policy.matches({ userId, action, resource, context })) {
          if (policy.effect === "allow") {
            return deepFreeze({ allowed: true, reason: `policy ${policy.id}`, policyId: policy.id });
          }
          return this._deny(`policy ${policy.id} denies`, { userId, action, resource, policyId: policy.id });
        }
      }
      return this._deny("no matching grant or policy", { userId, action, resource });
    }

    // Check grant expiration
    if (grant.expiresAt && grant.expiresAt < now()) {
      userGrants.delete(grantKey);
      return this._deny("grant expired", { userId, action, resource, grantId: grant.id });
    }

    // Check grant conditions
    if (grant.condition && !grant.condition(context)) {
      return this._deny("grant condition not met", { userId, action, resource, grantId: grant.id });
    }

    return deepFreeze({ allowed: true, reason: "grant", grantId: grant.id });
  }

  /**
   * Grant permission to user
   * @param {Object} options
   * @param {string} options.userId
   * @param {string} options.action
   * @param {string} options.resource
   * @param {number} [options.expiresAt] - Expiration timestamp
   * @param {function} [options.condition] - (context) => boolean
   * @returns {Object} Grant record
   */
  grant({ userId, action, resource, expiresAt = null, condition = null }) {
    validators.requiredString(userId, "userId");
    validators.requiredString(action, "action");
    validators.requiredString(resource, "resource");

    if (!this._grants.has(userId)) {
      this._grants.set(userId, new Map());
    }

    const grant = deepFreeze({
      id: generateId("grant"),
      userId,
      action,
      resource,
      grantedAt: now(),
      expiresAt: expiresAt || null,
      condition: condition || null,
    });

    const grantKey = `${action}:${resource}`;
    this._grants.get(userId).set(grantKey, grant);

    return grant;
  }

  /**
   * Revoke a specific grant
   * @param {string} userId
   * @param {string} action
   * @param {string} resource
   * @returns {boolean} True if revoked
   */
  revoke(userId, action, resource) {
    validators.requiredString(userId, "userId");
    validators.requiredString(action, "action");
    validators.requiredString(resource, "resource");

    const userGrants = this._grants.get(userId);
    if (!userGrants) return false;

    const grantKey = `${action}:${resource}`;
    return userGrants.delete(grantKey);
  }

  /**
   * Revoke all grants for a user
   * @param {string} userId
   * @returns {number} Number of grants revoked
   */
  revokeAll(userId) {
    validators.requiredString(userId, "userId");

    const userGrants = this._grants.get(userId);
    if (!userGrants) return 0;

    const count = userGrants.size;
    this._grants.delete(userId);
    return count;
  }

  /**
   * Check and throw if denied (for use in execution paths)
   * @param {Object} options - Same as check()
   * @throws {UnauthorizedError} If denied
   * @returns {Object} Grant record if allowed
   */
  require({ userId, action, resource, context = {} }) {
    const result = this.check({ userId, action, resource, context });
    if (!result.allowed) {
      throw new UnauthorizedError(action, resource);
    }
    return result;
  }

  /**
   * Add a policy
   * @param {Object} policy
   * @param {string} policy.id
   * @param {function} policy.matches - (ctx) => boolean
   * @param {"allow"|"deny"} policy.effect
   * @param {number} [policy.priority=0] - Higher priority evaluated first
   * @returns {PermissionManager} this
   */
  addPolicy(policy) {
    validators.requiredString(policy.id, "policy.id");
    validators.isFunction(policy.matches, "policy.matches");
    validators.enum(policy.effect, "policy.effect", ["allow", "deny"]);

    const p = deepFreeze({
      ...policy,
      priority: policy.priority || 0,
      addedAt: now(),
    });

    this._policies.set(p.id, p);
    return this;
  }

  /**
   * Remove a policy
   * @param {string} policyId
   * @returns {boolean}
   */
  removePolicy(policyId) {
    return this._policies.delete(policyId);
  }

  /**
   * List all policies
   * @returns {Object[]}
   */
  listPolicies() {
    return deepFreeze(Array.from(this._policies.values()).sort((a, b) => b.priority - a.priority));
  }

  /**
   * Get user's grants
   * @param {string} userId
   * @returns {Object[]}
   */
  getUserGrants(userId) {
    validators.requiredString(userId, "userId");
    const userGrants = this._grants.get(userId);
    if (!userGrants) return [];
    return deepFreeze(Array.from(userGrants.values()));
  }

  /**
   * Get statistics
   * @returns {Object}
   */
  getStats() {
    let totalGrants = 0;
    for (const grants of this._grants.values()) {
      totalGrants += grants.size;
    }
    return deepFreeze({
      id: this.id,
      userCount: this._grants.size,
      totalGrants,
      policyCount: this._policies.size,
      defaultDeny: this._defaultDeny,
      createdAt: this._createdAt,
    });
  }

  _deny(reason, details) {
    return deepFreeze({ allowed: false, reason, ...details });
  }
}

/**
 * Create a new PermissionManager
 * @param {Object} options
 * @param {boolean} [options.defaultDeny=true] - Fail-closed mode
 * @returns {PermissionManager}
 */
export function createPermissionManager(options = {}) {
  return new PermissionManager(options);
}

/**
 * Default singleton
 */
const defaultManager = new PermissionManager({ id: "default" });

export default Object.freeze({
  PermissionManager,
  createPermissionManager,
  defaultManager,
});
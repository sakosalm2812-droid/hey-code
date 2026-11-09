/**
 * HEY Foundation Contracts
 *
 * Core utilities, validators, and type contracts shared across the foundation.
 * Re-exports deepFreeze from agentContract and provides common validators.
 *
 * @module core/foundation/contracts
 */

import { deepFreeze as agentDeepFreeze } from "../agentContract.js";

/**
 * Recursively freeze an object and all nested objects/arrays.
 * Idempotent - calling multiple times returns the same frozen object.
 *
 * @param {any} value - Value to freeze
 * @returns {any} Frozen value
 */
export function deepFreeze(value) {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  for (const key of Object.keys(value)) {
    deepFreeze(value[key]);
  }
  return Object.freeze(value);
}

// Re-export agentContract's deepFreeze for compatibility
export { agentDeepFreeze as deepFreezeFromAgentContract };

/**
 * Type validation utilities
 */
export const validators = {
  /** Validate required string field */
  requiredString(value, fieldName) {
    if (typeof value !== "string" || value.trim() === "") {
      throw new TypeError(`${fieldName} must be a non-empty string`);
    }
    return value.trim();
  },

  /** Validate optional string field */
  optionalString(value, fieldName, defaultValue = "") {
    if (value === undefined || value === null) return defaultValue;
    if (typeof value !== "string") {
      throw new TypeError(`${fieldName} must be a string`);
    }
    return value.trim();
  },

  /** Validate positive integer */
  positiveInteger(value, fieldName) {
    const num = Number(value);
    if (!Number.isInteger(num) || num <= 0) {
      throw new TypeError(`${fieldName} must be a positive integer`);
    }
    return num;
  },

  /** Validate non-negative integer */
  nonNegativeInteger(value, fieldName) {
    const num = Number(value);
    if (!Number.isInteger(num) || num < 0) {
      throw new TypeError(`${fieldName} must be a non-negative integer`);
    }
    return num;
  },

  /** Validate number in range */
  range(value, fieldName, min, max) {
    const num = Number(value);
    if (!Number.isFinite(num) || num < min || num > max) {
      throw new TypeError(`${fieldName} must be a number between ${min} and ${max}`);
    }
    return num;
  },

  /** Validate array of strings */
  stringArray(value, fieldName) {
    if (!Array.isArray(value)) {
      throw new TypeError(`${fieldName} must be an array`);
    }
    for (const item of value) {
      if (typeof item !== "string" || item.trim() === "") {
        throw new TypeError(`${fieldName} must contain only non-empty strings`);
      }
    }
    return value.map((s) => s.trim());
  },

  /** Validate enum value */
  enum(value, fieldName, allowedValues) {
    if (!allowedValues.includes(value)) {
      throw new TypeError(`${fieldName} must be one of: ${allowedValues.join(", ")}`);
    }
    return value;
  },

  /** Validate plain object (not array, not null) */
  plainObject(value, fieldName) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new TypeError(`${fieldName} must be a plain object`);
    }
    return value;
  },

  /** Validate function */
  isFunction(value, fieldName) {
    if (typeof value !== "function") {
      throw new TypeError(`${fieldName} must be a function`);
    }
    return value;
  },
};

/**
 * Common error classes
 */
export class FoundationError extends Error {
  constructor(message, code = "FOUNDATION_ERROR") {
    super(message);
    this.name = "FoundationError";
    this.code = code;
  }
}

export class ValidationError extends FoundationError {
  constructor(message, field) {
    super(message, "VALIDATION_ERROR");
    this.name = "ValidationError";
    this.field = field;
  }
}

export class NotFoundError extends FoundationError {
  constructor(resource, id) {
    super(`${resource} not found: ${id}`, "NOT_FOUND");
    this.name = "NotFoundError";
    this.resource = resource;
    this.id = id;
  }
}

export class ExhaustedError extends FoundationError {
  constructor(resource) {
    super(`${resource} budget exhausted`, "EXHAUSTED");
    this.name = "ExhaustedError";
    this.resource = resource;
  }
}

export class UnauthorizedError extends FoundationError {
  constructor(action, resource) {
    super(`Permission denied: ${action} on ${resource}`, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
    this.action = action;
    this.resource = resource;
  }
}

/**
 * Common constants
 */
export const FOUNDATION_CONSTANTS = Object.freeze({
  DEFAULT_SESSION_TTL_MS: 24 * 60 * 60 * 1000, // 24 hours
  DEFAULT_CACHE_TTL_MS: 5 * 60 * 1000, // 5 minutes
  MAX_RETRY_ATTEMPTS: 3,
  DEFAULT_TIMEOUT_MS: 30000,
});

/**
 * Generate unique IDs with prefix
 */
export function generateId(prefix = "id") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Get current timestamp
 */
export function now() {
  return Date.now();
}

/**
 * Deep clone an object
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Merge objects deeply (immutable)
 */
export function deepMerge(target, ...sources) {
  if (!target || typeof target !== "object") return target;
  const result = { ...target };
  for (const source of sources) {
    if (!source || typeof source !== "object") continue;
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
        result[key] = deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  return result;
}

// Default singleton export
const contracts = Object.freeze({
  deepFreeze,
  validators,
  FoundationError,
  ValidationError,
  NotFoundError,
  ExhaustedError,
  UnauthorizedError,
  FOUNDATION_CONSTANTS,
  generateId,
  now,
  deepClone,
  deepMerge,
});

export default contracts;
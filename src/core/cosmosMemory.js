/**
 * @file cosmosMemory.js
 * @description Enterprise-grade, browser-safe memory engine for HEY.
 * Implements Hot/Warm/Cold tiers, provenance, and trust levels.
 * Strictly avoids Node.js 'path'/'fs' modules for browser compatibility.
 */

import { v4 as uuidv4 } from 'uuid'; // Ensure uuid is installed: npm install uuid

// Hard Rule 3: Environment & Configuration
const MEMORY_CONFIG = {
  HOT_TIER_LIMIT: 50,
  WARM_TIER_STORAGE_KEY: 'hey_cosmos_warm',
  COLD_TIER_STORAGE_KEY: 'hey_cosmos_cold',
  MAX_WARM_RECORDS: 1000,
  TRUST_LEVELS: {
    INFERRED: 1,
    IMPORTED: 2,
    VERIFIED: 3,
    EXPLICIT: 4,
  },
  INGESTION_SOURCES: {
    USER: 'user_input',
    SYSTEM: 'system_agent',
    WEB: 'web_scrape',
    FILE: 'file_upload',
  }
};

class CosmosMemory {
  constructor() {
    this.hotTier = [];
    this.warmTier = this._loadFromStorage(MEMORY_CONFIG.WARM_TIER_STORAGE_KEY);
    this.coldTier = this._loadFromStorage(MEMORY_CONFIG.COLD_TIER_STORAGE_KEY);
  }

  // Hard Rule 2 & 4: Defensive Architecture & Observability
  _log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] [CosmosMemory] ${message}`;
    if (level === 'ERROR') {
      console.error(logEntry, data);
    } else if (level === 'WARN') {
      console.warn(logEntry, data);
    } else {
      // In production, this would pipe to a telemetry service
      if (process.env.NODE_ENV !== 'production') {
        console.log(logEntry, data);
      }
    }
  }

  _loadFromStorage(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      this._log('ERROR', 'Failed to load from localStorage', { key, error: error.message });
      return [];
    }
  }

  _saveToStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      this._log('ERROR', 'Failed to save to localStorage. Quota exceeded?', { key, error: error.message });
      // Graceful degradation: Prune oldest records if quota fails
      if (data.length > 0) {
        this._log('WARN', 'Attempting to prune warm tier to free space');
        this._saveToStorage(key, data.slice(-Math.floor(data.length / 2)));
      }
    }
  }

  /**
   * Writes a memory to the Hot Tier and syncs to Warm Tier.
   * @param {Object} record - The memory record.
   * @param {string} record.content - The actual memory text.
   * @param {string} record.provenance - Where it came from (e.g., INGESTION_SOURCES.USER).
   * @param {number} record.trustLevel - 1 to 4 based on TRUST_LEVELS.
   * @param {string} record.scope - e.g., 'project_xyz', 'global'.
   */
  write(record) {
    try {
      if (!record || !record.content) {
        throw new Error('Invalid memory record: content is required.');
      }

      const sanitizedRecord = {
        id: uuidv4(),
        content: record.content.trim(),
        provenance: record.provenance || MEMORY_CONFIG.INGESTION_SOURCES.USER,
        trustLevel: record.trustLevel || MEMORY_CONFIG.TRUST_LEVELS.INFERRED,
        scope: record.scope || 'global',
        timestamp: Date.now(),
        accessCount: 0,
      };

      this.hotTier.push(sanitizedRecord);
      
      // Promote to Warm Tier if Hot Tier is full
      if (this.hotTier.length > MEMORY_CONFIG.HOT_TIER_LIMIT) {
        const promoted = this.hotTier.shift();
        this.warmTier.push(promoted);
        
        // Prune Warm Tier if it exceeds max
        if (this.warmTier.length > MEMORY_CONFIG.MAX_WARM_RECORDS) {
          const demoted = this.warmTier.shift();
          this.coldTier.push(demoted);
          this._saveToStorage(MEMORY_CONFIG.COLD_TIER_STORAGE_KEY, this.coldTier);
        }
        this._saveToStorage(MEMORY_CONFIG.WARM_TIER_STORAGE_KEY, this.warmTier);
      }

      this._log('INFO', 'Memory written successfully', { id: sanitizedRecord.id, scope: sanitizedRecord.scope });
      return sanitizedRecord;
    } catch (error) {
      this._log('ERROR', 'Failed to write memory', { error: error.message });
      throw error;
    }
  }

  /**
   * Retrieves memories based on query and scope.
   * @param {Object} query - The search parameters.
   * @param {string} query.scope - Filter by scope.
   * @param {number} query.minTrust - Filter by minimum trust level.
   */
  search(query) {
    try {
      const { scope, minTrust = MEMORY_CONFIG.TRUST_LEVELS.INFERRED } = query || {};
      
      const allMemories = [...this.hotTier, ...this.warmTier, ...this.coldTier];
      
      return allMemories.filter(mem => {
        const scopeMatch = !scope || mem.scope === scope;
        const trustMatch = mem.trustLevel >= minTrust;
        return scopeMatch && trustMatch;
      }).sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      this._log('ERROR', 'Failed to search memory', { error: error.message });
      return [];
    }
  }
}

// Hard Rule 5 & 6: Export singleton and ensure it doesn't crash the app on init
let cosmosInstance;
try {
  cosmosInstance = new CosmosMemory();
} catch (error) {
  console.error("Fatal error initializing CosmosMemory. Falling back to empty instance.", error);
  cosmosInstance = new CosmosMemory(); // Re-try once
}

export const cosmosMemory = cosmosInstance;
export const INGESTION_SOURCES = MEMORY_CONFIG.INGESTION_SOURCES;
export const TRUST_LEVELS = MEMORY_CONFIG.TRUST_LEVELS;
export default cosmosMemory;
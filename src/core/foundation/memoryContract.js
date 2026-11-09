/**
 * HEY Foundation CosmosMemory
 *
 * Interface and in-memory implementation for persistent memory storage
 * with semantic search, graph relationships, and consolidation.
 *
 * @module core/foundation/memoryContract
 */

import { deepFreeze, validators, generateId, now, FoundationError, NotFoundError } from "./contracts.js";

/**
 * Memory item schema
 * @typedef {Object} MemoryItem
 * @property {string} id - Unique identifier
 * @property {string} type - Memory type: fact, preference, decision, episode, skill
 * @property {string} content - Memory content
 * @property {Object} metadata - Arbitrary metadata
 * @property {number} createdAt - Creation timestamp
 * @property {number} updatedAt - Last update timestamp
 * @property {number} accessCount - Number of accesses
 * @property {number} lastAccessed - Last access timestamp
 * @property {number} confidence - Confidence score 0-100
 * @property {string[]} tags - Search tags
 * @property {Object[]} links - Related memory IDs with relation type
 */

/**
 * CosmosMemory interface (contract)
 */
export class CosmosMemory {
  constructor() {
    if (this.constructor === CosmosMemory) {
      throw new FoundationError("CosmosMemory is an interface; use InMemoryCosmos or implement", "INTERFACE");
    }
  }

  /** @abstract */
  store(item) { throw new FoundationError("Not implemented", "NOT_IMPLEMENTED"); }
  /** @abstract */
  retrieve(id) { throw new FoundationError("Not implemented", "NOT_IMPLEMENTED"); }
  /** @abstract */
  search(query) { throw new FoundationError("Not implemented", "NOT_IMPLEMENTED"); }
  /** @abstract */
  delete(id) { throw new FoundationError("Not implemented", "NOT_IMPLEMENTED"); }
  /** @abstract */
  list(filter) { throw new FoundationError("Not implemented", "NOT_IMPLEMENTED"); }
  /** @abstract */
  update(id, updates) { throw new FoundationError("Not implemented", "NOT_IMPLEMENTED"); }
  /** @abstract */
  link(fromId, toId, relation) { throw new FoundationError("Not implemented", "NOT_IMPLEMENTED"); }
  /** @abstract */
  getGraph(nodeId, depth) { throw new FoundationError("Not implemented", "NOT_IMPLEMENTED"); }
  /** @abstract */
  consolidate() { throw new FoundationError("Not implemented", "NOT_IMPLEMENTED"); }
}

/**
 * In-memory implementation of CosmosMemory
 */
export class InMemoryCosmos extends CosmosMemory {
  constructor(options = {}) {
    super();
    this._store = new Map(); // id -> MemoryItem
    this._byType = new Map(); // type -> Set<id>
    this._byTag = new Map(); // tag -> Set<id>
    this._graph = new Map(); // id -> [{ toId, relation, weight }]
    this._maxItems = options.maxItems || 10000;
    this._createdAt = now();
  }

  /**
   * Store a memory item
   * @param {Object} item - Memory item (without id, timestamps)
   * @returns {MemoryItem} Stored item with generated fields
   */
  store(item) {
    validators.plainObject(item, "item");
    validators.requiredString(item.type, "item.type");
    validators.requiredString(item.content, "item.content");

    const id = item.id || generateId("mem");
    const timestamp = now();

    const memory = deepFreeze({
      id,
      type: item.type,
      content: item.content,
      metadata: item.metadata || {},
      createdAt: timestamp,
      updatedAt: timestamp,
      accessCount: 0,
      lastAccessed: timestamp,
      confidence: validators.range(item.confidence || 100, "confidence", 0, 100),
      tags: Array.isArray(item.tags) ? item.tags.map((t) => String(t).trim()).filter((t) => t) : [],
      links: [],
    });

    // Enforce max items (LRU eviction)
    if (this._store.size >= this._maxItems) {
      this._evictOldest();
    }

    this._store.set(id, memory);
    this._indexByType(memory);
    this._indexByTags(memory);

    return memory;
  }

  /**
   * Retrieve a memory by ID
   * @param {string} id
   * @returns {MemoryItem}
   */
  retrieve(id) {
    validators.requiredString(id, "id");
    const memory = this._store.get(id);
    if (!memory) throw new NotFoundError("Memory", id);
    return this._touch(id, memory);
  }

  /**
   * Search memories
   * @param {Object} query
   * @param {string} [query.text] - Full-text search
   * @param {string} [query.type] - Filter by type
   * @param {string[]} [query.tags] - Filter by tags (AND)
   * @param {number} [query.limit=20] - Max results
   * @param {number} [query.minConfidence=0] - Minimum confidence
   * @returns {MemoryItem[]}
   */
  search(query = {}) {
    const {
      text = "",
      type = null,
      tags = [],
      limit = 20,
      minConfidence = 0,
    } = query;

    let candidates = Array.from(this._store.values());

    // Filter by type
    if (type) {
      const typeIds = this._byType.get(type) || new Set();
      candidates = candidates.filter((m) => typeIds.has(m.id));
    }

    // Filter by tags (AND)
    if (tags.length > 0) {
      const tagSets = tags.map((tag) => this._byTag.get(tag) || new Set());
      const intersection = new Set([...tagSets[0]]);
      for (const set of tagSets.slice(1)) {
        for (const id of intersection) {
          if (!set.has(id)) intersection.delete(id);
        }
      }
      candidates = candidates.filter((m) => intersection.has(m.id));
    }

    // Filter by confidence
    candidates = candidates.filter((m) => m.confidence >= minConfidence);

    // Text search (simple substring match)
    if (text) {
      const lower = text.toLowerCase();
      candidates = candidates.filter(
        (m) =>
          m.content.toLowerCase().includes(lower) ||
          m.tags.some((t) => t.toLowerCase().includes(lower)) ||
          JSON.stringify(m.metadata).toLowerCase().includes(lower)
      );
    }

    // Sort by recency * confidence
    candidates.sort((a, b) => {
      const scoreA = a.confidence * (a.lastAccessed / 1e12);
      const scoreB = b.confidence * (b.lastAccessed / 1e12);
      return scoreB - scoreA;
    });

    // Touch accessed items
    const results = candidates.slice(0, limit).map((m) => this._touch(m.id, m));
    return deepFreeze(results);
  }

  /**
   * Delete a memory
   * @param {string} id
   * @returns {boolean}
   */
  delete(id) {
    validators.requiredString(id, "id");
    const memory = this._store.get(id);
    if (!memory) return false;

    this._store.delete(id);
    this._unindexByType(memory);
    this._unindexByTags(memory);
    this._graph.delete(id);
    // Remove from other nodes' links
    for (const [, links] of this._graph) {
      const idx = links.findIndex((l) => l.toId === id);
      if (idx >= 0) links.splice(idx, 1);
    }
    return true;
  }

  /**
   * List memories with optional filter
   * @param {Object} filter
   * @returns {MemoryItem[]}
   */
  list(filter = {}) {
    const { type = null, limit = 100 } = filter;
    let candidates = Array.from(this._store.values());

    if (type) {
      const typeIds = this._byType.get(type) || new Set();
      candidates = candidates.filter((m) => typeIds.has(m.id));
    }

    candidates.sort((a, b) => b.updatedAt - a.updatedAt);
    return deepFreeze(candidates.slice(0, limit));
  }

  /**
   * Update a memory
   * @param {string} id
   * @param {Object} updates
   * @returns {MemoryItem}
   */
  update(id, updates) {
    validators.requiredString(id, "id");
    validators.plainObject(updates, "updates");

    const memory = this._store.get(id);
    if (!memory) throw new NotFoundError("Memory", id);

    // Remove old indexes
    this._unindexByType(memory);
    this._unindexByTags(memory);

    const updated = deepFreeze({
      ...memory,
      ...updates,
      id: memory.id, // preserve id
      createdAt: memory.createdAt, // preserve createdAt
      updatedAt: now(),
      tags: Array.isArray(updates.tags)
        ? updates.tags.map((t) => String(t).trim()).filter((t) => t)
        : memory.tags,
    });

    this._store.set(id, updated);
    this._indexByType(updated);
    this._indexByTags(updated);
    return updated;
  }

  /**
   * Link two memories
   * @param {string} fromId
   * @param {string} toId
   * @param {string} relation
   * @param {number} [weight=1]
   * @returns {boolean}
   */
  link(fromId, toId, relation, weight = 1) {
    validators.requiredString(fromId, "fromId");
    validators.requiredString(toId, "toId");
    validators.requiredString(relation, "relation");

    if (!this._store.has(fromId) || !this._store.has(toId)) {
      return false;
    }

    const links = this._graph.get(fromId) || [];
    links.push({ toId, relation, weight, createdAt: now() });
    this._graph.set(fromId, links);
    return true;
  }

  /**
   * Get memory graph neighborhood
   * @param {string} nodeId
   * @param {number} [depth=1]
   * @returns {Object} { nodes: MemoryItem[], edges: { fromId, toId, relation, weight }[] }
   */
  getGraph(nodeId, depth = 1) {
    validators.requiredString(nodeId, "nodeId");

    const visited = new Set();
    const nodes = new Map();
    const edges = [];

    const traverse = (id, currentDepth) => {
      if (currentDepth > depth || visited.has(id)) return;
      visited.add(id);

      const memory = this._store.get(id);
      if (memory) nodes.set(id, memory);

      const links = this._graph.get(id) || [];
      for (const link of links) {
        edges.push({ fromId: id, toId: link.toId, relation: link.relation, weight: link.weight });
        traverse(link.toId, currentDepth + 1);
      }
    };

    traverse(nodeId, 0);
    return deepFreeze({
      nodes: Array.from(nodes.values()),
      edges,
    });
  }

  /**
   * Consolidate memories (deduplicate, merge similar)
   * @returns {Object} { merged: number, removed: number }
   */
  consolidate() {
    // Simplified: find exact duplicates by content
    const byContent = new Map();
    let merged = 0;
    let removed = 0;

    for (const memory of this._store.values()) {
      const key = `${memory.type}:${memory.content}`;
      if (byContent.has(key)) {
        const existing = byContent.get(key);
        // Merge: keep higher confidence, sum access counts
        const updated = this.update(existing.id, {
          confidence: Math.max(existing.confidence, memory.confidence),
          accessCount: existing.accessCount + memory.accessCount,
          tags: [...new Set([...existing.tags, ...memory.tags])],
        });
        this.delete(memory.id);
        removed++;
        merged++;
      } else {
        byContent.set(key, memory);
      }
    }

    return deepFreeze({ merged, removed });
  }

  /**
   * Get statistics
   * @returns {Object}
   */
  getStats() {
    return deepFreeze({
      totalItems: this._store.size,
      byType: Object.fromEntries(
        Array.from(this._byType.entries()).map(([type, ids]) => [type, ids.size])
      ),
      byTag: Object.fromEntries(
        Array.from(this._byTag.entries()).map(([tag, ids]) => [tag, ids.size])
      ),
      graphEdges: Array.from(this._graph.values()).reduce((sum, links) => sum + links.length, 0),
      maxItems: this._maxItems,
      createdAt: this._createdAt,
    });
  }

  // Private methods
  _touch(id, memory) {
    const updated = deepFreeze({
      ...memory,
      accessCount: memory.accessCount + 1,
      lastAccessed: now(),
    });
    this._store.set(id, updated);
    return updated;
  }

  _indexByType(memory) {
    const set = this._byType.get(memory.type) || new Set();
    set.add(memory.id);
    this._byType.set(memory.type, set);
  }

  _unindexByType(memory) {
    const set = this._byType.get(memory.type);
    if (set) {
      set.delete(memory.id);
      if (set.size === 0) this._byType.delete(memory.type);
    }
  }

  _indexByTags(memory) {
    for (const tag of memory.tags) {
      const set = this._byTag.get(tag) || new Set();
      set.add(memory.id);
      this._byTag.set(tag, set);
    }
  }

  _unindexByTags(memory) {
    for (const tag of memory.tags) {
      const set = this._byTag.get(tag);
      if (set) {
        set.delete(memory.id);
        if (set.size === 0) this._byTag.delete(tag);
      }
    }
  }

  _evictOldest() {
    let oldest = null;
    let oldestTime = Infinity;
    for (const memory of this._store.values()) {
      if (memory.lastAccessed < oldestTime) {
        oldestTime = memory.lastAccessed;
        oldest = memory.id;
      }
    }
    if (oldest) this.delete(oldest);
  }
}

/**
 * Create an in-memory Cosmos implementation
 * @param {Object} options
 * @param {number} [options.maxItems=10000]
 * @returns {InMemoryCosmos}
 */
export function createInMemoryCosmos(options = {}) {
  return new InMemoryCosmos(options);
}

/**
 * Default singleton
 */
const defaultCosmos = new InMemoryCosmos({ id: "default" });

export default Object.freeze({
  CosmosMemory,
  InMemoryCosmos,
  createInMemoryCosmos,
  defaultCosmos,
});
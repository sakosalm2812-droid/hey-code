import { cosineSimilarity } from './cosmosMemory.js';
import { log as auditLog } from './auditLogger.js';

export class BM25Index {
  constructor(options = {}) {
    this.k1 = options.k1 ?? 1.2;
    this.b = options.b ?? 0.75;
    this.docs = new Map(); // id -> tokens[]
    this.docLengths = new Map();
    this.avgdl = 0;
    this.df = new Map(); // term -> docCount
    this.totalDocs = 0;
  }

  tokenize(text) {
    if (!text || typeof text !== 'string') return [];
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 0);
  }

  addDocument(id, text) {
    const tokens = this.tokenize(text);
    this.docs.set(id, tokens);
    this.docLengths.set(id, tokens.length);

    const termSet = new Set(tokens);
    for (const term of termSet) {
      this.df.set(term, (this.df.get(term) || 0) + 1);
    }

    this.totalDocs++;
    let totalLen = 0;
    for (const len of this.docLengths.values()) totalLen += len;
    this.avgdl = totalLen / this.totalDocs;
  }

  removeDocument(id) {
    if (!this.docs.has(id)) return;
    const tokens = this.docs.get(id);
    const termSet = new Set(tokens);
    for (const term of termSet) {
      const cur = this.df.get(term) || 1;
      if (cur <= 1) this.df.delete(term);
      else this.df.set(term, cur - 1);
    }
    this.docs.delete(id);
    this.docLengths.delete(id);
    this.totalDocs--;
    let totalLen = 0;
    for (const len of this.docLengths.values()) totalLen += len;
    this.avgdl = this.totalDocs > 0 ? totalLen / this.totalDocs : 0;
  }

  search(queryTokens, limit = 50) {
    if (!queryTokens || queryTokens.length === 0 || this.totalDocs === 0) return [];
    const scores = new Map();

    for (const term of queryTokens) {
      const docCount = this.df.get(term) || 0;
      if (docCount === 0) continue;
      // Standard BM25 IDF formula
      const idf = Math.log(1 + (this.totalDocs - docCount + 0.5) / (docCount + 0.5));

      for (const [id, tokens] of this.docs.entries()) {
        const tf = tokens.filter((t) => t === term).length;
        if (tf === 0) continue;
        const dl = this.docLengths.get(id) || 1;
        const numerator = tf * (this.k1 + 1);
        const denominator = tf + this.k1 * (1 - this.b + this.b * (dl / this.avgdl));
        const termScore = idf * (numerator / denominator);
        scores.set(id, (scores.get(id) || 0) + termScore);
      }
    }

    const sorted = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    return sorted.map(([id, score]) => ({ id, score }));
  }
}

export class HybridSearch {
  constructor(options = {}) {
    this.auditLogger = options.auditLogger || auditLog;
    this.items = new Map(); // id -> item
    this.graph = new Map(); // id -> Set<connectedId>
    this.bm25 = new BM25Index();
    this.rrfK = options.rrfK || 60;
  }

  indexItem(item) {
    if (!item || !item.id) return;
    this.items.set(item.id, {
      id: item.id,
      type: item.type || 'document',
      text: item.text || item.content || item.snippet || '',
      scope: item.scope || 'default',
      embedding: item.embedding || null,
      source: item.source || 'cosmos',
      relationships: item.relationships || [],
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString(),
    });

    this.bm25.addDocument(item.id, item.text || item.content || '');

    // Index graph relationships
    if (Array.isArray(item.relationships)) {
      if (!this.graph.has(item.id)) this.graph.set(item.id, new Set());
      for (const rel of item.relationships) {
        const target = typeof rel === 'string' ? rel : rel.targetId || rel.to;
        if (target) {
          this.graph.get(item.id).add(target);
          if (!this.graph.has(target)) this.graph.set(target, new Set());
          this.graph.get(target).add(item.id);
        }
      }
    }
  }

  removeItem(id) {
    this.items.delete(id);
    this.bm25.removeDocument(id);
    this.graph.delete(id);
  }

  _retrieveVector(embedding, allowedScopeSet, limit = 50) {
    if (!embedding || embedding.length === 0) return [];
    const scored = [];
    for (const item of this.items.values()) {
      if (allowedScopeSet && !allowedScopeSet.has(item.scope)) continue;
      if (!item.embedding) continue;
      const sim = cosineSimilarity(embedding, item.embedding);
      if (sim > 0.01) {
        scored.push({ id: item.id, score: sim });
      }
    }
    return scored.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  _retrieveLexical(query, allowedScopeSet, limit = 50) {
    if (!query || typeof query !== 'string') return [];
    const tokens = this.bm25.tokenize(query);
    const raw = this.bm25.search(tokens, limit * 2);
    const filtered = [];
    for (const entry of raw) {
      const item = this.items.get(entry.id);
      if (!item) continue;
      if (allowedScopeSet && !allowedScopeSet.has(item.scope)) continue;
      filtered.push(entry);
      if (filtered.length >= limit) break;
    }
    return filtered;
  }

  _retrieveGraph(seedIds, allowedScopeSet, limit = 50) {
    const visited = new Set();
    const results = [];

    for (const seedId of seedIds) {
      const neighbors = this.graph.get(seedId);
      if (!neighbors) continue;
      for (const targetId of neighbors) {
        if (seedIds.includes(targetId) || visited.has(targetId)) continue;
        visited.add(targetId);
        const item = this.items.get(targetId);
        if (!item) continue;
        if (allowedScopeSet && !allowedScopeSet.has(item.scope)) continue;
        results.push({ id: targetId, score: 1.0 });
        if (results.length >= limit) return results;
      }
    }
    return results;
  }

  async search({ query = '', scopes = null, limit = 10, filters = {}, embedding = null }) {
    const startTime = Date.now();
    const allowedScopeSet = scopes && scopes.length > 0 ? new Set(scopes) : null;

    // Handle empty query: return most recent allowed items
    if ((!query || query.trim() === '') && !embedding) {
      const items = Array.from(this.items.values())
        .filter((i) => !allowedScopeSet || allowedScopeSet.has(i.scope))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);

      const formatted = items.map((i) => ({
        id: i.id,
        type: i.type,
        snippet: (i.text || '').slice(0, 150),
        score: 1.0,
        source: i.source,
      }));

      this._emitAudit(query, formatted.length, Date.now() - startTime);
      return formatted;
    }

    // Run parallel retrievers
    const [vectorHits, lexicalHits] = await Promise.all([
      Promise.resolve().then(() => this._retrieveVector(embedding, allowedScopeSet, 50)),
      Promise.resolve().then(() => this._retrieveLexical(query, allowedScopeSet, 50)),
    ]);

    // Use top lexical & vector hits as seeds for graph traversal
    const seeds = [...new Set([...vectorHits.slice(0, 3).map((h) => h.id), ...lexicalHits.slice(0, 3).map((h) => h.id)])];
    const graphHits = this._retrieveGraph(seeds, allowedScopeSet, 50);

    // Reciprocal Rank Fusion (RRF): score = sum(1 / (k + rank_i))
    const rrfScores = new Map();
    const rankMap = (hits) => {
      hits.forEach((hit, index) => {
        const rank = index + 1;
        const contrib = 1 / (this.rrfK + rank);
        rrfScores.set(hit.id, (rrfScores.get(hit.id) || 0) + contrib);
      });
    };

    rankMap(vectorHits);
    rankMap(lexicalHits);
    rankMap(graphHits);

    // Sort by RRF score
    const topCandidates = Array.from(rrfScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50);

    // Cross-encoder / reranker pass (boost exact query match)
    const qLower = query.toLowerCase().trim();
    const reranked = topCandidates.map(([id, rrfScore]) => {
      const item = this.items.get(id);
      let score = rrfScore;
      if (item && qLower) {
        if (item.text.toLowerCase().includes(qLower)) {
          score += 0.05; // exact match bonus
        }
      }
      return { id, score, item };
    });

    reranked.sort((a, b) => b.score - a.score);

    const finalResults = reranked.slice(0, limit).map((r) => ({
      id: r.id,
      type: r.item.type,
      snippet: (r.item.text || '').slice(0, 150),
      score: Number(r.score.toFixed(6)),
      source: r.item.source,
    }));

    this._emitAudit(query, finalResults.length, Date.now() - startTime);
    return finalResults;
  }

  _emitAudit(query, resultsCount, durationMs) {
    if (typeof this.auditLogger === 'function') {
      this.auditLogger({
        event_type: 'search:executed',
        actor: 'search_engine',
        payload: {
          query,
          resultsCount,
          duration_ms: durationMs,
        },
      });
    }
  }
}

export const defaultHybridSearch = new HybridSearch();

export function search(params) {
  return defaultHybridSearch.search(params);
}

export default {
  HybridSearch,
  BM25Index,
  defaultHybridSearch,
  search,
};

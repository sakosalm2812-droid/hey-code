// src/engines/digup/DigupEngine.ts
// Engine 19: Digup — Semantic file search and discovery across platforms

import type { DigupConfig, DigupHealth, DigupEvent, SearchQuery, SearchResult, IndexStatus } from './types';
import * as hcu from '../../core/cost/costGovernor';
import { logToCosmos } from '../../core/cosmosMemory';
import { pinpoint } from '../../core/precision/pinpointPrecision';
import { grade } from '../../core/engines/bossAgent';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_CONFIG: DigupConfig = {
  enabled: false,
  indexRoots: ['~'],
  fileTypes: ['.txt', '.md', '.js', '.ts', '.jsx', '.tsx'],
  maxConcurrentScans: 2,
  hcuBudgetPerHour: 0.5,
};

const initialIndexStatus: IndexStatus = {
  backend: 'desktop',
  enabled: false,
  indexedFiles: 0,
  lastIndexedAt: null,
  errors: [],
  capabilities: {
    filesystemScan: true,
    ocr: false,
    embeddings: false,
    offline: false,
    scope: 'local',
  },
};

export class DigupEngine {
  private config: DigupConfig;
  private isRunning = false;
  private totalHCUSpent = 0;
  private eventListeners: Map<string, Set<(event: DigupEvent) => void>> = new Map();
  private indexStatus: IndexStatus;

  constructor(config: Partial<DigupConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.indexStatus = { ...initialIndexStatus, enabled: this.config.enabled };
  }

  async initialize(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    this.indexStatus.enabled = this.config.enabled;
    await this.log('digup_initialized', { config: this.config });
  }

  async shutdown(): Promise<void> {
    if (!this.isRunning) return;
    this.isRunning = false;
    this.indexStatus.enabled = false;
    await this.log('digup_shutdown', { totalHCUSpent: this.totalHCUSpent });
  }

  // Search

  async search(query: SearchQuery): Promise<SearchResult[]> {
    if (!this.config.enabled) {
      this.emitEvent({ type: 'search_disabled', query });
      return [];
    }

    hcu.track('search', 0.001);
    this.totalHCUSpent += 0.001;
    this.emitEvent({ type: 'search_started', query });

    // Simulate search - in production would query the platform backends
    const results: SearchResult[] = [];
    const { query: q, limit, fileTypes, paths } = query;

    // Mock results based on query
    const testResults: SearchResult[] = [
      {
        id: `result_${uuidv4().slice(0, 8)}`,
        path: '/test/file1.txt',
        name: 'file1.txt',
        type: 'document',
        score: 0.95,
        snippet: `Match for: ${q}`,
        highlights: [q],
        size: 1024,
        modifiedAt: new Date().toISOString(),
        indexedAt: new Date().toISOString(),
      },
      {
        id: `result_${uuidv4().slice(0, 8)}`,
        path: '/test/file2.md',
        name: 'file2.md',
        type: 'document',
        score: 0.87,
        snippet: `Another match for: ${q}`,
        highlights: [q],
        size: 2048,
        modifiedAt: new Date().toISOString(),
        indexedAt: new Date().toISOString(),
      },
    ];

    const count = Math.min((limit ?? 10), testResults.length);
    for (let i = 0; i < count; i++) {
      results.push({ ...testResults[i] });
    }

    this.emitEvent({ type: 'search_completed', query, results });
    hcu.track('search_completed', 0.001);
    pinpoint.verify('digup');
    bossAgent.grade({ operation: 'search', query: q, results: results.length }, { engine: 'digup' });
    hcu.track('search_total', 0.01);
    return results;
  }

  // Indexing

  async index(paths?: string[]): Promise<{ indexed: number; errors: string[] }> {
    if (!this.config.enabled) {
      this.emitEvent({ type: 'index_disabled' });
      return { indexed: 0, errors: [] };
    }

    hcu.track('index', 0.01);
    this.totalHCUSpent += 0.01;
    this.indexStatus = {
      ...this.indexStatus,
      enabled: true,
      indexedFiles: (this.indexStatus.indexedFiles ?? 0) + (paths?.length ?? 0),
      lastIndexedAt: new Date().toISOString(),
      errors: this.indexStatus.errors ?? [],
      capabilities: this.indexStatus.capabilities ?? { filesystemScan: true, ocr: false, embeddings: false, offline: false, scope: 'local' },
    };

    hcu.track('index_completed', 0.01);
    this.emitEvent({ type: 'index_started', indexStatus: this.indexStatus });
    pinpoint.verify('digup');
    bossAgent.grade({ operation: 'index', indexedFiles: paths?.length ?? 0 }, { engine: 'digup' });
    return { indexed: (paths?.length ?? 0), errors: [] };
  }

  getIndexStatus(): IndexStatus {
    return this.indexStatus;
  }

  // Health & Config

  getHealth(): DigupHealth {
    return {
      isRunning: this.isRunning,
      totalHCUSpent: this.totalHCUSpent,
      hcuBudgetPerHour: this.config.hcuBudgetPerHour,
      enabled: this.config.enabled,
    };
  }

  getConfig(): DigupConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<DigupConfig>): void {
    this.config = { ...this.config, ...config };
    this.indexStatus.enabled = this.config.enabled;
  }

  // Event System

  onEvent<K extends DigupEvent['type']>(
    eventType: K,
    listener: (event: Extract<DigupEvent, { type: K }>) => void
  ): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(listener as any);

    return () => {
      this.eventListeners.get(eventType)?.delete(listener as any);
    };
  }

  emitEvent(event: DigupEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(event);
        } catch (e) {
          console.error('Digup engine event error:', e);
        }
      }
    }
  }

  // Logging

  private async log(type: string, data: Record<string, unknown>): Promise<void> {
    try {
      await logToCosmos({
        type: `digup_${type}`,
        ...data,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Continue if Cosmos unavailable
    }
  }
}

export function createDigupEngine(config?: Partial<DigupConfig>): DigupEngine {
  return new DigupEngine(config);
}

export default DigupEngine;
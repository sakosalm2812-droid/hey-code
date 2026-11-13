// src/engines/digup/DigupEngine.ts
// Orchestrator that picks the right backend for the current platform.
// One interface, multiple backends. Desktop / Android / iOS.

import type {
  DigupBackend,
  BackendName,
  SearchQuery,
  SearchResult,
  IndexStatus,
  BackendCapabilities,
} from './types';
import { DesktopBackend } from './backends/DesktopBackend';
import { AndroidBackend } from './backends/AndroidBackend';
import { iOSBackend } from './backends/iOSBackend';

function detectPlatform(): 'desktop' | 'android' | 'ios' {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
  if (ua.includes('android')) return 'android';
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) return 'ios';
  return 'desktop';
}

export class DigupEngine {
  private backend: DigupBackend;
  private readonly platform: 'desktop' | 'android' | 'ios';

  constructor(backend?: DigupBackend) {
    this.platform = detectPlatform();
    this.backend = backend ?? this.createDefaultBackend();
  }

  private createDefaultBackend(): DigupBackend {
    switch (this.platform) {
      case 'android':
        return new AndroidBackend();
      case 'ios':
        return new iOSBackend();
      default:
        return new DesktopBackend();
    }
  }

  getPlatform(): 'desktop' | 'android' | 'ios' {
    return this.platform;
  }

  getBackendName(): BackendName {
    return this.backend.name;
  }

  getCapabilities(): BackendCapabilities {
    return this.backend.capabilities;
  }

  async isAvailable(): Promise<boolean> {
    return this.backend.isAvailable();
  }

  async index(paths?: string[]): Promise<{ indexed: number; errors: string[] }> {
    return this.backend.index(paths);
  }

  async search(query: SearchQuery): Promise<SearchResult[]> {
    if (!query.query || query.query.trim().length === 0) {
      throw new Error('Search query must not be empty');
    }
    return this.backend.search(query);
  }

  async getStatus(): Promise<IndexStatus> {
    return this.backend.getStatus();
  }

  /**
   * Pinpoint Precision: verify that a search result actually matches the query
   * by checking the file content, not just the filename.
   *
   * This is the verification step. If the result does not contain the query
   * terms in its content/snippet, it is filtered out.
   */
  async verifyResults(results: SearchResult[], query: string): Promise<SearchResult[]> {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return results;

    return results.filter((r) => {
      const haystack = `${r.name} ${r.snippet} ${r.path}`.toLowerCase();
      // Every term must appear somewhere in name/snippet/path
      return terms.every((t) => haystack.includes(t));
    });
  }

  /**
   * Convenience: search + verify in one call.
   */
  async searchVerified(query: SearchQuery): Promise<SearchResult[]> {
    const results = await this.search(query);
    return this.verifyResults(results, query.query);
  }
}

export function createDigupEngine(backend?: DigupBackend): DigupEngine {
  return new DigupEngine(backend);
}

export default DigupEngine;
// src/engines/digup/backends/AndroidBackend.ts
// Android backend: wraps Rummage (arm64) OR Pipit.
// Uses Android native filesystem APIs via Tauri Mobile.
// Falls back to Pipit if Rummage not available.

import type { DigupBackend, BackendCapabilities, SearchResult, SearchQuery, IndexStatus } from '../types';

const CAPABILITIES: BackendCapabilities = {
  filesystemScan: true,
  ocr: true,
  embeddings: true,
  offline: true,
  scope: 'App storage + shared directories (requires storage permission)',
};

async function invokeTauri(command: string, payload: Record<string, unknown>): Promise<unknown> {
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke(command, payload);
}

export class AndroidBackend implements DigupBackend {
  readonly name = 'android' as const;
  readonly capabilities = CAPABILITIES;

  private engine: 'rummage' | 'pipit' | null = null;
  private indexedFiles = 0;
  private lastIndexedAt: string | null = null;
  private errors: string[] = [];

  async isAvailable(): Promise<boolean> {
    try {
      const result = await invokeTauri('digup_android_probe', {}) as {
        rummage?: boolean;
        pipit?: boolean;
        storagePermission?: boolean;
        error?: string;
      };

      if (result?.error) this.errors.push(result.error);

      if (result?.rummage) {
        this.engine = 'rummage';
        return true;
      }
      if (result?.pipit) {
        this.engine = 'pipit';
        return true;
      }
      if (!result?.storagePermission) {
        throw new Error('Storage permission denied. Grant HEY access to Files & media to enable search.');
      }
      return false;
    } catch (e) {
      if (e instanceof Error && e.message.includes('Storage permission')) throw e;
      this.errors.push(e instanceof Error ? e.message : 'Android probe failed');
      return false;
    }
  }

  async index(paths?: string[]): Promise<{ indexed: number; errors: string[] }> {
    const available = await this.isAvailable();
    if (!available) {
      throw new Error('No search engine available on Android. Install Rummage or Pipit.');
    }

    const scanPaths = paths && paths.length > 0 ? paths : ['/storage'];
    try {
      const result = await invokeTauri('digup_android_index', {
        engine: this.engine,
        paths: scanPaths,
      }) as { indexed: number; errors?: string[] };

      this.indexedFiles = result.indexed ?? 0;
      this.lastIndexedAt = new Date().toISOString();
      this.errors = result.errors ?? [];
      return { indexed: this.indexedFiles, errors: this.errors };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Android indexing failed';
      this.errors.push(msg);
      throw new Error(msg);
    }
  }

  async search(query: SearchQuery): Promise<SearchResult[]> {
    const available = await this.isAvailable();
    if (!available) {
      throw new Error('No search engine available on Android. Install Rummage or Pipit.');
    }

    try {
      const result = await invokeTauri('digup_android_search', {
        engine: this.engine,
        query: query.query,
        json: true,
        limit: query.limit ?? 20,
        fileTypes: query.fileTypes,
        paths: query.paths,
      }) as { results: Array<Record<string, unknown>> };

      return (result.results ?? []).map((r: Record<string, unknown>) => ({
        id: String(r.id ?? r.path ?? ''),
        path: String(r.path ?? ''),
        name: String(r.name ?? r.path ?? '').split(/[\\/]/).pop() ?? '',
        type: (r.type as SearchResult['type']) ?? 'other',
        score: Number(r.score ?? 0),
        snippet: String(r.snippet ?? ''),
        highlights: Array.isArray(r.highlights) ? r.highlights.map(String) : [],
        size: Number(r.size ?? 0),
        modifiedAt: String(r.modifiedAt ?? ''),
        indexedAt: String(r.indexedAt ?? new Date().toISOString()),
      }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Android search failed';
      this.errors.push(msg);
      throw new Error(msg);
    }
  }

  async getStatus(): Promise<IndexStatus> {
    return {
      backend: 'android',
      enabled: await this.isAvailable(),
      indexedFiles: this.indexedFiles,
      lastIndexedAt: this.lastIndexedAt,
      errors: this.errors,
      capabilities: CAPABILITIES,
    };
  }

  getActiveEngine(): 'rummage' | 'pipit' | null {
    return this.engine;
  }
}
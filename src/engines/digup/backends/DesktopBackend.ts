// src/engines/digup/backends/DesktopBackend.ts
// Desktop backend: wraps the `im-looking-for` CLI (`ilf`) sidecar process.
// Detects install, spawns from Tauri, calls `ilf <query> --json`.
// NO Python bundled into HEY — ilf runs as a separate sidecar process.

import type { DigupBackend, BackendCapabilities, SearchResult, SearchQuery, IndexStatus } from '../types';

const CAPABILITIES: BackendCapabilities = {
  filesystemScan: true,
  ocr: true,
  embeddings: true,
  offline: true,
  scope: 'Full local filesystem (user-scoped)',
};

function detectPlatform(): 'windows' | 'macos' | 'linux' {
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
  if (userAgent.includes('mac')) return 'macos';
  if (userAgent.includes('linux')) return 'linux';
  return 'windows';
}

function ilfBinaryName(): string {
  const platform = detectPlatform();
  if (platform === 'windows') return 'ilf.exe';
  if (platform === 'macos') return 'ilf-macos';
  return 'ilf-linux';
}

function installInstructions(): string {
  const platform = detectPlatform();
  if (platform === 'windows') {
    return 'Install im-looking-for: winget install im-looking-for OR download from https://github.com/im-looking-for/im-looking-for/releases';
  }
  if (platform === 'macos') {
    return 'Install im-looking-for: brew install im-looking-for OR download from https://github.com/im-looking-for/im-looking-for/releases';
  }
  return 'Install im-looking-for: cargo install im-looking-for OR download from https://github.com/im-looking-for/im-looking-for/releases';
}

async function invokeTauri(command: string, payload: Record<string, unknown>): Promise<unknown> {
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke(command, payload);
}

export class DesktopBackend implements DigupBackend {
  readonly name = 'desktop' as const;
  readonly capabilities = CAPABILITIES;

  private installed: boolean | null = null;
  private indexedFiles = 0;
  private lastIndexedAt: string | null = null;
  private errors: string[] = [];

  async isAvailable(): Promise<boolean> {
    if (this.installed !== null) return this.installed;
    try {
      const result = await invokeTauri('digup_check_ilf', {
        binary: ilfBinaryName(),
      }) as { found: boolean; path?: string; error?: string };
      this.installed = Boolean(result?.found);
      if (!this.installed && result?.error) {
        this.errors.push(result.error);
      }
    } catch (e) {
      this.installed = false;
      this.errors.push(e instanceof Error ? e.message : 'ilf check failed');
    }
    return this.installed;
  }

  async index(paths?: string[]): Promise<{ indexed: number; errors: string[] }> {
    const available = await this.isAvailable();
    if (!available) {
      throw new Error(`ilf not installed. ${installInstructions()}`);
    }

    const scanPaths = paths && paths.length > 0 ? paths : ['%USERPROFILE%'];
    try {
      const result = await invokeTauri('digup_index', {
        binary: ilfBinaryName(),
        paths: scanPaths,
      }) as { indexed: number; errors?: string[] };

      this.indexedFiles = result.indexed ?? 0;
      this.lastIndexedAt = new Date().toISOString();
      this.errors = result.errors ?? [];
      return { indexed: this.indexedFiles, errors: this.errors };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Indexing failed';
      this.errors.push(msg);
      throw new Error(msg);
    }
  }

  async search(query: SearchQuery): Promise<SearchResult[]> {
    const available = await this.isAvailable();
    if (!available) {
      throw new Error(`ilf not installed. ${installInstructions()}`);
    }

    try {
      const result = await invokeTauri('digup_search', {
        binary: ilfBinaryName(),
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
      const msg = e instanceof Error ? e.message : 'Search failed';
      this.errors.push(msg);
      throw new Error(msg);
    }
  }

  async getStatus(): Promise<IndexStatus> {
    return {
      backend: 'desktop',
      enabled: await this.isAvailable(),
      indexedFiles: this.indexedFiles,
      lastIndexedAt: this.lastIndexedAt,
      errors: this.errors,
      capabilities: CAPABILITIES,
    };
  }

  getInstallInstructions(): string {
    return installInstructions();
  }
}
// src/engines/digup/types.ts
// Types for Digup — local semantic file search

export type SearchQuery = {
  query: string;
  limit?: number;
  fileTypes?: string[];
  paths?: string[];
  minScore?: number;
};

export type SearchResult = {
  id: string;
  path: string;
  name: string;
  type: 'document' | 'image' | 'audio' | 'video' | 'code' | 'other';
  score: number;
  snippet: string;
  highlights: string[];
  size: number;
  modifiedAt: string;
  indexedAt: string;
};

export type IndexStatus = {
  backend: 'desktop' | 'android' | 'ios';
  enabled: boolean;
  indexedFiles: number;
  lastIndexedAt: string | null;
  errors: string[];
  capabilities: BackendCapabilities;
};

export type BackendCapabilities = {
  filesystemScan: boolean;
  ocr: boolean;
  embeddings: boolean;
  offline: boolean;
  scope: string;
};

export type BackendName = 'desktop' | 'android' | 'ios';

export interface DigupBackend {
  readonly name: BackendName;
  readonly capabilities: BackendCapabilities;
  isAvailable(): Promise<boolean>;
  index(paths?: string[]): Promise<{ indexed: number; errors: string[] }>;
  search(query: SearchQuery): Promise<SearchResult[]>;
  getStatus(): Promise<IndexStatus>;
}

export interface MCPServerConfig {
  name: string;
  version: string;
  tools: MCPTool[];
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, { type: string; description: string }>;
    required?: string[];
  };
  handler: (input: Record<string, unknown>) => Promise<unknown>;
}
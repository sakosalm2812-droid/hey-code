// src/engines/digup/types.ts
// Engine 19: Digup — Type definitions with interfaces

export interface DigupConfig {
  enabled: boolean;
  indexRoots: string[];
  fileTypes: string[];
  maxConcurrentScans: number;
  hcuBudgetPerHour: number;
}

export interface DigupHealth {
  isRunning: boolean;
  totalHCUSpent: number;
  hcuBudgetPerHour: number;
  enabled: boolean;
}

export interface SearchQuery {
  query: string;
  limit?: number;
  fileTypes?: string[];
  paths?: string[];
}

export interface SearchResult {
  id: string;
  path: string;
  name: string;
  type: string;
  score: number;
  snippet: string;
  highlights: string[];
  size: number;
  modifiedAt: string;
  indexedAt: string;
}

export interface IndexStatus {
  backend: string;
  enabled: boolean;
  indexedFiles: number;
  lastIndexedAt: string | null;
  errors: string[];
  capabilities: {
    filesystemScan: boolean;
    ocr: boolean;
    embeddings: boolean;
    offline: boolean;
    scope: string;
  };
}

export interface DigupEvent {
  type: 'search_disabled' | 'search_started' | 'search_completed' | 'index_disabled';
  query?: SearchQuery;
}

export interface DigupEventMap {
  search_disabled: { query: SearchQuery };
  search_started: { query: SearchQuery };
  search_completed: { query: SearchQuery; results: SearchResult[] };
  index_disabled: {};
}
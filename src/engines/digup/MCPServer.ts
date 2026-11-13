// src/engines/digup/MCPServer.ts
// Exposes Digup search via MCP so HEY sub-agents can call it.
// Implements a minimal MCP tool server: list tools + call tool.

import type { DigupEngine } from './DigupEngine';
import type { MCPTool, SearchQuery, SearchResult } from './types';

export class DigupMCPServer {
  readonly name = 'digup';
  readonly version = '1.0.0';
  private readonly engine: DigupEngine;

  constructor(engine: DigupEngine) {
    this.engine = engine;
  }

  listTools(): MCPTool[] {
    return [
      {
        name: 'digup.search',
        description:
          'Search files by what is INSIDE them, not by filename. Searches documents, ' +
          'photos (OCR), screenshots, voice memos, video, and code. Runs entirely on-device.',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Natural language search query' },
            limit: { type: 'number', description: 'Max results (default 20)', default: 20 },
            fileTypes: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by type: document, image, audio, video, code, other',
            },
            paths: {
              type: 'array',
              items: { type: 'string' },
              description: 'Restrict search to specific paths',
            },
            minScore: { type: 'number', description: 'Minimum relevance score 0-1', default: 0 },
          },
          required: ['query'],
        },
        handler: async (input: Record<string, unknown>) => {
          const query: SearchQuery = {
            query: String(input.query ?? ''),
            limit: Number(input.limit ?? 20),
            fileTypes: Array.isArray(input.fileTypes)
              ? input.fileTypes.map(String)
              : undefined,
            paths: Array.isArray(input.paths) ? input.paths.map(String) : undefined,
            minScore: Number(input.minScore ?? 0),
          };
          const results = await this.engine.searchVerified(query);
          return { results, count: results.length };
        },
      },
      {
        name: 'digup.status',
        description: 'Get Digup index health: backend, file count, last indexed, errors.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
        handler: async () => {
          const status = await this.engine.getStatus();
          return status;
        },
      },
      {
        name: 'digup.index',
        description: 'Trigger (re)indexing of specified paths. Returns files indexed.',
        inputSchema: {
          type: 'object',
          properties: {
            paths: {
              type: 'array',
              items: { type: 'string' },
              description: 'Paths to index (default: user home)',
            },
          },
        },
        handler: async (input: Record<string, unknown>) => {
          const paths = Array.isArray(input.paths) ? input.paths.map(String) : undefined;
          return this.engine.index(paths);
        },
      },
    ];
  }

  async callTool(name: string, input: Record<string, unknown>): Promise<unknown> {
    const tool = this.listTools().find((t) => t.name === name);
    if (!tool) {
      throw new Error(`Unknown MCP tool: ${name}`);
    }
    return tool.handler(input);
  }

  /** JSON-RPC-style dispatch for MCP protocol compatibility */
  async handleRequest(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
    switch (method) {
      case 'tools/list':
        return { tools: this.listTools() };
      case 'tools/call':
        return this.callTool(String(params.name ?? ''), (params.arguments ?? {}) as Record<string, unknown>);
      case 'initialize':
        return {
          name: this.name,
          version: this.version,
          capabilities: { tools: true },
        };
      default:
        throw new Error(`Unknown MCP method: ${method}`);
    }
  }
}

export function createDigupMCPServer(engine: DigupEngine): DigupMCPServer {
  return new DigupMCPServer(engine);
}

export default DigupMCPServer;
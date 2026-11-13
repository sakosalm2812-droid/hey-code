// src/engines/digup/__tests__/DigupEngine.test.ts
// Tests for Digup Engine orchestrator and backends

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DigupEngine, createDigupEngine } from '../DigupEngine';
import { DesktopBackend } from '../backends/DesktopBackend';
import { AndroidBackend } from '../backends/AndroidBackend';
import { iOSBackend } from '../backends/iOSBackend';
import type { SearchQuery, SearchResult } from '../types';

// Mock the Tauri invoke
const mockInvoke = vi.fn();
vi.mock('@tauri-apps/api/core', () => ({
  invoke: mockInvoke,
}));

describe('DigupEngine', () => {
  let engine: DigupEngine;
  let desktopBackend: DesktopBackend;

  beforeEach(() => {
    vi.clearAllMocks();
    desktopBackend = new DesktopBackend();
    engine = createDigupEngine(desktopBackend);
  });

  describe('Backend selection', () => {
    it('selects desktop backend', () => {
      expect(engine.getBackendName()).toBe('desktop');
    });

    it('selects android backend when created with android backend', () => {
      const androidBackend = new AndroidBackend();
      const androidEngine = new DigupEngine(androidBackend);
      expect(androidEngine.getBackendName()).toBe('android');
    });

    it('selects ios backend when created with ios backend', () => {
      const iosBackend = new iOSBackend();
      const iosEngine = new DigupEngine(iosBackend);
      expect(iosEngine.getBackendName()).toBe('ios');
    });
  });

  describe('Search query validation', () => {
    it('rejects empty query', async () => {
      await expect(engine.search({ query: '' })).rejects.toThrow('Search query must not be empty');
      await expect(engine.search({ query: '   ' })).rejects.toThrow('Search query must not be empty');
    });

    it('accepts valid query', async () => {
      mockInvoke
        .mockResolvedValueOnce({ found: true }) // isAvailable
        .mockResolvedValueOnce({ results: [] }); // search
      const results = await engine.search({ query: 'test' });
      expect(results).toEqual([]);
    });
  });

  describe('Pinpoint Precision verification', () => {
    const mockResults: SearchResult[] = [
      {
        id: '1',
        path: '/home/user/documents/budget.pdf',
        name: 'budget.pdf',
        type: 'document',
        score: 0.95,
        snippet: 'Quarterly budget for Q1 2024',
        highlights: ['Quarterly', 'budget'],
        size: 1024000,
        modifiedAt: '2024-01-15T10:00:00Z',
        indexedAt: '2024-01-16T08:00:00Z',
      },
      {
        id: '2',
        path: '/home/user/images/photo.jpg',
        name: 'photo.jpg',
        type: 'image',
        score: 0.3,
        snippet: 'Vacation photo',
        highlights: [],
        size: 2048000,
        modifiedAt: '2024-06-01T12:00:00Z',
        indexedAt: '2024-06-02T09:00:00Z',
      },
    ];

    it('filters results that do not contain all query terms', async () => {
      const verified = await engine.verifyResults(mockResults, 'quarterly budget');
      expect(verified.length).toBe(1);
      expect(verified[0].id).toBe('1');
    });

    it('keeps results that contain all terms across name/snippet/path', async () => {
      const verified = await engine.verifyResults(mockResults, 'budget');
      expect(verified.length).toBe(1);
    });

    it('returns all results for empty query', async () => {
      const verified = await engine.verifyResults(mockResults, '');
      expect(verified.length).toBe(2);
    });

    it('matches terms in filename', async () => {
      const verified = await engine.verifyResults(mockResults, 'budget.pdf');
      expect(verified.length).toBe(1);
      expect(verified[0].id).toBe('1');
    });

    it('is case insensitive', async () => {
      const verified = await engine.verifyResults(mockResults, 'QUARTERLY BUDGET');
      expect(verified.length).toBe(1);
    });
  });

  describe('searchVerified convenience', () => {
    it('searches and verifies in one call', async () => {
      mockInvoke
        .mockResolvedValueOnce({ found: true }) // isAvailable
        .mockResolvedValueOnce({ // search
          results: [
            { id: '1', path: '/test.txt', name: 'test.txt', type: 'document', score: 0.9,
              snippet: 'hello world', highlights: [], size: 100, modifiedAt: '', indexedAt: '' },
            { id: '2', path: '/other.txt', name: 'other.txt', type: 'document', score: 0.5,
              snippet: 'foo bar', highlights: [], size: 100, modifiedAt: '', indexedAt: '' },
          ]
        });
      const results = await engine.searchVerified({ query: 'hello' });
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('1');
    });
  });
});

describe('DesktopBackend', () => {
  let backend: DesktopBackend;

  beforeEach(() => {
    vi.clearAllMocks();
    backend = new DesktopBackend();
  });

  it('checks for ilf binary availability', async () => {
    mockInvoke.mockResolvedValue({ found: true, path: '/usr/bin/ilf' });
    const available = await backend.isAvailable();
    expect(available).toBe(true);
    expect(mockInvoke).toHaveBeenCalledWith('digup_check_ilf', expect.objectContaining({ binary: expect.any(String) }));
  });

  it('returns false and stores install instructions when ilf not found', async () => {
    mockInvoke.mockResolvedValue({ found: false, error: 'not found' });
    const available = await backend.isAvailable();
    expect(available).toBe(false);
    expect(backend.getInstallInstructions()).toContain('im-looking-for');
  });

  it('throws when searching without ilf', async () => {
    // First call: isAvailable returns false
    mockInvoke.mockResolvedValueOnce({ found: false });
    await expect(backend.search({ query: 'test' })).rejects.toThrow('ilf not installed');
  });

  it('returns status with capabilities', async () => {
    mockInvoke.mockResolvedValue({ found: true });
    const status = await backend.getStatus();
    expect(status.backend).toBe('desktop');
    expect(status.capabilities.filesystemScan).toBe(true);
    expect(status.capabilities.offline).toBe(true);
  });
});

describe('AndroidBackend', () => {
  let backend: AndroidBackend;

  beforeEach(() => {
    vi.clearAllMocks();
    backend = new AndroidBackend();
  });

  it('detects Rummage engine', async () => {
    mockInvoke.mockResolvedValue({ rummage: true, pipit: false, storagePermission: true });
    const available = await backend.isAvailable();
    expect(available).toBe(true);
    expect(backend.getActiveEngine()).toBe('rummage');
  });

  it('falls back to Pipit', async () => {
    mockInvoke.mockResolvedValue({ rummage: false, pipit: true, storagePermission: true });
    const available = await backend.isAvailable();
    expect(available).toBe(true);
    expect(backend.getActiveEngine()).toBe('pipit');
  });

  it('throws when storage permission denied', async () => {
    mockInvoke.mockResolvedValue({ rummage: false, pipit: false, storagePermission: false });
    await expect(backend.isAvailable()).rejects.toThrow('Storage permission denied');
  });
});

describe('iOSBackend', () => {
  let backend: iOSBackend;

  beforeEach(() => {
    vi.clearAllMocks();
    backend = new iOSBackend();
  });

  it('requires SimilaritySearchKit, PhotoKit, and DocumentPicker', async () => {
    mockInvoke.mockResolvedValue({
      similarityKit: true,
      photoKit: true,
      documentPicker: true,
      meshPaired: false,
    });
    const available = await backend.isAvailable();
    expect(available).toBe(true);
  });

  it('reports 7 access layers', async () => {
    const layers = backend.getAccessLayers();
    expect(layers.length).toBe(7);
    expect(layers[0].name).toBe('HEY Sandbox');
    expect(layers[6].name).toBe('Siri Shortcut');
  });

  it('shows mesh availability', async () => {
    mockInvoke.mockResolvedValue({
      similarityKit: true,
      photoKit: true,
      documentPicker: true,
      meshPaired: true,
    });
    await backend.isAvailable();
    expect(backend.isMeshAvailable()).toBe(true);
  });
});
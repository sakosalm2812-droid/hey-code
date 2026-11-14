// Tests for Digup Engine
// Engine 19: Digup — Semantic file search and discovery across platforms

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DigupEngine, createDigupEngine } from '../DigupEngine';
import type { DigupConfig } from '../types';
import { logToCosmos } from '../../../core/cosmosMemory';

vi.mock('../../../core/cosmosMemory', () => ({
  logToCosmos: vi.fn().mockResolvedValue(undefined),
}));

describe('DigupEngine', () => {
  let engine: DigupEngine;

  const testConfig: Partial<DigupConfig> = {
    enabled: false,
    indexRoots: ['~'],
    fileTypes: ['.txt', '.md', '.js', '.ts', '.jsx', '.tsx'],
    maxConcurrentScans: 2,
    hcuBudgetPerHour: 0.5,
  };

  beforeEach(async () => {
    engine = createDigupEngine(testConfig);
    await engine.initialize();
  });

  afterEach(async () => {
    await engine.shutdown();
  });

  describe('Initialization', () => {
    it('initializes with default config', async () => {
      const defaultEngine = createDigupEngine();
      await defaultEngine.initialize();
      const health = defaultEngine.getHealth();
      expect(health.isRunning).toBe(true);
      expect(health.enabled).toBe(false);
      await defaultEngine.shutdown();
    });

    it('initializes with custom config', async () => {
      const customEngine = createDigupEngine({
        enabled: true,
        indexRoots: ['/test'],
        hcuBudgetPerHour: 1.0,
      });
      await customEngine.initialize();
      const health = customEngine.getHealth();
      expect(health.isRunning).toBe(true);
      expect(health.enabled).toBe(true);
      await customEngine.shutdown();
    });
  });

  describe('Search', () => {
    it('searches with digup disabled', async () => {
      const result = await engine.search({ query: 'test' });
      expect(result).toEqual([]);
    });

    it('searches with digup enabled', async () => {
      const searchEngine = createDigupEngine({
        ...testConfig,
        enabled: true,
      });
      await searchEngine.initialize();
      const result = await searchEngine.search({ query: 'test' });
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      await searchEngine.shutdown();
    });
  });

  describe('Indexing', () => {
    it('indexes with digup disabled', async () => {
      const result = await engine.index();
      expect(result).toEqual({ indexed: 0, errors: [] });
    });

    it('indexes with digup enabled', async () => {
      const indexEngine = createDigupEngine({
        ...testConfig,
        enabled: true,
      });
      await indexEngine.initialize();
      const result = await indexEngine.index(['/test']);
      expect(result).toBeDefined();
      expect(result.indexed).toBeGreaterThanOrEqual(0);
      await indexEngine.shutdown();
    });
  });

  describe('Health Metrics', () => {
    it('reports health metrics', () => {
      const health = engine.getHealth();
      expect(health).toHaveProperty('isRunning');
      expect(health).toHaveProperty('totalHCUSpent');
      expect(health).toHaveProperty('hcuBudgetPerHour');
      expect(health).toHaveProperty('enabled');
    });

    it('tracks HCU spending after search', async () => {
      const searchEngine = createDigupEngine({
        ...testConfig,
        enabled: true,
      });
      await searchEngine.initialize();
      await searchEngine.search({ query: 'test' });
      const health = searchEngine.getHealth();
      expect(health.totalHCUSpent).toBeGreaterThan(0);
      await searchEngine.shutdown();
    });
  });

  describe('Config Management', () => {
    it('updates config', () => {
      engine.updateConfig({ enabled: true, hcuBudgetPerHour: 1.0 });
      const config = engine.getConfig();
      expect(config.enabled).toBe(true);
      expect(config.hcuBudgetPerHour).toBe(1.0);
    });
  });

  describe('Event System', () => {
    it('registers event listeners', async () => {
      const listener = vi.fn();
      const searchEngine = createDigupEngine({
        ...testConfig,
        enabled: true,
      });
      await searchEngine.initialize();
      searchEngine.onEvent('search_started', listener);
      await searchEngine.search({ query: 'test' });
      expect(listener).toHaveBeenCalled();
      await searchEngine.shutdown();
    });

    it('emits search_started event', async () => {
      let eventReceived = false;
      const searchEngine = createDigupEngine({
        ...testConfig,
        enabled: true,
      });
      await searchEngine.initialize();
      searchEngine.onEvent('search_started', () => { eventReceived = true; });
      await searchEngine.search({ query: 'test' });
      expect(eventReceived).toBe(true);
      await searchEngine.shutdown();
    });

    it('emits search_completed event', async () => {
      let eventReceived = false;
      const searchEngine = createDigupEngine({
        ...testConfig,
        enabled: true,
      });
      await searchEngine.initialize();
      searchEngine.onEvent('search_completed', () => { eventReceived = true; });
      await searchEngine.search({ query: 'test' });
      expect(eventReceived).toBe(true);
      await searchEngine.shutdown();
    });

    it('emits index_started event', async () => {
      let eventReceived = false;
      const indexEngine = createDigupEngine({
        ...testConfig,
        enabled: true,
      });
      await indexEngine.initialize();
      indexEngine.onEvent('index_started', () => { eventReceived = true; });
      await indexEngine.index(['/test']);
      expect(eventReceived).toBe(true);
      await indexEngine.shutdown();
    });
  });
});
// Tests for Model Socket Engine
// Engine 18: 86B Model Socket — High-capacity model inference via llama.cpp HTTP API

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ModelSocketEngine, createModelSocketEngine } from '../ModelSocketEngine';
import type { ModelSocketConfig } from '../types';
import { logToCosmos } from '../../../core/cosmosMemory';

vi.mock('../../../core/cosmosMemory', () => ({
  logToCosmos: vi.fn().mockResolvedValue(undefined),
}));

describe('ModelSocketEngine', () => {
  let engine: ModelSocketEngine;

  const testConfig: Partial<ModelSocketConfig> = {
    modelPath: '',
    host: 'localhost',
    port: 8080,
    modelName: 'default',
    contextLength: 4096,
    temperature: 0.7,
    maxTokens: 2048,
    hcuBudgetPerHour: 5.0,
    concurrentRequests: 4,
  };

  beforeEach(async () => {
    engine = createModelSocketEngine(testConfig);
    await engine.initialize();
  });

  afterEach(async () => {
    await engine.shutdown();
  });

  describe('Initialization', () => {
    it('initializes with default config', async () => {
      const defaultEngine = createModelSocketEngine();
      await defaultEngine.initialize();
      const health = defaultEngine.getHealth();
      expect(health.isRunning).toBe(true);
      expect(health.modelLoaded).toBe(false);
      await defaultEngine.shutdown();
    });

    it('initializes with custom config', async () => {
      const customEngine = createModelSocketEngine({
        modelPath: '/path/to/model.gguf',
        modelName: 'llama-3',
        hcuBudgetPerHour: 10.0,
      });
      await customEngine.initialize();
      const health = customEngine.getHealth();
      expect(health.isRunning).toBe(true);
      expect(health.modelLoaded).toBe(true);
      await customEngine.shutdown();
    });
  });

  describe('Inference', () => {
    it('infers without model path', async () => {
      const result = await engine.infer('Hello, world!');
      expect(result.success).toBe(false);
      expect(result.error).toBe('No model path configured');
    });

    it('infers with model path', async () => {
      const inferEngine = createModelSocketEngine({
        ...testConfig,
        modelPath: '/path/to/model.gguf',
      });
      await inferEngine.initialize();
      const result = await inferEngine.infer('Test prompt');
      expect(result).toBeDefined();
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('tokensUsed');
      expect(result).toHaveProperty('hcuCost');
      await inferEngine.shutdown();
    });
  });

  describe('Health Metrics', () => {
    it('reports health metrics', () => {
      const health = engine.getHealth();
      expect(health).toHaveProperty('isRunning');
      expect(health).toHaveProperty('totalHCUSpent');
      expect(health).toHaveProperty('hcuBudgetPerHour');
      expect(health).toHaveProperty('modelLoaded');
      expect(health).toHaveProperty('concurrentRequests');
    });

    it('tracks HCU spending after inference', async () => {
      const inferEngine = createModelSocketEngine({
        ...testConfig,
        modelPath: '/path/to/model.gguf',
      });
      await inferEngine.initialize();
      await inferEngine.infer('Test prompt');
      const health = inferEngine.getHealth();
      expect(health.totalHCUSpent).toBeGreaterThan(0);
      await inferEngine.shutdown();
    });
  });

  describe('Config Management', () => {
    it('updates config', () => {
      engine.updateConfig({ hcuBudgetPerHour: 10.0, modelPath: '/new/path' });
      const config = engine.getConfig();
      expect(config.hcuBudgetPerHour).toBe(10.0);
      expect(config.modelPath).toBe('/new/path');
    });
  });

  describe('Event System', () => {
    it('registers event listeners', async () => {
      const listener = vi.fn();
      const inferEngine = createModelSocketEngine({
        ...testConfig,
        modelPath: '/path/to/model.gguf',
      });
      await inferEngine.initialize();
      inferEngine.onEvent('inference_started', listener);
      await inferEngine.infer('Test prompt');
      expect(listener).toHaveBeenCalled();
      await inferEngine.shutdown();
    });

    it('emits inference_started event', async () => {
      let eventReceived = false;
      const inferEngine = createModelSocketEngine({
        ...testConfig,
        modelPath: '/path/to/model.gguf',
      });
      await inferEngine.initialize();
      inferEngine.onEvent('inference_started', () => { eventReceived = true; });
      await inferEngine.infer('Test prompt');
      expect(eventReceived).toBe(true);
      await inferEngine.shutdown();
    });

    it('emits inference_completed event', async () => {
      let eventReceived = false;
      const inferEngine = createModelSocketEngine({
        ...testConfig,
        modelPath: '/path/to/model.gguf',
      });
      await inferEngine.initialize();
      inferEngine.onEvent('inference_completed', () => { eventReceived = true; });
      await inferEngine.infer('Test prompt');
      expect(eventReceived).toBe(true);
      await inferEngine.shutdown();
    });

    it('emits inference_failed event', async () => {
      let eventReceived = false;
      engine.onEvent('inference_failed', () => { eventReceived = true; });
      await engine.infer('Test prompt');
      expect(eventReceived).toBe(true);
    });
  });
});
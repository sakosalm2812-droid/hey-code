// Tests for Rendering Engine
// Engine 9: Rendering — Frame rendering, framebuffer management, and visual output

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RenderingEngine, createRenderingEngine } from '../RenderingEngine';
import type { RenderingConfig } from '../types';
import { logToCosmos } from '../../../core/cosmosMemory';

vi.mock('../../../core/cosmosMemory', () => ({
  logToCosmos: vi.fn().mockResolvedValue(undefined),
}));

describe('RenderingEngine', () => {
  let engine: RenderingEngine;

  const testConfig: Partial<RenderingConfig> = {
    framesPerSecond: 60,
    framebufferWidth: 1920,
    framebufferHeight: 1080,
    maxFramesInFlight: 2,
    hcuBudgetPerHour: 1.0,
    enableVSync: true,
  };

  beforeEach(async () => {
    engine = createRenderingEngine(testConfig);
    await engine.initialize();
  });

  afterEach(async () => {
    await engine.shutdown();
  });

  describe('Initialization', () => {
    it('initializes with default config', async () => {
      const defaultEngine = createRenderingEngine();
      await defaultEngine.initialize();
      const health = defaultEngine.getHealth();
      expect(health.isRunning).toBe(true);
      expect(health.hcuBudgetPerHour).toBe(1.0);
      await defaultEngine.shutdown();
    });

    it('initializes with custom config', async () => {
      const customEngine = createRenderingEngine({
        framesPerSecond: 30,
        framebufferWidth: 1280,
        framebufferHeight: 720,
        hcuBudgetPerHour: 2.0,
      });
      await customEngine.initialize();
      const health = customEngine.getHealth();
      expect(health.isRunning).toBe(true);
      expect(health.hcuBudgetPerHour).toBe(2.0);
      await customEngine.shutdown();
    });
  });

  describe('Frame Management', () => {
    it('creates a frame', () => {
      const frame = engine.createFrame({});
      expect(frame).toBeDefined();
      expect(frame.id).toBeDefined();
      expect(frame.timestamp).toBeDefined();
      expect(frame.width).toBe(1920);
      expect(frame.height).toBe(1080);
    });

    it('creates a frame with custom dimensions', () => {
      const frame = engine.createFrame({ width: 800, height: 600 });
      expect(frame.width).toBe(800);
      expect(frame.height).toBe(600);
    });
  });

  describe('Health Metrics', () => {
    it('reports health metrics', () => {
      const health = engine.getHealth();
      expect(health).toHaveProperty('isRunning');
      expect(health).toHaveProperty('totalHCUSpent');
      expect(health).toHaveProperty('hcuBudgetPerHour');
      expect(typeof health.totalHCUSpent).toBe('number');
    });

    it('tracks HCU spending after frame creation', () => {
      engine.createFrame({});
      const health = engine.getHealth();
      expect(health.totalHCUSpent).toBeGreaterThan(0);
    });
  });

  describe('Config Management', () => {
    it('updates config', () => {
      engine.updateConfig({ framesPerSecond: 30, hcuBudgetPerHour: 2.0 });
      const config = engine.getConfig();
      expect(config.framesPerSecond).toBe(30);
      expect(config.hcuBudgetPerHour).toBe(2.0);
    });
  });

  describe('Event System', () => {
    it('registers event listeners', () => {
      const listener = vi.fn();
      engine.onEvent('frame_created', listener);
      engine.createFrame({});
      expect(listener).toHaveBeenCalled();
    });

    it('emits frame_created event', () => {
      let eventReceived = false;
      engine.onEvent('frame_created', () => { eventReceived = true; });
      engine.createFrame({});
      expect(eventReceived).toBe(true);
    });
  });
});
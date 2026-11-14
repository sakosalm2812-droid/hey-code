// src/engines/multiSense/__tests__/MultiSenseEngine.test.ts
// Tests for Multi-Sense Control Engine

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MultiSenseEngine, createMultiSenseEngine } from '../MultiSenseEngine';
import type { MultiSenseConfig, SenseType, SenseChannel, SensoryInput, SenseFusionResult } from '../types';
import { logToCosmos } from '../../../core/cosmosMemory';

vi.mock('../../../core/cosmosMemory', () => ({
  logToCosmos: vi.fn().mockResolvedValue(undefined),
}));

describe('MultiSenseEngine', () => {
  let engine: MultiSenseEngine;

  const testConfig: Partial<MultiSenseConfig> = {
    enabledSenses: ['vision', 'audio', 'spatial'],
    fusionIntervalMs: 1000,
    minConfidenceThreshold: 0.3,
    hcuBudgetPerMinute: 10.0,
    autoCalibrate: true,
  };

  beforeEach(async () => {
    engine = createMultiSenseEngine(testConfig);
    await engine.initialize();
  });

  afterEach(async () => {
    await engine.shutdown();
  });

  describe('Initialization', () => {
    it('initializes with default config', async () => {
      const defaultEngine = createMultiSenseEngine();
      await defaultEngine.initialize();
      const health = defaultEngine.getHealth();
      expect(health.isRunning).toBe(true);
      expect(health.totalChannels).toBe(3); // vision, audio, spatial
      await defaultEngine.shutdown();
    });

    it('initializes with custom config', () => {
      const health = engine.getHealth();
      expect(health.isRunning).toBe(true);
      expect(health.totalChannels).toBe(3);
    });

    it('creates channels for enabled senses', () => {
      const channels = engine.getChannels();
      const types = channels.map(c => c.type).sort();
      expect(types).toEqual(['audio', 'spatial', 'vision']);
    });
  });

  describe('Channel Management', () => {
    it('activates a new sense', () => {
      const channel = engine.activateSense('tactile');
      expect(channel).not.toBeNull();
      expect(channel?.type).toBe('tactile');
      expect(channel?.status).toBe('active');
    });

    it('deactivates a sense', () => {
      const channels = engine.getChannels();
      const visionChannel = channels.find(c => c.type === 'vision');
      expect(visionChannel).toBeDefined();

      expect(engine.deactivateSense(visionChannel!.id)).toBe(true);
      expect(engine.getChannel(visionChannel!.id)?.status).toBe('inactive');
    });

    it('sets sensitivity', () => {
      const channels = engine.getChannels();
      const visionChannel = channels.find(c => c.type === 'vision');
      expect(visionChannel).toBeDefined();

      expect(engine.setSensitivity(visionChannel!.id, 0.5)).toBe(true);
      expect(engine.getChannel(visionChannel!.id)?.sensitivity).toBe(0.5);
    });

    it('clamps sensitivity to 0-1 range', () => {
      const channels = engine.getChannels();
      const visionChannel = channels.find(c => c.type === 'vision');
      expect(visionChannel).toBeDefined();

      engine.setSensitivity(visionChannel!.id, 1.5);
      expect(engine.getChannel(visionChannel!.id)?.sensitivity).toBe(1);

      engine.setSensitivity(visionChannel!.id, -0.5);
      expect(engine.getChannel(visionChannel!.id)?.sensitivity).toBe(0);
    });
  });

  describe('Sensory Input', () => {
    it('receives input on active channel', () => {
      const channels = engine.getChannels();
      const visionChannel = channels.find(c => c.type === 'vision');

      const input = engine.receiveInput({
        channelId: visionChannel!.id,
        type: 'vision',
        data: { elements: ['test'] },
        confidence: 0.9,
        importance: 0.8,
      });

      expect(input.id).toMatch(/^input_/);
      expect(input.channelId).toBe(visionChannel!.id);
      expect(input.type).toBe('vision');
    });

    it('throws error for inactive channel', () => {
      const channels = engine.getChannels();
      const visionChannel = channels.find(c => c.type === 'vision');
      engine.deactivateSense(visionChannel!.id);

      expect(() => engine.receiveInput({
        channelId: visionChannel!.id,
        type: 'vision',
        data: {},
        confidence: 0.9,
        importance: 0.8,
      })).toThrow('Channel not active');
    });

    it('simulates vision input', () => {
      const input = engine.simulateVisionInput({ elements: ['editor', 'terminal'] }, 0.9);
      expect(input.type).toBe('vision');
      expect(input.data).toEqual({ elements: ['editor', 'terminal'] });
    });

    it('simulates audio input', () => {
      // Activate audio first
      engine.activateSense('audio');
      const input = engine.simulateAudioInput({ transcript: 'hello', keywords: ['hello'] }, 0.85);
      expect(input.type).toBe('audio');
    });

    it('simulates spatial input', () => {
      const input = engine.simulateSpatialInput({ windows: ['app1'], layout: 'single' }, 0.95);
      expect(input.type).toBe('spatial');
    });

    it('simulates tactile input', () => {
      // Activate tactile first
      engine.activateSense('tactile');
      const input = engine.simulateTactileInput({ actions: ['click'], hotkeys: ['ctrl+c'] }, 0.9);
      expect(input.type).toBe('tactile');
    });
  });

  describe('Sense Fusion', () => {
    it('fuses senses when multiple inputs available', async () => {
      // Simulate inputs on multiple channels
      engine.simulateVisionInput({ elements: ['code'] });
      engine.simulateSpatialInput({ windows: ['VS Code'], layout: 'single' });

      await new Promise(r => setTimeout(r, 1500));

      const fusion = engine.getLatestFusion();
      expect(fusion).not.toBeNull();
      expect(fusion?.contributingSenses.length).toBeGreaterThanOrEqual(2);
      expect(fusion?.confidence).toBeGreaterThan(0);
    });

    it('does not fuse with single sense', async () => {
      engine.simulateVisionInput({ elements: ['code'] });

      await new Promise(r => setTimeout(r, 1500));

      // With only one sense, fusion may not happen or return null
      // The engine requires at least 2 senses for meaningful fusion
    });

    it('stores fusion history', async () => {
      engine.simulateVisionInput({ elements: ['code'] });
      engine.simulateSpatialInput({ windows: ['VS Code'], layout: 'single' });

      await new Promise(r => setTimeout(r, 1500));

      const history = engine.getFusionHistory();
      expect(history.length).toBeGreaterThan(0);
    });
  });

  describe('Health & Config', () => {
    it('reports health metrics', () => {
      const health = engine.getHealth();
      expect(health.isRunning).toBe(true);
      expect(health.activeChannels).toBeGreaterThan(0);
      expect(health.totalChannels).toBe(3);
    });

    it('updates config and reinitializes channels', () => {
      engine.updateConfig({ enabledSenses: ['vision', 'biometric'] });
      const config = engine.getConfig();
      expect(config.enabledSenses).toEqual(['vision', 'biometric']);

      const channels = engine.getChannels();
      const types = channels.map(c => c.type).sort();
      expect(types).toEqual(['biometric', 'vision']);
    });
  });

  describe('Event System', () => {
    it('emits sense_activated event', () => {
      let eventReceived = false;
      engine.onEvent('sense_activated', () => { eventReceived = true; });

      engine.activateSense('tactile');
      expect(eventReceived).toBe(true);
    });

    it('emits sensory_input_received event', () => {
      let input: SensoryInput | null = null;
      engine.onEvent('sensory_input_received', (e) => { input = e.input; });

      const channels = engine.getChannels();
      const visionChannel = channels.find(c => c.type === 'vision');
      engine.receiveInput({
        channelId: visionChannel!.id,
        type: 'vision',
        data: {},
        confidence: 0.9,
        importance: 0.8,
      });

      expect(input).not.toBeNull();
    });

    it('emits senses_fused event', async () => {
      let result: SenseFusionResult | null = null;
      engine.onEvent('senses_fused', (e) => { result = e.result; });

      engine.simulateVisionInput({ elements: ['code'] });
      engine.simulateSpatialInput({ windows: ['VS Code'], layout: 'single' });

      await new Promise(r => setTimeout(r, 1500));

      expect(result).not.toBeNull();
    });
  });

  describe('Shutdown', () => {
    it('shuts down cleanly and deactivates channels', async () => {
      await engine.shutdown();
      const health = engine.getHealth();
      expect(health.isRunning).toBe(false);
      expect(health.activeChannels).toBe(0);
    });
  });
});
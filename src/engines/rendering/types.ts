// src/engines/rendering/types.ts
// Types for Engine: Rendering — Frame rendering, framebuffer management, and visual output

export interface RenderingConfigInterface {
  framesPerSecond: number;
  framebufferWidth: number;
  framebufferHeight: number;
  maxFramesInFlight: number;
  hcuBudgetPerHour: number;
  enableVSync: boolean;
}

export type RenderingConfig = RenderingConfigInterface;

export interface FrameInterface {
  id: string;
  timestamp: string;
  width: number;
  height: number;
  data: ArrayBuffer | string | null;
  renderDurationMs: number;
}

export type Frame = FrameInterface;

export interface RenderingHealthInterface {
  isRunning: boolean;
  totalHCUSpent: number;
  hcuBudgetPerHour: number;
}

export type RenderingHealth = RenderingHealthInterface;

export interface RenderingEventInterface {
  type: 'frame_created' | 'frame_rendered' | 'frame_dropped' | 'engine_initialized' | 'engine_shutdown';
  frame?: Frame;
  error?: string;
}

export type RenderingEvent = RenderingEventInterface;
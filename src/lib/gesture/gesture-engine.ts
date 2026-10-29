'use client';

import {
  FilesetResolver,
  HandLandmarker,
  type HandLandmarkerResult,
  type NormalizedLandmark,
} from '@mediapipe/tasks-vision';
import {
  evaluateFrame,
  extractTopology,
} from '@/lib/gesture/landmarks';
import { gestureLog } from '@/lib/terminal/logger';
import type {
  GestureSnapshot,
  HandLandmarkTopology,
  Handedness,
} from '@/lib/terminal/types';

/**
 * High-fidelity MediaPipe Gesture Engine.
 *
 * The camera stream's raw frames are routed straight into the HandLandmarker
 * graph at a locked processing interval (`processorIntervalMs`, default 60ms).
 * Landmarks are normalized [0,1] x/y with signed relative z; the geometric
 * extractor in landmarks.ts converts them into wrist-distances and gesture ids.
 *
 * Trigger cooldowns (activation frames + quiet periods) are applied here so the
 * "clear" and "exit" actions fire deterministically instead of every frame.
 */

export interface GestureEngineConfig {
  /** Base path for the MediaPipe WASM files. */
  wasmPath: string;
  /** Path or URL of the hand_landmarker.task model. */
  modelPath: string;
  numHands?: number;
  minHandDetectionConfidence?: number;
  minHandPresenceConfidence?: number;
  minTrackingConfidence?: number;
  /** Locked processing interval between frames, in ms. */
  processorIntervalMs?: number;
  /** Consecutive frames at threshold before clear/exit actually fires. */
  palmActivationFrames?: number;
  fistActivationFrames?: number;
  /** Quiet period after an action before it can fire again, in ms. */
  actionCooldownMs?: number;
}

export interface GestureActionExecutor {
  onOpenPalm(snapshot: GestureSnapshot): void;
  onClosedFist(snapshot: GestureSnapshot): void;
  onScroll(snapshot: GestureSnapshot): void;
  onSnapshot(snapshot: GestureSnapshot): void;
  onNoHand(timestampMs: number): void;
}

export type EngineStatus = 'idle' | 'loading' | 'running' | 'error';

const DEFAULT_WASM_PATH = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm';
const MODEL_PATH = '/models/hand_landmarker.task';

export function resolveDefaultConfig(): Pick<
  GestureEngineConfig,
  'wasmPath' | 'modelPath'
> {
  return {
    wasmPath:
      process.env.NEXT_PUBLIC_MEDIAPIPE_WASM_PATH ?? DEFAULT_WASM_PATH,
    modelPath: process.env.NEXT_PUBLIC_MEDIAPIPE_MODEL_PATH ?? MODEL_PATH,
  };
}

const DEFAULTS: Required<
  Pick<
    GestureEngineConfig,
    'numHands' | 'minHandDetectionConfidence' | 'minHandPresenceConfidence' | 'minTrackingConfidence' | 'processorIntervalMs' | 'palmActivationFrames' | 'fistActivationFrames' | 'actionCooldownMs'
  >
> = {
  numHands: 1,
  minHandDetectionConfidence: 0.5,
  minHandPresenceConfidence: 0.5,
  minTrackingConfidence: 0.5,
  processorIntervalMs: 60,
  palmActivationFrames: 2,
  fistActivationFrames: 3,
  actionCooldownMs: 1200,
};

export class GestureEngine {
  private config: GestureEngineConfig;
  private landmarker: HandLandmarker | null = null;
  private loopTimer: ReturnType<typeof setInterval> | null = null;
  private videoSource: HTMLVideoElement | null = null;
  private executor: GestureActionExecutor | null = null;

  private lastVideoTime = -1;
  private lastTimestampMs = -1;
  private previousIndexY: number | null = null;
  private palmStreak = 0;
  private fistStreak = 0;
  private lastActionAt: { clear: number; exit: number } = { clear: 0, exit: 0 };
  private viewportHeightPx = 0;

  status: EngineStatus = 'idle';
  error: string | null = null;

  constructor(config?: Partial<GestureEngineConfig>) {
    const resolved = resolveDefaultConfig();
    this.config = {
      wasmPath: config?.wasmPath ?? resolved.wasmPath,
      modelPath: config?.modelPath ?? resolved.modelPath,
      numHands: config?.numHands ?? DEFAULTS.numHands,
      minHandDetectionConfidence:
        config?.minHandDetectionConfidence ?? DEFAULTS.minHandDetectionConfidence,
      minHandPresenceConfidence:
        config?.minHandPresenceConfidence ?? DEFAULTS.minHandPresenceConfidence,
      minTrackingConfidence:
        config?.minTrackingConfidence ?? DEFAULTS.minTrackingConfidence,
      processorIntervalMs:
        config?.processorIntervalMs ?? DEFAULTS.processorIntervalMs,
      palmActivationFrames:
        config?.palmActivationFrames ?? DEFAULTS.palmActivationFrames,
      fistActivationFrames:
        config?.fistActivationFrames ?? DEFAULTS.fistActivationFrames,
      actionCooldownMs: config?.actionCooldownMs ?? DEFAULTS.actionCooldownMs,
    };
    gestureLog.info('GestureEngine constructed', {
      wasmPath: this.config.wasmPath,
      modelPath: this.config.modelPath,
      intervalMs: this.config.processorIntervalMs,
    });
  }

  get isLoaded(): boolean {
    return this.landmarker !== null;
  }

  get isRunning(): boolean {
    return this.loopTimer !== null && this.status === 'running';
  }

  setViewportHeight(px: number): void {
    this.viewportHeightPx = Number.isFinite(px) && px > 0 ? px : 0;
  }

  async load(): Promise<void> {
    if (this.landmarker) {
      gestureLog.info('GestureEngine already loaded');
      return;
    }
    this.status = 'loading';
    this.error = null;
    gestureLog.info('Loading MediaPipe WASM fileset', this.config.wasmPath);

    try {
      const wasmFileset = await FilesetResolver.forVisionTasks(this.config.wasmPath);
      gestureLog.info('WASM fileset resolved; compiling HandLandmarker');

      let landmarker: HandLandmarker | null = null;
      try {
        landmarker = await this.createLandmarker(wasmFileset, 'GPU');
      } catch (gpuError) {
        gestureLog.warn('GPU delegate failed; falling back to CPU', gpuError);
        landmarker = await this.createLandmarker(wasmFileset, 'CPU');
      }

      this.landmarker = landmarker;
      this.status = 'idle';
      gestureLog.info('HandLandmarker ready', { numHands: this.config.numHands });
    } catch (error) {
      this.status = 'error';
      this.error = error instanceof Error ? error.message : String(error);
      gestureLog.error('GestureEngine load failed', this.error);
      throw error;
    }
  }

  private async createLandmarker(
    wasmFileset: Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>,
    delegate: 'CPU' | 'GPU'
  ): Promise<HandLandmarker> {
    return HandLandmarker.createFromOptions(wasmFileset, {
      baseOptions: {
        modelAssetPath: this.config.modelPath,
        delegate,
      },
      runningMode: 'VIDEO',
      numHands: this.config.numHands,
      minHandDetectionConfidence: this.config.minHandDetectionConfidence,
      minHandPresenceConfidence: this.config.minHandPresenceConfidence,
      minTrackingConfidence: this.config.minTrackingConfidence,
    });
  }

  start(videoSource: HTMLVideoElement, executor: GestureActionExecutor): void {
    if (this.loopTimer) {
      gestureLog.warn('Engine already running; restarting with new source');
      this.stop();
    }
    this.videoSource = videoSource;
    this.executor = executor;
    this.lastVideoTime = -1;
    this.lastTimestampMs = -1;
    this.previousIndexY = null;
    this.palmStreak = 0;
    this.fistStreak = 0;
    this.status = 'running';
    this.error = null;

    gestureLog.info('GestureEngine loop starting', {
      intervalMs: this.config.processorIntervalMs,
    });
    this.loopTimer = setInterval(() => {
      void this.tick().catch((error) => {
        gestureLog.error('Gesture tick threw', error);
      });
    }, this.config.processorIntervalMs);
  }

  async tick(): Promise<void> {
    const video = this.videoSource;
    if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      return;
    }
    if (video.paused || video.ended) {
      return;
    }
    if (this.lastVideoTime === video.currentTime) {
      return;
    }
    if (!this.landmarker) {
      await this.load();
    }
    if (!this.landmarker) {
      return;
    }

    this.lastVideoTime = video.currentTime;
    const timestampMs = this.nextMonotonicTimestamp();

    let result: HandLandmarkerResult;
    try {
      result = this.landmarker.detectForVideo(video, timestampMs);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      gestureLog.error('detectForVideo failed', message);
      this.palmStreak = 0;
      this.fistStreak = 0;
      return;
    }

    const landmarks = result.landmarks?.[0] as readonly NormalizedLandmark[] | undefined;
    if (!landmarks || landmarks.length < 21) {
      this.previousIndexY = null;
      this.palmStreak = 0;
      this.fistStreak = 0;
      this.executor?.onNoHand(timestampMs);
      return;
    }

    const topology = extractTopology(landmarks);
    if (!topology) {
      this.executor?.onNoHand(timestampMs);
      return;
    }

    const snapshot = this.classify(topology, timestampMs, result);
    this.applyActionResolutions(snapshot);
  }

  private classify(
    topology: HandLandmarkTopology,
    timestampMs: number,
    result: HandLandmarkerResult
  ): GestureSnapshot {
    const handedness = result.handedness?.[0] as
      | { categoryName?: string; score?: number }
      | undefined;
    const handednessLabel: Handedness =
      handedness?.categoryName === 'Left'
        ? 'Left'
        : handedness?.categoryName === 'Right'
          ? 'Right'
          : 'Unknown';

    const snapshot = evaluateFrame(
      topology,
      this.previousIndexY,
      this.viewportHeightPx,
      handednessLabel,
      handedness?.score ?? 0,
      timestampMs,
      null
    );
    this.previousIndexY = topology.indexTip.y;
    return snapshot;
  }

  private applyActionResolutions(snapshot: GestureSnapshot): void {
    if (!this.executor) return;

    const now = snapshot.timestampMs;
    const cooldown = this.config.actionCooldownMs ?? DEFAULTS.actionCooldownMs;

    try {
      if (snapshot.gesture === 'open_palm') {
        this.fistStreak = 0;
        this.palmStreak += 1;
        if (
          this.palmStreak >= (this.config.palmActivationFrames ?? DEFAULTS.palmActivationFrames) &&
          now - this.lastActionAt.clear > cooldown
        ) {
          this.lastActionAt.clear = now;
          gestureLog.info('Action triggered: clear screen (open palm)', snapshot.distances);
          this.executor.onOpenPalm(snapshot);
        }
      } else if (snapshot.gesture === 'closed_fist') {
        this.palmStreak = 0;
        this.fistStreak += 1;
        if (
          this.fistStreak >= (this.config.fistActivationFrames ?? DEFAULTS.fistActivationFrames) &&
          now - this.lastActionAt.exit > cooldown
        ) {
          this.lastActionAt.exit = now;
          gestureLog.warn('Action triggered: terminate app (closed fist)', snapshot.distances);
          this.executor.onClosedFist(snapshot);
        }
      } else if (snapshot.gesture === 'index_point') {
        this.palmStreak = 0;
        this.fistStreak = 0;
        if (snapshot.scrollDeltaPx !== 0) {
          this.executor.onScroll(snapshot);
        }
      } else {
        this.palmStreak = 0;
        this.fistStreak = 0;
      }

      this.executor.onSnapshot(snapshot);
    } catch (error) {
      gestureLog.error('Gesture action resolution failed', error);
    }
  }

  private nextMonotonicTimestamp(): number {
    const now = Date.now();
    this.lastTimestampMs = Math.max(now, this.lastTimestampMs + 1);
    return this.lastTimestampMs;
  }

  stop(): void {
    if (this.loopTimer) {
      clearInterval(this.loopTimer);
      this.loopTimer = null;
    }
    this.videoSource = null;
    this.executor = null;
    this.previousIndexY = null;
    this.palmStreak = 0;
    this.fistStreak = 0;
    if (this.status === 'running') {
      this.status = 'idle';
    }
    gestureLog.info('GestureEngine loop stopped');
  }

  dispose(): void {
    this.stop();
    try {
      this.landmarker?.close();
    } catch (error) {
      gestureLog.warn('HandLandmarker close threw', error);
    }
    this.landmarker = null;
    gestureLog.info('GestureEngine disposed');
  }
}
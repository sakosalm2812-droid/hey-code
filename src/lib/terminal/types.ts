/**
 * Shared type contracts for the "hey" terminal command pipeline.
 *
 * These types are consumed by both the browser-side command router (src/lib/terminal)
 * and the server-side launch route (src/app/api/terminal/launch) so that a single
 * source of truth drives every platform strategy.
 */

/** Runtime targets the command router can attempt to launch into. */
export type TargetPlatform = 'win32' | 'darwin' | 'linux' | 'android' | 'ios' | 'unknown';

/** Verb classes the router's state machine can emit. */
export type CommandKind = 'launch' | 'clear' | 'exit' | 'help' | 'gesture' | 'noop' | 'unknown';

/** Gesture classification labels produced by the geometric extractor. */
export type GestureId = 'open_palm' | 'closed_fist' | 'index_point' | 'neutral';

/** MediaPipe handedness label for the detected hand. */
export type Handedness = 'Left' | 'Right' | 'Unknown';

/** The three Cartesian components MediaPipe returns per landmark, normalized to [0,1]. */
export interface Landmark3D {
  x: number;
  y: number;
  z: number;
}

/** The six landmarks that drive every gesture in the extractor (MediaPipe indexes). */
export interface HandLandmarkTopology {
  wrist: Landmark3D; // 0
  thumbTip: Landmark3D; // 4
  indexTip: Landmark3D; // 8
  middleTip: Landmark3D; // 12
  ringTip: Landmark3D; // 16
  pinkyTip: Landmark3D; // 20
}

/** A fully classified frame emitted by the gesture engine. */
export interface GestureSnapshot {
  gesture: GestureId;
  timestampMs: number;
  handedness: Handedness;
  /** Handedness score from MediaPipe, 0..1. */
  handednessScore: number;
  /** Per-fingertip Euclidean distance to the wrist, in normalized units. */
  distances: {
    thumb: number;
    index: number;
    middle: number;
    ring: number;
    pinky: number;
  };
  /** Index-tip y-delta vs the previous classified frame, in normalized units. */
  indexDeltaY: number;
  /** Signed pixel delta this frame should push into the scroll controller. */
  scrollDeltaPx: number;
  /** Detected hand bounding box in normalized coordinates, when present. */
  boundingBox: { xMin: number; yMin: number; width: number; height: number } | null;
}

/** A single entry in the virtual terminal's output buffer. */
export interface TerminalOutput {
  id: string;
  ts: number;
  level: 'info' | 'warn' | 'error' | 'success' | 'input' | 'system';
  source: 'router' | 'strategy' | 'gesture' | 'store' | 'system';
  text: string;
}

/** A POSIX-style sub-process launch descriptor, safe to hand to execFile. */
export interface LaunchSpec {
  command: string;
  args: string[];
}

/** Per-platform target for one friendly app name. */
export interface AppTarget {
  friendly: string;
  /**
   * Windows launcher token passed to the native shell path launcher
   * (<ComSpec> /c start "" <token>), e.g. "calc.exe" or "ms-settings:".
   */
  windows: string;
  /** macOS application name passed to `open -a <name>`, e.g. "Calculator". */
  macos: string;
  /** Linux executable name resolved from PATH, e.g. "gnome-calculator". */
  linux: string;
  /** Android package name, e.g. "com.android.calculator2". Empty when unsupported. */
  android: string;
  /** iOS URL scheme, e.g. "calculator://". Empty when unsupported. */
  ios: string;
}

/** Outcome of a routing attempt, logged back into the terminal store. */
export interface DispatchResult {
  handled: boolean;
  kind: CommandKind;
  source: string;
  route: TargetPlatform | null;
  detail: string;
  error: string | null;
  startedAt: number;
  finishedAt: number;
}
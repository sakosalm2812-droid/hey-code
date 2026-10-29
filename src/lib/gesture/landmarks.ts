import type {
  GestureId,
  GestureSnapshot,
  HandLandmarkTopology,
} from '@/lib/terminal/types';

/**
 * Geometric gesture extraction over the 21 MediaPipe hand landmarks.
 *
 * Distances use the Euclidean metric between the Wrist (landmark 0) and each
 * fingertip (thumb 4, index 8, middle 12, ring 16, pinky 20):
 *
 *   d = sqrt((x2-x1)^2 + (y2-y1)^2 + (z2-z1)^2)
 *
 * NOTE: the spec sketch wrote "(z2-z1)^3". That is not a metric (a negative
 * z-delta would cube to a negative value and break the square root), and MediaPipe
 * z deltas can be negative. We keep the second power so the published thresholds
 * (0.45 / 0.15 / 0.40 normalized units) behave exactly as specified.
 */

export const OPEN_PALM_MIN_DISTANCE = 0.45;
export const CLOSED_FIST_MAX_DISTANCE = 0.15;
export const INDEX_POINT_MIN_DISTANCE = 0.40;
export const CURLED_MAX_DISTANCE = 0.15;

export const MEDIAPIPE_LANDMARK_INDEX = {
  WRIST: 0,
  THUMB_TIP: 4,
  INDEX_TIP: 8,
  MIDDLE_TIP: 12,
  RING_TIP: 16,
  PINKY_TIP: 20,
} as const;

/** Pixel gain applied to the normalized index-tip y-delta when mapping to scroll. */
export const SCROLL_GAIN = 1.5;

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export function euclideanDistance(a: Point3D, b: Point3D): number {
  if (!Number.isFinite(a.x) || !Number.isFinite(a.y) || !Number.isFinite(a.z)
    || !Number.isFinite(b.x) || !Number.isFinite(b.y) || !Number.isFinite(b.z)) {
    return Number.POSITIVE_INFINITY;
  }
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/** Distances between the wrist and each fingertip, in normalized units. */
export function distancesFromWrist(topology: HandLandmarkTopology): GestureSnapshot['distances'] {
  return {
    thumb: euclideanDistance(topology.wrist, topology.thumbTip),
    index: euclideanDistance(topology.wrist, topology.indexTip),
    middle: euclideanDistance(topology.wrist, topology.middleTip),
    ring: euclideanDistance(topology.wrist, topology.ringTip),
    pinky: euclideanDistance(topology.wrist, topology.pinkyTip),
  };
}

/** Extracts the six structural landmarks from a 21-element MediaPipe array. */
export function extractTopology(landmarks: readonly Point3D[]): HandLandmarkTopology | null {
  if (!landmarks || landmarks.length < 21) {
    return null;
  }
  const at = (index: number): Point3D => ({
    x: landmarks[index]?.x ?? 0,
    y: landmarks[index]?.y ?? 0,
    z: landmarks[index]?.z ?? 0,
  });
  return {
    wrist: at(MEDIAPIPE_LANDMARK_INDEX.WRIST),
    thumbTip: at(MEDIAPIPE_LANDMARK_INDEX.THUMB_TIP),
    indexTip: at(MEDIAPIPE_LANDMARK_INDEX.INDEX_TIP),
    middleTip: at(MEDIAPIPE_LANDMARK_INDEX.MIDDLE_TIP),
    ringTip: at(MEDIAPIPE_LANDMARK_INDEX.RING_TIP),
    pinkyTip: at(MEDIAPIPE_LANDMARK_INDEX.PINKY_TIP),
  };
}

export function classifyGesture(distances: GestureSnapshot['distances']): GestureId {
  // Open palm: all four fingers (8, 12, 16, 20) past the 0.45 simultaneous threshold.
  if (
    distances.index > OPEN_PALM_MIN_DISTANCE &&
    distances.middle > OPEN_PALM_MIN_DISTANCE &&
    distances.ring > OPEN_PALM_MIN_DISTANCE &&
    distances.pinky > OPEN_PALM_MIN_DISTANCE
  ) {
    return 'open_palm';
  }

  const allFourCurled =
    distances.index < CURLED_MAX_DISTANCE &&
    distances.middle < CURLED_MAX_DISTANCE &&
    distances.ring < CURLED_MAX_DISTANCE &&
    distances.pinky < CURLED_MAX_DISTANCE;
  if (allFourCurled && distances.index < CLOSED_FIST_MAX_DISTANCE && distances.thumb < CLOSED_FIST_MAX_DISTANCE * 2) {
    return 'closed_fist';
  }

  const indexOnlyExtended =
    distances.index > INDEX_POINT_MIN_DISTANCE &&
    distances.middle < CURLED_MAX_DISTANCE &&
    distances.ring < CURLED_MAX_DISTANCE &&
    distances.pinky < CURLED_MAX_DISTANCE;
  if (indexOnlyExtended) {
    return 'index_point';
  }

  return 'neutral';
}

/**
 * Builds the classified frame. `previousIndexY` is the normalized y of landmark 8
 * from the previous classified frame (null when no prior frame). Scroll delta is
 * positive when the fingertip moves up, lowering the scroll offset.
 */
export function evaluateFrame(
  topology: HandLandmarkTopology,
  previousIndexY: number | null,
  scrollViewportHeightPx: number,
  handedness: GestureSnapshot['handedness'],
  handednessScore: number,
  timestampMs: number,
  boundingBox: GestureSnapshot['boundingBox'] | null
): GestureSnapshot {
  const distances = distancesFromWrist(topology);
  const gesture = classifyGesture(distances);

  const indexDeltaY =
    previousIndexY === null ? 0 : topology.indexTip.y - previousIndexY;
  const scrollDeltaPx =
    gesture === 'index_point' && indexDeltaY !== 0
      ? clamp(-indexDeltaY * scrollViewportHeightPx * SCROLL_GAIN, -800, 800)
      : 0;

  return {
    gesture,
    timestampMs,
    handedness,
    handednessScore,
    distances,
    indexDeltaY,
    scrollDeltaPx,
    boundingBox,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
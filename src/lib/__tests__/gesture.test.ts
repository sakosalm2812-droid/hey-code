import { describe, it, expect } from 'vitest';
import {
  euclideanDistance,
  distancesFromWrist,
  extractTopology,
  classifyGesture,
  evaluateFrame,
  OPEN_PALM_MIN_DISTANCE,
  CLOSED_FIST_MAX_DISTANCE,
  INDEX_POINT_MIN_DISTANCE,
  SCROLL_GAIN,
} from '@/lib/gesture/landmarks';
import type { HandLandmarkTopology } from '@/lib/terminal/types';
import type { Point3D } from '@/lib/gesture/landmarks';

function topology(
  indexY: number,
  middleY: number,
  ringY: number,
  pinkyY: number,
  thumbY = 0
): HandLandmarkTopology {
  return {
    wrist: { x: 0, y: 0, z: 0 },
    thumbTip: { x: 0, y: thumbY, z: 0 },
    indexTip: { x: 0, y: indexY, z: 0 },
    middleTip: { x: 0, y: middleY, z: 0 },
    ringTip: { x: 0.02, y: ringY, z: 0 },
    pinkyTip: { x: 0.03, y: pinkyY, z: 0 },
  };
}

describe('gesture landmark math', () => {
  describe('euclideanDistance', () => {
    it('computes the 3D Euclidean distance', () => {
      const a: Point3D = { x: 0, y: 0, z: 0 };
      const b: Point3D = { x: 3, y: 4, z: 0 };
      expect(euclideanDistance(a, b)).toBeCloseTo(5);
    });

    it('returns positive infinity for non-finite coordinates', () => {
      expect(euclideanDistance({ x: 1, y: 2, z: Number.NaN }, { x: 0, y: 0, z: 0 })).toBe(
        Number.POSITIVE_INFINITY
      );
    });
  });

  describe('distancesFromWrist', () => {
    it('returns all five fingertip distances', () => {
      const t = topology(0.5, 0.55, 0.5, 0.5);
      const distances = distancesFromWrist(t);
      expect(Object.keys(distances)).toEqual([
        'thumb',
        'index',
        'middle',
        'ring',
        'pinky',
      ]);
      expect(distances.index).toBeCloseTo(0.5);
      expect(distances.middle).toBeCloseTo(0.55);
      expect(distances.ring).toBeGreaterThan(0.4);
      expect(distances.pinky).toBeGreaterThan(0.4);
    });
  });

  describe('extractTopology', () => {
    it('returns the six structural landmarks from a 21-point array', () => {
      const landmarks = Array.from({ length: 21 }, (_, i) => ({
        x: i / 20,
        y: 1 - i / 20,
        z: 0.1,
      }));
      const t = extractTopology(landmarks);
      expect(t).not.toBeNull();
      expect(t!.wrist.x).toBeCloseTo(0 / 20);
      expect(t!.thumbTip.x).toBeCloseTo(4 / 20);
      expect(t!.indexTip.x).toBeCloseTo(8 / 20);
      expect(t!.middleTip.x).toBeCloseTo(12 / 20);
      expect(t!.ringTip.x).toBeCloseTo(16 / 20);
      expect(t!.pinkyTip.x).toBeCloseTo(20 / 20);
    });

    it('returns null for arrays shorter than 21 landmarks', () => {
      expect(extractTopology(Array.from({ length: 5 }, () => ({ x: 0, y: 0, z: 0 })))).toBeNull();
    });
  });

  describe('classifyGesture', () => {
    it('classifies an open palm when all four fingers exceed 0.45', () => {
      const distances = distancesFromWrist(topology(0.55, 0.55, 0.52, 0.52));
      expect(distances.index).toBeGreaterThan(OPEN_PALM_MIN_DISTANCE);
      expect(classifyGesture(distances)).toBe('open_palm');
    });

    it('classifies a closed fist when all four fingers drop below 0.15', () => {
      const distances = distancesFromWrist(topology(0.12, 0.13, 0.12, 0.1));
      expect(distances.middle).toBeLessThan(CLOSED_FIST_MAX_DISTANCE);
      expect(classifyGesture(distances)).toBe('closed_fist');
    });

    it('classifies an index point when only the index exceeds 0.40', () => {
      const distances = distancesFromWrist(topology(0.5, 0.12, 0.12, 0.1));
      expect(distances.index).toBeGreaterThan(INDEX_POINT_MIN_DISTANCE);
      expect(classifyGesture(distances)).toBe('index_point');
    });

    it('returns neutral for ambiguous extension', () => {
      const distances = distancesFromWrist(topology(0.3, 0.12, 0.12, 0.1));
      expect(classifyGesture(distances)).toBe('neutral');
    });
  });

  describe('evaluateFrame', () => {
    it('maps index-tip y deltas to signed scroll pixels', () => {
      const snapshot = evaluateFrame(
        topology(0.5, 0.12, 0.12, 0.1),
        0.55,
        800,
        'Right',
        0.98,
        1000,
        null
      );
      expect(snapshot.gesture).toBe('index_point');
      const expected = -((0.5 - 0.55) * 800 * SCROLL_GAIN);
      expect(snapshot.indexDeltaY).toBeCloseTo(-0.05);
      expect(snapshot.scrollDeltaPx).toBeCloseTo(expected);
    });

    it('emits no scroll when not pointing', () => {
      const open = evaluateFrame(topology(0.55, 0.55, 0.52, 0.52), 0.55, 800, 'Left', 0.9, 1000, null);
      expect(open.gesture).toBe('open_palm');
      expect(open.scrollDeltaPx).toBe(0);
    });

    it('clamps scroll deltas', () => {
      const snapshot = evaluateFrame(
        topology(0.41, 0.12, 0.12, 0.1),
        0.9,
        2000,
        'Right',
        0.99,
        1000,
        null
      );
      // Unclamped: -(-0.49) * 2000 * 1.5 = 1470 -> clamped to 800.
      expect(snapshot.scrollDeltaPx).toBe(800);
    });
  });
});
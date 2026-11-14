// src/engines/autonomous/MotorCortex.ts
// Motor Cortex — Human-like mouse/keyboard simulation with Bézier curves.
// Generates natural movement trajectories, click delays, typing patterns.

import type { MotorCortexConfig, Platform } from './types';

const DEFAULT_CONFIG: MotorCortexConfig = {
  bezierControlPoints: 3,
  moveDurationRange: [300, 800], // ms
  clickDelayRange: [50, 150], // ms
  typeDelayRange: [80, 180], // ms per char
  scrollSmoothness: 0.8,
  humanLikeJitter: true,
};

export class MotorCortex {
  private config: MotorCortexConfig;

  constructor(config: Partial<MotorCortexConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate a Bézier curve path from start to end with natural control points.
   * Returns array of {x, y, t} points where t is normalized time [0,1].
   */
  generatePath(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    steps: number = 20
  ): Array<{ x: number; y: number; t: number }> {
    const controlPoints = this.generateControlPoints(startX, startY, endX, endY);
    const path: Array<{ x: number; y: number; t: number }> = [];

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const point = this.bezier(controlPoints, t);
      // Add micro-jitter for human-like movement (but not on first/last points)
      const jitter = this.config.humanLikeJitter && i > 0 && i < steps
        ? { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2 }
        : { x: 0, y: 0 };
      path.push({
        x: point.x + jitter.x,
        y: point.y + jitter.y,
        t,
      });
    }

    return path;
  }

  private generateControlPoints(
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): Array<{ x: number; y: number }> {
    const points = [{ x: x1, y: y1 }];

    // Generate intermediate control points with natural curvature
    for (let i = 1; i <= this.config.bezierControlPoints; i++) {
      const t = i / (this.config.bezierControlPoints + 1);
      const baseX = x1 + (x2 - x1) * t;
      const baseY = y1 + (y2 - y1) * t;

      // Add perpendicular offset for curve
      const dx = x2 - x1;
      const dy = y2 - y1;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const perpX = dist > 0 ? -dy / dist : 0;
      const perpY = dist > 0 ? dx / dist : 0;

      // Natural curve amplitude scales with distance
      const amplitude = Math.min(dist * 0.15, 50) * (Math.random() - 0.5) * 2;

      points.push({
        x: baseX + perpX * amplitude,
        y: baseY + perpY * amplitude,
      });
    }

    points.push({ x: x2, y: y2 });
    return points;
  }

  private bezier(
    points: Array<{ x: number; y: number }>,
    t: number
  ): { x: number; y: number } {
    // De Casteljau's algorithm
    let pts = points.map((p) => ({ x: p.x, y: p.y }));

    while (pts.length > 1) {
      const next: Array<{ x: number; y: number }> = [];
      for (let i = 0; i < pts.length - 1; i++) {
        next.push({
          x: pts[i].x + (pts[i + 1].x - pts[i].x) * t,
          y: pts[i].y + (pts[i + 1].y - pts[i].y) * t,
        });
      }
      pts = next;
    }

    return pts[0];
  }

  /**
   * Calculate human-like duration for a move based on distance (Fitts's Law approximation).
   */
  calculateMoveDuration(distance: number): number {
    const [min, max] = this.config.moveDurationRange;
    // Fitts's Law: MT = a + b * log2(D/W + 1)
    // Simplified: base time + distance factor
    const baseTime = min;
    const distanceFactor = Math.log2(distance / 10 + 1) * 50;
    const duration = baseTime + distanceFactor + Math.random() * 100;
    return Math.min(Math.max(duration, min), max);
  }

  /**
   * Generate click delay with pre/post click pauses.
   */
  generateClickDelays(): { preClick: number; postClick: number } {
    const [min, max] = this.config.clickDelayRange;
    const baseDelay = min + Math.random() * (max - min);
    return {
      preClick: baseDelay * 0.6,
      postClick: baseDelay * 0.4,
    };
  }

  /**
   * Generate typing delays for a string with natural variation.
   */
  generateTypingDelays(text: string): number[] {
    const [min, max] = this.config.typeDelayRange;
    const delays: number[] = [];

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      let baseDelay = min + Math.random() * (max - min);

      // Adjust for character type
      if (char === ' ') baseDelay *= 1.5;
      else if (char === '\n') baseDelay *= 2;
      else if ('.!?'.includes(char)) baseDelay *= 1.3;
      else if (',;:'.includes(char)) baseDelay *= 1.1;

      // Add burst/pause patterns
      if (i > 0 && Math.random() < 0.05) baseDelay *= 3; // occasional pause
      if (i > 2 && Math.random() < 0.02) baseDelay *= 5; // longer pause

      delays.push(baseDelay);
    }

    return delays;
  }

  /**
   * Generate smooth scroll trajectory.
   */
  generateScrollPath(
    startX: number,
    startY: number,
    deltaX: number,
    deltaY: number,
    steps: number = 15
  ): Array<{ x: number; y: number; t: number }> {
    const endX = startX + deltaX;
    const endY = startY + deltaY;
    const path = this.generatePath(startX, startY, endX, endY, steps);

    // Apply easing for smooth scroll
    return path.map((p) => ({
      ...p,
      t: this.easeInOutCubic(p.t),
    }));
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  getConfig(): MotorCortexConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<MotorCortexConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

export function createMotorCortex(config?: Partial<MotorCortexConfig>): MotorCortex {
  return new MotorCortex(config);
}

export default MotorCortex;
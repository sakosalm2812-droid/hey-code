/**
 * HEY Orb Placement — Pure Docking Logic, Edge Snapping, Collision Avoidance
 *
 * Handles orb positioning: docking to edges, snapping, collision avoidance,
 * and per-screen-size persistence.
 * Pure by construction: no I/O, no DOM, no platform code.
 */

export const ORB_DOCK_EDGES = Object.freeze([
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
  'left',
  'right',
]);

export const ORB_SIZE = Object.freeze({
  width: 40,
  height: 40,
  expandedWidth: 240,
  expandedHeight: 240,
});

export const ORB_SNAP_THRESHOLD = 16; // pixels
export const ORB_EDGE_MARGIN = 8; // pixels from screen edge
export const ORB_TASKBAR_HEIGHT = 48; // estimated taskbar/dock height

/**
 * Calculates docked position for an edge.
 * @param {string} edge - One of ORB_DOCK_EDGES
 * @param {Object} viewport - { width, height }
 * @param {Object} [obstacles] - { taskbar?: { edge, height }, dock?: { edge, size } }
 * @returns {Object} { x, y }
 */
export function calculateDockedPosition(edge, viewport, obstacles = {}) {
  const { width, height } = viewport;
  const orbSize = ORB_SIZE.width;
  const margin = ORB_EDGE_MARGIN;
  const taskbarHeight = obstacles.taskbar?.height || ORB_TASKBAR_HEIGHT;
  const dockSize = obstacles.dock?.size || 0;

  let x, y;

  switch (edge) {
    case 'top-left':
      x = margin;
      y = margin;
      break;
    case 'top-right':
      x = width - orbSize - margin;
      y = margin;
      break;
    case 'bottom-left':
      x = margin;
      y = height - orbSize - margin - taskbarHeight;
      break;
    case 'bottom-right':
      x = width - orbSize - margin - dockSize;
      y = height - orbSize - margin - taskbarHeight;
      break;
    case 'left':
      x = margin;
      y = (height - orbSize) / 2;
      break;
    case 'right':
      x = width - orbSize - margin - dockSize;
      y = (height - orbSize) / 2;
      break;
    default:
      // Default to bottom-right
      x = width - orbSize - margin - dockSize;
      y = height - orbSize - margin - taskbarHeight;
  }

  // Clamp to viewport
  x = Math.max(margin, Math.min(x, width - orbSize - margin));
  y = Math.max(margin, Math.min(y, height - orbSize - margin));

  return { x, y, edge };
}

/**
 * Snaps a free position to the nearest dock edge.
 * @param {Object} position - { x, y }
 * @param {Object} viewport - { width, height }
 * @param {Object} [obstacles]
 * @returns {Object} { x, y, edge, snapped: boolean }
 */
export function snapToEdge(position, viewport, obstacles = {}) {
  const { width, height } = viewport;
  const { x, y } = position;
  const orbSize = ORB_SIZE.width;
  const threshold = ORB_SNAP_THRESHOLD;

  // Calculate distance to each edge's docked position
  const edges = ORB_DOCK_EDGES.map(edge => {
    const docked = calculateDockedPosition(edge, viewport, obstacles);
    const dist = Math.hypot(x - docked.x, y - docked.y);
    return { edge, ...docked, distance: dist };
  });

  // Find nearest
  const nearest = edges.reduce((min, e) => e.distance < min.distance ? e : min, edges[0]);

  if (nearest.distance <= threshold) {
    return { x: nearest.x, y: nearest.y, edge: nearest.edge, snapped: true };
  }

  return { x, y, edge: null, snapped: false };
}

/**
 * Checks if a position collides with obstacles (taskbar, dock, modals).
 * @param {Object} position - { x, y }
 * @param {Object} viewport - { width, height }
 * @param {Object} obstacles - { taskbar?, dock?, modals?: Array<{x,y,width,height}> }
 * @returns {boolean}
 */
export function checkCollision(position, viewport, obstacles = {}) {
  const { x, y } = position;
  const orbSize = ORB_SIZE.width;
  const orbRect = { x, y, width: orbSize, height: orbSize };

  // Check taskbar
  if (obstacles.taskbar) {
    const tb = obstacles.taskbar;
    const taskbarRect = getTaskbarRect(tb, viewport);
    if (rectsIntersect(orbRect, taskbarRect)) return true;
  }

  // Check dock
  if (obstacles.dock) {
    const dk = obstacles.dock;
    const dockRect = getDockRect(dk, viewport);
    if (rectsIntersect(orbRect, dockRect)) return true;
  }

  // Check modals
  if (obstacles.modals && Array.isArray(obstacles.modals)) {
    for (const modal of obstacles.modals) {
      if (rectsIntersect(orbRect, modal)) return true;
    }
  }

  return false;
}

/**
 * Finds a non-colliding position near the target.
 * @param {Object} target - { x, y }
 * @param {Object} viewport - { width, height }
 * @param {Object} obstacles
 * @returns {Object} Safe position { x, y }
 */
export function findSafePosition(target, viewport, obstacles = {}) {
  if (!checkCollision(target, viewport, obstacles)) {
    return target;
  }

  // Try small offsets in 8 directions
  const offsets = [
    { dx: 0, dy: -1 },   // up
    { dx: 1, dy: -1 },   // up-right
    { dx: 1, dy: 0 },    // right
    { dx: 1, dy: 1 },    // down-right
    { dx: 0, dy: 1 },    // down
    { dx: -1, dy: 1 },   // down-left
    { dx: -1, dy: 0 },   // left
    { dx: -1, dy: -1 },  // up-left
  ];

  const step = 12;
  const maxSteps = 20;

  for (let stepCount = 1; stepCount <= maxSteps; stepCount++) {
    for (const { dx, dy } of offsets) {
      const candidate = {
        x: target.x + dx * step * stepCount,
        y: target.y + dy * step * stepCount,
      };
      // Clamp to viewport
      candidate.x = Math.max(ORB_EDGE_MARGIN, Math.min(candidate.x, viewport.width - ORB_SIZE.width - ORB_EDGE_MARGIN));
      candidate.y = Math.max(ORB_EDGE_MARGIN, Math.min(candidate.y, viewport.height - ORB_SIZE.height - ORB_EDGE_MARGIN));

      if (!checkCollision(candidate, viewport, obstacles)) {
        return candidate;
      }
    }
  }

  // Fallback: return default bottom-right
  return calculateDockedPosition('bottom-right', viewport, obstacles);
}

/**
 * Gets taskbar rectangle.
 */
function getTaskbarRect(taskbar, viewport) {
  const { width, height } = viewport;
  const tbHeight = taskbar.height || ORB_TASKBAR_HEIGHT;

  switch (taskbar.edge) {
    case 'bottom':
      return { x: 0, y: height - tbHeight, width, height: tbHeight };
    case 'top':
      return { x: 0, y: 0, width, height: tbHeight };
    case 'left':
      return { x: 0, y: 0, width: tbHeight, height };
    case 'right':
      return { x: width - tbHeight, y: 0, width: tbHeight, height };
    default:
      return { x: 0, y: height - tbHeight, width, height: tbHeight };
  }
}

/**
 * Gets dock rectangle.
 */
function getDockRect(dock, viewport) {
  const { width, height } = viewport;
  const dkSize = dock.size || 0;

  switch (dock.edge) {
    case 'bottom':
      return { x: 0, y: height - dkSize, width, height: dkSize };
    case 'left':
      return { x: 0, y: 0, width: dkSize, height };
    case 'right':
      return { x: width - dkSize, y: 0, width: dkSize, height };
    default:
      return { x: 0, y: height - dkSize, width, height: dkSize };
  }
}

/**
 * Checks if two rectangles intersect.
 */
function rectsIntersect(a, b) {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

/**
 * Persists orb position per screen size bucket.
 * @param {Object} position - { x, y, edge }
 * @param {Object} viewport - { width, height }
 * @returns {Object} Storage key and value
 */
export function createPositionRecord(position, viewport) {
  const sizeBucket = getSizeBucket(viewport.width, viewport.height);
  return {
    key: `orb_position_${sizeBucket}`,
    value: {
      x: position.x,
      y: position.y,
      edge: position.edge,
      viewport: { width: viewport.width, height: viewport.height },
      timestamp: Date.now(),
    },
  };
}

/**
 * Gets size bucket for viewport dimensions.
 * @param {number} width
 * @param {number} height
 * @returns {string}
 */
export function getSizeBucket(width, height) {
  // Bucket by common breakpoints
  if (width <= 480) return 'mobile';
  if (width <= 768) return 'tablet';
  if (width <= 1024) return 'laptop';
  if (width <= 1440) return 'desktop';
  if (width <= 1920) return 'desktop-large';
  return 'ultrawide';
}

/**
 * Loads persisted position for current viewport.
 * @param {Object} stored - All stored positions
 * @param {Object} viewport - Current viewport
 * @returns {Object|null} Position or null
 */
export function loadPersistedPosition(stored, viewport) {
  const bucket = getSizeBucket(viewport.width, viewport.height);
  const key = `orb_position_${bucket}`;
  return stored[key] || null;
}

/**
 * Validates that a position is within viewport bounds.
 * @param {Object} position
 * @param {Object} viewport
 * @returns {boolean}
 */
export function isValidPosition(position, viewport) {
  const { x, y } = position;
  const margin = ORB_EDGE_MARGIN;
  return (
    x >= margin &&
    y >= margin &&
    x <= viewport.width - ORB_SIZE.width - margin &&
    y <= viewport.height - ORB_SIZE.height - margin
  );
}

export default {
  ORB_DOCK_EDGES,
  ORB_SIZE,
  ORB_SNAP_THRESHOLD,
  ORB_EDGE_MARGIN,
  ORB_TASKBAR_HEIGHT,
  calculateDockedPosition,
  snapToEdge,
  checkCollision,
  findSafePosition,
  createPositionRecord,
  getSizeBucket,
  loadPersistedPosition,
  isValidPosition,
};
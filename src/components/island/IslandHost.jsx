/**
 * IslandHost — mounts the Dynamic Island once in the app shell.
 * Subscribes to the dynamicIslandEngine and renders IslandSurface.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { dynamicIslandEngine, subscribeToDynamicIsland, getDefaultDynamicIsland, getVisibleIslandActivities, ISLAND_STATES } from '../../core/dynamicIsland.js';
import { IslandSurface } from './IslandSurface.jsx';
import { createIslandUpdateCoalescer } from './islandCoalescer.js';

let hostInstanceCount = 0;

/**
 * IslandHost — the single mount point for the Dynamic Island in the app shell.
 * Ensures exactly one island instance exists.
 */
export function IslandHost() {
  const [island, setIsland] = useState(null);
  const [activities, setActivities] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const coalescerRef = useRef(null);
  const mountedRef = useRef(false);

  // Ensure only one instance
  useEffect(() => {
    hostInstanceCount++;
    if (hostInstanceCount > 1) {
      console.warn('[IslandHost] Multiple instances detected — only one should mount');
    }
    mountedRef.current = true;

    return () => {
      hostInstanceCount--;
      mountedRef.current = false;
    };
  }, []);

  // Initialize island and subscribe
  useEffect(() => {
    if (!mountedRef.current) return;

    // Get or create default island
    let currentIsland = getDefaultDynamicIsland();
    if (!currentIsland) {
      currentIsland = dynamicIslandEngine.createIsland({
        name: 'HEY Island',
        alwaysOnTop: true,
        autoHide: false,
        size: { width: 390, height: 58 },
        contentModules: ['state', 'timer', 'notifications', 'controls', 'media'],
      });
    }
    setIsland(currentIsland);

    // Set initial activities
    setActivities(getVisibleIslandActivities(currentIsland.id));

    // Create coalescer for engine updates (max 1/sec)
    const coalescer = createIslandUpdateCoalescer((update) => {
      if (!mountedRef.current) return;
      const current = getDefaultDynamicIsland();
      if (current) {
        setIsland(current);
        setActivities(getVisibleIslandActivities(current.id));
      }
    });
    coalescerRef.current = coalescer;
    coalescer.start();

    // Subscribe to engine events
    const unsubscribe = subscribeToDynamicIsland((event, data) => {
      if (!mountedRef.current) return;

      // Push to coalescer for rate limiting
      if (coalescerRef.current) {
        coalescerRef.current.push({
          event,
          data,
          timestamp: Date.now(),
        });
      }
    });

    // Also listen for direct activity changes via eventBus
    const { subscribe } = require('../../core/eventBus.js');
    const unsubscribeActivity = subscribe('island.activity_added', (payload) => {
      if (payload?.islandId === currentIsland?.id) {
        coalescerRef.current?.push({ event: 'activity_added', data: payload });
      }
    });
    const unsubscribeActivityUpdate = subscribe('island.activity_updated', (payload) => {
      if (payload?.islandId === currentIsland?.id) {
        coalescerRef.current?.push({ event: 'activity_updated', data: payload });
      }
    });
    const unsubscribeActivityRemove = subscribe('island.activity_removed', (payload) => {
      if (payload?.islandId === currentIsland?.id) {
        coalescerRef.current?.push({ event: 'activity_removed', data: payload });
      }
    });
    const unsubscribeStateChange = subscribe('island.state_changed', (payload) => {
      if (payload?.islandId === currentIsland?.id) {
        coalescerRef.current?.push({ event: 'state_changed', data: payload });
      }
    });

    return () => {
      unsubscribe();
      unsubscribeActivity();
      unsubscribeActivityUpdate();
      unsubscribeActivityRemove();
      unsubscribeStateChange();
      coalescerRef.current?.stop();
    };
  }, []);

  // Handle module actions
  const handleAction = useCallback((action, activityId) => {
    // Actions like approve/deny go through the trust kernel
    // For now, we just dismiss the activity
    if (island) {
      dynamicIslandEngine.dismissActivity(island.id, activityId);
    }
  }, [island]);

  // Render nothing if no island yet
  if (!island) {
    return null;
  }

  return (
    <IslandSurface
      island={island}
      activities={activities}
      onAction={handleAction}
      onExpand={() => setExpanded(true)}
      onCollapse={() => setExpanded(false)}
    />
  );
}

/**
 * Hook to access island state from anywhere in the app.
 * Returns the default island and its visible activities.
 */
export function useIsland() {
  const [island, setIsland] = useState(null);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const current = getDefaultDynamicIsland();
    if (current) {
      setIsland(current);
      setActivities(getVisibleIslandActivities(current.id));
    }

    const unsubscribe = subscribeToDynamicIsland(() => {
      const updated = getDefaultDynamicIsland();
      if (updated) {
        setIsland(updated);
        setActivities(getVisibleIslandActivities(updated.id));
      }
    });

    return unsubscribe;
  }, []);

  return { island, activities };
}

/**
 * Adds an activity to the default island.
 * Convenience function for other parts of the app.
 */
export function addIslandActivity(input) {
  const island = getDefaultDynamicIsland();
  if (!island) return { error: 'No island available' };
  return dynamicIslandEngine.addActivity(island.id, input);
}

/**
 * Updates an activity on the default island.
 */
export function updateIslandActivity(activityId, updates) {
  const island = getDefaultDynamicIsland();
  if (!island) return { error: 'No island available' };
  return dynamicIslandEngine.updateActivity(island.id, activityId, updates);
}

/**
 * Dismisses an activity on the default island.
 */
export function dismissIslandActivity(activityId) {
  const island = getDefaultDynamicIsland();
  if (!island) return { error: 'No island available' };
  return dynamicIslandEngine.dismissActivity(island.id, activityId);
}

/**
 * Sets the island state (compact/expanded/hidden).
 */
export function setIslandState(state) {
  const island = getDefaultDynamicIsland();
  if (!island) return { error: 'No island available' };
  if (!Object.values(ISLAND_STATES).includes(state)) return { error: 'Invalid state' };
  return dynamicIslandEngine.setIslandState(island.id, state);
}

/**
 * Toggles expanded state.
 */
export function toggleIslandExpanded() {
  const island = getDefaultDynamicIsland();
  if (!island) return { error: 'No island available' };
  return dynamicIslandEngine.toggleExpanded(island.id);
}

export default IslandHost;
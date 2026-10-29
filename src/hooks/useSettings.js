/**
 * HEY useSettings Hook
 * 
 * Simple wrapper around settingsRegistry for React components.
 * Provides get, set, and subscribe functions.
 */

import { useSyncExternalStore } from 'react';
import { settingsRegistry } from '../../core/settingsRegistry';

function getSnapshot() {
  return settingsRegistry.getAll();
}

function getServerSnapshot() {
  return settingsRegistry.getAll();
}

function subscribe(callback) {
  return settingsRegistry.onChange(callback);
}

export function useSettings() {
  const store = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  
  const get = (key, fallback) => {
    const value = store[key];
    return value !== undefined ? value : fallback;
  };
  
  const set = (key, value) => {
    settingsRegistry.set(key, value);
  };
  
  const onChange = (callback) => {
    return settingsRegistry.onChange(callback);
  };
  
  return { get, set, onChange, store };
}

export default useSettings;
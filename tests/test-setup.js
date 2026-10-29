/**
 * Test Setup - Polyfills and global configuration for Node.js tests
 */

// Polyfill localStorage for Node.js
if (typeof globalThis.localStorage === "undefined") {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
    get length() { return store.size; },
    key: (index) => Array.from(store.keys())[index] ?? null,
  };
}

// Polyfill sessionStorage
if (typeof globalThis.sessionStorage === "undefined") {
  const store = new Map();
  globalThis.sessionStorage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
    get length() { return store.size; },
    key: (index) => Array.from(store.keys())[index] ?? null,
  };
}

// navigator.onLine polyfill
if (typeof globalThis.navigator === "undefined") {
  globalThis.navigator = { onLine: true };
} else if (typeof globalThis.navigator.onLine === "undefined") {
  globalThis.navigator.onLine = true;
}

// crypto.randomUUID polyfill
if (typeof globalThis.crypto === "undefined") {
  globalThis.crypto = {};
}
if (typeof globalThis.crypto.randomUUID === "undefined") {
  globalThis.crypto.randomUUID = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };
}

// crypto.subtle.digest polyfill for SHA-256
if (typeof globalThis.crypto.subtle === "undefined") {
  globalThis.crypto.subtle = {};
}
if (typeof globalThis.crypto.subtle.digest === "undefined") {
  globalThis.crypto.subtle.digest = async (algorithm, data) => {
    // Simple hash for testing
    const buffer = data instanceof ArrayBuffer ? data : new TextEncoder().encode(data).buffer;
    const view = new Uint8Array(buffer);
    let hash = 0;
    for (let i = 0; i < view.length; i++) {
      hash = ((hash << 5) - hash) + view[i];
      hash |= 0;
    }
    const result = new ArrayBuffer(32);
    const resultView = new Uint8Array(result);
    for (let i = 0; i < 32; i++) {
      resultView[i] = (hash >>> (i * 8)) & 0xff;
    }
    return result;
  };
}

// matchMedia polyfill
if (typeof globalThis.matchMedia === "undefined") {
  globalThis.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

// requestAnimationFrame / cancelAnimationFrame polyfill
if (typeof globalThis.requestAnimationFrame === "undefined") {
  globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 16);
}
if (typeof globalThis.cancelAnimationFrame === "undefined") {
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
}

// Performance.now polyfill
if (typeof globalThis.performance === "undefined") {
  globalThis.performance = { now: () => Date.now() };
} else if (typeof globalThis.performance.now === "undefined") {
  globalThis.performance.now = () => Date.now();
}

console.log("Test setup complete: localStorage, navigator, crypto, matchMedia polyfills loaded");
let releaseLock = null;
let lockPromise = null;

export function keepDesktopRuntimeAlive() {
  if (typeof window === "undefined" || !window.__TAURI_INTERNALS__) return false;
  if (!navigator.locks?.request || lockPromise) return false;

  lockPromise = navigator.locks.request("hey-background-runtime", { mode: "shared" }, () => (
    new Promise((resolve) => { releaseLock = resolve; })
  )).catch((error) => {
    console.warn("HEY background WebLock unavailable:", error);
  });
  return true;
}

export function releaseDesktopRuntimeKeepAlive() {
  if (releaseLock) releaseLock();
  releaseLock = null;
  lockPromise = null;
}

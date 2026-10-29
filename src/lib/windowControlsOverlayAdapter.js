export function isWindowControlsOverlaySupported() {
  return typeof navigator !== "undefined" && "windowControlsOverlay" in navigator;
}

export function getWindowControlsOverlayRect() {
  if (!isWindowControlsOverlaySupported()) return null;
  try {
    return navigator.windowControlsOverlay.getBoundingRect() || null;
  } catch {
    return null;
  }
}

export function getWindowControlsOverlayBounds() {
  const rect = getWindowControlsOverlayRect();
  if (!rect) return null;
  return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
}

export function subscribeWindowControlsOverlay(listener) {
  if (!isWindowControlsOverlaySupported()) return () => {};
  const overlay = navigator.windowControlsOverlay;
  const handler = () => {
    const visible = !!overlay.visible;
    const bounds = getWindowControlsOverlayBounds();
    const height = visible && bounds?.height ? `${Math.round(bounds.height)}px` : "0px";
    try {
      document.documentElement.style.setProperty("--hey-titlebar-area-height", height);
    } catch {
      /* pre-render guards */
    }
    if (typeof listener === "function") listener({ visible, bounds });
  };
  overlay.addEventListener("geometrychange", handler);
  handler();
  return () => overlay.removeEventListener("geometrychange", handler);
}

export function installWindowControlsOverlay() {
  if (!isWindowControlsOverlaySupported()) return { supported: false, dispose: () => {} };
  const dispose = subscribeWindowControlsOverlay(null);
  return { supported: true, dispose };
}
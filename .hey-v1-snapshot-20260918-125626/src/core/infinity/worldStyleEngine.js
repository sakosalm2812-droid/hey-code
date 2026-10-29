import { readJson, writeJson } from "./storage.js";

const KEY = "hey_world_style_v2";
const DB_NAME = "hey_world_assets";
const STORE = "assets";
const WALLPAPER_KEY = "wallpaper";
const EVENT = "hey:world-style-change";
let wallpaperUrl = null;

export const WORLD_PRESETS = Object.freeze({
  graphite: { label: "Graphite", accent: "#CFE6B4", accent2: "#D8B46A", background: "radial-gradient(circle at 18% 16%, rgba(89,120,87,.25), transparent 34%), radial-gradient(circle at 82% 24%, rgba(193,154,88,.16), transparent 30%), linear-gradient(145deg,#080b0a,#111713 55%,#080908)", glass: .62, blur: 26, radius: 24 },
  aurora: { label: "Aurora", accent: "#9DE7E5", accent2: "#B6A7FF", background: "radial-gradient(circle at 20% 20%, rgba(80,220,210,.20), transparent 36%), radial-gradient(circle at 80% 20%, rgba(145,105,255,.20), transparent 34%), linear-gradient(150deg,#05080b,#0c1118 55%,#07080d)", glass: .58, blur: 28, radius: 26 },
  forest: { label: "Forest", accent: "#BEE7A2", accent2: "#E0C17A", background: "radial-gradient(circle at 75% 18%, rgba(186,218,147,.16), transparent 30%), radial-gradient(circle at 18% 72%, rgba(56,108,70,.28), transparent 38%), linear-gradient(150deg,#06100b,#0d1911 58%,#080b08)", glass: .6, blur: 30, radius: 26 },
  midnight: { label: "Midnight", accent: "#B7C8FF", accent2: "#8BE2FF", background: "radial-gradient(circle at 82% 20%, rgba(77,104,190,.24), transparent 33%), radial-gradient(circle at 22% 80%, rgba(45,144,160,.18), transparent 36%), linear-gradient(150deg,#03050a,#090d18 58%,#04050a)", glass: .6, blur: 28, radius: 24 },
  ember: { label: "Ember", accent: "#FFCC93", accent2: "#FF8A70", background: "radial-gradient(circle at 72% 18%, rgba(235,130,71,.22), transparent 32%), radial-gradient(circle at 20% 74%, rgba(168,73,50,.20), transparent 38%), linear-gradient(150deg,#0c0807,#17100c 58%,#080605)", glass: .62, blur: 26, radius: 22 },
  pearl: { label: "Pearl", accent: "#5568A8", accent2: "#8A6C42", background: "radial-gradient(circle at 20% 16%, rgba(140,155,210,.24), transparent 34%), linear-gradient(150deg,#f3f1eb,#e7e8eb 56%,#f5f2ec)", glass: .72, blur: 24, radius: 24, light: true },
});

export const DEFAULT_WORLD_STYLE = Object.freeze({
  preset: "graphite",
  radius: 24,
  glass: 0.62,
  blur: 26,
  surfaceOpacity: 0.78,
  widgetOpacity: 0.78,
  fontScale: 1,
  density: 1,
  motion: 1,
  navWidth: 244,
  navStyle: "floating",
  widgetStyle: "layered",
  islandScale: 1,
  islandOffset: 14,
  pageWidth: 1440,
  ambientStrength: 0.8,
  wallpaperEnabled: false,
  wallpaperBlur: 0,
  wallpaperDim: 0.28,
  accentOverride: "",
  accent2Override: "",
});

const listeners = new Set();

export function getWorldStyle() {
  const raw = readJson(KEY, {});
  return { ...DEFAULT_WORLD_STYLE, ...(raw && typeof raw === "object" ? raw : {}) };
}

function cssUrl(value) {
  return value ? `url("${String(value).replaceAll('"', '%22')}")` : "none";
}

export function applyWorldStyle(settings = getWorldStyle()) {
  if (typeof document === "undefined") return settings;
  const preset = WORLD_PRESETS[settings.preset] || WORLD_PRESETS.graphite;
  const root = document.documentElement;
  const accent = settings.accentOverride || preset.accent;
  const accent2 = settings.accent2Override || preset.accent2;
  const entries = {
    "--hey-world-bg": preset.background,
    "--hey-world-radius": `${settings.radius}px`,
    "--hey-world-glass": String(settings.glass),
    "--hey-world-blur": `${settings.blur}px`,
    "--hey-surface-opacity": String(settings.surfaceOpacity),
    "--hey-widget-opacity": String(settings.widgetOpacity),
    "--hey-font-scale": String(settings.fontScale),
    "--hey-density": String(settings.density),
    "--hey-motion-scale": String(settings.motion),
    "--hey-nav-width": `${settings.navWidth}px`,
    "--hey-page-width": `${settings.pageWidth}px`,
    "--hey-ambient-strength": String(settings.ambientStrength),
    "--hey-island-scale": String(settings.islandScale),
    "--hey-island-top": `${settings.islandOffset}px`,
    "--hey-wallpaper-blur": `${settings.wallpaperBlur}px`,
    "--hey-wallpaper-dim": String(settings.wallpaperDim),
    "--hey-world-accent": accent,
    "--hey-world-accent-2": accent2,
    "--hey-wallpaper-image": settings.wallpaperEnabled && wallpaperUrl ? cssUrl(wallpaperUrl) : "none",
  };
  Object.entries(entries).forEach(([key, value]) => root.style.setProperty(key, value));
  root.dataset.heyWorldPreset = settings.preset;
  root.dataset.heyNavStyle = settings.navStyle;
  root.dataset.heyWidgetStyle = settings.widgetStyle;
  root.dataset.heyWallpaper = String(Boolean(settings.wallpaperEnabled && wallpaperUrl));
  return settings;
}

export function setWorldStyle(patch = {}) {
  const next = { ...getWorldStyle(), ...patch };
  next.radius = Math.max(10, Math.min(48, Number(next.radius || 24)));
  next.glass = Math.max(0.2, Math.min(0.95, Number(next.glass || .62)));
  next.blur = Math.max(0, Math.min(60, Number(next.blur || 26)));
  next.fontScale = Math.max(.8, Math.min(1.35, Number(next.fontScale || 1)));
  next.density = Math.max(.75, Math.min(1.3, Number(next.density || 1)));
  next.motion = Math.max(0, Math.min(1.5, Number(next.motion || 1)));
  next.islandScale = Math.max(.75, Math.min(1.5, Number(next.islandScale || 1)));
  writeJson(KEY, next);
  applyWorldStyle(next);
  listeners.forEach((listener) => listener(next));
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVENT, { detail: next }));
  return next;
}

function openDb() {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function dbGet(key) {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve, reject) => { const tx = db.transaction(STORE, "readonly"); const req = tx.objectStore(STORE).get(key); req.onsuccess = () => resolve(req.result || null); req.onerror = () => reject(req.error); });
}
async function dbPut(key, value) {
  const db = await openDb();
  if (!db) throw new Error("Persistent wallpaper storage is unavailable in this environment.");
  return new Promise((resolve, reject) => { const tx = db.transaction(STORE, "readwrite"); tx.objectStore(STORE).put(value, key); tx.oncomplete = () => resolve(true); tx.onerror = () => reject(tx.error); });
}
async function dbDelete(key) { const db = await openDb(); if (!db) return; return new Promise((resolve, reject) => { const tx = db.transaction(STORE, "readwrite"); tx.objectStore(STORE).delete(key); tx.oncomplete = () => resolve(true); tx.onerror = () => reject(tx.error); }); }

export async function setWorldWallpaper(file) {
  if (!(file instanceof Blob)) throw new Error("Choose an image file first.");
  if (!String(file.type || "").startsWith("image/")) throw new Error("Background must be an image.");
  if (file.size > 12 * 1024 * 1024) throw new Error("Background image must be 12 MB or smaller.");
  await dbPut(WALLPAPER_KEY, file);
  if (wallpaperUrl) URL.revokeObjectURL(wallpaperUrl);
  wallpaperUrl = URL.createObjectURL(file);
  return setWorldStyle({ wallpaperEnabled: true });
}

export async function clearWorldWallpaper() {
  await dbDelete(WALLPAPER_KEY);
  if (wallpaperUrl) URL.revokeObjectURL(wallpaperUrl);
  wallpaperUrl = null;
  return setWorldStyle({ wallpaperEnabled: false });
}

export async function initWorldStyleEngine() {
  try {
    const blob = await dbGet(WALLPAPER_KEY);
    if (blob) wallpaperUrl = URL.createObjectURL(blob);
  } catch { /* wallpaper persistence is optional */ }
  const settings = getWorldStyle();
  applyWorldStyle(settings);
  return settings;
}

export function subscribeWorldStyle(listener) { listeners.add(listener); return () => listeners.delete(listener); }
export function exportWorldStyle() { return JSON.stringify(getWorldStyle(), null, 2); }
export function importWorldStyle(raw) { const parsed = typeof raw === "string" ? JSON.parse(raw) : raw; if (!parsed || typeof parsed !== "object") throw new Error("Invalid HEY world preset"); return setWorldStyle(parsed); }
export { EVENT as WORLD_STYLE_EVENT };

import { useEffect, useRef, useState } from "react";
import { Download, ImagePlus, RotateCcw, Sparkles, Upload } from "lucide-react";
import { WORLD_PRESETS, clearWorldWallpaper, exportWorldStyle, getWorldStyle, importWorldStyle, setWorldStyle, setWorldWallpaper, subscribeWorldStyle } from "../core/infinity/infinityRuntime.js";
import styles from "./WorldStudio.module.css";

const rangeFields = [
  ["radius", "Corner radius", 10, 48, 1], ["glass", "Glass intensity", .2, .95, .01], ["blur", "Surface blur", 0, 60, 1], ["surfaceOpacity", "Surface opacity", .35, 1, .01], ["widgetOpacity", "Widget opacity", .35, 1, .01], ["fontScale", "Type scale", .8, 1.35, .01], ["density", "Interface density", .75, 1.3, .01], ["motion", "Motion intensity", 0, 1.5, .05], ["navWidth", "Sidebar width", 210, 310, 1], ["islandScale", "Dynamic Island scale", .75, 1.5, .01], ["ambientStrength", "Ambient background", 0, 1, .01], ["wallpaperDim", "Wallpaper dim", 0, .8, .01], ["wallpaperBlur", "Wallpaper blur", 0, 30, 1],
];

export default function WorldStudio() {
  const [world, setWorld] = useState(getWorldStyle);
  const [message, setMessage] = useState("");
  const importRef = useRef(null);
  useEffect(() => subscribeWorldStyle(setWorld), []);
  const update = (key, value) => setWorldStyle({ [key]: value });
  async function wallpaper(file) { try { await setWorldWallpaper(file); setMessage("Wallpaper saved locally on this device."); } catch (error) { setMessage(error.message); } }
  function downloadPreset() { const blob = new Blob([exportWorldStyle()], { type: "application/json" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "hey-world.json"; anchor.click(); URL.revokeObjectURL(url); }
  async function importPreset(file) { try { importWorldStyle(await file.text()); setMessage("HEY world imported."); } catch (error) { setMessage(error.message); } }
  return <main className={styles.page}>
    <header className={styles.hero}><span><Sparkles size={15} /> HEY World Studio</span><h1>Make every surface yours.</h1><p>One live design system for backgrounds, glass, widgets, navigation, typography, motion and the Dynamic Island. Changes apply immediately across HEY.</p></header>
    <section className={styles.presetGrid}>{Object.entries(WORLD_PRESETS).map(([id, preset]) => <button key={id} className={world.preset === id ? styles.activePreset : styles.preset} onClick={() => setWorldStyle({ preset: id })}><span style={{ background: preset.background }} /><strong>{preset.label}</strong><small>{world.preset === id ? "Active" : "Apply world"}</small></button>)}</section>
    <section className={styles.layout}>
      <article className={styles.panel}><div className={styles.panelHead}><div><small>WALLPAPER</small><h2>Use your own image</h2></div><ImagePlus size={20} /></div><p>The image stays on this device in browser storage unless you explicitly upload it somewhere else.</p><label className={styles.upload}><Upload size={16} /> Choose background<input type="file" accept="image/*" onChange={(event) => event.target.files?.[0] && wallpaper(event.target.files[0])} /></label><button className={styles.secondary} onClick={() => clearWorldWallpaper()}>Remove wallpaper</button></article>
      <article className={styles.panel}><div className={styles.panelHead}><div><small>SURFACE LANGUAGE</small><h2>Shape the interface</h2></div></div><div className={styles.selectGrid}><label>Navigation<select value={world.navStyle} onChange={(e) => update("navStyle", e.target.value)}><option value="floating">Floating glass</option><option value="solid">Solid rail</option><option value="minimal">Minimal</option></select></label><label>Widgets<select value={world.widgetStyle} onChange={(e) => update("widgetStyle", e.target.value)}><option value="layered">Layered</option><option value="quiet">Quiet</option><option value="bold">Bold</option></select></label></div></article>
    </section>
    <section className={styles.controls}>{rangeFields.map(([key, label, min, max, step]) => <label key={key}><span><b>{label}</b><small>{Number(world[key]).toFixed(step < .1 ? 2 : 0)}</small></span><input type="range" min={min} max={max} step={step} value={world[key]} onChange={(e) => update(key, Number(e.target.value))} /></label>)}</section>
    <section className={styles.footerActions}><button onClick={downloadPreset}><Download size={15} /> Export world</button><button onClick={() => importRef.current?.click()}><Upload size={15} /> Import world</button><input ref={importRef} hidden type="file" accept="application/json" onChange={(e) => e.target.files?.[0] && importPreset(e.target.files[0])} /><button onClick={() => { setWorldStyle({ preset: "graphite", radius: 24, glass: .62, blur: 26, surfaceOpacity: .78, widgetOpacity: .78, fontScale: 1, density: 1, motion: 1, navWidth: 244, navStyle: "floating", widgetStyle: "layered", islandScale: 1, islandOffset: 14, pageWidth: 1440, ambientStrength: .8, wallpaperDim: .28, wallpaperBlur: 0, accentOverride: "", accent2Override: "" }); setMessage("World reset."); }}><RotateCcw size={15} /> Reset</button></section>
    {message && <p className={styles.message}>{message}</p>}
  </main>;
}

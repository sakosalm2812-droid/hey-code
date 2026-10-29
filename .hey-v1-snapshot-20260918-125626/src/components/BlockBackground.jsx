/* eslint-disable react-refresh/only-export-components */
import { useEffect, useMemo, useState } from "react";
import { getWorldStyle, initWorldStyleEngine, subscribeWorldStyle, WORLD_PRESETS } from "../core/infinity/worldStyleEngine.js";

const ORBS = [
  [12, 18, 380], [86, 15, 310], [64, 78, 420], [18, 82, 280], [48, 44, 220],
];

export default function BlockBackground() {
  const [settings, setSettings] = useState(() => getWorldStyle());
  useEffect(() => {
    initWorldStyleEngine().then(setSettings).catch(() => setSettings(getWorldStyle()));
    return subscribeWorldStyle(setSettings);
  }, []);
  const preset = WORLD_PRESETS[settings.preset] || WORLD_PRESETS.graphite;
  const orbs = useMemo(() => ORBS.slice(0, settings.ambientStrength < .35 ? 2 : settings.ambientStrength < .7 ? 4 : 5), [settings.ambientStrength]);
  return (
    <div className="hey-world-background" aria-hidden="true" data-preset={settings.preset}>
      <div className="hey-world-wallpaper" />
      <div className="hey-world-gradient" style={{ background: preset.background }} />
      <div className="hey-world-noise" />
      <div className="hey-world-orbs">
        {orbs.map(([x, y, size], index) => <span key={index} style={{ left: `${x}%`, top: `${y}%`, width: size, height: size, animationDelay: `${index * -2.7}s` }} />)}
      </div>
    </div>
  );
}

export function setBlockTemplate(id) {
  if (!WORLD_PRESETS[id]) return;
  import("../core/infinity/worldStyleEngine.js").then(({ setWorldStyle }) => setWorldStyle({ preset: id }));
}
export function getBlockTemplates() { return Object.entries(WORLD_PRESETS).map(([id, value]) => ({ id, label: value.label })); }
export const BLOCK_BG_KEY = "hey_world_style_v2";


[FORMAT REQUIREMENT — READ CAREFULLY]
You MUST wrap ALL JSON tool call arrays in a  code block. This is critical: the automation harness parses your response by looking for code blocks first. Raw JSON outside a code block will NOT be detected.
CORRECT format:

[{"tool": "write_file", "path": "/abs/path", "content": "file content here"}]

IMPORTANT: When the file content contains double-quote characters ("), you MUST escape them as \" inside the JSON string. For example, XML like: <tag attr="value"> must be written as: <tag attr=\"value\"> in the JSON content field.


You are the HEY 3D Specialist.
YOUR SKILL LIBRARY:

--- SKILL.md ---
---
name: alpha-cutout
description: Turns an AI-generated (or filmed) clip of a character or product into a transparent, web-ready animation by shooting it on a flat chroma plate and keying it with per-frame plate measurement and edge unmixing. Delivers stacked-alpha MP4 that plays with transparency in every browser including Safari, VP9 alpha WebM, or keyed WebP frame sequences for scroll scrubbing. Use when an animated subject has to sit over page content, between layers of type, or over a 3D scene, when someone asks for "transparent video", "video with alpha", "remove the background from this clip", or when a generated video has a background that should not be there.
---

# Alpha cutout

Image-to-video models never return alpha. A character that should stand between a giant headline and a sun disc, or a bottle that should float over a page, needs its background removed from every frame, cleanly enough that no fringe shows on any page colour. This skill does it the way a film studio does: shoot the subject on a flat key colour, then pull a matte per frame.

## Tools

| File | What it does |
| --- | --- |
| `scripts/plate.py` | Places a cut-out subject on a key plate with headroom; picks the key colour the subject clashes with least |
| `scripts/key.py` | Keys a clip or still into stacked MP4, VP9 alpha WebM, RGBA WebP frames or PNGs |
| `assets/alpha-video.js` | Plays a stacked-alpha MP4 with transparency on a canvas (WebGL), with `seek()` for scrubbing |

Needs Python 3.9+, `pip install numpy opencv-python-headless pillow`, and ffmpeg on PATH.

## Pipeline

1. **Cut the subject out of the still.** Any background remover works. Check what it dropped: thin objects (a ball in the air, racket strings, hair) often go missing. Put them back by hand.

2. **Make the plate.**

   
   python3 scripts/plate.py subject.png plate.png --size 1350x1800 --fit 0.8
   

   The script reports, for magenta, green and blue, how much of the subject sits close to that key, and picks the cleanest. Magenta is usually right: almost nothing in skin, clothing, product or foliage is pure magenta. Green fails on plants and green products; blue fails on denim and sky. The subject is pasted with a hard edge on purpose: a soft edge pre-mixed with the plate colour teaches the model to draw a fringe.

   Leave room for the motion. A serve needs space above the head; a turn needs space to the side. Match the plate's aspect to the video model's output aspect so nothing gets cropped.

3. **Generate on the plate.** Use the plate as the start frame (and as the end frame for a seamless loop; see `motion-assets`). The prompt must name the plate, or the model invents a background:

   > The background must remain a completely flat, uniform, pure chroma-key magenta (exact RGB 255, 0, 255) filling the entire frame, with no shadows, no floor, no gradient, no vignette and no scenery. Locked-off camera.

   **The prompt wins over the image.** A leftover "on a white background" in the prompt gets you a white background whatever the plate was. Re-read the prompt after every edit.

4. **Key it.**

   
   python3 scripts/key.py clip.mp4 --png check/ --frame-list 0,40,80,120   # inspect first
   python3 scripts/key.py clip.mp4 --stacked hero-1080.mp4 --width 1080
   python3 scripts/key.py clip.mp4 --stacked hero-720.mp4 --width 720      # phones
   python3 scripts/key.py clip.mp4 --frames serve/lg --width 960 --start 0 --end 78
   

   `--png` prints the plate colour it measured in each frame. Models drift the plate: a pure magenta can come back pale pink (250, 178, 243) halfway through while the subject keeps its colours. That is why the key colour is measured per frame from the frame's own border instead of being set once. If the subject touches the top edge, the measurement breaks and the script says so.

   Then, per pixel: alpha comes from how far the pixel's key excess is from the pl
PREVIOUSLY SUCCESSFUL PATTERN:

You are the HEY 3D Specialist.
YOUR SKILL LIBRARY:

--- SKILL.md ---
---
name: alpha-cutout
description: Turns an AI-generated (or filmed) clip of a character or product into a transparent, web-ready animation by shooting it on a flat chroma plate and keying it with per-frame plate measurement and edge unmixing. Delivers stacked-alpha MP4 that plays with transparency in every browser including Safari, VP9 alpha WebM, or keyed WebP frame sequences for scroll scrubbing. Use when an animated sub

FILE TO UPGRADE: src\components\Tools\ArtTools.jsx
CURRENT CODE:
import React, { useState } from "react";
import {
  Palette,
  Clock,
  MessageSquare,
  Brush,
  Sparkles,
  Copy,
  Check,
  Share2,
} from "lucide-react";

const PALETTES = {
  complementary: [
    { hex: "#00F0FF", name: "Cyan Core", role: "Primary Accent" },
    { hex: "#FF5E00", name: "Amber Blaze", role: "Direct Complement" },
    { hex: "#0D1117", name: "Obsidian Base", role: "Canvas Background" },
    { hex: "#8A99AD", name: "Slate Mist", role: "Neutral Midtone" },
  ],
  analogous: [
    { hex: "#EC4899", name: "Vibrant Fuchsia", role: "Dominant" },
    { hex: "#8B5CF6", name: "Deep Violet", role: "Harmonic Step" },
    { hex: "#3B82F6", name: "Electric Azure", role: "Accent Cool" },
    { hex: "#1A1028", name: "Midnight Plum", role: "Deep Shade" },
  ],
  triadic: [
    { hex: "#10B981", name: "Emerald Bloom", role: "Vertex A" },
    { hex: "#F59E0B", name: "Warm Ochre", role: "Vertex B" },
    { hex: "#6366F1", name: "Indigo Light", role: "Vertex C" },
    { hex: "#0A0F1D", name: "Abyssal Navy", role: "Foundation" },
  ],
};

const ART_MOVEMENTS = [
  {
    era: "High Renaissance (1490–1527)",
    artists: "Leonardo da Vinci, Michelangelo, Raphael",
    focus: "Linear perspective, anatomical proportion, sfumato and chiaroscuro.",
    prompt: "How does Leonardo use atmospheric perspective in the background of the Mona Lisa to create infinite depth?",
  },
  {
    era: "Impressionism (1870–1890)",
    artists: "Claude Monet, Edgar Degas, Pierre-Auguste Renoir",
    focus: "En plein air painting, visible brushstrokes, fleeting light and color over line.",
    prompt: "Notice how Monet paints water lilies with optical color mixing rather than smooth blended pigments.",
  },
  {
    era: "Bauhaus & Modernism (1919–1933)",
    artists: "Wassily Kandinsky, Paul Klee, Walter Gropius",
    focus: "Form follows function, geometric abstraction, primary color discipline.",
    prompt: "In what ways did Kandinsky correlate geometric shapes with specific musical pitches?",
  },
  {
    era: "Contemporary Digital (2000–Present)",
    artists: "Digital illustrators, generative coders, installation artists",
    focus: "Pixel manipulation, sub-surface scattering, volumetric lighting, algorithmic proceduralism.",
    prompt: "How does digital layering alter the artist's psychological willingness to experiment and destroy?",
  },
];

export default function ArtTools({ activeToolName = "Color Palette Studio" }) {
  const [activeTab, setActiveTab] = useState(() => {
    if (activeToolName.includes("Timeline")) return "timeline";
    if (activeToolName.includes("Critique")) return "critique";
    if (activeToolName.includes("Medium")) return "medium";
    return "palette";
  });

  // Palette State
  const [paletteType, setPaletteType] = useState("analogous");
  const [copiedHex, setCopiedHex] = useState(null);

  // Critique State
  const [artworkTitle, setArtworkTitle] = useState("Still Life with Prism & Drapery");
  const [compositionScore, setCompositionScore] = useState(8);
  const [colorScore, setColorScore] = useState(9);
  const [techniqueScore, setTechniqueScore] = useState(7);
  const [critiqueOutput, setCritiqueOutput] = useState(null);

  const handleGenerateCritique = () => {
    const avg = ((compositionScore + colorScore + techniqueScore) / 3).toFixed(1);
    setCritiqueOutput({
      title: artworkTitle,
      average: avg,
      strengths: "Masterful handling of chromatic temperature and edge control. The focal point commands attention immediately with high local contrast.",
      growth: "Consider refining the negative space in the lower right quadrant; value gradients there slightly distract from the primary subject axis.",
      nextExercise: "Paint a 3-value monochromatic study focusing strictly on tonal masses before introducing chromatic saturation.",
    });
  };

  return (
    <div
      className="h-full flex flex-col rounded-3xl border border-white/10 bg-[#131419]/90 backdrop-blur-[24px] text-[#F5F6F8] overflow-hidden"
      style={{ backdropFilter: "blur(24px)" }}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/10 bg-black/20 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-[#EC4899]" />
          <span className="text-sm font-bold tracking-tight text-[#F5F6F8]">Visual Arts &amp; Studio Suite</span>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#0A0B0F]/80 border border-white/10 text-xs">
          {[
            { id: "palette", label: "Color Palette Studio" },
            { id: "timeline", label: "Art History Timeline" },
            { id: "critique", label: "Critique Studio" },
            { id: "medium", label: "Medium Explorer" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-medium tr
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.
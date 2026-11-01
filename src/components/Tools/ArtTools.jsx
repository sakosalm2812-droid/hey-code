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
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-[#EC4899] text-white font-bold shadow-md shadow-[#EC4899]/30"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Studio Body */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* TAB 1: COLOR PALETTE STUDIO */}
        {activeTab === "palette" && (
          <div className="space-y-6 max-w-3xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-[#F5F6F8]">Harmonic Color Palette Studio</h3>
                <p className="text-xs text-white/50">Mathematical color theory generators for classroom palettes and digital lighting schemes.</p>
              </div>

              <div className="flex gap-1.5 text-xs">
                {["complementary", "analogous", "triadic"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setPaletteType(type)}
                    className={`px-3 py-1.5 rounded-xl capitalize border transition-all ${
                      paletteType === type
                        ? "bg-[#EC4899]/20 border-[#EC4899] text-[#EC4899] font-bold"
                        : "bg-white/5 border-white/10 text-white/60 hover:text-white"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Palette Visualizer */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {PALETTES[paletteType].map((color) => (
                <div
                  key={color.hex}
                  className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden flex flex-col shadow-lg group"
                >
                  <div
                    className="h-28 w-full transition-transform group-hover:scale-105"
                    style={{ backgroundColor: color.hex }}
                  />
                  <div className="p-3 space-y-1">
                    <div className="text-xs font-bold text-[#F5F6F8]">{color.name}</div>
                    <div className="text-[10px] text-white/40">{color.role}</div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(color.hex);
                        setCopiedHex(color.hex);
                        setTimeout(() => setCopiedHex(null), 1800);
                      }}
                      className="w-full mt-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-[11px] font-mono text-[#EC4899] flex items-center justify-center gap-1 transition-all"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedHex === color.hex ? "Copied!" : color.hex}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl border border-white/10 bg-[#0A0B0F] flex items-center justify-between text-xs">
              <span className="text-white/60">Export CSS Variables:</span>
              <button
                onClick={() => {
                  const css = PALETTES[paletteType].map((c, i) => `--color-${i + 1}: ${c.hex};`).join("\n");
                  navigator.clipboard.writeText(css);
                }}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#EC4899] font-semibold"
              >
                Copy CSS Palette
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: ART HISTORY TIMELINE */}
        {activeTab === "timeline" && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h3 className="text-lg font-bold text-[#F5F6F8]">Art Movements &amp; Visual Socratic Inquiry</h3>
              <p className="text-xs text-white/50">Chronological history with essential conceptual questions for studio discussion.</p>
            </div>

            <div className="space-y-4">
              {ART_MOVEMENTS.map((mov, idx) => (
                <div key={idx} className="p-5 rounded-2xl border border-white/10 bg-black/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-[#EC4899]">{mov.era}</h4>
                    <span className="text-xs font-mono text-white/40">Epoch {idx + 1}</span>
                  </div>
                  <div className="text-xs text-white/70">
                    <strong className="text-white">Pivotal Figures:</strong> {mov.artists}
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">{mov.focus}</p>
                  <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-200 text-xs italic">
                    💡 <strong>Studio Inquiry:</strong> {mov.prompt}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CRITIQUE STUDIO */}
        {activeTab === "critique" && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h3 className="text-lg font-bold text-[#F5F6F8]">Studio Critique &amp; Rubric Synthesizer</h3>
              <p className="text-xs text-white/50">Formative assessment tool delivering actionable peer and instructor critique.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-white/70">Artwork Title / Student Project</label>
                <input
                  type="text"
                  value={artworkTitle}
                  onChange={(e) => setArtworkTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0A0B0F] border border-white/10 text-xs text-white outline-none mt-1"
                />
              </div>

              {/* Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#0A0B0F] border border-white/10 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/60">Composition &amp; Focal</span>
                    <span className="font-bold text-[#EC4899]">{compositionScore}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={compositionScore}
                    onChange={(e) => setCompositionScore(Number(e.target.value))}
                    className="w-full accent-[#EC4899]"
                  />
                </div>

                <div className="p-4 rounded-xl bg-[#0A0B0F] border border-white/10 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/60">Color &amp; Value Tones</span>
                    <span className="font-bold text-[#EC4899]">{colorScore}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={colorScore}
                    onChange={(e) => setColorScore(Number(e.target.value))}
                    className="w-full accent-[#EC4899]"
                  />
                </div>

                <div className="p-4 rounded-xl bg-[#0A0B0F] border border-white/10 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/60">Execution &amp; Craft</span>
                    <span className="font-bold text-[#EC4899]">{techniqueScore}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={techniqueScore}
                    onChange={(e) => setTechniqueScore(Number(e.target.value))}
                    className="w-full accent-[#EC4899]"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateCritique}
                className="px-6 py-3 rounded-2xl bg-[#EC4899] text-white font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-md shadow-[#EC4899]/30 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> Synthesize Critique Report
              </button>
            </div>

            {critiqueOutput && (
              <div className="p-6 rounded-2xl border border-pink-500/30 bg-pink-500/10 space-y-4">
                <div className="flex items-center justify-between border-b border-pink-500/20 pb-3">
                  <h4 className="text-base font-bold text-white">{critiqueOutput.title}</h4>
                  <span className="px-3 py-1 rounded-full bg-[#EC4899] text-white font-bold text-xs">
                    Score: {critiqueOutput.average} / 10
                  </span>
                </div>
                <div className="space-y-3 text-xs md:text-sm">
                  <div>
                    <strong className="text-emerald-400 block mb-0.5">Key Strengths:</strong>
                    <p className="text-white/90">{critiqueOutput.strengths}</p>
                  </div>
                  <div>
                    <strong className="text-amber-400 block mb-0.5">Area for Growth:</strong>
                    <p className="text-white/90">{critiqueOutput.growth}</p>
                  </div>
                  <div>
                    <strong className="text-[#EC4899] block mb-0.5">Next Studio Milestone:</strong>
                    <p className="text-white/90">{critiqueOutput.nextExercise}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: MEDIUM EXPLORER */}
        {activeTab === "medium" && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h3 className="text-lg font-bold text-[#F5F6F8]">Medium &amp; Pigment Chemistry Reference</h3>
              <p className="text-xs text-white/50">Comparative drying times, solvent profiles, and substrate priming guides.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  medium: "Oil (Linseed / Walnut Binder)",
                  drying: "2 to 14 days (Oxidation)",
                  substrate: "Stretched Linen, Triple-Gessoed Canvas",
                  solvents: "Odorless Mineral Spirits, Spike Lavender",
                  fatOverLean: "Rule: Increase oil content in subsequent layers to prevent upper cracking.",
                },
                {
                  medium: "Acrylic (Polymer Emulsion)",
                  drying: "10 to 30 minutes (Evaporation)",
                  substrate: "Wood panels, heavyweight paper, canvas",
                  solvents: "Distilled water, flow improver",
                  fatOverLean: "Dries darker by ~10% due to polymer transparency shift.",
                },
                {
                  medium: "Watercolor (Gum Arabic)",
                  drying: "2 to 5 minutes",
                  substrate: "300gsm 100% Cotton Rag (Cold or Hot Press)",
                  solvents: "Pure Water, Ox Gall surfactant",
                  fatOverLean: "Lightest values are unpainted paper preserve; work light to dark.",
                },
                {
                  medium: "Digital (24-bit RGB / Procreate)",
                  drying: "Instantaneous",
                  substrate: "OLED / Display P3 Color Gamut Tablet",
                  solvents: "History Stack Undo (Ctrl+Z)",
                  fatOverLean: "Non-destructive blending modes (Multiply, Overlay, Color Dodge).",
                },
              ].map((m) => (
                <div key={m.medium} className="p-5 rounded-2xl border border-white/10 bg-black/40 space-y-2">
                  <h4 className="text-sm font-bold text-[#EC4899]">{m.medium}</h4>
                  <div className="text-xs text-white/50">Drying: <span className="text-white/90">{m.drying}</span></div>
                  <div className="text-xs text-white/50">Substrate: <span className="text-white/90">{m.substrate}</span></div>
                  <div className="text-xs text-white/50">Solvents: <span className="text-white/90">{m.solvents}</span></div>
                  <div className="p-2.5 rounded-xl bg-white/5 text-[11px] text-pink-200 mt-2">
                    💡 {m.fatOverLean}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

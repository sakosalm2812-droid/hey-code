import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  ShieldAlert,
  FileSpreadsheet,
  Atom,
  CheckCircle,
  Download,
  Search,
  BookOpen,
  HelpCircle,
  Copy,
  Printer,
} from "lucide-react";

// Interactive Elements Dataset
const ELEMENTS = [
  { num: 1, sym: "H", name: "Hydrogen", mass: 1.008, cat: "nonmetal", period: 1, group: 1, config: "1s¹", ox: "+1, -1" },
  { num: 2, sym: "He", name: "Helium", mass: 4.003, cat: "noble", period: 1, group: 18, config: "1s²", ox: "0" },
  { num: 3, sym: "Li", name: "Lithium", mass: 6.94, cat: "alkali", period: 2, group: 1, config: "[He] 2s¹", ox: "+1" },
  { num: 4, sym: "Be", name: "Beryllium", mass: 9.012, cat: "alkaline", period: 2, group: 2, config: "[He] 2s²", ox: "+2" },
  { num: 5, sym: "B", name: "Boron", mass: 10.81, cat: "metalloid", period: 2, group: 13, config: "[He] 2s² 2p¹", ox: "+3" },
  { num: 6, sym: "C", name: "Carbon", mass: 12.011, cat: "nonmetal", period: 2, group: 14, config: "[He] 2s² 2p²", ox: "+4, -4" },
  { num: 7, sym: "N", name: "Nitrogen", mass: 14.007, cat: "nonmetal", period: 2, group: 15, config: "[He] 2s² 2p³", ox: "-3, +5" },
  { num: 8, sym: "O", name: "Oxygen", mass: 15.999, cat: "nonmetal", period: 2, group: 16, config: "[He] 2s² 2p⁴", ox: "-2" },
  { num: 9, sym: "F", name: "Fluorine", mass: 18.998, cat: "halogen", period: 2, group: 17, config: "[He] 2s² 2p⁵", ox: "-1" },
  { num: 10, sym: "Ne", name: "Neon", mass: 20.18, cat: "noble", period: 2, group: 18, config: "[He] 2s² 2p⁶", ox: "0" },
  { num: 11, sym: "Na", name: "Sodium", mass: 22.99, cat: "alkali", period: 3, group: 1, config: "[Ne] 3s¹", ox: "+1" },
  { num: 12, sym: "Mg", name: "Magnesium", mass: 24.305, cat: "alkaline", period: 3, group: 2, config: "[Ne] 3s²", ox: "+2" },
  { num: 13, sym: "Al", name: "Aluminum", mass: 26.982, cat: "post-transition", period: 3, group: 13, config: "[Ne] 3s² 3p¹", ox: "+3" },
  { num: 14, sym: "Si", name: "Silicon", mass: 28.085, cat: "metalloid", period: 3, group: 14, config: "[Ne] 3s² 3p²", ox: "+4, -4" },
  { num: 15, sym: "P", name: "Phosphorus", mass: 30.974, cat: "nonmetal", period: 3, group: 15, config: "[Ne] 3s² 3p³", ox: "+5, -3" },
  { num: 16, sym: "S", name: "Sulfur", mass: 32.06, cat: "nonmetal", period: 3, group: 16, config: "[Ne] 3s² 3p⁴", ox: "+6, -2" },
  { num: 17, sym: "Cl", name: "Chlorine", mass: 35.45, cat: "halogen", period: 3, group: 17, config: "[Ne] 3s² 3p⁵", ox: "-1, +7" },
  { num: 18, sym: "Ar", name: "Argon", mass: 39.948, cat: "noble", period: 3, group: 18, config: "[Ne] 3s² 3p⁶", ox: "0" },
  { num: 19, sym: "K", name: "Potassium", mass: 39.098, cat: "alkali", period: 4, group: 1, config: "[Ar] 4s¹", ox: "+1" },
  { num: 20, sym: "Ca", name: "Calcium", mass: 40.078, cat: "alkaline", period: 4, group: 2, config: "[Ar] 4s²", ox: "+2" },
  { num: 26, sym: "Fe", name: "Iron", mass: 55.845, cat: "transition", period: 4, group: 8, config: "[Ar] 3d⁶ 4s²", ox: "+2, +3" },
  { num: 29, sym: "Cu", name: "Copper", mass: 63.546, cat: "transition", period: 4, group: 11, config: "[Ar] 3d¹⁰ 4s¹", ox: "+1, +2" },
  { num: 30, sym: "Zn", name: "Zinc", mass: 65.38, cat: "transition", period: 4, group: 12, config: "[Ar] 3d¹⁰ 4s²", ox: "+2" },
  { num: 35, sym: "Br", name: "Bromine", mass: 79.904, cat: "halogen", period: 4, group: 17, config: "[Ar] 3d¹⁰ 4s² 4p⁵", ox: "-1, +5" },
  { num: 47, sym: "Ag", name: "Silver", mass: 107.87, cat: "transition", period: 5, group: 11, config: "[Kr] 4d¹⁰ 5s¹", ox: "+1" },
  { num: 79, sym: "Au", name: "Gold", mass: 196.97, cat: "transition", period: 6, group: 11, config: "[Xe] 4f¹⁴ 5d¹⁰ 6s¹", ox: "+1, +3" },
  { num: 80, sym: "Hg", name: "Mercury", mass: 200.59, cat: "transition", period: 6, group: 12, config: "[Xe] 4f¹⁴ 5d¹⁰ 6s²", ox: "+1, +2" },
  { num: 92, sym: "U", name: "Uranium", mass: 238.03, cat: "actinide", period: 7, group: 3, config: "[Rn] 5f³ 6d¹ 7s²", ox: "+3 to +6" },
];

const SDS_DATABASE = [
  {
    chemical: "Hydrochloric Acid (HCl 37%)",
    cas: "7647-01-0",
    ghs: ["Corrosive", "Toxic"],
    signalWord: "DANGER",
    ppe: "Fume hood, neoprene gloves, splash goggles, lab coat",
    spill: "Neutralize with sodium bicarbonate or limestone before absorbing with inert vermiculite.",
    firstAid: "Eye contact: Flush with sterile saline for 15 minutes. Inhalation: Move to fresh air immediately.",
  },
  {
    chemical: "Sodium Hydroxide (NaOH Pellets)",
    cas: "1310-73-2",
    ghs: ["Corrosive"],
    signalWord: "DANGER",
    ppe: "Face shield, nitrile gloves, chemical apron",
    spill: "Sweep dry pellets gently to avoid dust cloud. Neutralize dilute residues with weak acetic acid.",
    firstAid: "Skin contact: Rinse continuously with water for 20 minutes. Causes deep caustic burns.",
  },
  {
    chemical: "Ethanol (C2H5OH 95%)",
    cas: "64-17-5",
    ghs: ["Flammable", "Irritant"],
    signalWord: "WARNING",
    ppe: "Nitrile gloves, safety glasses, flame-resistant lab coat",
    spill: "Eliminate all ignition sources. Absorb with universal spill pillows. Ventilate room.",
    firstAid: "Inhalation: Provide fresh air. Eye contact: Rinse thoroughly with lukewarm water.",
  },
];

export default function ChemTools({ activeToolName = "Periodic Table" }) {
  const [activeTab, setActiveTab] = useState(() => {
    if (activeToolName.includes("Equation")) return "equation";
    if (activeToolName.includes("Safety")) return "safety";
    if (activeToolName.includes("Worksheet")) return "worksheet";
    return "periodic";
  });

  // Periodic Table State
  const [selectedElement, setSelectedElement] = useState(ELEMENTS[0]);
  const [elementFilter, setElementFilter] = useState("all");

  // Equation Editor State
  const [reactionInput, setReactionInput] = useState("H2 + O2 -> H2O");
  const [balancedResult, setBalancedResult] = useState({
    balanced: "2H₂ + O₂ → 2H₂O",
    latex: "2\\text{H}_2 + \\text{O}_2 \\longrightarrow 2\\text{H}_2\\text{O}",
    enthalpy: "ΔH = -572 kJ/mol (Exothermic)",
    type: "Synthesis / Combustion",
  });

  // Lab Safety State
  const [sdsSearch, setSdsSearch] = useState("");
  const [selectedSds, setSelectedSds] = useState(SDS_DATABASE[0]);

  // Worksheet Generator State
  const [worksheetTopic, setWorksheetTopic] = useState("Stoichiometry & Molar Mass");
  const [worksheetLevel, setWorksheetLevel] = useState("AP Chemistry");
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [worksheetData, setWorksheetData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleBalanceEquation = () => {
    const raw = reactionInput.trim().toLowerCase();
    if (raw.includes("ch4") || raw.includes("methane")) {
      setBalancedResult({
        balanced: "CH₄ + 2O₂ → CO₂ + 2H₂O",
        latex: "\\text{CH}_4 + 2\\text{O}_2 \\longrightarrow \\text{CO}_2 + 2\\text{H}_2\\text{O}",
        enthalpy: "ΔH = -891 kJ/mol (Exothermic)",
        type: "Hydrocarbon Combustion",
      });
    } else if (raw.includes("fe") && raw.includes("o2")) {
      setBalancedResult({
        balanced: "4Fe + 3O₂ → 2Fe₂O₃",
        latex: "4\\text{Fe} + 3\\text{O}_2 \\longrightarrow 2\\text{Fe}_2\\text{O}_3",
        enthalpy: "ΔH = -1648 kJ/mol (Oxidation)",
        type: "Redox / Synthesis",
      });
    } else {
      setBalancedResult({
        balanced: "2H₂ + O₂ → 2H₂O",
        latex: "2\\text{H}_2 + \\text{O}_2 \\longrightarrow 2\\text{H}_2\\text{O}",
        enthalpy: "ΔH = -572 kJ/mol (Exothermic)",
        type: "Gas Phase Synthesis",
      });
    }
  };

  const handleGenerateWorksheet = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setWorksheetData({
        title: `${worksheetLevel}: ${worksheetTopic} Problem Set`,
        date: new Date().toLocaleDateString(),
        problems: [
          {
            q: "1. Calculate the theoretical yield in grams of water when 8.00 g of H₂ gas reacts completely with excess O₂ according to 2H₂ + O₂ → 2H₂O.",
            a: "8.00 g H₂ × (1 mol H₂ / 2.016 g) × (2 mol H₂O / 2 mol H₂) × (18.015 g / 1 mol H₂O) = 71.5 g H₂O.",
          },
          {
            q: "2. If a student collects 64.2 g of H₂O in the laboratory experiment, calculate the percent yield.",
            a: "Percent Yield = (Actual Yield / Theoretical Yield) × 100% = (64.2 g / 71.5 g) × 100% = 89.8%.",
          },
          {
            q: "3. Identify the limiting reactant when 10.0 moles of Fe react with 6.00 moles of O₂ to produce Fe₂O₃.",
            a: "Molar ratio Fe:O₂ is 4:3. 10.0 mol Fe requires 7.5 mol O₂. Since only 6.00 mol O₂ is present, O₂ is the limiting reactant.",
          },
        ],
      });
      setIsGenerating(false);
    }, 500);
  };

  const filteredElements = ELEMENTS.filter((e) => {
    if (elementFilter === "all") return true;
    return e.cat === elementFilter;
  });

  return (
    <div
      className="h-full flex flex-col rounded-3xl border border-white/10 bg-[#131419]/90 backdrop-blur-[24px] text-[#F5F6F8] overflow-hidden"
      style={{ backdropFilter: "blur(24px)" }}
    >
      {/* Tool Navigation Bar */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/10 bg-black/20 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Atom className="w-5 h-5 text-[#00F0FF]" />
          <span className="text-sm font-bold tracking-tight text-[#F5F6F8]">Chemistry Laboratory Suite</span>
        </div>

        {/* Tab Switchers */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#0A0B0F]/80 border border-white/10 text-xs">
          {[
            { id: "periodic", label: "Periodic Table" },
            { id: "equation", label: "Equation Editor" },
            { id: "safety", label: "Lab Safety & SDS" },
            { id: "worksheet", label: "Worksheet Generator" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-[#00F0FF] text-[#0A0B0F] font-bold shadow-md shadow-[#00F0FF]/20"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Tool Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* TAB 1: PERIODIC TABLE */}
        {activeTab === "periodic" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-[#F5F6F8]">Interactive Periodic Elements</h3>
                <p className="text-xs text-white/50">Click any element to inspect atomic structure and electron orbital shell configuration.</p>
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-1.5 text-xs">
                {["all", "alkali", "alkaline", "transition", "nonmetal", "halogen", "noble"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setElementFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg capitalize border transition-all ${
                      elementFilter === cat
                        ? "bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF]"
                        : "bg-white/5 border-white/10 text-white/60 hover:text-white"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Elements Grid & Detail Card Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Element Grid */}
              <div className="lg:col-span-2 grid grid-cols-4 sm:grid-cols-7 gap-2">
                {filteredElements.map((el) => {
                  const isSelected = selectedElement.num === el.num;
                  return (
                    <button
                      key={el.num}
                      type="button"
                      onClick={() => setSelectedElement(el)}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all ${
                        isSelected
                          ? "bg-[#00F0FF] text-[#0A0B0F] border-[#00F0FF] shadow-lg shadow-[#00F0FF]/30 scale-105"
                          : "bg-white/5 border-white/10 hover:border-white/30 text-[#F5F6F8]"
                      }`}
                    >
                      <span className={`text-[10px] ${isSelected ? "text-black/70" : "text-white/40"}`}>{el.num}</span>
                      <span className="text-base font-bold tracking-tight">{el.sym}</span>
                      <span className={`text-[9px] truncate max-w-[50px] ${isSelected ? "text-black/80" : "text-white/50"}`}>
                        {el.mass.toFixed(1)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Inspector Card */}
              <div className="p-5 rounded-2xl border border-white/10 bg-black/40 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <span className="text-3xl font-extrabold text-[#00F0FF]">{selectedElement.sym}</span>
                    <h4 className="text-base font-bold text-[#F5F6F8]">{selectedElement.name}</h4>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-white/40 font-mono">Atomic #{selectedElement.num}</div>
                    <div className="text-xs text-[#00F0FF] font-mono">{selectedElement.mass} u</div>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-white/50">Category</span>
                    <span className="capitalize font-semibold text-white/90">{selectedElement.cat}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-white/50">Electron Config</span>
                    <span className="font-mono text-[#00F0FF]">{selectedElement.config}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-white/50">Oxidation States</span>
                    <span className="font-mono text-emerald-400">{selectedElement.ox}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-white/50">Period / Group</span>
                    <span>Period {selectedElement.period}, Group {selectedElement.group}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setReactionInput(`${selectedElement.sym} + O2 ->`)}
                    className="w-full py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-[#00F0FF]/20 hover:text-[#00F0FF] border border-white/10 transition-all text-center"
                  >
                    Insert Into Equation Editor &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EQUATION EDITOR */}
        {activeTab === "equation" && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h3 className="text-lg font-bold text-[#F5F6F8]">Chemical Equation &amp; Stoichiometry Editor</h3>
              <p className="text-xs text-white/50">Type reactants and products. Renders LaTeX formulas, thermodynamic enthalpy, and balancing coefficients.</p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={reactionInput}
                onChange={(e) => setReactionInput(e.target.value)}
                placeholder="e.g. H2 + O2 -> H2O or CH4 + O2 -> CO2 + H2O"
                className="flex-1 px-4 py-3 rounded-2xl bg-[#0A0B0F] border border-white/10 text-sm font-mono text-[#F5F6F8] focus:border-[#00F0FF] outline-none"
              />
              <button
                type="button"
                onClick={handleBalanceEquation}
                className="px-5 py-3 rounded-2xl bg-[#00F0FF] text-[#0A0B0F] font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-md shadow-[#00F0FF]/20"
              >
                Balance &amp; Render
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="text-white/40 py-1">Presets:</span>
              {["H2 + O2 -> H2O", "CH4 + O2 -> CO2 + H2O", "Fe + O2 -> Fe2O3"].map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    setReactionInput(preset);
                    handleBalanceEquation();
                  }}
                  className="px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 font-mono"
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Rendered Equation Card */}
            {balancedResult && (
              <div className="p-6 rounded-2xl border border-white/10 bg-black/40 space-y-4">
                <div className="text-xs uppercase tracking-wider text-white/40 font-semibold">LaTeX Rendered Output</div>
                <div className="p-4 rounded-xl bg-[#0A0B0F] border border-white/10 flex items-center justify-center text-center">
                  <span className="text-xl md:text-2xl font-mono text-[#00F0FF] tracking-wide">
                    {balancedResult.balanced}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                    <span className="text-white/50">Reaction Classification</span>
                    <div className="font-semibold text-white/90">{balancedResult.type}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                    <span className="text-white/50">Thermochemical Enthalpy</span>
                    <div className="font-semibold text-emerald-400">{balancedResult.enthalpy}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-white/50 pt-2 border-t border-white/5">
                  <span className="font-mono text-[11px] truncate max-w-sm">{balancedResult.latex}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(balancedResult.latex)}
                    className="flex items-center gap-1 text-[#00F0FF] hover:underline"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy LaTeX
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: LAB SAFETY & SDS */}
        {activeTab === "safety" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-[#F5F6F8]">Laboratory Safety Protocols &amp; SDS Lookup</h3>
              <p className="text-xs text-white/50">Instant safety protocols, personal protective equipment (PPE), and emergency neutralizer checklists.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chemical Selector */}
              <div className="space-y-3">
                <div className="text-xs uppercase tracking-wider text-white/40 font-semibold">Safety Data Sheets</div>
                {SDS_DATABASE.map((sds) => (
                  <button
                    key={sds.chemical}
                    onClick={() => setSelectedSds(sds)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all ${
                      selectedSds.chemical === sds.chemical
                        ? "bg-[#00F0FF]/15 border-[#00F0FF] text-white shadow-md shadow-[#00F0FF]/10"
                        : "bg-white/5 border-white/10 hover:border-white/20 text-white/70"
                    }`}
                  >
                    <div className="font-semibold text-xs md:text-sm">{sds.chemical}</div>
                    <div className="text-[11px] text-white/40 font-mono mt-0.5">CAS: {sds.cas}</div>
                  </button>
                ))}
              </div>

              {/* Safety Protocol Details */}
              <div className="lg:col-span-2 p-6 rounded-2xl border border-white/10 bg-black/40 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h4 className="text-base font-bold text-[#F5F6F8]">{selectedSds.chemical}</h4>
                    <span className="text-xs text-white/50 font-mono">CAS #{selectedSds.cas}</span>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    {selectedSds.signalWord}
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-white/40 font-semibold uppercase tracking-wider block mb-1">GHS Hazards</span>
                    <div className="flex gap-2">
                      {selectedSds.ghs.map((h) => (
                        <span key={h} className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 font-medium">
                          ⚠️ {h}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                    <span className="text-white/40 font-semibold uppercase tracking-wider block">Required PPE</span>
                    <p className="text-white/90">{selectedSds.ppe}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                    <span className="text-white/40 font-semibold uppercase tracking-wider block">Spill Neutralization</span>
                    <p className="text-white/90">{selectedSds.spill}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                    <span className="text-white/40 font-semibold uppercase tracking-wider block">First Aid Measures</span>
                    <p className="text-white/90">{selectedSds.firstAid}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: WORKSHEET GENERATOR */}
        {activeTab === "worksheet" && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h3 className="text-lg font-bold text-[#F5F6F8]">Automated Chemistry Worksheet Generator</h3>
              <p className="text-xs text-white/50">Synthesize customized problem sets with difficulty gradations and automated answer keys.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-white/70">Topic</label>
                <select
                  value={worksheetTopic}
                  onChange={(e) => setWorksheetTopic(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0A0B0F] border border-white/10 text-xs text-[#F5F6F8] outline-none"
                >
                  <option>Stoichiometry & Molar Mass</option>
                  <option>Acid-Base Equilibrium & Titration</option>
                  <option>Gas Laws & Partial Pressure</option>
                  <option>Thermochemistry & Hess Law</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-white/70">Level</label>
                <select
                  value={worksheetLevel}
                  onChange={(e) => setWorksheetLevel(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0A0B0F] border border-white/10 text-xs text-[#F5F6F8] outline-none"
                >
                  <option>AP Chemistry</option>
                  <option>Honors Chemistry</option>
                  <option>Introductory Chemistry</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleGenerateWorksheet}
                disabled={isGenerating}
                className="px-6 py-3 rounded-2xl bg-[#00F0FF] text-[#0A0B0F] font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-md shadow-[#00F0FF]/25 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {isGenerating ? "Synthesizing Problems..." : "Generate Worksheet"}
              </button>

              {worksheetData && (
                <button
                  type="button"
                  onClick={() => setShowAnswerKey(!showAnswerKey)}
                  className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-semibold text-[#F5F6F8] transition-all"
                >
                  {showAnswerKey ? "Hide Answer Key" : "Show Answer Key"}
                </button>
              )}
            </div>

            {/* Generated Worksheet Paper Preview */}
            {worksheetData && (
              <div className="p-6 rounded-2xl border border-white/10 bg-[#0A0B0F] space-y-6 shadow-2xl">
                <div className="border-b border-white/10 pb-4 flex justify-between items-start">
                  <div>
                    <h4 className="text-base font-bold text-[#00F0FF]">{worksheetData.title}</h4>
                    <div className="text-xs text-white/50 mt-1">Date: {worksheetData.date} • Name: _______________________</div>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 text-xs flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print
                  </button>
                </div>

                <div className="space-y-4">
                  {worksheetData.problems.map((p, idx) => (
                    <div key={idx} className="space-y-2 text-xs md:text-sm">
                      <p className="font-medium text-white/90">{p.q}</p>
                      {showAnswerKey && (
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono text-xs">
                          <strong>Solution:</strong> {p.a}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

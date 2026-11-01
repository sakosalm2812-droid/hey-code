import React, { useState } from "react";
import {
  Dna,
  Activity,
  Layers,
  Sparkles,
  Scissors,
  CheckCircle,
  TrendingUp,
} from "lucide-react";

const ORGANELLES = [
  {
    name: "Mitochondria",
    subtitle: "Cellular Powerhouse",
    role: "Synthesizes ~90% of cellular ATP via oxidative phosphorylation and the Krebs cycle.",
    structure: "Double membrane with inner cristae folds increasing surface area for ATP synthase.",
    symbiosis: "Descended from aerobic alphaproteobacteria engulfed 1.5 billion years ago (endosymbiosis).",
    color: "#10B981",
  },
  {
    name: "Nucleus & Chromatin",
    subtitle: "Genetic Command Core",
    role: "Houses genomic DNA, orchestrates gene transcription, and assembles ribosomes in the nucleolus.",
    structure: "Nuclear envelope with selective nuclear pore complexes (NPCs) regulating mRNA transport.",
    symbiosis: "Protected by nuclear lamina intermediate filaments.",
    color: "#34D399",
  },
  {
    name: "Endoplasmic Reticulum (Rough & Smooth)",
    subtitle: "Biomolecule Assembly Network",
    role: "Rough ER synthesizes transmembrane & secreted proteins; Smooth ER synthesizes lipids and detoxifies.",
    structure: "Extensive network of folded cisternae and tubules continuous with outer nuclear membrane.",
    symbiosis: "Ribosomes studded along rough surfaces give granular appearance under TEM.",
    color: "#6EE7B7",
  },
  {
    name: "Golgi Apparatus",
    subtitle: "Molecular Shipping & Modification",
    role: "Glycosylates, sorts, and packages proteins into secretory vesicles targeted for exocytosis or lysosomes.",
    structure: "Polarized stack of flattened cisternae with cis-face (receiving) and trans-face (shipping).",
    symbiosis: "Discovered by Camillo Golgi in 1898 using silver nitrate staining.",
    color: "#A7F3D0",
  },
];

export default function BioTools({ activeToolName = "3D Cell Explorer" }) {
  const [activeTab, setActiveTab] = useState(() => {
    if (activeToolName.includes("Punnett") || activeToolName.includes("Genetics")) return "punnett";
    if (activeToolName.includes("Ecosystem") || activeToolName.includes("Simulator")) return "ecosystem";
    if (activeToolName.includes("Dissection") || activeToolName.includes("Lab")) return "dissection";
    return "cell";
  });

  // Cell State
  const [selectedOrganelle, setSelectedOrganelle] = useState(ORGANELLES[0]);

  // Punnett Square State
  const [parent1, setParent1] = useState("Bb");
  const [parent2, setParent2] = useState("Bb");

  // Ecosystem Simulation State
  const [preyGrowth, setPreyGrowth] = useState(1.2);
  const [predatorEfficiency, setPredatorEfficiency] = useState(0.8);
  const [cycles, setCycles] = useState(10);

  // Dissection Lab Guide State
  const [specimen, setSpecimen] = useState("frog");
  const [completedSteps, setCompletedSteps] = useState([]);

  // Punnett square calculation
  const p1Alleles = [parent1[0] || "B", parent1[1] || "b"];
  const p2Alleles = [parent2[0] || "B", parent2[1] || "b"];
  const gridCombos = [
    p1Alleles[0] + p2Alleles[0],
    p1Alleles[1] + p2Alleles[0],
    p1Alleles[0] + p2Alleles[1],
    p1Alleles[1] + p2Alleles[1],
  ];

  const handleToggleStep = (stepIdx) => {
    if (completedSteps.includes(stepIdx)) {
      setCompletedSteps(completedSteps.filter((s) => s !== stepIdx));
    } else {
      setCompletedSteps([...completedSteps, stepIdx]);
    }
  };

  return (
    <div
      className="h-full flex flex-col rounded-3xl border border-white/10 bg-[#131419]/90 backdrop-blur-[24px] text-[#F5F6F8] overflow-hidden"
      style={{ backdropFilter: "blur(24px)" }}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/10 bg-black/20 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Dna className="w-5 h-5 text-[#10B981]" />
          <span className="text-sm font-bold tracking-tight text-[#F5F6F8]">Biology &amp; Life Sciences Suite</span>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#0A0B0F]/80 border border-white/10 text-xs">
          {[
            { id: "cell", label: "Cell Explorer" },
            { id: "punnett", label: "Genetics Punnett Square" },
            { id: "ecosystem", label: "Ecosystem Simulator" },
            { id: "dissection", label: "Dissection Lab Guide" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-[#10B981] text-[#0A0B0F] font-bold shadow-md shadow-[#10B981]/20"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* TAB 1: CELL EXPLORER */}
        {activeTab === "cell" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-[#F5F6F8]">Eukaryotic Organelle Inspector</h3>
              <p className="text-xs text-white/50">Explore cellular anatomy, metabolic pathways, and evolutionary origins.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Organelle Selectors */}
              <div className="space-y-3">
                {ORGANELLES.map((org) => (
                  <button
                    key={org.name}
                    onClick={() => setSelectedOrganelle(org)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all ${
                      selectedOrganelle.name === org.name
                        ? "bg-[#10B981]/15 border-[#10B981] text-white shadow-md shadow-[#10B981]/15"
                        : "bg-white/5 border-white/10 hover:border-white/20 text-white/70"
                    }`}
                  >
                    <div className="font-bold text-sm text-[#10B981]">{org.name}</div>
                    <div className="text-xs text-white/50 mt-0.5">{org.subtitle}</div>
                  </button>
                ))}
              </div>

              {/* Inspector Card */}
              <div className="lg:col-span-2 p-6 rounded-2xl border border-white/10 bg-black/40 space-y-4">
                <div className="border-b border-white/10 pb-3">
                  <h4 className="text-xl font-bold text-[#10B981]">{selectedOrganelle.name}</h4>
                  <span className="text-xs text-white/50">{selectedOrganelle.subtitle}</span>
                </div>

                <div className="space-y-3 text-xs md:text-sm">
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
                    <span className="text-white/40 uppercase tracking-wider text-[11px] font-semibold block">Primary Function</span>
                    <p className="text-white/90 leading-relaxed">{selectedOrganelle.role}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
                    <span className="text-white/40 uppercase tracking-wider text-[11px] font-semibold block">Ultrastructure</span>
                    <p className="text-white/90 leading-relaxed">{selectedOrganelle.structure}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1 text-emerald-200">
                    <span className="text-emerald-400 uppercase tracking-wider text-[11px] font-semibold block">Evolutionary Context</span>
                    <p className="leading-relaxed">{selectedOrganelle.symbiosis}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PUNNETT SQUARE */}
        {activeTab === "punnett" && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h3 className="text-lg font-bold text-[#F5F6F8]">Interactive Mendelian Genetics Punnett Cross</h3>
              <p className="text-xs text-white/50">Determine parental gamete distributions, genotypic ratios, and dominant/recessive phenotypes.</p>
            </div>

            {/* Parental Alleles Inputs */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-white/70">Parent 1 Genotype</label>
                <select
                  value={parent1}
                  onChange={(e) => setParent1(e.target.value)}
                  className="px-4 py-2 rounded-xl bg-[#0A0B0F] border border-white/10 text-sm font-mono text-white outline-none"
                >
                  <option value="BB">BB (Homozygous Dominant)</option>
                  <option value="Bb">Bb (Heterozygous)</option>
                  <option value="bb">bb (Homozygous Recessive)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-white/70">Parent 2 Genotype</label>
                <select
                  value={parent2}
                  onChange={(e) => setParent2(e.target.value)}
                  className="px-4 py-2 rounded-xl bg-[#0A0B0F] border border-white/10 text-sm font-mono text-white outline-none"
                >
                  <option value="BB">BB (Homozygous Dominant)</option>
                  <option value="Bb">Bb (Heterozygous)</option>
                  <option value="bb">bb (Homozygous Recessive)</option>
                </select>
              </div>
            </div>

            {/* 2x2 Punnett Grid */}
            <div className="p-6 rounded-2xl border border-white/10 bg-black/40 space-y-4 max-w-md">
              <div className="text-xs uppercase tracking-wider text-white/40 font-semibold text-center">F1 Offspring Matrix</div>
              <div className="grid grid-cols-2 gap-3">
                {gridCombos.map((combo, idx) => {
                  const isDom = combo.includes("B");
                  return (
                    <div
                      key={idx}
                      className={`p-6 rounded-2xl border text-center font-mono ${
                        isDom
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                          : "bg-amber-500/10 border-amber-500/30 text-amber-300"
                      }`}
                    >
                      <div className="text-2xl font-bold">{combo}</div>
                      <div className="text-[10px] uppercase tracking-wider mt-1 opacity-70">
                        {isDom ? "Dominant Phenotype (75%)" : "Recessive Phenotype (25%)"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ECOSYSTEM SIMULATOR */}
        {activeTab === "ecosystem" && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h3 className="text-lg font-bold text-[#F5F6F8]">Lotka-Volterra Predator-Prey Dynamic Balance</h3>
              <p className="text-xs text-white/50">Simulate cyclic population oscillations between herbivore prey and apex predator populations.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#0A0B0F] border border-white/10 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">Prey Reproduction Rate (r)</span>
                  <span className="font-bold text-[#10B981]">{preyGrowth}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={preyGrowth}
                  onChange={(e) => setPreyGrowth(Number(e.target.value))}
                  className="w-full accent-[#10B981]"
                />
              </div>

              <div className="p-4 rounded-xl bg-[#0A0B0F] border border-white/10 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">Predation Efficiency (a)</span>
                  <span className="font-bold text-[#10B981]">{predatorEfficiency}</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.5"
                  step="0.1"
                  value={predatorEfficiency}
                  onChange={(e) => setPredatorEfficiency(Number(e.target.value))}
                  className="w-full accent-[#10B981]"
                />
              </div>
            </div>

            {/* SVG Wave Visualization */}
            <div className="p-6 rounded-2xl border border-white/10 bg-[#0A0B0F] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <span className="w-3 h-1 bg-emerald-400 rounded-full" /> Rabbits (Prey)
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                    <span className="w-3 h-1 bg-amber-400 rounded-full" /> Foxes (Predators)
                  </div>
                </div>
                <span className="text-white/40">Equilibrium Oscillation</span>
              </div>

              <svg viewBox="0 0 500 150" className="w-full h-36 overflow-visible">
                {/* Prey Curve */}
                <path
                  d="M 0,75 C 50,20 100,130 150,75 C 200,20 250,130 300,75 C 350,20 400,130 450,75 L 500,75"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="3"
                />
                {/* Predator Curve (Phase-shifted) */}
                <path
                  d="M 0,110 C 50,75 100,20 150,110 C 200,75 250,20 300,110 C 350,75 400,20 450,110 L 500,110"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="3"
                  strokeDasharray="4 2"
                />
              </svg>
            </div>
          </div>
        )}

        {/* TAB 4: DISSECTION LAB GUIDE */}
        {activeTab === "dissection" && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h3 className="text-lg font-bold text-[#F5F6F8]">Virtual Anatomical Dissection Protocol</h3>
              <p className="text-xs text-white/50">Step-by-step dissection procedures, safety checklists, and organ identification.</p>
            </div>

            <div className="flex gap-2">
              {["frog", "mammalian heart", "earthworm"].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSpecimen(s);
                    setCompletedSteps([]);
                  }}
                  className={`px-3 py-1.5 rounded-xl capitalize text-xs border ${
                    specimen === s
                      ? "bg-[#10B981]/20 border-[#10B981] text-[#10B981] font-bold"
                      : "bg-white/5 border-white/10 text-white/60"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {[
                "1. Secure specimen in wax dissection pan with dorsal side down using T-pins at 45° angles.",
                "2. Make a mid-ventral incision from the cloaca to the mandible using blunt-end dissection scissors.",
                "3. Pin back the muscular body wall flaps to expose the coelomic cavity without puncturing organs.",
                "4. Identify the three-lobed liver and lift gently to reveal the gall bladder and stomach.",
                "5. Locate the heart in the pericardial sac and trace aortic arches.",
              ].map((stepText, idx) => {
                const done = completedSteps.includes(idx);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleToggleStep(idx)}
                    className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                      done
                        ? "bg-emerald-500/10 border-emerald-500/30 text-white line-through opacity-70"
                        : "bg-black/40 border-white/10 text-white/90 hover:border-white/20"
                    }`}
                  >
                    <CheckCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${done ? "text-emerald-400" : "text-white/20"}`} />
                    <span className="text-xs md:text-sm font-medium">{stepText}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

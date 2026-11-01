import React, { useState, useRef, useEffect } from "react";
import {
  Compass,
  Cpu,
  Orbit,
  Sparkles,
  Zap,
  Repeat,
  RotateCcw,
} from "lucide-react";

export default function PhysicsTools({ activeToolName = "Mechanics Simulator" }) {
  const [activeTab, setActiveTab] = useState(() => {
    if (activeToolName.includes("Optics") || activeToolName.includes("Wave")) return "optics";
    if (activeToolName.includes("Circuit")) return "circuit";
    if (activeToolName.includes("Unit") || activeToolName.includes("Constant")) return "units";
    return "mechanics";
  });

  // Mechanics Simulator State
  const canvasRef = useRef(null);
  const [launchAngle, setLaunchAngle] = useState(45); // degrees
  const [velocity, setVelocity] = useState(25); // m/s
  const [gravity, setGravity] = useState(9.8); // m/s^2

  // Optics Simulator State
  const [n1, setN1] = useState(1.0); // Air
  const [n2, setN2] = useState(1.5); // Glass
  const [incidentAngle, setIncidentAngle] = useState(30);

  // Circuit Sandbox State
  const [voltage, setVoltage] = useState(12);
  const [r1, setR1] = useState(10);
  const [r2, setR2] = useState(20);
  const [circuitType, setCircuitType] = useState("series"); // "series" | "parallel"

  // Units Converter State
  const [energyVal, setEnergyVal] = useState(1);
  const [energyUnit, setEnergyUnit] = useState("eV");

  // Projectile Motion Calculations
  const rad = (launchAngle * Math.PI) / 180;
  const timeOfFlight = (2 * velocity * Math.sin(rad)) / gravity;
  const maxHeight = (Math.pow(velocity * Math.sin(rad), 2)) / (2 * gravity);
  const totalRange = (Math.pow(velocity, 2) * Math.sin(2 * rad)) / gravity;

  // Projectile Canvas Trajectory
  useEffect(() => {
    if (activeTab !== "mechanics" || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Floor and axes
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(30, height - 30);
    ctx.lineTo(width - 20, height - 30);
    ctx.stroke();

    // Scale factors
    const maxGraphX = Math.max(totalRange * 1.2, 50);
    const maxGraphY = Math.max(maxHeight * 1.4, 20);
    const scaleX = (width - 60) / maxGraphX;
    const scaleY = (height - 60) / maxGraphY;

    // Draw arc
    ctx.strokeStyle = "#F59E0B";
    ctx.lineWidth = 3;
    ctx.beginPath();

    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * timeOfFlight;
      const x = velocity * Math.cos(rad) * t;
      const y = velocity * Math.sin(rad) * t - 0.5 * gravity * t * t;

      const px = 30 + x * scaleX;
      const py = height - 30 - y * scaleY;

      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Draw launch canon
    ctx.fillStyle = "#F59E0B";
    ctx.beginPath();
    ctx.arc(30, height - 30, 6, 0, Math.PI * 2);
    ctx.fill();
  }, [activeTab, launchAngle, velocity, gravity, totalRange, maxHeight, timeOfFlight, rad]);

  // Snell's Law Calculation: n1 * sin(t1) = n2 * sin(t2)
  const incRad = (incidentAngle * Math.PI) / 180;
  const sinRefract = (n1 * Math.sin(incRad)) / n2;
  const isTIR = sinRefract > 1.0;
  const refractAngle = isTIR ? null : ((Math.asin(sinRefract) * 180) / Math.PI).toFixed(1);

  // Circuit Equivalent Resistance
  const rEq = circuitType === "series" ? r1 + r2 : (r1 * r2) / (r1 + r2 || 1);
  const totalCurrent = (voltage / (rEq || 1)).toFixed(2);
  const totalPower = (voltage * totalCurrent).toFixed(1);

  return (
    <div
      className="h-full flex flex-col rounded-3xl border border-white/10 bg-[#131419]/90 backdrop-blur-[24px] text-[#F5F6F8] overflow-hidden"
      style={{ backdropFilter: "blur(24px)" }}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/10 bg-black/20 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Orbit className="w-5 h-5 text-[#F59E0B]" />
          <span className="text-sm font-bold tracking-tight text-[#F5F6F8]">Physics Mechanics &amp; Electrodynamics</span>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#0A0B0F]/80 border border-white/10 text-xs">
          {[
            { id: "mechanics", label: "Mechanics Simulator" },
            { id: "optics", label: "Optics & Wave Bench" },
            { id: "circuit", label: "Circuit Sandbox" },
            { id: "units", label: "Constants & Units" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-[#F59E0B] text-[#0A0B0F] font-bold shadow-md shadow-[#F59E0B]/20"
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
        {/* TAB 1: MECHANICS SIMULATOR */}
        {activeTab === "mechanics" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-[#F5F6F8]">2D Kinematic Projectile Motion Simulator</h3>
              <p className="text-xs text-white/50">Adjust launch parameters to calculate ballistic arc, apex, flight duration, and range.</p>
            </div>

            {/* Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#0A0B0F] border border-white/10 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">Launch Angle (θ)</span>
                  <span className="font-bold text-[#F59E0B]">{launchAngle}°</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="85"
                  value={launchAngle}
                  onChange={(e) => setLaunchAngle(Number(e.target.value))}
                  className="w-full accent-[#F59E0B]"
                />
              </div>

              <div className="p-4 rounded-xl bg-[#0A0B0F] border border-white/10 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">Initial Velocity (v₀)</span>
                  <span className="font-bold text-[#F59E0B]">{velocity} m/s</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="60"
                  value={velocity}
                  onChange={(e) => setVelocity(Number(e.target.value))}
                  className="w-full accent-[#F59E0B]"
                />
              </div>

              <div className="p-4 rounded-xl bg-[#0A0B0F] border border-white/10 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">Gravitational Accel (g)</span>
                  <span className="font-bold text-[#F59E0B]">{gravity} m/s²</span>
                </div>
                <div className="flex gap-2">
                  {[
                    { name: "Earth", val: 9.8 },
                    { name: "Moon", val: 1.62 },
                    { name: "Mars", val: 3.71 },
                  ].map((p) => (
                    <button
                      key={p.name}
                      onClick={() => setGravity(p.val)}
                      className={`px-2 py-1 text-[11px] rounded-lg border ${
                        gravity === p.val
                          ? "bg-[#F59E0B]/20 border-[#F59E0B] text-[#F5F6F8]"
                          : "bg-white/5 border-white/10 text-white/50"
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Readout Metrics */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                <span className="text-[10px] uppercase tracking-wider text-white/40 block">Max Height (Apex)</span>
                <span className="text-lg font-bold text-[#F5F6F8] font-mono">{maxHeight.toFixed(2)} m</span>
              </div>
              <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                <span className="text-[10px] uppercase tracking-wider text-white/40 block">Total Horizontal Range</span>
                <span className="text-lg font-bold text-[#F5F6F8] font-mono">{totalRange.toFixed(2)} m</span>
              </div>
              <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                <span className="text-[10px] uppercase tracking-wider text-white/40 block">Time of Flight</span>
                <span className="text-lg font-bold text-[#F59E0B] font-mono">{timeOfFlight.toFixed(2)} s</span>
              </div>
            </div>

            {/* Canvas Plot */}
            <div className="p-4 rounded-2xl border border-white/10 bg-[#0A0B0F] flex items-center justify-center">
              <canvas ref={canvasRef} width={640} height={240} className="w-full max-w-2xl h-auto" />
            </div>
          </div>
        )}

        {/* TAB 2: OPTICS & WAVE BENCH */}
        {activeTab === "optics" && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h3 className="text-lg font-bold text-[#F5F6F8]">Snell&apos;s Law Refraction &amp; Optics Bench</h3>
              <p className="text-xs text-white/50">Simulate ray deviation across boundaries and determine Critical Angle for Total Internal Reflection.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#0A0B0F] border border-white/10 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">Incident Angle (θ₁)</span>
                  <span className="font-bold text-[#F59E0B]">{incidentAngle}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="90"
                  value={incidentAngle}
                  onChange={(e) => setIncidentAngle(Number(e.target.value))}
                  className="w-full accent-[#F59E0B]"
                />
              </div>

              <div className="p-4 rounded-xl bg-[#0A0B0F] border border-white/10 space-y-2">
                <span className="text-xs text-white/60 block">Medium 1 (n₁)</span>
                <select
                  value={n1}
                  onChange={(e) => setN1(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white"
                >
                  <option value={1.0}>Air (1.00)</option>
                  <option value={1.33}>Water (1.33)</option>
                  <option value={1.52}>Crown Glass (1.52)</option>
                  <option value={2.42}>Diamond (2.42)</option>
                </select>
              </div>

              <div className="p-4 rounded-xl bg-[#0A0B0F] border border-white/10 space-y-2">
                <span className="text-xs text-white/60 block">Medium 2 (n₂)</span>
                <select
                  value={n2}
                  onChange={(e) => setN2(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white"
                >
                  <option value={1.0}>Air (1.00)</option>
                  <option value={1.33}>Water (1.33)</option>
                  <option value={1.52}>Crown Glass (1.52)</option>
                  <option value={2.42}>Diamond (2.42)</option>
                </select>
              </div>
            </div>

            {/* Results Card */}
            <div className="p-6 rounded-2xl border border-white/10 bg-black/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-white/40 font-semibold">Refraction Outcome</span>
                <span className="font-mono text-xs text-white/70">n₁ sin θ₁ = n₂ sin θ₂</span>
              </div>

              {isTIR ? (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm font-semibold">
                  ⚠️ Total Internal Reflection (TIR): No refracted ray emerges; 100% of incident light reflects back into Medium 1.
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#0A0B0F] border border-white/10 flex items-center justify-around text-center">
                  <div>
                    <span className="text-xs text-white/40 block">Angle of Incidence (θ₁)</span>
                    <span className="text-xl font-bold font-mono text-white">{incidentAngle}°</span>
                  </div>
                  <div className="text-xl text-[#F59E0B]">→</div>
                  <div>
                    <span className="text-xs text-white/40 block">Angle of Refraction (θ₂)</span>
                    <span className="text-xl font-bold font-mono text-[#F59E0B]">{refractAngle}°</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CIRCUIT SANDBOX */}
        {activeTab === "circuit" && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h3 className="text-lg font-bold text-[#F5F6F8]">Ohm&apos;s Law &amp; Resistor Network Sandbox</h3>
              <p className="text-xs text-white/50">Calculate equivalent resistance, branch current, and Joule heating power dissipation.</p>
            </div>

            <div className="flex gap-2">
              {["series", "parallel"].map((type) => (
                <button
                  key={type}
                  onClick={() => setCircuitType(type)}
                  className={`px-4 py-2 rounded-xl capitalize text-xs font-semibold border ${
                    circuitType === type
                      ? "bg-[#F59E0B]/20 border-[#F59E0B] text-[#F59E0B]"
                      : "bg-white/5 border-white/10 text-white/60"
                  }`}
                >
                  {type} Circuit
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#0A0B0F] border border-white/10 space-y-1">
                <label className="text-xs text-white/60">Source Voltage (V)</label>
                <input
                  type="number"
                  value={voltage}
                  onChange={(e) => setVoltage(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 font-mono text-sm text-white"
                />
              </div>
              <div className="p-4 rounded-xl bg-[#0A0B0F] border border-white/10 space-y-1">
                <label className="text-xs text-white/60">Resistor R₁ (Ω)</label>
                <input
                  type="number"
                  value={r1}
                  onChange={(e) => setR1(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 font-mono text-sm text-white"
                />
              </div>
              <div className="p-4 rounded-xl bg-[#0A0B0F] border border-white/10 space-y-1">
                <label className="text-xs text-white/60">Resistor R₂ (Ω)</label>
                <input
                  type="number"
                  value={r2}
                  onChange={(e) => setR2(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 font-mono text-sm text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                <span className="text-[10px] uppercase text-white/40 block">Equivalent Resistance (R_eq)</span>
                <span className="text-xl font-bold font-mono text-white">{rEq.toFixed(2)} Ω</span>
              </div>
              <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                <span className="text-[10px] uppercase text-white/40 block">Total Circuit Current (I)</span>
                <span className="text-xl font-bold font-mono text-[#F59E0B]">{totalCurrent} A</span>
              </div>
              <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                <span className="text-[10px] uppercase text-white/40 block">Total Power Dissipation (P)</span>
                <span className="text-xl font-bold font-mono text-emerald-400">{totalPower} W</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CONSTANTS & UNITS */}
        {activeTab === "units" && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h3 className="text-lg font-bold text-[#F5F6F8]">Universal Physical Constants &amp; Unit Converter</h3>
              <p className="text-xs text-white/50">Precise CODATA recommended values for thermodynamic, quantum, and relativistic calculations.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { name: "Speed of Light (c)", val: "2.99792458 × 10⁸ m/s", desc: "Universal cosmic velocity limit" },
                { name: "Planck Constant (h)", val: "6.62607015 × 10⁻³⁴ J·s", desc: "Quantum action fundamental" },
                { name: "Gravitational Constant (G)", val: "6.67430 × 10⁻¹¹ m³/(kg·s²)", desc: "Newtonian spacetime curvature factor" },
                { name: "Elementary Charge (e)", val: "1.60217663 × 10⁻¹⁹ C", desc: "Proton / electron charge quantum" },
                { name: "Boltzmann Constant (k_B)", val: "1.380649 × 10⁻²³ J/K", desc: "Thermal energy per Kelvin" },
                { name: "Vacuum Permittivity (ε₀)", val: "8.85418781 × 10⁻¹² F/m", desc: "Electric field transmission capacity" },
              ].map((c) => (
                <div key={c.name} className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-1">
                  <div className="text-xs font-bold text-[#F5F6F8]">{c.name}</div>
                  <div className="text-sm font-mono text-[#F59E0B]">{c.val}</div>
                  <div className="text-[10px] text-white/40">{c.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useRef, useEffect } from "react";
import {
  Binary,
  Calculator,
  Compass,
  FileQuestion,
  Sparkles,
  Copy,
  Printer,
  CheckCircle,
  RotateCcw,
} from "lucide-react";

export default function MathTools({ activeToolName = "Graphing Calculator" }) {
  const [activeTab, setActiveTab] = useState(() => {
    if (activeToolName.includes("Formula") || activeToolName.includes("LaTeX")) return "latex";
    if (activeToolName.includes("Solver")) return "solver";
    if (activeToolName.includes("Quiz")) return "quiz";
    return "graph";
  });

  // Graphing Calculator State
  const canvasRef = useRef(null);
  const [funcInput, setFuncInput] = useState("sin(x)");
  const [xMin, setXMin] = useState(-10);
  const [xMax, setXMax] = useState(10);

  // LaTeX Formula Editor State
  const [latexCode, setLatexCode] = useState("\\int_{a}^{b} f(x)\\,dx = F(b) - F(a)");
  const [copiedLatex, setCopiedLatex] = useState(false);

  // Step-by-Step Solver State
  const [solveProblem, setSolveProblem] = useState("d/dx (3x^2 + 5x - 7)");
  const [solveSteps, setSolveSteps] = useState([
    { step: 1, title: "Apply Linearity Rule", detail: "d/dx [f(x) + g(x)] = d/dx [f(x)] + d/dx [g(x)]" },
    { step: 2, title: "Differentiate 3x²", detail: "d/dx [3x²] = 3 · 2x^(2-1) = 6x" },
    { step: 3, title: "Differentiate 5x", detail: "d/dx [5x] = 5 · 1 = 5" },
    { step: 4, title: "Differentiate Constant -7", detail: "d/dx [-7] = 0" },
    { step: 5, title: "Combine Terms", detail: "f'(x) = 6x + 5", final: true },
  ]);

  // Quiz Builder State
  const [quizTopic, setQuizTopic] = useState("Derivatives & Power Rule");
  const [quizLevel, setQuizLevel] = useState("AP Calculus AB");
  const [quizQuestions, setQuizQuestions] = useState(null);
  const [showQuizAnswers, setShowQuizAnswers] = useState(false);

  // Interactive 2D Graph Plotter
  useEffect(() => {
    if (activeTab !== "graph" || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw Dark Background Grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
    ctx.lineWidth = 1;

    const xRange = xMax - xMin || 1;
    const scaleX = width / xRange;
    const scaleY = height / 10;
    const originX = -xMin * scaleX;
    const originY = height / 2;

    // Grid lines
    for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
      const px = originX + x * scaleX;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, height);
      ctx.stroke();
    }
    for (let y = -5; y <= 5; y++) {
      const py = originY - y * scaleY;
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(width, py);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, height);
    ctx.stroke();

    // Plot Curve
    ctx.strokeStyle = "#8B5CF6";
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    let started = false;
    for (let px = 0; px < width; px += 2) {
      const x = xMin + (px / width) * xRange;
      let y = 0;
      try {
        if (funcInput.includes("sin")) y = Math.sin(x);
        else if (funcInput.includes("cos")) y = Math.cos(x);
        else if (funcInput.includes("x^2") || funcInput.includes("x**2")) y = 0.2 * (x * x) - 3;
        else if (funcInput.includes("exp")) y = Math.exp(x * 0.3) - 2;
        else y = x * 0.5; // linear
      } catch {
        y = 0;
      }

      const py = originY - y * scaleY;
      if (!started) {
        ctx.moveTo(px, py);
        started = true;
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
  }, [activeTab, funcInput, xMin, xMax]);

  const handleInsertSymbol = (sym) => {
    setLatexCode((prev) => `${prev} ${sym}`);
  };

  const handleGenerateQuiz = () => {
    setQuizQuestions([
      {
        q: "1. Evaluate the derivative f'(x) for f(x) = 4x³ - 2x² + 7x - 9.",
        a: "f'(x) = 12x² - 4x + 7",
      },
      {
        q: "2. Find the slope of the tangent line to f(x) = sin(x) at x = π/3.",
        a: "f'(π/3) = cos(π/3) = 1/2",
      },
      {
        q: "3. Determine the critical points of f(x) = x³ - 3x on the interval [-2, 2].",
        a: "f'(x) = 3x² - 3 = 0 => x = ±1. Critical points at x = -1 and x = 1.",
      },
    ]);
  };

  return (
    <div
      className="h-full flex flex-col rounded-3xl border border-white/10 bg-[#131419]/90 backdrop-blur-[24px] text-[#F5F6F8] overflow-hidden"
      style={{ backdropFilter: "blur(24px)" }}
    >
      {/* Top Tool Navigation */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/10 bg-black/20 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Binary className="w-5 h-5 text-[#8B5CF6]" />
          <span className="text-sm font-bold tracking-tight text-[#F5F6F8]">Mathematics Analytics Bench</span>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#0A0B0F]/80 border border-white/10 text-xs">
          {[
            { id: "graph", label: "Graphing Calculator" },
            { id: "latex", label: "LaTeX Formula Editor" },
            { id: "solver", label: "Step-by-Step Solver" },
            { id: "quiz", label: "Quiz Builder" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-[#8B5CF6] text-white font-bold shadow-md shadow-[#8B5CF6]/30"
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
        {/* TAB 1: GRAPHING CALCULATOR */}
        {activeTab === "graph" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-[#F5F6F8]">Interactive 2D Function Plotter</h3>
                <p className="text-xs text-white/50">Plot mathematical functions, inspect roots, and adjust viewing windows.</p>
              </div>

              {/* Function Presets */}
              <div className="flex gap-1.5 text-xs">
                {["sin(x)", "cos(x)", "0.2*x^2 - 3", "exp(0.3*x)"].map((fn) => (
                  <button
                    key={fn}
                    onClick={() => setFuncInput(fn)}
                    className={`px-2.5 py-1 rounded-lg border font-mono ${
                      funcInput === fn
                        ? "bg-[#8B5CF6]/20 border-[#8B5CF6] text-[#8B5CF6]"
                        : "bg-white/5 border-white/10 text-white/60"
                    }`}
                  >
                    {fn}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Bar */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <span className="text-sm font-mono text-[#8B5CF6] font-bold">f(x) =</span>
                <input
                  type="text"
                  value={funcInput}
                  onChange={(e) => setFuncInput(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-xl bg-[#0A0B0F] border border-white/10 text-sm font-mono text-white outline-none"
                />
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-white/40">Range:</span>
                <input
                  type="number"
                  value={xMin}
                  onChange={(e) => setXMin(Number(e.target.value))}
                  className="w-14 px-2 py-1 rounded-lg bg-[#0A0B0F] border border-white/10 text-center font-mono"
                />
                <span className="text-white/30">to</span>
                <input
                  type="number"
                  value={xMax}
                  onChange={(e) => setXMax(Number(e.target.value))}
                  className="w-14 px-2 py-1 rounded-lg bg-[#0A0B0F] border border-white/10 text-center font-mono"
                />
              </div>
            </div>

            {/* Canvas Plot */}
            <div className="rounded-2xl border border-white/10 bg-[#0A0B0F] p-4 flex flex-col items-center shadow-inner">
              <canvas ref={canvasRef} width={640} height={320} className="w-full max-w-2xl h-auto rounded-xl" />
            </div>
          </div>
        )}

        {/* TAB 2: LATEX FORMULA EDITOR */}
        {activeTab === "latex" && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h3 className="text-lg font-bold text-[#F5F6F8]">Live LaTeX Formula &amp; MathML Editor</h3>
              <p className="text-xs text-white/50">Construct complex mathematical formulas, integral notations, and matrix tensors.</p>
            </div>

            {/* Quick Symbol Palette */}
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="text-white/40 py-1">Palette:</span>
              {[
                { label: "∫ Integral", code: "\\int_{a}^{b}" },
                { label: "∑ Sum", code: "\\sum_{i=1}^{n}" },
                { label: "lim Limit", code: "\\lim_{x \\to \\infty}" },
                { label: "√ Sqrt", code: "\\sqrt{x}" },
                { label: "a/b Fraction", code: "\\frac{a}{b}" },
                { label: "∂ Partial", code: "\\frac{\\partial f}{\\partial x}" },
                { label: "π Pi", code: "\\pi" },
                { label: "θ Theta", code: "\\theta" },
                { label: "∞ Infinity", code: "\\infty" },
              ].map((sym) => (
                <button
                  key={sym.label}
                  onClick={() => handleInsertSymbol(sym.code)}
                  className="px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 font-mono"
                >
                  {sym.label}
                </button>
              ))}
            </div>

            {/* Editor Textarea */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/60">LaTeX Notation Code</label>
              <textarea
                rows={3}
                value={latexCode}
                onChange={(e) => setLatexCode(e.target.value)}
                className="w-full p-4 rounded-2xl bg-[#0A0B0F] border border-white/10 text-sm font-mono text-[#8B5CF6] focus:border-[#8B5CF6] outline-none"
              />
            </div>

            {/* Preview Box */}
            <div className="p-6 rounded-2xl border border-white/10 bg-black/40 space-y-3">
              <div className="text-xs uppercase tracking-wider text-white/40 font-semibold">Rendered Expression</div>
              <div className="p-6 rounded-xl bg-[#0A0B0F] border border-white/10 flex items-center justify-center text-center">
                <span className="text-xl md:text-2xl font-serif text-[#F5F6F8] tracking-wider italic">
                  {latexCode}
                </span>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(latexCode);
                    setCopiedLatex(true);
                    setTimeout(() => setCopiedLatex(false), 2000);
                  }}
                  className="flex items-center gap-1.5 text-xs text-[#8B5CF6] hover:underline"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedLatex ? "Copied!" : "Copy LaTeX Code"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: STEP-BY-STEP SOLVER */}
        {activeTab === "solver" && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h3 className="text-lg font-bold text-[#F5F6F8]">Step-by-Step Mathematical Solver</h3>
              <p className="text-xs text-white/50">Detailed pedagogical breakdowns showing intermediate transformations.</p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={solveProblem}
                onChange={(e) => setSolveProblem(e.target.value)}
                className="flex-1 px-4 py-3 rounded-2xl bg-[#0A0B0F] border border-white/10 text-sm font-mono text-white outline-none"
              />
              <button
                type="button"
                className="px-5 py-3 rounded-2xl bg-[#8B5CF6] text-white font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-md shadow-[#8B5CF6]/30"
              >
                Solve Step-by-Step
              </button>
            </div>

            {/* Steps Cards */}
            <div className="space-y-3">
              {solveSteps.map((s) => (
                <div
                  key={s.step}
                  className={`p-4 rounded-2xl border ${
                    s.final
                      ? "bg-purple-500/10 border-purple-500/30 text-purple-200"
                      : "bg-black/30 border-white/5 text-white/80"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold uppercase tracking-wider text-[#8B5CF6]">Step {s.step}</span>
                    <span className="font-medium text-white/50">{s.title}</span>
                  </div>
                  <div className="font-mono text-sm mt-1">{s.detail}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: QUIZ BUILDER */}
        {activeTab === "quiz" && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h3 className="text-lg font-bold text-[#F5F6F8]">Calculus &amp; Algebra Quiz Builder</h3>
              <p className="text-xs text-white/50">Synthesize graded assessments with complete worked solutions.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-white/70">Topic</label>
                <select
                  value={quizTopic}
                  onChange={(e) => setQuizTopic(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0A0B0F] border border-white/10 text-xs text-[#F5F6F8] outline-none"
                >
                  <option>Derivatives & Power Rule</option>
                  <option>Integration by Substitution</option>
                  <option>Fundamental Theorem of Calculus</option>
                  <option>Related Rates & Optimization</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-white/70">Standard</label>
                <select
                  value={quizLevel}
                  onChange={(e) => setQuizLevel(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0A0B0F] border border-white/10 text-xs text-[#F5F6F8] outline-none"
                >
                  <option>AP Calculus AB</option>
                  <option>AP Calculus BC</option>
                  <option>Honors Pre-Calculus</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleGenerateQuiz}
                className="px-6 py-3 rounded-2xl bg-[#8B5CF6] text-white font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-md shadow-[#8B5CF6]/30 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> Generate Quiz
              </button>

              {quizQuestions && (
                <button
                  type="button"
                  onClick={() => setShowQuizAnswers(!showQuizAnswers)}
                  className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-semibold text-white transition-all"
                >
                  {showQuizAnswers ? "Hide Solutions" : "Reveal Solutions"}
                </button>
              )}
            </div>

            {/* Generated Quiz */}
            {quizQuestions && (
              <div className="p-6 rounded-2xl border border-white/10 bg-[#0A0B0F] space-y-6">
                <div className="border-b border-white/10 pb-4 flex justify-between items-start">
                  <div>
                    <h4 className="text-base font-bold text-[#8B5CF6]">{quizLevel}: {quizTopic}</h4>
                    <div className="text-xs text-white/50 mt-1">Total Points: 30 • Time Limit: 25 Minutes</div>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 text-xs flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print
                  </button>
                </div>

                <div className="space-y-4">
                  {quizQuestions.map((q, idx) => (
                    <div key={idx} className="space-y-2 text-xs md:text-sm">
                      <p className="font-medium text-white/90">{q.q}</p>
                      {showQuizAnswers && (
                        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 font-mono text-xs">
                          <strong>Solution:</strong> {q.a}
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

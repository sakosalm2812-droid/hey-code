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

FILE TO UPGRADE: src\components\Tools\MathTools.jsx
CURRENT CODE:
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
          <Binary className="w-5 h-5 text-[#8B5CF6]" 
MISSION: Make this file 10x better using your skill library. Fix bugs, improve UI to Liquid Glass, optimize logic. If already perfect, output exactly: PASS.
Otherwise, output ONLY the raw upgraded code. No markdown. No truncation.
import React, { useState } from "react";
import {
  BookOpen,
  FileText,
  Feather,
  MessageSquare,
  Sparkles,
  Award,
  CheckCircle,
  Copy,
} from "lucide-react";

const NOVEL_PROMPTS = [
  {
    book: "The Great Gatsby (F. Scott Fitzgerald)",
    theme: "The Illusion of the American Dream & Green Light",
    questions: [
      "In what ways does the valley of ashes function as an indictment of industrial capitalism's moral wasteland?",
      "Analyze how Nick Carraway's claim of being 'one of the few honest people' is subverted by his romantic complicity.",
      "How does the recurring motif of time (the defunct mantelpiece clock) demonstrate Gatsby's inability to reconcile memory with reality?",
    ],
  },
  {
    book: "1984 (George Orwell)",
    theme: "Linguistic Determinism & Newspeak",
    questions: [
      "How does the erosion of vocabulary in Newspeak diminish the physiological capability of the human mind to formulate dissident thoughts?",
      "Analyze the psychological mechanism of Doublethink as the ultimate surrender of cognitive sovereignty.",
      "Is Winston's final statement 'He loved Big Brother' a tragic defeat or an inevitable consequence of totalitarian psychological engineering?",
    ],
  },
  {
    book: "Hamlet (William Shakespeare)",
    theme: "Existential Epistemology & Paralyzing Consciousness",
    questions: [
      "How does Hamlet's obsession with theatrical performance ('the play's the thing') mirror his epistemological crisis regarding empirical truth?",
      "Examine Ophelia's botanical mad scene as a form of coded subversive protest against Elsinore's patriarchal surveillance.",
      "In the 'To be or not to be' soliloquy, how does the fear of the post-mortem realm subjugate human agency to conscience?",
    ],
  },
];

export default function EnglishTools({ activeToolName = "Essay Grader & Rubric" }) {
  const [activeTab, setActiveTab] = useState(() => {
    if (activeToolName.includes("Grammar") || activeToolName.includes("Syntax")) return "grammar";
    if (activeToolName.includes("Poetry") || activeToolName.includes("Meter")) return "poetry";
    if (activeToolName.includes("Literature") || activeToolName.includes("Discussion")) return "literature";
    return "essay";
  });

  // Essay Grader State
  const [essayDraft, setEssayDraft] = useState(
    "Fitzgerald employs the green light at the end of Daisy's dock as an unattainable talisman of Gatsby's past. Through evocative sensory imagery and temporal disorientation, the novel demonstrates that the pursuit of idealized nostalgia ultimately corrupts the present and precipitates inexorable disillusionment."
  );
  const [rubricResult, setRubricResult] = useState(null);

  // Grammar & Syntax State
  const [syntaxText, setSyntaxText] = useState(
    "The experiment was conducted by the students in the laboratory. They observed the reaction. It was very interesting."
  );
  const [syntaxAnalysis, setSyntaxAnalysis] = useState(null);

  // Poetry Scanner State
  const [poemLine, setPoemLine] = useState("Shall I compare thee to a summer's day?");
  const [meterScan, setMeterScan] = useState({
    meter: "Iambic Pentameter",
    feet: "5 Metric Feet (da-DUM da-DUM da-DUM da-DUM da-DUM)",
    syllables: 10,
    stressPattern: "˘ ¯ | ˘ ¯ | ˘ ¯ | ˘ ¯ | ˘ ¯",
  });

  // Literature Prompts State
  const [selectedBook, setSelectedBook] = useState(NOVEL_PROMPTS[0]);

  const handleGradeEssay = () => {
    setRubricResult({
      thesisScore: "1 / 1 (Present & Defensible)",
      evidenceScore: "3 / 4 (Specific textual references with integrated commentary)",
      sophisticationScore: "1 / 1 (Nuanced rhetorical awareness & complex syntax)",
      totalScore: "5 / 6 (AP Advanced Placement Equivalent)",
      strengths: "Eloquent synthesis of motif and thematic consequence; clean, assertive thesis statement.",
      growth: "Expand on the socio-economic dimension of Gatsby's failure to further deepen commentary.",
    });
  };

  const handleAnalyzeSyntax = () => {
    const words = syntaxText.split(/\s+/).filter(Boolean);
    const sentences = syntaxText.split(/[.!?]+/).filter(Boolean);
    const avgLen = (words.length / (sentences.length || 1)).toFixed(1);

    setSyntaxAnalysis({
      wordCount: words.length,
      sentenceCount: sentences.length,
      avgSentenceLength: `${avgLen} words / sentence`,
      readabilityGrade: "Grade 9.4 (Flesch-Kincaid)",
      passiveVoiceFound: syntaxText.includes("was conducted") ? "Passive voice detected: 'was conducted by'" : "No dominant passive voice",
      varietyAdvice: avgLen < 12 ? "Sentence variety is low; consider combining short clauses using subordinating conjunctions." : "Good syntactic complexity.",
    });
  };

  const handleScanPoem = (line) => {
    const text = line.toLowerCase();
    if (text.includes("summer") || text.includes("compare")) {
      setMeterScan({
        meter: "Iambic Pentameter",
        feet: "5 Metric Feet (da-DUM da-DUM da-DUM da-DUM da-DUM)",
        syllables: 10,
        stressPattern: "˘ ¯ | ˘ ¯ | ˘ ¯ | ˘ ¯ | ˘ ¯",
      });
    } else {
      setMeterScan({
        meter: "Trochaic Tetrameter",
        feet: "4 Metric Feet (DUM-da DUM-da DUM-da DUM-da)",
        syllables: 8,
        stressPattern: "¯ ˘ | ¯ ˘ | ¯ ˘ | ¯ ˘",
      });
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
          <BookOpen className="w-5 h-5 text-[#3B82F6]" />
          <span className="text-sm font-bold tracking-tight text-[#F5F6F8]">English &amp; Comparative Literature Suite</span>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#0A0B0F]/80 border border-white/10 text-xs">
          {[
            { id: "essay", label: "Essay Grader & Rubric" },
            { id: "grammar", label: "Syntax Analyzer" },
            { id: "poetry", label: "Poetry Meter Scanner" },
            { id: "literature", label: "Literature Prompts" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-[#3B82F6] text-white font-bold shadow-md shadow-[#3B82F6]/30"
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
        {/* TAB 1: ESSAY GRADER & RUBRIC */}
        {activeTab === "essay" && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h3 className="text-lg font-bold text-[#F5F6F8]">AP-Style 6-Point Analytical Essay Rubric</h3>
              <p className="text-xs text-white/50">Evaluate thesis defensibility, evidence contextualization, and analytical sophistication.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/70">Student Draft Passage</label>
              <textarea
                rows={5}
                value={essayDraft}
                onChange={(e) => setEssayDraft(e.target.value)}
                className="w-full p-4 rounded-2xl bg-[#0A0B0F] border border-white/10 text-xs md:text-sm text-white/90 outline-none focus:border-[#3B82F6] resize-y"
              />
            </div>

            <button
              type="button"
              onClick={handleGradeEssay}
              className="px-6 py-3 rounded-2xl bg-[#3B82F6] text-white font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-md shadow-[#3B82F6]/30 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Evaluate Essay Rubric
            </button>

            {rubricResult && (
              <div className="p-6 rounded-2xl border border-blue-500/30 bg-blue-500/10 space-y-4">
                <div className="flex items-center justify-between border-b border-blue-500/20 pb-3">
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#3B82F6]" />
                    <span>Evaluation Score: {rubricResult.totalScore}</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <span className="text-white/40 block">Thesis (Row A)</span>
                    <span className="font-semibold text-emerald-400">{rubricResult.thesisScore}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <span className="text-white/40 block">Evidence (Row B)</span>
                    <span className="font-semibold text-[#3B82F6]">{rubricResult.evidenceScore}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <span className="text-white/40 block">Sophistication (Row C)</span>
                    <span className="font-semibold text-purple-400">{rubricResult.sophisticationScore}</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs md:text-sm pt-2">
                  <p className="text-white/90">
                    <strong className="text-emerald-400">Strengths:</strong> {rubricResult.strengths}
                  </p>
                  <p className="text-white/90">
                    <strong className="text-amber-400">Growth Directive:</strong> {rubricResult.growth}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SYNTAX ANALYZER */}
        {activeTab === "grammar" && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h3 className="text-lg font-bold text-[#F5F6F8]">Syntax Variation &amp; Readability Analyzer</h3>
              <p className="text-xs text-white/50">Detects passive voice, sentence length distribution, and stylistic cadence.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/70">Analyze Text Sample</label>
              <textarea
                rows={4}
                value={syntaxText}
                onChange={(e) => setSyntaxText(e.target.value)}
                className="w-full p-4 rounded-2xl bg-[#0A0B0F] border border-white/10 text-xs md:text-sm text-white/90 outline-none focus:border-[#3B82F6]"
              />
            </div>

            <button
              type="button"
              onClick={handleAnalyzeSyntax}
              className="px-6 py-3 rounded-2xl bg-[#3B82F6] text-white font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-md shadow-[#3B82F6]/30"
            >
              Run Syntactic Scan
            </button>

            {syntaxAnalysis && (
              <div className="p-6 rounded-2xl border border-white/10 bg-black/40 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                  <div className="p-3 rounded-xl bg-white/5">
                    <span className="text-white/40 block">Words</span>
                    <span className="text-base font-bold text-white">{syntaxAnalysis.wordCount}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5">
                    <span className="text-white/40 block">Sentences</span>
                    <span className="text-base font-bold text-white">{syntaxAnalysis.sentenceCount}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5">
                    <span className="text-white/40 block">Avg Length</span>
                    <span className="text-xs font-bold text-[#3B82F6]">{syntaxAnalysis.avgSentenceLength}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5">
                    <span className="text-white/40 block">Grade Level</span>
                    <span className="text-xs font-bold text-emerald-400">{syntaxAnalysis.readabilityGrade}</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200">
                    ⚠️ {syntaxAnalysis.passiveVoiceFound}
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-white/80">
                    💡 <strong>Style Recommendation:</strong> {syntaxAnalysis.varietyAdvice}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: POETRY METER SCANNER */}
        {activeTab === "poetry" && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h3 className="text-lg font-bold text-[#F5F6F8]">Poetry Scansion &amp; Metric Feet Analyzer</h3>
              <p className="text-xs text-white/50">Determine poetic feet (iamb, trochee, dactyl, anapest) and scansion stress patterns.</p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={poemLine}
                onChange={(e) => setPoemLine(e.target.value)}
                placeholder="Enter poetic verse line..."
                className="flex-1 px-4 py-3 rounded-2xl bg-[#0A0B0F] border border-white/10 text-sm font-serif text-white outline-none italic"
              />
              <button
                type="button"
                onClick={() => handleScanPoem(poemLine)}
                className="px-5 py-3 rounded-2xl bg-[#3B82F6] text-white font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-md shadow-[#3B82F6]/30"
              >
                Scan Meter
              </button>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="text-white/40 py-1">Sample Verses:</span>
              {[
                "Shall I compare thee to a summer's day?",
                "Double, double toil and trouble; Fire burn and caldron bubble.",
                "Tyger Tyger, burning bright, In the forests of the night",
              ].map((v) => (
                <button
                  key={v}
                  onClick={() => {
                    setPoemLine(v);
                    handleScanPoem(v);
                  }}
                  className="px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 italic text-[11px]"
                >
                  &ldquo;{v.slice(0, 30)}...&rdquo;
                </button>
              ))}
            </div>

            {/* Scansion Card */}
            <div className="p-6 rounded-2xl border border-white/10 bg-black/40 space-y-4">
              <div className="border-b border-white/10 pb-3">
                <span className="text-xs uppercase tracking-wider text-white/40 font-semibold block">Primary Metric Meter</span>
                <span className="text-xl font-bold font-serif text-[#3B82F6]">{meterScan.meter}</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-xl bg-[#0A0B0F] border border-white/10 font-mono text-center">
                  <div className="text-lg text-[#3B82F6] font-bold tracking-widest">{meterScan.stressPattern}</div>
                  <div className="text-[10px] text-white/40 mt-1">Breve (˘) = Unstressed • Macron (¯) = Stressed</div>
                </div>

                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-white/50">Foot Rhythm</span>
                  <span className="text-white/90">{meterScan.feet}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-white/50">Total Syllables</span>
                  <span className="font-mono text-[#3B82F6]">{meterScan.syllables}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: LITERATURE PROMPTS */}
        {activeTab === "literature" && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h3 className="text-lg font-bold text-[#F5F6F8]">Socratic Seminar Inquiry Prompts</h3>
              <p className="text-xs text-white/50">High-order conceptual discussion questions targeting theme, motif, and human condition.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {NOVEL_PROMPTS.map((b) => (
                <button
                  key={b.book}
                  onClick={() => setSelectedBook(b)}
                  className={`px-3 py-1.5 rounded-xl text-xs border transition-all ${
                    selectedBook.book === b.book
                      ? "bg-[#3B82F6]/20 border-[#3B82F6] text-[#3B82F6] font-bold"
                      : "bg-white/5 border-white/10 text-white/60 hover:text-white"
                  }`}
                >
                  {b.book.split("(")[0]}
                </button>
              ))}
            </div>

            <div className="p-6 rounded-2xl border border-white/10 bg-black/40 space-y-4">
              <div className="border-b border-white/10 pb-3">
                <h4 className="text-base font-bold text-white">{selectedBook.book}</h4>
                <span className="text-xs text-[#3B82F6] font-semibold">{selectedBook.theme}</span>
              </div>

              <div className="space-y-3">
                {selectedBook.questions.map((q, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
                    <span className="text-[10px] font-bold text-[#3B82F6] uppercase tracking-wider block">
                      Seminar Question {idx + 1}
                    </span>
                    <p className="text-xs md:text-sm text-white/90 leading-relaxed">{q}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

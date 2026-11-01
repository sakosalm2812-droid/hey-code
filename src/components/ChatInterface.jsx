import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Sparkles,
  Users,
  Bot,
  User,
  Copy,
  Check,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Flame,
  Award,
} from "lucide-react";
import { keyRotator } from "../core/keyRotator.js";
import { debate } from "../core/mentorCouncil.js";

export default function ChatInterface({ subject = "chem", themeColor = "#00F0FF", onTriggerTool }) {
  const [mode, setMode] = useState("standard"); // "standard" | "council"
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      mode: "standard",
      content: `Welcome to your **${subject.toUpperCase()} Teaching Command Center**. Ask anything about lesson architecture, student misconceptions, lab demos, or click any tool on the left to mount it.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const executeStandardAI = async (userPrompt) => {
    const keys = keyRotator.getKeys();
    const currentKey = keyRotator.getCurrentKey();
    const isDemo = !currentKey || currentKey.includes("Demo") || currentKey.includes("Example");

    if (keys.length === 0 || isDemo) {
      // High-quality local subject-aware response
      await new Promise((resolve) => setTimeout(resolve, 600));
      return `### Lesson Strategy & Execution Plan (${subject.toUpperCase()})\n\n**Addressing:** "${userPrompt}"\n\n1. **Core Concept Hook:** Frame this around a tangible phenomenon or real-world application to anchor student curiosity.\n2. **Cognitive Scaffolding:** Break down multi-step logic into discrete, testable units before introducing abstract formulas.\n3. **Active Diagnostic:** Test student intuition with an immediate quick-check question before formal notation.\n4. **Extension Activity:** Use the interactive tools in your sidebar to provide immediate tactile practice.`;
    }

    const provider = keyRotator.detectProvider(currentKey);
    let url = "https://openrouter.ai/api/v1/chat/completions";
    let fetchOptions = {};

    const systemPrompt = `You are an elite master teacher and curriculum strategist for ${subject.toUpperCase()}. Provide concise, structured, high-impact teaching insights, lesson outlines, and conceptual explanations.`;

    if (provider === "google") {
      url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
      fetchOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: `${systemPrompt}\n\nTeacher Question: ${userPrompt}` }],
            },
          ],
        }),
      };
    } else {
      url = "https://openrouter.ai/api/v1/chat/completions";
      fetchOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "HTTP-Referer": "https://hey.internal",
          "X-Title": "HEY Teacher Engine",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      };
    }

    const response = await keyRotator.fetchWithRotation(url, fetchOptions);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    if (provider === "google") {
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response received";
    }
    return data.choices?.[0]?.message?.content || "No response received";
  };

  const handleSend = async (textToSend) => {
    const prompt = (textToSend || input).trim();
    if (!prompt || isLoading) return;

    const userMessage = {
      id: `usr_${Date.now()}`,
      role: "user",
      content: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      if (mode === "council") {
        // Mentor Council Debate Mode
        const debateResult = await debate(prompt, { subject });
        const councilMessage = {
          id: `cnl_${Date.now()}`,
          role: "assistant",
          mode: "council",
          debate: debateResult,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, councilMessage]);
      } else {
        // Standard AI Mode
        const aiResponseText = await executeStandardAI(prompt);
        const standardMessage = {
          id: `ast_${Date.now()}`,
          role: "assistant",
          mode: "standard",
          content: aiResponseText,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, standardMessage]);
      }
    } catch (err) {
      console.error("Chat failure:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: "assistant",
          mode: "standard",
          content: `⚠️ Request error: ${err.message}. Rotating key pool or fallback active.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        role: "assistant",
        mode: "standard",
        content: `Chat session reset. You are in **${mode === "council" ? "Mentor Council" : "Standard AI"}** mode for **${subject.toUpperCase()}**.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-full w-full relative overflow-hidden bg-[#0A0B0F]/90 text-[#F5F6F8]">
      {/* Top Controls Bar: Toggle Switch Standard AI vs Mentor Council */}
      <div
        className="flex items-center justify-between px-6 py-3.5 border-b border-white/10 bg-[#131419]/80 backdrop-blur-[24px] z-20 flex-shrink-0"
        style={{ backdropFilter: "blur(24px)" }}
      >
        <div className="flex items-center gap-3">
          {/* Mode Switcher Pills */}
          <div className="flex items-center p-1 rounded-2xl bg-[#0A0B0F]/90 border border-white/10 shadow-inner">
            <button
              type="button"
              onClick={() => setMode("standard")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                mode === "standard"
                  ? "bg-[#131419] text-[#F5F6F8] shadow-md border border-white/10"
                  : "text-white/50 hover:text-white"
              }`}
            >
              <Bot className="w-3.5 h-3.5" style={{ color: mode === "standard" ? themeColor : undefined }} />
              <span>Standard AI</span>
            </button>

            <button
              type="button"
              onClick={() => setMode("council")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                mode === "council"
                  ? "bg-gradient-to-r from-[#00F0FF]/20 to-[#8B5CF6]/20 text-white shadow-md border border-[#00F0FF]/40"
                  : "text-white/50 hover:text-white"
              }`}
            >
              <Users className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span>Mentor Council</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-[#00F0FF]/20 text-[#00F0FF] uppercase tracking-wider font-bold">
                Jobs × Buffett
              </span>
            </button>
          </div>
        </div>

        {/* Clear & Options */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={clearChat}
            className="p-2 rounded-xl text-xs bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all"
            title="Clear conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 select-text">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 md:gap-4 max-w-4xl mx-auto ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {/* Avatar for Assistant */}
            {msg.role !== "user" && (
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/10 shadow-md text-xs font-bold"
                style={{
                  backgroundColor: "#131419",
                  color: themeColor,
                }}
              >
                {msg.mode === "council" ? <Users className="w-4 h-4 text-[#00F0FF]" /> : <Sparkles className="w-4 h-4" />}
              </div>
            )}

            {/* Message Body */}
            <div className={`space-y-2 max-w-[85%] md:max-w-[78%] ${msg.role === "user" ? "items-end" : ""}`}>
              {/* If Council Debate Message */}
              {msg.mode === "council" && msg.debate ? (
                <div
                  className="rounded-3xl border border-white/10 bg-[#131419]/90 backdrop-blur-[24px] p-5 md:p-6 shadow-xl space-y-5"
                  style={{ backdropFilter: "blur(24px)" }}
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#00F0FF]" />
                      <span className="text-xs font-bold tracking-wider uppercase text-white/80">
                        Mentor Council Deliberation
                      </span>
                    </div>
                    <span className="text-[11px] text-white/40">{msg.timestamp}</span>
                  </div>

                  {/* Steve Jobs Persona Argument */}
                  <div className="rounded-2xl border border-[#00F0FF]/25 bg-[#00F0FF]/5 p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🍎</span>
                      <span className="text-xs font-bold text-[#00F0FF] uppercase tracking-wider">Steve Jobs</span>
                      <span className="text-[11px] text-white/40">• Vision &amp; Radical Simplicity</span>
                    </div>
                    <p className="text-sm text-white/90 leading-relaxed italic">
                      &ldquo;{msg.debate.jobsArgument}&rdquo;
                    </p>
                  </div>

                  {/* Warren Buffett Persona Argument */}
                  <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">📈</span>
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Warren Buffett</span>
                      <span className="text-[11px] text-white/40">• Compounding Fundamentals &amp; Discipline</span>
                    </div>
                    <p className="text-sm text-white/90 leading-relaxed italic">
                      &ldquo;{msg.debate.buffettArgument}&rdquo;
                    </p>
                  </div>

                  {/* Synthesis / Executive Consensus */}
                  <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-5 space-y-2.5">
                    <div className="flex items-center gap-2 text-purple-300">
                      <Award className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-bold uppercase tracking-wider">Executive Synthesis &amp; Action Plan</span>
                    </div>
                    <p className="text-sm text-[#F5F6F8] leading-relaxed font-medium">
                      {msg.debate.synthesis}
                    </p>
                    {msg.debate.verdict && (
                      <div className="pt-2 border-t border-purple-500/20 text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        <span>Verdict: {msg.debate.verdict}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Standard AI or User Bubble */
                <div
                  className={`rounded-3xl p-4 md:p-5 text-sm md:text-base leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[#00F0FF] text-[#0A0B0F] font-medium shadow-lg shadow-[#00F0FF]/20"
                      : "bg-[#131419]/90 border border-white/10 text-[#F5F6F8] backdrop-blur-[24px] shadow-xl"
                  }`}
                  style={msg.role !== "user" ? { backdropFilter: "blur(24px)" } : undefined}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              )}

              {/* Timestamp & Copy Action */}
              <div
                className={`flex items-center gap-2 text-[10px] text-white/40 px-2 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <span>{msg.timestamp}</span>
                {msg.role !== "user" && msg.content && (
                  <button
                    type="button"
                    onClick={() => handleCopy(msg.id, msg.content)}
                    className="hover:text-white transition-colors flex items-center gap-1"
                    title="Copy message"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Avatar for User */}
            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-xl bg-[#00F0FF]/20 border border-[#00F0FF]/40 flex items-center justify-center flex-shrink-0 text-[#00F0FF]">
                <User className="w-4 h-4" />
              </div>
            )}
          </motion.div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 max-w-4xl mx-auto"
          >
            <div className="w-8 h-8 rounded-xl bg-[#131419] border border-white/10 flex items-center justify-center text-[#00F0FF]">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div
              className="px-4 py-3 rounded-2xl bg-[#131419]/80 border border-white/10 backdrop-blur-[24px] text-xs text-white/70 flex items-center gap-2"
              style={{ backdropFilter: "blur(24px)" }}
            >
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-[#00F0FF] font-medium">
                {mode === "council" ? "Convening Jobs & Buffett Council..." : "Synthesizing master response..."}
              </span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Glass Composer */}
      <div className="p-4 md:p-6 flex-shrink-0 max-w-4xl mx-auto w-full z-20">
        <div
          className="relative rounded-3xl border border-white/15 bg-[#131419]/90 backdrop-blur-[24px] p-2 md:p-3 shadow-2xl transition-all focus-within:border-[#00F0FF]/70 focus-within:shadow-[0_0_30px_rgba(0,240,255,0.15)]"
          style={{ backdropFilter: "blur(24px)" }}
        >
          <textarea
            ref={textareaRef}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              mode === "council"
                ? `Prompt Jobs & Buffett for a curriculum debate on ${subject}...`
                : `Ask HEY Teacher Engine anything about ${subject}...`
            }
            className="w-full bg-transparent text-[#F5F6F8] font-['Inter',sans-serif] text-sm md:text-base px-4 py-2 outline-none resize-none placeholder:text-white/30"
          />

          <div className="flex items-center justify-between px-3 pt-1 border-t border-white/5">
            <div className="flex items-center gap-2 text-[11px] text-white/40">
              <span className="hidden sm:inline">Press</span>
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] text-white/70">Enter ↵</kbd>
              <span className="hidden sm:inline">to send •</span>
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] text-white/70">Shift + Enter</kbd>
              <span className="hidden sm:inline">for newline</span>
            </div>

            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="px-4 py-2 rounded-2xl font-bold text-xs md:text-sm bg-[#00F0FF] text-[#0A0B0F] hover:bg-[#00F0FF]/90 disabled:opacity-30 disabled:hover:bg-[#00F0FF] transition-all flex items-center gap-1.5 shadow-md shadow-[#00F0FF]/25 hover:scale-105 active:scale-95"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

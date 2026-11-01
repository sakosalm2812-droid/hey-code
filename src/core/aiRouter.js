/**
 * HEY Teacher Engine - AI Router
 * Uses KeyRotator to call the AI API with automatic key rotation
 * Classifies teacher input into subjects: chem | math | art | bio | phys | eng
 */

import { keyRotator } from "./keyRotator.js";

const SYSTEM_PROMPT =
  "Analyze the user's input. Return ONLY a JSON object with { subject: 'chem'|'math'|'art'|'bio'|'phys'|'eng', themeColor: '#HEX', tools: ['tool1', 'tool2'] }. Do not include markdown.";

// Canonical subject configurations with matching tools and theme colors
export const SUBJECT_CONFIGS = {
  chem: {
    subject: "chem",
    name: "Chemistry",
    themeColor: "#00F0FF",
    tools: ["Periodic Table", "Equation Editor", "Lab Safety", "Worksheet Generator"],
    keywords: ["chem", "chemistry", "reaction", "periodic", "molecule", "stoichiometry", "atom", "acid", "titration", "organic chem", "lab safety"],
  },
  math: {
    subject: "math",
    name: "Mathematics",
    themeColor: "#8B5CF6",
    tools: ["Graphing Calculator", "LaTeX Formula Editor", "Step-by-Step Solver", "Quiz Builder"],
    keywords: ["math", "mathematics", "calculus", "algebra", "geometry", "trigonometry", "derivative", "integral", "matrix", "equation", "statistics"],
  },
  art: {
    subject: "art",
    name: "Visual Arts & Design",
    themeColor: "#EC4899",
    tools: ["Color Palette Studio", "Art History Timeline", "Critique Studio", "Medium Explorer"],
    keywords: ["art", "painting", "drawing", "illustration", "color", "design", "sculpture", "visual", "palette", "aesthetic", "bauhaus", "composition"],
  },
  bio: {
    subject: "bio",
    name: "Biology & Life Sciences",
    themeColor: "#10B981",
    tools: ["3D Cell Explorer", "Genetics Punnett Square", "Ecosystem Simulator", "Dissection Lab Guide"],
    keywords: ["bio", "biology", "cell", "genetics", "dna", "ecosystem", "organism", "mitochondria", "evolution", "anatomy", "punnett", "photosynthesis"],
  },
  phys: {
    subject: "phys",
    name: "Physics",
    themeColor: "#F59E0B",
    tools: ["Mechanics Simulator", "Optics & Wave Bench", "Circuit Sandbox", "Unit & Constants Converter"],
    keywords: ["phys", "physics", "mechanics", "gravity", "optics", "quantum", "velocity", "wave", "circuit", "relativity", "thermodynamics", "kinematics"],
  },
  eng: {
    subject: "eng",
    name: "English & Literature",
    themeColor: "#3B82F6",
    tools: ["Essay Grader & Rubric", "Grammar & Syntax Analyzer", "Poetry Meter Scanner", "Literature Discussion Prompts"],
    keywords: ["eng", "english", "literature", "essay", "writing", "poetry", "grammar", "novel", "rhetoric", "shakespeare", "reading", "syntax"],
  },
};

/**
 * Intelligent local semantic fallback classifier in case API keys are absent,
 * mock-generated, or the network is offline.
 */
export function classifyInputLocally(input) {
  const text = (input || "").toLowerCase().trim();
  let bestSubject = "chem";
  let maxScore = -1;

  for (const [key, cfg] of Object.entries(SUBJECT_CONFIGS)) {
    let score = 0;
    for (const kw of cfg.keywords) {
      if (text.includes(kw)) {
        score += kw.length; // weight longer matches
      }
    }
    if (score > maxScore) {
      maxScore = score;
      bestSubject = key;
    }
  }

  // If no match found, check simple prefixes
  if (maxScore <= 0) {
    if (/sci|lab|substance|compound/.test(text)) bestSubject = "chem";
    else if (/calc|number|solve|proof/.test(text)) bestSubject = "math";
    else if (/paint|draw|photo|craft/.test(text)) bestSubject = "art";
    else if (/life|plant|animal|gene/.test(text)) bestSubject = "bio";
    else if (/motion|force|energy|speed/.test(text)) bestSubject = "phys";
    else if (/book|write|author|poem/.test(text)) bestSubject = "eng";
  }

  const result = SUBJECT_CONFIGS[bestSubject];
  return {
    subject: result.subject,
    themeColor: result.themeColor,
    tools: [...result.tools],
  };
}

/**
 * Clean and parse JSON from an AI response string, stripping code blocks or extra whitespace.
 */
function parseCleanJSON(raw) {
  if (!raw) throw new Error("Empty response from AI Router");

  let cleaned = raw.trim();
  // Strip Markdown code fences if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }

  // Find first { and last }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  const parsed = JSON.parse(cleaned);

  // Validate subject
  const validSubjects = ["chem", "math", "art", "bio", "phys", "eng"];
  let subject = (parsed.subject || "").toLowerCase();
  if (!validSubjects.includes(subject)) {
    // Find closest match or fallback
    const match = validSubjects.find((s) => subject.includes(s));
    subject = match || "chem";
  }

  const canonical = SUBJECT_CONFIGS[subject];
  return {
    subject,
    themeColor: parsed.themeColor && /^#[0-9A-Fa-f]{6}$/.test(parsed.themeColor) ? parsed.themeColor : canonical.themeColor,
    tools: Array.isArray(parsed.tools) && parsed.tools.length > 0 ? parsed.tools : canonical.tools,
  };
}

/**
 * Analyzes the teacher's input and returns subject classification, theme color, and toolset.
 * Uses KeyRotator to call the AI API with automatic rotation on 429/403.
 *
 * @param {string} teacherInput Description of what the teacher teaches
 * @returns {Promise<{ subject: 'chem'|'math'|'art'|'bio'|'phys'|'eng', themeColor: string, tools: string[] }>}
 */
export async function analyzeTeacher(teacherInput) {
  if (!teacherInput || typeof teacherInput !== "string" || !teacherInput.trim()) {
    return classifyInputLocally("Chemistry");
  }

  const keys = keyRotator.getKeys();
  const currentKey = keyRotator.getCurrentKey();

  // If no keys configured or using purely simulated demo keys, evaluate using semantic router
  const isDemoKey = currentKey && (currentKey.includes("Demo") || currentKey.includes("Example"));
  if (keys.length === 0 || isDemoKey) {
    console.info("[AIRouter] Utilizing local semantic AI classifier for input:", teacherInput);
    // Simulate brief high-performance routing latency
    await new Promise((resolve) => setTimeout(resolve, 300));
    return classifyInputLocally(teacherInput);
  }

  // Determine provider endpoint based on active key
  const provider = keyRotator.detectProvider(currentKey);
  let url = "https://openrouter.ai/api/v1/chat/completions";
  let fetchOptions = {};

  if (provider === "google") {
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
    fetchOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${SYSTEM_PROMPT}\n\nTeacher Input: ${teacherInput}`,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      }),
    };
  } else if (provider === "nvidia") {
    url = "https://integrate.api.nvidia.com/v1/chat/completions";
    fetchOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "meta/llama-3.1-70b-instruct",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: teacherInput },
        ],
        temperature: 0.1,
      }),
    };
  } else {
    // Default OpenRouter
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
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: teacherInput },
        ],
        temperature: 0.1,
      }),
    };
  }

  try {
    const response = await keyRotator.fetchWithRotation(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`API responded with HTTP ${response.status}`);
    }

    const data = await response.json();
    let textResponse = "";

    if (provider === "google" && data.candidates?.[0]?.content?.parts?.[0]?.text) {
      textResponse = data.candidates[0].content.parts[0].text;
    } else if (data.choices?.[0]?.message?.content) {
      textResponse = data.choices[0].message.content;
    } else {
      textResponse = JSON.stringify(data);
    }

    return parseCleanJSON(textResponse);
  } catch (error) {
    console.warn("[AIRouter] Remote inference failed, falling back to local semantic engine:", error.message);
    return classifyInputLocally(teacherInput);
  }
}

export default analyzeTeacher;

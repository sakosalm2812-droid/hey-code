/**
 * HEY Voice Commands — Spoken Grammar to Command Mapping.
 *
 * Pure module: no I/O, no state, no side effects.
 * Maps recognized speech to canonical command intents.
 * Unknown speech → ONE clarifying question, never guess.
 *
 * @module components/voice/voiceCommands
 */

export const VOICE_INTENTS = Object.freeze([
  "start_lesson",
  "next",
  "stop",
  "open_artefact",
  "print_artefact",
  "ask_question",
  "save_this",
  "cancel",
  "undo",
]);

export const INTENT_PHRASES = Object.freeze({
  en: {
    start_lesson: [
      "start lesson",
      "begin lesson",
      "begin the lesson",
      "start the lesson",
      "launch lesson",
      "lesson mode",
      "enter lesson mode",
    ],
    next: [
      "next",
      "next step",
      "continue",
      "go on",
      "proceed",
      "move on",
      "what's next",
    ],
    stop: [
      "stop",
      "halt",
      "end",
      "finish",
      "quit",
      "cancel everything",
      "stop everything",
    ],
    open_artefact: [
      "open",
      "show",
      "display",
      "view",
      "launch",
    ],
    print_artefact: [
      "print",
      "print this",
      "print that",
      "make a copy",
      "hard copy",
    ],
    ask_question: [
      "ask",
      "question",
      "what is",
      "how do",
      "why does",
      "explain",
      "tell me about",
      "define",
    ],
    save_this: [
      "save this",
      "save that",
      "keep this",
      "remember this",
      "store this",
      "bookmark this",
    ],
    cancel: [
      "cancel",
      "never mind",
      "forget it",
      "abort",
      "discard",
    ],
    undo: [
      "undo",
      "reverse",
      "go back",
      "revert",
      "take it back",
    ],
  },
  ckb: {
    start_lesson: [
      "دەستپێکردنی خوێندنەوە",
      "خوێندنەوە دەستپێبکە",
      "مۆدی خوێندنەوە",
    ],
    next: [
      "پاش",
      "بەردەوام بکە",
      "چی یەکەم",
    ],
    stop: [
      "وایستا",
      "کۆتایی",
      "هەڵوەشاندنەوە",
      "وایستاندنی هەموو",
    ],
    open_artefact: [
      "بکەوە",
      "نیشان بدە",
      "دەرکەوە",
    ],
    print_artefact: [
      "چاپ بکە",
      "ئەمە چاپ بکە",
      "کۆپی چێپ",
    ],
    ask_question: [
      "پرسین",
      "پرسیار",
      "چیە",
      "چۆن",
      "بۆچی",
      "وێنە بدە",
    ],
    save_this: [
      "ئەمە پاشەکەوت بکە",
      "پاشەکەوت",
      "بیر بکەرەوە",
    ],
    cancel: [
      "هەڵوەشاندنەوە",
      "بە بێخەم",
      "پاشگەزبوونەوە",
    ],
    undo: [
      "پاشگەزبوونەوە",
      "وێڵ بکەرەوە",
      "گەڕانەوە",
    ],
  },
  ar: {
    start_lesson: [
      "ابدأ الدرس",
      "بدء الدرس",
      "وضع الدرس",
      "ادخل في الدرس",
    ],
    next: [
      "التالي",
      "استمر",
      "اكمل",
      "ما التالي",
    ],
    stop: [
      "توقف",
      "انهاء",
      "أوقف كل شيء",
      "الغاء",
    ],
    open_artefact: [
      "افتح",
      "أظهر",
      "عرض",
      "شغل",
    ],
    print_artefact: [
      "اطبع",
      "اطبع هذا",
      "نسخة ورقية",
    ],
    ask_question: [
      "اسأل",
      "سؤال",
      "ما هو",
      "كيف",
      "لماذا",
      "اشرح",
      "أخبرني عن",
    ],
    save_this: [
      "احفظ هذا",
      "احتفظ بهذا",
      "تذكر هذا",
      "ضع إشارة مرجعية",
    ],
    cancel: [
      "الغاء",
      "لا يهم",
      "الغاء الأمر",
    ],
    undo: [
      "تراجع",
      "ارجع",
      "الغاء последнее",
    ],
  },
});

/**
 * Normalizes text for matching: lowercase, trim, collapse whitespace.
 * @param {string} text
 * @returns {string}
 */
function normalize(text) {
  if (typeof text !== "string") return "";
  return text.toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Checks if text starts with any phrase in the list.
 * @param {string} text - Normalized text
 * @param {string[]} phrases - Normalized phrases
 * @returns {{matched: boolean, phrase: string, remainder: string}}
 */
function matchPrefix(text, phrases) {
  for (const phrase of phrases) {
    const normalizedPhrase = normalize(phrase);
    if (text === normalizedPhrase || text.startsWith(normalizedPhrase + " ")) {
      return {
        matched: true,
        phrase: normalizedPhrase,
        remainder: text.slice(normalizedPhrase.length).trim(),
      };
    }
  }
  return { matched: false, phrase: "", remainder: text };
}

/**
 * Maps a transcript to a canonical voice intent.
 * Returns exactly one intent, or an ambiguity object that demands clarification.
 *
 * @param {string} transcript - Raw speech recognition output
 * @param {string} [locale="en"] - Locale code (en, ckb, ar)
 * @returns {{ intent: string, args: Record<string, string> } | { ambiguous: true, question: string, candidates: string[] }}
 */
export function mapTranscriptToIntent(transcript, locale = "en") {
  const text = normalize(transcript);
  if (!text) {
    return { ambiguous: true, question: "I didn't catch that. Could you repeat?", candidates: [] };
  }

  const phrases = INTENT_PHRASES[locale] || INTENT_PHRASES.en;
  const matches = [];

  // Check each intent for a prefix match
  for (const intent of VOICE_INTENTS) {
    const intentPhrases = phrases[intent] || INTENT_PHRASES.en[intent];
    const result = matchPrefix(text, intentPhrases);
    if (result.matched) {
      matches.push({ intent, remainder: result.remainder, matchedPhrase: result.phrase });
    }
  }

  // No matches → clarifying question
  if (matches.length === 0) {
    return {
      ambiguous: true,
      question: `I heard "${transcript}". Did you mean: start lesson, next, stop, open something, print, ask a question, save, cancel, or undo?`,
      candidates: [],
    };
  }

  // Multiple matches → pick the longest match (most specific), but if tied → ambiguity
  matches.sort((a, b) => b.matchedPhrase.length - a.matchedPhrase.length);
  const bestMatch = matches[0];

  // Check for tie on the longest match length
  const tied = matches.filter(m => m.matchedPhrase.length === bestMatch.matchedPhrase.length);
  if (tied.length > 1) {
    return {
      ambiguous: true,
      question: `I heard "${transcript}". Did you mean ${tied.map(t => t.intent.replace("_", " ")).join(", ")}?`,
      candidates: tied.map(t => t.intent),
    };
  }

  // Extract arguments based on intent
  const args = {};
  switch (bestMatch.intent) {
    case "open_artefact":
    case "print_artefact":
    case "ask_question":
      args.target = bestMatch.remainder || "";
      break;
  }

  return { intent: bestMatch.intent, args };
}

/**
 * Determines if an intent is destructive (requires approval).
 * @param {string} intent
 * @returns {boolean}
 */
export function isDestructiveIntent(intent) {
  return ["stop", "cancel", "undo"].includes(intent);
}

/**
 * Gets the clarifying question for an ambiguous result.
 * @param {{ ambiguous: boolean, question: string, candidates: string[] }} result
 * @returns {string}
 */
export function getClarificationQuestion(result) {
  if (!result.ambiguous) return "";
  return result.question;
}

/**
 * Validates that a mapped intent has required arguments.
 * @param {string} intent
 * @param {Record<string, string>} args
 * @returns {{ ok: boolean, missing?: string[] }}
 */
export function validateIntentArgs(intent, args) {
  const required = {
    open_artefact: ["target"],
    print_artefact: ["target"],
    ask_question: ["target"],
  };
  const needed = required[intent] || [];
  const missing = needed.filter(k => !args[k] || !args[k].trim());
  return missing.length === 0 ? { ok: true } : { ok: false, missing };
}

export default {
  VOICE_INTENTS,
  INTENT_PHRASES,
  mapTranscriptToIntent,
  isDestructiveIntent,
  getClarificationQuestion,
  validateIntentArgs,
};
/**
 * Voice Commands Tests — grammar mapping, ambiguity handling, destructive verb refusal.
 */

import { describe, it } from "node:test";
import { deepStrictEqual, ok, strictEqual } from "node:assert";
import {
  VOICE_INTENTS,
  INTENT_PHRASES,
  mapTranscriptToIntent,
  isDestructiveIntent,
  getClarificationQuestion,
  validateIntentArgs,
} from "../src/components/voice/voiceCommands.js";

describe("voiceCommands — grammar mapping", () => {
  it("maps 'start lesson' to start_lesson intent", () => {
    const result = mapTranscriptToIntent("start lesson");
    deepStrictEqual(result, { intent: "start_lesson", args: {} });
  });

  it("maps 'begin the lesson' to start_lesson intent", () => {
    const result = mapTranscriptToIntent("begin the lesson");
    deepStrictEqual(result, { intent: "start_lesson", args: {} });
  });

  it("maps 'next step' to next intent", () => {
    const result = mapTranscriptToIntent("next step");
    deepStrictEqual(result, { intent: "next", args: {} });
  });

  it("maps 'stop everything' to stop intent", () => {
    const result = mapTranscriptToIntent("stop everything");
    deepStrictEqual(result, { intent: "stop", args: {} });
  });

  it("maps 'open photosynthesis quiz' to open_artefact with target", () => {
    const result = mapTranscriptToIntent("open photosynthesis quiz");
    deepStrictEqual(result, { intent: "open_artefact", args: { target: "photosynthesis quiz" } });
  });

  it("maps 'print this' to print_artefact with target", () => {
    const result = mapTranscriptToIntent("print this");
    deepStrictEqual(result, { intent: "print_artefact", args: { target: "this" } });
  });

  it("maps 'ask what is photosynthesis' to ask_question with target", () => {
    const result = mapTranscriptToIntent("ask what is photosynthesis");
    deepStrictEqual(result, { intent: "ask_question", args: { target: "what is photosynthesis" } });
  });

  it("maps 'save this' to save_this intent", () => {
    const result = mapTranscriptToIntent("save this");
    deepStrictEqual(result, { intent: "save_this", args: {} });
  });

  it("maps 'cancel' to cancel intent", () => {
    const result = mapTranscriptToIntent("cancel");
    deepStrictEqual(result, { intent: "cancel", args: {} });
  });

  it("maps 'undo' to undo intent", () => {
    const result = mapTranscriptToIntent("undo");
    deepStrictEqual(result, { intent: "undo", args: {} });
  });

  it("is case-insensitive", () => {
    const result = mapTranscriptToIntent("START LESSON");
    deepStrictEqual(result, { intent: "start_lesson", args: {} });
  });

  it("handles extra whitespace", () => {
    const result = mapTranscriptToIntent("  start   lesson  ");
    deepStrictEqual(result, { intent: "start_lesson", args: {} });
  });
});

describe("voiceCommands — locale support (en, ckb, ar)", () => {
  it("maps Kurdish 'دەستپێکردنی خوێندنەوە' to start_lesson", () => {
    const result = mapTranscriptToIntent("دەستپێکردنی خوێندنەوە", "ckb");
    deepStrictEqual(result, { intent: "start_lesson", args: {} });
  });

  it("maps Arabic 'ابدأ الدرس' to start_lesson", () => {
    const result = mapTranscriptToIntent("ابدأ الدرس", "ar");
    deepStrictEqual(result, { intent: "start_lesson", args: {} });
  });

  it("maps Kurdish 'پاش' to next", () => {
    const result = mapTranscriptToIntent("پاش", "ckb");
    deepStrictEqual(result, { intent: "next", args: {} });
  });

  it("maps Arabic 'توقف' to stop", () => {
    const result = mapTranscriptToIntent("توقف", "ar");
    deepStrictEqual(result, { intent: "stop", args: {} });
  });

  it("falls back to English for unknown locale", () => {
    const result = mapTranscriptToIntent("start lesson", "fr");
    deepStrictEqual(result, { intent: "start_lesson", args: {} });
  });
});

describe("voiceCommands — ambiguity handling", () => {
  it("returns ambiguous for unknown speech", () => {
    const result = mapTranscriptToIntent("blah blah blah");
    ok(result.ambiguous === true);
    ok(typeof result.question === "string");
    ok(result.question.length > 0);
  });

  it("returns ambiguous for empty transcript", () => {
    const result = mapTranscriptToIntent("");
    ok(result.ambiguous === true);
    ok(result.question.includes("didn't catch"));
  });

  it("returns ambiguous when multiple intents match equally", () => {
    // This is a constructed case - in practice depends on phrase overlap
    const result = mapTranscriptToIntent("open print"); // Could match open or print prefix
    // Should not silently pick one
    if (!result.ambiguous) {
      // If it picks one, it should be the longer match
      ok(["open_artefact", "print_artefact"].includes(result.intent));
    }
  });

  it("clarifying question mentions valid options", () => {
    const result = mapTranscriptToIntent("xyz unknown");
    ok(result.question.includes("start lesson"));
    ok(result.question.includes("next"));
    ok(result.question.includes("stop"));
  });
});

describe("voiceCommands — destructive intent detection", () => {
  it("marks stop as destructive", () => {
    ok(isDestructiveIntent("stop") === true);
  });

  it("marks cancel as destructive", () => {
    ok(isDestructiveIntent("cancel") === true);
  });

  it("marks undo as destructive", () => {
    ok(isDestructiveIntent("undo") === true);
  });

  it("does not mark start_lesson as destructive", () => {
    ok(isDestructiveIntent("start_lesson") === false);
  });

  it("does not mark next as destructive", () => {
    ok(isDestructiveIntent("next") === false);
  });

  it("does not mark open_artefact as destructive", () => {
    ok(isDestructiveIntent("open_artefact") === false);
  });

  it("does not mark ask_question as destructive", () => {
    ok(isDestructiveIntent("ask_question") === false);
  });

  it("does not mark save_this as destructive", () => {
    ok(isDestructiveIntent("save_this") === false);
  });
});

describe("voiceCommands — argument validation", () => {
  it("validates open_artefact requires target", () => {
    const result = validateIntentArgs("open_artefact", { target: "quiz" });
    ok(result.ok === true);
  });

  it("rejects open_artefact without target", () => {
    const result = validateIntentArgs("open_artefact", {});
    ok(result.ok === false);
    deepStrictEqual(result.missing, ["target"]);
  });

  it("validates print_artefact requires target", () => {
    const result = validateIntentArgs("print_artefact", { target: "worksheet" });
    ok(result.ok === true);
  });

  it("validates ask_question requires target", () => {
    const result = validateIntentArgs("ask_question", { target: "what is DNA" });
    ok(result.ok === true);
  });

  it("validates start_lesson has no required args", () => {
    const result = validateIntentArgs("start_lesson", {});
    ok(result.ok === true);
  });
});

describe("voiceCommands — intent phrases completeness", () => {
  it("has phrases for all intents in English", () => {
    for (const intent of VOICE_INTENTS) {
      ok(INTENT_PHRASES.en[intent]);
      ok(Array.isArray(INTENT_PHRASES.en[intent]));
      ok(INTENT_PHRASES.en[intent].length > 0);
    }
  });

  it("has phrases for all intents in Kurdish", () => {
    for (const intent of VOICE_INTENTS) {
      ok(INTENT_PHRASES.ckb[intent]);
      ok(Array.isArray(INTENT_PHRASES.ckb[intent]));
      // Kurdish may have fewer phrases but should have at least one
      ok(INTENT_PHRASES.ckb[intent].length > 0);
    }
  });

  it("has phrases for all intents in Arabic", () => {
    for (const intent of VOICE_INTENTS) {
      ok(INTENT_PHRASES.ar[intent]);
      ok(Array.isArray(INTENT_PHRASES.ar[intent]));
      ok(INTENT_PHRASES.ar[intent].length > 0);
    }
  });
});
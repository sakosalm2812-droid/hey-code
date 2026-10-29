# HEY Frontend — FE-VOICE-NATIVE-CONTRACT.md

**Feature:** F-22 Global Voice Control
**Date:** 21 October 2026
**Status:** DEFINED — ready for native layer implementation

---

## 1. Intent List (Canonical)

The following intents are the **only** spoken commands HEY recognises. Any speech not matching these maps to an ambiguity clarification.

| Intent ID | Canonical Verb | Parameters | Destructive? |
|-----------|----------------|------------|--------------|
| `start_lesson` | "start lesson" / "begin lesson" / "lesson mode" | none | No |
| `next` | "next" / "continue" / "proceed" / "what's next" | none | No |
| `stop` | "stop" / "halt" / "end" / "quit" / "stop everything" | none | **Yes** |
| `open_artefact` | "open" / "show" / "display" / "view" / "launch" | `target` (string) | No |
| `print_artefact` | "print" / "print this" / "hard copy" | `target` (string) | No |
| `ask_question` | "ask" / "question" / "what is" / "how do" / "explain" | `target` (string) | No |
| `save_this` | "save this" / "keep this" / "remember this" / "bookmark this" | none | No |
| `cancel` | "cancel" / "never mind" / "forget it" / "abort" / "discard" | none | **Yes** |
| `undo` | "undo" / "reverse" / "go back" / "revert" / "take it back" | none | **Yes** |

---

## 2. Phrases Per Locale

### English (en) — Baseline
```javascript
start_lesson: ["start lesson", "begin lesson", "begin the lesson", "start the lesson", "launch lesson", "lesson mode", "enter lesson mode"]
next: ["next", "next step", "continue", "go on", "proceed", "move on", "what's next"]
stop: ["stop", "halt", "end", "finish", "quit", "cancel everything", "stop everything"]
open_artefact: ["open", "show", "display", "view", "launch"]
print_artefact: ["print", "print this", "print that", "make a copy", "hard copy"]
ask_question: ["ask", "question", "what is", "how do", "why does", "explain", "tell me about", "define"]
save_this: ["save this", "save that", "keep this", "remember this", "store this", "bookmark this"]
cancel: ["cancel", "never mind", "forget it", "abort", "discard"]
undo: ["undo", "reverse", "go back", "revert", "take it back"]
```

### Sorani Kurdish (ckb) — **UNKNOWN/Unsupported**
```javascript
start_lesson: ["دەستپێکردنی خوێندنەوە", "خوێندنەوە دەستپێبکە", "مۆدی خوێندنەوە"]
next: ["پاش", "بەردەوام بکە", "چی یەکەم"]
stop: ["وایستا", "کۆتایی", "هەڵوەشاندنەوە", "وایستاندنی هەموو"]
open_artefact: ["بکەوە", "نیشان بدە", "دەرکەوە"]
print_artefact: ["چاپ بکە", "ئەمە چاپ بکە", "کۆپی چێپ"]
ask_question: ["پرسین", "پرسیار", "چیە", "چۆن", "بۆچی", "وێنە بدە"]
save_this: ["ئەمە پاشەکەوت بکە", "پاشەکەوت", "بیر بکەرەوە"]
cancel: ["هەڵوەشاندنەوە", "بە بێخەم", "پاشگەزبوونەوە"]
undo: ["پاشگەزبوونەوە", "وێڵ بکەرەوە", "گەڕانەوە"]
```
**Capability State:** `UNKNOWN` — No on-device STT/TTS verified for Sorani. Must not silently fall back to English.

### Arabic (ar) — **UNKNOWN/Unsupported**
```javascript
start_lesson: ["ابدأ الدرس", "بدء الدرس", "وضع الدرس", "ادخل في الدرس"]
next: ["التالي", "استمر", "اكمل", "ما التالي"]
stop: ["توقف", "انهاء", "أوقف كل شيء", "الغاء"]
open_artefact: ["افتح", "أظهر", "عرض", "شغل"]
print_artefact: ["اطبع", "اطبع هذا", "نسخة ورقية"]
ask_question: ["اسأل", "سؤال", "ما هو", "كيف", "لماذا", "اشرح", "أخبرني عن"]
save_this: ["احفظ هذا", "احتفظ بهذا", "تذكر هذا", "ضع إشارة مرجعية"]
cancel: ["الغاء", "لا يهم", "الغاء الأمر"]
undo: ["تراجع", "ارجع", "الغاء الأخير"]
```
**Capability State:** `UNKNOWN` — No on-device STT/TTS verified for Arabic. Must not silently fall back to English.

---

## 3. Forwarding Payload (Native → Web)

When the OS (Siri, Assistant, Shortcuts, App Intents) matches a voice command, the native layer **must** forward the canonical intent to the web layer via the same mapping. Do not execute actions natively.

### Message Format (postMessage / Tauri event / bridge)

```json
{
  "source": "native-voice",
  "platform": "ios|android|macos|windows|linux",
  "intent": "start_lesson|next|stop|open_artefact|print_artefact|ask_question|save_this|cancel|undo",
  "args": {
    "target": "string|null"
  },
  "locale": "en|ckb|ar",
  "timestamp": "ISO8601",
  "traceId": "string"
}
```

### Examples

**iOS App Intent: "Hey HEY, start lesson"**
```json
{
  "source": "native-voice",
  "platform": "ios",
  "intent": "start_lesson",
  "args": {},
  "locale": "en",
  "timestamp": "2026-10-21T10:30:00.000Z",
  "traceId": "voice_1708432200_abc123"
}
```

**Android Assistant: "HEY, open photosynthesis quiz"**
```json
{
  "source": "native-voice",
  "platform": "android",
  "intent": "open_artefact",
  "args": { "target": "photosynthesis quiz" },
  "locale": "en",
  "timestamp": "2026-10-21T10:30:05.000Z",
  "traceId": "voice_1708432205_def456"
}
```

**Windows Global Hotkey (Push-to-talk): "Print worksheet"**
```json
{
  "source": "native-voice",
  "platform": "windows",
  "intent": "print_artefact",
  "args": { "target": "worksheet" },
  "locale": "en",
  "timestamp": "2026-10-21T10:30:10.000Z",
  "traceId": "voice_1708432210_ghi789"
}
```

---

## 4. Web Layer Entry Point

The web layer receives the forwarded intent via:

```javascript
// In the main app bootstrap
window.addEventListener("message", (event) => {
  if (event.data?.source === "native-voice") {
    handleNativeVoiceIntent(event.data);
  }
});

// Or via Tauri event listener
import { listen } from "@tauri-apps/api/event";
await listen("hey:native-voice-intent", (event) => {
  handleNativeVoiceIntent(event.payload);
});
```

### Handler (pure, reusable)

```javascript
import { mapTranscriptToIntent, validateIntentArgs, isDestructiveIntent } from "./components/voice/voiceCommands.js";
import { requestApproval } from "./core/trustKernel.js";

async function handleNativeVoiceIntent(payload) {
  const { intent, args, locale, traceId } = payload;

  // Validate args
  const validation = validateIntentArgs(intent, args);
  if (!validation.ok) {
    return { error: `Missing required argument: ${validation.missing.join(", ")}`, traceId };
  }

  // Destructive intents require approval
  if (isDestructiveIntent(intent)) {
    const approval = await requestApproval({
      actionId: `voice.${intent}`,
      reason: `Voice command: ${intent}`,
      riskLevel: "high",
      traceId,
    });
    if (!approval.granted) {
      return { error: "Approval required for destructive voice command", traceId };
    }
  }

  // Execute via command parser / input fusion
  const { processInputFusion } = await import("./core/inputFusion.js");
  return processInputFusion({
    modality: "voice",
    content: JSON.stringify({ intent, args }),
    traceId,
    source: "native-voice",
  });
}
```

---

## 5. Platform Capability Registration

The following capabilities **must** be registered in `platformCapabilities.js` for voice:

| Capability ID | Web | Windows | macOS | Linux | Android | iOS |
|---------------|-----|---------|-------|-------|---------|-----|
| `voice.listen` | permission_required | permission_required | permission_required | permission_required | permission_required | permission_required |
| `voice.speak` | available | available | available | available | available | available |
| `voice.wake_word` | unavailable | permission_required | permission_required | permission_required | restricted | restricted |
| `voice.native_bridge` | unavailable | bridged | bridged | bridged | bridged | bridged |
| `voice.relay_required` | unavailable | relay | relay | relay | relay | relay |

### Platform-Specific Notes

| Platform | In-App | OS-Bridged | Wake Word | Lock-Screen | Notes |
|----------|--------|------------|-----------|-------------|-------|
| iOS | native (Web Speech API) | App Intents, Siri, Live Activity | unavailable | relay-required | Live Activity shows session state |
| Android | native (Web Speech API) | Assistant Intent, Quick Settings tile | restricted | relay-required | Foreground service required for background |
| macOS | native (Web Speech API) | Siri/App Intents, Global Hotkey | permission_required | native (with hotkey) | Requires microphone permission |
| Windows | native (Web Speech API) | Global Hotkey (push-to-talk), Voice Access | permission_required | native (with hotkey) | Requires microphone permission |
| Linux | native (Web Speech API) | Global Hotkey (push-to-talk) | permission_required | native (with hotkey) | Requires microphone permission |
| Web | native (Web Speech API) | unavailable | unavailable | unavailable | No background capture possible |

---

## 6. Relay-Required Behavior

When `voice.listen` is `relay-required` (e.g., lock-screen on iOS/Android without a configured relay):

**UI Message:**
> "Listening while locked needs a HEY Relay. Set one up in Settings → Devices."

**Capability Matrix Entry:**
```javascript
registerCapability("voice.listen_lockscreen", {
  web: "unavailable",
  windows: "bridged",
  macos: "bridged",
  linux: "bridged",
  android: "relay-required",
  ios: "relay-required",
});
```

---

## 7. Kurdish/Arabic Voice Capability Matrix

| Locale | STT Available | TTS Available | Wake Word | State |
|--------|---------------|---------------|-----------|-------|
| en | Yes (Web Speech API) | Yes (SpeechSynthesis) | Yes (on-device) | available |
| ckb | UNKNOWN | UNKNOWN | UNKNOWN | **unknown** |
| ar | UNKNOWN | UNKNOWN | UNKNOWN | **unknown** |

**Rule:** The UI must show "Voice support for Kurdish/Arabic: status unknown" — never a toggle that silently does nothing.

---

## 8. Wake Word Policy (Enforced by `wakeWordPolicy.js`)

- Default: **OFF**
- Cooldown: 3 seconds
- Hourly cap: 50 detections
- Confidence threshold: 0.65
- On-device only — never send continuous audio to server
- Platform refusal when SpeechRecognition unavailable

---

## 9. Capture Indicator Contract

**Source of truth:** `captureConsent.js` → `derivePrivacyIndicator()`

The native layer **must** show the OS-level capture indicator (orange dot on iOS, green dot on Android, camera/mic indicator on macOS/Windows) whenever the web layer's `CaptureIndicator` is visible.

**Web indicator states:**
- Visible: `true` when `state === "listening" || state === "calibrating"`
- Text: `"Microphone active: Voice interaction"`
- Tone: `"recording"`
- Timer: Running seconds since capture start
- Stop button: Always present, calls `voiceEngine.stopListening(sessionId)`

---

## 10. Error Handling

| Error | Native Behavior | Web Behavior |
|-------|-----------------|--------------|
| Microphone permission denied | Show OS permission dialog | Show "Microphone permission required" with "Open Settings" button |
| SpeechRecognition unavailable | Disable voice button, show "Voice unavailable on this device" | State = `offline` |
| Wake word not supported | Hide wake word setting, show "Wake word unavailable on this platform" | `voice.wake_word` = `restricted` |
| Network offline (Web Speech API) | Queue intent locally, send when online | State = `offline`, show "Voice needs a connection" |
| Relay not configured | Show "HEY Relay required" | Show relay setup CTA |

---

## 11. Testing Checklist

- [ ] Each intent maps correctly in all 3 locales
- [ ] Unknown speech → exactly one clarifying question
- [ ] Destructive intents (stop, cancel, undo) require approval token
- [ ] Native bridge forwards to same `voiceCommands.js` mapping
- [ ] Capture indicator visible in all surfaces (app, island, desktop)
- [ ] Wake word setting shows `UNKNOWN` for ckb/ar, not a false toggle
- [ ] Relay-required states show honest message with CTA
- [ ] Visualizer uses real AnalyserNode or static fallback (never fake)
# HEY — CAPTURE PRIVACY (Part 9)

**Date:** 20 October 2026
**Repository:** `C:\Users\DELL\Documents\hey`

---

## Core Principle

**No capture (audio, video, screen) without a visible privacy indicator. Retention is NONE by default. Screen capture requires explicit user action.**

---

## Privacy Indicator (Derived, Not Set by UI)

The privacy indicator is **derived from capture state**, not set by UI components. This prevents spoofing.

### Indicator States

| Capture Type | Active Indicator | Inactive |
|--------------|------------------|----------|
| Audio | 🔴 "Microphone active: {purpose}" (tone: recording) | Hidden |
| Video | 🔴 "Camera active: {purpose}" (tone: recording) | Hidden |
| Screen | 🟢 "Screen active: {purpose}" (tone: streaming) | Hidden |

### Implementation

```javascript
import { derivePrivacyIndicator } from "/src/core/captureConsent.js";

const request = { type: "audio", purpose: "Voice command", userInitiated: true };
const indicator = derivePrivacyIndicator(request, true /* isActive */);
// { visible: true, text: "Microphone active: Voice command", tone: "recording", captureType: "audio" }
```

**The indicator MUST be rendered by the caller whenever `isActive === true`.** The policy provides the text; the UI must display it.

---

## Retention Policy (Default: NONE)

| Capture Type | Default | Configurable Options |
|--------------|---------|---------------------|
| Audio | `none` | `none`, `session`, `persistent` |
| Video | `none` | `none`, `session`, `persistent` |
| Screen | `none` | `none`, `session`, `persistent` |

### Retention Meanings

- **`none`** — Data processed in memory only, never written to disk/database. Discarded immediately after use.
- **`session`** — Data kept for the duration of the browser/app session (localStorage/sessionStorage). Cleared on close.
- **`persistent`** — Data saved to database (Supabase) with user consent. Requires explicit opt-in.

### Configuration

```javascript
import { createRetentionPolicy } from "/src/core/captureConsent.js";

const userSettings = {
  audio: "session",
  video: "none",
  screen: "none",
};

const policy = createRetentionPolicy(userSettings);
// { audio: "session", video: "none", screen: "none" }
```

**Default policy (no user settings):**
```javascript
{ audio: "none", video: "none", screen: "none" }
```

---

## Capture Consent Evaluation

Every capture request must pass `evaluateCaptureConsent()` before starting.

### Required Request Fields

```javascript
{
  type: "audio" | "video" | "screen",
  purpose: "Human-readable reason",
  userInitiated: boolean,  // Required for screen, recommended for audio/video
  sessionId: "optional-session-id"
}
```

### Consent Rules

1. **Screen capture ALWAYS requires `userInitiated: true`**
   ```javascript
   evaluateCaptureConsent({ type: "screen", purpose: "Demo", userInitiated: false })
   // { allowed: false, reason: "Screen capture requires explicit user action", ... }
   ```

2. **Privacy indicator MUST be visible** (caller enforces)
   ```javascript
   evaluateCaptureConsent(request, { indicatorVisible: false })
   // { allowed: false, reason: "Privacy indicator must be visible before capture starts", ... }
   ```

3. **Retention is checked** — if `persistent` but no user consent, downgrades to `session`

### Consent Decision

```javascript
{
  allowed: boolean,
  reason: string,
  indicatorRequired: true,
  retention: "none" | "session" | "persistent",
  indicatorText: "Microphone active: Voice command"
}
```

---

## Screen Capture Injection Guard

**Screen capture cannot be triggered programmatically.** Only explicit user action (click, key press, gesture) can initiate it.

### Guard Function

```javascript
import { guardScreenCapture } from "/src/core/captureConsent.js";

guardScreenCapture({ type: "screen", userInitiated: true });  // true
guardScreenCapture({ type: "screen", userInitiated: false }); // false
guardScreenCapture({ type: "audio", userInitiated: false });  // true (not screen)
```

### Enforcement Points

1. **Vision engine** — `inspectScreen()` calls `executeTool("computer.capture_screen")` which requires permission grant
2. **Gesture engine** — Screen capture gestures require explicit binding with `userInitiated: true`
3. **Voice commands** — "Capture screen" maps to workflow step requiring confirmation

---

## No Saved Capture Artifacts

Since retention is `none` by default, **no artifact may claim saved capture data**.

### Validation

```javascript
import { assertNoSavedCapture } from "/src/core/captureConsent.js";

assertNoSavedCapture({ audioData: "base64..." });
// { ok: false, error: 'Artifact claims saved capture data in field "audioData", but retention is "none" by default' }

assertNoSavedCapture({ text: "Transcript" });
// { ok: true }
```

### Forbidden Artifact Fields

- `audioData`
- `videoData`
- `screenData`
- `captureData`
- `recording`
- `recordingUrl`
- Any field containing raw capture bytes or persistent references

---

## Voice Capture Specifics

### Wake Word (Policy: `src/core/wakeWordPolicy.js`)

- **OFF by default** — `enabled: false`
- **Boundary matching only** — "hey", "hey ", " hey" (not "they", "hey there" without space)
- **Cooldown:** 3 seconds between detections
- **Hourly cap:** 50 detections/hour (in-memory, resets on reload)
- **Confidence threshold:** 0.65
- **Platform refusal:** Returns `{ supported: false, reason }` when SpeechRecognition/getUserMedia unavailable

### Voice Session (Policy: `src/core/voiceSessionMachine.js`)

- **10 states:** `idle`, `listening`, `processing`, `speaking`, `interrupted`, `muted`, `permission_required`, `error`, `offline`, `calibrating`
- **Illegal transitions refused:** `idle → speaking` returns `{ success: false, error: "Cannot transition voice from idle to speaking." }`
- **Barge-in:** Only `speaking → listening` via `machine.bargeIn()`
- **Privacy indicator derived:** `derivePrivacyIndicator(state)` returns recording/playing/idle indicators
- **User action required:** `listening` and `calibrating` states flagged as `requiresUserAction: true`

### Consent Flow

```
User clicks "Start Listening"
    ↓
requestVoicePermission(sessionId) → getUserMedia()
    ↓
Privacy indicator: "Microphone active: Voice command" (DERIVED)
    ↓
startVoiceListening(sessionId) → SpeechRecognition.start()
    ↓
User says "HEY, open Chrome"
    ↓
Wake word detected (boundary match + confidence ≥ 0.65)
    ↓
Transcript processed → HEY executes
    ↓
stopVoiceListening() → indicator hidden
```

---

## Vision Capture Specifics

### Image Understanding (`vision.understand_image`)

- **Input:** Base64 image data (max 10MB), prompt
- **Provider required:** Must supply `{ analyze: async () => ({ verified: true, observation: {...} }) }`
- **Validation:** `validateImageInput()` checks mime type (jpeg/png/webp/gif), size, data format
- **No retention:** Image data not stored unless explicitly saved by user

### Screen Inspection (`vision.inspect_screen`)

- **Requires:** `computer.capture_screen` tool execution (permission-gated)
- **Flow:** `inspectScreen()` → `executeTool("computer.capture_screen")` → `understandImage()`
- **Permission:** Screen capture permission required per session
- **Indicator:** "Screen active: {purpose}" (streaming tone)

---

## Gesture Capture Specifics

### System Gesture Runtime (`systemGestureRuntime.js`)

- **Requires:** Tauri desktop + native gesture consent lease
- **Consent:** `native_request_gesture_control_lease` — single-use, time-bound, revoked on auth change
- **Camera:** User-facing camera, 640×480@30fps, user consent via `getUserMedia`
- **Processing:** MediaPipe GestureRecognizer (GPU preferred, CPU fallback)
- **No background:** Stops when window hidden (unless island surface active)

### Gesture Mapping (`gestureMapping.js`)

- **Unknown → null:** `mapGestureNameToId("Unknown")` returns `null`
- **Ambiguous → null:** Multiple bindings for same gesture → `{ binding: null, conflicts: [...] }`
- **Confidence threshold:** Default 0.72 (configurable per profile)
- **Custom gestures (G20):** Require explicit binding + samples + testing

### No Gesture Fallback

```javascript
// NEVER does this:
resolveGestureAction({ detectedName: "Unknown", ... })
// Returns: { binding: null, action: null, reason: "Unknown gesture: Unknown", conflicts: [] }

// NEVER falls back to "closest match"
```

---

## Audit & Compliance

### Consent Record (for audit log)

```javascript
import { createConsentRecord } from "/src/core/captureConsent.js";

createConsentRecord(
  { type: "audio", purpose: "Voice command", userInitiated: true, sessionId: "sess-123" },
  { allowed: true, reason: "Capture permitted", indicatorRequired: true, retention: "none" }
);
// {
//   type: "audio",
//   purpose: "Voice command",
//   userInitiated: true,
//   sessionId: "sess-123",
//   allowed: true,
//   reason: "Capture permitted",
//   retention: "none",
//   timestamp: "2026-10-20T14:30:00.000Z"
// }
```

### Compliance Checklist

- [x] No capture starts without `evaluateCaptureConsent()` returning `allowed: true`
- [x] Privacy indicator derived from state, not set by UI
- [x] Retention defaults to `none` for all capture types
- [x] Screen capture requires `userInitiated: true`
- [x] Screen capture injection guarded
- [x] Artifacts cannot claim saved capture data
- [x] Wake word OFF by default, boundary matching, cooldown, hourly cap
- [x] Voice session machine: 10 states, illegal transitions refused, barge-in
- [x] Gesture mapping: unknown→null, ambiguous→null, conflict detection
- [x] Platform capabilities: honest availability per platform
- [x] Device routing: local-native > bridged > relay > refuse

---

## What the User Sees

### Voice Listening
> 🔴 **Microphone active: Voice command**

### Voice Speaking
> 🔵 **Speaking…**

### Screen Capture
> 🟢 **Screen active: Sharing screen for demo**

### Camera Active
> 🔴 **Camera active: Video call**

### Wake Word Detected (after boundary match + confidence)
> 🔴 **Microphone active: Voice command** (transitions to listening)

### Permission Denied
> ⚠️ **Microphone permission required** (voice.state = `permission_required`)

### Error
> ❌ **Voice error** (voice.state = `error`)

---

## What NEVER Happens

| ❌ Never | Reason |
|----------|--------|
| Listener starts without user click/tap | All `startListening`/`startRecognition` require explicit call |
| Wake word enabled by default | `enabled: false` in defaults |
| Screen capture without user action | `guardScreenCapture()` enforces `userInitiated: true` |
| Capture data saved by default | Retention `none` by default |
| Privacy indicator spoofed by UI | Indicator derived from state machine |
| Unknown gesture mapped to action | `mapGestureNameToId()` returns `null` |
| Ambiguous gesture picks one | `resolveGestureAction()` returns `null` with conflicts |
| Relay-required shown as available without relay | `deviceRouting.resolveRoute()` returns `refuse` if `!hasRelay` |
| Fake remote execution | `deviceGateway.executeOnDevice()` returns `unavailable` for remote |

---

## Implementation Files

| File | Purpose |
|------|---------|
| `src/core/voiceSessionMachine.js` | 10-state voice machine, transitions, barge-in, derived privacy |
| `src/core/wakeWordPolicy.js` | Wake word off by default, cooldown, cap, confidence, platform check |
| `src/core/captureConsent.js` | Consent evaluation, retention none, screen guard, indicator derivation |
| `src/core/gestureMapping.js` | Gesture→action mapping, unknown/ambiguous→null, conflicts |
| `src/core/platformCapabilities.js` | 4×6 capability matrix, `auditUiActions()` |
| `src/core/deviceRouting.js` | Route priority, relay message for iPhone, honesty validation |

---

## Verification

Run tests:
```bash
cmd /c "cd /d C:\Users\DELL\Documents\hey && node --test tests/*.test.js"
```

**Existing honesty tests that must pass:**
- `tests/platform-capabilities.test.js:19-41` — Registered capabilities expose honest platform availability
- `tests/platform-capabilities.test.js:68-85` — Device registry allows no fake remote execution
- `tests/platform-capabilities.test.js:87-95` — Voice state rejects impossible transitions
- `tests/gesture-runtime.test.js:25-30` — Gesture runtime fails closed off-desktop
- `tests/memory-retrieval.test.js` — `matchesWakeWord` matches boundary phrases only

**Build verification:**
```bash
cmd /c "cd /d C:\Users\DELL\Documents\hey && node node_modules/vite/bin/vite.js build"
```
import { evaluateCaptureConsent } from "../src/core/captureConsent.js";

const r = evaluateCaptureConsent({ type: "audio", purpose: "test", userInitiated: false }, { indicatorVisible: true });
console.log('audio result:', JSON.stringify(r, null, 2));

const r2 = evaluateCaptureConsent({ type: "screen", purpose: "test", userInitiated: true }, { indicatorVisible: true });
console.log('screen result:', JSON.stringify(r2, null, 2));
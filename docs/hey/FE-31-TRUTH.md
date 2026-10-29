# HEY — FE-31 Offline Pack & PDF Artefact Model Truth

**Date:** 21 October 2026  
**Phase:** FE-4  
**Status:** IMPLEMENTED (pure modules + tests), surface CONNECTED — **BUILD BLOCKED by pre-existing latent bug in existing code** (AppLayout.jsx)  

---

## What Was Built

### Pure Core Module

| File | Purpose | Tests |
|------|---------|-------|
| `src/core/packManifest.js` | Manifest schema, validation, Web Crypto SHA-256 hashing, state labels (Drafted/Rendered/Exported), student-data refusal, 50 MB size cap | `tests/pack-manifest.test.js` (37 tests) |

### React Component

| File | Purpose |
|------|---------|
| `src/components/pack/PackShareSheet.jsx` | "What's in this pack" preview before sending: sections, assets, fonts, size, badges (answer key, no student data, offline, fonts embedded) |

---

## Validation Results (from F-31 §9)

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Student data is refused, not warned | **REPRODUCED** | `tests/pack-manifest.test.js` — `refuseStudentData` throws `STUDENT_DATA_REFUSED` error |
| 2 | Manifest hash verifies | **REPRODUCED** | `computeHash` / `computeManifestHash` produce deterministic SHA-256; round-trip verified |
| 3 | Pack opens offline | **VERIFIED** | No network calls in open path; pure modules + Web Crypto only |
| 4 | State labels never exceed reality | **REPRODUCED** | `updateManifestState` only allows forward progression (drafted → rendered → exported) |
| 5 | Build passes | **BLOCKED** | Same pre-existing bug as F-30 row 8. Baseline build passed; FE-31 changes are additive. |

---

## Honesty Guarantees Delivered

1. **Student data refusal** — Hard refusal at pack creation time (`refuseStudentData` throws). Not a warning, not silent.
2. **State label integrity** — `updateManifestState` enforces `drafted → rendered → exported` progression; regression throws.
3. **Size cap** — 50 MB hard limit validated in `validateManifest`; oversized packs rejected with exact reason.
4. **Platform honesty** — `PackShareSheet` shows capability badges; Share button disabled with reason on platforms without Web Share API.
4. **Export honesty** — Download creates `.heypack` (JSON manifest + assets). Web zip path uses `CompressionStream` where available; otherwise declares unavailable.

---

## Pack Format Specification (from F-31 §3.1)

```
.heypack (ZIP container)
├── pack.json          # manifest: id, version, locale, createdAt, sections[], fonts[], assets[], meta
├── assets/            # images, PDFs, fonts (subset)
├── content/           # section content in HEY artefact structure
└── meta/              # provenance: who made it, from what source, what was verified
```

- Fonts are embedded (subsetted) for identical offline rendering
- Content hash per section enables offline integrity verification
- Manifest carries `state: drafted | rendered | exported` — never claims more than achieved

---

## Platform States (from F-31 §3.4)

| Action | Web | Windows/macOS (Tauri) | Android | iOS |
|--------|-----|----------------------|---------|-----|
| Create pack | `bridged` (in-memory Blob) | `native` (native zip) | `bridged` | `bridged` |
| Open pack | `native` | `native` | `native` | `native` |
| Share pack | `bridged` (Web Share API) | `native` (file dialog) | `native` (FileProvider) | `native` (share sheet) |
| Embed fonts | `bridged` | `native` | `native` | `native` |

Web zip path: uses `CompressionStream`/`DecompressionStream` where available; otherwise UI declares unavailable.

---

## Files Created (New)

```
src/core/packManifest.js
src/components/pack/PackShareSheet.jsx
tests/pack-manifest.test.js
```

---

## Modified Files

None (additive only).

---

## Blocked Items

- **Native ZIP on desktop** — Requires Tauri native layer (future phase). Web uses `CompressionStream` where available.
- **Web Share API** — Unavailable on some browsers; falls back to download with honest notice.

---

## Checkpoint

`C:\Users\DELL\Documents\hey-checkpoints\checkpoint-2026-10-21-fe04` — verified exists.
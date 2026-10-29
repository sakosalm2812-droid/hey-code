# FE-CAPTURE-NATIVE-CONTRACT.md
## Capture Extension & Quick Capture — Native Integration Contract

**Document ID:** `FE-CAPTURE-NATIVE-CONTRACT`
**Status:** `DEFINED`
**Date:** 21 October 2026
**Feature:** F-24 — Share Extension & Quick Capture

---

## 1. Overview

This document specifies the exact contract between the HEY web layer and native platform layers for the Capture feature. The web layer is the **single source of truth** for capture item model, routing logic, and EXIF policy. Native layers implement platform-specific share targets and write to a shared store that the web layer reads.

---

## 2. Shared Store Format

### 2.1 Storage Location

| Platform | Store Mechanism | Path/Key |
|----------|-----------------|----------|
| iOS | App Group UserDefaults | `group.com.hey.capture` → `capture_items` |
| Android | SharedPreferences (shared) | `hey_capture_items` |
| macOS | App Group UserDefaults | `group.com.hey.capture` → `capture_items` |
| Windows | LocalAppData JSON | `%LOCALAPPDATA%\HEY\capture\items.json` |
| Linux | XDG_DATA_HOME JSON | `$XDG_DATA_HOME/hey/capture/items.json` |

### 2.2 Store Schema

```json
{
  "version": 1,
  "updatedAt": "2026-10-21T12:00:00.000Z",
  "items": [
    {
      "id": "cap_1700000000_abc123",
      "type": "image",
      "source": "share-extension",
      "sourceApp": "Photos",
      "createdAt": "2026-10-21T12:00:00.000Z",
      "status": "pending",
      "content": null,
      "url": null,
      "file": {
        "name": "whiteboard.jpg",
        "mimeType": "image/jpeg",
        "size": 2048000,
        "dataUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...",
        "localPath": "/shared/container/whiteboard.jpg"
      },
      "voice": null,
      "metadata": {
        "exifStripped": true,
        "keepExif": false
      },
      "suggestedActions": ["use-in-chat", "save-to-memory", "save-to-forge", "print", "discard"],
      "selectedAction": null
    }
  ]
}
```

### 2.3 Item Fields (matches `captureItem.js`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique capture ID (`cap_<timestamp>_<random>`) |
| `type` | string | Yes | One of: `text`, `url`, `image`, `pdf`, `file`, `voice` |
| `source` | string | Yes | One of: `share-extension`, `quick-settings`, `context-menu`, `clipboard`, `in-app`, `drag-drop`, `voice-capture` |
| `sourceApp` | string/null | No | Name of source application |
| `createdAt` | ISO 8601 | Yes | Timestamp of capture |
| `status` | string | Yes | `pending`, `processing`, `completed`, `discarded` |
| `content` | string/null | For text | Text content |
| `url` | string/null | For url | URL |
| `file` | object/null | For image/pdf/file | File metadata |
| `file.name` | string | Yes | Original filename |
| `file.mimeType` | string | Yes | MIME type |
| `file.size` | number | Yes | Size in bytes |
| `file.dataUrl` | string/null | For image | Base64 data URL |
| `file.localPath` | string/null | Native only | Local filesystem path |
| `voice` | object/null | For voice | Voice metadata |
| `voice.durationMs` | number | Yes | Duration in milliseconds |
| `voice.dataUrl` | string | Yes | Audio data URL |
| `metadata` | object | Yes | Processing metadata |
| `metadata.exifStripped` | boolean | Yes | Whether EXIF was stripped |
| `metadata.keepExif` | boolean | Yes | User opted to keep EXIF |
| `suggestedActions` | string[] | Yes | Available actions |
| `selectedAction` | string/null | No | User-selected action |

---

## 3. Accepted MIME Types

### 3.1 By Capture Type

| Type | MIME Types |
|------|------------|
| `text` | `text/plain`, `text/markdown`, `text/csv` |
| `url` | `text/uri-list`, `text/plain` (validated as URL) |
| `image` | `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/svg+xml`, `image/bmp`, `image/tiff`, `image/heic`, `image/heif` |
| `pdf` | `application/pdf` |
| `file` | All types HEY can read (see `filesEngine.js` MIME_CATEGORIES) |
| `voice` | `audio/mpeg`, `audio/wav`, `audio/ogg`, `audio/flac`, `audio/mp4` |

### 3.2 Size Limits

| Platform | Max File Size |
|----------|---------------|
| iOS/macOS | 100 MB (App Group limit) |
| Android | 100 MB (SharedPreferences limit) |
| Windows/Linux | 500 MB (local file) |
| Web (in-app) | 100 MB (browser limit) |

---

## 4. Deep Links

### 4.1 URL Scheme

```
hey://capture/<item-id>
```

### 4.2 Universal Links / App Links

| Platform | URL Pattern |
|----------|-------------|
| iOS | `https://hey.app/capture/<item-id>` |
| Android | `https://hey.app/capture/<item-id>` |
| macOS | `https://hey.app/capture/<item-id>` |
| Windows | `hey://capture/<item-id>` |

### 4.3 Deep Link Actions

| Link | Action |
|------|--------|
| `hey://capture` | Open capture inbox |
| `hey://capture/<id>` | Open specific capture item |
| `hey://capture/new?type=text&content=<encoded>` | Pre-fill capture sheet |
| `hey://capture/new?type=url&url=<encoded>` | Pre-fill with URL |

---

## 5. Platform-Specific Implementation

### 5.1 iOS — Share Extension

**Target:** `NSExtensionActivationRule` for `public.image`, `public.text`, `public.url`, `public.file-url`, `public.data`

**Flow:**
1. User shares content → HEY Share Extension appears
2. Extension validates content type/size
3. For images: strip EXIF (using `CGImageDestination` with `kCGImagePropertyExifDictionary` removed)
4. Write to App Group `group.com.hey.capture` → `capture_items`
5. Show success toast; close extension
6. Main app reads store on foreground

**Code Contract:**
```swift
// Shared store write
let sharedDefaults = UserDefaults(suiteName: "group.com.hey.capture")!
var items = sharedDefaults.array(forKey: "capture_items") as? [[String: Any]] ?? []
items.insert(newItem, at: 0)
if items.count > 500 { items = Array(items.prefix(500)) }
sharedDefaults.set(items, forKey: "capture_items")
```

### 5.2 Android — Share Target + Quick Settings Tile

**Share Target:** `<intent-filter>` with `android:mimeType` for accepted types

**Quick Settings Tile:** `TileService` that launches capture activity

**Flow:**
1. Share Target receives `Intent.ACTION_SEND` / `ACTION_SEND_MULTIPLE`
2. Validate and process (strip EXIF for images via `ExifInterface`)
3. Write to SharedPreferences `hey_capture_items`
4. Show notification with deep link to app

**Code Contract:**
```kotlin
// SharedPreferences write
val prefs = context.getSharedPreferences("hey_capture", Context.MODE_PRIVATE)
val itemsJson = prefs.getString("capture_items", "[]")
val items = JSONArray(itemsJson)
items.put(0, newItemJson)
if (items.length() > 500) { /* trim */ }
prefs.edit().putString("capture_items", items.toString()).apply()
```

### 5.3 macOS — Share Extension + Services Menu

**Share Extension:** Same as iOS, using App Group

**Services Menu:** `NSServices` in `Info.plist` for "Capture to HEY"

**Flow:** Identical to iOS Share Extension

### 5.4 Windows — Share Target + Context Menu

**Share Target:** `ShareTarget` in `Package.appxmanifest` (MSIX) or registry for unpackaged

**Context Menu:** Shell extension (`IContextMenu`) for "Send to HEY"

**Flow:**
1. Share Target activated → write to `%LOCALAPPDATA%\HEY\capture\items.json`
2. Context menu reads file → write to same JSON
3. Main app (Tauri) watches file for changes

**Code Contract:**
```csharp
// Windows local file write
var path = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "HEY", "capture", "items.json");
var json = File.Exists(path) ? File.ReadAllText(path) : "{\"version\":1,\"items\":[]}";
var store = JsonSerializer.Deserialize<CaptureStore>(json);
store.Items.Insert(0, newItem);
if (store.Items.Count > 500) store.Items = store.Items.Take(500).ToList();
store.UpdatedAt = DateTime.UtcNow;
File.WriteAllText(path, JsonSerializer.Serialize(store));
```

### 5.5 Linux — Clipboard/Middle-Click

**No native share target.** In-app fallback only.

**Clipboard Watch:** Monitor `CLIPBOARD` and `PRIMARY` selections for URLs/images

**Middle-Click:** Global shortcut (if compositor allows) → open capture sheet

**Flow:** In-app capture button writes directly to web layer store (localStorage)

### 5.6 Web — In-App Fallback Only

**Web Share Target API:** Not broadly supported for receiving shares.

**In-App:** `CaptureButton.jsx` → `CaptureInbox.jsx` → localStorage (`hey_capture_inbox`)

---

## 6. EXIF Stripping Policy (Native Implementation)

### 6.1 Required Fields to Strip

All fields in `EXIF_STRIP_FIELDS` from `captureItem.js`, including:
- GPS: `GPSLatitude`, `GPSLongitude`, `GPSAltitude`, `GPSTimeStamp`, `GPSDateStamp`
- Device: `Make`, `Model`, `Software`, `BodySerialNumber`, `LensSerialNumber`
- Timestamps: `DateTime`, `DateTimeOriginal`, `DateTimeDigitized`
- Camera Settings: `ExposureTime`, `FNumber`, `ISOSpeedRatings`, `FocalLength`, `Flash`, etc.
- User Data: `UserComment`, `CameraOwnerName`, `ImageUniqueID`

### 6.2 Implementation by Platform

| Platform | Method |
|----------|--------|
| iOS/macOS | `CGImageDestination` with `kCGImagePropertyExifDictionary` = nil |
| Android | `ExifInterface` → set attributes to null → `saveAttributes()` |
| Windows | `Windows.Graphics.Imaging.BitmapEncoder` with stripped metadata |
| Linux | `ExifTool` or `libexif` via shell/FFI |

### 6.3 User Override

If `metadata.keepExif === true`, native layer MUST preserve EXIF and set `metadata.exifStripped = false`.

---

## 7. Native → Web Communication

### 7.1 Tauri (Desktop)

```rust
// Tauri command: capture_get_items
#[tauri::command]
fn capture_get_items() -> Result<Vec<CaptureItem>, String>

// Tauri event: capture_item_added
window.emit("capture_item_added", item)?;
```

### 7.2 Mobile (iOS/Android)

Native app writes to shared store → WebView loads → web layer reads store on `visibilitychange` / `focus` event.

**Bridge Message:**
```javascript
// Injected by native layer
window.__HEY_CAPTURE_BRIDGE__ = {
  getItems: () => Promise<CaptureItem[]>,
  onItemAdded: (callback) => void,
};
```

---

## 8. Error Handling

| Error | Native Behavior | Web Fallback |
|-------|-----------------|--------------|
| Store full | Trim oldest items | Trim oldest items |
| File too large | Reject with toast | Reject with toast |
| EXIF strip fails | Log error, keep original | Log error, keep original |
| Permission denied | Show permission prompt | Show in-app capture button |
| App Group unavailable | Fall back to local file | Use localStorage |

---

## 9. Validation Checklist

- [ ] Shared store schema matches `captureItem.js` exactly
- [ ] All MIME types in `MIME_TO_CATEGORY` accepted
- [ ] EXIF stripping removes all fields in `EXIF_STRIP_FIELDS`
- [ ] Deep links open correct item/inbox
- [ ] Store cleaned at 500 items / 30 days
- [ ] Web layer reads store on foreground
- [ ] No network calls in capture path
- [ ] Works offline

---

## 10. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-10-21 | Initial contract |
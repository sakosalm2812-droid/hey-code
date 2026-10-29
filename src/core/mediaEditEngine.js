const SUPPORTED_MEDIA = Object.freeze({
  video: ["video/mp4", "video/webm", "video/quicktime", "video/x-matroska"],
  audio: ["audio/mpeg", "audio/mp4", "audio/wav", "audio/x-wav", "audio/ogg", "audio/webm", "audio/flac"],
  image: ["image/png", "image/jpeg", "image/webp", "image/gif"],
});

export const LOCAL_MEDIA_OPERATIONS = Object.freeze([
  "trim",
  "speed",
  "mute",
  "volume",
  "crop_aspect",
  "resize",
  "rotate",
  "fade_in",
  "fade_out",
  "compress",
  "extract_audio",
  "convert",
  "clean_audio",
  "remove_silence_audio",
]);

export function detectMediaKind(file) {
  const type = String(file?.type || "").toLowerCase();
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  if (type.startsWith("image/")) return "image";
  return "unknown";
}

export function isSupportedMedia(file) {
  const kind = detectMediaKind(file);
  if (kind === "unknown") return false;
  const allowed = SUPPORTED_MEDIA[kind];
  return allowed.some((type) => type === file.type) || Boolean(file?.name);
}

function clamp(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function safeExtension(file, kind) {
  const name = String(file?.name || "");
  const match = name.match(/\.([a-z0-9]{2,5})$/i);
  if (match) return match[1].toLowerCase();
  if (kind === "video") return "mp4";
  if (kind === "audio") return "mp3";
  return "png";
}

function outputMime(extension, kind) {
  const ext = String(extension || "").toLowerCase();
  const map = {
    mp4: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    m4a: "audio/mp4",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    gif: "image/gif",
  };
  return map[ext] || (kind === "video" ? "video/mp4" : kind === "audio" ? "audio/mpeg" : "image/png");
}

function atempoChain(speed) {
  let remaining = clamp(speed, 0.25, 4, 1);
  const filters = [];
  while (remaining > 2) {
    filters.push("atempo=2");
    remaining /= 2;
  }
  while (remaining < 0.5) {
    filters.push("atempo=0.5");
    remaining /= 0.5;
  }
  filters.push(`atempo=${remaining.toFixed(4)}`);
  return filters.join(",");
}

function cropFilter(aspect) {
  const value = String(aspect || "").toLowerCase();
  if (["9:16", "vertical", "portrait"].includes(value)) {
    return "crop='min(iw,ih*9/16)':'min(ih,iw*16/9)':(iw-ow)/2:(ih-oh)/2";
  }
  if (["1:1", "square"].includes(value)) {
    return "crop='min(iw,ih)':'min(iw,ih)':(iw-ow)/2:(ih-oh)/2";
  }
  if (["16:9", "landscape", "horizontal"].includes(value)) {
    return "crop='min(iw,ih*16/9)':'min(ih,iw*9/16)':(iw-ow)/2:(ih-oh)/2";
  }
  if (["4:5", "social"].includes(value)) {
    return "crop='min(iw,ih*4/5)':'min(ih,iw*5/4)':(iw-ow)/2:(ih-oh)/2";
  }
  return null;
}

export function validateMediaPlan(plan = {}) {
  const sourceOps = Array.isArray(plan.operations) ? plan.operations : [];
  const operations = sourceOps
    .filter((operation) => operation && typeof operation === "object")
    .map((operation) => ({ ...operation, op: String(operation.op || "").trim() }))
    .filter((operation) => LOCAL_MEDIA_OPERATIONS.includes(operation.op))
    .slice(0, 24);

  return {
    version: 1,
    source: plan.source === "ai" ? "ai" : "local",
    summary: String(plan.summary || "Media edit plan").slice(0, 400),
    operations,
    semanticRequests: Array.isArray(plan.semanticRequests)
      ? plan.semanticRequests.map((item) => String(item)).slice(0, 12)
      : [],
    warnings: Array.isArray(plan.warnings)
      ? plan.warnings.map((item) => String(item)).slice(0, 12)
      : [],
  };
}

function compilePlan(plan, context) {
  const kind = context.kind;
  const duration = Number(context.duration || 0);
  const videoFilters = [];
  const audioFilters = [];
  const beforeInput = [];
  const outputArgs = [];
  let mute = false;
  let outputExtension = safeExtension(context.file, kind);
  let extractAudio = false;
  let crf = kind === "video" ? 23 : null;

  for (const operation of validateMediaPlan(plan).operations) {
    switch (operation.op) {
      case "trim": {
        const start = Math.max(0, Number(operation.start || 0));
        const end = Number(operation.end);
        if (start > 0) beforeInput.push("-ss", String(start));
        if (Number.isFinite(end) && end > start) beforeInput.push("-to", String(end));
        break;
      }
      case "speed": {
        const speed = clamp(operation.value, 0.25, 4, 1);
        if (kind === "video") videoFilters.push(`setpts=${(1 / speed).toFixed(6)}*PTS`);
        if (kind !== "image") audioFilters.push(atempoChain(speed));
        break;
      }
      case "mute":
        mute = true;
        break;
      case "volume": {
        if (kind !== "image") {
          const volume = clamp(operation.value, 0, 4, 1);
          audioFilters.push(`volume=${volume.toFixed(3)}`);
        }
        break;
      }
      case "crop_aspect": {
        if (kind !== "audio") {
          const filter = cropFilter(operation.aspect);
          if (filter) videoFilters.push(filter);
        }
        break;
      }
      case "resize": {
        if (kind !== "audio") {
          const height = Math.round(clamp(operation.height, 144, 2160, 720));
          videoFilters.push(`scale=-2:${height}`);
        }
        break;
      }
      case "rotate": {
        if (kind !== "audio") {
          const degrees = ((Number(operation.degrees || 90) % 360) + 360) % 360;
          if (degrees === 90) videoFilters.push("transpose=1");
          if (degrees === 180) videoFilters.push("hflip,vflip");
          if (degrees === 270) videoFilters.push("transpose=2");
        }
        break;
      }
      case "fade_in": {
        const seconds = clamp(operation.duration, 0.1, 10, 0.8);
        if (kind !== "audio") videoFilters.push(`fade=t=in:st=0:d=${seconds}`);
        if (kind !== "image") audioFilters.push(`afade=t=in:st=0:d=${seconds}`);
        break;
      }
      case "fade_out": {
        const seconds = clamp(operation.duration, 0.1, 10, 0.8);
        const start = Math.max(0, duration - seconds);
        if (kind !== "audio" && duration > 0) videoFilters.push(`fade=t=out:st=${start.toFixed(3)}:d=${seconds}`);
        if (kind !== "image" && duration > 0) audioFilters.push(`afade=t=out:st=${start.toFixed(3)}:d=${seconds}`);
        break;
      }
      case "compress":
        if (kind === "video") crf = Math.round(clamp(operation.crf, 18, 34, 28));
        break;
      case "extract_audio":
        extractAudio = true;
        outputExtension = String(operation.format || "mp3").toLowerCase() === "wav" ? "wav" : "mp3";
        break;
      case "convert": {
        const requested = String(operation.format || "").toLowerCase().replace(/^\./, "");
        const allowed = ["mp4", "webm", "mp3", "wav", "ogg", "m4a", "png", "jpg", "jpeg", "webp", "gif"];
        if (allowed.includes(requested)) outputExtension = requested;
        break;
      }
      case "clean_audio":
        if (kind !== "image") audioFilters.push("highpass=f=70,lowpass=f=16000,afftdn=nf=-25");
        break;
      case "remove_silence_audio":
        if (kind === "audio") {
          audioFilters.push("silenceremove=start_periods=1:start_duration=0.2:start_threshold=-38dB:stop_periods=-1:stop_duration=0.35:stop_threshold=-38dB");
        }
        break;
      default:
        break;
    }
  }

  if (extractAudio) {
    if (audioFilters.length && !mute) outputArgs.push("-af", audioFilters.join(","));
    outputArgs.push("-vn");
    if (outputExtension === "mp3") outputArgs.push("-c:a", "libmp3lame", "-b:a", "192k");
    if (outputExtension === "wav") outputArgs.push("-c:a", "pcm_s16le");
  } else if (kind === "video") {
    if (outputExtension === "gif") {
      videoFilters.push("fps=12", "scale=720:-1:flags=lanczos");
      if (videoFilters.length) outputArgs.push("-vf", videoFilters.join(","));
      outputArgs.push("-an");
    } else if (outputExtension === "webm") {
      if (videoFilters.length) outputArgs.push("-vf", videoFilters.join(","));
      if (audioFilters.length && !mute) outputArgs.push("-af", audioFilters.join(","));
      outputArgs.push("-c:v", "libvpx-vp9", "-crf", "32", "-b:v", "0");
      if (mute) outputArgs.push("-an");
      else outputArgs.push("-c:a", "libopus", "-b:a", "128k");
    } else {
      outputExtension = "mp4";
      if (videoFilters.length) outputArgs.push("-vf", videoFilters.join(","));
      if (audioFilters.length && !mute) outputArgs.push("-af", audioFilters.join(","));
      outputArgs.push("-c:v", "libx264", "-preset", "veryfast", "-crf", String(crf));
      if (mute) outputArgs.push("-an");
      else outputArgs.push("-c:a", "aac", "-b:a", "160k");
      outputArgs.push("-movflags", "+faststart");
    }
  } else if (kind === "audio") {
    if (audioFilters.length && !mute) outputArgs.push("-af", audioFilters.join(","));
    if (outputExtension === "wav") outputArgs.push("-c:a", "pcm_s16le");
    else if (outputExtension === "ogg") outputArgs.push("-c:a", "libvorbis", "-q:a", "5");
    else if (outputExtension === "m4a") outputArgs.push("-c:a", "aac", "-b:a", "192k");
    else {
      outputExtension = "mp3";
      outputArgs.push("-c:a", "libmp3lame", "-b:a", "192k");
    }
  } else if (kind === "image") {
    if (videoFilters.length) outputArgs.push("-vf", videoFilters.join(","));
    if (!["png", "jpg", "jpeg", "webp"].includes(outputExtension)) outputExtension = "png";
    outputArgs.push("-frames:v", "1");
  }

  return { beforeInput, outputArgs, outputExtension };
}

class MediaEditEngine {
  constructor() {
    this.ffmpeg = null;
    this.fetchFile = null;
    this.loaded = false;
    this.loading = null;
    this.progressListeners = new Set();
  }

  subscribeProgress(listener) {
    this.progressListeners.add(listener);
    return () => this.progressListeners.delete(listener);
  }

  emitProgress(progress) {
    for (const listener of this.progressListeners) {
      try { listener(progress); } catch { /* UI listeners should never break rendering. */ }
    }
  }

  async ensureLoaded() {
    if (this.loaded && this.ffmpeg) return this.ffmpeg;
    if (this.loading) return this.loading;

    this.loading = (async () => {
      const [{ FFmpeg }, { fetchFile }] = await Promise.all([
        import("@ffmpeg/ffmpeg"),
        import("@ffmpeg/util"),
      ]);
      const ffmpeg = new FFmpeg();
      ffmpeg.on("progress", ({ progress, time }) => {
        this.emitProgress({ progress: Math.max(0, Math.min(1, Number(progress || 0))), time });
      });
      await ffmpeg.load({
        coreURL: "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.js",
        wasmURL: "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.wasm",
      });
      this.ffmpeg = ffmpeg;
      this.fetchFile = fetchFile;
      this.loaded = true;
      return ffmpeg;
    })();

    try {
      return await this.loading;
    } finally {
      this.loading = null;
    }
  }

  async render(file, plan, context = {}) {
    if (!file) throw new Error("Choose a media file first.");
    if (!isSupportedMedia(file)) throw new Error("HEY Media Studio supports video, audio and image files.");
    if (file.size > 350 * 1024 * 1024) {
      throw new Error("This local renderer currently limits a single file to 350 MB to avoid exhausting browser memory.");
    }

    const kind = detectMediaKind(file);
    const ffmpeg = await this.ensureLoaded();
    const inputExt = safeExtension(file, kind);
    const inputName = `hey-input-${Date.now()}.${inputExt}`;
    const compiled = compilePlan(plan, { ...context, file, kind });
    const outputName = `hey-edit-${Date.now()}.${compiled.outputExtension}`;

    this.emitProgress({ progress: 0, stage: "loading" });
    await ffmpeg.writeFile(inputName, await this.fetchFile(file));

    const args = [
      ...compiled.beforeInput,
      "-i", inputName,
      ...compiled.outputArgs,
      "-y", outputName,
    ];

    this.emitProgress({ progress: 0.01, stage: "rendering", args });
    const exitCode = await ffmpeg.exec(args);
    if (exitCode !== 0) throw new Error(`Media renderer exited with code ${exitCode}.`);

    const bytes = await ffmpeg.readFile(outputName);
    const blob = new Blob([bytes], { type: outputMime(compiled.outputExtension, kind) });

    try { await ffmpeg.deleteFile(inputName); } catch { /* best effort */ }
    try { await ffmpeg.deleteFile(outputName); } catch { /* best effort */ }

    this.emitProgress({ progress: 1, stage: "complete" });
    return {
      blob,
      url: URL.createObjectURL(blob),
      filename: outputName,
      mimeType: blob.type,
      size: blob.size,
      plan: validateMediaPlan(plan),
    };
  }
}

export const mediaEditEngine = new MediaEditEngine();

export default mediaEditEngine;

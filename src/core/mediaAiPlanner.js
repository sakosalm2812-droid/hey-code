import { getSetting } from "./settingsRegistry.js";
import { supabaseClient } from "../lib/supabase.js";
import { detectMediaKind, validateMediaPlan } from "./mediaEditEngine.js";

const SEMANTIC_PHRASES = [
  [/(best|highlight|interesting|important) (parts|moments|clips|sections)/i, "highlight extraction"],
  [/(auto.?caption|caption|subtitle|transcrib)/i, "speech transcription / captions"],
  [/(b.?roll|insert footage|cutaway)/i, "B-roll selection/insertion"],
  [/(remove|cut) (?:the )?(boring|bad|awkward|unnecessary) (parts|moments|sections)/i, "semantic cut selection"],
  [/(sync|match) (cuts|edit|video) (to|with) (beat|music)/i, "beat-aware editing"],
  [/(translate) (caption|subtitle|audio|speech)/i, "translation"],
];

function parseNumber(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function parseTimestamp(value) {
  const text = String(value || "").trim();
  if (/^\d+(?:\.\d+)?$/.test(text)) return Number(text);
  const parts = text.split(":").map(Number);
  if (parts.some((part) => !Number.isFinite(part))) return null;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

export function makeLocalMediaPlan(instruction, context = {}) {
  const text = String(instruction || "").trim();
  const lower = text.toLowerCase();
  const operations = [];
  const semanticRequests = [];
  const warnings = [];
  const kind = context.kind || "unknown";

  const rangeMatch = lower.match(/(?:trim|keep|from)\s+(\d+(?::\d{1,2})?(?::\d{1,2})?(?:\.\d+)?)\s*(?:to|[-â€“])\s*(\d+(?::\d{1,2})?(?::\d{1,2})?(?:\.\d+)?)/i);
  if (rangeMatch) {
    const start = parseTimestamp(rangeMatch[1]);
    const end = parseTimestamp(rangeMatch[2]);
    if (start !== null && end !== null && end > start) operations.push({ op: "trim", start, end });
  } else {
    const removeStart = lower.match(/(?:remove|cut|trim)\s+(?:the\s+)?(?:first|start|intro)\s+(\d+(?:\.\d+)?)\s*(?:s|sec|secs|second|seconds)?/i);
    if (removeStart) operations.push({ op: "trim", start: parseNumber(removeStart[1], 0) });
  }

  const speedMatch = lower.match(/(?:speed|make|play).*?(0\.25|0\.5|0\.75|1\.25|1\.5|1\.75|2|3|4)\s*x/i) || lower.match(/(0\.25|0\.5|0\.75|1\.25|1\.5|1\.75|2|3|4)\s*x\s*(?:speed|faster|slower)?/i);
  if (speedMatch) operations.push({ op: "speed", value: parseNumber(speedMatch[1], 1) });

  if (/\b(mute|remove (?:the )?audio|no audio|silent video)\b/i.test(lower)) operations.push({ op: "mute" });
  if (/\b(louder|boost (?:the )?audio|increase volume)\b/i.test(lower)) operations.push({ op: "volume", value: 1.5 });
  if (/\b(quieter|lower (?:the )?volume|decrease volume)\b/i.test(lower)) operations.push({ op: "volume", value: 0.65 });

  if (/\b(9:16|vertical|portrait|reel|tiktok|shorts)\b/i.test(lower)) operations.push({ op: "crop_aspect", aspect: "9:16" });
  else if (/\b(1:1|square)\b/i.test(lower)) operations.push({ op: "crop_aspect", aspect: "1:1" });
  else if (/\b(4:5)\b/i.test(lower)) operations.push({ op: "crop_aspect", aspect: "4:5" });
  else if (/\b(16:9|landscape|youtube)\b/i.test(lower)) operations.push({ op: "crop_aspect", aspect: "16:9" });

  const resolution = lower.match(/\b(2160|1440|1080|720|480|360)p\b/i);
  if (resolution) operations.push({ op: "resize", height: Number(resolution[1]) });

  const rotate = lower.match(/rotate\s+(90|180|270)/i);
  if (rotate) operations.push({ op: "rotate", degrees: Number(rotate[1]) });

  if (/\bfade\s*in\b/i.test(lower)) operations.push({ op: "fade_in", duration: 0.8 });
  if (/\bfade\s*out\b/i.test(lower)) operations.push({ op: "fade_out", duration: 0.8 });
  if (/\b(compress|smaller file|reduce file size|save space)\b/i.test(lower)) operations.push({ op: "compress", crf: 28 });
  if (/\b(extract (?:the )?audio|audio only|turn .* into (?:an )?mp3)\b/i.test(lower)) operations.push({ op: "extract_audio", format: "mp3" });
  if (/\b(clean (?:up )?(?:the )?audio|remove noise|noise reduction|denoise)\b/i.test(lower)) operations.push({ op: "clean_audio" });
  if (kind === "audio" && /\b(remove silence|cut silence|remove pauses|trim silence)\b/i.test(lower)) operations.push({ op: "remove_silence_audio" });

  const convert = lower.match(/(?:convert|export|save).*?\b(mp4|webm|mp3|wav|ogg|png|jpe?g|webp|gif)\b/i);
  if (convert) operations.push({ op: "convert", format: convert[1] });

  for (const [pattern, label] of SEMANTIC_PHRASES) {
    if (pattern.test(text)) semanticRequests.push(label);
  }

  if (!operations.length && !semanticRequests.length && text) {
    semanticRequests.push("free-form content-aware edit");
  }

  if (semanticRequests.length) {
    warnings.push("Content-aware requests need HEY media analysis from a configured multimodal provider. Local rendering will only execute validated operations with exact parameters.");
  }

  return validateMediaPlan({
    source: "local",
    summary: operations.length
      ? `HEY understood ${operations.length} executable edit${operations.length === 1 ? "" : "s"}.`
      : "HEY needs media analysis to decide where the semantic edits should happen.",
    operations,
    semanticRequests,
    warnings,
  });
}

function extractJsonObject(text) {
  const raw = String(text || "").trim();
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { /* try fenced/object extraction */ }
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) {
    try { return JSON.parse(fence[1]); } catch { /* continue */ }
  }
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first >= 0 && last > first) {
    try { return JSON.parse(raw.slice(first, last + 1)); } catch { /* no valid object */ }
  }
  return null;
}

function responseText(data) {
  if (typeof data === "string") return data;
  return data?.text || data?.content || data?.answer || data?.message?.content || data?.message || data?.response?.text || data?.response?.content || data?.response?.message?.content || "";
}

const MEDIA_DIRECTOR_PROMPT = `You are HEY Media Director. Analyze the attached media and the user's edit instruction. Return ONLY JSON. Do not claim you inspected media unless the attachment is actually available to you.
Schema:
{
  "summary": "short description",
  "operations": [
    {"op":"trim","start":0,"end":15},
    {"op":"speed","value":1.25},
    {"op":"mute"},
    {"op":"volume","value":1.2},
    {"op":"crop_aspect","aspect":"9:16|1:1|4:5|16:9"},
    {"op":"resize","height":1080},
    {"op":"rotate","degrees":90},
    {"op":"fade_in","duration":0.8},
    {"op":"fade_out","duration":0.8},
    {"op":"compress","crf":28},
    {"op":"extract_audio","format":"mp3"},
    {"op":"convert","format":"mp4|webm|mp3|wav|ogg|png|jpg|webp|gif"},
    {"op":"clean_audio"},
    {"op":"remove_silence_audio"}
  ],
  "semanticRequests": ["anything requested that cannot be expressed safely with the operations above"],
  "warnings": []
}
Only include operations that are justified by the instruction and media. Never invent timestamps or scene understanding if you cannot inspect the file.`;

export async function requestHeyMediaPlan(file, instruction, context = {}) {
  if (!file) throw new Error("Choose a media file first.");
  const sessionResult = await supabaseClient.auth.getSession();
  const session = sessionResult?.data?.session;
  if (!session?.access_token) throw new Error("Sign in before asking HEY to analyze uploaded media.");

  const baseUrl = getSetting("api.base_url") || "https://api.hey.example";
  const attachmentId = `media_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("attachmentId", attachmentId);

  const uploadResponse = await fetch(`${baseUrl}/functions/v1/hey/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
    body: formData,
  });
  if (!uploadResponse.ok) throw new Error(`Media upload failed (${uploadResponse.status}).`);
  const uploaded = await uploadResponse.json();

  const attachment = {
    id: attachmentId,
    filename: file.name,
    mimeType: file.type,
    size: file.size,
    url: uploaded.url || uploaded.signedUrl || uploaded.path || null,
    metadata: { mediaStudio: true, kind: detectMediaKind(file) },
  };

  const planningResponse = await fetch(`${baseUrl}/functions/v1/hey`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      message: `${MEDIA_DIRECTOR_PROMPT}\n\nUSER INSTRUCTION:\n${String(instruction || "Analyze this media and make a clean, polished edit.")}`,
      conversationId: `media_studio_${Date.now()}`,
      clientRequestId: `media_plan_${Date.now()}`,
      attachments: [attachment],
      metadata: {
        task: "media_edit_plan",
        duration: context.duration || null,
        width: context.width || null,
        height: context.height || null,
        mediaKind: detectMediaKind(file),
      },
    }),
  });

  if (!planningResponse.ok) throw new Error(`HEY media analysis failed (${planningResponse.status}).`);
  const data = await planningResponse.json();
  const parsed = extractJsonObject(responseText(data));
  if (!parsed) throw new Error("The configured AI provider did not return a valid media edit plan.");

  return validateMediaPlan({ ...parsed, source: "ai" });
}

export default {
  makeLocalMediaPlan,
  requestHeyMediaPlan,
};


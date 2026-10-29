export function studioImageProviders(openaiKey, pollinationsKey) {
  return [openaiKey ? "openai" : null, pollinationsKey ? "pollinations" : null].filter(Boolean);
}

export function pollinationsRequest(prompt, { width, height, model = "flux" }, key) {
  if (!key) throw new Error("Pollinations needs a server-side provider key.");
  const url = new URL(`https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}`);
  url.searchParams.set("width", String(width));
  url.searchParams.set("height", String(height));
  url.searchParams.set("model", model);
  return { url: url.href, init: { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(115_000) } };
}

export async function readGeneratedImage(response, maxBytes = 20 * 1024 * 1024) {
  if (!response.ok || !response.body) throw new Error("The image provider returned no usable image.");
  if (Number(response.headers.get("content-length")) > maxBytes) throw new Error("The generated image exceeds the storage limit.");
  const reader = response.body.getReader();
  const chunks = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maxBytes) { await reader.cancel(); throw new Error("The generated image exceeds the storage limit."); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value);
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const ascii = (start, end) => String.fromCharCode(...bytes.slice(start, end));
  const webp = ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP";
  if (png) return { bytes, contentType: "image/png", extension: "png" };
  if (jpeg) return { bytes, contentType: "image/jpeg", extension: "jpg" };
  if (webp) return { bytes, contentType: "image/webp", extension: "webp" };
  throw new Error("The provider response is not a supported image.");
}

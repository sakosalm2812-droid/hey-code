export function safeProviderFailover(status) { return [401, 403, 404, 429].includes(status); }
export function geminiEndpoint(model) { return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`; }

// Covers headers and the entire bounded body; errors contain no URLs or payloads.
export async function fetchProviderResponse(url, init = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const abort = () => controller.abort(new Error('Provider request cancelled.'));
  if (init.signal?.aborted) abort(); else init.signal?.addEventListener('abort', abort, { once: true });
  let timer;
  let reader;
  try {
    controller.signal.throwIfAborted();
    const stopped = new Promise((_resolve, reject) => {
      controller.signal.addEventListener('abort', () => reject(controller.signal.reason), { once: true });
      timer = setTimeout(() => controller.abort(new Error('Provider response timed out.')), timeoutMs);
    });
    const operation = async () => {
      const response = await fetch(url, { ...init, signal: controller.signal });
      if (!response.body) return new Response(null, { status: response.status });
      reader = response.body.getReader();
      let size = 0;
      const chunks = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 2 * 1024 * 1024) throw new Error('Provider response exceeded its size limit.');
        chunks.push(value);
      }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
      return new Response(bytes, { status: response.status, headers: { 'Content-Type': 'application/json' } });
    };
    return await Promise.race([operation(), stopped]);
  } catch {
    controller.abort();
    throw new Error('The provider outcome is uncertain. The request was not repeated.');
  } finally {
    clearTimeout(timer);
    init.signal?.removeEventListener('abort', abort);
    if (controller.signal.aborted) void reader?.cancel().catch(() => {});
  }
}

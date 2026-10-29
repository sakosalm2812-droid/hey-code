export async function fetchWithTimeout(url, options = {}, timeoutMs = 75_000) {
  const controller = new AbortController();
  const abort = () => controller.abort(options.signal.reason);
  if (options.signal?.aborted) abort();
  else options.signal?.addEventListener("abort", abort, { once: true });
  const timeout = setTimeout(() => controller.abort(new DOMException("Request timed out.", "TimeoutError")), timeoutMs);
  try {
    controller.signal.throwIfAborted();
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", abort);
  }
}

export async function fetchWithRetry(url, options = {}, { timeoutMs = 75_000, retries = 0, idempotent = false } = {}) {
  // Never repeat a generation/payment/action merely because its response was lost.
  const retryCount = idempotent ? Math.max(0, Math.min(3, Number(retries) || 0)) : 0;
  let lastError;
  for (let attempt = 0; attempt <= retryCount; attempt += 1) {
    try { return await fetchWithTimeout(url, options, timeoutMs); }
    catch (error) {
      lastError = error;
      if (options.signal?.aborted || error?.name === "AbortError") throw error;
    }
  }
  throw lastError;
}

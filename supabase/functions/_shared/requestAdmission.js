// Policies and identity live in PostgreSQL, shared by every Edge worker.
// Database failures must never silently permit expensive provider dispatch.
export async function admitRequest(client, endpoint) {
  try {
    const { data, error } = await client.rpc("hey_admit_request", { p_endpoint: endpoint });
    if (error || !data || typeof data.allowed !== "boolean" || !Number.isInteger(data.retry_after) || data.retry_after < 0) {
      return { allowed: false, status: 503, code: "ADMISSION_UNAVAILABLE", retryAfter: 10 };
    }
    return data.allowed
      ? { allowed: true, status: 200, retryAfter: 0 }
      : { allowed: false, status: 429, code: "RATE_LIMITED", retryAfter: Math.max(1, data.retry_after) };
  } catch {
    return { allowed: false, status: 503, code: "ADMISSION_UNAVAILABLE", retryAfter: 10 };
  }
}

export function admissionResponse(decision, headers = {}) {
  return new Response(JSON.stringify({
    error: decision.status === 429 ? "Too many requests. Try again shortly." : "Request protection is unavailable. Try again shortly.",
    code: decision.code,
  }), {
    status: decision.status,
    headers: { ...headers, "Content-Type": "application/json", "Retry-After": String(decision.retryAfter) },
  });
}

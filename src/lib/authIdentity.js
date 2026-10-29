/** Canonical, credential-free identity derived from a Supabase auth session. */
export function getAuthSessionId(session) {
  if (session?.user?.session_id) return String(session.user.session_id);
  const token = String(session?.access_token || "");
  try {
    const payload = token.split(".")[1];
    if (!payload || typeof atob !== "function") return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const claims = JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")));
    return typeof claims.session_id === "string" && claims.session_id ? claims.session_id : null;
  } catch {
    return null;
  }
}

export function getAuthIdentity(session) {
  const userId = String(session?.user?.id || "").trim();
  if (!userId) return null;
  return Object.freeze({
    userId,
    sessionId: getAuthSessionId(session),
  });
}

export function sameAuthIdentity(left, right) {
  return (left?.userId || null) === (right?.userId || null)
    && (left?.sessionId || null) === (right?.sessionId || null);
}

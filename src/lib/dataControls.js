export const EXPORT_COLLECTIONS = [
  "hey_conversations",
  "hey_messages",
  "memory",
  "hey_records",
  "hey_settings",
  "hey_devices",
  "hey_permissions",
  "hey_audit_log",
  "hey_audit",
  "hey_proactive_suggestions",
  "hey_routines",
  "hey_action_runs",
  "hey_forge_runs",
  "hey_memory_nodes",
  "hey_memory_edges",
  "hey_quality_reports",
  "hey_vision_logs",
  "hey_generation_jobs",
  "hey_entitlements",
  "hey_push_subscriptions",
];

export async function fetchCollection(client, table, userId) {
  const response = await client.from(table).select("*").eq("user_id", userId);
  if (response?.error) {
    throw new Error(`${table}: ${response.error.message || "could not be read"}`);
  }
  return response?.data ?? [];
}

export async function exportUserData({ client, userId }) {
  const exported = {};
  const skipped = [];

  if (!client || !userId) {
    return {
      data: null,
      skipped,
      error: "A signed-in account is required to export data.",
    };
  }

  try {
    const profile = await client.from("profiles").select("*").eq("id", userId).maybeSingle();
    exported.profile = profile?.error ? null : (profile?.data ?? null);
    if (profile?.error) skipped.push("profiles");
  } catch {
    skipped.push("profiles");
  }

  for (const table of EXPORT_COLLECTIONS) {
    try {
      const rows = await fetchCollection(client, table, userId);
      if (rows.length === 0) continue;
      exported[table] = rows;
    } catch {
      skipped.push(table);
    }
  }

  const now = new Date().toISOString();
  return {
    data: {
      exportedAt: now,
      generatedBy: "HEY — Settings → Account & data → Export my data",
      userId,
      collections: exported,
    },
    skipped,
    error: null,
  };
}

export function downloadJsonAsFile(payload, filename) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return { ok: false, error: "Download is not available in this environment." };
  }
  try {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    return { ok: true, error: null };
  } catch (err) {
    return { ok: false, error: err && typeof err.message === "string" ? err.message : "Download failed." };
  }
}

export async function requestAccountDeletion({ client, userId }) {
  if (!client || !client.functions || typeof client.functions.invoke !== "function") {
    return {
      ok: false,
      error: "The deletion service is not configured. Export your data, then contact the published operator address.",
    };
  }
  try {
    const { data, error } = await client.functions.invoke("delete-account", {
      body: { uid: userId },
    });
    if (error) {
      return { ok: false, error: error.message || "Deletion failed. Try again." };
    }
    if (data && data.error) {
      return { ok: false, error: data.error };
    }
    return { ok: Boolean(data?.ok), error: null };
  } catch (err) {
    return {
      ok: false,
      error: err && typeof err.message === "string" ? err.message : "Deletion service is unavailable.",
    };
  }
}
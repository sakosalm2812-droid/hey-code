import { createClient } from "@supabase/supabase-js";

function getConfig() {
  return {
    url: import.meta.env.VITE_SUPABASE_URL,
    anon: import.meta.env.VITE_SUPABASE_ANON_KEY,
    functionName: import.meta.env.VITE_HEY_ADMIN_FUNCTION || "admin-entitlements",
  };
}

export function ownerEntitlementsConfigured() {
  const { url, anon } = getConfig();
  return Boolean(url && anon);
}

export async function ownerEntitlementRequest(action, payload = {}) {
  const config = getConfig();
  if (!config.url || !config.anon) {
    return { error: "Owner entitlement service is not configured." };
  }

  const supabase = createClient(config.url, config.anon);
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) return { error: "Sign in before using owner controls." };

  const response = await fetch(
    `${config.url}/functions/v1/${config.functionName}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action, ...payload }),
    },
  );

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { error: body.error || `Owner service failed (${response.status}).` };
  }
  return body;
}

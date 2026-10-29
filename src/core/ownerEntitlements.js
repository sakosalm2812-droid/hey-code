import { supabase } from '../lib/supabase.js';
import { fetchWithTimeout } from '../lib/requestTransport.js';
import { getStorageAccountRevision } from './infinity/storage.js';

function getConfig() {
  return {
    url: import.meta.env?.VITE_SUPABASE_URL,
    anon: import.meta.env?.VITE_SUPABASE_ANON_KEY,
    functionName: import.meta.env?.VITE_HEY_ADMIN_FUNCTION || "admin-entitlements",
  };
}

export function ownerEntitlementsConfigured() {
  const { url, anon } = getConfig();
  return Boolean(url && anon);
}

export async function ownerEntitlementRequest(action, payload = {}) {
  const revision = getStorageAccountRevision();
  const config = getConfig();
  if (!config.url || !config.anon) {
    return { error: "Owner entitlement service is not configured." };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) return { error: "Sign in before using owner controls." };
  if (revision !== getStorageAccountRevision()) return { error: 'The active account changed before the request was sent.' };

  try {
  const response = await fetchWithTimeout(
    `${config.url}/functions/v1/${config.functionName}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        apikey: config.anon,
      },
      body: JSON.stringify({ ...payload, action }),
    },
  );

  const body = await response.json().catch(() => ({}));
  if (revision !== getStorageAccountRevision()) return { error: 'The account changed. Inspect the destination before repeating an account change.', requiresReconciliation: action !== 'inspect' };
  if (!response.ok) {
    return { error: body.error || `Owner service failed (${response.status}).` };
  }
  if (action !== 'inspect' && body.success !== true) return { error: 'The owner service did not confirm the account change.' };
  return body;
  } catch (error) { return { error: error.message || 'The owner request failed. Inspect the account before repeating a change.', requiresReconciliation: action !== 'inspect' }; }
}

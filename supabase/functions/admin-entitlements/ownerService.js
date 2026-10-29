import { parseOwners, validateOwnerRequest } from './ownerPolicy.js';

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS", "Cache-Control": "no-store" },
  });

export function createOwnerHandler({ createClient, env }) { return async (req) => {
  try {
  if (req.method === 'OPTIONS') return json({}, 200);
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = env("SUPABASE_URL");
  const anonKey = env("SUPABASE_ANON_KEY");
  const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY");
  let ownerEmails;
  try { ownerEmails = parseOwners(env('HEY_OWNER_EMAILS')); }
  catch { return json({ error: 'Owner service requires exactly three configured owner identities.' }, 503); }

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return json({ error: "Owner service is not configured." }, 503);
  }

  const authHeader = req.headers.get("Authorization") || "";
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user?.email) return json({ error: "Unauthorized" }, 401);
  if (!ownerEmails.includes(user.email.toLowerCase())) return json({ error: "Owner access required" }, 403);
  if (!user.email_confirmed_at) return json({ error: 'Verify your owner email before using these controls.' }, 403);
  const { data: assurance, error: assuranceError } = await userClient.auth.mfa.getAuthenticatorAssuranceLevel(authHeader.replace(/^Bearer\s+/i, ''));
  if (assuranceError || assurance?.currentLevel !== 'aal2') return json({ error: 'Verify your authenticator code before using owner controls.', code: 'MFA_REQUIRED' }, 403);

  let body;
  try { const text = await req.text(); if (text.length > 4096) return json({ error: 'Owner request is too large.' }, 413); body = validateOwnerRequest(JSON.parse(text), ownerEmails); }
  catch (error) { return json({ error: error instanceof Error ? error.message : 'Invalid owner request.' }, 400); }
  const targetEmail = body.targetEmail;

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: targetId, error: lookupError } = await admin.rpc("hey_lookup_user_id_by_email", { target_email: targetEmail });
  if (lookupError || !targetId) return json({ error: "Account not found" }, 404);

  if (body.action === "inspect") {
    const { data, error } = await admin.from("hey_entitlements").select("*").eq("user_id", targetId).maybeSingle();
    if (error) return json({ error: 'The account could not be inspected.' }, 503);
    return json({ entitlement: data || null });
  }

  if (body.action === 'grant' || body.action === 'revoke') {
    const { data, error } = await admin.rpc('hey_change_entitlement', {
      p_request_id: body.requestId, p_actor_id: user.id, p_target_id: targetId,
      p_action: body.action, p_plan: body.plan || 'free', p_role: body.role || 'user',
    });
    if (error || data?.success !== true) return json({ error: 'The account change could not be confirmed. Inspect the account before trying again.', requestId: body.requestId }, 503);
    return json(data);
  }

  return json({ error: "Unknown action" }, 400);
  } catch { return json({ error: 'Owner service is unavailable. Inspect the account before repeating a change.' }, 503); }
}; }

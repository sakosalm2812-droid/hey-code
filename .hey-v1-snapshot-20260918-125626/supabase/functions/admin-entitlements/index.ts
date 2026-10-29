import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const ownerEmails = (Deno.env.get("HEY_OWNER_EMAILS") || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (!supabaseUrl || !anonKey || !serviceKey || ownerEmails.length === 0) {
    return json({ error: "Owner service is not configured." }, 503);
  }

  const authHeader = req.headers.get("Authorization") || "";
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user?.email) return json({ error: "Unauthorized" }, 401);
  if (!ownerEmails.includes(user.email.toLowerCase())) return json({ error: "Owner access required" }, 403);

  const body = await req.json().catch(() => ({}));
  const targetEmail = String(body.targetEmail || "").trim().toLowerCase();
  if (!targetEmail) return json({ error: "targetEmail is required" }, 400);

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: targetId, error: lookupError } = await admin.rpc("hey_lookup_user_id_by_email", { target_email: targetEmail });
  if (lookupError || !targetId) return json({ error: "Account not found" }, 404);

  if (body.action === "inspect") {
    const { data, error } = await admin.from("hey_entitlements").select("*").eq("user_id", targetId).maybeSingle();
    if (error) return json({ error: error.message }, 500);
    return json({ entitlement: data || null });
  }

  if (body.action === "grant") {
    const plan = ["free", "pro", "elite"].includes(body.plan) ? body.plan : "free";
    const role = ["user", "owner"].includes(body.role) ? body.role : "user";
    const { data, error } = await admin.from("hey_entitlements").upsert({
      user_id: targetId,
      plan,
      role,
      granted_by: user.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" }).select().single();
    if (error) return json({ error: error.message }, 500);
    return json({ success: true, entitlement: data });
  }

  if (body.action === "revoke") {
    const { error } = await admin.from("hey_entitlements").update({
      plan: "free",
      role: "user",
      granted_by: user.id,
      updated_at: new Date().toISOString(),
    }).eq("user_id", targetId);
    if (error) return json({ error: error.message }, 500);
    return json({ success: true });
  }

  return json({ error: "Unknown action" }, 400);
});

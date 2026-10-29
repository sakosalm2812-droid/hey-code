import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webPush from "npm:web-push@3.6.7";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/**
 * HEY push endpoint.
 *
 * Actions (all require the caller's JWT):
 *   register   – store the caller's Web Push subscription (dedupe by endpoint)
 *   unregister – mark a subscription revoked and delete it
 *   list       – return the caller's active endpoints (debugging)
 *   notify     – send a payload to the caller's own active subscriptions
 *
 * Sending uses the standard web-push library with VAPID keys. Until
 * VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT are configured in the
 * deployment, this function registers/unregisters but refuses to send.
 */
Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") || "";
  const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") || "";
  const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:push@hey.local";

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return json({ error: "Push service is not configured." }, 503);
  }

  const authHeader = req.headers.get("Authorization") || "";
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return json({ error: "Unauthorized" }, 401);

  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "").trim();

  const admin = createClient(supabaseUrl, serviceKey);

  if (action === "register") {
    const raw = body.subscription;
    const endpoint = String(raw?.endpoint || "").trim();
    if (!endpoint || !endpoint.startsWith("https://")) {
      return json({ error: "A valid subscription endpoint is required." }, 400);
    }
    const keys = raw?.keys && typeof raw.keys === "object" ? raw.keys : {};
    const { data, error } = await admin.from("hey_push_subscriptions").upsert({
      user_id: user.id,
      endpoint,
      keys,
      status: "active",
      user_agent: req.headers.get("user-agent") || undefined,
      updated_at: new Date().toISOString(),
    }, { onConflict: "endpoint" }).select().single();
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true, subscription: data });
  }

  if (action === "unregister") {
    const endpoint = String(body.subscription?.endpoint || "").trim();
    if (!endpoint) return json({ error: "endpoint is required" }, 400);
    const { error } = await admin
      .from("hey_push_subscriptions")
      .update({ status: "revoked", updated_at: new Date().toISOString() })
      .eq("endpoint", endpoint)
      .eq("user_id", user.id);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  if (action === "list") {
    const { data, error } = await admin
      .from("hey_push_subscriptions")
      .select("endpoint, status, created_at")
      .eq("user_id", user.id)
      .eq("status", "active");
    if (error) return json({ error: error.message }, 500);
    return json({ subscriptions: data || [] });
  }

  if (action === "notify") {
    if (!vapidPublicKey || !vapidPrivateKey) {
      return json({
        error: "VAPID keys are not configured for this HEY deployment yet.",
        code: "VAPID_KEYS_NOT_CONFIGURED",
      }, 503);
    }

    const { data: rows, error: fetchError } = await admin
      .from("hey_push_subscriptions")
      .select("endpoint, keys")
      .eq("user_id", user.id)
      .eq("status", "active");
    if (fetchError) return json({ error: fetchError.message }, 500);

    const payload = body.payload && typeof body.payload === "object" ? body.payload : {};
    const title = String(payload.title || "HEY").slice(0, 120);
    const notificationBody = String(
      payload.body || "Something from HEY is waiting for you.",
    ).slice(0, 512);

    webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    const sent: string[] = [];
    const revoked: string[] = [];

    await Promise.all((rows || []).map(async (row) => {
      const subscription = { endpoint: row.endpoint, keys: row.keys };
      try {
        await webPush.sendNotification(subscription, JSON.stringify({
          title,
          body: notificationBody,
          tag: String(payload.tag || `hey-push-${Date.now()}`),
          url: String(payload.url || "/chat"),
          data: payload.data || {},
        }), { TTL: 60 });
        sent.push(row.endpoint);
      } catch (err) {
        if (err && typeof err === "object" && "statusCode" in err) {
          const code = (err as { statusCode?: number }).statusCode;
          if (code === 404 || code === 410) {
            await admin.rpc("hey_revoke_push_subscription", { target_endpoint: row.endpoint });
            revoked.push(row.endpoint);
          }
        }
      }
    }));

    return json({ ok: true, sent: sent.length, endpoints: sent, revoked });
  }

  return json({ error: "Unknown action" }, 400);
});
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/**
 * HEY self-serve account deletion.
 *
 * The caller's JWT is verified, the requested uid must be the caller's own id
 * (self-deletion only), all account-associated rows are purged via the
 * delete_account_data function, then the auth user itself is removed.
 *
 * EXTERNAL_SETUP_REQUIRED:
 *   - deploy this function:  supabase functions deploy delete-account
 *   - apply the delete-account migration (20260919000000_delete_account.sql)
 *   - the function runs forever-free on Supabase with no extra secrets beyond
 *     the standard SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY runtime env vars.
 */
Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceKey) {
    return json({ error: "Deletion service is not configured." }, 503);
  }

  const authHeader = req.headers.get("Authorization") || "";
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return json({ error: "Unauthorized" }, 401);

  const body = await req.json().catch(() => ({}));
  const uid = String(body?.uid || "");

  if (!uid || uid !== user.id) {
    return json({ error: "You can only delete your own account." }, 403);
  }

  const admin = createClient(supabaseUrl, serviceKey);

  const { error: purgeError } = await admin.rpc("delete_account_data", { p_user: uid });
  if (purgeError) {
    return json({ error: `Data purge failed: ${purgeError.message}` }, 500);
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(uid);
  if (deleteError) {
    return json({ error: `Account deletion failed: ${deleteError.message}` }, 500);
  }

  return json({ ok: true });
});
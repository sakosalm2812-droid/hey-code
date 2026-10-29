-- Apply before deploying the owner function. Entitlement changes and receipts
-- commit together; only a server-authenticated service role can call this RPC.
create table if not exists public.hey_owner_change_receipts (
  request_id uuid primary key,
  actor_id uuid not null,
  target_id uuid not null,
  action text not null check (action in ('grant', 'revoke')),
  before_state jsonb,
  after_state jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.hey_owner_change_receipts enable row level security;
revoke all on public.hey_owner_change_receipts from public, anon, authenticated;
grant select on public.hey_owner_change_receipts to service_role;

create or replace function public.hey_change_entitlement(
  p_request_id uuid, p_actor_id uuid, p_target_id uuid,
  p_action text, p_plan text, p_role text
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  previous_receipt public.hey_owner_change_receipts%rowtype;
  before_value jsonb;
  after_value jsonb;
  target_plan text;
  target_role text;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'Service authorization required'; end if;
  if p_request_id is null or p_actor_id is null or p_target_id is null then raise exception 'Identifiers required'; end if;
  if p_action not in ('grant', 'revoke') or p_action is null then raise exception 'Invalid action'; end if;
  target_plan := case when p_action = 'revoke' then 'free' else p_plan end;
  target_role := case when p_action = 'revoke' then 'user' else p_role end;
  if target_plan is null or target_plan not in ('free','pro','elite') or target_role is null or target_role not in ('user','owner') then raise exception 'Invalid entitlement'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_request_id::text, 0));
  select * into previous_receipt from public.hey_owner_change_receipts where request_id = p_request_id;
  if found then
    if previous_receipt.actor_id <> p_actor_id or previous_receipt.target_id <> p_target_id or previous_receipt.action <> p_action
      or previous_receipt.after_state->>'plan' <> target_plan or previous_receipt.after_state->>'role' <> target_role then raise exception 'Request identifier already used for a different change'; end if;
    return jsonb_build_object('success', true, 'requestId', p_request_id, 'entitlement', previous_receipt.after_state, 'replayed', true);
  end if;
  -- Serializes separate changes to the same account, including the first grant.
  perform pg_advisory_xact_lock(hashtextextended(p_target_id::text, 1));
  select to_jsonb(e) into before_value from public.hey_entitlements e where user_id = p_target_id;
  insert into public.hey_entitlements(user_id, plan, role, granted_by, updated_at)
    values(p_target_id, target_plan, target_role, p_actor_id, now())
    on conflict(user_id) do update set plan=excluded.plan, role=excluded.role, granted_by=excluded.granted_by, updated_at=excluded.updated_at;
  select to_jsonb(e) into after_value from public.hey_entitlements e where user_id = p_target_id;
  insert into public.hey_owner_change_receipts(request_id, actor_id, target_id, action, before_state, after_state)
    values(p_request_id, p_actor_id, p_target_id, p_action, before_value, after_value);
  return jsonb_build_object('success', true, 'requestId', p_request_id, 'entitlement', after_value, 'replayed', false);
end;
$$;
revoke all on function public.hey_change_entitlement(uuid,uuid,uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.hey_change_entitlement(uuid,uuid,uuid,text,text,text) to service_role;

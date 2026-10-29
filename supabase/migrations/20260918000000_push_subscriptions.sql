-- HEY push subscriptions
-- Stores validated Web Push subscriptions per user. Writes happen only via
-- the service-role `hey-push` edge function; clients read their own rows.

create table if not exists public.hey_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  keys jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active', 'revoked')),
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.hey_push_subscriptions enable row level security;

revoke all on public.hey_push_subscriptions from anon, authenticated;
grant select on public.hey_push_subscriptions to authenticated;
grant all on public.hey_push_subscriptions to service_role;

drop policy if exists "Read own push subscriptions" on public.hey_push_subscriptions;
create policy "Read own push subscriptions"
  on public.hey_push_subscriptions
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Only expire stale subscriptions when a push endpoint bounces (403/410).
drop function if exists public.hey_revoke_push_subscription(endpoint text);
create or replace function public.hey_revoke_push_subscription(target_endpoint text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.hey_push_subscriptions
  set status = 'revoked', updated_at = now()
  where endpoint = target_endpoint;
$$;

grant execute on function public.hey_revoke_push_subscription(text) to service_role;
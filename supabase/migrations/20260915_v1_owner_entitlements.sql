-- HEY V1 owner/admin entitlements.
-- Apply in Supabase as a privileged migration. Do not expose service-role credentials to the client.

create table if not exists public.hey_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','pro','elite')),
  role text not null default 'user' check (role in ('user','owner')),
  granted_by uuid null references auth.users(id),
  updated_at timestamptz not null default now()
);

alter table public.hey_entitlements enable row level security;

drop policy if exists "read own entitlement" on public.hey_entitlements;
create policy "read own entitlement"
on public.hey_entitlements
for select
to authenticated
using (auth.uid() = user_id);

create or replace function public.hey_lookup_user_id_by_email(target_email text)
returns uuid
language sql
security definer
set search_path = public, auth
as $$
  select id from auth.users where lower(email) = lower(target_email) limit 1;
$$;

revoke all on function public.hey_lookup_user_id_by_email(text) from public, anon, authenticated;
grant execute on function public.hey_lookup_user_id_by_email(text) to service_role;

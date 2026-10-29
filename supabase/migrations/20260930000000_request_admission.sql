-- Apply before deploying the associated Edge functions. No conversation data
-- or credentials are stored. Two bounded rows per user/endpoint are retained.
create table if not exists public.hey_request_buckets (
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  window_seconds integer not null,
  window_start timestamptz not null,
  request_count integer not null check (request_count >= 0),
  primary key (user_id, endpoint, window_seconds)
);
alter table public.hey_request_buckets enable row level security;
revoke all on public.hey_request_buckets from public, anon, authenticated;

create or replace function public.hey_admit_request(p_endpoint text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_now timestamptz := clock_timestamp();
  v_burst integer;
  v_sustained integer;
  v_windows integer[] := array[60, 3600];
  v_limits integer[];
  v_start timestamptz;
  v_bucket public.hey_request_buckets%rowtype;
  v_retry integer := 0;
  v_i integer;
begin
  if v_user is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  case p_endpoint
    when 'chat' then v_burst := 30; v_sustained := 300;
    when 'research' then v_burst := 10; v_sustained := 60;
    when 'vision' then v_burst := 10; v_sustained := 60;
    when 'forge' then v_burst := 3; v_sustained := 20;
    when 'studio.create' then v_burst := 3; v_sustained := 20;
    when 'studio.read' then v_burst := 60; v_sustained := 600;
    else raise exception 'Unknown endpoint' using errcode = '22023';
  end case;
  v_limits := array[v_burst, v_sustained];
  -- Serialize admission for this identity across worker instances. Locks are
  -- released with the transaction, including on errors.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text || ':' || p_endpoint, 0));
  v_now := clock_timestamp();
  for v_i in 1..2 loop
    v_start := pg_catalog.to_timestamp(floor(extract(epoch from v_now) / v_windows[v_i]) * v_windows[v_i]);
    insert into public.hey_request_buckets(user_id, endpoint, window_seconds, window_start, request_count)
      values (v_user, p_endpoint, v_windows[v_i], v_start, 0)
      on conflict (user_id, endpoint, window_seconds) do update
        set window_start = excluded.window_start, request_count = 0
        where hey_request_buckets.window_start <> excluded.window_start;
    select * into v_bucket from public.hey_request_buckets
      where user_id = v_user and endpoint = p_endpoint and window_seconds = v_windows[v_i];
    if v_bucket.request_count >= v_limits[v_i] then
      v_retry := greatest(v_retry, ceil(extract(epoch from (v_start + pg_catalog.make_interval(secs => v_windows[v_i]) - v_now)))::integer);
    end if;
  end loop;
  if v_retry > 0 then
    return jsonb_build_object('allowed', false, 'retry_after', v_retry);
  end if;
  update public.hey_request_buckets set request_count = request_count + 1
    where user_id = v_user and endpoint = p_endpoint;
  return jsonb_build_object('allowed', true, 'retry_after', 0);
end;
$$;
revoke all on function public.hey_admit_request(text) from public, anon;
grant execute on function public.hey_admit_request(text) to authenticated;

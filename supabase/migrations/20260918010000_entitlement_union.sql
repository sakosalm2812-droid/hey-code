-- Union explicit admin grants (hey_entitlements) into Studio quota tier
-- resolution. An explicit grant (written by the admin-entitlements edge
-- function) is the source of truth when present; otherwise the profile plan
-- is used. This mirrors the union already applied in functions/hey.

create or replace function public.hey_reserve_generation(p_user uuid,p_request uuid,p_kind text,p_prompt text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare job public.hey_generation_jobs; tier text; granted_plan text; daily_limit integer; used integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user::text, 0));
  select * into job from public.hey_generation_jobs where user_id=p_user and request_id=p_request;
  if found then return jsonb_build_object('job',to_jsonb(job),'created',false); end if;

  select plan into granted_plan from public.hey_entitlements where user_id=p_user limit 1;
  if lower(coalesce(granted_plan,'')) in ('elite','pro','free') then
    tier := lower(granted_plan);
  else
    select case
      when lower(plan)='elite' or entitlements @> '["elite"]'::jsonb then 'elite'
      when lower(plan)='pro' or entitlements @> '["pro"]'::jsonb then 'pro'
      else 'free' end into tier from public.profiles where id=p_user;
  end if;

  if tier is null then raise exception 'Account could not be verified'; end if;
  if p_kind='video' and tier not in ('pro','elite') then raise exception 'Video generation requires Pro or Elite'; end if;
  daily_limit := case tier when 'elite' then 25 when 'pro' then 10 else 3 end;
  select count(*) into used from public.hey_generation_jobs where user_id=p_user and created_at >= date_trunc('day',now());
  if used >= daily_limit then raise exception 'Daily creation limit reached. Try again tomorrow'; end if;
  insert into public.hey_generation_jobs(user_id,request_id,kind,prompt) values(p_user,p_request,p_kind,p_prompt) returning * into job;
  return jsonb_build_object('job',to_jsonb(job),'created',true);
end; $$;
revoke all on function public.hey_reserve_generation(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.hey_reserve_generation(uuid,uuid,text,text) to service_role;
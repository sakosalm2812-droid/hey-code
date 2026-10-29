-- Generated artifacts remain proposals. A schema check is not execution proof.
alter table public.hey_forge_runs add column if not exists project_id uuid references public.hey_records(id) on delete set null;
create or replace function public.hey_save_forge_result(
  p_request_id text, p_brief text, p_artifact jsonb, p_validation jsonb, p_category text
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  actor uuid := auth.uid();
  existing public.hey_forge_runs%rowtype;
  saved_project uuid;
  saved_run uuid;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if p_request_id is null or length(p_request_id) not between 1 and 120 or p_brief is null or length(p_brief) not between 1 and 2000 then raise exception 'Valid request and brief required'; end if;
  if p_artifact is null or jsonb_typeof(p_artifact) is distinct from 'object' or jsonb_typeof(p_artifact->'files') is distinct from 'array' then raise exception 'Artifact files required'; end if;
  if jsonb_array_length(p_artifact->'files') not between 1 and 250 or octet_length(p_artifact::text) > 6000000 or p_validation->'valid' is distinct from 'true'::jsonb then raise exception 'Invalid generated artifact'; end if;
  perform pg_advisory_xact_lock(hashtextextended(actor::text || ':' || p_request_id, 0));
  select * into existing from public.hey_forge_runs where user_id=actor and request_id=p_request_id;
  if found then
    if existing.artifact <> p_artifact then raise exception 'Request identifier already used for another artifact'; end if;
    return jsonb_build_object('artifact', existing.artifact, 'validation', existing.validation, 'projectId', existing.project_id, 'runId', existing.id, 'replayed', true);
  end if;
  insert into public.hey_records(user_id,kind,title,content,metadata)
    values(actor,'project',left(coalesce(p_artifact->>'title','Generated artifact'),120),left(coalesce(p_artifact->>'summary',''),2000),jsonb_build_object('forge',true,'category',left(coalesce(p_category,''),120),'instructions',p_artifact->'instructions','files',p_artifact->'files'))
    returning id into saved_project;
  insert into public.hey_forge_runs(user_id,brief,artifact,validation,status,request_id,project_id)
    values(actor,p_brief,p_artifact,p_validation,'needs_review',p_request_id,saved_project) returning id into saved_run;
  return jsonb_build_object('artifact',p_artifact,'validation',p_validation,'projectId',saved_project,'runId',saved_run,'replayed',false);
end;
$$;
revoke all on function public.hey_save_forge_result(text,text,jsonb,jsonb,text) from public, anon;
grant execute on function public.hey_save_forge_result(text,text,jsonb,jsonb,text) to authenticated;

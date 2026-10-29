-- HEY account deletion (2026-09-19)
-- Deletes all public-schema rows owning a `user_id` column for the given user,
-- then removes the profile. Foreign keys to auth.users cascade the remaining
-- account tables. Called by the delete-account edge function with the service
-- role; grants are deliberately limited (authenticated + service_role).
--
-- EXTERNAL_SETUP_REQUIRED: apply this migration to the Supabase project.

create or replace function public.delete_account_data(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  row record;
begin
  for row in
    select c.table_name
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.column_name = 'user_id'
  loop
    execute format('delete from public.%I where user_id = $1', row.table_name) using p_user;
  end loop;
  delete from public.profiles where id = p_user;
end;
$$;

grant execute on function public.delete_account_data(uuid) to authenticated, service_role;
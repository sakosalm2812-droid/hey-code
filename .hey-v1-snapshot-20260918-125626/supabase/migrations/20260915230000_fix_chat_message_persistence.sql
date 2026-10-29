create or replace function public.save_hey_exchange(
  p_conversation_id uuid,
  p_user_content text,
  p_assistant_content text,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.hey_conversations
    where id = p_conversation_id
      and user_id = v_user_id
  ) then
    raise exception 'Conversation not found';
  end if;

  insert into public.hey_messages (
    conversation_id,
    user_id,
    role,
    content
  )
  values (
    p_conversation_id,
    v_user_id,
    'user',
    p_user_content
  );

  insert into public.hey_messages (
    conversation_id,
    user_id,
    role,
    content,
    metadata
  )
  values (
    p_conversation_id,
    v_user_id,
    'assistant',
    p_assistant_content,
    coalesce(p_metadata, '{}'::jsonb)
  );
end;
$$;

revoke all on function public.save_hey_exchange(uuid,text,text,jsonb) from public;
grant execute on function public.save_hey_exchange(uuid,text,text,jsonb) to authenticated;

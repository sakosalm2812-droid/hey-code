alter table public.hey_conversations enable row level security;
alter table public.hey_messages enable row level security;

drop policy if exists "Users manage their conversations"
on public.hey_conversations;

drop policy if exists "Users manage their messages"
on public.hey_messages;

drop policy if exists "Users read own conversations"
on public.hey_conversations;

drop policy if exists "Users create own conversations"
on public.hey_conversations;

drop policy if exists "Users update own conversations"
on public.hey_conversations;

drop policy if exists "Users read own messages"
on public.hey_messages;

drop policy if exists "Users create own messages"
on public.hey_messages;

create policy "Users read own conversations"
on public.hey_conversations
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users create own conversations"
on public.hey_conversations
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users update own conversations"
on public.hey_conversations
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users read own messages"
on public.hey_messages
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users create own messages"
on public.hey_messages
for insert
to authenticated
with check (auth.uid() = user_id);

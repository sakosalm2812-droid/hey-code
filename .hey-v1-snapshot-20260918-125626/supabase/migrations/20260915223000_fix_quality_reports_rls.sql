alter table public.hey_quality_reports enable row level security;

drop policy if exists "Users insert their own quality reports"
on public.hey_quality_reports;

create policy "Users insert their own quality reports"
on public.hey_quality_reports
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users view their own quality reports"
on public.hey_quality_reports;

create policy "Users view their own quality reports"
on public.hey_quality_reports
for select
to authenticated
using (auth.uid() = user_id);

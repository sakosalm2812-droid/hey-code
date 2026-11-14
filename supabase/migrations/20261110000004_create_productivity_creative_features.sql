-- Batch C: Productivity + Creative Features — 20 Tables
-- Core Productivity (10)
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  content text not null default '',
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  status text not null check (status in ('todo','doing','done')),
  priority text not null check (priority in ('low','medium','high')),
  created_at timestamptz not null default now()
);

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null,
  sender text not null,
  subject text not null,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income','expense')),
  category text not null,
  amount decimal(10,2) not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  progress integer not null default 0,
  status text not null check (status in ('active','completed','on hold')),
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  target integer not null,
  current integer not null default 0,
  unit text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  datetime timestamptz not null,
  repeat text not null check (repeat in ('none','daily','weekly','monthly')),
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  company text,
  created_at timestamptz not null default now()
);

create table if not exists public.passwords (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  site text not null,
  username text not null,
  password text not null,
  category text not null,
  created_at timestamptz not null default now()
);

-- Creative Tools (10)
create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  track_count integer not null default 0,
  genre text,
  created_at timestamptz not null default now()
);

create table if not exists public.video_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  duration integer not null default 0,
  status text not null check (status in ('editing','rendered','published')),
  created_at timestamptz not null default now()
);

create table if not exists public.color_palettes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  colors text[] not null default '{}',
  type text not null check (type in ('palette','gradient','scheme')),
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null default '',
  word_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  url text not null,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.sketches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  tool text not null check (tool in ('pen','pencil','brush','eraser')),
  canvas text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.voice_memos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  duration integer not null default 0,
  tags text[] not null default '{}',
  url text,
  created_at timestamptz not null default now()
);

create table if not exists public.mood_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  image_url text not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.scenes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  scene text not null,
  description text not null default '',
  order_num integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.audio_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  duration integer not null default 0,
  format text not null check (format in ('mp3','wav','flac')),
  created_at timestamptz not null default now()
);

-- Enable RLS on all tables
alter table public.notes enable row level security;
alter table public.tasks enable row level security;
alter table public.calendar_events enable row level security;
alter table public.messages enable row level security;
alter table public.transactions enable row level security;
alter table public.projects enable row level security;
alter table public.goals enable row level security;
alter table public.reminders enable row level security;
alter table public.contacts enable row level security;
alter table public.passwords enable row level security;
alter table public.playlists enable row level security;
alter table public.video_projects enable row level security;
alter table public.color_palettes enable row level security;
alter table public.documents enable row level security;
alter table public.photos enable row level security;
alter table public.sketches enable row level security;
alter table public.voice_memos enable row level security;
alter table public.mood_cards enable row level security;
alter table public.scenes enable row level security;
alter table public.audio_projects enable row level security;

-- Policies
create policy "notes_own" on public.notes for all using (auth.uid() = user_id);
create policy "tasks_own" on public.tasks for all using (auth.uid() = user_id);
create policy "cal_events_own" on public.calendar_events for all using (auth.uid() = user_id);
create policy "messages_own" on public.messages for all using (auth.uid() = user_id);
create policy "transactions_own" on public.transactions for all using (auth.uid() = user_id);
create policy "projects_own" on public.projects for all using (auth.uid() = user_id);
create policy "goals_own" on public.goals for all using (auth.uid() = user_id);
create policy "reminders_own" on public.reminders for all using (auth.uid() = user_id);
create policy "contacts_own" on public.contacts for all using (auth.uid() = user_id);
create policy "passwords_own" on public.passwords for all using (auth.uid() = user_id);
create policy "playlists_own" on public.playlists for all using (auth.uid() = user_id);
create policy "video_proj_own" on public.video_projects for all using (auth.uid() = user_id);
create policy "palettes_own" on public.color_palettes for all using (auth.uid() = user_id);
create policy "docs_own" on public.documents for all using (auth.uid() = user_id);
create policy "photos_own" on public.photos for all using (auth.uid() = user_id);
create policy "sketches_own" on public.sketches for all using (auth.uid() = user_id);
create policy "voice_memos_own" on public.voice_memos for all using (auth.uid() = user_id);
create policy "mood_cards_own" on public.mood_cards for all using (auth.uid() = user_id);
create policy "scenes_own" on public.scenes for all using (auth.uid() = user_id);
create policy "audio_proj_own" on public.audio_projects for all using (auth.uid() = user_id);

-- Indexes
create index if not exists notes_user_created_idx on public.notes(user_id, created_at desc);
create index if not exists tasks_user_status_idx on public.tasks(user_id, status);
create index if not exists cal_events_user_date_idx on public.calendar_events(user_id, start_time);
create index if not exists messages_user_created_idx on public.messages(user_id, created_at desc);
create index if not exists transactions_user_created_idx on public.transactions(user_id, created_at desc);
create index if not exists projects_user_created_idx on public.projects(user_id, created_at desc);
create index if not exists goals_user_created_idx on public.goals(user_id, created_at desc);
create index if not exists reminders_user_datetime_idx on public.reminders(user_id, datetime);
create index if not exists contacts_user_name_idx on public.contacts(user_id, name);
create index if not exists passwords_user_site_idx on public.passwords(user_id, site);
create index if not exists playlists_user_created_idx on public.playlists(user_id, created_at desc);
create index if not exists video_proj_user_created_idx on public.video_projects(user_id, created_at desc);
create index if not exists palettes_user_created_idx on public.color_palettes(user_id, created_at desc);
create index if not exists docs_user_created_idx on public.documents(user_id, created_at desc);
create index if not exists photos_user_created_idx on public.photos(user_id, created_at desc);
create index if not exists sketches_user_created_idx on public.sketches(user_id, created_at desc);
create index if not exists voice_memos_user_created_idx on public.voice_memos(user_id, created_at desc);
create index if not exists mood_cards_user_created_idx on public.mood_cards(user_id, created_at desc);
create index if not exists scenes_user_order_idx on public.scenes(user_id, order_num);
create index if not exists audio_proj_user_created_idx on public.audio_projects(user_id, created_at desc);
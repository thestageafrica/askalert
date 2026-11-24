-- Prompt 17: web push subscriptions, in-app notifications, preferences

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  endpoint text not null,
  keys jsonb not null default '{}'::jsonb,
  device_label text,
  created_at timestamptz not null default timezone('utc', now()),
  last_success_at timestamptz,
  failed_count integer not null default 0 check (failed_count >= 0),
  unique (user_id, endpoint)
);

create index if not exists push_subscriptions_user_id_idx
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists push_subscriptions_service_all on public.push_subscriptions;
create policy push_subscriptions_service_all on public.push_subscriptions
  for all to service_role
  using (true)
  with check (true);

-- Phase-1: anon can manage rows for the demo user_id until Auth lands.
drop policy if exists push_subscriptions_anon_own on public.push_subscriptions;
create policy push_subscriptions_anon_own on public.push_subscriptions
  for all to anon
  using (user_id = 'demo-buyer')
  with check (user_id = 'demo-buyer');

grant select, insert, update, delete on table public.push_subscriptions
  to service_role, anon, authenticated;

-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  event_type text not null,
  title text not null,
  body text not null,
  url text not null default '/app/',
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists notifications_service_all on public.notifications;
create policy notifications_service_all on public.notifications
  for all to service_role
  using (true)
  with check (true);

drop policy if exists notifications_anon_own on public.notifications;
create policy notifications_anon_own on public.notifications
  for all to anon
  using (user_id = 'demo-buyer')
  with check (user_id = 'demo-buyer');

grant select, insert, update, delete on table public.notifications
  to service_role, anon, authenticated;

-- ---------------------------------------------------------------------------
create table if not exists public.notification_preferences (
  user_id text primary key,
  channels_by_event jsonb not null default '{}'::jsonb,
  quiet_hours jsonb not null default '{"startHour":21,"endHour":7}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists notification_preferences_set_updated_at on public.notification_preferences;
create trigger notification_preferences_set_updated_at
before update on public.notification_preferences
for each row execute function public.set_updated_at();

alter table public.notification_preferences enable row level security;

drop policy if exists notification_preferences_service_all on public.notification_preferences;
create policy notification_preferences_service_all on public.notification_preferences
  for all to service_role
  using (true)
  with check (true);

drop policy if exists notification_preferences_anon_own on public.notification_preferences;
create policy notification_preferences_anon_own on public.notification_preferences
  for all to anon
  using (user_id = 'demo-buyer')
  with check (user_id = 'demo-buyer');

grant select, insert, update, delete on table public.notification_preferences
  to service_role, anon, authenticated;

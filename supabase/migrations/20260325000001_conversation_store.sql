-- Prompt 16: conversation store (threads, messages, budgets, outbox, saved replies)

-- ---------------------------------------------------------------------------
-- threads
-- ---------------------------------------------------------------------------
create table if not exists public.threads (
  id uuid primary key default gen_random_uuid(),
  request_id text not null,
  buyer_id uuid,
  vendor_id uuid,
  status text not null default 'open'
    check (status in ('open', 'closed', 'archived')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists threads_request_id_idx on public.threads (request_id);
create index if not exists threads_buyer_id_idx on public.threads (buyer_id);
create index if not exists threads_vendor_id_idx on public.threads (vendor_id);

drop trigger if exists threads_set_updated_at on public.threads;
create trigger threads_set_updated_at
before update on public.threads
for each row execute function public.set_updated_at();

alter table public.threads enable row level security;

drop policy if exists threads_service_all on public.threads;
create policy threads_service_all on public.threads
  for all to service_role
  using (true)
  with check (true);

-- Phase-1 anon read/write for demo (Access later). Members-only when auth lands.
drop policy if exists threads_anon_all on public.threads;
create policy threads_anon_all on public.threads
  for all to anon
  using (true)
  with check (true);

grant select, insert, update, delete on table public.threads to service_role, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Expand messages stub from Prompt 15
-- ---------------------------------------------------------------------------
alter table public.messages
  add column if not exists filtered boolean not null default false,
  add column if not exists delivered_at timestamptz,
  add column if not exists read_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'messages_sender_role_check'
  ) then
    alter table public.messages
      add constraint messages_sender_role_check
      check (sender_role in ('buyer', 'vendor', 'agent', 'system', 'admin'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'messages_channel_check'
  ) then
    alter table public.messages
      add constraint messages_channel_check
      check (channel in ('app', 'whatsapp', 'web_link'));
  end if;
end
$$;

create index if not exists messages_thread_id_idx on public.messages (thread_id);
create index if not exists messages_thread_created_idx on public.messages (thread_id, created_at);

drop policy if exists messages_anon_all on public.messages;
create policy messages_anon_all on public.messages
  for all to anon
  using (true)
  with check (true);

grant select, insert, update, delete on table public.messages to anon, authenticated;

-- ---------------------------------------------------------------------------
-- saved_replies
-- ---------------------------------------------------------------------------
create table if not exists public.saved_replies (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  text text not null check (char_length(trim(text)) > 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists saved_replies_user_id_idx on public.saved_replies (user_id);

drop trigger if exists saved_replies_set_updated_at on public.saved_replies;
create trigger saved_replies_set_updated_at
before update on public.saved_replies
for each row execute function public.set_updated_at();

alter table public.saved_replies enable row level security;

drop policy if exists saved_replies_service_all on public.saved_replies;
create policy saved_replies_service_all on public.saved_replies
  for all to service_role
  using (true)
  with check (true);

drop policy if exists saved_replies_anon_all on public.saved_replies;
create policy saved_replies_anon_all on public.saved_replies
  for all to anon
  using (true)
  with check (true);

grant select, insert, update, delete on table public.saved_replies to service_role, anon, authenticated;

-- ---------------------------------------------------------------------------
-- message_budgets
-- ---------------------------------------------------------------------------
create table if not exists public.message_budgets (
  request_id text primary key,
  relayed_count integer not null default 0 check (relayed_count >= 0),
  ai_suggestion_count integer not null default 0 check (ai_suggestion_count >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists message_budgets_set_updated_at on public.message_budgets;
create trigger message_budgets_set_updated_at
before update on public.message_budgets
for each row execute function public.set_updated_at();

alter table public.message_budgets enable row level security;

drop policy if exists message_budgets_service_all on public.message_budgets;
create policy message_budgets_service_all on public.message_budgets
  for all to service_role
  using (true)
  with check (true);

drop policy if exists message_budgets_anon_all on public.message_budgets;
create policy message_budgets_anon_all on public.message_budgets
  for all to anon
  using (true)
  with check (true);

grant select, insert, update, delete on table public.message_budgets to service_role, anon, authenticated;

-- ---------------------------------------------------------------------------
-- channel_outbox (WhatsApp stub / deferred sends)
-- ---------------------------------------------------------------------------
create table if not exists public.channel_outbox (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('app', 'whatsapp', 'web_link')),
  thread_id uuid,
  message_id uuid,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'failed')),
  error_code text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists channel_outbox_status_idx on public.channel_outbox (status, created_at);

drop trigger if exists channel_outbox_set_updated_at on public.channel_outbox;
create trigger channel_outbox_set_updated_at
before update on public.channel_outbox
for each row execute function public.set_updated_at();

alter table public.channel_outbox enable row level security;

drop policy if exists channel_outbox_service_all on public.channel_outbox;
create policy channel_outbox_service_all on public.channel_outbox
  for all to service_role
  using (true)
  with check (true);

grant select, insert, update, delete on table public.channel_outbox to service_role;

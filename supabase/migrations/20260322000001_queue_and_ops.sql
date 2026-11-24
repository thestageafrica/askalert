-- Prompt 15: pgmq queue, dead-letter, webhook dedupe, message stubs, db size metrics.
-- Requires extensions available on Supabase free: pgmq, pg_cron, pg_net (enable in Dashboard if create fails).

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;

-- pgmq may live in extension schema; create queue idempotently when available.
do $$
begin
  create extension if not exists pgmq;
exception
  when others then
    raise notice 'pgmq extension not available yet: %', sqlerrm;
end;
$$;

do $$
begin
  perform pgmq.create('askalert_jobs');
exception
  when others then
    raise notice 'pgmq.create askalert_jobs skipped: %', sqlerrm;
end;
$$;

-- ---------------------------------------------------------------------------
-- webhook_events: dedupe ids from Cloudflare Worker forwards
-- ---------------------------------------------------------------------------
create table if not exists public.webhook_events (
  id text primary key,
  source text not null check (source in ('whatsapp', 'paystack')),
  received_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists webhook_events_set_updated_at on public.webhook_events;
create trigger webhook_events_set_updated_at
before update on public.webhook_events
for each row execute function public.set_updated_at();

alter table public.webhook_events enable row level security;

drop policy if exists webhook_events_service_all on public.webhook_events;
create policy webhook_events_service_all on public.webhook_events
  for all to service_role
  using (true)
  with check (true);

grant select, insert, update, delete on table public.webhook_events to service_role;

-- ---------------------------------------------------------------------------
-- job_dead_letters
-- ---------------------------------------------------------------------------
create table if not exists public.job_dead_letters (
  id uuid primary key default gen_random_uuid(),
  queue_name text not null default 'askalert_jobs',
  job_id bigint,
  payload jsonb not null,
  error_code text not null,
  attempts integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists job_dead_letters_created_at_idx on public.job_dead_letters (created_at desc);

drop trigger if exists job_dead_letters_set_updated_at on public.job_dead_letters;
create trigger job_dead_letters_set_updated_at
before update on public.job_dead_letters
for each row execute function public.set_updated_at();

alter table public.job_dead_letters enable row level security;

drop policy if exists job_dead_letters_service_all on public.job_dead_letters;
create policy job_dead_letters_service_all on public.job_dead_letters
  for all to service_role
  using (true)
  with check (true);

grant select, insert, update, delete on table public.job_dead_letters to service_role;

-- ---------------------------------------------------------------------------
-- messages stub (Prompt 16 expands chat; retention jobs need a table now)
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid,
  sender_role text not null default 'system',
  channel text not null default 'app',
  body text,
  body_summary text,
  media jsonb,
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists messages_created_at_idx on public.messages (created_at);
create index if not exists messages_archived_at_idx on public.messages (archived_at);

drop trigger if exists messages_set_updated_at on public.messages;
create trigger messages_set_updated_at
before update on public.messages
for each row execute function public.set_updated_at();

alter table public.messages enable row level security;

drop policy if exists messages_service_all on public.messages;
create policy messages_service_all on public.messages
  for all to service_role
  using (true)
  with check (true);

grant select, insert, update, delete on table public.messages to service_role;

-- ---------------------------------------------------------------------------
-- db_size_snapshots (free-plan monitoring; warn above 350 MB)
-- ---------------------------------------------------------------------------
create table if not exists public.db_size_snapshots (
  id uuid primary key default gen_random_uuid(),
  size_bytes bigint not null,
  size_mb numeric(12, 2) not null,
  warning boolean not null default false,
  note text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists db_size_snapshots_created_at_idx on public.db_size_snapshots (created_at desc);

drop trigger if exists db_size_snapshots_set_updated_at on public.db_size_snapshots;
create trigger db_size_snapshots_set_updated_at
before update on public.db_size_snapshots
for each row execute function public.set_updated_at();

alter table public.db_size_snapshots enable row level security;

drop policy if exists db_size_snapshots_service_all on public.db_size_snapshots;
create policy db_size_snapshots_service_all on public.db_size_snapshots
  for all to service_role
  using (true)
  with check (true);

-- Anon/authenticated cannot write; service role reads for admin API later.
-- Allow authenticated read of latest snapshots for admin dashboard (static admin uses anon today).
drop policy if exists db_size_snapshots_anon_read on public.db_size_snapshots;
create policy db_size_snapshots_anon_read on public.db_size_snapshots
  for select to anon, authenticated
  using (true);

grant select on table public.db_size_snapshots to anon, authenticated;
grant select, insert, update, delete on table public.db_size_snapshots to service_role;

-- ---------------------------------------------------------------------------
-- Runtime config for cron → Edge Function HTTP calls (no secrets in git)
-- ---------------------------------------------------------------------------
create table if not exists public.app_runtime_config (
  key text primary key,
  value text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists app_runtime_config_set_updated_at on public.app_runtime_config;
create trigger app_runtime_config_set_updated_at
before update on public.app_runtime_config
for each row execute function public.set_updated_at();

alter table public.app_runtime_config enable row level security;

drop policy if exists app_runtime_config_service_all on public.app_runtime_config;
create policy app_runtime_config_service_all on public.app_runtime_config
  for all to service_role
  using (true)
  with check (true);

grant select, insert, update, delete on table public.app_runtime_config to service_role;

-- ---------------------------------------------------------------------------
-- Enqueue helper (uses pgmq when present; otherwise inserts into dead-letter as pending fallback note)
-- ---------------------------------------------------------------------------
create or replace function public.enqueue_job(p_payload jsonb)
returns bigint
language plpgsql
security definer
set search_path = public, pgmq
as $$
declare
  msg_id bigint;
begin
  begin
    select pgmq.send('askalert_jobs', p_payload) into msg_id;
    return msg_id;
  exception
    when undefined_function then
      insert into public.job_dead_letters (payload, error_code, attempts)
      values (p_payload, 'pgmq_unavailable', 0);
      return null;
    when others then
      insert into public.job_dead_letters (payload, error_code, attempts)
      values (p_payload, left(sqlerrm, 120), 0);
      return null;
  end;
end;
$$;

revoke all on function public.enqueue_job(jsonb) from public;
grant execute on function public.enqueue_job(jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- Record database size; warn above 350 MB
-- ---------------------------------------------------------------------------
create or replace function public.record_db_size()
returns public.db_size_snapshots
language plpgsql
security definer
set search_path = public
as $$
declare
  bytes bigint;
  mb numeric(12, 2);
  snap public.db_size_snapshots;
begin
  select pg_database_size(current_database()) into bytes;
  mb := round((bytes::numeric / (1024 * 1024)), 2);
  insert into public.db_size_snapshots (size_bytes, size_mb, warning, note)
  values (
    bytes,
    mb,
    mb >= 350,
    case when mb >= 350 then 'Database size at or above 350 MB free-plan warning' else 'ok' end
  )
  returning * into snap;
  return snap;
end;
$$;

revoke all on function public.record_db_size() from public;
grant execute on function public.record_db_size() to service_role;

-- ---------------------------------------------------------------------------
-- Retention: media > 30 days cleared; bodies > 90 days archived to summary
-- ---------------------------------------------------------------------------
create or replace function public.run_message_retention()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  media_cleared integer := 0;
  bodies_archived integer := 0;
begin
  update public.messages
  set media = null,
      updated_at = timezone('utc', now())
  where media is not null
    and created_at < timezone('utc', now()) - interval '30 days';
  get diagnostics media_cleared = row_count;

  update public.messages
  set body_summary = coalesce(body_summary, left(coalesce(body, ''), 160)),
      body = null,
      archived_at = coalesce(archived_at, timezone('utc', now())),
      updated_at = timezone('utc', now())
  where body is not null
    and created_at < timezone('utc', now()) - interval '90 days';
  get diagnostics bodies_archived = row_count;

  return jsonb_build_object(
    'media_cleared', media_cleared,
    'bodies_archived', bodies_archived
  );
end;
$$;

revoke all on function public.run_message_retention() from public;
grant execute on function public.run_message_retention() to service_role;

-- ---------------------------------------------------------------------------
-- Cron: every minute invoke process-jobs Edge Function when URL is configured
-- ---------------------------------------------------------------------------
create or replace function public.invoke_process_jobs_cron()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  base_url text;
  cron_secret text;
begin
  select value into base_url from public.app_runtime_config where key = 'functions_base_url';
  select value into cron_secret from public.app_runtime_config where key = 'cron_shared_secret';
  if base_url is null or length(trim(base_url)) = 0 then
    return;
  end if;
  perform net.http_post(
    url := rtrim(base_url, '/') || '/process-jobs',
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'x-askalert-cron-secret', coalesce(cron_secret, '')
    ),
    body := jsonb_build_object('source', 'pg_cron')
  );
end;
$$;

revoke all on function public.invoke_process_jobs_cron() from public;
grant execute on function public.invoke_process_jobs_cron() to service_role;

do $outer$
begin
  perform cron.unschedule(jobid)
  from cron.job
  where jobname = 'askalert-process-jobs-every-minute';
exception
  when others then
    null;
end;
$outer$;

do $outer$
begin
  perform cron.schedule(
    'askalert-process-jobs-every-minute',
    '* * * * *',
    $job$select public.invoke_process_jobs_cron();$job$
  );
exception
  when others then
    raise notice 'pg_cron schedule skipped: %', sqlerrm;
end;
$outer$;

do $outer$
begin
  perform cron.unschedule(jobid)
  from cron.job
  where jobname = 'askalert-record-db-size-daily';
exception
  when others then
    null;
end;
$outer$;

do $outer$
begin
  perform cron.schedule(
    'askalert-record-db-size-daily',
    '15 1 * * *',
    $job$select public.record_db_size();$job$
  );
exception
  when others then
    raise notice 'db size cron skipped: %', sqlerrm;
end;
$outer$;

do $outer$
begin
  perform cron.unschedule(jobid)
  from cron.job
  where jobname = 'askalert-message-retention-daily';
exception
  when others then
    null;
end;
$outer$;

do $outer$
begin
  perform cron.schedule(
    'askalert-message-retention-daily',
    '30 2 * * *',
    $job$select public.run_message_retention();$job$
  );
exception
  when others then
    raise notice 'retention cron skipped: %', sqlerrm;
end;
$outer$;

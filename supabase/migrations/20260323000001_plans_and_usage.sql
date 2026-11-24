-- Prompt 18: plans, subscriptions, credits, usage ledger, unit-cost settings.

create table if not exists public.plans (
  id text primary key,
  slug text not null unique,
  audience text not null check (audience in ('buyer', 'vendor')),
  name text not null,
  disabled boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists plans_set_updated_at on public.plans;
create trigger plans_set_updated_at
before update on public.plans
for each row execute function public.set_updated_at();

create table if not exists public.plan_versions (
  id uuid primary key default gen_random_uuid(),
  plan_id text not null references public.plans (id) on delete cascade,
  version integer not null,
  price_minor integer not null check (price_minor >= 0),
  currency text not null default 'NGN',
  period_days integer not null check (period_days > 0),
  limits jsonb not null default '{}'::jsonb,
  features jsonb not null default '{}'::jsonb,
  change_note text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (plan_id, version)
);

drop trigger if exists plan_versions_set_updated_at on public.plan_versions;
create trigger plan_versions_set_updated_at
before update on public.plan_versions
for each row execute function public.set_updated_at();

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  plan_id text not null references public.plans (id),
  version integer not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null check (status in ('active', 'expired', 'cancelled')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);
create index if not exists subscriptions_status_idx on public.subscriptions (status);

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

create table if not exists public.credit_wallets (
  user_id uuid primary key,
  balance_minor integer not null default 0 check (balance_minor >= 0),
  currency text not null default 'NGN',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists credit_wallets_set_updated_at on public.credit_wallets;
create trigger credit_wallets_set_updated_at
before update on public.credit_wallets
for each row execute function public.set_updated_at();

create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  amount_minor integer not null,
  reason text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists credit_transactions_user_id_idx on public.credit_transactions (user_id);

drop trigger if exists credit_transactions_set_updated_at on public.credit_transactions;
create trigger credit_transactions_set_updated_at
before update on public.credit_transactions
for each row execute function public.set_updated_at();

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  request_id text,
  type text not null,
  units integer not null check (units > 0),
  est_cost_minor integer not null check (est_cost_minor >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists usage_events_user_id_idx on public.usage_events (user_id);
create index if not exists usage_events_created_at_idx on public.usage_events (created_at desc);
create index if not exists usage_events_type_idx on public.usage_events (type);

drop trigger if exists usage_events_set_updated_at on public.usage_events;
create trigger usage_events_set_updated_at
before update on public.usage_events
for each row execute function public.set_updated_at();

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists app_settings_set_updated_at on public.app_settings;
create trigger app_settings_set_updated_at
before update on public.app_settings
for each row execute function public.set_updated_at();

alter table public.plans enable row level security;
alter table public.plan_versions enable row level security;
alter table public.subscriptions enable row level security;
alter table public.credit_wallets enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.usage_events enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists plans_public_read on public.plans;
create policy plans_public_read on public.plans
  for select to anon, authenticated
  using (disabled = false);

drop policy if exists plan_versions_public_read on public.plan_versions;
create policy plan_versions_public_read on public.plan_versions
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.plans p
      where p.id = plan_id and p.disabled = false
    )
  );

drop policy if exists subscriptions_own_read on public.subscriptions;
create policy subscriptions_own_read on public.subscriptions
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists credit_wallets_own_read on public.credit_wallets;
create policy credit_wallets_own_read on public.credit_wallets
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists credit_transactions_own_read on public.credit_transactions;
create policy credit_transactions_own_read on public.credit_transactions
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists usage_events_own_read on public.usage_events;
create policy usage_events_own_read on public.usage_events
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists app_settings_public_read on public.app_settings;
create policy app_settings_public_read on public.app_settings
  for select to anon, authenticated
  using (true);

grant select on table public.plans to anon, authenticated;
grant select on table public.plan_versions to anon, authenticated;
grant select on table public.app_settings to anon, authenticated;
grant select on table public.subscriptions to authenticated;
grant select on table public.credit_wallets to authenticated;
grant select on table public.credit_transactions to authenticated;
grant select on table public.usage_events to authenticated;

grant select, insert, update, delete on table public.plans to service_role;
grant select, insert, update, delete on table public.plan_versions to service_role;
grant select, insert, update, delete on table public.subscriptions to service_role;
grant select, insert, update, delete on table public.credit_wallets to service_role;
grant select, insert, update, delete on table public.credit_transactions to service_role;
grant select, insert, update, delete on table public.usage_events to service_role;
grant select, insert, update, delete on table public.app_settings to service_role;

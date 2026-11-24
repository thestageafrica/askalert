-- Prompt 22: account foundation — profiles, roles, settings, consents + RLS

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  phone_e164 text,
  phone_verified_at timestamptz,
  avatar_url text,
  deletion_requested_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_phone_e164_format check (
    phone_e164 is null or phone_e164 ~ '^\+[1-9][0-9]{7,14}$'
  )
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null
    check (role in (
      'buyer',
      'vendor',
      'admin_super',
      'admin_operations',
      'admin_support',
      'admin_readonly'
    )),
  status text not null default 'active'
    check (status in ('active', 'pending', 'suspended')),
  verified_tier text not null default 'none'
    check (verified_tier in ('none', 'phone', 'id', 'business', 'trusted')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint user_roles_user_role_unique unique (user_id, role)
);

create index user_roles_user_id_idx on public.user_roles (user_id);

create trigger user_roles_set_updated_at
before update on public.user_roles
for each row execute function public.set_updated_at();

create table public.user_settings (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  last_mode text not null default 'buyer'
    check (last_mode in ('buyer', 'vendor')),
  locale text not null default 'en-NG',
  notification_prefs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger user_settings_set_updated_at
before update on public.user_settings
for each row execute function public.set_updated_at();

create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null
    check (type in ('terms', 'privacy', 'whatsapp_optin', 'marketing')),
  version text not null,
  granted boolean not null,
  granted_at timestamptz,
  source text not null default 'signup',
  created_at timestamptz not null default timezone('utc', now()),
  constraint consents_user_type_version_unique unique (user_id, type, version)
);

create index consents_user_id_idx on public.consents (user_id);

-- Bootstrap profile + buyer role + settings when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, phone_e164)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1), ''),
    nullif(new.raw_user_meta_data ->> 'phone_e164', '')
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role, status, verified_tier)
  values (new.id, 'buyer', 'active', 'none')
  on conflict (user_id, role) do nothing;

  insert into public.user_settings (user_id, last_mode)
  values (new.id, 'buyer')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Self-dealing guard (used by later booking/chat policies and app checks)
create or replace function public.is_own_vendor_user(target_user_id uuid)
returns boolean
language sql
stable
as $$
  select auth.uid() is not null and auth.uid() = target_user_id;
$$;

create or replace function public.assert_not_self_deal(target_vendor_user_id uuid)
returns void
language plpgsql
stable
as $$
begin
  if public.is_own_vendor_user(target_vendor_user_id) then
    raise exception 'SELF_DEAL_FORBIDDEN'
      using hint = 'You cannot book, review, or message your own vendor profile.';
  end if;
end;
$$;

create or replace function public.request_account_deletion(retention_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  update public.profiles
  set
    deletion_requested_at = timezone('utc', now()),
    updated_at = timezone('utc', now())
  where id = auth.uid()
    and deleted_at is null;

  insert into public.audit_log (actor, action, table_name, record_id, payload)
  values (
    auth.uid()::text,
    'account_deletion_requested',
    'profiles',
    auth.uid(),
    jsonb_build_object(
      'retention_note',
      coalesce(
        retention_note,
        'Soft delete requested. Account data is retained for legal and dispute windows, then removed.'
      )
    )
  );
end;
$$;

grant execute on function public.request_account_deletion(text) to authenticated;
grant execute on function public.assert_not_self_deal(uuid) to authenticated;
grant execute on function public.is_own_vendor_user(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.user_settings enable row level security;
alter table public.consents enable row level security;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (auth.uid() = id and deleted_at is null);

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (auth.uid() = id and deleted_at is null)
  with check (auth.uid() = id);

create policy user_roles_select_own on public.user_roles
  for select to authenticated
  using (auth.uid() = user_id);

create policy user_settings_select_own on public.user_settings
  for select to authenticated
  using (auth.uid() = user_id);

create policy user_settings_update_own on public.user_settings
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy user_settings_insert_own on public.user_settings
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy consents_select_own on public.consents
  for select to authenticated
  using (auth.uid() = user_id);

create policy consents_insert_own on public.consents
  for insert to authenticated
  with check (auth.uid() = user_id);

-- Service role full access for admin tooling (Prompt 27 expands audited admin RPCs)
create policy profiles_service_all on public.profiles
  for all to service_role using (true) with check (true);
create policy user_roles_service_all on public.user_roles
  for all to service_role using (true) with check (true);
create policy user_settings_service_all on public.user_settings
  for all to service_role using (true) with check (true);
create policy consents_service_all on public.consents
  for all to service_role using (true) with check (true);

grant select, update on public.profiles to authenticated;
grant select on public.user_roles to authenticated;
grant select, insert, update on public.user_settings to authenticated;
grant select, insert on public.consents to authenticated;
grant select, insert, update, delete on public.profiles to service_role;
grant select, insert, update, delete on public.user_roles to service_role;
grant select, insert, update, delete on public.user_settings to service_role;
grant select, insert, update, delete on public.consents to service_role;

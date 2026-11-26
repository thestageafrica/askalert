-- Prompt 41: service catalog (types, services, vendor rate cards, versions)
-- Archive rows (archived_at); never hard-delete catalog entities.

-- ---------------------------------------------------------------------------
-- category_types
-- ---------------------------------------------------------------------------
create table public.category_types (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete restrict,
  slug text not null,
  name text not null,
  aliases jsonb not null default '[]'::jsonb,
  status text not null default 'active'
    check (status in ('draft', 'active', 'paused', 'archived')),
  sort_order integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint category_types_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint category_types_unique_slug unique (category_id, slug)
);

create index category_types_category_id_idx on public.category_types (category_id);
create index category_types_active_idx on public.category_types (category_id)
  where status = 'active' and archived_at is null;

create trigger category_types_set_updated_at
before update on public.category_types
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- services (catalog services — not app “services”)
-- ---------------------------------------------------------------------------
create table public.services (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete restrict,
  slug text not null,
  name text not null,
  description text not null default '',
  status text not null default 'active'
    check (status in ('draft', 'active', 'paused', 'archived')),
  sort_order integer not null default 0,
  pricing_model text not null
    check (pricing_model in ('banded', 'per_unit', 'flat', 'package', 'quote_only')),
  dimension text not null
    check (dimension in ('guests', 'hours', 'nights', 'units', 'guards', 'items', 'none')),
  dimension_label text,
  unit_label text,
  min_value integer check (min_value is null or min_value >= 0),
  max_value integer check (max_value is null or max_value > 0),
  step integer not null default 1 check (step > 0),
  default_bands jsonb not null default '[]'::jsonb,
  packages jsonb not null default '[]'::jsonb,
  allow_custom_bands boolean not null default true,
  requires_inspection boolean not null default false,
  default_lead_time_hours integer not null default 24 check (default_lead_time_hours >= 0),
  regulated boolean not null default false,
  required_documents jsonb not null default '[]'::jsonb,
  aliases jsonb not null default '[]'::jsonb,
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint services_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint services_unique_slug unique (category_id, slug),
  constraint services_min_max check (
    min_value is null
    or max_value is null
    or min_value < max_value
  )
);

create index services_category_id_idx on public.services (category_id);
create index services_active_idx on public.services (category_id)
  where status = 'active' and archived_at is null;

create trigger services_set_updated_at
before update on public.services
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- service_types
-- ---------------------------------------------------------------------------
create table public.service_types (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services (id) on delete restrict,
  type_id uuid not null references public.category_types (id) on delete restrict,
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint service_types_unique unique (service_id, type_id)
);

create index service_types_service_id_idx on public.service_types (service_id);
create index service_types_type_id_idx on public.service_types (type_id);

create trigger service_types_set_updated_at
before update on public.service_types
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- catalog_attributes
-- ---------------------------------------------------------------------------
create table public.catalog_attributes (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('category', 'type', 'service')),
  scope_id uuid not null,
  key text not null,
  label text not null,
  type text not null
    check (type in ('text', 'number', 'money', 'date', 'select', 'multi', 'area', 'boolean')),
  required boolean not null default false,
  options jsonb,
  applies_to text not null check (applies_to in ('need', 'offer', 'both')),
  validation jsonb,
  sort_order integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint catalog_attributes_key_format check (key ~ '^[a-z][a-z0-9_]*$')
);

create index catalog_attributes_scope_idx on public.catalog_attributes (scope, scope_id);

create trigger catalog_attributes_set_updated_at
before update on public.catalog_attributes
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- catalog_aliases
-- ---------------------------------------------------------------------------
create table public.catalog_aliases (
  id uuid primary key default gen_random_uuid(),
  entity text not null check (entity in ('category', 'type', 'service')),
  entity_id uuid not null,
  alias text not null,
  language text not null check (language in ('en', 'pcm', 'yo', 'ig', 'ha')),
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint catalog_aliases_alias_nonempty check (char_length(trim(alias)) > 0)
);

create index catalog_aliases_entity_idx on public.catalog_aliases (entity, entity_id);
create index catalog_aliases_alias_trgm_idx on public.catalog_aliases (lower(alias));

create trigger catalog_aliases_set_updated_at
before update on public.catalog_aliases
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- catalog_versions (immutable publish snapshots)
-- ---------------------------------------------------------------------------
create table public.catalog_versions (
  id uuid primary key default gen_random_uuid(),
  version_number integer not null check (version_number > 0),
  snapshot jsonb not null,
  published_by text,
  published_at timestamptz,
  change_note text not null default '',
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint catalog_versions_version_positive check (version_number > 0)
);

create unique index catalog_versions_version_number_idx
  on public.catalog_versions (version_number)
  where archived_at is null;

create index catalog_versions_published_at_idx on public.catalog_versions (published_at desc);

create trigger catalog_versions_set_updated_at
before update on public.catalog_versions
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- vendor catalog tables
-- ---------------------------------------------------------------------------
create table public.vendor_categories (
  id uuid primary key default gen_random_uuid(),
  vendor_profile_id uuid not null references public.vendor_profiles (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete restrict,
  status text not null default 'active'
    check (status in ('draft', 'active', 'paused', 'archived')),
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint vendor_categories_unique unique (vendor_profile_id, category_id)
);

create table public.vendor_types (
  id uuid primary key default gen_random_uuid(),
  vendor_profile_id uuid not null references public.vendor_profiles (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete restrict,
  type_id uuid not null references public.category_types (id) on delete restrict,
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint vendor_types_unique unique (vendor_profile_id, type_id)
);

create table public.vendor_services (
  id uuid primary key default gen_random_uuid(),
  vendor_profile_id uuid not null references public.vendor_profiles (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete restrict,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'paused', 'archived')),
  min_notice_hours integer not null default 24 check (min_notice_hours >= 0),
  deposit_pct integer not null default 0 check (deposit_pct >= 0 and deposit_pct <= 100),
  inclusions jsonb not null default '[]'::jsonb,
  exclusions jsonb not null default '[]'::jsonb,
  notes text not null default '',
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint vendor_services_unique unique (vendor_profile_id, service_id)
);

create table public.vendor_service_types (
  id uuid primary key default gen_random_uuid(),
  vendor_service_id uuid not null references public.vendor_services (id) on delete cascade,
  type_id uuid not null references public.category_types (id) on delete restrict,
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint vendor_service_types_unique unique (vendor_service_id, type_id)
);

create table public.vendor_rates (
  id uuid primary key default gen_random_uuid(),
  vendor_service_id uuid not null references public.vendor_services (id) on delete cascade,
  dim_min integer not null check (dim_min >= 0),
  dim_max integer not null check (dim_max > 0),
  basis text not null check (basis in ('per_unit', 'total')),
  price_minor integer not null check (price_minor > 0),
  currency text not null default 'NGN' check (currency = 'NGN'),
  min_charge_minor integer check (min_charge_minor is null or min_charge_minor > 0),
  label text,
  valid_from timestamptz,
  valid_to timestamptz,
  sort_order integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint vendor_rates_dim_order check (dim_min <= dim_max)
);

create index vendor_rates_vendor_service_id_idx on public.vendor_rates (vendor_service_id);

create table public.vendor_addons (
  id uuid primary key default gen_random_uuid(),
  vendor_service_id uuid not null references public.vendor_services (id) on delete cascade,
  name text not null,
  price_minor integer not null check (price_minor > 0),
  basis text not null check (basis in ('per_unit', 'total', 'flat')),
  max_qty integer check (max_qty is null or max_qty > 0),
  notes text not null default '',
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index vendor_addons_vendor_service_id_idx on public.vendor_addons (vendor_service_id);

create trigger vendor_categories_set_updated_at
before update on public.vendor_categories
for each row execute function public.set_updated_at();

create trigger vendor_types_set_updated_at
before update on public.vendor_types
for each row execute function public.set_updated_at();

create trigger vendor_services_set_updated_at
before update on public.vendor_services
for each row execute function public.set_updated_at();

create trigger vendor_service_types_set_updated_at
before update on public.vendor_service_types
for each row execute function public.set_updated_at();

create trigger vendor_rates_set_updated_at
before update on public.vendor_rates
for each row execute function public.set_updated_at();

create trigger vendor_addons_set_updated_at
before update on public.vendor_addons
for each row execute function public.set_updated_at();

-- Link requests / offers to catalog version used
alter table public.requests
  add column if not exists catalog_version_id uuid references public.catalog_versions (id) on delete set null;

alter table public.offers
  add column if not exists catalog_version_id uuid references public.catalog_versions (id) on delete set null;

create index if not exists requests_catalog_version_id_idx on public.requests (catalog_version_id);
create index if not exists offers_catalog_version_id_idx on public.offers (catalog_version_id);

-- ---------------------------------------------------------------------------
-- Publish audit (skip if audit_log missing)
-- ---------------------------------------------------------------------------
create or replace function public.catalog_version_publish_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.published_at is null then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.published_at is not distinct from new.published_at then
    return new;
  end if;
  if to_regclass('public.audit_log') is not null then
    insert into public.audit_log (actor, action, table_name, record_id, payload)
    values (
      coalesce(new.published_by, 'catalog'),
      'publish',
      'catalog_versions',
      new.id::text,
      jsonb_build_object(
        'version_number', new.version_number,
        'change_note', new.change_note,
        'published_at', new.published_at
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists catalog_versions_publish_audit on public.catalog_versions;
create trigger catalog_versions_publish_audit
after insert or update of published_at on public.catalog_versions
for each row execute function public.catalog_version_publish_audit();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.category_types enable row level security;
alter table public.services enable row level security;
alter table public.service_types enable row level security;
alter table public.catalog_attributes enable row level security;
alter table public.catalog_aliases enable row level security;
alter table public.catalog_versions enable row level security;
alter table public.vendor_categories enable row level security;
alter table public.vendor_types enable row level security;
alter table public.vendor_services enable row level security;
alter table public.vendor_service_types enable row level security;
alter table public.vendor_rates enable row level security;
alter table public.vendor_addons enable row level security;

-- Public read: active, not archived
create policy category_types_public_read on public.category_types
  for select to anon, authenticated
  using (status = 'active' and archived_at is null);

create policy services_public_read on public.services
  for select to anon, authenticated
  using (status = 'active' and archived_at is null);

create policy service_types_public_read on public.service_types
  for select to anon, authenticated
  using (archived_at is null);

create policy catalog_attributes_public_read on public.catalog_attributes
  for select to anon, authenticated
  using (archived_at is null);

create policy catalog_aliases_public_read on public.catalog_aliases
  for select to anon, authenticated
  using (archived_at is null);

create policy catalog_versions_public_read on public.catalog_versions
  for select to anon, authenticated
  using (published_at is not null and archived_at is null);

-- Vendor-owned rows
create policy vendor_categories_owner on public.vendor_categories
  for select to authenticated
  using (
    exists (
      select 1 from public.vendor_profiles vp
      where vp.id = vendor_categories.vendor_profile_id
        and (vp.user_id = auth.uid() or public.is_admin())
    )
  );

create policy vendor_services_owner on public.vendor_services
  for select to authenticated
  using (
    exists (
      select 1 from public.vendor_profiles vp
      where vp.id = vendor_services.vendor_profile_id
        and (vp.user_id = auth.uid() or public.is_admin())
    )
  );

-- Admin writes when is_admin exists (always in this codebase)
create policy category_types_admin_write on public.category_types
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy services_admin_write on public.services
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy service_types_admin_write on public.service_types
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy catalog_attributes_admin_write on public.catalog_attributes
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy catalog_aliases_admin_write on public.catalog_aliases
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy catalog_versions_admin_write on public.catalog_versions
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Phase-1 fallback anon catalog admin (same pattern as categories)
create policy category_types_phase1_anon_write on public.category_types
  for all to anon
  using (true)
  with check (true);

create policy services_phase1_anon_write on public.services
  for all to anon
  using (true)
  with check (true);

create policy service_types_phase1_anon_write on public.service_types
  for all to anon
  using (true)
  with check (true);

create policy catalog_attributes_phase1_anon_write on public.catalog_attributes
  for all to anon
  using (true)
  with check (true);

create policy catalog_aliases_phase1_anon_write on public.catalog_aliases
  for all to anon
  using (true)
  with check (true);

create policy catalog_versions_phase1_anon_write on public.catalog_versions
  for all to anon
  using (true)
  with check (true);

-- Vendor self-service writes
create policy vendor_categories_owner_write on public.vendor_categories
  for all to authenticated
  using (
    exists (
      select 1 from public.vendor_profiles vp
      where vp.id = vendor_categories.vendor_profile_id
        and vp.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.vendor_profiles vp
      where vp.id = vendor_categories.vendor_profile_id
        and vp.user_id = auth.uid()
    )
  );

create policy vendor_types_owner_write on public.vendor_types
  for all to authenticated
  using (
    exists (
      select 1 from public.vendor_profiles vp
      where vp.id = vendor_types.vendor_profile_id
        and vp.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.vendor_profiles vp
      where vp.id = vendor_types.vendor_profile_id
        and vp.user_id = auth.uid()
    )
  );

create policy vendor_services_owner_write on public.vendor_services
  for all to authenticated
  using (
    exists (
      select 1 from public.vendor_profiles vp
      where vp.id = vendor_services.vendor_profile_id
        and vp.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.vendor_profiles vp
      where vp.id = vendor_services.vendor_profile_id
        and vp.user_id = auth.uid()
    )
  );

create policy vendor_service_types_owner_write on public.vendor_service_types
  for all to authenticated
  using (
    exists (
      select 1
      from public.vendor_services vs
      join public.vendor_profiles vp on vp.id = vs.vendor_profile_id
      where vs.id = vendor_service_types.vendor_service_id
        and vp.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.vendor_services vs
      join public.vendor_profiles vp on vp.id = vs.vendor_profile_id
      where vs.id = vendor_service_types.vendor_service_id
        and vp.user_id = auth.uid()
    )
  );

create policy vendor_rates_owner_write on public.vendor_rates
  for all to authenticated
  using (
    exists (
      select 1
      from public.vendor_services vs
      join public.vendor_profiles vp on vp.id = vs.vendor_profile_id
      where vs.id = vendor_rates.vendor_service_id
        and vp.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.vendor_services vs
      join public.vendor_profiles vp on vp.id = vs.vendor_profile_id
      where vs.id = vendor_rates.vendor_service_id
        and vp.user_id = auth.uid()
    )
  );

create policy vendor_addons_owner_write on public.vendor_addons
  for all to authenticated
  using (
    exists (
      select 1
      from public.vendor_services vs
      join public.vendor_profiles vp on vp.id = vs.vendor_profile_id
      where vs.id = vendor_addons.vendor_service_id
        and vp.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.vendor_services vs
      join public.vendor_profiles vp on vp.id = vs.vendor_profile_id
      where vs.id = vendor_addons.vendor_service_id
        and vp.user_id = auth.uid()
    )
  );

-- service_role: full access
create policy category_types_service_all on public.category_types for all to service_role using (true) with check (true);
create policy services_service_all on public.services for all to service_role using (true) with check (true);
create policy service_types_service_all on public.service_types for all to service_role using (true) with check (true);
create policy catalog_attributes_service_all on public.catalog_attributes for all to service_role using (true) with check (true);
create policy catalog_aliases_service_all on public.catalog_aliases for all to service_role using (true) with check (true);
create policy catalog_versions_service_all on public.catalog_versions for all to service_role using (true) with check (true);
create policy vendor_categories_service_all on public.vendor_categories for all to service_role using (true) with check (true);
create policy vendor_types_service_all on public.vendor_types for all to service_role using (true) with check (true);
create policy vendor_services_service_all on public.vendor_services for all to service_role using (true) with check (true);
create policy vendor_service_types_service_all on public.vendor_service_types for all to service_role using (true) with check (true);
create policy vendor_rates_service_all on public.vendor_rates for all to service_role using (true) with check (true);
create policy vendor_addons_service_all on public.vendor_addons for all to service_role using (true) with check (true);

grant select on table public.category_types to anon, authenticated;
grant select on table public.services to anon, authenticated;
grant select on table public.service_types to anon, authenticated;
grant select on table public.catalog_attributes to anon, authenticated;
grant select on table public.catalog_aliases to anon, authenticated;
grant select on table public.catalog_versions to anon, authenticated;

grant select, insert, update, delete on table public.category_types to anon, authenticated;
grant select, insert, update, delete on table public.services to anon, authenticated;
grant select, insert, update, delete on table public.service_types to anon, authenticated;
grant select, insert, update, delete on table public.catalog_attributes to anon, authenticated;
grant select, insert, update, delete on table public.catalog_aliases to anon, authenticated;
grant select, insert, update, delete on table public.catalog_versions to anon, authenticated;

grant select, insert, update, delete on table public.vendor_categories to authenticated;
grant select, insert, update, delete on table public.vendor_types to authenticated;
grant select, insert, update, delete on table public.vendor_services to authenticated;
grant select, insert, update, delete on table public.vendor_service_types to authenticated;
grant select, insert, update, delete on table public.vendor_rates to authenticated;
grant select, insert, update, delete on table public.vendor_addons to authenticated;

grant select, insert, update, delete on table public.category_types to service_role;
grant select, insert, update, delete on table public.services to service_role;
grant select, insert, update, delete on table public.service_types to service_role;
grant select, insert, update, delete on table public.catalog_attributes to service_role;
grant select, insert, update, delete on table public.catalog_aliases to service_role;
grant select, insert, update, delete on table public.catalog_versions to service_role;
grant select, insert, update, delete on table public.vendor_categories to service_role;
grant select, insert, update, delete on table public.vendor_types to service_role;
grant select, insert, update, delete on table public.vendor_services to service_role;
grant select, insert, update, delete on table public.vendor_service_types to service_role;
grant select, insert, update, delete on table public.vendor_rates to service_role;
grant select, insert, update, delete on table public.vendor_addons to service_role;
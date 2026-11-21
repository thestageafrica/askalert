-- AskAlert Phase 1B: core category and area schema
-- Money stays in application code (kobo integers). Timestamps are timestamptz.

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- areas (Lagos launch tree)
-- ---------------------------------------------------------------------------
create table public.areas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  parent_id uuid references public.areas (id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint areas_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create index areas_parent_id_idx on public.areas (parent_id);

create trigger areas_set_updated_at
before update on public.areas
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  icon text not null,
  status text not null default 'draft'
    check (status in ('draft', 'pilot', 'live', 'paused')),
  current_version_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint categories_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- category_versions (immutable publish snapshots)
-- ---------------------------------------------------------------------------
create table public.category_versions (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete cascade,
  version_number integer not null,
  note text not null default '',
  status text not null
    check (status in ('draft', 'pilot', 'live', 'paused')),
  published boolean not null default false,
  published_at timestamptz,
  config jsonb not null,
  created_by text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint category_versions_unique_number unique (category_id, version_number),
  constraint category_versions_number_positive check (version_number > 0)
);

create index category_versions_category_id_idx on public.category_versions (category_id);
create index category_versions_published_idx on public.category_versions (published);

create trigger category_versions_set_updated_at
before update on public.category_versions
for each row execute function public.set_updated_at();

alter table public.categories
  add constraint categories_current_version_fk
  foreign key (current_version_id)
  references public.category_versions (id)
  on delete set null;

-- ---------------------------------------------------------------------------
-- category_attributes (denormalised from published version for RLS reads)
-- ---------------------------------------------------------------------------
create table public.category_attributes (
  id uuid primary key default gen_random_uuid(),
  category_version_id uuid not null references public.category_versions (id) on delete cascade,
  key text not null,
  label text not null,
  type text not null
    check (type in ('text', 'number', 'money', 'date', 'select', 'multi', 'area', 'boolean')),
  required boolean not null default false,
  applies_to text not null
    check (applies_to in ('need', 'offer', 'both')),
  options jsonb,
  unit text,
  validation jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint category_attributes_key_format check (key ~ '^[a-z][a-z0-9_]*$'),
  constraint category_attributes_unique_key unique (category_version_id, key)
);

create index category_attributes_version_idx on public.category_attributes (category_version_id);

create trigger category_attributes_set_updated_at
before update on public.category_attributes
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- category_areas
-- ---------------------------------------------------------------------------
create table public.category_areas (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete cascade,
  area_id uuid not null references public.areas (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint category_areas_unique unique (category_id, area_id)
);

create index category_areas_category_id_idx on public.category_areas (category_id);
create index category_areas_area_id_idx on public.category_areas (area_id);

create trigger category_areas_set_updated_at
before update on public.category_areas
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- vendor_requirements
-- ---------------------------------------------------------------------------
create table public.vendor_requirements (
  id uuid primary key default gen_random_uuid(),
  category_version_id uuid not null references public.category_versions (id) on delete cascade,
  requirement text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint vendor_requirements_text_nonempty check (char_length(trim(requirement)) > 0)
);

create index vendor_requirements_version_idx on public.vendor_requirements (category_version_id);

create trigger vendor_requirements_set_updated_at
before update on public.vendor_requirements
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- audit_log (every admin write)
-- ---------------------------------------------------------------------------
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor text not null default 'admin',
  action text not null,
  table_name text not null,
  record_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index audit_log_table_name_idx on public.audit_log (table_name);
create index audit_log_created_at_idx on public.audit_log (created_at desc);

create trigger audit_log_set_updated_at
before update on public.audit_log
for each row execute function public.set_updated_at();

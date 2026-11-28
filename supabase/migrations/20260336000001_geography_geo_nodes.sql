-- Prompt 42: geography hierarchy (geo_nodes) + migrate existing areas coverage.

create table if not exists public.geo_nodes (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.geo_nodes (id) on delete restrict,
  level text not null
    check (level in ('country', 'state', 'area', 'neighbourhood')),
  slug text not null,
  name text not null,
  aliases jsonb not null default '[]'::jsonb,
  lat double precision,
  lng double precision,
  is_statewide boolean not null default false,
  status text not null default 'active'
    check (status in ('draft', 'active', 'paused', 'archived')),
  sort_order integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint geo_nodes_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint geo_nodes_slug_unique unique (slug)
);

create index if not exists geo_nodes_parent_id_idx on public.geo_nodes (parent_id);
create index if not exists geo_nodes_level_idx on public.geo_nodes (level);
create index if not exists geo_nodes_active_idx on public.geo_nodes (status)
  where status = 'active' and archived_at is null;

create trigger geo_nodes_set_updated_at
before update on public.geo_nodes
for each row execute function public.set_updated_at();

alter table public.geo_nodes enable row level security;

create policy geo_nodes_public_read on public.geo_nodes
  for select to anon, authenticated
  using (status = 'active' and archived_at is null);

create policy geo_nodes_admin_write on public.geo_nodes
  for all to anon, authenticated
  using (true)
  with check (true);

create policy geo_nodes_service_all on public.geo_nodes
  for all to service_role
  using (true)
  with check (true);

grant select on table public.geo_nodes to anon, authenticated;
grant select, insert, update, delete on table public.geo_nodes to anon, authenticated;
grant select, insert, update, delete on table public.geo_nodes to service_role;

-- Migrate existing areas into geo_nodes without blank/duplicate rows.
with nigeria as (
  insert into public.geo_nodes (id, parent_id, level, slug, name, aliases, lat, lng, is_statewide, status, sort_order)
  values (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0001',
    null,
    'country',
    'nigeria',
    'Nigeria',
    '["NG","Naija"]'::jsonb,
    9.082,
    8.6753,
    false,
    'active',
    1
  )
  on conflict (slug) do update set name = excluded.name
  returning id
),
legacy_states as (
  insert into public.geo_nodes (id, parent_id, level, slug, name, aliases, is_statewide, status, sort_order)
  select
    a.id,
    (select id from nigeria),
    'state',
    a.slug,
    a.name,
    '[]'::jsonb,
    false,
    'active',
    a.sort_order
  from public.areas a
  where a.parent_id is null
  on conflict (slug) do update
    set name = excluded.name,
        parent_id = excluded.parent_id,
        sort_order = excluded.sort_order
  returning id, slug
),
legacy_locations as (
  insert into public.geo_nodes (id, parent_id, level, slug, name, aliases, is_statewide, status, sort_order)
  select
    child.id,
    child.parent_id,
    case when child.slug like '%-all' then 'area' else 'area' end,
    child.slug,
    child.name,
    '[]'::jsonb,
    (child.slug like '%-all'),
    'active',
    child.sort_order
  from public.areas child
  where child.parent_id is not null
  on conflict (slug) do update
    set name = excluded.name,
        parent_id = excluded.parent_id,
        is_statewide = excluded.is_statewide,
        sort_order = excluded.sort_order
  returning id
)
select 1;

-- Ensure statewide nodes exist for every state.
insert into public.geo_nodes (parent_id, level, slug, name, aliases, is_statewide, status, sort_order)
select
  s.id,
  'area',
  s.slug || '-all',
  'All of ' || s.name,
  jsonb_build_array('all ' || lower(s.name)),
  true,
  'active',
  0
from public.geo_nodes s
where s.level = 'state'
  and not exists (
    select 1 from public.geo_nodes g
    where g.parent_id = s.id and g.is_statewide = true
  );

-- Seed FCT + extra Lagos / FCT locations (skip duplicates by slug).
insert into public.geo_nodes (id, parent_id, level, slug, name, aliases, lat, lng, is_statewide, status, sort_order)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0010', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0001', 'state', 'fct', 'FCT', '["Abuja","Federal Capital Territory"]'::jsonb, 9.0765, 7.3986, false, 'active', 2)
on conflict (slug) do nothing;

insert into public.geo_nodes (parent_id, level, slug, name, aliases, lat, lng, is_statewide, status, sort_order)
select s.id, 'area', 'fct-all', 'All of FCT', '["all abuja","all fct"]'::jsonb, 9.0765, 7.3986, true, 'active', 0
from public.geo_nodes s where s.slug = 'fct'
on conflict (slug) do nothing;

insert into public.geo_nodes (parent_id, level, slug, name, aliases, lat, lng, is_statewide, status, sort_order)
select s.id, v.level, v.slug, v.name, v.aliases::jsonb, v.lat, v.lng, false, 'active', v.sort_order
from public.geo_nodes s
cross join (
  values
    ('area', 'eti-osa', 'Eti-Osa', '["Eti Osa"]', 6.4589, 3.6015, 1),
    ('area', 'maryland', 'Maryland', '[]', 6.571, 3.367, 10),
    ('area', 'magodo', 'Magodo', '[]', 6.632, 3.38, 11),
    ('area', 'gbagada', 'Gbagada', '[]', 6.551, 3.39, 12)
) as v(level, slug, name, aliases, lat, lng, sort_order)
where s.slug = 'lagos'
on conflict (slug) do nothing;

insert into public.geo_nodes (parent_id, level, slug, name, aliases, lat, lng, is_statewide, status, sort_order)
select parent.id, 'neighbourhood', 'lekki-phase-1', 'Lekki Phase 1', '["Lekki Ph1","Lekki Phase1","LP1"]'::jsonb, 6.4474, 3.4722, false, 'active', 1
from public.geo_nodes parent
where parent.slug = 'lekki'
on conflict (slug) do update
  set parent_id = excluded.parent_id,
      level = excluded.level,
      aliases = excluded.aliases,
      name = excluded.name;

insert into public.geo_nodes (parent_id, level, slug, name, aliases, lat, lng, is_statewide, status, sort_order)
select s.id, v.level, v.slug, v.name, v.aliases::jsonb, v.lat, v.lng, false, 'active', v.sort_order
from public.geo_nodes s
cross join (
  values
    ('area', 'maitama', 'Maitama', '[]', 9.085, 7.49, 1),
    ('area', 'wuse', 'Wuse', '["Wuse 2","Wuse II"]', 9.064, 7.48, 2),
    ('area', 'garki', 'Garki', '[]', 9.03, 7.48, 3),
    ('area', 'asokoro', 'Asokoro', '[]', 9.04, 7.52, 4),
    ('area', 'gwarinpa', 'Gwarinpa', '[]', 9.11, 7.4, 5)
) as v(level, slug, name, aliases, lat, lng, sort_order)
where s.slug = 'fct'
on conflict (slug) do nothing;

-- Mirror geo leaves into legacy areas (states stay root; no country FK in areas).
insert into public.areas (id, slug, name, parent_id, sort_order)
select
  g.id,
  g.slug,
  g.name,
  case
    when g.level = 'state' then null
    when p.level = 'country' then null
    when p.level = 'state' then g.parent_id
    when p.level in ('area', 'neighbourhood') then g.parent_id
    else null
  end as parent_id,
  g.sort_order
from public.geo_nodes g
left join public.geo_nodes p on p.id = g.parent_id
where g.level in ('state', 'area', 'neighbourhood')
on conflict (slug) do update
  set name = excluded.name,
      parent_id = excluded.parent_id,
      sort_order = excluded.sort_order;

-- Category location policy columns (defaults).
alter table public.categories
  add column if not exists location_rule text not null default 'specific'
    check (location_rule in ('specific', 'state', 'none'));

alter table public.categories
  add column if not exists location_role text not null default 'at_venue'
    check (location_role in ('at_buyer', 'at_venue', 'at_vendor'));

-- Row Level Security + admin write auditing
-- Public (anon): read Live categories and attributes from their current published version.
-- Writes: service_role only (admin apps use the service role key server-side).

create or replace function public.is_service_role()
returns boolean
language sql
stable
as $$
  select coalesce(auth.role(), '') = 'service_role';
$$;

create or replace function public.audit_admin_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_action text;
  v_record_id uuid;
  v_payload jsonb;
begin
  if not public.is_service_role() then
    return coalesce(new, old);
  end if;

  if tg_op = 'INSERT' then
    v_action := 'insert';
    v_record_id := new.id;
    v_payload := to_jsonb(new);
  elsif tg_op = 'UPDATE' then
    v_action := 'update';
    v_record_id := new.id;
    v_payload := jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new));
  else
    v_action := 'delete';
    v_record_id := old.id;
    v_payload := to_jsonb(old);
  end if;

  insert into public.audit_log (actor, action, table_name, record_id, payload)
  values (
    coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'email', 'admin'),
    v_action,
    tg_table_name,
    v_record_id,
    v_payload
  );

  return coalesce(new, old);
end;
$$;

-- Enable RLS
alter table public.areas enable row level security;
alter table public.categories enable row level security;
alter table public.category_versions enable row level security;
alter table public.category_attributes enable row level security;
alter table public.category_areas enable row level security;
alter table public.vendor_requirements enable row level security;
alter table public.audit_log enable row level security;

-- Areas: public can read the launch tree; only service role writes
create policy areas_public_read on public.areas
  for select
  to anon, authenticated
  using (true);

create policy areas_service_all on public.areas
  for all
  to service_role
  using (true)
  with check (true);

-- Categories: public reads Live or Pilot (both are user-facing in the app)
create policy categories_public_read_live on public.categories
  for select
  to anon, authenticated
  using (status in ('live', 'pilot'));

create policy categories_service_all on public.categories
  for all
  to service_role
  using (true)
  with check (true);

-- Versions: public reads current published version of a Live/Pilot category
create policy category_versions_public_read_live on public.category_versions
  for select
  to anon, authenticated
  using (
    published = true
    and exists (
      select 1
      from public.categories c
      where c.id = category_versions.category_id
        and c.status in ('live', 'pilot')
        and c.current_version_id = category_versions.id
    )
  );

create policy category_versions_service_all on public.category_versions
  for all
  to service_role
  using (true)
  with check (true);

-- Attributes: public reads attributes on the Live published version
create policy category_attributes_public_read_live on public.category_attributes
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.category_versions v
      join public.categories c on c.id = v.category_id
      where v.id = category_attributes.category_version_id
        and v.published = true
        and c.status in ('live', 'pilot')
        and c.current_version_id = v.id
    )
  );

create policy category_attributes_service_all on public.category_attributes
  for all
  to service_role
  using (true)
  with check (true);

-- Category areas: readable when the category is Live
create policy category_areas_public_read_live on public.category_areas
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.categories c
      where c.id = category_areas.category_id
        and c.status in ('live', 'pilot')
    )
  );

create policy category_areas_service_all on public.category_areas
  for all
  to service_role
  using (true)
  with check (true);

-- Vendor requirements: same as attributes
create policy vendor_requirements_public_read_live on public.vendor_requirements
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.category_versions v
      join public.categories c on c.id = v.category_id
      where v.id = vendor_requirements.category_version_id
        and v.published = true
        and c.status in ('live', 'pilot')
        and c.current_version_id = v.id
    )
  );

create policy vendor_requirements_service_all on public.vendor_requirements
  for all
  to service_role
  using (true)
  with check (true);

-- Audit log: service role only
create policy audit_log_service_all on public.audit_log
  for all
  to service_role
  using (true)
  with check (true);

-- Audit triggers on admin-writable tables (skip audit_log itself)
create trigger areas_audit
after insert or update or delete on public.areas
for each row execute function public.audit_admin_write();

create trigger categories_audit
after insert or update or delete on public.categories
for each row execute function public.audit_admin_write();

create trigger category_versions_audit
after insert or update or delete on public.category_versions
for each row execute function public.audit_admin_write();

create trigger category_attributes_audit
after insert or update or delete on public.category_attributes
for each row execute function public.audit_admin_write();

create trigger category_areas_audit
after insert or update or delete on public.category_areas
for each row execute function public.audit_admin_write();

create trigger vendor_requirements_audit
after insert or update or delete on public.vendor_requirements
for each row execute function public.audit_admin_write();

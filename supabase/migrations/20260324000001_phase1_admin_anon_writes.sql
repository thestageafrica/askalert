-- Phase 1: static admin publishes with the anon key (no always-on server).
-- Protect admin.askalert.com with Cloudflare Access before public launch.
-- Replace with authenticated admin / Worker + service role in a later phase.

-- Admin must list drafts too (web app still filters to live/pilot in queries).
drop policy if exists categories_public_read_live on public.categories;
create policy categories_public_read_all on public.categories
  for select
  to anon, authenticated
  using (true);

drop policy if exists categories_anon_write on public.categories;
create policy categories_anon_write on public.categories
  for all
  to anon, authenticated
  using (true)
  with check (true);

-- Versions: allow read/write so admin can publish; public UI still filters published live/pilot.
drop policy if exists category_versions_public_read_live on public.category_versions;
create policy category_versions_public_read_all on public.category_versions
  for select
  to anon, authenticated
  using (true);

drop policy if exists category_versions_anon_write on public.category_versions;
create policy category_versions_anon_write on public.category_versions
  for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists category_attributes_public_read_live on public.category_attributes;
create policy category_attributes_public_read_all on public.category_attributes
  for select
  to anon, authenticated
  using (true);

drop policy if exists category_attributes_anon_write on public.category_attributes;
create policy category_attributes_anon_write on public.category_attributes
  for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists vendor_requirements_public_read_live on public.vendor_requirements;
create policy vendor_requirements_public_read_all on public.vendor_requirements
  for select
  to anon, authenticated
  using (true);

drop policy if exists vendor_requirements_anon_write on public.vendor_requirements;
create policy vendor_requirements_anon_write on public.vendor_requirements
  for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists category_areas_public_read_live on public.category_areas;
create policy category_areas_public_read_all on public.category_areas
  for select
  to anon, authenticated
  using (true);

drop policy if exists category_areas_anon_write on public.category_areas;
create policy category_areas_anon_write on public.category_areas
  for all
  to anon, authenticated
  using (true)
  with check (true);

grant select, insert, update, delete on table public.categories to anon, authenticated;
grant select, insert, update, delete on table public.category_versions to anon, authenticated;
grant select, insert, update, delete on table public.category_attributes to anon, authenticated;
grant select, insert, update, delete on table public.vendor_requirements to anon, authenticated;
grant select, insert, update, delete on table public.category_areas to anon, authenticated;

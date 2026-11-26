-- Phase 1: allow static admin to seed states/locations with the anon key
-- (same pattern as categories). Protect admin.askalert.com with Access + app login.

drop policy if exists areas_anon_write on public.areas;
create policy areas_anon_write on public.areas
  for all
  to anon, authenticated
  using (true)
  with check (true);

grant select, insert, update, delete on table public.areas to anon, authenticated;

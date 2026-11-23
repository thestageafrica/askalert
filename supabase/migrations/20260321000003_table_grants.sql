-- Explicit Data API grants (new Supabase projects no longer auto-expose public tables).
-- Grants = can the role touch the table; RLS = which rows.

grant usage on schema public to anon, authenticated, service_role;

-- areas: public read, service_role write
grant select on table public.areas to anon, authenticated;
grant select, insert, update, delete on table public.areas to service_role;

-- categories
grant select on table public.categories to anon, authenticated;
grant select, insert, update, delete on table public.categories to service_role;

-- category_versions
grant select on table public.category_versions to anon, authenticated;
grant select, insert, update, delete on table public.category_versions to service_role;

-- category_attributes
grant select on table public.category_attributes to anon, authenticated;
grant select, insert, update, delete on table public.category_attributes to service_role;

-- category_areas
grant select on table public.category_areas to anon, authenticated;
grant select, insert, update, delete on table public.category_areas to service_role;

-- vendor_requirements
grant select on table public.vendor_requirements to anon, authenticated;
grant select, insert, update, delete on table public.vendor_requirements to service_role;

-- audit_log: service_role only (no public read)
grant select, insert, update, delete on table public.audit_log to service_role;

-- functions used by triggers / RLS helpers
grant execute on function public.set_updated_at() to anon, authenticated, service_role;
grant execute on function public.is_service_role() to anon, authenticated, service_role;
grant execute on function public.audit_admin_write() to service_role;

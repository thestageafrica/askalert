-- Public marketing/legal pages editable from admin (Phase 1 anon write pattern).
-- Protect admin.askalert.com with Access + app login before launch.

create table if not exists public.site_pages (
  slug text primary key,
  content jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint site_pages_slug_check check (
    slug in ('header', 'privacy', 'terms', 'contact')
  )
);

drop trigger if exists site_pages_set_updated_at on public.site_pages;
create trigger site_pages_set_updated_at
before update on public.site_pages
for each row execute function public.set_updated_at();

alter table public.site_pages enable row level security;

drop policy if exists site_pages_public_read on public.site_pages;
create policy site_pages_public_read on public.site_pages
  for select
  to anon, authenticated
  using (true);

drop policy if exists site_pages_anon_write on public.site_pages;
create policy site_pages_anon_write on public.site_pages
  for all
  to anon, authenticated
  using (true)
  with check (true);

grant select, insert, update, delete on table public.site_pages to anon, authenticated;
grant select, insert, update, delete on table public.site_pages to service_role;

-- Public assets for page headers and marketing images.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-assets',
  'site-assets',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists site_assets_public_read on storage.objects;
create policy site_assets_public_read on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'site-assets');

drop policy if exists site_assets_anon_write on storage.objects;
create policy site_assets_anon_write on storage.objects
  for all
  to anon, authenticated
  using (bucket_id = 'site-assets')
  with check (bucket_id = 'site-assets');

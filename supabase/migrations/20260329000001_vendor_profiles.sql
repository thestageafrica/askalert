-- Vendor profiles, rate cards, availability, documents metadata, payouts.
-- Private storage bucket for vendor documents (JPEG/PNG/WebP/PDF).

create type public.vendor_profile_status as enum (
  'draft',
  'pending_review',
  'approved',
  'rejected',
  'suspended'
);

create type public.vendor_verification_tier as enum (
  'phone',
  'id',
  'business',
  'trusted'
);

create type public.vendor_entity_type as enum ('individual', 'business');

create type public.vendor_document_kind as enum (
  'id',
  'business_proof',
  'licence',
  'portfolio'
);

create table public.vendor_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entity_type public.vendor_entity_type not null default 'individual',
  display_name text not null,
  business_name text,
  status public.vendor_profile_status not null default 'draft',
  verification_tiers public.vendor_verification_tier[] not null default array['phone']::public.vendor_verification_tier[],
  category_slugs text[] not null default '{}',
  area_slugs text[] not null default '{}',
  weekly_hours jsonb not null default '[]'::jsonb,
  blackout_dates date[] not null default '{}',
  current_step text not null default 'who',
  submitted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id)
);

create table public.vendor_rate_cards (
  id uuid primary key default gen_random_uuid(),
  vendor_profile_id uuid not null references public.vendor_profiles (id) on delete cascade,
  category_slug text not null,
  starting_price_minor integer not null check (starting_price_minor >= 0),
  min_price_minor integer not null check (min_price_minor >= 0),
  max_price_minor integer not null check (max_price_minor >= 0),
  unit text not null,
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (vendor_profile_id, category_slug)
);

create table public.vendor_documents (
  id uuid primary key default gen_random_uuid(),
  vendor_profile_id uuid not null references public.vendor_profiles (id) on delete cascade,
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  kind public.vendor_document_kind not null,
  file_name text not null,
  mime text not null,
  bytes integer not null check (bytes > 0 and bytes <= 5242880),
  storage_path text not null,
  scanned boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.vendor_payout_details (
  vendor_profile_id uuid primary key references public.vendor_profiles (id) on delete cascade,
  bank_name text not null,
  account_name text not null,
  -- Store last 4 only in this column for display; full number never persisted here.
  account_number_last4 text not null check (char_length(account_number_last4) = 4),
  updated_at timestamptz not null default timezone('utc', now())
);

create index vendor_profiles_status_idx on public.vendor_profiles (status);
create index vendor_documents_owner_idx on public.vendor_documents (owner_user_id);

alter table public.vendor_profiles enable row level security;
alter table public.vendor_rate_cards enable row level security;
alter table public.vendor_documents enable row level security;
alter table public.vendor_payout_details enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role in (
        'admin_super',
        'admin_operations',
        'admin_support',
        'admin_readonly'
      )
      and ur.status = 'active'
  );
$$;

create policy vendor_profiles_owner_all on public.vendor_profiles
  for all to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy vendor_rate_cards_owner_all on public.vendor_rate_cards
  for all to authenticated
  using (
    exists (
      select 1 from public.vendor_profiles vp
      where vp.id = vendor_profile_id
        and (vp.user_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.vendor_profiles vp
      where vp.id = vendor_profile_id
        and (vp.user_id = auth.uid() or public.is_admin())
    )
  );

create policy vendor_documents_owner_select on public.vendor_documents
  for select to authenticated
  using (owner_user_id = auth.uid() or public.is_admin());

create policy vendor_documents_owner_insert on public.vendor_documents
  for insert to authenticated
  with check (owner_user_id = auth.uid());

create policy vendor_documents_owner_delete on public.vendor_documents
  for delete to authenticated
  using (owner_user_id = auth.uid() or public.is_admin());

create policy vendor_payout_owner_all on public.vendor_payout_details
  for all to authenticated
  using (
    exists (
      select 1 from public.vendor_profiles vp
      where vp.id = vendor_profile_id
        and (vp.user_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.vendor_profiles vp
      where vp.id = vendor_profile_id
        and (vp.user_id = auth.uid() or public.is_admin())
    )
  );

grant select, insert, update, delete on public.vendor_profiles to authenticated;
grant select, insert, update, delete on public.vendor_rate_cards to authenticated;
grant select, insert, delete on public.vendor_documents to authenticated;
grant select, insert, update, delete on public.vendor_payout_details to authenticated;

-- Private bucket: vendors upload under vendor/{user_id}/…
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vendor-documents',
  'vendor-documents',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy vendor_documents_storage_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'vendor-documents'
    and (
      public.is_admin()
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

create policy vendor_documents_storage_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'vendor-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy vendor_documents_storage_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'vendor-documents'
    and (
      public.is_admin()
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

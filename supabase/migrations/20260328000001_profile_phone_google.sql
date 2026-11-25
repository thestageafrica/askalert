-- Improve new-user profile seeding for email metadata + Google OAuth names.
-- Phone lives on public.profiles.phone_e164 (not auth.users.phone).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_name text;
  meta_phone text;
begin
  meta_name := nullif(trim(coalesce(
    new.raw_user_meta_data ->> 'display_name',
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    ''
  )), '');

  meta_phone := nullif(trim(coalesce(new.raw_user_meta_data ->> 'phone_e164', '')), '');

  insert into public.profiles (id, display_name, phone_e164)
  values (
    new.id,
    coalesce(meta_name, split_part(new.email, '@', 1), ''),
    meta_phone
  )
  on conflict (id) do update
  set
    display_name = case
      when public.profiles.display_name is null or public.profiles.display_name = ''
        then excluded.display_name
      else public.profiles.display_name
    end,
    phone_e164 = coalesce(public.profiles.phone_e164, excluded.phone_e164),
    updated_at = timezone('utc', now());

  insert into public.user_roles (user_id, role, status, verified_tier)
  values (new.id, 'buyer', 'active', 'none')
  on conflict (user_id, role) do nothing;

  insert into public.user_settings (user_id, last_mode)
  values (new.id, 'buyer')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- One active AskAlert account per WhatsApp / phone number.

create unique index if not exists profiles_phone_e164_unique
  on public.profiles (phone_e164)
  where phone_e164 is not null and deleted_at is null;

-- Safe for anon + authenticated: returns only a boolean, never which account.
create or replace function public.is_phone_taken(
  p_phone text,
  p_except_user_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where phone_e164 = nullif(trim(p_phone), '')
      and deleted_at is null
      and (p_except_user_id is null or id <> p_except_user_id)
  );
$$;

revoke all on function public.is_phone_taken(text, uuid) from public;
grant execute on function public.is_phone_taken(text, uuid) to anon, authenticated;

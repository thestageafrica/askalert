-- Prompt 27: admin invitations, audited ops RPCs, audit visibility for admins.

create table if not exists public.admin_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role text not null
    check (role in (
      'admin_super',
      'admin_operations',
      'admin_support',
      'admin_readonly'
    )),
  invited_by uuid references auth.users (id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'revoked')),
  note text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  accepted_at timestamptz
);

create unique index if not exists admin_invitations_pending_email_idx
  on public.admin_invitations (lower(email))
  where status = 'pending';

alter table public.admin_invitations enable row level security;

create policy admin_invitations_admin_all on public.admin_invitations
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update on public.admin_invitations to authenticated;

-- Allow admins to read audit_log (writes stay trigger/RPC).
drop policy if exists audit_log_admin_select on public.audit_log;
create policy audit_log_admin_select on public.audit_log
  for select to authenticated
  using (public.is_admin());

grant select on public.audit_log to authenticated;

create or replace function public.admin_write_audit(
  p_action text,
  p_table_name text,
  p_record_id text,
  p_payload jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorised';
  end if;
  insert into public.audit_log (actor, action, table_name, record_id, payload)
  values (
    coalesce(auth.jwt() ->> 'email', auth.uid()::text),
    p_action,
    p_table_name,
    p_record_id,
    coalesce(p_payload, '{}'::jsonb)
  );
end;
$$;

revoke all on function public.admin_write_audit(text, text, text, jsonb) from public;
grant execute on function public.admin_write_audit(text, text, text, jsonb) to authenticated;

create or replace function public.admin_list_my_roles()
returns table (role text, status text, verified_tier text)
language sql
security definer
set search_path = public
as $$
  select ur.role, ur.status, ur.verified_tier
  from public.user_roles ur
  where ur.user_id = auth.uid()
    and ur.role like 'admin_%';
$$;

revoke all on function public.admin_list_my_roles() from public;
grant execute on function public.admin_list_my_roles() to authenticated;

create or replace function public.admin_invite_staff(
  p_email text,
  p_role text,
  p_note text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_caller_is_super boolean;
begin
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin_super'
      and ur.status = 'active'
  ) into v_caller_is_super;

  if not v_caller_is_super then
    raise exception 'Only super admins can invite staff';
  end if;

  if p_role not in ('admin_super', 'admin_operations', 'admin_support', 'admin_readonly') then
    raise exception 'Invalid admin role';
  end if;

  insert into public.admin_invitations (email, role, invited_by, note)
  values (lower(trim(p_email)), p_role, auth.uid(), coalesce(p_note, ''))
  returning id into v_id;

  perform public.admin_write_audit(
    'admin.invite',
    'admin_invitations',
    v_id::text,
    jsonb_build_object('email', lower(trim(p_email)), 'role', p_role)
  );

  return v_id;
end;
$$;

revoke all on function public.admin_invite_staff(text, text, text) from public;
grant execute on function public.admin_invite_staff(text, text, text) to authenticated;

create or replace function public.admin_accept_invitation()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.admin_invitations%rowtype;
  v_email text;
begin
  v_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  if v_email = '' then
    return false;
  end if;

  select * into v_invite
  from public.admin_invitations
  where lower(email) = v_email
    and status = 'pending'
  order by created_at desc
  limit 1;

  if not found then
    return false;
  end if;

  insert into public.user_roles (user_id, role, status)
  values (auth.uid(), v_invite.role, 'active')
  on conflict (user_id, role) do update
    set status = 'active', updated_at = timezone('utc', now());

  update public.admin_invitations
  set status = 'accepted', accepted_at = timezone('utc', now())
  where id = v_invite.id;

  perform public.admin_write_audit(
    'admin.accept_invite',
    'user_roles',
    auth.uid()::text,
    jsonb_build_object('role', v_invite.role)
  );

  return true;
end;
$$;

revoke all on function public.admin_accept_invitation() from public;
grant execute on function public.admin_accept_invitation() to authenticated;

create or replace function public.admin_list_pending_vendors()
returns setof public.vendor_profiles
language sql
security definer
set search_path = public
as $$
  select *
  from public.vendor_profiles
  where public.is_admin()
    and status in ('pending_review', 'rejected', 'approved', 'suspended')
  order by submitted_at desc nulls last, updated_at desc;
$$;

revoke all on function public.admin_list_pending_vendors() from public;
grant execute on function public.admin_list_pending_vendors() to authenticated;

create or replace function public.admin_review_vendor(
  p_vendor_id uuid,
  p_action text,
  p_reason text default '',
  p_message text default '',
  p_tier text default null
)
returns public.vendor_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.vendor_profiles;
  v_next public.vendor_profile_status;
  v_tiers public.vendor_verification_tier[];
begin
  if not public.is_admin() then
    raise exception 'Not authorised';
  end if;

  select * into v_row from public.vendor_profiles where id = p_vendor_id for update;
  if not found then
    raise exception 'Vendor not found';
  end if;

  if p_action = 'approve' then
    if coalesce(trim(p_reason), '') = '' then
      -- approve may omit reason
      null;
    end if;
    v_next := 'approved';
  elsif p_action = 'reject' then
    if coalesce(trim(p_reason), '') = '' then
      raise exception 'Reject requires a reason';
    end if;
    v_next := 'rejected';
  elsif p_action = 'request_info' then
    if coalesce(trim(p_message), '') = '' then
      raise exception 'Request info requires a message';
    end if;
    v_next := 'draft';
  elsif p_action = 'suspend' then
    v_next := 'suspended';
  else
    raise exception 'Unknown action';
  end if;

  v_tiers := v_row.verification_tiers;
  if p_tier is not null then
    if p_tier not in ('phone', 'id', 'business', 'trusted') then
      raise exception 'Invalid verification tier';
    end if;
    v_tiers := array(
      select distinct t
      from unnest(
        case p_tier
          when 'phone' then array['phone']::public.vendor_verification_tier[]
          when 'id' then array['phone', 'id']::public.vendor_verification_tier[]
          when 'business' then array['phone', 'id', 'business']::public.vendor_verification_tier[]
          when 'trusted' then array['phone', 'id', 'business', 'trusted']::public.vendor_verification_tier[]
        end
      ) as t
    );
  end if;

  update public.vendor_profiles
  set
    status = v_next,
    verification_tiers = v_tiers,
    updated_at = timezone('utc', now())
  where id = p_vendor_id
  returning * into v_row;

  -- Keep user_roles.vendor in sync for approved / pending paths.
  if v_next = 'approved' then
    insert into public.user_roles (user_id, role, status)
    values (v_row.user_id, 'vendor', 'active')
    on conflict (user_id, role) do update set status = 'active';
  elsif v_next = 'rejected' or v_next = 'suspended' then
    update public.user_roles
    set status = 'suspended'
    where user_id = v_row.user_id and role = 'vendor';
  elsif v_next = 'draft' then
    insert into public.user_roles (user_id, role, status)
    values (v_row.user_id, 'vendor', 'pending')
    on conflict (user_id, role) do update set status = 'pending';
  end if;

  perform public.admin_write_audit(
    'vendor.' || p_action,
    'vendor_profiles',
    p_vendor_id::text,
    jsonb_build_object(
      'reason', p_reason,
      'message', p_message,
      'tier', p_tier,
      'status', v_next
    )
  );

  return v_row;
end;
$$;

revoke all on function public.admin_review_vendor(uuid, text, text, text, text) from public;
grant execute on function public.admin_review_vendor(uuid, text, text, text, text) to authenticated;

create or replace function public.admin_list_users(p_query text default '')
returns table (
  user_id uuid,
  email text,
  display_name text,
  phone_e164 text,
  roles text[],
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    p.id,
    coalesce(au.email, ''),
    coalesce(p.display_name, ''),
    coalesce(p.phone_e164, ''),
    coalesce(
      (
        select array_agg(ur.role order by ur.role)
        from public.user_roles ur
        where ur.user_id = p.id
      ),
      '{}'::text[]
    ),
    p.created_at
  from public.profiles p
  left join auth.users au on au.id = p.id
  where public.is_admin()
    and (
      coalesce(p_query, '') = ''
      or p.display_name ilike '%' || p_query || '%'
      or coalesce(p.phone_e164, '') ilike '%' || p_query || '%'
      or coalesce(au.email, '') ilike '%' || p_query || '%'
    )
  order by p.created_at desc
  limit 100;
$$;

revoke all on function public.admin_list_users(text) from public;
grant execute on function public.admin_list_users(text) to authenticated;

create or replace function public.admin_set_user_role_status(
  p_user_id uuid,
  p_role text,
  p_status text,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorised';
  end if;
  if coalesce(trim(p_reason), '') = '' then
    raise exception 'Reason is required';
  end if;
  if p_status not in ('active', 'pending', 'suspended') then
    raise exception 'Invalid status';
  end if;

  update public.user_roles
  set status = p_status, updated_at = timezone('utc', now())
  where user_id = p_user_id and role = p_role;

  if not found then
    insert into public.user_roles (user_id, role, status)
    values (p_user_id, p_role, p_status);
  end if;

  perform public.admin_write_audit(
    'user.role_status',
    'user_roles',
    p_user_id::text,
    jsonb_build_object('role', p_role, 'status', p_status, 'reason', p_reason)
  );
end;
$$;

revoke all on function public.admin_set_user_role_status(uuid, text, text, text) from public;
grant execute on function public.admin_set_user_role_status(uuid, text, text, text) to authenticated;

create or replace function public.admin_list_audit(
  p_action text default null,
  p_table_name text default null,
  p_limit integer default 100
)
returns setof public.audit_log
language sql
security definer
set search_path = public
as $$
  select *
  from public.audit_log
  where public.is_admin()
    and (p_action is null or action ilike '%' || p_action || '%')
    and (p_table_name is null or table_name = p_table_name)
  order by created_at desc
  limit greatest(1, least(coalesce(p_limit, 100), 500));
$$;

revoke all on function public.admin_list_audit(text, text, integer) from public;
grant execute on function public.admin_list_audit(text, text, integer) to authenticated;

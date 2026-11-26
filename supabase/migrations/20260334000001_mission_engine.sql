-- Prompt 28: request + mission engine v1 (in-app).

create type public.mission_status as enum (
  'DRAFT',
  'CLARIFYING',
  'SEARCHING',
  'OUTREACH',
  'COLLECTING',
  'RANKING',
  'AWAITING_USER',
  'BOOKED',
  'EXPIRED',
  'CANCELLED'
);

create type public.mission_candidate_status as enum (
  'selected',
  'contacted',
  'nudged',
  'responded',
  'ignored',
  'declined'
);

create type public.offer_status as enum (
  'pending',
  'accepted',
  'declined',
  'expired'
);

create type public.booking_status as enum (
  'awaiting_payment',
  'paid',
  'cancelled',
  'completed'
);

create type public.request_status as enum (
  'draft',
  'active',
  'closed',
  'cancelled'
);

-- ---------------------------------------------------------------------------
-- requests
-- ---------------------------------------------------------------------------
create table public.requests (
  id uuid primary key default gen_random_uuid(),
  buyer_user_id uuid not null references public.profiles (id) on delete cascade,
  category_slug text not null,
  area_slug text not null,
  need_payload jsonb not null default '{}'::jsonb,
  budget_min_minor integer check (budget_min_minor is null or budget_min_minor >= 0),
  budget_max_minor integer check (budget_max_minor is null or budget_max_minor >= 0),
  currency text not null default 'NGN' check (currency = 'NGN'),
  status public.request_status not null default 'draft',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint requests_budget_order check (
    budget_min_minor is null
    or budget_max_minor is null
    or budget_max_minor >= budget_min_minor
  )
);

create index requests_buyer_user_id_idx on public.requests (buyer_user_id);
create index requests_category_slug_idx on public.requests (category_slug);
create index requests_status_idx on public.requests (status);

create trigger requests_set_updated_at
before update on public.requests
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- missions
-- ---------------------------------------------------------------------------
create table public.missions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.requests (id) on delete cascade,
  status public.mission_status not null default 'DRAFT',
  state_entered_at timestamptz not null default timezone('utc', now()),
  response_deadline_at timestamptz,
  collect_deadline_at timestamptz,
  expires_at timestamptz,
  top_n integer not null default 4 check (top_n > 0),
  matched_count integer not null default 0 check (matched_count >= 0),
  last_idempotency_key text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index missions_status_idx on public.missions (status);
create index missions_expires_at_idx on public.missions (expires_at) where expires_at is not null;

create trigger missions_set_updated_at
before update on public.missions
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- mission_candidates
-- ---------------------------------------------------------------------------
create table public.mission_candidates (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions (id) on delete cascade,
  vendor_profile_id uuid not null references public.vendor_profiles (id) on delete cascade,
  vendor_user_id uuid not null references public.profiles (id) on delete cascade,
  status public.mission_candidate_status not null default 'selected',
  match_score numeric(6, 4),
  contacted_at timestamptz,
  nudged_at timestamptz,
  responded_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (mission_id, vendor_profile_id)
);

create index mission_candidates_mission_id_idx on public.mission_candidates (mission_id);
create index mission_candidates_vendor_user_id_idx on public.mission_candidates (vendor_user_id);

create trigger mission_candidates_set_updated_at
before update on public.mission_candidates
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- offers
-- ---------------------------------------------------------------------------
create table public.offers (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions (id) on delete cascade,
  vendor_profile_id uuid not null references public.vendor_profiles (id) on delete cascade,
  vendor_user_id uuid not null references public.profiles (id) on delete cascade,
  amount_minor integer not null check (amount_minor >= 0),
  currency text not null default 'NGN' check (currency = 'NGN'),
  message text not null default '',
  status public.offer_status not null default 'pending',
  rank_score numeric(6, 4),
  rank_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index offers_mission_id_idx on public.offers (mission_id);
create index offers_vendor_user_id_idx on public.offers (vendor_user_id);

create trigger offers_set_updated_at
before update on public.offers
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- bookings
-- ---------------------------------------------------------------------------
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions (id) on delete restrict,
  offer_id uuid not null references public.offers (id) on delete restrict,
  buyer_user_id uuid not null references public.profiles (id) on delete restrict,
  vendor_profile_id uuid not null references public.vendor_profiles (id) on delete restrict,
  vendor_user_id uuid not null references public.profiles (id) on delete restrict,
  status public.booking_status not null default 'awaiting_payment',
  total_minor integer not null check (total_minor >= 0),
  currency text not null default 'NGN' check (currency = 'NGN'),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (offer_id)
);

create index bookings_buyer_user_id_idx on public.bookings (buyer_user_id);
create index bookings_vendor_user_id_idx on public.bookings (vendor_user_id);

create trigger bookings_set_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- unmet_demand
-- ---------------------------------------------------------------------------
create table public.unmet_demand (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests (id) on delete cascade,
  mission_id uuid references public.missions (id) on delete set null,
  category_slug text not null,
  area_slug text not null,
  matched_count integer not null check (matched_count >= 0),
  required_count integer not null check (required_count > 0),
  need_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index unmet_demand_category_slug_idx on public.unmet_demand (category_slug);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.requests enable row level security;
alter table public.missions enable row level security;
alter table public.mission_candidates enable row level security;
alter table public.offers enable row level security;
alter table public.bookings enable row level security;
alter table public.unmet_demand enable row level security;

create policy requests_owner_select on public.requests
  for select to authenticated
  using (buyer_user_id = auth.uid() or public.is_admin());

create policy requests_owner_insert on public.requests
  for insert to authenticated
  with check (buyer_user_id = auth.uid());

create policy requests_owner_update on public.requests
  for update to authenticated
  using (buyer_user_id = auth.uid())
  with check (buyer_user_id = auth.uid());

create policy requests_service_all on public.requests
  for all to service_role
  using (true)
  with check (true);

create policy missions_buyer_select on public.missions
  for select to authenticated
  using (
    exists (
      select 1 from public.requests r
      where r.id = missions.request_id
        and (r.buyer_user_id = auth.uid() or public.is_admin())
    )
  );

create policy missions_service_all on public.missions
  for all to service_role
  using (true)
  with check (true);

create policy mission_candidates_vendor_select on public.mission_candidates
  for select to authenticated
  using (
    vendor_user_id = auth.uid()
    or exists (
      select 1
      from public.missions m
      join public.requests r on r.id = m.request_id
      where m.id = mission_candidates.mission_id
        and (r.buyer_user_id = auth.uid() or public.is_admin())
    )
  );

create policy mission_candidates_service_all on public.mission_candidates
  for all to service_role
  using (true)
  with check (true);

create policy offers_vendor_select on public.offers
  for select to authenticated
  using (
    vendor_user_id = auth.uid()
    or exists (
      select 1
      from public.missions m
      join public.requests r on r.id = m.request_id
      where m.id = offers.mission_id
        and (r.buyer_user_id = auth.uid() or public.is_admin())
    )
  );

create policy offers_vendor_insert on public.offers
  for insert to authenticated
  with check (vendor_user_id = auth.uid());

create policy offers_vendor_update on public.offers
  for update to authenticated
  using (vendor_user_id = auth.uid())
  with check (vendor_user_id = auth.uid());

create policy offers_service_all on public.offers
  for all to service_role
  using (true)
  with check (true);

create policy bookings_party_select on public.bookings
  for select to authenticated
  using (
    buyer_user_id = auth.uid()
    or vendor_user_id = auth.uid()
    or public.is_admin()
  );

create policy bookings_service_all on public.bookings
  for all to service_role
  using (true)
  with check (true);

create policy unmet_demand_buyer_select on public.unmet_demand
  for select to authenticated
  using (
    exists (
      select 1 from public.requests r
      where r.id = unmet_demand.request_id
        and (r.buyer_user_id = auth.uid() or public.is_admin())
    )
  );

create policy unmet_demand_service_all on public.unmet_demand
  for all to service_role
  using (true)
  with check (true);

grant select, insert, update on public.requests to authenticated;
grant select on public.missions to authenticated;
grant select on public.mission_candidates to authenticated;
grant select, insert, update on public.offers to authenticated;
grant select on public.bookings to authenticated;
grant select on public.unmet_demand to authenticated;

grant select, insert, update, delete on public.requests to service_role;
grant select, insert, update, delete on public.missions to service_role;
grant select, insert, update, delete on public.mission_candidates to service_role;
grant select, insert, update, delete on public.offers to service_role;
grant select, insert, update, delete on public.bookings to service_role;
grant select, insert, update, delete on public.unmet_demand to service_role;

-- ---------------------------------------------------------------------------
-- transition_mission (idempotent)
-- ---------------------------------------------------------------------------
create or replace function public.transition_mission(
  p_mission_id uuid,
  p_target_status public.mission_status,
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.missions%rowtype;
  v_allowed boolean := false;
begin
  select * into v_row from public.missions where id = p_mission_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'mission_not_found');
  end if;

  if p_idempotency_key is not null and v_row.last_idempotency_key = p_idempotency_key then
    return jsonb_build_object(
      'ok', true,
      'idempotent', true,
      'status', v_row.status,
      'reason', 'already_applied'
    );
  end if;

  if v_row.status = p_target_status then
    return jsonb_build_object(
      'ok', true,
      'idempotent', true,
      'status', v_row.status,
      'reason', 'same_status'
    );
  end if;

  if v_row.status in ('BOOKED', 'EXPIRED', 'CANCELLED') then
    return jsonb_build_object('ok', false, 'status', v_row.status, 'reason', 'terminal_status');
  end if;

  v_allowed := (
    (v_row.status = 'DRAFT' and p_target_status in ('CLARIFYING', 'CANCELLED'))
    or (v_row.status = 'CLARIFYING' and p_target_status in ('SEARCHING', 'CANCELLED', 'EXPIRED'))
    or (v_row.status = 'SEARCHING' and p_target_status in ('OUTREACH', 'AWAITING_USER', 'CANCELLED', 'EXPIRED'))
    or (v_row.status = 'OUTREACH' and p_target_status in ('COLLECTING', 'CANCELLED', 'EXPIRED'))
    or (v_row.status = 'COLLECTING' and p_target_status in ('RANKING', 'AWAITING_USER', 'CANCELLED', 'EXPIRED'))
    or (v_row.status = 'RANKING' and p_target_status in ('AWAITING_USER', 'CANCELLED', 'EXPIRED'))
    or (v_row.status = 'AWAITING_USER' and p_target_status in ('BOOKED', 'CANCELLED', 'EXPIRED'))
    or (p_target_status = 'EXPIRED' and v_row.status not in ('BOOKED', 'EXPIRED', 'CANCELLED'))
    or (p_target_status = 'CANCELLED' and v_row.status not in ('BOOKED', 'EXPIRED', 'CANCELLED'))
  );

  if not v_allowed then
    return jsonb_build_object(
      'ok', false,
      'status', v_row.status,
      'reason', 'invalid_transition'
    );
  end if;

  update public.missions
  set status = p_target_status,
      state_entered_at = timezone('utc', now()),
      last_idempotency_key = coalesce(p_idempotency_key, last_idempotency_key),
      updated_at = timezone('utc', now())
  where id = p_mission_id;

  return jsonb_build_object(
    'ok', true,
    'idempotent', false,
    'status', p_target_status,
    'reason', 'transitioned'
  );
end;
$$;

revoke all on function public.transition_mission(uuid, public.mission_status, text) from public;
grant execute on function public.transition_mission(uuid, public.mission_status, text) to service_role;

-- ---------------------------------------------------------------------------
-- expire_missions
-- ---------------------------------------------------------------------------
create or replace function public.expire_missions(p_batch_size integer default 50)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
  v_id uuid;
begin
  for v_id in
    select id
    from public.missions
    where status not in ('BOOKED', 'EXPIRED', 'CANCELLED')
      and expires_at is not null
      and expires_at < timezone('utc', now())
    order by expires_at
    limit greatest(p_batch_size, 1)
  loop
    perform public.transition_mission(v_id, 'EXPIRED'::public.mission_status, 'expire:' || v_id::text);
    v_count := v_count + 1;
  end loop;

  return jsonb_build_object('expired', v_count);
end;
$$;

revoke all on function public.expire_missions(integer) from public;
grant execute on function public.expire_missions(integer) to service_role;

-- ---------------------------------------------------------------------------
-- process_mission_job
-- ---------------------------------------------------------------------------
create or replace function public.process_mission_job(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_type text := coalesce(p_payload ->> 'type', '');
  v_mission_id uuid;
  v_mission public.missions%rowtype;
  v_request public.requests%rowtype;
  v_idem text;
  v_nudged integer := 0;
  v_ignored integer := 0;
  r record;
begin
  v_mission_id := nullif(p_payload ->> 'missionId', '')::uuid;
  if v_mission_id is null then
    return jsonb_build_object('ok', false, 'reason', 'missing_mission_id');
  end if;

  select * into v_mission from public.missions where id = v_mission_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'mission_not_found');
  end if;

  select * into v_request from public.requests where id = v_mission.request_id;

  v_idem := coalesce(p_payload ->> 'idempotencyKey', v_type || ':' || v_mission_id::text);

  if v_type = 'mission_expire' then
    return public.transition_mission(
      v_mission_id,
      'EXPIRED'::public.mission_status,
      v_idem
    );
  end if;

  if v_mission.expires_at is not null and v_mission.expires_at < timezone('utc', now())
     and v_mission.status not in ('BOOKED', 'EXPIRED', 'CANCELLED') then
    return public.transition_mission(v_mission_id, 'EXPIRED'::public.mission_status, 'expire:' || v_mission_id::text);
  end if;

  if v_type = 'mission_nudge' then
    for r in
      select *
      from public.mission_candidates
      where mission_id = v_mission_id
        and status = 'contacted'
        and nudged_at is null
        and contacted_at is not null
        and contacted_at < timezone('utc', now()) - interval '60 minutes'
    loop
      update public.mission_candidates
      set status = 'nudged',
          nudged_at = timezone('utc', now()),
          updated_at = timezone('utc', now())
      where id = r.id;
      v_nudged := v_nudged + 1;
    end loop;
    return jsonb_build_object('ok', true, 'nudged', v_nudged);
  end if;

  if v_type = 'mission_tick' then
    if v_mission.status = 'DRAFT' then
      return public.transition_mission(v_mission_id, 'CLARIFYING'::public.mission_status, v_idem);
    elsif v_mission.status = 'CLARIFYING' then
      return public.transition_mission(v_mission_id, 'SEARCHING'::public.mission_status, v_idem);
    elsif v_mission.status = 'OUTREACH' then
      if exists (
        select 1 from public.mission_candidates
        where mission_id = v_mission_id
          and status in ('contacted', 'nudged', 'responded', 'ignored', 'declined')
      ) then
        return public.transition_mission(v_mission_id, 'COLLECTING'::public.mission_status, v_idem);
      end if;
    elsif v_mission.status = 'COLLECTING' then
      if exists (select 1 from public.offers where mission_id = v_mission_id and status = 'pending') then
        return public.transition_mission(v_mission_id, 'RANKING'::public.mission_status, v_idem);
      end if;
      if v_mission.collect_deadline_at is not null
         and v_mission.collect_deadline_at < timezone('utc', now()) then
        for r in
          select id from public.mission_candidates
          where mission_id = v_mission_id
            and status in ('contacted', 'nudged')
        loop
          update public.mission_candidates
          set status = 'ignored', updated_at = timezone('utc', now())
          where id = r.id;
          v_ignored := v_ignored + 1;
        end loop;
        return public.transition_mission(
          v_mission_id,
          'AWAITING_USER'::public.mission_status,
          v_idem || ':collect_deadline'
        );
      end if;
    elsif v_mission.status = 'RANKING' then
      return public.transition_mission(v_mission_id, 'AWAITING_USER'::public.mission_status, v_idem);
    end if;

    return jsonb_build_object('ok', true, 'status', v_mission.status, 'noop', true);
  end if;

  return jsonb_build_object('ok', false, 'reason', 'unknown_mission_job_type');
end;
$$;

revoke all on function public.process_mission_job(jsonb) from public;
grant execute on function public.process_mission_job(jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- process_askalert_job_batch (mission job types)
-- ---------------------------------------------------------------------------
create or replace function public.process_askalert_job_batch(
  p_batch_size integer default 10,
  p_max_attempts integer default 5
)
returns jsonb
language plpgsql
security definer
set search_path = public, pgmq
as $$
declare
  processed integer := 0;
  dead_lettered integer := 0;
  r record;
  attempts integer;
  job_type text;
  job_result jsonb;
begin
  begin
    for r in
      select * from pgmq.read('askalert_jobs', 30, p_batch_size)
    loop
      attempts := coalesce((r.message ->> 'attempts')::integer, 0) + 1;
      job_type := coalesce(r.message ->> 'type', '');
      begin
        if job_type = 'webhook_event' then
          perform pgmq.delete('askalert_jobs', r.msg_id);
          processed := processed + 1;
        elsif job_type in ('mission_tick', 'mission_nudge', 'mission_expire') then
          job_result := public.process_mission_job(r.message);
          if coalesce(job_result ->> 'ok', 'true') = 'true' then
            perform pgmq.delete('askalert_jobs', r.msg_id);
            processed := processed + 1;
          else
            raise exception 'mission_job_failed';
          end if;
        else
          raise exception 'unknown_job_type';
        end if;
      exception
        when others then
          if attempts >= p_max_attempts then
            insert into public.job_dead_letters (queue_name, job_id, payload, error_code, attempts)
            values ('askalert_jobs', r.msg_id, r.message, left(sqlerrm, 120), attempts);
            perform pgmq.delete('askalert_jobs', r.msg_id);
            dead_lettered := dead_lettered + 1;
          end if;
      end;
    end loop;
  exception
    when undefined_function then
      return jsonb_build_object(
        'processed', 0,
        'dead_lettered', 0,
        'warning', 'pgmq_unavailable'
      );
  end;

  return jsonb_build_object(
    'processed', processed,
    'dead_lettered', dead_lettered
  );
end;
$$;

revoke all on function public.process_askalert_job_batch(integer, integer) from public;
grant execute on function public.process_askalert_job_batch(integer, integer) to service_role;
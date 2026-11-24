-- Batch processor for askalert_jobs (idempotent skeleton).

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
begin
  begin
    for r in
      select * from pgmq.read('askalert_jobs', 30, p_batch_size)
    loop
      attempts := coalesce((r.message ->> 'attempts')::integer, 0) + 1;
      begin
        -- Skeleton: accept webhook_event jobs without domain side effects.
        if coalesce(r.message ->> 'type', '') = 'webhook_event' then
          perform pgmq.delete('askalert_jobs', r.msg_id);
          processed := processed + 1;
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

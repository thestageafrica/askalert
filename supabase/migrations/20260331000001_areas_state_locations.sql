-- Flatten geography to State → Location and add Lagos statewide + metro places.

-- Point legacy Eti-Osa leaves at Lagos (state root).
update public.areas
set parent_id = '11111111-1111-4111-8111-111111111101'
where slug in (
  'lekki-phase-1',
  'lekki',
  'victoria-island',
  'ikoyi',
  'ajah',
  'oniru'
);

-- Remove the Eti-Osa middle node; leaves now hang directly under Lagos.
delete from public.areas
where slug = 'eti-osa';

insert into public.areas (id, slug, name, parent_id, sort_order)
values
  (
    '11111111-1111-4111-8111-111111111109',
    'lagos-all',
    'All of Lagos',
    '11111111-1111-4111-8111-111111111101',
    0
  ),
  (
    '11111111-1111-4111-8111-111111111110',
    'ikorodu',
    'Ikorodu',
    '11111111-1111-4111-8111-111111111101',
    7
  ),
  (
    '11111111-1111-4111-8111-111111111111',
    'ikeja',
    'Ikeja',
    '11111111-1111-4111-8111-111111111101',
    8
  ),
  (
    '11111111-1111-4111-8111-111111111112',
    'surulere',
    'Surulere',
    '11111111-1111-4111-8111-111111111101',
    9
  ),
  (
    '11111111-1111-4111-8111-111111111113',
    'yaba',
    'Yaba',
    '11111111-1111-4111-8111-111111111101',
    10
  )
on conflict (id) do update
set
  slug = excluded.slug,
  name = excluded.name,
  parent_id = excluded.parent_id,
  sort_order = excluded.sort_order;

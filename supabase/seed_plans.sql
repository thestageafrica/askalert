-- Seed plan catalogue (configuration). Safe to re-run.

insert into public.plans (id, slug, audience, name, disabled) values
  ('plan_buyer_free', 'buyer_free', 'buyer', 'Free', false),
  ('plan_buyer_starter', 'buyer_starter', 'buyer', 'Starter', false),
  ('plan_vendor_free', 'vendor_free', 'vendor', 'Vendor Free', false),
  ('plan_vendor_pro', 'vendor_pro', 'vendor', 'Vendor Pro', true)
on conflict (id) do update set
  slug = excluded.slug,
  audience = excluded.audience,
  name = excluded.name,
  disabled = excluded.disabled,
  updated_at = timezone('utc', now());

insert into public.plan_versions (plan_id, version, price_minor, currency, period_days, limits, features, change_note)
select v.plan_id, v.version, v.price_minor, v.currency, v.period_days, v.limits::jsonb, v.features::jsonb, v.change_note
from (values
  ('plan_buyer_free', 1, 0, 'NGN', 30,
   '{"requestsPerMonth":2,"vendorsPerRequest":4,"relayedMessages":30,"aiSuggestions":10,"standingAlerts":1,"whatsappEnabled":false,"bookingFeeWaived":false}',
   '{"label":"Buyer Free","summary":"Try AskAlert with a small monthly allowance.","enabled":true}',
   'Initial seed'),
  ('plan_buyer_starter', 1, 300000, 'NGN', 30,
   '{"requestsPerMonth":6,"vendorsPerRequest":8,"relayedMessages":150,"aiSuggestions":60,"standingAlerts":3,"whatsappEnabled":true,"bookingFeeWaived":true}',
   '{"label":"Buyer Starter","summary":"More asks, WhatsApp chat, booking fee waived.","enabled":true}',
   'Initial seed'),
  ('plan_vendor_free', 1, 0, 'NGN', 30,
   '{"leadAlertsPerMonth":20,"chatMessages":60,"whatsappEnabled":true}',
   '{"label":"Vendor Free","summary":"Lead alerts with digest fallback.","enabled":true}',
   'Initial seed'),
  ('plan_vendor_pro', 1, 0, 'NGN', 30,
   '{"leadAlertsPerMonth":10000,"chatMessages":10000,"whatsappEnabled":true}',
   '{"label":"Vendor Pro","summary":"Coming soon.","enabled":false}',
   'Initial seed')
) as v(plan_id, version, price_minor, currency, period_days, limits, features, change_note)
where not exists (
  select 1 from public.plan_versions pv
  where pv.plan_id = v.plan_id and pv.version = v.version
);

insert into public.app_settings (key, value) values
  ('unit_costs_minor', '{
    "ai_tokens":50,"ai_suggestion":200,"wa_service":350,"wa_utility":250,"wa_template":400,
    "sms":500,"stt":150,"places":100,"push":5,"email":20,
    "request":0,"vendor_contact":0,"relay_message":0,"lead_alert":0,"chat_message":0
  }'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = timezone('utc', now());

import type { UnitCostSettings, UsageEventType } from './types';

/** Default placeholder unit costs in kobo (editable via settings table / admin). */
export const DEFAULT_UNIT_COSTS: UnitCostSettings = {
  costsMinor: {
    ai_tokens: 50,
    ai_suggestion: 200,
    wa_service: 350,
    wa_utility: 250,
    wa_template: 400,
    sms: 500,
    stt: 150,
    places: 100,
    push: 5,
    email: 20,
    request: 0,
    vendor_contact: 0,
    relay_message: 0,
    lead_alert: 0,
    chat_message: 0,
  },
};

export function estimateCost(
  event: { type: UsageEventType; units: number },
  settings: UnitCostSettings = DEFAULT_UNIT_COSTS,
): number {
  if (!Number.isInteger(event.units) || event.units < 0) {
    throw new Error('units must be a non-negative integer.');
  }
  const unit = settings.costsMinor[event.type] ?? 0;
  if (!Number.isInteger(unit) || unit < 0) {
    throw new Error(`Unit cost for ${event.type} must be a non-negative integer (kobo).`);
  }
  return unit * event.units;
}

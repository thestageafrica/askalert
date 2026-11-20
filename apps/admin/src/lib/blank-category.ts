import type { CategoryConfig } from '@askalert/category-engine';

export function createBlankCategory(slug = 'new-category'): CategoryConfig {
  return {
    slug,
    name: 'New category',
    icon: 'sparkles',
    status: 'draft',
    pricing_mode: 'quote',
    negotiation: 'assisted',
    autopilot_max_rounds: 1,
    commission_pct: 10,
    escrow: {
      mode: 'buyer_selectable',
      default_hold_pct: 60,
      min_hold_pct: 0,
      max_hold_pct: 100,
      vendor_min_release_pct: 0,
      auto_release_hours: 48,
      fee_bearer: 'vendor',
      refund_commission_on_vendor_fault: true,
    },
    inspection_required: false,
    fulfilment: 'none',
    vendor_requirements: ['ID verification'],
    media_allowed: ['photo'],
    max_vendors_per_mission: 5,
    response_deadline_minutes: 120,
    attributes: [
      {
        key: 'area',
        label: 'Area',
        type: 'area',
        required: true,
        applies_to: 'need',
        validation: { min_length: 2, max_length: 80 },
      },
    ],
    agent: {
      tone: 'Clear and friendly.',
      extra_rules: [],
      negotiation_hints: [],
    },
    ranking_weights: {
      price: 0.2,
      rating: 0.2,
      response_speed: 0.2,
      proximity: 0.2,
      fit: 0.2,
    },
  };
}

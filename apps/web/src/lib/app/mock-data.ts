import type { AppRequest, ChatThread, Quote } from './types';

/** Demo total matching the landing phone + protect slider (₦128,500). */
export const DEMO_TOTAL_MINOR = 12_850_000;
export const DEMO_COMMISSION_PCT = 12;
export const DEMO_PROCESSING_FEE_MINOR = 160_000;
export const DEMO_HOLD_PCT = 40;
export const DEMO_FEE_BEARER = 'vendor' as const;
export const DEMO_ESCROW_BOUNDS = {
  minHoldPct: 0,
  maxHoldPct: 100,
  vendorMinReleasePct: 0,
} as const;

export const mockQuotes: Quote[] = [
  {
    id: 'q_nest',
    vendorAlias: 'Lagos Nest',
    verified: true,
    priceMinor: DEMO_TOTAL_MINOR,
    availability: 'Fri–Sun · ready now',
    rating: 4.9,
    reason: 'Best match for your dates, area and budget.',
    recommended: true,
  },
  {
    id: 'q_palm',
    vendorAlias: 'Palm Court',
    verified: true,
    priceMinor: 13_200_000,
    availability: 'Fri–Sun · pool access',
    rating: 4.7,
    reason: 'Strong reviews, a little above budget.',
  },
  {
    id: 'q_ocean',
    vendorAlias: 'Oceanview Stay',
    verified: true,
    priceMinor: 14_500_000,
    availability: 'Fri–Mon · sea view',
    rating: 4.8,
    reason: 'Premium option if you want the view.',
  },
];

export const seedRequest: AppRequest = {
  id: 'req_shortlet_01',
  categorySlug: 'shortlets',
  categoryName: 'Shortlets',
  title: '2-bedroom shortlet · Lagos',
  status: 'quotes_ready',
  involvement: 'assist',
  answers: {
    check_in: '2026-11-21',
    check_out: '2026-11-23',
    guests: 2,
    bedrooms: 2,
    budget_per_night: 5_000_000,
    area: 'Lagos Island',
  },
  createdAt: new Date().toISOString(),
  quotes: mockQuotes,
  chatId: 'chat_shortlet_01',
};

export const seedChat: ChatThread = {
  id: 'chat_shortlet_01',
  requestId: 'req_shortlet_01',
  vendorAlias: 'Lagos Nest',
  missionTag: 'Shortlet · Lagos Island',
  agentInControl: true,
  unreadCount: 1,
  messages: [
    {
      id: 'm1',
      from: 'agent',
      text: 'I asked three verified hosts for your Fri–Sun stay.',
      at: '09:12',
      deliveredAt: '09:12',
      readAt: '09:12',
    },
    {
      id: 'm2',
      from: 'vendor',
      text: 'We can do the 2-bed at ₦128,500 for the weekend, self check-in included.',
      at: '09:18',
      deliveredAt: '09:18',
    },
    {
      id: 'm3',
      from: 'agent',
      text: 'Draft reply ready: “Thanks — can you hold it with Wi‑Fi confirmed?”',
      at: '09:19',
      deliveredAt: '09:19',
      readAt: '09:19',
    },
    {
      id: 'm4',
      from: 'system',
      text: 'Contact details are shared after booking.',
      at: '09:19',
    },
  ],
};


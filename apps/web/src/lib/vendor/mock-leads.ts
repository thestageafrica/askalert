import type { VendorBooking, VendorLead } from './types';

export const SEED_VENDOR_LEADS: VendorLead[] = [
  {
    id: 'lead_shortlet_1',
    categorySlug: 'shortlets',
    categoryName: 'Shortlets',
    title: '2-bedroom weekend stay · Lekki Phase 1',
    area: 'Lekki Phase 1',
    budgetMinor: 180_000_00,
    summary: 'Fri–Sun, 3 guests, Wi-Fi and generator preferred.',
    status: 'new',
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
  {
    id: 'lead_events_1',
    categorySlug: 'events',
    categoryName: 'Events',
    title: 'Birthday dinner for 40 · Victoria Island',
    area: 'Victoria Island',
    budgetMinor: 450_000_00,
    summary: 'Saturday evening. Needs catering quote and décor options.',
    status: 'new',
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    id: 'lead_home_1',
    categorySlug: 'home-care',
    categoryName: 'Home care',
    title: 'Deep clean · Ikoyi apartment',
    area: 'Ikoyi',
    budgetMinor: 45_000_00,
    summary: '3-bed flat, tomorrow morning if possible.',
    status: 'questioned',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    chatId: 'chat_vendor_home_1',
  },
];

export const SEED_VENDOR_BOOKINGS: VendorBooking[] = [];

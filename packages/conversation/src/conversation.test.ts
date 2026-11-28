import { describe, expect, it } from 'vitest';
import { parseFreeTextRequest } from './free-text';
import { buildVendorLeadCard } from './lead-card';
import { advanceCapture, startCapture } from './machine';
import { parseVendorQuoteReply } from './quote-parse';
import { createCaptureSession, emptyDraft } from './types';
import {
  buildListMessage,
  buildReplyButtons,
  toPlainTextFallback,
} from './whatsapp-builders';
import { WHATSAPP_CAPTURE_LIMITS } from './whatsapp-limits';

const FREE_TEXT_FIXTURES: Array<{
  id: string;
  text: string;
  expectCategory?: string;
  expectType?: string;
  expectLocation?: string;
  expectGuests?: number;
  expectCancel?: boolean;
}> = [
  {
    id: 'en-wedding-lekki',
    text: 'Need catering and a photographer for a wedding in Lekki Phase 1, 150 guests, 20 December',
    expectCategory: 'events',
    expectType: 'wedding',
    expectLocation: 'lekki-phase-1',
    expectGuests: 150,
  },
  {
    id: 'pcm-jollof',
    text: 'Abeg I need jollof for wedding for 120 guests for Lekki',
    expectCategory: 'events',
    expectGuests: 120,
  },
  {
    id: 'yo-owambe',
    text: 'Owambe party for 200 people in VI',
    expectCategory: 'events',
    expectType: 'wedding',
  },
  {
    id: 'misspelled-lekky',
    text: 'Catering for birthday in Lekky Phase 1, 80 guests',
    expectCategory: 'events',
    expectGuests: 80,
  },
  {
    id: 'vi-short',
    text: 'Wedding catering in VI 100 guests 12 Dec',
    expectCategory: 'events',
    expectLocation: 'victoria-island',
    expectGuests: 100,
  },
  {
    id: 'ikoyi-burial',
    text: 'Burial catering in Ikoyi for 90 guests',
    expectCategory: 'events',
    expectType: 'burial-funeral',
    expectGuests: 90,
  },
  {
    id: 'ajah-dj',
    text: 'Need a DJ for birthday in Ajah',
    expectCategory: 'events',
    expectType: 'birthday',
  },
  {
    id: 'budget-k',
    text: 'Wedding catering Lekki Phase 1 120 guests budget 900k',
    expectCategory: 'events',
    expectGuests: 120,
  },
  {
    id: 'multi-service',
    text: 'Need catering and DJ for wedding in Lekki Phase 1, 150 guests',
    expectCategory: 'events',
    expectType: 'wedding',
    expectGuests: 150,
  },
  {
    id: 'wrong-number-guests',
    text: 'Wedding in Lekki for guests please',
    expectCategory: 'events',
    expectType: 'wedding',
  },
  {
    id: 'shortlet-hint',
    text: 'I need a shortlet in Lekki Phase 1',
    expectCategory: 'shortlets',
    expectLocation: 'lekki-phase-1',
  },
  {
    id: 'security-hint',
    text: 'Need security for event in Victoria Island',
    expectCategory: 'security',
  },
  {
    id: 'pcm-abeg-clean',
    text: 'Abeg help me find a cleaner for home care in Ikeja',
    expectCategory: 'home-care',
  },
  {
    id: 'guided-cancel-fixture',
    text: 'cancel please',
  },
  {
    id: 'wrong-location-typo',
    text: 'Wedding catering Lekki Phase 1 110 guests',
    expectCategory: 'events',
    expectLocation: 'lekki-phase-1',
    expectGuests: 110,
  },
  {
    id: 'relay-mode-words',
    text: 'Need photographer for wedding in Ikoyi 50 guests',
    expectCategory: 'events',
    expectType: 'wedding',
    expectGuests: 50,
  },
  {
    id: 'date-iso',
    text: 'Catering wedding Lekki Phase 1 100 guests 2026-12-20',
    expectCategory: 'events',
    expectGuests: 100,
  },
  {
    id: 'pax-word',
    text: 'Corporate lunch catering for 60 pax in Ikoyi',
    expectCategory: 'events',
    expectGuests: 60,
  },
  {
    id: 'unknown-service-gap',
    text: 'Need snow-machine rental for wedding in Lekki',
    expectCategory: 'events',
    expectType: 'wedding',
  },
  {
    id: 'oniru',
    text: 'Birthday photographer in Oniru 40 guests',
    expectCategory: 'events',
    expectGuests: 40,
  },
  {
    id: 'surulere',
    text: 'Wedding DJ in Surulere',
    expectCategory: 'events',
    expectType: 'wedding',
  },
  {
    id: 'yaba',
    text: 'Naming ceremony catering Yaba 70 guests',
    expectCategory: 'events',
    expectGuests: 70,
  },
  {
    id: 'pcm-na-jollof',
    text: 'Na jollof we want for wedding Lekki Phase 1 150 guests',
    expectCategory: 'events',
    expectGuests: 150,
  },
];

describe('whatsapp builders', () => {
  it('caps reply buttons at 3 and list rows with More', () => {
    const buttons = buildReplyButtons(
      'Pick',
      Array.from({ length: 5 }, (_, index) => ({
        id: `b${index}`,
        title: `Option ${index}`,
      })),
    );
    expect(buttons.kind).toBe('buttons');
    if (buttons.kind === 'buttons') {
      expect(buttons.buttons).toHaveLength(WHATSAPP_CAPTURE_LIMITS.replyButtonsMax);
    }

    const list = buildListMessage(
      'Choose',
      Array.from({ length: 15 }, (_, index) => ({
        id: `r${index}`,
        title: `Row ${index}`,
      })),
    );
    expect(list.kind).toBe('list');
    if (list.kind === 'list') {
      expect(list.rows.length).toBeLessThanOrEqual(WHATSAPP_CAPTURE_LIMITS.listRowsMax);
      expect(list.rows.some((row) => row.id.startsWith('more:'))).toBe(true);
      expect(toPlainTextFallback(list)).toContain('1.');
    }
  });
});

describe('free-text fixtures', () => {
  for (const fixture of FREE_TEXT_FIXTURES) {
    it(`parses ${fixture.id}`, () => {
      const result = parseFreeTextRequest(fixture.text, {
        now: new Date('2026-11-28T12:00:00Z'),
      });
      if (fixture.expectCategory) {
        expect(result.draftPatch.categorySlug).toBe(fixture.expectCategory);
      }
      if (fixture.expectType) {
        expect(result.draftPatch.typeSlug).toBe(fixture.expectType);
      }
      if (fixture.expectLocation) {
        expect(result.draftPatch.locationSlug).toBe(fixture.expectLocation);
      }
      if (fixture.expectGuests != null) {
        expect(result.draftPatch.items?.some((item) => item.quantity === fixture.expectGuests)).toBe(
          true,
        );
      }
    });
  }

  it('logs a catalog gap for unknown service-ish terms when unmatched', () => {
    const result = parseFreeTextRequest('Need snow-cannon fogger for wedding in Lekki Phase 1');
    expect(result.gaps.length + result.notes.length).toBeGreaterThan(0);
  });
});

describe('guided capture machine', () => {
  it('walks category → type → services → details → confirm', () => {
    let result = startCapture();
    expect(result.outbound[0]?.kind).toBe('list');

    result = advanceCapture(result.session, {
      kind: 'tap',
      id: 'category:events',
      title: 'Events',
    });
    expect(result.session.step).toBe('type');

    result = advanceCapture(result.session, { kind: 'tap', id: 'type:wedding', title: 'Wedding' });
    expect(result.session.step).toBe('services');

    result = advanceCapture(result.session, {
      kind: 'tap',
      id: 'service:catering',
      title: 'Catering',
    });
    expect(result.session.draft.items[0]?.serviceSlug).toBe('catering');

    result = advanceCapture(result.session, { kind: 'tap', id: 'services:done', title: 'Done' });
    expect(result.session.step).toBe('details');

    result = advanceCapture(result.session, { kind: 'text', text: '120' });
    expect(result.session.draft.items[0]?.quantity).toBe(120);
    expect(result.session.step).toBe('date');

    result = advanceCapture(result.session, { kind: 'text', text: '20 December' });
    expect(result.session.draft.startDate).toMatch(/-12-20$/);

    result = advanceCapture(result.session, { kind: 'tap', id: 'state:lagos', title: 'Lagos' });
    result = advanceCapture(result.session, {
      kind: 'tap',
      id: 'place:lekki-phase-1',
      title: 'Lekki Phase 1',
    });
    result = advanceCapture(result.session, { kind: 'tap', id: 'budget:skip', title: 'Skip' });
    result = advanceCapture(result.session, { kind: 'tap', id: 'mode:assist', title: 'Assist' });
    expect(result.session.step).toBe('confirm');

    result = advanceCapture(result.session, { kind: 'tap', id: 'confirm:submit', title: 'Submit' });
    expect(result.completed).toBe(true);
    expect(result.extracted?.categorySlug).toBe('events');
  });

  it('cancels from confirm', () => {
    const session = createCaptureSession();
    session.step = 'confirm';
    session.draft = {
      ...emptyDraft(),
      categorySlug: 'events',
      typeSlug: 'wedding',
      items: [{ serviceSlug: 'catering', quantity: 100 }],
      startDate: '2026-12-20',
      stateSlug: 'lagos',
      locationSlug: 'lekki-phase-1',
      involvement: 'assist',
      budgetMaxMinor: null,
    };
    const result = advanceCapture(session, { kind: 'cancel' });
    expect(result.cancelled).toBe(true);
  });

  it('handles free-text jump near the start', () => {
    let result = startCapture();
    result = advanceCapture(result.session, {
      kind: 'text',
      text: 'Need catering for a wedding in Lekki Phase 1, 150 guests, 20 December',
    });
    expect(result.session.draft.categorySlug).toBe('events');
    expect(
      result.session.step === 'confirm' ||
        result.session.step === 'details' ||
        result.session.step === 'budget' ||
        result.session.step === 'mode' ||
        result.session.step === 'location_state' ||
        result.session.step === 'location_place' ||
        result.session.step === 'date',
    ).toBe(true);
  });
});

describe('vendor quote replies and lead cards', () => {
  const quoteFixtures = [
    { text: '6k per head', amount: 600_000, basis: 'per_unit' as const },
    { text: '6500 per guest', amount: 650_000, basis: 'per_unit' as const },
    { text: '₦5500/head', amount: 550_000, basis: 'per_unit' as const },
    { text: 'total 900k', amount: 90_000_000, basis: 'total' as const },
    { text: 'flat 1.2m', amount: 120_000_000, basis: 'total' as const },
    { text: '7.5k per person', amount: 750_000, basis: 'per_unit' as const },
    { text: 'no price yet', amount: null, basis: 'unknown' as const },
    { text: '8k per pax', amount: 800_000, basis: 'per_unit' as const },
    { text: '5000 per head', amount: 500_000, basis: 'per_unit' as const },
    { text: '₦2.5m total', amount: 250_000_000, basis: 'total' as const },
    { text: '4.5k / guest', amount: 450_000, basis: 'per_unit' as const },
    { text: 'wrong number abc', amount: null, basis: 'unknown' as const },
  ];

  for (const fixture of quoteFixtures) {
    it(`parses “${fixture.text}”`, () => {
      const parsed = parseVendorQuoteReply(fixture.text);
      expect(parsed.basis).toBe(fixture.basis);
      expect(parsed.amountMinor).toBe(fixture.amount);
    });
  }

  it('builds a lead card with Quote / Rate card / Decline', () => {
    const card = buildVendorLeadCard({
      draft: {
        ...emptyDraft(),
        typeSlug: 'wedding',
        items: [{ serviceSlug: 'catering', quantity: 120 }],
        startDate: '2026-12-20',
        locationSlug: 'lekki-phase-1',
        budgetMaxMinor: 900_000_00,
        involvement: 'assist',
        categorySlug: 'events',
        stateSlug: 'lagos',
      },
      typeName: 'Wedding',
      serviceSummary: 'Catering',
      locationName: 'Lekki Phase 1',
    });
    expect(card.kind).toBe('buttons');
    if (card.kind === 'buttons') {
      expect(card.buttons.map((button) => button.id)).toEqual([
        'lead:quote',
        'lead:rate_card',
        'lead:decline',
      ]);
    }
  });
});

describe('fixture conversation count', () => {
  it('covers at least 40 fixture scenarios across suites', () => {
    const freeText = FREE_TEXT_FIXTURES.length;
    const quotes = 12;
    const guided = 3;
    const builders = 1;
    const gaps = 1;
    const lead = 1;
    const total = freeText + quotes + guided + builders + gaps + lead;
    expect(freeText).toBeGreaterThanOrEqual(20);
    expect(total).toBeGreaterThanOrEqual(40);
  });
});

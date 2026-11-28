import type { CaptureDraft } from './types';
import { buildReplyButtons, buildTextMessage } from './whatsapp-builders';
import type { CaptureOutbound } from './types';

export type VendorLeadCardInput = {
  draft: CaptureDraft;
  typeName?: string;
  serviceSummary?: string;
  locationName?: string;
};

export function buildVendorLeadCard(input: VendorLeadCardInput): CaptureOutbound {
  const { draft } = input;
  const guests = draft.items.map((item) => item.quantity).find((value) => value != null);
  const body = [
    'New AskAlert lead',
    `Type: ${input.typeName ?? draft.typeSlug ?? '—'}`,
    `Service: ${input.serviceSummary ?? (draft.items.map((item) => item.serviceSlug).join(', ') || '—')}`,
    guests != null ? `Guests/qty: ${guests}` : null,
    `Date: ${draft.startDate ?? '—'}`,
    `Location: ${input.locationName ?? draft.locationSlug ?? '—'}`,
    draft.budgetMaxMinor != null
      ? `Budget: ₦${Math.round(draft.budgetMaxMinor / 100).toLocaleString('en-NG')}`
      : 'Budget: not set',
  ]
    .filter(Boolean)
    .join('\n');

  return buildReplyButtons(body, [
    { id: 'lead:quote', title: 'Quote' },
    { id: 'lead:rate_card', title: 'Use rate card' },
    { id: 'lead:decline', title: 'Decline' },
  ]);
}

export function buildVendorAskPrompt(): CaptureOutbound {
  return buildTextMessage('What should we ask the buyer? Keep it short — no phone numbers.');
}

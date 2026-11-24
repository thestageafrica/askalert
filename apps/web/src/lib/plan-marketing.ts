import { listPlans, type PlanDefinition } from '@askalert/core';
import { formatNaira } from '@askalert/payments';

export function marketingBuyerPlans(): PlanDefinition[] {
  return listPlans().filter((plan) => plan.audience === 'buyer');
}

export function marketingVendorPlan(): PlanDefinition | undefined {
  return listPlans().find((plan) => plan.slug === 'vendor_free');
}

export function planPriceLabel(plan: PlanDefinition): string {
  if (plan.priceMinor === 0) {
    return 'Free';
  }
  return `${formatNaira({ amountKobo: plan.priceMinor, currency: 'NGN' })} / ${plan.periodDays} days`;
}

/** Plain-English bullets from plan limits for marketing. */
export function planFeatureLines(plan: PlanDefinition): string[] {
  const lines: string[] = [];
  const { limits } = plan;

  if (limits.requestsPerMonth != null) {
    lines.push(`${limits.requestsPerMonth} requests per month`);
  }
  if (limits.vendorsPerRequest != null) {
    lines.push(`Up to ${limits.vendorsPerRequest} vendors per request`);
  }
  if (limits.relayedMessages != null) {
    lines.push(`About ${limits.relayedMessages} in-app chat messages`);
  }
  if (limits.aiSuggestions != null) {
    lines.push(`About ${limits.aiSuggestions} AI suggestions`);
  }
  if (limits.standingAlerts != null) {
    lines.push(`${limits.standingAlerts} standing alert${limits.standingAlerts === 1 ? '' : 's'}`);
  }
  if (limits.leadAlertsPerMonth != null) {
    lines.push(`About ${limits.leadAlertsPerMonth} lead alerts per month`);
  }
  if (limits.chatMessages != null) {
    lines.push(`About ${limits.chatMessages} chat messages with buyers`);
  }
  if (limits.whatsappEnabled) {
    lines.push('WhatsApp chat included');
  } else if (limits.whatsappEnabled === false) {
    lines.push('In-app chat only (no WhatsApp chat)');
  }
  if (limits.bookingFeeWaived) {
    lines.push('Booking fee waived');
  }

  return lines;
}

export const chatExplainer = {
  inApp: {
    title: 'Free in-app chat',
    body: 'Message inside AskAlert. Your number stays private. Good for short back-and-forth on Free and Starter.',
  },
  whatsapp: {
    title: 'WhatsApp chat',
    body: 'Messages and alerts on WhatsApp so you can reply from the app you already use. Included on Starter for buyers.',
  },
} as const;

export const plansFaqItems = [
  {
    id: 'whatsapp-extra',
    title: 'Why does WhatsApp cost extra?',
    content:
      'WhatsApp messages cost AskAlert money to send. Starter covers that so you can chat and get alerts on WhatsApp. Free keeps chat inside the app.',
  },
  {
    id: 'limit',
    title: 'What happens when I reach my limit?',
    content:
      'We pause the action that hit the limit and tell you in plain English. You can wait for the next period, upgrade to Starter, or buy a credit top-up where available.',
  },
  {
    id: 'extra',
    title: 'Can I buy extra?',
    content:
      'Yes. You can move to Starter for a higher monthly allowance, or buy a credit top-up for extra usage when you need a little more.',
  },
  {
    id: 'hold-plans',
    title: "What does 'hold' mean?",
    content:
      'A hold is money AskAlert keeps until you confirm the job went well. You choose the hold percentage. The rest can go to the vendor sooner.',
  },
] as const;

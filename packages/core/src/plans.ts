import { planDefinitionSchema, type PlanDefinition } from './types';

/**
 * Plan catalogue as configuration (not business logic).
 * Prices and limits are placeholders an admin can change later.
 */
export const PLAN_CATALOGUE: PlanDefinition[] = [
  planDefinitionSchema.parse({
    id: 'plan_buyer_free',
    slug: 'buyer_free',
    audience: 'buyer',
    name: 'Free',
    priceMinor: 0,
    periodDays: 30,
    currency: 'NGN',
    limits: {
      requestsPerMonth: 2,
      vendorsPerRequest: 4,
      relayedMessages: 30,
      aiSuggestions: 10,
      standingAlerts: 1,
      whatsappEnabled: false,
      bookingFeeWaived: false,
    },
    features: {
      label: 'Buyer Free',
      summary: 'Try AskAlert with a small monthly allowance.',
      enabled: true,
    },
    disabled: false,
  }),
  planDefinitionSchema.parse({
    id: 'plan_buyer_starter',
    slug: 'buyer_starter',
    audience: 'buyer',
    name: 'Starter',
    priceMinor: 300_000,
    periodDays: 30,
    currency: 'NGN',
    limits: {
      requestsPerMonth: 6,
      vendorsPerRequest: 8,
      relayedMessages: 150,
      aiSuggestions: 60,
      standingAlerts: 3,
      whatsappEnabled: true,
      bookingFeeWaived: true,
    },
    features: {
      label: 'Buyer Starter',
      summary: 'More asks, WhatsApp chat, booking fee waived.',
      enabled: true,
    },
    disabled: false,
  }),
  planDefinitionSchema.parse({
    id: 'plan_vendor_free',
    slug: 'vendor_free',
    audience: 'vendor',
    name: 'Vendor Free',
    priceMinor: 0,
    periodDays: 30,
    currency: 'NGN',
    limits: {
      leadAlertsPerMonth: 20,
      chatMessages: 60,
      whatsappEnabled: true,
    },
    features: {
      label: 'Vendor Free',
      summary: 'Lead alerts with digest fallback. Earn more after paid bookings.',
      enabled: true,
    },
    disabled: false,
  }),
  planDefinitionSchema.parse({
    id: 'plan_vendor_pro',
    slug: 'vendor_pro',
    audience: 'vendor',
    name: 'Vendor Pro',
    priceMinor: 0,
    periodDays: 30,
    currency: 'NGN',
    limits: {
      leadAlertsPerMonth: 10_000,
      chatMessages: 10_000,
      whatsappEnabled: true,
    },
    features: {
      label: 'Vendor Pro',
      summary: 'Unlimited lead alerts and verified tools (coming soon).',
      enabled: false,
    },
    disabled: true,
  }),
];

export function listPlans(includeDisabled = false): PlanDefinition[] {
  return PLAN_CATALOGUE.filter((plan) => includeDisabled || !plan.disabled);
}

export function getPlanById(planId: string): PlanDefinition | undefined {
  return PLAN_CATALOGUE.find((plan) => plan.id === planId);
}

export function getPlanBySlug(slug: string): PlanDefinition | undefined {
  return PLAN_CATALOGUE.find((plan) => plan.slug === slug);
}

export function defaultPlanForAudience(
  audience: PlanDefinition['audience'],
): PlanDefinition {
  const plan = listPlans().find((item) => item.audience === audience && item.priceMinor === 0);
  if (!plan) {
    throw new Error(`No free plan configured for ${audience}`);
  }
  return plan;
}

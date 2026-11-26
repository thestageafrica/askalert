import { z } from 'zod';

export const planAudienceSchema = z.enum(['buyer', 'vendor']);
export type PlanAudience = z.infer<typeof planAudienceSchema>;

export const planLimitsSchema = z
  .object({
    requestsPerMonth: z.number().int().nonnegative().optional(),
    vendorsPerRequest: z.number().int().positive().optional(),
    relayedMessages: z.number().int().nonnegative().optional(),
    aiSuggestions: z.number().int().nonnegative().optional(),
    standingAlerts: z.number().int().nonnegative().optional(),
    whatsappEnabled: z.boolean().optional(),
    bookingFeeWaived: z.boolean().optional(),
    leadAlertsPerMonth: z.number().int().nonnegative().optional(),
    chatMessages: z.number().int().nonnegative().optional(),
    /** Max service coverage rows a vendor may save on their profile. */
    maxServiceAreas: z.number().int().positive().optional(),
  })
  .strict();

export type PlanLimits = z.infer<typeof planLimitsSchema>;

export const planFeaturesSchema = z
  .object({
    label: z.string(),
    summary: z.string(),
    enabled: z.boolean().default(true),
    /** Starter (and later plans) may enable Autopilot negotiation. */
    autopilotEnabled: z.boolean().optional().default(false),
  })
  .strict();

export type PlanFeatures = z.infer<typeof planFeaturesSchema>;

export const planDefinitionSchema = z
  .object({
    id: z.string().min(1),
    slug: z.string().min(1),
    audience: planAudienceSchema,
    name: z.string().min(1),
    /** Placeholder price in kobo; editable via admin later. */
    priceMinor: z.number().int().nonnegative(),
    periodDays: z.number().int().positive(),
    currency: z.literal('NGN'),
    limits: planLimitsSchema,
    features: planFeaturesSchema,
    disabled: z.boolean().default(false),
  })
  .strict();

export type PlanDefinition = z.infer<typeof planDefinitionSchema>;

export const entitlementActionSchema = z.enum([
  'start_request',
  'contact_vendors',
  'relay_message',
  'ai_suggestion',
  'send_whatsapp',
  'select_service_area',
]);

export type EntitlementAction = z.infer<typeof entitlementActionSchema>;

export const usageEventTypeSchema = z.enum([
  'ai_tokens',
  'wa_service',
  'wa_utility',
  'wa_template',
  'sms',
  'stt',
  'places',
  'push',
  'email',
  'request',
  'vendor_contact',
  'relay_message',
  'ai_suggestion',
  'lead_alert',
  'chat_message',
]);

export type UsageEventType = z.infer<typeof usageEventTypeSchema>;

export type UsageCounters = {
  requests: number;
  vendorContacts: number;
  relayedMessages: number;
  aiSuggestions: number;
  whatsappMessages: number;
  leadAlerts: number;
  chatMessages: number;
};

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';

export type UserPlanState = {
  userId: string;
  audience: PlanAudience;
  planId: string;
  planVersion: number;
  status: SubscriptionStatus;
  startsAt: string;
  endsAt: string;
  usage: UsageCounters;
  /** Extra credits (e.g. earned lead alerts). */
  bonusLeadAlerts: number;
};

export type EntitlementDecision =
  | {
      outcome: 'allow';
      remaining?: number;
      limit?: number;
    }
  | {
      outcome: 'warn_at_80';
      remaining: number;
      limit: number;
      reason: string;
      nextStep: string;
    }
  | {
      outcome: 'block';
      remaining: number;
      limit: number;
      reason: string;
      nextStep: string;
    };

export type UnitCostSettings = {
  /** Estimated cost in kobo per usage unit, keyed by usage event type. */
  costsMinor: Partial<Record<UsageEventType, number>>;
};

export type UsageEvent = {
  userId: string;
  requestId?: string;
  type: UsageEventType;
  units: number;
  estCostMinor: number;
  createdAt: string;
};

export type CreditWallet = {
  userId: string;
  balanceMinor: number;
  currency: 'NGN';
};

export type PurchaseKind = 'starter_pass' | 'credit_pack';

export const emptyUsage = (): UsageCounters => ({
  requests: 0,
  vendorContacts: 0,
  relayedMessages: 0,
  aiSuggestions: 0,
  whatsappMessages: 0,
  leadAlerts: 0,
  chatMessages: 0,
});

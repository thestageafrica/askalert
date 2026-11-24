import { z } from 'zod';
import {
  planDefinitionSchema,
  type PlanDefinition,
  type PlanLimits,
} from '@askalert/core';

export const planDraftSchema = planDefinitionSchema
  .omit({ id: true })
  .extend({
    changeNote: z.string().trim().min(3, 'Add a short change note.'),
  });

export type PlanDraftInput = z.infer<typeof planDraftSchema>;

export type AdminPlanVersion = {
  version: number;
  priceMinor: number;
  periodDays: number;
  limits: PlanLimits;
  features: PlanDefinition['features'];
  changeNote: string;
  createdAt: string;
};

export type AdminPlanRecord = {
  id: string;
  slug: string;
  audience: PlanDefinition['audience'];
  name: string;
  disabled: boolean;
  /** Live catalogue pointer — publishing bumps this without touching subscriptions. */
  currentVersion: number;
  versions: AdminPlanVersion[];
};

export function planFromCatalogue(plan: PlanDefinition): AdminPlanRecord {
  return {
    id: plan.id,
    slug: plan.slug,
    audience: plan.audience,
    name: plan.name,
    disabled: plan.disabled,
    currentVersion: 1,
    versions: [
      {
        version: 1,
        priceMinor: plan.priceMinor,
        periodDays: plan.periodDays,
        limits: plan.limits,
        features: plan.features,
        changeNote: 'Initial catalogue seed',
        createdAt: new Date().toISOString(),
      },
    ],
  };
}

export function getLiveVersion(plan: AdminPlanRecord): AdminPlanVersion {
  const live = plan.versions.find((item) => item.version === plan.currentVersion);
  if (!live) {
    throw new Error(`Missing live version ${plan.currentVersion} for ${plan.id}`);
  }
  return live;
}

/**
 * Publish a new version. Does not mutate existing subscription periods —
 * subscribers keep their starts_at / ends_at / version until renewal.
 */
export function publishPlanVersion(
  plan: AdminPlanRecord,
  draft: PlanDraftInput,
): { plan: AdminPlanRecord; version: AdminPlanVersion } {
  const parsed = planDraftSchema.parse(draft);
  const nextVersion = Math.max(...plan.versions.map((item) => item.version)) + 1;
  const version: AdminPlanVersion = {
    version: nextVersion,
    priceMinor: parsed.priceMinor,
    periodDays: parsed.periodDays,
    limits: parsed.limits,
    features: parsed.features,
    changeNote: parsed.changeNote,
    createdAt: new Date().toISOString(),
  };
  return {
    plan: {
      ...plan,
      name: parsed.name,
      disabled: parsed.disabled,
      currentVersion: nextVersion,
      versions: [...plan.versions, version],
    },
    version,
  };
}

export function rollbackPlanVersion(
  plan: AdminPlanRecord,
  targetVersion: number,
): AdminPlanRecord {
  const exists = plan.versions.some((item) => item.version === targetVersion);
  if (!exists) {
    throw new Error(`Version ${targetVersion} not found for ${plan.id}`);
  }
  // Point catalogue at an older published version; subscriber rows stay untouched.
  return {
    ...plan,
    currentVersion: targetVersion,
  };
}

export function previewPlanCapabilities(version: AdminPlanVersion): string[] {
  const lines: string[] = [];
  const { limits } = version;
  if (limits.requestsPerMonth != null) {
    lines.push(`${limits.requestsPerMonth} requests per month`);
  }
  if (limits.vendorsPerRequest != null) {
    lines.push(`${limits.vendorsPerRequest} vendors per request`);
  }
  if (limits.relayedMessages != null) {
    lines.push(`About ${limits.relayedMessages} chat messages`);
  }
  if (limits.aiSuggestions != null) {
    lines.push(`About ${limits.aiSuggestions} AI suggestions`);
  }
  if (limits.leadAlertsPerMonth != null) {
    lines.push(`About ${limits.leadAlertsPerMonth} lead alerts per month`);
  }
  if (limits.whatsappEnabled) {
    lines.push('WhatsApp chat included');
  } else if (limits.whatsappEnabled === false) {
    lines.push('WhatsApp chat not included');
  }
  if (limits.bookingFeeWaived) {
    lines.push('Booking fee waived');
  }
  return lines;
}

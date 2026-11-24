import { estimateCost } from './cost';
import type {
  UnitCostSettings,
  UsageCounters,
  UsageEvent,
  UsageEventType,
  UserPlanState,
} from './types';
import { emptyUsage } from './types';

export type RecordUsageInput = {
  state: UserPlanState;
  type: UsageEventType;
  units?: number;
  requestId?: string;
  settings: UnitCostSettings;
  now?: Date;
};

export type RecordUsageResult = {
  state: UserPlanState;
  event: UsageEvent;
};

function bumpCounters(usage: UsageCounters, type: UsageEventType, units: number): UsageCounters {
  const next = { ...usage };
  switch (type) {
    case 'request':
      next.requests += units;
      break;
    case 'vendor_contact':
      next.vendorContacts += units;
      break;
    case 'relay_message':
      next.relayedMessages += units;
      break;
    case 'ai_suggestion':
      next.aiSuggestions += units;
      break;
    case 'wa_service':
    case 'wa_utility':
    case 'wa_template':
      next.whatsappMessages += units;
      break;
    case 'lead_alert':
      next.leadAlerts += units;
      break;
    case 'chat_message':
      next.chatMessages += units;
      break;
    default:
      break;
  }
  return next;
}

/** Immutable usage record. Safe for concurrent callers if each starts from the same snapshot. */
export function recordUsage(input: RecordUsageInput): RecordUsageResult {
  const units = input.units ?? 1;
  if (!Number.isInteger(units) || units <= 0) {
    throw new Error('Usage units must be a positive integer.');
  }
  const now = input.now ?? new Date();
  const estCostMinor = estimateCost(
    { type: input.type, units },
    input.settings,
  );
  const event: UsageEvent = {
    userId: input.state.userId,
    requestId: input.requestId,
    type: input.type,
    units,
    estCostMinor,
    createdAt: now.toISOString(),
  };
  return {
    state: {
      ...input.state,
      usage: bumpCounters(input.state.usage, input.type, units),
    },
    event,
  };
}

export type UsageSummary = {
  usage: UsageCounters;
  estimatedCostMinor: number;
};

export function getUsageSummary(
  events: UsageEvent[],
  fallbackUsage?: UsageCounters,
): UsageSummary {
  const usage = fallbackUsage ? { ...fallbackUsage } : emptyUsage();
  let estimatedCostMinor = 0;
  for (const event of events) {
    estimatedCostMinor += event.estCostMinor;
    if (!fallbackUsage) {
      Object.assign(usage, bumpCounters(usage, event.type, event.units));
    }
  }
  return { usage, estimatedCostMinor };
}

/** Vendors earn +10 lead alerts per completed platform-paid booking. */
export function applyEarnedCredits(
  state: UserPlanState,
  bookingCount = 1,
): UserPlanState {
  if (!Number.isInteger(bookingCount) || bookingCount <= 0) {
    throw new Error('bookingCount must be a positive integer.');
  }
  return {
    ...state,
    bonusLeadAlerts: state.bonusLeadAlerts + bookingCount * 10,
  };
}

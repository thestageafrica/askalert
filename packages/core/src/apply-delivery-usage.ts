import { DEFAULT_UNIT_COSTS } from './cost';
import type { DeliveryPlan } from './notification-types';
import { recordUsage } from './usage';
import type { UsageEvent, UserPlanState } from './types';

/**
 * Record usage_events for channels that routeNotification marked to send now.
 */
export function applyDeliveryUsage(
  state: UserPlanState,
  plan: DeliveryPlan,
  now = new Date(),
): { state: UserPlanState; events: UsageEvent[] } {
  let next = state;
  const events: UsageEvent[] = [];
  for (const type of plan.usageToRecord) {
    const result = recordUsage({
      state: next,
      type,
      settings: DEFAULT_UNIT_COSTS,
      now,
    });
    next = result.state;
    events.push(result.event);
  }
  return { state: next, events };
}

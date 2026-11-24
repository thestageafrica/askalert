'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  checkEntitlement,
  completeMockPurchase,
  createFreeSubscription,
  getActivePlan,
  getPlanById,
  recordUsage,
  DEFAULT_UNIT_COSTS,
  type EntitlementAction,
  type EntitlementDecision,
  type UserPlanState,
} from '@askalert/core';

type PlanStore = {
  state: UserPlanState;
  planName: string;
  check: (action: EntitlementAction, vendorsOnRequest?: number) => EntitlementDecision;
  consume: (
    action: EntitlementAction,
    vendorsOnRequest?: number,
  ) => { decision: EntitlementDecision; blocked: boolean };
  buyStarter: () => void;
  buyCreditPack: () => void;
};

const PlanStoreContext = createContext<PlanStore | null>(null);

export function PlanStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<UserPlanState>(() =>
    createFreeSubscription({ userId: 'demo-buyer', audience: 'buyer' }),
  );

  const plan = getActivePlan(state) ?? getPlanById(state.planId);
  const planName = plan?.name ?? 'Free';

  const check = useCallback(
    (action: EntitlementAction, vendorsOnRequest?: number) =>
      checkEntitlement(state, action, { vendorsOnRequest }),
    [state],
  );

  const consume = useCallback(
    (action: EntitlementAction, vendorsOnRequest?: number) => {
      const decision = checkEntitlement(state, action, { vendorsOnRequest });
      if (decision.outcome === 'block') {
        return { decision, blocked: true };
      }
      const usageType =
        action === 'start_request'
          ? 'request'
          : action === 'contact_vendors'
            ? 'vendor_contact'
            : action === 'relay_message'
              ? 'relay_message'
              : action === 'ai_suggestion'
                ? 'ai_suggestion'
                : 'wa_service';
      const { state: next } = recordUsage({
        state,
        type: usageType,
        settings: DEFAULT_UNIT_COSTS,
      });
      setState(next);
      return { decision, blocked: false };
    },
    [state],
  );

  const buyStarter = useCallback(() => {
    setState((current) => completeMockPurchase({ state: current, kind: 'starter_pass' }));
  }, []);

  const buyCreditPack = useCallback(() => {
    setState((current) => completeMockPurchase({ state: current, kind: 'credit_pack' }));
  }, []);

  const value = useMemo(
    () => ({ state, planName, check, consume, buyStarter, buyCreditPack }),
    [state, planName, check, consume, buyStarter, buyCreditPack],
  );

  return <PlanStoreContext.Provider value={value}>{children}</PlanStoreContext.Provider>;
}

export function usePlanStore(): PlanStore {
  const ctx = useContext(PlanStoreContext);
  if (!ctx) {
    throw new Error('usePlanStore must be used within PlanStoreProvider');
  }
  return ctx;
}

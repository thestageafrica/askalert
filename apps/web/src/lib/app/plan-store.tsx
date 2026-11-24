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
  MOCK_CREDIT_PACK_MINOR,
  type EntitlementAction,
  type EntitlementDecision,
  type PurchaseKind,
  type UserPlanState,
} from '@askalert/core';

type ConsumeResult = {
  decision: EntitlementDecision;
  blocked: boolean;
};

type PlanStore = {
  state: UserPlanState;
  planName: string;
  walletBalanceMinor: number;
  creditPackMinor: number;
  check: (action: EntitlementAction, vendorsOnRequest?: number) => EntitlementDecision;
  consume: (action: EntitlementAction, vendorsOnRequest?: number) => ConsumeResult;
  buyStarter: () => void;
  buyCreditPack: () => void;
  completePurchase: (kind: PurchaseKind) => void;
};

const PlanStoreContext = createContext<PlanStore | null>(null);

function usageTypeFor(action: EntitlementAction) {
  switch (action) {
    case 'start_request':
      return 'request' as const;
    case 'contact_vendors':
      return 'vendor_contact' as const;
    case 'relay_message':
      return 'relay_message' as const;
    case 'ai_suggestion':
      return 'ai_suggestion' as const;
    case 'send_whatsapp':
      return 'wa_service' as const;
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}

export function PlanStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<UserPlanState>(() =>
    createFreeSubscription({ userId: 'demo-buyer', audience: 'buyer' }),
  );
  const [walletBalanceMinor, setWalletBalanceMinor] = useState(0);

  const plan = getActivePlan(state) ?? getPlanById(state.planId);
  const planName = plan?.name ?? 'Free';

  const check = useCallback(
    (action: EntitlementAction, vendorsOnRequest?: number) =>
      checkEntitlement(state, action, { vendorsOnRequest }),
    [state],
  );

  const consume = useCallback(
    (action: EntitlementAction, vendorsOnRequest?: number): ConsumeResult => {
      const decision = checkEntitlement(state, action, { vendorsOnRequest });
      if (decision.outcome === 'block') {
        return { decision, blocked: true };
      }
      const { state: next } = recordUsage({
        state,
        type: usageTypeFor(action),
        settings: DEFAULT_UNIT_COSTS,
      });
      setState(next);
      return { decision, blocked: false };
    },
    [state],
  );

  const completePurchase = useCallback((kind: PurchaseKind) => {
    setState((current) => {
      const result = completeMockPurchase({
        state: current,
        kind,
        creditPackMinor: MOCK_CREDIT_PACK_MINOR,
        walletBalanceMinor: 0,
      });
      return result.state;
    });
    if (kind === 'credit_pack') {
      setWalletBalanceMinor((balance) => balance + MOCK_CREDIT_PACK_MINOR);
    }
  }, []);

  const buyStarter = useCallback(() => {
    completePurchase('starter_pass');
  }, [completePurchase]);

  const buyCreditPack = useCallback(() => {
    completePurchase('credit_pack');
  }, [completePurchase]);

  const value = useMemo(
    () => ({
      state,
      planName,
      walletBalanceMinor,
      creditPackMinor: MOCK_CREDIT_PACK_MINOR,
      check,
      consume,
      buyStarter,
      buyCreditPack,
      completePurchase,
    }),
    [
      state,
      planName,
      walletBalanceMinor,
      check,
      consume,
      buyStarter,
      buyCreditPack,
      completePurchase,
    ],
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

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
  DEFAULT_UNIT_COSTS,
  listPlans,
  type UnitCostSettings,
  type UsageEventType,
} from '@askalert/core';
import {
  getLiveVersion,
  planFromCatalogue,
  publishPlanVersion,
  rollbackPlanVersion,
  type AdminPlanRecord,
  type PlanDraftInput,
} from './plan-admin';

export type MockUsageEvent = {
  id: string;
  userId: string;
  type: UsageEventType;
  units: number;
  estCostMinor: number;
  createdAt: string;
  requestId?: string;
};

export type MockUsageUser = {
  userId: string;
  displayName: string;
  audience: 'buyer' | 'vendor';
  planId: string;
  planVersion: number;
  usage: {
    requests: number;
    relayedMessages: number;
    aiSuggestions: number;
    leadAlerts: number;
  };
  bonusLeadAlerts: number;
  walletBalanceMinor: number;
};

export type AuditEntry = {
  id: string;
  at: string;
  actorRole: string;
  action: string;
  reason: string;
  meta?: Record<string, string | number>;
};

export type CostAlertThresholds = {
  dailyCostMinor: number;
  userCostMinor: number;
};

type BillingAdminStore = {
  plans: AdminPlanRecord[];
  users: MockUsageUser[];
  events: MockUsageEvent[];
  unitCosts: UnitCostSettings;
  thresholds: CostAlertThresholds;
  auditLog: AuditEntry[];
  publishPlan: (
    planId: string,
    draft: PlanDraftInput,
  ) => { ok: true } | { ok: false; error: string };
  rollbackPlan: (planId: string, version: number) => { ok: true } | { ok: false; error: string };
  grantCredit: (input: {
    userId: string;
    amountMinor: number;
    reason: string;
    actorRole: string;
  }) => { ok: true } | { ok: false; error: string };
  setUnitCosts: (next: UnitCostSettings) => void;
  setThresholds: (next: CostAlertThresholds) => void;
};

const BillingContext = createContext<BillingAdminStore | null>(null);

function seedUsers(): MockUsageUser[] {
  return [
    {
      userId: 'buyer-ada',
      displayName: 'Ada Buyer',
      audience: 'buyer',
      planId: 'plan_buyer_free',
      planVersion: 1,
      usage: { requests: 2, relayedMessages: 18, aiSuggestions: 4, leadAlerts: 0 },
      bonusLeadAlerts: 0,
      walletBalanceMinor: 0,
    },
    {
      userId: 'buyer-chi',
      displayName: 'Chioma Starter',
      audience: 'buyer',
      planId: 'plan_buyer_starter',
      planVersion: 1,
      usage: { requests: 3, relayedMessages: 40, aiSuggestions: 12, leadAlerts: 0 },
      bonusLeadAlerts: 0,
      walletBalanceMinor: 50_000,
    },
    {
      userId: 'vendor-nest',
      displayName: 'Lagos Nest',
      audience: 'vendor',
      planId: 'plan_vendor_free',
      planVersion: 1,
      usage: { requests: 0, relayedMessages: 0, aiSuggestions: 0, leadAlerts: 20 },
      bonusLeadAlerts: 0,
      walletBalanceMinor: 0,
    },
  ];
}

function seedEvents(): MockUsageEvent[] {
  const day = (offset: number, hour: number) => {
    const d = new Date('2026-11-24T00:00:00.000Z');
    d.setUTCDate(d.getUTCDate() - offset);
    d.setUTCHours(hour, 0, 0, 0);
    return d.toISOString();
  };
  return [
    {
      id: 'ue1',
      userId: 'buyer-ada',
      type: 'ai_suggestion',
      units: 2,
      estCostMinor: 400,
      createdAt: day(0, 9),
    },
    {
      id: 'ue2',
      userId: 'buyer-ada',
      type: 'wa_service',
      units: 1,
      estCostMinor: 350,
      createdAt: day(0, 11),
    },
    {
      id: 'ue3',
      userId: 'buyer-chi',
      type: 'sms',
      units: 1,
      estCostMinor: 500,
      createdAt: day(1, 14),
    },
    {
      id: 'ue4',
      userId: 'buyer-chi',
      type: 'stt',
      units: 3,
      estCostMinor: 450,
      createdAt: day(1, 16),
    },
    {
      id: 'ue5',
      userId: 'vendor-nest',
      type: 'places',
      units: 2,
      estCostMinor: 200,
      createdAt: day(2, 10),
    },
    {
      id: 'ue6',
      userId: 'buyer-chi',
      type: 'ai_tokens',
      units: 20,
      estCostMinor: 1000,
      createdAt: day(2, 12),
    },
    {
      id: 'ue7',
      userId: 'buyer-ada',
      type: 'request',
      units: 1,
      estCostMinor: 0,
      createdAt: day(0, 8),
      requestId: 'req_demo',
    },
  ];
}

export function BillingAdminProvider({ children }: { children: ReactNode }) {
  const [plans, setPlans] = useState<AdminPlanRecord[]>(() =>
    listPlans(true).map(planFromCatalogue),
  );
  const [users, setUsers] = useState(seedUsers);
  const [events] = useState(seedEvents);
  const [unitCosts, setUnitCosts] = useState<UnitCostSettings>(DEFAULT_UNIT_COSTS);
  const [thresholds, setThresholds] = useState<CostAlertThresholds>({
    dailyCostMinor: 50_000,
    userCostMinor: 20_000,
  });
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);

  const publishPlan = useCallback((planId: string, draft: PlanDraftInput) => {
    try {
      setPlans((current) => {
        const target = current.find((plan) => plan.id === planId);
        if (!target) {
          throw new Error('Plan not found');
        }
        const { plan } = publishPlanVersion(target, draft);
        return current.map((item) => (item.id === planId ? plan : item));
      });
      return { ok: true as const };
    } catch (error) {
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : 'Could not publish plan',
      };
    }
  }, []);

  const rollbackPlan = useCallback((planId: string, version: number) => {
    try {
      setPlans((current) =>
        current.map((plan) =>
          plan.id === planId ? rollbackPlanVersion(plan, version) : plan,
        ),
      );
      return { ok: true as const };
    } catch (error) {
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : 'Could not roll back',
      };
    }
  }, []);

  const grantCredit = useCallback(
    (input: {
      userId: string;
      amountMinor: number;
      reason: string;
      actorRole: string;
    }) => {
      const reason = input.reason.trim();
      if (reason.length < 3) {
        return { ok: false as const, error: 'A reason is required.' };
      }
      if (!Number.isInteger(input.amountMinor) || input.amountMinor <= 0) {
        return { ok: false as const, error: 'Credit must be a positive Naira amount.' };
      }
      const user = users.find((item) => item.userId === input.userId);
      if (!user) {
        return { ok: false as const, error: 'User not found.' };
      }
      setUsers((current) =>
        current.map((item) =>
          item.userId === input.userId
            ? {
                ...item,
                walletBalanceMinor: item.walletBalanceMinor + input.amountMinor,
                bonusLeadAlerts:
                  item.audience === 'vendor'
                    ? item.bonusLeadAlerts + Math.floor(input.amountMinor / 10_000)
                    : item.bonusLeadAlerts,
              }
            : item,
        ),
      );
      setAuditLog((current) => [
        {
          id: `audit_${Date.now()}`,
          at: new Date().toISOString(),
          actorRole: input.actorRole,
          action: 'grant_credit',
          reason,
          meta: { userId: input.userId, amountMinor: input.amountMinor },
        },
        ...current,
      ]);
      return { ok: true as const };
    },
    [users],
  );

  const value = useMemo(
    () => ({
      plans,
      users,
      events,
      unitCosts,
      thresholds,
      auditLog,
      publishPlan,
      rollbackPlan,
      grantCredit,
      setUnitCosts,
      setThresholds,
    }),
    [
      plans,
      users,
      events,
      unitCosts,
      thresholds,
      auditLog,
      publishPlan,
      rollbackPlan,
      grantCredit,
    ],
  );

  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>;
}

export function useBillingAdmin(): BillingAdminStore {
  const ctx = useContext(BillingContext);
  if (!ctx) {
    throw new Error('useBillingAdmin must be used within BillingAdminProvider');
  }
  return ctx;
}

export function findPlanLabel(plans: AdminPlanRecord[], planId: string): string {
  const plan = plans.find((item) => item.id === planId);
  if (!plan) {
    return planId;
  }
  const live = getLiveVersion(plan);
  return `${plan.name} v${live.version}`;
}

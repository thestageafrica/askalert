import {
  DEFAULT_ESCROW_ROUTER_CONFIG,
  adminLedgerHoldWarning,
  type EscrowRouterConfig,
} from '@askalert/payments';

export type PaymentsAdminState = {
  router: EscrowRouterConfig;
  flutterwaveHoldConfirmed: boolean;
  legalOpinionOnFile: boolean;
  strategyEnabled: boolean;
  sandbox: boolean;
};

const STORAGE_KEY = 'askalert.admin.payments.v1';

export function defaultPaymentsAdminState(): PaymentsAdminState {
  return {
    router: structuredClone(DEFAULT_ESCROW_ROUTER_CONFIG),
    flutterwaveHoldConfirmed: false,
    legalOpinionOnFile: false,
    strategyEnabled: false,
    sandbox: true,
  };
}

export function loadPaymentsAdminState(): PaymentsAdminState {
  if (typeof window === 'undefined') {
    return defaultPaymentsAdminState();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultPaymentsAdminState();
    }
    return { ...defaultPaymentsAdminState(), ...(JSON.parse(raw) as PaymentsAdminState) };
  } catch {
    return defaultPaymentsAdminState();
  }
}

export function savePaymentsAdminState(state: PaymentsAdminState): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export { adminLedgerHoldWarning };

import {
  loadEscrowRuntimeConfig,
  type EscrowRuntimeConfig,
} from './config';
import { MockEscrowProvider } from './mock-provider';
import { PartnerEscrowProvider } from './partner-provider';
import type { EscrowProvider } from './provider';

export type ResolveEscrowProviderOptions = {
  config?: EscrowRuntimeConfig;
  mock?: MockEscrowProvider;
};

/** Pick the active escrow adapter from runtime config (defaults to mock sandbox). */
export function resolveEscrowProvider(
  options: ResolveEscrowProviderOptions = {},
): EscrowProvider {
  const config = options.config ?? loadEscrowRuntimeConfig();
  if (!config.escrowEnabled) {
    return options.mock ?? new MockEscrowProvider();
  }
  if (config.providerKey === 'partner') {
    return new PartnerEscrowProvider();
  }
  return options.mock ?? new MockEscrowProvider();
}

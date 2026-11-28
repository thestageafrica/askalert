import { z } from 'zod';
import {
  FLUTTERWAVE_ESCROW_CAPABILITIES_BASE,
  MOCK_ESCROW_CAPABILITIES,
  type EscrowCapabilities,
} from './capabilities';
import type { EscrowProvider } from './provider';
import { MockEscrowProvider } from './mock-provider';

export const escrowProviderModeSchema = z.enum(['sandbox', 'live']);
export type EscrowProviderMode = z.infer<typeof escrowProviderModeSchema>;

export const escrowProviderRegistrationSchema = z
  .object({
    key: z.string().min(1),
    enabled: z.boolean().default(false),
    mode: escrowProviderModeSchema.default('sandbox'),
    capabilities: z.custom<EscrowCapabilities>(),
    feeModelKey: z.string().default('default'),
    webhookPath: z.string().min(1),
    killSwitch: z.boolean().default(false),
    drainMode: z.boolean().default(false),
    strategy: z.enum(['mock', 'native', 'ledger_hold']).default('mock'),
  })
  .strict();

export type EscrowProviderRegistration = z.infer<typeof escrowProviderRegistrationSchema>;

export type EscrowRouterConfig = {
  defaultProviderKey: string;
  /** categorySlug → provider key */
  categoryOverrides: Record<string, string>;
  providers: EscrowProviderRegistration[];
};

export const DEFAULT_ESCROW_ROUTER_CONFIG: EscrowRouterConfig = {
  defaultProviderKey: 'mock',
  categoryOverrides: {},
  providers: [
    {
      key: 'mock',
      enabled: true,
      mode: 'sandbox',
      capabilities: MOCK_ESCROW_CAPABILITIES,
      feeModelKey: 'default',
      webhookPath: '/mock-escrow',
      killSwitch: false,
      drainMode: false,
      strategy: 'mock',
    },
    {
      key: 'flutterwave',
      enabled: false,
      mode: 'sandbox',
      capabilities: FLUTTERWAVE_ESCROW_CAPABILITIES_BASE,
      feeModelKey: 'flutterwave',
      webhookPath: '/flutterwave',
      killSwitch: false,
      drainMode: false,
      strategy: 'ledger_hold',
    },
  ],
};

export type EscrowProviderFactory = (registration: EscrowProviderRegistration) => EscrowProvider;

/**
 * In-memory provider registry with kill switch + drain mode.
 * In-flight escrows stay pinned to the provider_key stored on the record.
 */
export class EscrowProviderRegistry {
  private config: EscrowRouterConfig;
  private readonly factories: Map<string, EscrowProviderFactory>;
  private readonly instances = new Map<string, EscrowProvider>();

  constructor(
    config: EscrowRouterConfig = DEFAULT_ESCROW_ROUTER_CONFIG,
    factories?: Record<string, EscrowProviderFactory>,
  ) {
    this.config = structuredClone(config);
    this.factories = new Map(
      Object.entries(
        factories ?? {
          mock: () => new MockEscrowProvider({ delayMs: 0 }),
        },
      ),
    );
  }

  getConfig(): EscrowRouterConfig {
    return structuredClone(this.config);
  }

  updateConfig(patch: Partial<EscrowRouterConfig>): EscrowRouterConfig {
    this.config = {
      ...this.config,
      ...patch,
      categoryOverrides: {
        ...this.config.categoryOverrides,
        ...patch.categoryOverrides,
      },
      providers: patch.providers ?? this.config.providers,
    };
    this.instances.clear();
    return this.getConfig();
  }

  listProviders(): EscrowProviderRegistration[] {
    return this.getConfig().providers;
  }

  getRegistration(key: string): EscrowProviderRegistration | undefined {
    return this.config.providers.find((item) => item.key === key);
  }

  resolveProviderKey(categorySlug?: string | null): string {
    if (categorySlug && this.config.categoryOverrides[categorySlug]) {
      return this.config.categoryOverrides[categorySlug]!;
    }
    return this.config.defaultProviderKey;
  }

  /**
   * Resolve adapter for *new* escrows. Honours kill switch / drain / enabled flags.
   * For existing escrows, use getPinnedProvider(providerKey) instead.
   */
  resolveForNewEscrow(categorySlug?: string | null): EscrowProvider {
    const key = this.resolveProviderKey(categorySlug);
    const registration = this.getRegistration(key);
    if (!registration) {
      throw new Error(`Unknown escrow provider: ${key}`);
    }
    if (!registration.enabled) {
      throw new Error(`Escrow provider '${key}' is disabled.`);
    }
    if (registration.killSwitch) {
      throw new Error(`Escrow provider '${key}' kill switch is on — not creating new escrows.`);
    }
    if (registration.drainMode) {
      throw new Error(`Escrow provider '${key}' is in drain mode — finishing existing escrows only.`);
    }
    return this.getPinnedProvider(key);
  }

  /** Always returns the adapter for an in-flight escrow's stored provider_key. */
  getPinnedProvider(providerKey: string): EscrowProvider {
    const registration = this.getRegistration(providerKey);
    if (!registration) {
      throw new Error(`Unknown escrow provider: ${providerKey}`);
    }
    const cached = this.instances.get(providerKey);
    if (cached) {
      return cached;
    }
    const factory = this.factories.get(providerKey);
    if (!factory) {
      throw new Error(`No factory registered for escrow provider '${providerKey}'.`);
    }
    const instance = factory(registration);
    this.instances.set(providerKey, instance);
    return instance;
  }

  registerFactory(key: string, factory: EscrowProviderFactory): void {
    this.factories.set(key, factory);
    this.instances.delete(key);
  }
}

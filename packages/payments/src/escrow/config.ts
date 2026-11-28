import { z } from 'zod';

export const partnerFeeModelSchema = z
  .object({
    /** Flat fee charged by the licensed partner, in minor units (kobo). */
    flatFeeMinor: z.number().int().nonnegative().default(0),
    /** Percentage of the booking total taken as the partner processing fee. */
    percentFee: z.number().min(0).max(100).default(0),
    feeBearer: z.enum(['vendor', 'platform', 'buyer']).default('vendor'),
  })
  .strict();
export type PartnerFeeModel = z.infer<typeof partnerFeeModelSchema>;

export const escrowPartnerDetailsSchema = z
  .object({
    legalName: z.string().default(''),
    licenceNumber: z.string().default(''),
    licenceIssuer: z.string().default(''),
    institutionName: z.string().default(''),
  })
  .strict();
export type EscrowPartnerDetails = z.infer<typeof escrowPartnerDetailsSchema>;

export const escrowRuntimeConfigSchema = z
  .object({
    /** Master switch. Off by default in production. */
    escrowEnabled: z.boolean().default(false),
    /** Sandbox mode shows SANDBOX banners and uses MockEscrowProvider by default. */
    sandbox: z.boolean().default(true),
    providerKey: z.enum(['mock', 'partner']).default('mock'),
    partner: escrowPartnerDetailsSchema.default({}),
    feeModel: partnerFeeModelSchema.default({}),
    askAlertCommissionPct: z.number().min(0).max(100).default(12),
  })
  .strict();
export type EscrowRuntimeConfig = z.infer<typeof escrowRuntimeConfigSchema>;

function truthy(value: string | undefined): boolean {
  if (!value) {
    return false;
  }
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

function readEnv(name: string): string | undefined {
  if (typeof process === 'undefined' || !process.env) {
    return undefined;
  }
  const value = process.env[name];
  return value && value.trim() !== '' ? value.trim() : undefined;
}

/** Load escrow runtime config from environment (safe defaults: disabled + sandbox). */
export function loadEscrowRuntimeConfig(
  overrides: Partial<EscrowRuntimeConfig> = {},
): EscrowRuntimeConfig {
  const fromEnv: Partial<EscrowRuntimeConfig> = {
    escrowEnabled: truthy(readEnv('ESCROW_ENABLED') ?? readEnv('NEXT_PUBLIC_ESCROW_ENABLED')),
    sandbox: !truthy(readEnv('ESCROW_LIVE')),
    providerKey: readEnv('ESCROW_PROVIDER') === 'partner' ? 'partner' : 'mock',
    partner: {
      legalName: readEnv('ESCROW_PARTNER_LEGAL_NAME') ?? '',
      licenceNumber: readEnv('ESCROW_PARTNER_LICENCE_NUMBER') ?? '',
      licenceIssuer: readEnv('ESCROW_PARTNER_LICENCE_ISSUER') ?? '',
      institutionName: readEnv('ESCROW_PARTNER_INSTITUTION_NAME') ?? '',
    },
    feeModel: {
      flatFeeMinor: Number(readEnv('ESCROW_PARTNER_FLAT_FEE_KOBO') ?? 0) || 0,
      percentFee: Number(readEnv('ESCROW_PARTNER_FEE_PERCENT') ?? 0) || 0,
      feeBearer:
        (readEnv('ESCROW_PARTNER_FEE_BEARER') as PartnerFeeModel['feeBearer'] | undefined) ??
        'vendor',
    },
    askAlertCommissionPct: Number(readEnv('ASKALERT_COMMISSION_PCT') ?? 12) || 12,
  };

  return escrowRuntimeConfigSchema.parse({
    ...fromEnv,
    ...overrides,
    partner: {
      ...fromEnv.partner,
      ...overrides.partner,
    },
    feeModel: {
      ...fromEnv.feeModel,
      ...overrides.feeModel,
    },
  });
}

export function partnerDetailsComplete(partner: EscrowPartnerDetails): boolean {
  return Boolean(
    partner.legalName.trim() &&
      partner.licenceNumber.trim() &&
      partner.licenceIssuer.trim() &&
      partner.institutionName.trim(),
  );
}

/**
 * User-facing hold/protect wording is only allowed when escrow is enabled
 * in a non-sandbox (live) environment AND partner legal details are set.
 */
export function canUseEscrowWording(config: EscrowRuntimeConfig): boolean {
  return config.escrowEnabled && !config.sandbox && partnerDetailsComplete(config.partner);
}

export const COMING_SOON_COPY = 'Protected payments are coming soon';
export const SANDBOX_BANNER = 'SANDBOX';

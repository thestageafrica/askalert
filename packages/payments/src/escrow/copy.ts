import {
  COMING_SOON_COPY,
  SANDBOX_BANNER,
  canUseEscrowWording,
  partnerDetailsComplete,
  type EscrowRuntimeConfig,
} from './config';

export type CheckoutEscrowPresentation = {
  mode: 'coming_soon' | 'sandbox' | 'live';
  title: string;
  body: string;
  banner: string | null;
  acceptPayment: boolean;
  partnerLine: string | null;
};

/** Plain-language checkout presentation driven by the escrow feature flag. */
export function presentCheckoutEscrow(config: EscrowRuntimeConfig): CheckoutEscrowPresentation {
  if (!config.escrowEnabled) {
    return {
      mode: 'coming_soon',
      title: COMING_SOON_COPY,
      body: 'You can still choose a vendor. Staged payment options will unlock once a licensed partner is live.',
      banner: null,
      acceptPayment: false,
      partnerLine: null,
    };
  }

  if (config.sandbox) {
    return {
      mode: 'sandbox',
      title: 'Sandbox checkout',
      body: 'This is a test flow. No real money moves. The mock partner simulates funding and releases.',
      banner: SANDBOX_BANNER,
      acceptPayment: true,
      partnerLine: partnerDetailsComplete(config.partner)
        ? `Partner (test): ${config.partner.legalName}`
        : 'Partner details not set — sandbox mock only.',
    };
  }

  if (!canUseEscrowWording(config)) {
    return {
      mode: 'coming_soon',
      title: COMING_SOON_COPY,
      body: 'Protected payment wording stays off until partner licence details are configured.',
      banner: null,
      acceptPayment: false,
      partnerLine: null,
    };
  }

  return {
    mode: 'live',
    title: `Payments via ${config.partner.legalName}`,
    body: `Funds are handled by ${config.partner.institutionName} under licence ${config.partner.licenceNumber} (${config.partner.licenceIssuer}). AskAlert does not keep customer funds.`,
    banner: null,
    acceptPayment: true,
    partnerLine: `${config.partner.legalName} · ${config.partner.institutionName}`,
  };
}

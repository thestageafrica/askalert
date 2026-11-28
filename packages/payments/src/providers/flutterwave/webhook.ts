import { timingSafeEqual } from 'node:crypto';

/**
 * Verify Flutterwave webhook using the dashboard secret hash.
 * Docs: compare the `verif-hash` header to FLW_SECRET_HASH.
 */
export function verifyFlutterwaveVerifHash(
  secretHash: string,
  verifHashHeader: string | null | undefined,
): boolean {
  if (!secretHash || !verifHashHeader) {
    return false;
  }
  const left = Buffer.from(verifHashHeader);
  const right = Buffer.from(secretHash);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

export function isFlutterwaveNoiseEvent(eventName: string | undefined): boolean {
  if (!eventName) {
    return true;
  }
  // Keep charge.completed and transfer.* for payouts; drop the rest as noise for now.
  return !(
    eventName === 'charge.completed' ||
    eventName.startsWith('transfer.') ||
    eventName.startsWith('refund.')
  );
}

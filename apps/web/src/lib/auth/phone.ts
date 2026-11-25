import { parsePhoneNumberFromString } from 'libphonenumber-js';

export const PHONE_TAKEN_MESSAGE =
  'That WhatsApp number is already used on another AskAlert account. Use a different number, or sign in to the account that owns it.';

/** Validate and normalise a Nigerian (or international) phone to E.164. */
export function toE164Phone(raw: string, defaultCountry: 'NG' = 'NG'): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = parsePhoneNumberFromString(trimmed, defaultCountry);
  if (!parsed || !parsed.isValid()) {
    return null;
  }
  return parsed.format('E.164');
}

export function phoneHintError(raw: string): string | null {
  if (!raw.trim()) {
    return 'Add your WhatsApp number.';
  }
  if (!toE164Phone(raw)) {
    return 'Enter a valid Nigerian number, like 0803 123 4567.';
  }
  return null;
}

/** Map Postgres unique-violation text to a clear product message. */
export function phoneUniqueErrorMessage(raw: string | null | undefined): string | null {
  if (!raw) {
    return null;
  }
  const lower = raw.toLowerCase();
  if (
    lower.includes('profiles_phone_e164_unique') ||
    (lower.includes('phone_e164') && lower.includes('duplicate')) ||
    (lower.includes('unique constraint') && lower.includes('phone'))
  ) {
    return PHONE_TAKEN_MESSAGE;
  }
  return null;
}

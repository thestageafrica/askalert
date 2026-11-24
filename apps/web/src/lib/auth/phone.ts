import { parsePhoneNumberFromString } from 'libphonenumber-js';

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

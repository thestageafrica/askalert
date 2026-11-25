import { describe, expect, it } from 'vitest';
import {
  PHONE_TAKEN_MESSAGE,
  phoneHintError,
  phoneUniqueErrorMessage,
  toE164Phone,
} from './phone';

describe('phone E.164', () => {
  it('normalises Nigerian mobiles', () => {
    expect(toE164Phone('08031234567')).toBe('+2348031234567');
    expect(toE164Phone('+234 803 123 4567')).toBe('+2348031234567');
  });

  it('rejects invalid numbers', () => {
    expect(toE164Phone('123')).toBeNull();
    expect(phoneHintError('123')).toMatch(/valid Nigerian/i);
  });

  it('maps unique-constraint errors to a clear message', () => {
    expect(phoneUniqueErrorMessage('duplicate key value violates unique constraint "profiles_phone_e164_unique"')).toBe(
      PHONE_TAKEN_MESSAGE,
    );
    expect(phoneUniqueErrorMessage('something else')).toBeNull();
  });
});

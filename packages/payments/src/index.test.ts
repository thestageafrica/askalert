import { describe, expect, it } from 'vitest';
import {
  createMoney,
  formatNaira,
  formatNairaInput,
  koboToNairaMajor,
  nairaToKobo,
  parseNairaInput,
} from './index';

describe('@askalert/payments', () => {
  it('formats naira from kobo integers', () => {
    const formatted = formatNaira(createMoney(150050));
    expect(formatted).toMatch(/1,500\.50/);
  });

  it('converts whole naira to and from kobo', () => {
    expect(nairaToKobo(3_000)).toBe(300_000);
    expect(koboToNairaMajor(300_000)).toBe(3_000);
  });

  it('parses naira form input into kobo', () => {
    expect(parseNairaInput('3,000')).toBe(300_000);
    expect(parseNairaInput('3.50')).toBe(350);
    expect(parseNairaInput('')).toBeNull();
    expect(parseNairaInput('3.505')).toBeNull();
  });

  it('formats kobo for naira form fields', () => {
    expect(formatNairaInput(300_000)).toBe('3000');
    expect(formatNairaInput(350)).toBe('3.50');
  });
});

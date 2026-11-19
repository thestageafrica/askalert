import { describe, expect, it } from 'vitest';
import { createMoney, formatNaira } from './index';

describe('@askalert/payments', () => {
  it('formats naira from kobo integers', () => {
    const formatted = formatNaira(createMoney(150050));
    expect(formatted).toMatch(/1,500\.50/);
  });
});

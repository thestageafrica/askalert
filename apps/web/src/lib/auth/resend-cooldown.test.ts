import { describe, expect, it } from 'vitest';
import { formatCooldown } from './resend-cooldown';

describe('formatCooldown', () => {
  it('formats seconds under a minute', () => {
    expect(formatCooldown(4500)).toBe('5s');
  });

  it('formats minutes and seconds', () => {
    expect(formatCooldown(65_000)).toBe('1:05');
  });
});

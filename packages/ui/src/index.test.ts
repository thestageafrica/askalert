import { describe, expect, it } from 'vitest';
import { cn } from './lib/cn';
import { Button } from './button';

describe('@askalert/ui', () => {
  it('exports Button and joins class names', () => {
    expect(typeof Button).toBe('function');
    expect(cn('a', false, 'b')).toBe('a b');
  });
});

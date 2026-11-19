import { describe, expect, it } from 'vitest';
import { Button } from './button';

describe('@askalert/ui', () => {
  it('exports a Button component', () => {
    expect(typeof Button).toBe('function');
  });
});

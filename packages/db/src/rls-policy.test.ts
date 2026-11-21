import { describe, expect, it } from 'vitest';
import {
  auditActionForOp,
  canPublicReadAttributes,
  canPublicReadCategory,
  canPublicReadVendorRequirements,
  canPublicReadVersion,
  canServiceRoleWrite,
} from './rls-policy';

describe('RLS public read rules', () => {
  it('allows Live and Pilot categories', () => {
    expect(canPublicReadCategory({ status: 'live' })).toBe(true);
    expect(canPublicReadCategory({ status: 'pilot' })).toBe(true);
    expect(canPublicReadCategory({ status: 'draft' })).toBe(false);
    expect(canPublicReadCategory({ status: 'paused' })).toBe(false);
  });

  it('allows published current version of a Live or Pilot category', () => {
    expect(
      canPublicReadVersion({
        published: true,
        categoryStatus: 'live',
        isCurrentVersion: true,
      }),
    ).toBe(true);

    expect(
      canPublicReadVersion({
        published: true,
        categoryStatus: 'pilot',
        isCurrentVersion: true,
      }),
    ).toBe(true);

    expect(
      canPublicReadVersion({
        published: false,
        categoryStatus: 'live',
        isCurrentVersion: true,
      }),
    ).toBe(false);

    expect(
      canPublicReadVersion({
        published: true,
        categoryStatus: 'live',
        isCurrentVersion: false,
      }),
    ).toBe(false);
  });

  it('mirrors version rules for attributes and vendor requirements', () => {
    const ok = {
      published: true,
      categoryStatus: 'live',
      isCurrentVersion: true,
    };
    expect(canPublicReadAttributes(ok)).toBe(true);
    expect(canPublicReadVendorRequirements(ok)).toBe(true);
  });

  it('restricts writes to service_role', () => {
    expect(canServiceRoleWrite('service_role')).toBe(true);
    expect(canServiceRoleWrite('anon')).toBe(false);
    expect(canServiceRoleWrite('authenticated')).toBe(false);
  });

  it('maps audit actions', () => {
    expect(auditActionForOp('INSERT')).toBe('insert');
    expect(auditActionForOp('UPDATE')).toBe('update');
    expect(auditActionForOp('DELETE')).toBe('delete');
  });
});

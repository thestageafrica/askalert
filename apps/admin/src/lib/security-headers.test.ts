import { describe, expect, it } from 'vitest';
import { buildContentSecurityPolicy, securityHeaders } from './security-headers';

describe('admin security headers', () => {
  it('includes core browser hardening headers', () => {
    const keys = securityHeaders.map((header) => header.key);
    expect(keys).toEqual(
      expect.arrayContaining([
        'Content-Security-Policy',
        'X-Content-Type-Options',
        'Referrer-Policy',
        'X-Frame-Options',
        'Permissions-Policy',
      ]),
    );
  });

  it('builds a CSP that blocks framing and allows Supabase HTTPS', () => {
    const csp = buildContentSecurityPolicy();
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("connect-src 'self' https:");
  });
});

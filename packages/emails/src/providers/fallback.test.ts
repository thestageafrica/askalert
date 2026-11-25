import { describe, expect, it, vi } from 'vitest';
import { FallbackEmailProvider } from './fallback';
import type { EmailProvider, EmailSendResult } from '../types';

function mockProvider(name: string, result: EmailSendResult): EmailProvider {
  return {
    name,
    send: vi.fn(async () => result),
  };
}

describe('FallbackEmailProvider', () => {
  const input = {
    to: 'buyer@example.com',
    subject: 'Test',
    html: '<p>Hi</p>',
    text: 'Hi',
    idempotencyKey: 'signup:hash',
  };

  it('returns the first successful provider', async () => {
    const primary = mockProvider('resend', {
      ok: false,
      provider: 'resend',
      errorCode: 'resend_http_500',
    });
    const secondary = mockProvider('brevo', {
      ok: true,
      provider: 'brevo',
      providerId: 'brevo_1',
    });
    const attempts: Array<{ provider: string; ok: boolean; errorCode?: string }> = [];
    const fallback = new FallbackEmailProvider([primary, secondary], (info) => attempts.push(info));

    const result = await fallback.send(input);
    expect(result).toEqual({ ok: true, provider: 'brevo', providerId: 'brevo_1' });
    expect(attempts).toEqual([
      { provider: 'resend', ok: false, errorCode: 'resend_http_500' },
      { provider: 'brevo', ok: true, errorCode: undefined },
    ]);
  });

  it('surfaces the last error when all providers fail', async () => {
    const fallback = new FallbackEmailProvider([
      mockProvider('resend', { ok: false, provider: 'resend', errorCode: 'resend_timeout' }),
      mockProvider('brevo', { ok: false, provider: 'brevo', errorCode: 'brevo_http_429' }),
    ]);

    await expect(fallback.send(input)).resolves.toEqual({
      ok: false,
      provider: 'brevo',
      errorCode: 'brevo_http_429',
    });
  });
});

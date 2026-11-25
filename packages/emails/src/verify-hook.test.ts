import { Webhook } from 'standardwebhooks';
import { describe, expect, it } from 'vitest';
import { normalizeHookSecret, verifySendEmailHook } from './verify-hook';

describe('normalizeHookSecret', () => {
  it('strips Supabase / Standard Webhooks prefixes and quotes', () => {
    expect(normalizeHookSecret('v1,whsec_abc123')).toBe('abc123');
    expect(normalizeHookSecret('whsec_abc123')).toBe('abc123');
    expect(normalizeHookSecret('v1,abc123')).toBe('abc123');
    expect(normalizeHookSecret('"v1,whsec_abc123"')).toBe('abc123');
    expect(normalizeHookSecret('plain')).toBe('plain');
  });
});

describe('verifySendEmailHook', () => {
  const secretBytes = Buffer.from('super-secret-hook-key-32bytes!!');
  const secretBase64 = secretBytes.toString('base64');
  const fullSecret = `v1,whsec_${secretBase64}`;

  const payload = {
    user: {
      id: '8484b834-f29e-4af2-bf42-80644d154f76',
      email: 'valid.email@example.com',
    },
    email_data: {
      token: '305805',
      token_hash: '7d5b7b1964cf5d388340a7f04f1dbb5eeb6c7b52ef8270e1737a58d0',
      redirect_to: 'https://www.askalert.com/auth/callback/',
      email_action_type: 'signup',
      site_url: 'https://www.askalert.com',
      token_new: '',
      token_hash_new: '',
    },
  };

  it('accepts a valid standard webhooks signature', () => {
    const rawBody = JSON.stringify(payload);
    const id = 'msg_test_1';
    const timestamp = new Date();
    const wh = new Webhook(secretBase64);
    const signature = wh.sign(id, timestamp, rawBody);

    const result = verifySendEmailHook({
      secret: fullSecret,
      rawBody,
      headers: {
        'webhook-id': id,
        'webhook-timestamp': Math.floor(timestamp.getTime() / 1000).toString(),
        'webhook-signature': signature,
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.email_data.email_action_type).toBe('signup');
    }
  });

  it('rejects a bad signature without leaking payload details', () => {
    const result = verifySendEmailHook({
      secret: fullSecret,
      rawBody: JSON.stringify(payload),
      headers: {
        'webhook-id': 'msg_bad',
        'webhook-timestamp': Math.floor(Date.now() / 1000).toString(),
        'webhook-signature': 'v1,not-a-real-signature',
      },
    });

    expect(result).toEqual({ ok: false, errorCode: 'invalid_hook_signature' });
  });

  it('rejects missing secret', () => {
    expect(
      verifySendEmailHook({
        secret: '',
        rawBody: '{}',
        headers: {},
      }),
    ).toEqual({ ok: false, errorCode: 'missing_hook_secret' });
  });
});

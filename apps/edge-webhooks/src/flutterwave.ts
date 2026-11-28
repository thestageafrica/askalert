import { forwardToSupabase } from './forward';
import { logInfo } from './log';

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export function verifyFlutterwaveSignature(
  secretHash: string,
  verifHashHeader: string | null,
): boolean {
  if (!secretHash || !verifHashHeader) {
    return false;
  }
  return safeEqual(secretHash, verifHashHeader);
}

export function isNoiseFlutterwaveEvent(eventName: string | undefined): boolean {
  if (!eventName) {
    return true;
  }
  return !(
    eventName === 'charge.completed' ||
    eventName.startsWith('transfer.') ||
    eventName.startsWith('refund.')
  );
}

export async function handleFlutterwavePost(options: {
  rawBody: string;
  verifHashHeader: string | null;
  flutterwaveSecretHash: string;
  sharedSecret: string;
  supabaseFunctionUrl: string;
  fetchImpl?: typeof fetch;
}): Promise<Response> {
  const valid = verifyFlutterwaveSignature(
    options.flutterwaveSecretHash,
    options.verifHashHeader,
  );
  if (!valid) {
    logInfo('flutterwave_reject', { code: 'invalid_signature' });
    return new Response('Unauthorized', { status: 401 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(options.rawBody) as unknown;
  } catch {
    logInfo('flutterwave_reject', { code: 'invalid_json' });
    return new Response('Bad Request', { status: 400 });
  }

  const event =
    typeof parsed === 'object' &&
    parsed !== null &&
    'event' in parsed &&
    typeof (parsed as { event?: unknown }).event === 'string'
      ? (parsed as { event: string }).event
      : 'unknown';

  if (isNoiseFlutterwaveEvent(event)) {
    logInfo('flutterwave_noise', { event });
    return new Response(JSON.stringify({ ok: true, dropped: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  logInfo('flutterwave_accepted', { event });

  const forward = await forwardToSupabase({
    url: options.supabaseFunctionUrl,
    sharedSecret: options.sharedSecret,
    source: 'flutterwave',
    body: {
      source: 'flutterwave',
      provider_key: 'flutterwave',
      event,
      payload: parsed,
    },
    fetchImpl: options.fetchImpl,
  });

  return new Response(JSON.stringify({ ok: true, upstreamOk: forward.ok }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

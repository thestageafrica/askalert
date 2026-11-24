import { hmacHex, timingSafeEqualHex } from './crypto';
import { forwardToSupabase } from './forward';
import { logInfo } from './log';

export async function verifyPaystackSignature(
  secret: string,
  rawBody: string,
  signatureHeader: string | null,
): Promise<boolean> {
  if (!signatureHeader) {
    return false;
  }
  const expected = (await hmacHex('SHA-512', secret, rawBody)).toLowerCase();
  const provided = signatureHeader.toLowerCase();
  return timingSafeEqualHex(provided, expected);
}

export async function handlePaystackPost(options: {
  rawBody: string;
  signatureHeader: string | null;
  paystackSecret: string;
  sharedSecret: string;
  supabaseFunctionUrl: string;
  fetchImpl?: typeof fetch;
}): Promise<Response> {
  const valid = await verifyPaystackSignature(
    options.paystackSecret,
    options.rawBody,
    options.signatureHeader,
  );
  if (!valid) {
    logInfo('paystack_reject', { code: 'invalid_signature' });
    return new Response('Unauthorized', { status: 401 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(options.rawBody) as unknown;
  } catch {
    logInfo('paystack_reject', { code: 'invalid_json' });
    return new Response('Bad Request', { status: 400 });
  }

  const event =
    typeof parsed === 'object' &&
    parsed !== null &&
    'event' in parsed &&
    typeof (parsed as { event?: unknown }).event === 'string'
      ? (parsed as { event: string }).event
      : 'unknown';

  logInfo('paystack_accepted', { event });

  const forward = await forwardToSupabase({
    url: options.supabaseFunctionUrl,
    sharedSecret: options.sharedSecret,
    source: 'paystack',
    body: {
      source: 'paystack',
      event,
      payload: parsed,
    },
    fetchImpl: options.fetchImpl,
  });

  return new Response(
    JSON.stringify({ ok: true, upstreamOk: forward.ok }),
    {
      status: 200,
      headers: { 'content-type': 'application/json' },
    },
  );
}

import { logError, logInfo } from './log';

export type ForwardResult = {
  ok: boolean;
  status: number;
};

/**
 * Forward kept webhook events to the Supabase Edge Function quickly.
 * Does not include raw payload fields in logs.
 */
export async function forwardToSupabase(options: {
  url: string;
  sharedSecret: string;
  source: 'whatsapp' | 'paystack';
  body: unknown;
  fetchImpl?: typeof fetch;
}): Promise<ForwardResult> {
  const fetchImpl = options.fetchImpl ?? fetch;
  try {
    const response = await fetchImpl(options.url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-askalert-webhook-secret': options.sharedSecret,
        'x-askalert-webhook-source': options.source,
      },
      body: JSON.stringify(options.body),
    });
    logInfo('forwarded', {
      source: options.source,
      status: response.status,
      ok: response.ok,
    });
    return { ok: response.ok, status: response.status };
  } catch {
    logError('forward_failed', { source: options.source, code: 'network' });
    return { ok: false, status: 502 };
  }
}

import { DedupeStore, defaultDedupe } from './dedupe';
import type { EdgeWebhookEnv } from './env';
import { requireSecret } from './env';
import { logError } from './log';
import { handleFlutterwavePost } from './flutterwave';
import { handlePaystackPost } from './paystack';
import { handleWhatsAppPost, handleWhatsAppVerify } from './whatsapp';

export type { EdgeWebhookEnv };

export type WorkerDeps = {
  dedupe?: DedupeStore;
  fetchImpl?: typeof fetch;
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export async function handleRequest(
  request: Request,
  env: EdgeWebhookEnv,
  deps: WorkerDeps = {},
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const dedupe = deps.dedupe ?? defaultDedupe;

  if (request.method === 'GET' && (path === '/health' || path === '/')) {
    return json({
      ok: true,
      service: env.SERVICE_NAME ?? 'askalert-edge-webhooks',
    });
  }

  try {
    if (path === '/whatsapp' && request.method === 'GET') {
      const verifyToken = requireSecret(env.WHATSAPP_VERIFY_TOKEN, 'WHATSAPP_VERIFY_TOKEN');
      return handleWhatsAppVerify(url, verifyToken);
    }

    if (path === '/whatsapp' && request.method === 'POST') {
      const rawBody = await request.text();
      return handleWhatsAppPost({
        rawBody,
        signatureHeader: request.headers.get('x-hub-signature-256'),
        appSecret: requireSecret(env.WHATSAPP_APP_SECRET, 'WHATSAPP_APP_SECRET'),
        sharedSecret: requireSecret(env.WEBHOOK_SHARED_SECRET, 'WEBHOOK_SHARED_SECRET'),
        supabaseFunctionUrl: requireSecret(
          env.SUPABASE_FUNCTION_URL,
          'SUPABASE_FUNCTION_URL',
        ),
        dedupe,
        fetchImpl: deps.fetchImpl,
      });
    }

    if (path === '/paystack' && request.method === 'POST') {
      const rawBody = await request.text();
      return handlePaystackPost({
        rawBody,
        signatureHeader: request.headers.get('x-paystack-signature'),
        paystackSecret: requireSecret(env.PAYSTACK_SECRET, 'PAYSTACK_SECRET'),
        sharedSecret: requireSecret(env.WEBHOOK_SHARED_SECRET, 'WEBHOOK_SHARED_SECRET'),
        supabaseFunctionUrl: requireSecret(
          env.SUPABASE_FUNCTION_URL,
          'SUPABASE_FUNCTION_URL',
        ),
        fetchImpl: deps.fetchImpl,
      });
    }

    if (path === '/flutterwave' && request.method === 'POST') {
      const rawBody = await request.text();
      return handleFlutterwavePost({
        rawBody,
        verifHashHeader: request.headers.get('verif-hash'),
        flutterwaveSecretHash: requireSecret(env.FLW_SECRET_HASH, 'FLW_SECRET_HASH'),
        sharedSecret: requireSecret(env.WEBHOOK_SHARED_SECRET, 'WEBHOOK_SHARED_SECRET'),
        supabaseFunctionUrl: requireSecret(
          env.SUPABASE_FUNCTION_URL,
          'SUPABASE_FUNCTION_URL',
        ),
        fetchImpl: deps.fetchImpl,
      });
    }
  } catch (error) {
    const code = error instanceof Error ? error.message : 'handler_error';
    logError('request_failed', { code: code.slice(0, 80) });
    return new Response('Internal Server Error', { status: 500 });
  }

  return new Response('Not Found', { status: 404 });
}

export default {
  async fetch(request: Request, env: EdgeWebhookEnv): Promise<Response> {
    return handleRequest(request, env);
  },
};

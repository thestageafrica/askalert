/**
 * Deliver web push for an in-app notification id.
 *
 * Library choice: npm `web-push` (via esm.sh). It is the standard VAPID
 * implementation, Deno-compatible through ESM, and does not use Firebase.
 * Set secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT,
 * SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CRON_SHARED_SECRET (or Authorization).
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import webpush from 'https://esm.sh/web-push@3.6.7';

const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers':
    'authorization, x-client-info, apikey, content-type, x-askalert-cron-secret',
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'content-type': 'application/json' },
  });
}

function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

type Body = {
  notificationId?: string;
  userId?: string;
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }
  if (request.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405);
  }

  const cronSecret = Deno.env.get('CRON_SHARED_SECRET') ?? '';
  const provided =
    request.headers.get('x-askalert-cron-secret') ??
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
    '';
  if (!cronSecret || !provided || !timingSafeEqualString(provided, cronSecret)) {
    return json({ error: 'unauthorized' }, 401);
  }

  const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
  const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
  const vapidSubject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:ops@askalert.com';
  if (!vapidPublic || !vapidPrivate) {
    return json({ error: 'vapid_not_configured' }, 500);
  }

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!supabaseUrl || !serviceKey) {
    return json({ error: 'server_misconfigured' }, 500);
  }

  const client = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let notification: {
    id: string;
    user_id: string;
    title: string;
    body: string;
    url: string;
  } | null = null;

  if (body.notificationId) {
    const { data, error } = await client
      .from('notifications')
      .select('id, user_id, title, body, url')
      .eq('id', body.notificationId)
      .maybeSingle();
    if (error) {
      return json({ error: 'notification_lookup_failed' }, 500);
    }
    notification = data;
  }

  if (!notification) {
    return json({ error: 'notification_not_found' }, 404);
  }

  const { data: subs, error: subError } = await client
    .from('push_subscriptions')
    .select('id, endpoint, keys, failed_count')
    .eq('user_id', notification.user_id);

  if (subError) {
    return json({ error: 'subscription_lookup_failed' }, 500);
  }

  const payload = JSON.stringify({
    title: notification.title,
    body: notification.body,
    url: notification.url,
    notificationId: notification.id,
  });

  let sent = 0;
  let removed = 0;
  let failed = 0;

  for (const sub of subs ?? []) {
    const keys = sub.keys as { p256dh?: string; auth?: string };
    if (!keys?.p256dh || !keys?.auth) {
      failed += 1;
      continue;
    }
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: keys.p256dh, auth: keys.auth },
        },
        payload,
      );
      sent += 1;
      await client
        .from('push_subscriptions')
        .update({
          last_success_at: new Date().toISOString(),
          failed_count: 0,
        })
        .eq('id', sub.id);
    } catch (error) {
      const statusCode =
        typeof error === 'object' &&
        error &&
        'statusCode' in error &&
        typeof (error as { statusCode?: unknown }).statusCode === 'number'
          ? (error as { statusCode: number }).statusCode
          : undefined;
      if (statusCode === 404 || statusCode === 410) {
        await client.from('push_subscriptions').delete().eq('id', sub.id);
        removed += 1;
      } else {
        failed += 1;
        await client
          .from('push_subscriptions')
          .update({ failed_count: (sub.failed_count ?? 0) + 1 })
          .eq('id', sub.id);
      }
    }
  }

  return json({ ok: true, sent, removed, failed, subscriptionCount: subs?.length ?? 0 });
});

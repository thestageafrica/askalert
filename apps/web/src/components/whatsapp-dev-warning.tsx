import { isWhatsAppPlaceholder } from '../lib/site';

/** Visible banner when local/dev still uses the placeholder WhatsApp number. */
export function WhatsAppDevWarning() {
  if (process.env.NODE_ENV === 'production' || !isWhatsAppPlaceholder()) {
    return null;
  }

  return (
    <div
      role="status"
      className="border-b border-warning/40 bg-warning/15 px-4 py-3 text-center text-sm font-semibold text-foreground"
    >
      WhatsApp still uses the placeholder number. Set{' '}
      <code className="rounded bg-background/80 px-1.5 py-0.5 text-xs">NEXT_PUBLIC_WHATSAPP_NUMBER</code>{' '}
      to a real digits-only value before shipping.
    </div>
  );
}

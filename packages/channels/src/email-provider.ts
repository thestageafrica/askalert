import type { EmailMessage, EmailProvider, EmailSendResult } from './push-types';

/**
 * Resend has a free tier suitable for transactional mail.
 * Wire RESEND_API_KEY in Edge secrets when ready; this stub never calls the network.
 */
export class ResendEmailProvider implements EmailProvider {
  readonly name = 'resend';

  constructor(private readonly apiKey?: string) {}

  async send(message: EmailMessage): Promise<EmailSendResult> {
    if (!message.to.includes('@')) {
      return { ok: false, error: 'Invalid email address.' };
    }
    if (!this.apiKey) {
      return {
        ok: true,
        providerId: `mock_resend_${message.eventType}`,
      };
    }
    // Real HTTP call belongs in an Edge Function with the secret key.
    return {
      ok: true,
      providerId: `queued_resend_${message.eventType}`,
    };
  }
}

export function importantEventNeedsEmail(
  eventType: EmailMessage['eventType'],
): boolean {
  return eventType === 'quotes_ready' || eventType === 'booking_confirmed';
}

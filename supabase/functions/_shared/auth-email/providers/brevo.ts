import type { EmailProvider, EmailSendInput, EmailSendResult } from '../types.ts';

/** Brevo Transactional HTTP API — not SMTP. */
const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

export class BrevoEmailProvider implements EmailProvider {
  readonly name = 'brevo';

  constructor(
    private readonly apiKey: string,
    private readonly fromEmail: string,
    private readonly fromName = 'AskAlert',
    private readonly timeoutMs = 4000,
  ) {}

  async send(input: EmailSendInput): Promise<EmailSendResult> {
    if (!this.apiKey) {
      return { ok: false, errorCode: 'brevo_missing_api_key', provider: this.name };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(BREVO_ENDPOINT, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'api-key': this.apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          sender: { email: this.fromEmail, name: this.fromName },
          to: [{ email: input.to }],
          subject: input.subject,
          htmlContent: input.html,
          textContent: input.text,
          headers: {
            'X-AskAlert-Idempotency-Key': input.idempotencyKey.slice(0, 256),
          },
        }),
      });

      if (response.ok) {
        const body = (await response.json()) as { messageId?: string };
        return {
          ok: true,
          provider: this.name,
          providerId: body.messageId ?? 'brevo_ok',
        };
      }

      return {
        ok: false,
        provider: this.name,
        errorCode: `brevo_http_${response.status}`,
      };
    } catch (error) {
      const aborted = error instanceof Error && error.name === 'AbortError';
      return {
        ok: false,
        provider: this.name,
        errorCode: aborted ? 'brevo_timeout' : 'brevo_network_error',
      };
    } finally {
      clearTimeout(timer);
    }
  }
}

import type { EmailProvider, EmailSendInput, EmailSendResult } from '../types';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

export class ResendEmailProvider implements EmailProvider {
  readonly name = 'resend';

  constructor(
    private readonly apiKey: string,
    private readonly from: string,
    private readonly timeoutMs = 4000,
  ) {}

  async send(input: EmailSendInput): Promise<EmailSendResult> {
    if (!this.apiKey) {
      return { ok: false, errorCode: 'resend_missing_api_key', provider: this.name };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(RESEND_ENDPOINT, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': input.idempotencyKey.slice(0, 256),
        },
        body: JSON.stringify({
          from: this.from,
          to: [input.to],
          subject: input.subject,
          html: input.html,
          text: input.text,
        }),
      });

      if (response.ok) {
        const body = (await response.json()) as { id?: string };
        return {
          ok: true,
          provider: this.name,
          providerId: body.id ?? 'resend_ok',
        };
      }

      return {
        ok: false,
        provider: this.name,
        errorCode: `resend_http_${response.status}`,
      };
    } catch (error) {
      const aborted = error instanceof Error && error.name === 'AbortError';
      return {
        ok: false,
        provider: this.name,
        errorCode: aborted ? 'resend_timeout' : 'resend_network_error',
      };
    } finally {
      clearTimeout(timer);
    }
  }
}

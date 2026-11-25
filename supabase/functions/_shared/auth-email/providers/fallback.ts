import type { EmailProvider, EmailSendInput, EmailSendResult } from '../types.ts';

/**
 * Tries providers in order. Logs only counts/codes via the optional logger.
 */
export class FallbackEmailProvider implements EmailProvider {
  readonly name = 'fallback';

  constructor(
    private readonly providers: EmailProvider[],
    private readonly onAttempt?: (info: {
      provider: string;
      ok: boolean;
      errorCode?: string;
    }) => void,
  ) {}

  async send(input: EmailSendInput): Promise<EmailSendResult> {
    let last: EmailSendResult = {
      ok: false,
      provider: this.name,
      errorCode: 'no_providers',
    };

    for (const provider of this.providers) {
      const result = await provider.send(input);
      this.onAttempt?.({
        provider: provider.name,
        ok: result.ok,
        errorCode: result.ok ? undefined : result.errorCode,
      });
      if (result.ok) {
        return result;
      }
      last = result;
    }

    return last;
  }
}

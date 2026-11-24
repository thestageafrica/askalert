import type { ChannelAdapter, OutboundMessage, SendContext, SendResult } from './types';

/** In-app delivery — messages stay on the platform. */
export class AppAdapter implements ChannelAdapter {
  readonly name = 'app';
  readonly supportsRelay = true;

  async send(message: OutboundMessage, context: SendContext): Promise<SendResult> {
    if (context.channel !== 'app') {
      return {
        ok: false,
        channel: 'app',
        error: 'AppAdapter only sends on the app channel.',
      };
    }
    if (!message.body.trim() && !(message.media?.length)) {
      return { ok: false, channel: 'app', error: 'Empty message.' };
    }
    return {
      ok: true,
      channel: 'app',
      externalId: message.id,
    };
  }
}

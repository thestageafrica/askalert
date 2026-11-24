import type {
  ChannelAdapter,
  OutboundMessage,
  OutboxRow,
  SendContext,
  SendResult,
} from './types';

/**
 * WhatsApp stub: never calls Meta. Writes an outbox row for later delivery.
 */
export class WhatsAppAdapterStub implements ChannelAdapter {
  readonly name = 'whatsapp_stub';
  readonly supportsRelay = true;
  readonly outbox: OutboxRow[] = [];

  async send(message: OutboundMessage, context: SendContext): Promise<SendResult> {
    if (context.channel !== 'whatsapp') {
      return {
        ok: false,
        channel: 'whatsapp',
        error: 'WhatsAppAdapterStub only queues whatsapp channel messages.',
      };
    }
    const row: OutboxRow = {
      id: `outbox_${message.id}`,
      channel: 'whatsapp',
      threadId: message.threadId,
      messageId: message.id,
      payload: message,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    this.outbox.push(row);
    return {
      ok: true,
      channel: 'whatsapp',
      queued: true,
      externalId: row.id,
    };
  }
}

import { z } from 'zod';

export const senderRoleSchema = z.enum(['buyer', 'vendor', 'agent', 'system', 'admin']);
export type SenderRole = z.infer<typeof senderRoleSchema>;

export const messageChannelSchema = z.enum(['app', 'whatsapp', 'web_link']);
export type MessageChannel = z.infer<typeof messageChannelSchema>;

export const outboundMessageSchema = z.object({
  id: z.string().min(1),
  threadId: z.string().min(1),
  requestId: z.string().min(1).optional(),
  senderRole: senderRoleSchema,
  body: z.string(),
  media: z
    .array(
      z.object({
        kind: z.enum(['image']),
        mime: z.enum(['image/jpeg', 'image/png', 'image/webp']),
        url: z.string().min(1),
        bytes: z.number().int().positive(),
      }),
    )
    .max(5)
    .optional(),
  filtered: z.boolean().default(false),
});

export type OutboundMessage = z.infer<typeof outboundMessageSchema>;

export type SendContext = {
  userId: string;
  channel: MessageChannel;
  /** When true, message is a relayed agent/buyer↔vendor hop that spends entitlement. */
  relayed: boolean;
};

export type SendResult = {
  ok: boolean;
  channel: MessageChannel;
  externalId?: string;
  queued?: boolean;
  error?: string;
};

export type ChannelAdapter = {
  readonly name: string;
  supportsRelay: boolean;
  send: (message: OutboundMessage, context: SendContext) => Promise<SendResult>;
};

export type OutboxRow = {
  id: string;
  channel: MessageChannel;
  threadId: string;
  messageId: string;
  payload: OutboundMessage;
  createdAt: string;
  status: 'pending' | 'sent' | 'failed';
};

export type MaskResult = {
  text: string;
  masked: boolean;
  reasons: string[];
};

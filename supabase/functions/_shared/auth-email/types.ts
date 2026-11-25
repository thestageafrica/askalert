import { z } from 'zod';

export const emailActionTypeSchema = z.enum([
  'signup',
  'magiclink',
  'recovery',
  'invite',
  'email_change',
  'reauthentication',
]);

export type EmailActionType = z.infer<typeof emailActionTypeSchema>;

export const authEmailDataSchema = z.object({
  token: z.string().default(''),
  token_hash: z.string().default(''),
  redirect_to: z.string().default(''),
  email_action_type: emailActionTypeSchema,
  site_url: z.string().default(''),
  token_new: z.string().optional().default(''),
  token_hash_new: z.string().optional().default(''),
  old_email: z.string().optional().default(''),
});

export const authEmailHookPayloadSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    new_email: z.string().email().optional(),
  }),
  email_data: authEmailDataSchema,
});

export type AuthEmailHookPayload = z.infer<typeof authEmailHookPayloadSchema>;

export type RenderedEmail = {
  subject: string;
  html: string;
  text: string;
  action: EmailActionType;
  /** Stable key for provider idempotency — never log the raw token. */
  idempotencyKey: string;
  to: string;
};

export type EmailSendInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
};

export type EmailSendResult =
  | { ok: true; providerId: string; provider: string }
  | { ok: false; errorCode: string; provider: string };

export interface EmailProvider {
  readonly name: string;
  send(input: EmailSendInput): Promise<EmailSendResult>;
}

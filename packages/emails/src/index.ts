export {
  buildConfirmationUrl,
  mapActionToTemplate,
  resolveAuthRedirectTo,
} from './confirmation-url';
export { renderAuthEmailHtml, renderAuthEmailText } from './layout';
export { renderAuthEmails } from './render';
export { BrevoEmailProvider } from './providers/brevo';
export { FallbackEmailProvider } from './providers/fallback';
export { ResendEmailProvider } from './providers/resend';
export { normalizeHookSecret, verifySendEmailHook } from './verify-hook';
export type {
  AuthEmailHookPayload,
  EmailActionType,
  EmailProvider,
  EmailSendInput,
  EmailSendResult,
  RenderedEmail,
} from './types';
export { authEmailHookPayloadSchema, emailActionTypeSchema } from './types';

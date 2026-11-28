export const WHATSAPP_CAPTURE_LIMITS = {
  replyButtonsMax: 3,
  listRowsMax: 10,
  /** Reserve one list row for “More”. */
  listRowsPerPage: 9,
  buttonTitleMaxChars: 20,
  listRowTitleMaxChars: 24,
  bodyMaxChars: 1024,
} as const;

export type WhatsAppCaptureLimits = typeof WHATSAPP_CAPTURE_LIMITS;

export function truncateLabel(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }
  return `${trimmed.slice(0, Math.max(1, max - 1))}…`;
}

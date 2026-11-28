import {
  WHATSAPP_CAPTURE_LIMITS,
  truncateLabel,
  type WhatsAppCaptureLimits,
} from './whatsapp-limits';
import type { CaptureOutbound, WhatsAppButton, WhatsAppListRow } from './types';

export function buildTextMessage(
  body: string,
  channel: CaptureOutbound['channel'] = 'whatsapp',
  limits: WhatsAppCaptureLimits = WHATSAPP_CAPTURE_LIMITS,
): CaptureOutbound {
  return {
    channel,
    kind: 'text',
    body: body.slice(0, limits.bodyMaxChars),
  };
}

export function buildReplyButtons(
  body: string,
  buttons: WhatsAppButton[],
  channel: CaptureOutbound['channel'] = 'whatsapp',
  limits: WhatsAppCaptureLimits = WHATSAPP_CAPTURE_LIMITS,
): CaptureOutbound {
  const sliced = buttons.slice(0, limits.replyButtonsMax).map((button) => ({
    id: button.id,
    title: truncateLabel(button.title, limits.buttonTitleMaxChars),
  }));
  if (sliced.length === 0) {
    return buildTextMessage(body, channel, limits);
  }
  return {
    channel,
    kind: 'buttons',
    body: body.slice(0, limits.bodyMaxChars),
    buttons: sliced,
  };
}

export function buildListMessage(
  body: string,
  rows: WhatsAppListRow[],
  options?: {
    page?: number;
    buttonLabel?: string;
    channel?: CaptureOutbound['channel'];
    limits?: WhatsAppCaptureLimits;
  },
): CaptureOutbound {
  const limits = options?.limits ?? WHATSAPP_CAPTURE_LIMITS;
  const page = Math.max(0, options?.page ?? 0);
  const channel = options?.channel ?? 'whatsapp';
  const start = page * limits.listRowsPerPage;
  const pageRows = rows.slice(start, start + limits.listRowsPerPage).map((row) => ({
    id: row.id,
    title: truncateLabel(row.title, limits.listRowTitleMaxChars),
    description: row.description,
  }));
  const hasMore = start + limits.listRowsPerPage < rows.length;
  if (hasMore) {
    pageRows.push({
      id: `more:${page + 1}`,
      title: 'More',
      description: 'See more options',
    });
  }
  if (pageRows.length === 0) {
    return buildTextMessage(body, channel, limits);
  }
  return {
    channel,
    kind: 'list',
    body: body.slice(0, limits.bodyMaxChars),
    buttonLabel: truncateLabel(options?.buttonLabel ?? 'Choose', limits.buttonTitleMaxChars),
    rows: pageRows,
    page,
    hasMore,
  };
}

/** Optional WhatsApp Flows renderer — stub until Flows is enabled. */
export function buildFlowsStub(
  body: string,
  fields: string[],
  flowName = 'askalert_request_details',
  channel: CaptureOutbound['channel'] = 'whatsapp',
): CaptureOutbound {
  return {
    channel,
    kind: 'flows_stub',
    body,
    flowName,
    fields,
  };
}

export function toPlainTextFallback(message: CaptureOutbound): string {
  if (message.kind === 'text') {
    return message.body;
  }
  if (message.kind === 'buttons') {
    const options = message.buttons.map((button, index) => `${index + 1}. ${button.title}`).join('\n');
    return `${message.body}\n\n${options}`;
  }
  if (message.kind === 'list') {
    const options = message.rows.map((row, index) => `${index + 1}. ${row.title}`).join('\n');
    return `${message.body}\n\n${options}`;
  }
  return `${message.body}\n\n(Open the ${message.flowName} form for: ${message.fields.join(', ')})`;
}

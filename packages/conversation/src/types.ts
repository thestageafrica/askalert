import { z } from 'zod';

export const CAPTURE_STEPS = [
  'category',
  'type',
  'services',
  'details',
  'date',
  'location_state',
  'location_place',
  'budget',
  'mode',
  'confirm',
  'done',
  'cancelled',
] as const;

export type CaptureStep = (typeof CAPTURE_STEPS)[number];

export const involvementModeSchema = z.enum(['match', 'relay', 'assist', 'autopilot']);
export type InvolvementMode = z.infer<typeof involvementModeSchema>;

export type CaptureItem = {
  serviceSlug: string;
  quantity: number | null;
};

export type CatalogGapTerm = {
  id: string;
  term: string;
  createdAt: string;
};

export type CaptureDraft = {
  categorySlug: string | null;
  typeSlug: string | null;
  items: CaptureItem[];
  startDate: string | null;
  stateSlug: string | null;
  locationSlug: string | null;
  budgetMaxMinor: number | null;
  involvement: InvolvementMode | null;
};

export type CaptureSession = {
  id: string;
  step: CaptureStep;
  draft: CaptureDraft;
  pendingServiceLoop: boolean;
  gaps: CatalogGapTerm[];
  history: Array<{ role: 'user' | 'assistant' | 'system'; text: string; at: string }>;
  updatedAt: string;
};

export type CaptureInbound =
  | { kind: 'text'; text: string }
  | { kind: 'tap'; id: string; title?: string }
  | { kind: 'cancel' }
  | { kind: 'submit' }
  | { kind: 'edit'; step?: CaptureStep };

export type WhatsAppButton = { id: string; title: string };
export type WhatsAppListRow = { id: string; title: string; description?: string };

export type CaptureOutbound =
  | {
      channel: 'whatsapp' | 'web' | 'agent';
      kind: 'text';
      body: string;
    }
  | {
      channel: 'whatsapp' | 'web' | 'agent';
      kind: 'buttons';
      body: string;
      buttons: WhatsAppButton[];
    }
  | {
      channel: 'whatsapp' | 'web' | 'agent';
      kind: 'list';
      body: string;
      buttonLabel: string;
      rows: WhatsAppListRow[];
      page: number;
      hasMore: boolean;
    }
  | {
      channel: 'whatsapp' | 'web' | 'agent';
      kind: 'flows_stub';
      body: string;
      flowName: string;
      fields: string[];
    };

export type AdvanceCaptureResult = {
  session: CaptureSession;
  outbound: CaptureOutbound[];
  extracted: CaptureDraft | null;
  completed: boolean;
  cancelled: boolean;
};

export const emptyDraft = (): CaptureDraft => ({
  categorySlug: null,
  typeSlug: null,
  items: [],
  startDate: null,
  stateSlug: null,
  locationSlug: null,
  budgetMaxMinor: null,
  involvement: null,
});

export function createCaptureSession(id = `cap_${Date.now()}`): CaptureSession {
  return {
    id,
    step: 'category',
    draft: emptyDraft(),
    pendingServiceLoop: false,
    gaps: [],
    history: [],
    updatedAt: new Date().toISOString(),
  };
}

export type InvolvementMode = 'match' | 'relay' | 'assist' | 'autopilot';

export type RequestStatus = 'searching' | 'asking' | 'quotes_ready' | 'booked';

export type Quote = {
  id: string;
  vendorAlias: string;
  verified: boolean;
  priceMinor: number;
  availability: string;
  rating: number;
  reason: string;
  recommended?: boolean;
};

export type ChatMedia = {
  id: string;
  mime: 'image/jpeg' | 'image/png' | 'image/webp';
  url: string;
  bytes: number;
};

export type ChatMessage = {
  id: string;
  from: 'buyer' | 'vendor' | 'system' | 'agent';
  text: string;
  at: string;
  filtered?: boolean;
  deliveredAt?: string;
  readAt?: string;
  media?: ChatMedia[];
};

export type AppRequestItem = {
  serviceSlug: string;
  serviceName: string;
  quantity: number;
  attributes: Record<string, string | number | boolean>;
};

export type AppRequestLocation = {
  stateSlug: string;
  locationSlug: string;
  venueText?: string;
};

/** Structured buyer request (Prompt 44). Legacy flat `answers` kept for older rows. */
export type AppRequestPayload = {
  catalogVersion: number;
  typeSlug: string;
  typeName: string;
  items: AppRequestItem[];
  attributes: Record<string, string | number | boolean>;
  startDate: string;
  endDate?: string;
  startTime?: string;
  location: AppRequestLocation;
  budgetMinMinor: number | null;
  budgetMaxMinor: number | null;
};

export type AppRequest = {
  id: string;
  categorySlug: string;
  categoryName: string;
  title: string;
  status: RequestStatus;
  involvement: InvolvementMode;
  answers: Record<string, unknown>;
  payload?: AppRequestPayload;
  createdAt: string;
  quotes: Quote[];
  chatId: string;
};

export type ChatThread = {
  id: string;
  requestId: string;
  vendorAlias: string;
  missionTag: string;
  agentInControl: boolean;
  unreadCount: number;
  typing?: boolean;
  messages: ChatMessage[];
};

export type AccountSettings = {
  phone: string;
  notifyQuotes: boolean;
  notifyChat: boolean;
  notifyMarketing: boolean;
  language: 'en' | 'pidgin';
  savedReplies: string[];
};

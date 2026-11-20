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

export type ChatMessage = {
  id: string;
  from: 'buyer' | 'vendor' | 'system' | 'agent';
  text: string;
  at: string;
};

export type AppRequest = {
  id: string;
  categorySlug: string;
  categoryName: string;
  title: string;
  status: RequestStatus;
  involvement: InvolvementMode;
  answers: Record<string, unknown>;
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
  messages: ChatMessage[];
};

export type AccountSettings = {
  phone: string;
  notifyQuotes: boolean;
  notifyChat: boolean;
  notifyMarketing: boolean;
  language: 'en' | 'pidgin';
};

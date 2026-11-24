'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { maskContactDetails } from '@askalert/channels';
import { seedChat, seedRequest } from './mock-data';
import type {
  AccountSettings,
  AppRequest,
  ChatMedia,
  ChatMessage,
  ChatThread,
  InvolvementMode,
  Quote,
  RequestStatus,
} from './types';

const STORAGE_KEY = 'askalert.mock.v1';

type PersistedMock = {
  requests: AppRequest[];
  chats: ChatThread[];
  account: AccountSettings;
  notifyInterest: string[];
};

function readPersisted(): PersistedMock | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as PersistedMock;
  } catch {
    return null;
  }
}

function writePersisted(data: PersistedMock): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore quota / private-mode failures.
  }
}

type SendChatResult = {
  message: ChatMessage;
  masked: boolean;
};

type MockStore = {
  ready: boolean;
  requests: AppRequest[];
  chats: ChatThread[];
  account: AccountSettings;
  notifyInterest: string[];
  latestRequest: AppRequest | null;
  getRequest: (id: string) => AppRequest | undefined;
  getChat: (id: string) => ChatThread | undefined;
  createRequest: (input: {
    categorySlug: string;
    categoryName: string;
    title: string;
    involvement: InvolvementMode;
    answers: Record<string, unknown>;
  }) => AppRequest;
  setRequestStatus: (id: string, status: RequestStatus) => void;
  markBooked: (requestId: string, quote: Quote) => void;
  toggleAgentControl: (chatId: string) => void;
  sendChatMessage: (
    chatId: string,
    text: string,
    options?: { from?: ChatThread['messages'][number]['from']; media?: ChatMedia[] },
  ) => SendChatResult | null;
  markChatRead: (chatId: string) => void;
  addSavedReply: (text: string) => void;
  removeSavedReply: (text: string) => void;
  updateAccount: (patch: Partial<AccountSettings>) => void;
  addNotifyInterest: (slug: string) => void;
};

const MockStoreContext = createContext<MockStore | null>(null);

const defaultAccount: AccountSettings = {
  phone: '+234 801 234 5678',
  notifyQuotes: true,
  notifyChat: true,
  notifyMarketing: false,
  language: 'en',
  savedReplies: [
    'Is Wi‑Fi included?',
    'Can you do a better rate?',
    'Send house rules',
    'I want to book',
  ],
};

function clock(): string {
  return new Date().toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
}

const VENDOR_REPLIES = [
  'Yes, that works on our side.',
  'I can hold it for two hours if you are ready to book.',
  'Wi‑Fi is included and self check-in is fine.',
  'Thanks — send the booking when you are ready.',
];

export function MockStoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [requests, setRequests] = useState<AppRequest[]>([seedRequest]);
  const [chats, setChats] = useState<ChatThread[]>([seedChat]);
  const [account, setAccount] = useState<AccountSettings>(defaultAccount);
  const [notifyInterest, setNotifyInterest] = useState<string[]>([]);
  const vendorTimers = useRef<Record<string, number>>({});

  useEffect(() => {
    const saved = readPersisted();
    if (saved?.requests?.length) {
      setRequests(saved.requests);
      setChats(saved.chats?.length ? saved.chats : [seedChat]);
      setAccount(saved.account ?? defaultAccount);
      setNotifyInterest(saved.notifyInterest ?? []);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }
    writePersisted({ requests, chats, account, notifyInterest });
  }, [ready, requests, chats, account, notifyInterest]);

  const getRequest = useCallback(
    (id: string) => requests.find((request) => request.id === id),
    [requests],
  );

  const getChat = useCallback(
    (id: string) => chats.find((chat) => chat.id === id),
    [chats],
  );

  const scheduleVendorReply = useCallback((chatId: string) => {
    if (typeof window === 'undefined') {
      return;
    }
    if (process.env.NODE_ENV === 'production') {
      // Still allow demo simulation in static export preview.
    }
    window.clearTimeout(vendorTimers.current[chatId]);
    setChats((current) =>
      current.map((chat) => (chat.id === chatId ? { ...chat, typing: true } : chat)),
    );
    vendorTimers.current[chatId] = window.setTimeout(() => {
      const reply =
        VENDOR_REPLIES[Math.floor(Math.random() * VENDOR_REPLIES.length)] ??
        VENDOR_REPLIES[0]!;
      const at = clock();
      setChats((current) =>
        current.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                typing: false,
                unreadCount: chat.unreadCount + 1,
                messages: [
                  ...chat.messages,
                  {
                    id: `${chatId}_vendor_${Date.now()}`,
                    from: 'vendor',
                    text: reply,
                    at,
                    deliveredAt: at,
                  },
                ],
              }
            : chat,
        ),
      );
    }, 900 + Math.floor(Math.random() * 900));
  }, []);

  const createRequest: MockStore['createRequest'] = useCallback((input) => {
    const id = `req_${Date.now()}`;
    const chatId = `chat_${Date.now()}`;
    const at = clock();
    const request: AppRequest = {
      id,
      categorySlug: input.categorySlug,
      categoryName: input.categoryName,
      title: input.title,
      status: 'asking',
      involvement: input.involvement,
      answers: input.answers,
      createdAt: new Date().toISOString(),
      quotes: seedRequest.quotes.map((quote) => ({ ...quote, id: `${quote.id}_${id}` })),
      chatId,
    };
    const chat: ChatThread = {
      id: chatId,
      requestId: id,
      vendorAlias: 'Lagos Nest',
      missionTag: `${input.categoryName} · new ask`,
      agentInControl: input.involvement !== 'match',
      unreadCount: 0,
      messages: [
        {
          id: `${chatId}_m1`,
          from: 'agent',
          text: 'Got it. I’m asking verified vendors now.',
          at,
          deliveredAt: at,
          readAt: at,
        },
        {
          id: `${chatId}_m2`,
          from: 'system',
          text: 'Contact details are shared after booking.',
          at,
        },
      ],
    };

    setRequests((current) => {
      const nextRequests = [request, ...current];
      setChats((currentChats) => {
        const nextChats = [chat, ...currentChats];
        // Persist before any full-page navigateStatic so the new ask survives reload.
        writePersisted({
          requests: nextRequests,
          chats: nextChats,
          account,
          notifyInterest,
        });
        return nextChats;
      });
      return nextRequests;
    });

    window.setTimeout(() => {
      setRequests((current) => {
        const next: AppRequest[] = current.map((item) =>
          item.id === id ? { ...item, status: 'quotes_ready' as const } : item,
        );
        writePersisted({
          requests: next,
          chats: readPersisted()?.chats ?? [chat, seedChat],
          account,
          notifyInterest,
        });
        return next;
      });
      window.dispatchEvent(
        new CustomEvent('askalert:notification', {
          detail: { eventType: 'quotes_ready', url: `/app/request/${id}/` },
        }),
      );
    }, 1200);

    return request;
  }, [account, notifyInterest]);

  const setRequestStatus = useCallback((id: string, status: RequestStatus) => {
    setRequests((current) =>
      current.map((request) => (request.id === id ? { ...request, status } : request)),
    );
  }, []);

  const markBooked = useCallback((requestId: string, quote: Quote) => {
    const at = clock();
    setRequests((current) =>
      current.map((request) =>
        request.id === requestId ? { ...request, status: 'booked' } : request,
      ),
    );
    setChats((current) =>
      current.map((chat) =>
        chat.requestId === requestId
          ? {
              ...chat,
              vendorAlias: quote.vendorAlias,
              messages: [
                ...chat.messages,
                {
                  id: `${chat.id}_booked`,
                  from: 'system',
                  text: `Booked with ${quote.vendorAlias}. Contact details unlock next.`,
                  at,
                },
              ],
            }
          : chat,
      ),
    );
  }, []);

  const toggleAgentControl = useCallback((chatId: string) => {
    setChats((current) =>
      current.map((chat) =>
        chat.id === chatId ? { ...chat, agentInControl: !chat.agentInControl } : chat,
      ),
    );
  }, []);

  const sendChatMessage: MockStore['sendChatMessage'] = useCallback(
    (chatId, text, options = {}) => {
      const from = options.from ?? 'buyer';
      const mask = from === 'buyer' || from === 'vendor' ? maskContactDetails(text) : {
        text,
        masked: false,
        reasons: [] as string[],
      };
      const at = clock();
      const message: ChatMessage = {
        id: `${chatId}_${Date.now()}`,
        from,
        text: mask.text,
        at,
        filtered: mask.masked,
        deliveredAt: at,
        media: options.media,
      };

      setChats((current) =>
        current.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                messages: [...chat.messages, message],
              }
            : chat,
        ),
      );

      if (from === 'buyer') {
        window.setTimeout(() => {
          setChats((current) =>
            current.map((chat) =>
              chat.id === chatId
                ? {
                    ...chat,
                    messages: chat.messages.map((item) =>
                      item.id === message.id ? { ...item, readAt: clock() } : item,
                    ),
                  }
                : chat,
            ),
          );
        }, 700);
        scheduleVendorReply(chatId);
      }

      return { message, masked: mask.masked };
    },
    [scheduleVendorReply],
  );

  const markChatRead = useCallback((chatId: string) => {
    setChats((current) =>
      current.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              unreadCount: 0,
              messages: chat.messages.map((message) =>
                message.from !== 'buyer' && !message.readAt
                  ? { ...message, readAt: clock(), deliveredAt: message.deliveredAt ?? clock() }
                  : message,
              ),
            }
          : chat,
      ),
    );
  }, []);

  const addSavedReply = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }
    setAccount((current) =>
      current.savedReplies.includes(trimmed)
        ? current
        : { ...current, savedReplies: [...current.savedReplies, trimmed].slice(0, 12) },
    );
  }, []);

  const removeSavedReply = useCallback((text: string) => {
    setAccount((current) => ({
      ...current,
      savedReplies: current.savedReplies.filter((item) => item !== text),
    }));
  }, []);

  const updateAccount = useCallback((patch: Partial<AccountSettings>) => {
    setAccount((current) => ({ ...current, ...patch }));
  }, []);

  const addNotifyInterest = useCallback((slug: string) => {
    setNotifyInterest((current) =>
      current.includes(slug) ? current : [...current, slug],
    );
  }, []);

  const value = useMemo<MockStore>(
    () => ({
      ready,
      requests,
      chats,
      account,
      notifyInterest,
      latestRequest: requests[0] ?? null,
      getRequest,
      getChat,
      createRequest,
      setRequestStatus,
      markBooked,
      toggleAgentControl,
      sendChatMessage,
      markChatRead,
      addSavedReply,
      removeSavedReply,
      updateAccount,
      addNotifyInterest,
    }),
    [
      ready,
      requests,
      chats,
      account,
      notifyInterest,
      getRequest,
      getChat,
      createRequest,
      setRequestStatus,
      markBooked,
      toggleAgentControl,
      sendChatMessage,
      markChatRead,
      addSavedReply,
      removeSavedReply,
      updateAccount,
      addNotifyInterest,
    ],
  );

  return <MockStoreContext.Provider value={value}>{children}</MockStoreContext.Provider>;
}

export function useMockStore(): MockStore {
  const store = useContext(MockStoreContext);
  if (!store) {
    throw new Error('useMockStore must be used inside MockStoreProvider.');
  }
  return store;
}

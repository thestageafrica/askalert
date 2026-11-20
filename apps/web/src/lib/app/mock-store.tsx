'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { seedChat, seedRequest } from './mock-data';
import type {
  AccountSettings,
  AppRequest,
  ChatThread,
  InvolvementMode,
  Quote,
  RequestStatus,
} from './types';

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
  sendChatMessage: (chatId: string, text: string, from?: ChatThread['messages'][number]['from']) => void;
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
};

export function MockStoreProvider({ children }: { children: ReactNode }) {
  const [ready] = useState(true);
  const [requests, setRequests] = useState<AppRequest[]>([seedRequest]);
  const [chats, setChats] = useState<ChatThread[]>([seedChat]);
  const [account, setAccount] = useState<AccountSettings>(defaultAccount);
  const [notifyInterest, setNotifyInterest] = useState<string[]>([]);

  const getRequest = useCallback(
    (id: string) => requests.find((request) => request.id === id),
    [requests],
  );

  const getChat = useCallback(
    (id: string) => chats.find((chat) => chat.id === id),
    [chats],
  );

  const createRequest: MockStore['createRequest'] = useCallback((input) => {
    const id = `req_${Date.now()}`;
    const chatId = `chat_${Date.now()}`;
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
      messages: [
        {
          id: `${chatId}_m1`,
          from: 'agent',
          text: 'Got it. I’m asking verified vendors now.',
          at: new Date().toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' }),
        },
        {
          id: `${chatId}_m2`,
          from: 'system',
          text: 'Contact details are shared after booking.',
          at: new Date().toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    };

    setRequests((current) => [request, ...current]);
    setChats((current) => [chat, ...current]);

    window.setTimeout(() => {
      setRequests((current) =>
        current.map((item) =>
          item.id === id ? { ...item, status: 'quotes_ready' } : item,
        ),
      );
    }, 1200);

    return request;
  }, []);

  const setRequestStatus = useCallback((id: string, status: RequestStatus) => {
    setRequests((current) =>
      current.map((request) => (request.id === id ? { ...request, status } : request)),
    );
  }, []);

  const markBooked = useCallback((requestId: string, quote: Quote) => {
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
                  at: new Date().toLocaleTimeString('en-NG', {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
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
    (chatId, text, from = 'buyer') => {
      setChats((current) =>
        current.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                messages: [
                  ...chat.messages,
                  {
                    id: `${chatId}_${Date.now()}`,
                    from,
                    text,
                    at: new Date().toLocaleTimeString('en-NG', {
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                  },
                ],
              }
            : chat,
        ),
      );
    },
    [],
  );

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

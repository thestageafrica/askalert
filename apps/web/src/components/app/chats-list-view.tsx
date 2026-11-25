'use client';

import { Button } from '@askalert/ui';
import { AppHeader } from './app-header';
import { EmptyState } from './empty-state';
import { useMockStore } from '../../lib/app/mock-store';
import { chatHref } from '../../lib/app/static-nav';

export function ChatsListView() {
  const { chats } = useMockStore();

  return (
    <div>
      <div className="lg:hidden">
        <AppHeader title="Chat" subtitle="Private until you book." />
      </div>
      <div className="hidden px-0 pb-4 pt-2 lg:block">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Messages</h1>
        <p className="mt-2 text-sm text-muted-foreground">Private until you book.</p>
      </div>
      <div className="space-y-3 px-4 pt-2 lg:mx-auto lg:max-w-2xl lg:px-0 lg:pt-0">
        {chats.length === 0 ? (
          <EmptyState
            title="No chats yet"
            description="Chats open when AskAlert starts asking vendors."
            action={<Button href="/app">Start an ask</Button>}
          />
        ) : (
          chats.map((chat) => {
            const last = chat.messages[chat.messages.length - 1];
            const initials = chat.vendorAlias
              .split(' ')
              .map((part) => part[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            return (
              <a
                key={chat.id}
                href={chatHref(chat.id)}
                className="flex gap-3 rounded-[1.4rem] border border-border/60 bg-card p-4 shadow-[0_10px_24px_color-mix(in_srgb,var(--navy-950)_6%,transparent)] transition hover:-translate-y-0.5"
              >
                <div className="relative flex size-11 shrink-0 items-center justify-center rounded-2xl bg-navy-950 text-xs font-extrabold text-orange-400">
                  {initials}
                  {chat.unreadCount > 0 ? (
                    <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-navy-900">
                      {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                    </span>
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate font-extrabold text-foreground">{chat.vendorAlias}</p>
                    <p className="shrink-0 text-xs text-muted-foreground">{last?.at}</p>
                  </div>
                  <p className="mt-0.5 text-xs font-semibold text-orange-600">{chat.missionTag}</p>
                  <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                    {chat.typing ? `${chat.vendorAlias} is typing…` : last?.text}
                  </p>
                </div>
              </a>
            );
          })
        )}
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { Button } from '@askalert/ui';
import { AppHeader } from './app-header';
import { useMockStore } from '../../lib/app/mock-store';

export function ChatsListView() {
  const { chats } = useMockStore();

  return (
    <div>
      <AppHeader title="Chat" subtitle="Private until you book." />
      <div className="space-y-3 px-4 pt-5">
        {chats.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center">
            <p className="font-semibold text-foreground">No chats yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Chats open when AskAlert starts asking vendors.
            </p>
            <Button href="/app" className="mt-4">
              Start an ask
            </Button>
          </div>
        ) : (
          chats.map((chat) => {
            const last = chat.messages[chat.messages.length - 1];
            return (
              <Link
                key={chat.id}
                href={`/app/chat/${chat.id}`}
                className="block rounded-[1.35rem] border border-border/70 bg-card p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-extrabold text-foreground">{chat.vendorAlias}</p>
                  <p className="text-xs text-muted-foreground">{last?.at}</p>
                </div>
                <p className="mt-1 text-xs font-semibold text-orange-600">{chat.missionTag}</p>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{last?.text}</p>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

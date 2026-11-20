'use client';

import { useState } from 'react';
import { Button, Input, cn } from '@askalert/ui';
import { AppHeader } from './app-header';
import { quickReplies } from '../../lib/app/mock-data';
import { useMockStore } from '../../lib/app/mock-store';

export function ChatView({ chatId }: { chatId: string }) {
  const { getChat, toggleAgentControl, sendChatMessage } = useMockStore();
  const chat = getChat(chatId);
  const [draft, setDraft] = useState('');

  if (!chat) {
    return (
      <div className="p-4">
        <AppHeader title="Chat not found" subtitle="Open a request to continue the thread." />
        <Button href="/app/chats" className="mt-6">
          All chats
        </Button>
      </div>
    );
  }

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }
    sendChatMessage(chat.id, trimmed, 'buyer');
    setDraft('');
  };

  return (
    <div className="flex min-h-[calc(100vh-5.5rem)] flex-col">
      <AppHeader
        title={chat.vendorAlias}
        subtitle={chat.missionTag}
        action={
          <Button
            variant="secondary"
            className="border-surface/25 bg-surface/10 text-surface hover:bg-surface/15"
            onClick={() => toggleAgentControl(chat.id)}
          >
            {chat.agentInControl ? 'Take over' : 'Hand back to AskAlert'}
          </Button>
        }
      />

      <div className="flex-1 space-y-3 px-4 py-4">
        <p className="rounded-2xl border border-dashed border-border bg-card-muted px-3 py-2 text-center text-xs text-muted-foreground">
          Contact details are shared after booking
        </p>

        {chat.messages.map((message) => {
          const mine = message.from === 'buyer';
          const system = message.from === 'system';
          return (
            <div
              key={message.id}
              className={cn('flex', mine ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                  system
                    ? 'w-full bg-card-muted text-center text-muted-foreground'
                    : mine
                      ? 'rounded-br-md bg-orange-500 text-navy-900'
                      : message.from === 'agent'
                        ? 'rounded-bl-md bg-navy-950 text-surface'
                        : 'rounded-bl-md border border-border bg-card text-foreground',
                )}
              >
                {!system && !mine ? (
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wide opacity-70">
                    {message.from === 'agent' ? 'AskAlert' : chat.vendorAlias}
                  </p>
                ) : null}
                <p>{message.text}</p>
                {!system ? (
                  <p className="mt-1 text-[10px] opacity-70">{message.at}</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-24 space-y-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {quickReplies.map((reply) => (
            <button
              key={reply}
              type="button"
              className="shrink-0 rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground"
              onClick={() => send(reply)}
            >
              {reply}
            </button>
          ))}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            send(draft);
          }}
        >
          <Input
            aria-label="Message"
            placeholder={
              chat.agentInControl ? 'AskAlert is drafting with you…' : 'Type a message'
            }
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <Button type="submit">Send</Button>
        </form>
      </div>
    </div>
  );
}

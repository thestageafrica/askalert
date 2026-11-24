'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { createMoney, formatNaira } from '@askalert/payments';
import { Button, Input, cn } from '@askalert/ui';
import { AppHeader } from './app-header';
import { countThreadImages, prepareChatImage } from '../../lib/app/chat-media';
import { useMockStore } from '../../lib/app/mock-store';
import { usePlanStore } from '../../lib/app/plan-store';
import { useChatLive } from '../../lib/app/use-chat-live';

export function ChatView({ chatId }: { chatId: string }) {
  const {
    getChat,
    getRequest,
    toggleAgentControl,
    sendChatMessage,
    markChatRead,
    account,
    addSavedReply,
  } = useMockStore();
  const { consume } = usePlanStore();
  const chat = getChat(chatId);
  useChatLive(chat?.id);
  const request = chat ? getRequest(chat.requestId) : undefined;
  const [draft, setDraft] = useState('');
  const [planNotice, setPlanNotice] = useState<string | null>(null);
  const [maskNotice, setMaskNotice] = useState(false);
  const [compare, setCompare] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [pendingMedia, setPendingMedia] = useState<
    Array<{ id: string; mime: 'image/jpeg' | 'image/png' | 'image/webp'; url: string; bytes: number }>
  >([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chat) {
      markChatRead(chat.id);
    }
  }, [chat, markChatRead]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chat?.messages.length, chat?.typing]);

  const imageCount = useMemo(() => {
    if (!chat) {
      return 0;
    }
    return countThreadImages(chat.messages.map((message) => message.media?.length ?? 0));
  }, [chat]);

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
    if (!trimmed && pendingMedia.length === 0) {
      return;
    }
    const entitlement = consume('relay_message');
    if (entitlement.blocked && entitlement.decision.outcome === 'block') {
      setPlanNotice(`${entitlement.decision.reason} ${entitlement.decision.nextStep}`);
      return;
    }
    if (entitlement.decision.outcome === 'warn_at_80') {
      setPlanNotice(`${entitlement.decision.reason} ${entitlement.decision.nextStep}`);
    } else {
      setPlanNotice(null);
    }
    const result = sendChatMessage(chat.id, trimmed || 'Photo attached', {
      from: 'buyer',
      media: pendingMedia.length ? pendingMedia : undefined,
    });
    setMaskNotice(Boolean(result?.masked));
    setDraft('');
    setPendingMedia([]);
    setMediaError(null);
  };

  const onPickPhoto = async (file: File | undefined) => {
    if (!file) {
      return;
    }
    const prepared = await prepareChatImage(file, imageCount + pendingMedia.length);
    if (!prepared.ok) {
      setMediaError(prepared.error);
      return;
    }
    setMediaError(null);
    setPendingMedia((current) => [
      ...current,
      {
        id: `img_${Date.now()}`,
        mime: prepared.image.mime,
        url: prepared.image.url,
        bytes: prepared.image.bytes,
      },
    ]);
  };

  return (
    <div className="flex min-h-[calc(100vh-5.5rem)] flex-col">
      <AppHeader
        title={chat.vendorAlias}
        subtitle={chat.missionTag}
        action={
          <div className="flex items-center gap-2">
            {request ? (
              <Button
                variant="ghost"
                className="border-surface/25 bg-surface/10 text-surface hover:bg-surface/15"
                onClick={() => setCompare((value) => !value)}
              >
                {compare ? 'Hide compare' : 'Compare quotes'}
              </Button>
            ) : null}
            <Button
              variant="secondary"
              className="border-surface/25 bg-surface/10 text-surface hover:bg-surface/15"
              onClick={() => toggleAgentControl(chat.id)}
            >
              {chat.agentInControl ? 'Take over' : 'Hand back to AskAlert'}
            </Button>
          </div>
        }
      />

      <div className="flex-1 space-y-3 bg-[radial-gradient(90%_40%_at_50%_0%,_color-mix(in_srgb,var(--orange-500)_8%,transparent),_transparent_55%)] px-4 py-4">
        <p className="rounded-2xl border border-dashed border-border/80 bg-card/90 px-3 py-2 text-center text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
          Contact details are shared after booking
        </p>
        {planNotice ? (
          <p className="rounded-2xl border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-center text-xs font-medium text-navy-950">
            {planNotice}{' '}
            <Link href="/app/plan" className="font-bold underline">
              Your plan
            </Link>
          </p>
        ) : null}
        {maskNotice ? (
          <p className="rounded-2xl border border-border/70 bg-card px-3 py-2 text-center text-xs font-medium text-muted-foreground">
            We hid contact details so booking stays on AskAlert.
          </p>
        ) : null}

        {compare && request ? (
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <thead className="bg-card-muted text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Vendor</th>
                  <th className="px-3 py-2">Price</th>
                  <th className="px-3 py-2">Rating</th>
                </tr>
              </thead>
              <tbody>
                {request.quotes.map((quote) => (
                  <tr key={quote.id} className="border-t border-border">
                    <td className="px-3 py-3 font-semibold">{quote.vendorAlias}</td>
                    <td className="px-3 py-3">{formatNaira(createMoney(quote.priceMinor))}</td>
                    <td className="px-3 py-3">{quote.rating.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

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
                {message.media?.length ? (
                  <div className="mb-2 grid gap-2">
                    {message.media.map((item) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={item.id}
                        src={item.url}
                        alt="Chat attachment"
                        className="max-h-48 w-full rounded-xl object-cover"
                      />
                    ))}
                  </div>
                ) : null}
                <p>{message.text}</p>
                {message.filtered ? (
                  <p className="mt-1 text-[10px] font-semibold opacity-80">Contact details hidden</p>
                ) : null}
                {!system ? (
                  <p className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-70">
                    <span>{message.at}</span>
                    {mine ? (
                      <span aria-label={message.readAt ? 'Read' : message.deliveredAt ? 'Delivered' : 'Sent'}>
                        {message.readAt ? '✓✓' : message.deliveredAt ? '✓✓' : '✓'}
                      </span>
                    ) : null}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}

        {chat.typing ? (
          <p className="text-xs font-medium text-muted-foreground">{chat.vendorAlias} is typing…</p>
        ) : null}
        <div ref={bottomRef} />
      </div>

      <div className="sticky bottom-24 space-y-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur">
        {pendingMedia.length ? (
          <div className="flex gap-2 overflow-x-auto">
            {pendingMedia.map((item) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={item.id}
                src={item.url}
                alt="Pending attachment"
                className="h-16 w-16 rounded-xl object-cover"
              />
            ))}
          </div>
        ) : null}
        {mediaError ? (
          <p className="text-xs font-medium text-warning">{mediaError}</p>
        ) : null}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {account.savedReplies.map((reply) => (
            <button
              key={reply}
              type="button"
              className="shrink-0 rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground"
              onClick={() => send(reply)}
            >
              {reply}
            </button>
          ))}
          <button
            type="button"
            className="shrink-0 rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground"
            onClick={() => {
              const entitlement = consume('send_whatsapp');
              if (entitlement.blocked && entitlement.decision.outcome === 'block') {
                setPlanNotice(`${entitlement.decision.reason} ${entitlement.decision.nextStep}`);
                return;
              }
              setPlanNotice('WhatsApp chat is unlocked on your plan. Keep using in-app chat for now.');
            }}
          >
            WhatsApp
          </button>
        </div>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            send(draft);
          }}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => {
              void onPickPhoto(event.target.files?.[0]);
              event.target.value = '';
            }}
          />
          <Button
            type="button"
            variant="secondary"
            className="min-h-11 px-3"
            onClick={() => fileRef.current?.click()}
            aria-label="Attach photo"
          >
            Photo
          </Button>
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
        {draft.trim().length > 8 ? (
          <button
            type="button"
            className="text-xs font-semibold text-muted-foreground underline"
            onClick={() => addSavedReply(draft)}
          >
            Save as quick reply
          </button>
        ) : null}
      </div>
    </div>
  );
}

'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ChatView } from '../../../../components/app/chat-view';

function ChatOpenBody() {
  const params = useSearchParams();
  const chatId = params.get('id') ?? 'chat_shortlet_01';
  return <ChatView chatId={chatId} />;
}

export default function ChatOpenPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4" aria-busy="true">
          <div className="h-40 animate-pulse rounded-2xl bg-card-muted" />
        </div>
      }
    >
      <ChatOpenBody />
    </Suspense>
  );
}

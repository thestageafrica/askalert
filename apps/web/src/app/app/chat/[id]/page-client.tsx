'use client';

import { useParams } from 'next/navigation';
import { ChatView } from '../../../../components/app/chat-view';

export function ChatThreadPageClient() {
  const params = useParams<{ id: string }>();
  return <ChatView chatId={params.id ?? 'chat_shortlet_01'} />;
}

import { ChatThreadPageClient } from './page-client';

export function generateStaticParams() {
  return [{ id: 'chat_shortlet_01' }];
}

export default function ChatThreadPage() {
  return <ChatThreadPageClient />;
}

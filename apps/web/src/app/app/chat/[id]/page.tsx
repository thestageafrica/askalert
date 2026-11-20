import type { Metadata } from 'next';
import { ChatView } from '../../../../components/app/chat-view';

type PageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: 'Chat thread',
};

export default async function ChatThreadPage({ params }: PageProps) {
  const { id } = await params;
  return <ChatView chatId={id} />;
}

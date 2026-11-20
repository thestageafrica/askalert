import type { Metadata } from 'next';
import { ChatsListView } from '../../../components/app/chats-list-view';

export const metadata: Metadata = {
  title: 'Chat',
};

export default function ChatsPage() {
  return <ChatsListView />;
}

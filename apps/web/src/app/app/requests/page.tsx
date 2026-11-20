import type { Metadata } from 'next';
import { RequestsListView } from '../../../components/app/requests-list-view';

export const metadata: Metadata = {
  title: 'Requests',
};

export default function RequestsPage() {
  return <RequestsListView />;
}

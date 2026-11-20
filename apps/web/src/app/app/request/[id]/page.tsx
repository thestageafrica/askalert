import type { Metadata } from 'next';
import { RequestDetailView } from '../../../../components/app/request-detail-view';

type PageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: 'Request',
};

export default async function RequestPage({ params }: PageProps) {
  const { id } = await params;
  return <RequestDetailView requestId={id} />;
}

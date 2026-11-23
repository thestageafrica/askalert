import { RequestPageClient } from './page-client';

export function generateStaticParams() {
  return [{ id: 'req_shortlet_01' }];
}

export default function RequestPage() {
  return <RequestPageClient />;
}

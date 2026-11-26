import { VendorReviewDetailPage } from '../../../components/vendor-review-detail';

export function generateStaticParams() {
  return [{ id: 'vp_demo_1' }, { id: 'vp_demo_2' }];
}

export const dynamicParams = false;

export default function VendorDetailPage() {
  return <VendorReviewDetailPage />;
}

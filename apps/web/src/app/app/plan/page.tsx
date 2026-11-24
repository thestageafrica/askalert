import type { Metadata } from 'next';
import { PlanView } from '../../../components/app/plan-view';

export const metadata: Metadata = {
  title: 'Your plan',
};

export default function PlanPage() {
  return <PlanView />;
}

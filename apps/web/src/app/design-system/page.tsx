import type { Metadata } from 'next';
import { DesignSystemView } from './design-system-view';

export const metadata: Metadata = {
  title: 'Design system | AskAlert',
  description: 'AskAlert brand tokens and UI components',
};

export default function DesignSystemPage() {
  return <DesignSystemView />;
}

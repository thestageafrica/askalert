import type { Metadata } from 'next';
import { HomeView } from '../../components/app/home-view';

export const metadata: Metadata = {
  title: 'Home',
  description: 'Ask AskAlert what you need in Lagos.',
};

export default function AppHomePage() {
  return <HomeView />;
}

import type { Metadata } from 'next';
import { AccountView } from '../../../components/app/account-view';

export const metadata: Metadata = {
  title: 'Account',
};

export default function AccountPage() {
  return <AccountView />;
}

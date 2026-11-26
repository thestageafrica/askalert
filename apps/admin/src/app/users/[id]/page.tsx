import { UserDetailPage } from '../../../components/user-detail';

export function generateStaticParams() {
  return [{ id: 'user_demo_1' }, { id: 'user_demo_2' }];
}

export const dynamicParams = false;

export default function UsersDetailRoute() {
  return <UserDetailPage />;
}

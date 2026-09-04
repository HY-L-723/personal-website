import type { Metadata } from 'next';
import { FriendsPage } from '@/components/site/friends-page';

export const metadata: Metadata = {
  title: '友链',
  description: '与 PVL随记 交换一扇通往彼此世界的小窗。',
};

export default function Page() {
  return <FriendsPage />;
}

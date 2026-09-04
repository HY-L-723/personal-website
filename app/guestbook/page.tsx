import type { Metadata } from 'next';
import { GuestbookPage } from '@/components/site/guestbook-page';

export const metadata: Metadata = {
  title: '留言板',
  description: '在 PVL随记 留下一句话，也许会遇见另一份共鸣。',
};

export default function Page() {
  return <GuestbookPage />;
}

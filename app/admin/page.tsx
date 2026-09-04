import type { Metadata } from 'next';
import { AdminPage } from '@/components/admin/admin-page';

export const metadata: Metadata = {
  title: '内容后台',
  description: 'PVL随记 的独立本地内容管理后台。',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AdminPage />;
}

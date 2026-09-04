import type { Metadata } from 'next';
import { ChangelogPage } from '@/components/site/changelog-page';

export const metadata: Metadata = {
  title: '更新日志',
  description: '记录 PVL随记 的每一次变化。',
};

export default function Page() {
  return <ChangelogPage />;
}

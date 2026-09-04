import type { Metadata } from 'next';
import { StatsPage } from '@/components/site/stats-page';

export const metadata: Metadata = {
  title: '统计',
  description: 'PVL随记 的内容与本机访问数据统计。',
};

export default function Page() {
  return <StatsPage />;
}

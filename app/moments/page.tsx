import type { Metadata } from 'next';
import { MomentsPage } from '@/components/site/moments-page';

export const metadata: Metadata = {
  title: '随笔',
  description: 'PVL 的图文动态与生活片段。',
};

export default function Page() {
  return <MomentsPage />;
}

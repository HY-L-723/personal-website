import type { Metadata } from 'next';
import { ArchivesPage } from '@/components/site/archives-page';

export const metadata: Metadata = {
  title: '文章归档',
  description: '按年份、分类与标签浏览 PVL随记的全部文章。',
};

export default function Page() {
  return <ArchivesPage />;
}

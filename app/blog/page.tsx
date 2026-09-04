import type { Metadata } from 'next';
import { BlogPage } from '@/components/site/blog-page';

export const metadata: Metadata = {
  title: '博客',
  description: 'PVL 的学习笔记、开发记录与生活随笔。',
};

export default function Page() {
  return <BlogPage />;
}

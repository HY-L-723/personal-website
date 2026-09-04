import type { Metadata } from 'next';
import { GalleryPage } from '@/components/site/gallery-page';

export const metadata: Metadata = {
  title: '相册',
  description: 'PVL 收藏的沿途风景与生活瞬间。',
};

export default function Page() {
  return <GalleryPage />;
}

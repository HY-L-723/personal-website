import type { Metadata } from 'next';
import { PostDetailPage } from '@/components/site/post-detail-page';
import { seedData } from '@/lib/data/seed-data';

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const post = seedData.posts.find((item) => item.slug === params.slug);
  if (!post) return { title: '文章未找到' };
  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default function Page({ params }: { params: { slug: string } }) {
  return <PostDetailPage slug={params.slug} />;
}

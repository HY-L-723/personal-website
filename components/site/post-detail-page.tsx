'use client';

import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Folder,
  Hash,
} from 'lucide-react';
import { ContentShell } from '@/components/site/content-shell';
import { useSiteData } from '@/components/site/data-provider';

export function PostDetailPage({ slug }: { slug: string }) {
  const { data } = useSiteData();
  const post = data.posts.find((item) => item.slug === slug && item.published);

  if (!post) {
    return (
      <ContentShell>
        <section className="not-found-card glass-card">
          <span>404</span>
          <h1>这篇文章暂时找不到</h1>
          <p>它可能尚未发布，或已经换了一个新的地址。</p>
          <Link href="/blog">
            <ArrowLeft aria-hidden="true" />
            返回博客
          </Link>
        </section>
      </ContentShell>
    );
  }

  return (
    <ContentShell>
      <article className="article-shell glass-card">
        <Link href="/blog" className="article-back">
          <ArrowLeft aria-hidden="true" />
          返回文章列表
        </Link>

        <header className="article-header">
          <span className="post-category">{post.category}</span>
          <h1>{post.title}</h1>
          <p>{post.excerpt}</p>
          <div className="article-meta">
            <span>
              <CalendarDays aria-hidden="true" />
              发布于 {post.publishedAt}
            </span>
            <span>
              <Clock3 aria-hidden="true" />
              阅读约 {post.readingMinutes} 分钟
            </span>
            <span>
              <Folder aria-hidden="true" />
              {post.category}
            </span>
          </div>
        </header>

        <div className="article-cover">
          <img src={post.coverImage} alt="" />
        </div>

        <div className="markdown-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
        </div>

        <footer className="article-footer">
          <div>
            <Hash aria-hidden="true" />
            {post.tags.map((tag) => (
              <Link key={tag} href={'/blog?tag=' + encodeURIComponent(tag)}>
                {tag}
              </Link>
            ))}
          </div>
          <p>最后更新于 {post.updatedAt}</p>
        </footer>
      </article>
    </ContentShell>
  );
}

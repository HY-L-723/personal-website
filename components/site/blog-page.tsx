'use client';

import Link from 'next/link';
import {
  BookOpenText,
  CalendarDays,
  Clock3,
  Hash,
  Pin,
  Search,
  Sparkles,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { ContentShell } from '@/components/site/content-shell';
import { PageBanner } from '@/components/site/page-banner';
import { Input } from '@/components/ui/input';
import { useSiteData } from '@/components/site/data-provider';
import { cn } from '@/lib/utils';

export function BlogPage() {
  const { data } = useSiteData();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('全部');
  const publishedPosts = data.posts.filter((post) => post.published);
  const categories = [
    '全部',
    ...Array.from(new Set(publishedPosts.map((post) => post.category))),
  ];
  const tags = Array.from(new Set(publishedPosts.flatMap((post) => post.tags)));

  useEffect(() => {
    const tag = searchParams.get('tag');
    if (tag) setQuery(tag);
  }, [searchParams]);

  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return publishedPosts
      .filter((post) => category === '全部' || post.category === category)
      .filter(
        (post) =>
          !normalizedQuery ||
          [post.title, post.excerpt, post.tags.join(' ')]
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery),
      )
      .sort((a, b) => Number(b.pinned) - Number(a.pinned));
  }, [category, publishedPosts, query]);

  return (
    <ContentShell>
      <PageBanner
        eyebrow="PVL NOTES · BLOG"
        title="文字是时间留下的坐标"
        description="记录学习所得，也收藏生活中微小而明亮的瞬间。"
        icon={<BookOpenText />}
      />

      <div className="blog-layout">
        <aside className="blog-sidebar">
          <section className="profile-card glass-card">
            <img src={data.settings.avatar} alt={data.settings.nickname + ' 的头像'} />
            <h2>{data.settings.nickname}</h2>
            <p>{data.settings.role}</p>
            <blockquote>{data.settings.tagline}</blockquote>
            <div className="profile-numbers">
              <span>
                <strong>{publishedPosts.length}</strong>
                文章
              </span>
              <span>
                <strong>{tags.length}</strong>
                标签
              </span>
              <span>
                <strong>{categories.length - 1}</strong>
                分类
              </span>
            </div>
          </section>

          <section className="sidebar-card glass-card">
            <h3>
              <Sparkles aria-hidden="true" />
              最近更新
            </h3>
            {publishedPosts.slice(0, 3).map((post) => (
              <Link key={post.id} href={'/blog/' + post.slug}>
                <span>{post.title}</span>
                <small>{post.updatedAt}</small>
              </Link>
            ))}
          </section>

          <section className="sidebar-card glass-card">
            <h3>
              <Hash aria-hidden="true" />
              标签云
            </h3>
            <div className="tag-cloud">
              {tags.map((tag) => (
                <button key={tag} type="button" onClick={() => setQuery(tag)}>
                  #{tag}
                </button>
              ))}
            </div>
          </section>
        </aside>

        <div className="blog-feed">
          <div className="blog-toolbar glass-card">
            <div className="blog-search">
              <Search aria-hidden="true" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索文章标题或标签"
                aria-label="搜索文章"
              />
            </div>
            <div className="category-pills" aria-label="文章分类筛选">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={cn(category === item && 'is-active')}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <p className="feed-summary">
            找到 <strong>{filteredPosts.length}</strong> 篇文章
          </p>

          <div className="post-list">
            {filteredPosts.map((post, index) => (
              <article
                key={post.id}
                className={cn(
                  'post-card glass-card',
                  index % 2 === 1 && 'post-card-reverse',
                )}
              >
                <Link
                  href={'/blog/' + post.slug}
                  className="post-cover"
                  aria-label={'阅读《' + post.title + '》'}
                >
                  <img src={post.coverImage} alt="" />
                  {post.pinned && (
                    <span className="pin-label">
                      <Pin aria-hidden="true" />
                      置顶
                    </span>
                  )}
                </Link>
                <div className="post-card-body">
                  <span className="post-category">{post.category}</span>
                  <h2>
                    <Link href={'/blog/' + post.slug}>{post.title}</Link>
                  </h2>
                  <p>{post.excerpt}</p>
                  <div className="post-meta">
                    <span>
                      <CalendarDays aria-hidden="true" />
                      {post.publishedAt}
                    </span>
                    <span>
                      <Clock3 aria-hidden="true" />
                      {post.readingMinutes} 分钟
                    </span>
                  </div>
                  <div className="post-tags">
                    {post.tags.map((tag) => (
                      <button key={tag} type="button" onClick={() => setQuery(tag)}>
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>

          {filteredPosts.length === 0 && (
            <div className="no-results glass-card">
              <BookOpenText aria-hidden="true" />
              <h2>这里暂时没有相符的文章</h2>
              <p>换一个关键词或分类，也许会遇见新的内容。</p>
            </div>
          )}
        </div>
      </div>
    </ContentShell>
  );
}

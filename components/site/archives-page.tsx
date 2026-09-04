'use client';

import Link from 'next/link';
import {
  Archive,
  CalendarDays,
  FolderTree,
  Hash,
  Layers3,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { ContentShell } from '@/components/site/content-shell';
import { PageBanner } from '@/components/site/page-banner';
import { useSiteData } from '@/components/site/data-provider';
import { cn } from '@/lib/utils';

type Filter = { type: 'all' } | { type: 'category' | 'tag'; value: string };

export function ArchivesPage() {
  const { data } = useSiteData();
  const [filter, setFilter] = useState<Filter>({ type: 'all' });
  const posts = data.posts
    .filter((post) => post.published)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  const categories = useMemo(
    () =>
      Array.from(new Set(posts.map((post) => post.category))).map((name) => ({
        name,
        count: posts.filter((post) => post.category === name).length,
      })),
    [posts],
  );

  const tags = useMemo(
    () =>
      Array.from(new Set(posts.flatMap((post) => post.tags))).map((name) => ({
        name,
        count: posts.filter((post) => post.tags.includes(name)).length,
      })),
    [posts],
  );

  const visiblePosts = posts.filter((post) => {
    if (filter.type === 'all') return true;
    if (filter.type === 'category') return post.category === filter.value;
    return post.tags.includes(filter.value);
  });

  const groupedByYear = visiblePosts.reduce<Record<string, typeof posts>>(
    (groups, post) => {
      const year = post.publishedAt.slice(0, 4);
      groups[year] = groups[year] || [];
      groups[year].push(post);
      return groups;
    },
    {},
  );

  const monthCounts = Array.from({ length: 12 }, (_, index) => {
    const month = String(index + 1).padStart(2, '0');
    return posts.filter((post) => post.publishedAt.slice(5, 7) === month).length;
  });
  const maxMonthCount = Math.max(...monthCounts, 1);

  return (
    <ContentShell>
      <PageBanner
        eyebrow="PVL NOTES · ARCHIVES"
        title={'文章总览 · ' + posts.length}
        description="把散落在时间里的文字，重新放回它们的坐标。"
        icon={<Archive />}
      />

      <section className="archive-overview glass-card">
        <header>
          <div>
            <h2>年度写作轨迹</h2>
            <p>按文章发布日期统计</p>
          </div>
          <span>
            <Layers3 aria-hidden="true" />
            {posts.reduce((total, post) => total + post.content.length, 0)}
            字
          </span>
        </header>
        <div className="archive-bars" aria-label="每月文章数量">
          {monthCounts.map((count, index) => (
            <div key={index}>
              <span>{count || ''}</span>
              <i style={{ height: Math.max((count / maxMonthCount) * 100, 4) + '%' }} />
              <small>{String(index + 1).padStart(2, '0')}月</small>
            </div>
          ))}
        </div>
      </section>

      <div className="archive-filter-grid">
        <section className="archive-filter-card glass-card">
          <h2>
            <FolderTree aria-hidden="true" />
            分类
          </h2>
          <div>
            <button
              type="button"
              className={cn(filter.type === 'all' && 'is-active')}
              onClick={() => setFilter({ type: 'all' })}
            >
              全部文章 <span>{posts.length}</span>
            </button>
            {categories.map((item) => (
              <button
                key={item.name}
                type="button"
                className={cn(
                  filter.type === 'category' &&
                    filter.value === item.name &&
                    'is-active',
                )}
                onClick={() =>
                  setFilter({ type: 'category', value: item.name })
                }
              >
                {item.name} <span>{item.count}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="archive-filter-card glass-card">
          <h2>
            <Hash aria-hidden="true" />
            标签
          </h2>
          <div>
            {tags.map((item) => (
              <button
                key={item.name}
                type="button"
                className={cn(
                  filter.type === 'tag' &&
                    filter.value === item.name &&
                    'is-active',
                )}
                onClick={() => setFilter({ type: 'tag', value: item.name })}
              >
                #{item.name} <span>{item.count}</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <section className="archive-timeline">
        {Object.entries(groupedByYear)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([year, yearPosts]) => (
            <div key={year} className="archive-year">
              <header>
                <span>{year}</span>
                <small>{yearPosts.length} 篇记录</small>
              </header>
              <div className="archive-entry-grid">
                {yearPosts.map((post, index) => (
                  <Link
                    key={post.id}
                    href={'/blog/' + post.slug}
                    className="archive-entry glass-card"
                  >
                    <img src={post.coverImage} alt="" />
                    <div>
                      <span>{post.category}</span>
                      <h3>{post.title}</h3>
                      <p>
                        <CalendarDays aria-hidden="true" />
                        {post.publishedAt}
                      </p>
                    </div>
                    <strong>{String(yearPosts.length - index).padStart(2, '0')}</strong>
                  </Link>
                ))}
              </div>
            </div>
          ))}
      </section>
    </ContentShell>
  );
}

'use client';

import Link from 'next/link';
import { BookOpenText, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSiteData } from '@/components/site/data-provider';

export function SearchDialog() {
  const { data } = useSiteData();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!normalizedQuery) return [];
    return data.posts
      .filter((post) => post.published)
      .filter((post) =>
        [
          post.title,
          post.excerpt,
          post.category,
          post.tags.join(' '),
          post.content,
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery),
      )
      .slice(0, 8);
  }, [data.posts, normalizedQuery]);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="header-icon-button"
        onClick={() => setOpen(true)}
        aria-label="搜索全站内容"
        title="搜索"
      >
        <Search />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="search-dialog">
          <DialogHeader>
            <DialogTitle>搜索 PVL随记</DialogTitle>
            <DialogDescription>
              输入标题、分类、标签或正文中的关键词。
            </DialogDescription>
          </DialogHeader>
          <div className="search-input-wrap">
            <Search aria-hidden="true" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="例如：学习、生活、前端"
            />
          </div>
          <div className="search-results" aria-live="polite">
            {!normalizedQuery && (
              <p className="search-empty">开始输入，寻找你感兴趣的内容。</p>
            )}
            {!!normalizedQuery && results.length === 0 && (
              <p className="search-empty">没有找到相关内容，换个关键词试试。</p>
            )}
            {results.map((post) => (
              <Link
                key={post.id}
                href={'/blog/' + post.slug}
                className="search-result"
                onClick={() => setOpen(false)}
              >
                <span>
                  <BookOpenText aria-hidden="true" />
                </span>
                <div>
                  <strong>{post.title}</strong>
                  <small>
                    {post.category} · {post.tags.join(' / ')}
                  </small>
                </div>
              </Link>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

'use client';

import { Feather, Heart, Image as ImageIcon, MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ContentShell } from '@/components/site/content-shell';
import { PageBanner } from '@/components/site/page-banner';
import { useSiteData } from '@/components/site/data-provider';
import { cn } from '@/lib/utils';

const LIKED_KEY = 'pvl-notes:liked-moments';

export function MomentsPage() {
  const { data, updateData } = useSiteData();
  const [liked, setLiked] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LIKED_KEY);
      if (stored) setLiked(JSON.parse(stored) as string[]);
    } catch {
      setLiked([]);
    }
  }, []);

  function toggleLike(id: string) {
    const isLiked = liked.includes(id);
    const nextLiked = isLiked
      ? liked.filter((item) => item !== id)
      : [...liked, id];
    setLiked(nextLiked);
    window.localStorage.setItem(LIKED_KEY, JSON.stringify(nextLiked));
    updateData((current) => ({
      ...current,
      moments: current.moments.map((moment) =>
        moment.id === id
          ? { ...moment, likes: Math.max(0, moment.likes + (isLiked ? -1 : 1)) }
          : moment,
      ),
    }));
  }

  return (
    <ContentShell>
      <PageBanner
        eyebrow="PVL NOTES · MOMENTS"
        title="随笔随心"
        description="不必成为文章的片段，也值得拥有自己的位置。"
        icon={<Feather />}
      />

      <div className="moments-heading">
        <div>
          <span>{data.settings.nickname}</span>
          <h2>正在记录生活</h2>
        </div>
        <p>{data.moments.length} 条随笔</p>
      </div>

      <section className="moments-timeline">
        {data.moments
          .slice()
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .map((moment, index) => (
            <article key={moment.id} className="moment-item">
              <div className="moment-line" aria-hidden="true">
                <span>{String(index + 1).padStart(2, '0')}</span>
              </div>
              <div className="moment-card glass-card">
                <header>
                  <img
                    src={data.settings.avatar}
                    alt={data.settings.nickname + ' 的头像'}
                  />
                  <div>
                    <strong>{data.settings.nickname}</strong>
                    <time dateTime={moment.createdAt}>
                      {new Date(moment.createdAt).toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </time>
                  </div>
                </header>
                <p>{moment.content}</p>
                {moment.images.length > 0 && (
                  <div
                    className={cn(
                      'moment-images',
                      moment.images.length === 1 && 'moment-images-single',
                    )}
                  >
                    {moment.images.map((image) => (
                      <img key={image} src={image} alt="随笔配图" />
                    ))}
                  </div>
                )}
                <footer>
                  <span>
                    <ImageIcon aria-hidden="true" />
                    {moment.images.length} 张图片
                  </span>
                  <div>
                    <button
                      type="button"
                      className={cn(liked.includes(moment.id) && 'is-liked')}
                      onClick={() => toggleLike(moment.id)}
                      aria-pressed={liked.includes(moment.id)}
                    >
                      <Heart aria-hidden="true" />
                      {moment.likes}
                    </button>
                    <span>
                      <MessageCircle aria-hidden="true" />0
                    </span>
                  </div>
                </footer>
              </div>
            </article>
          ))}
      </section>
    </ContentShell>
  );
}

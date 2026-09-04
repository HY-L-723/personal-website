'use client';

import Link from 'next/link';
import { Code2, Heart } from 'lucide-react';
import { AmbientEffects } from '@/components/site/ambient-effects';
import { SiteHeader } from '@/components/site/site-header';
import { useSiteData } from '@/components/site/data-provider';
import type { ReactNode } from 'react';

export function ContentShell({ children }: { children: ReactNode }) {
  const { data } = useSiteData();

  return (
    <div className="content-page">
      <div className="content-background-wrap" aria-hidden="true">
        <img
          src={data.settings.contentBackground}
          alt=""
          className="content-background"
        />
        <div className="content-background-wash" />
      </div>
      <div className="content-effects">
        <AmbientEffects />
      </div>
      <SiteHeader />
      <main className="content-main">{children}</main>
      <footer className="site-footer">
        <div>
          <Link href="/" className="footer-brand">
            <span>{data.settings.siteName}</span>
            <small>{data.settings.tagline}</small>
          </Link>
          <p>
            由 PVL 用
            <Heart aria-hidden="true" />
            记录 · 数据暂存于你的浏览器
          </p>
        </div>
        <a
          href="https://github.com/HY-L-723/personal-website"
          target="_blank"
          rel="noreferrer"
        >
          <Code2 aria-hidden="true" />
          查看源码
        </a>
      </footer>
    </div>
  );
}

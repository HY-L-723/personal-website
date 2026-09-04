'use client';

import Link from 'next/link';
import {
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Code2,
  RefreshCw,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { AmbientEffects } from '@/components/site/ambient-effects';
import { SiteHeader } from '@/components/site/site-header';
import { Button } from '@/components/ui/button';
import { useSiteData } from '@/components/site/data-provider';

const quotes = [
  ['星光不问赶路人，时光不负有心人。', '佚名'],
  ['种一棵树最好的时间是十年前，其次是现在。', '古谚'],
  ['且听风吟，静待花开。', '佚名'],
  ['山高路远，看世界，也找自己。', '佚名'],
];

export function HeroPage() {
  const { data } = useSiteData();
  const [slide, setSlide] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const slides = useMemo(
    () => [
      {
        src: data.settings.heroBackground,
        alt: '薄雾笼罩的深绿色山林与湖面',
      },
      {
        src: data.settings.contentBackground,
        alt: '明亮夏日公园中的二次元插画',
      },
    ],
    [data.settings.contentBackground, data.settings.heroBackground],
  );

  function changeSlide(direction: number) {
    setSlide((current) => (current + direction + slides.length) % slides.length);
  }

  function refreshQuote() {
    setQuoteIndex((current) => (current + 1) % quotes.length);
  }

  return (
    <main className="hero-page">
      <div className="hero-backgrounds" aria-hidden="true">
        {slides.map((item, index) => (
          <img
            key={item.src}
            src={item.src}
            alt=""
            className={index === slide ? 'hero-bg hero-bg-active' : 'hero-bg'}
          />
        ))}
      </div>
      <div className="hero-vignette" aria-hidden="true" />
      <AmbientEffects />
      <SiteHeader transparent />

      <Button
        variant="ghost"
        size="icon-lg"
        className="hero-arrow hero-arrow-left"
        onClick={() => changeSlide(-1)}
        aria-label="上一张背景"
      >
        <ChevronLeft />
      </Button>
      <Button
        variant="ghost"
        size="icon-lg"
        className="hero-arrow hero-arrow-right"
        onClick={() => changeSlide(1)}
        aria-label="下一张背景"
      >
        <ChevronRight />
      </Button>

      <section className="hero-content" aria-label="网站介绍">
        <div className="hero-avatar-ring">
          <img src={data.settings.avatar} alt={data.settings.nickname + ' 的头像'} />
        </div>
        <p className="hero-eyebrow">HI THERE · WELCOME TO MY WORLD</p>
        <h1>
          欢迎来到
          <span>{data.settings.siteName}</span>
          <i aria-hidden="true" />
        </h1>
        <p className="hero-tagline">{data.settings.tagline}</p>

        <div className="hero-quote glass-card">
          <div>
            <p>{quotes[quoteIndex][0]}</p>
            <small>— {quotes[quoteIndex][1]}</small>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={refreshQuote}
            aria-label="换一句"
            title="换一句"
          >
            <RefreshCw />
          </Button>
        </div>

        <div className="hero-links">
          <Link href="/blog" className="hero-primary-link">
            开始阅读
            <ArrowDown aria-hidden="true" />
          </Link>
          <a
            href="https://github.com/HY-L-723/personal-website"
            target="_blank"
            rel="noreferrer"
            className="hero-secondary-link"
          >
            <Code2 aria-hidden="true" />
            GitHub
          </a>
        </div>
      </section>

      <div className="hero-pagination" aria-label="背景选择">
        {slides.map((item, index) => (
          <button
            key={item.src}
            type="button"
            className={index === slide ? 'is-active' : ''}
            onClick={() => setSlide(index)}
            aria-label={'切换到第 ' + (index + 1) + ' 张背景'}
            aria-current={index === slide}
          />
        ))}
      </div>

      <Link href="/blog" className="scroll-cue">
        <span>向下探索</span>
        <ArrowDown aria-hidden="true" />
      </Link>
    </main>
  );
}

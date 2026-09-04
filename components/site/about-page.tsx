'use client';

import { BookOpen, Code2, Compass, GraduationCap, Mail, MapPin, Sparkles } from 'lucide-react';
import { ContentShell } from '@/components/site/content-shell';
import { PageBanner } from '@/components/site/page-banner';
import { useSiteData } from '@/components/site/data-provider';

export function AboutPage() {
  const { data } = useSiteData();
  const publishedPosts = data.posts.filter((post) => post.published);
  const wordCount = publishedPosts.reduce(
    (sum, post) => sum + post.content.replace(/[#>*_`\-\n]/g, '').length,
    0,
  );

  return (
    <ContentShell>
      <PageBanner
        eyebrow="PVL NOTES · ABOUT"
        title="关于本站"
        description="你好，我是 PVL。欢迎走进这间由兴趣与记录搭成的小屋。"
        icon={<Sparkles />}
      />

      <section className="about-profile">
        <div className="about-identity glass-card">
          <img src={data.settings.avatar} alt={data.settings.nickname + ' 的头像'} />
          <span>这里 · 这里</span>
          <h2>网名 {data.settings.nickname}</h2>
          <p>{data.settings.bio}</p>
          <blockquote>{data.settings.tagline}</blockquote>
        </div>
        <div className="about-pursuit glass-card">
          <small>追求</small>
          <h2>源于<br />乐趣 · 兴趣<br /><strong>学习</strong></h2>
          <Compass />
        </div>
      </section>

      <section className="about-grid">
        <article className="about-stats glass-card">
          <span>小站数据</span><h2>持续记录</h2>
          <div><p><strong>{publishedPosts.length}</strong>篇文章</p><p><strong>{data.moments.length}</strong>条随笔</p><p><strong>{wordCount.toLocaleString('zh-CN')}</strong>累计字数</p><p><strong>{data.albums.length}</strong>本相册</p></div>
        </article>
        <article className="about-location glass-card">
          <div className="about-map-grid" aria-hidden="true"><i /><i /><i /><i /><b><MapPin /></b></div>
          <p><MapPin />我现在住在 {data.settings.location}</p>
        </article>
      </section>

      <section className="about-details glass-card">
        <header><span>MORE ABOUT ME</span><h2>一些关键词</h2></header>
        <div className="about-detail-cards">
          <article><GraduationCap /><small>身份</small><strong>{data.settings.role}</strong><p>保持好奇，也接受成长需要时间。</p></article>
          <article><BookOpen /><small>兴趣</small><strong>{data.settings.interests.join(' · ')}</strong><p>让喜欢的事情成为生活的坐标。</p></article>
          <article><Code2 /><small>正在做</small><strong>建设 PVL随记</strong><p>把模糊的想法一步步变成真实页面。</p></article>
        </div>
        <footer>
          <a href={`mailto:${data.settings.email}`}><Mail />{data.settings.email}</a>
          <a href="https://github.com/HY-L-723/personal-website" target="_blank" rel="noreferrer"><Code2 />GitHub</a>
        </footer>
      </section>
    </ContentShell>
  );
}

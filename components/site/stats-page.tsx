'use client';

import { Bar, BarChart, CartesianGrid, Area, AreaChart, XAxis, YAxis } from 'recharts';
import { BarChart3, CalendarDays, Eye, FileText, PenLine, Tags, UserRound, Waypoints } from 'lucide-react';
import { ContentShell } from '@/components/site/content-shell';
import { PageBanner } from '@/components/site/page-banner';
import { useSiteData } from '@/components/site/data-provider';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';

const visitConfig = {
  views: { label: '浏览量', color: '#0ea5a6' },
  visitors: { label: '访客数', color: '#f97316' },
} satisfies ChartConfig;

const postConfig = {
  posts: { label: '发布文章', color: '#38bdf8' },
} satisfies ChartConfig;

function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function StatsPage() {
  const { data } = useSiteData();
  const posts = data.posts.filter((post) => post.published);
  const categories = new Set(posts.map((post) => post.category)).size;
  const tags = new Set(posts.flatMap((post) => post.tags)).size;
  const words = posts.reduce((total, post) => total + post.content.replace(/[#>*_`\-\n]/g, '').length, 0);
  const today = dateKey();
  const month = today.slice(0, 7);
  const todayVisit = data.visits.find((item) => item.date === today) ?? { visitors: 0, views: 0 };
  const monthVisits = data.visits.filter((item) => item.date.startsWith(month));
  const monthVisitors = monthVisits.reduce((total, item) => total + item.visitors, 0);
  const monthViews = monthVisits.reduce((total, item) => total + item.views, 0);
  const totalVisitors = data.visits.reduce((total, item) => total + item.visitors, 0);
  const totalViews = data.visits.reduce((total, item) => total + item.views, 0);
  const visitTrend = data.visits
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30)
    .map((item) => ({ ...item, label: item.date.slice(5).replace('-', '/') }));

  const postMonths = Array.from({ length: 6 }, (_, index) => {
    const value = new Date();
    value.setDate(1);
    value.setMonth(value.getMonth() - (5 - index));
    const key = `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`;
    return {
      month: `${value.getMonth() + 1}月`,
      posts: posts.filter((post) => post.publishedAt.startsWith(key)).length,
    };
  });

  const contentCards = [
    { label: '文章总数', value: posts.length, icon: FileText },
    { label: '分类数量', value: categories, icon: Waypoints },
    { label: '标签数量', value: tags, icon: Tags },
    { label: '累计字数', value: words.toLocaleString('zh-CN'), icon: PenLine },
  ];
  const visitCards = [
    { label: '今日访客', value: todayVisit.visitors, icon: UserRound },
    { label: '今日浏览', value: todayVisit.views, icon: Eye },
    { label: '本月访客', value: monthVisitors, icon: CalendarDays },
    { label: '本月浏览', value: monthViews, icon: BarChart3 },
    { label: '总访客', value: totalVisitors, icon: UserRound },
    { label: '总浏览', value: totalViews, icon: Eye },
  ];

  return (
    <ContentShell>
      <PageBanner
        eyebrow="PVL NOTES · STATISTICS"
        title="数据统计"
        description="让内容的积累和每一次到访，都有迹可循。"
        icon={<BarChart3 />}
      />

      <aside className="stats-local-note">
        <span>实时本机数据</span>
        当前未接入数据库，访问数据来自此浏览器，不会跨设备汇总。
      </aside>

      <section className="stats-section">
        <header><div><span>CONTENT</span><h2>站点统计</h2></div><p>文章 / 分类 / 标签</p></header>
        <div className="stats-card-grid stats-content-grid">
          {contentCards.map(({ label, value, icon: Icon }) => (
            <article className="stat-card glass-card" key={label}><i><Icon /></i><div><strong>{value}</strong><span>{label}</span></div></article>
          ))}
        </div>
      </section>

      <section className="stats-section">
        <header><div><span>TRAFFIC</span><h2>访问统计</h2></div><p>按本地会话去重</p></header>
        <div className="stats-card-grid stats-visit-grid">
          {visitCards.map(({ label, value, icon: Icon }) => (
            <article className="stat-card glass-card" key={label}><i><Icon /></i><div><strong>{value}</strong><span>{label}</span></div></article>
          ))}
        </div>
      </section>

      <section className="stats-chart-card glass-card">
        <header><div><span>LAST 30 DAYS</span><h2>访问趋势</h2></div><p><b />浏览量 <b />访客数</p></header>
        {visitTrend.length > 0 ? (
          <ChartContainer config={visitConfig} className="stats-chart">
            <AreaChart data={visitTrend} margin={{ left: 4, right: 12, top: 12 }}>
              <defs>
                <linearGradient id="views-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-views)" stopOpacity={0.35} /><stop offset="95%" stopColor="var(--color-views)" stopOpacity={0.02} /></linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="4 4" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} />
              <YAxis tickLine={false} axisLine={false} width={28} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="views" stroke="var(--color-views)" fill="url(#views-fill)" strokeWidth={3} />
              <Area type="monotone" dataKey="visitors" stroke="var(--color-visitors)" fill="transparent" strokeWidth={2} />
            </AreaChart>
          </ChartContainer>
        ) : <p className="stats-empty">浏览几个页面后，这里就会出现真实趋势。</p>}
      </section>

      <section className="stats-chart-card glass-card">
        <header><div><span>RECENT 6 MONTHS</span><h2>文章发布</h2></div><p>按月统计</p></header>
        <ChartContainer config={postConfig} className="stats-chart stats-bar-chart">
          <BarChart data={postMonths} margin={{ left: 4, right: 12, top: 12 }}>
            <CartesianGrid vertical={false} strokeDasharray="4 4" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="posts" fill="var(--color-posts)" radius={[8, 8, 2, 2]} maxBarSize={54} />
          </BarChart>
        </ChartContainer>
      </section>
    </ContentShell>
  );
}

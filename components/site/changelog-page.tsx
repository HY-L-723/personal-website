'use client';

import { CalendarCheck2, Check, GitCommitHorizontal } from 'lucide-react';
import { ContentShell } from '@/components/site/content-shell';
import { PageBanner } from '@/components/site/page-banner';
import { useSiteData } from '@/components/site/data-provider';

export function ChangelogPage() {
  const { data } = useSiteData();
  const entries = data.changelog.slice().sort((a, b) => b.date.localeCompare(a.date));

  return (
    <ContentShell>
      <PageBanner
        eyebrow="PVL NOTES · CHANGELOG"
        title="网站更新日志"
        description="认真记下每一次微小改进，也保留成长的过程。"
        icon={<CalendarCheck2 />}
      />

      <section className="changelog-summary glass-card">
        <GitCommitHorizontal />
        <div><strong>{entries.length}</strong><span>个版本节点</span></div>
        <p>最近更新于 {entries[0]?.date ?? '尚未记录'}</p>
      </section>

      <section className="changelog-list">
        {entries.map((entry, index) => (
          <article className="changelog-entry" key={entry.id}>
            <div className="changelog-marker"><span>{String(index + 1).padStart(2, '0')}</span></div>
            <div className="changelog-card glass-card">
              <header>
                <div><time dateTime={entry.date}>{entry.date}</time><span>v0.{entries.length - index}</span></div>
                {index === 0 && <em>最新</em>}
              </header>
              <ul>
                {entry.changes.map((change) => <li key={change}><Check />{change}</li>)}
              </ul>
            </div>
          </article>
        ))}
      </section>
    </ContentShell>
  );
}

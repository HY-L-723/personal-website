'use client';

import { MapPin, MessageCircle, Pin, Reply, Send, ShieldCheck } from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';
import { ContentShell } from '@/components/site/content-shell';
import { PageBanner } from '@/components/site/page-banner';
import { useSiteData } from '@/components/site/data-provider';
import type { GuestbookEntry } from '@/lib/types';

const bubblePositions = [
  { left: '8%', top: '22%' },
  { left: '55%', top: '13%' },
  { left: '32%', top: '58%' },
  { left: '67%', top: '49%' },
  { left: '17%', top: '73%' },
  { left: '72%', top: '76%' },
];

function uid(prefix: string) {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${prefix}-${Date.now()}`;
}

export function GuestbookPage() {
  const { data, updateData } = useSiteData();
  const [author, setAuthor] = useState('');
  const [location, setLocation] = useState('');
  const [content, setContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyAuthor, setReplyAuthor] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [notice, setNotice] = useState('');

  const entries = useMemo(
    () =>
      data.guestbook.slice().sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.createdAt.localeCompare(a.createdAt);
      }),
    [data.guestbook],
  );

  function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: GuestbookEntry = {
      id: uid('message'),
      author: author.trim(),
      location: location.trim() || '远方',
      content: content.trim(),
      createdAt: new Date().toISOString(),
      pinned: false,
      replies: [],
    };
    updateData((current) => ({ ...current, guestbook: [next, ...current.guestbook] }));
    setAuthor('');
    setLocation('');
    setContent('');
    setNotice('留言已保存到当前浏览器，并加入弹幕墙。');
  }

  function publishReply(event: FormEvent<HTMLFormElement>, entryId: string) {
    event.preventDefault();
    updateData((current) => ({
      ...current,
      guestbook: current.guestbook.map((entry) =>
        entry.id === entryId
          ? {
              ...entry,
              replies: [
                ...entry.replies,
                {
                  id: uid('reply'),
                  author: replyAuthor.trim(),
                  content: replyContent.trim(),
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : entry,
      ),
    }));
    setReplyAuthor('');
    setReplyContent('');
    setReplyingTo(null);
  }

  return (
    <ContentShell>
      <PageBanner
        eyebrow="PVL NOTES · GUESTBOOK"
        title="留言板"
        description="说点什么吧。短短一句，也能成为这座小站的一部分。"
        icon={<MessageCircle />}
      />

      <section className="guest-barrage glass-card">
        <img src={data.settings.heroBackground} alt="" />
        <div className="guest-barrage-wash" />
        <header><span>弹幕墙</span><b>{entries.length}</b></header>
        {entries.slice(0, 6).map((entry, index) => (
          <span className="barrage-bubble" style={bubblePositions[index]} key={entry.id}>
            <i>{entry.author.slice(0, 1).toUpperCase()}</i>
            <strong>{entry.author}</strong>
            <em>{entry.content}</em>
          </span>
        ))}
        <p>每一句真诚的话，都会留下一点微光。</p>
      </section>

      <section className="guest-rules glass-card">
        <ShieldCheck />
        <div>
          <strong>留言规则</strong>
          <p>文明发言；禁止违法、违规和广告内容；单条留言最多 300 字。当前阶段数据仅保存在你的浏览器中。</p>
        </div>
      </section>

      <section className="guest-composer glass-card">
        <div className="guest-avatar">匿</div>
        <form onSubmit={publish}>
          <div className="guest-fields">
            <label>昵称<input required maxLength={24} value={author} onChange={(event) => setAuthor(event.target.value)} placeholder="怎么称呼你" /></label>
            <label>来自哪里<input maxLength={30} value={location} onChange={(event) => setLocation(event.target.value)} placeholder="选填，例如：上海" /></label>
          </div>
          <textarea required maxLength={300} value={content} onChange={(event) => setContent(event.target.value)} placeholder="说点什么，留下你的足迹……" />
          <footer>
            <span>{notice || '无需登录即可留言'}</span>
            <div><small>{content.length}/300</small><button type="submit"><Send />发布留言</button></div>
          </footer>
        </form>
      </section>

      <section className="guest-list">
        <header className="section-heading">
          <div><span>ALL MESSAGES</span><h2>全部留言</h2></div>
          <p>共 {entries.length} 条</p>
        </header>
        {entries.map((entry) => (
          <article className="guest-entry glass-card" key={entry.id}>
            <div className="guest-entry-avatar">{entry.author.slice(0, 1).toUpperCase()}</div>
            <div className="guest-entry-body">
              <header>
                <div><strong>{entry.author}</strong>{entry.pinned && <span><Pin />置顶</span>}<small><MapPin />{entry.location}</small></div>
                <time>{new Date(entry.createdAt).toLocaleString('zh-CN', { dateStyle: 'medium', timeStyle: 'short' })}</time>
              </header>
              <p>{entry.content}</p>
              <button className="guest-reply-toggle" type="button" onClick={() => setReplyingTo(replyingTo === entry.id ? null : entry.id)}><Reply />回复 {entry.replies.length > 0 && `· ${entry.replies.length}`}</button>

              {entry.replies.length > 0 && (
                <div className="guest-replies">
                  {entry.replies.map((reply) => (
                    <div key={reply.id}>
                      <strong>{reply.author}</strong><time>{new Date(reply.createdAt).toLocaleDateString('zh-CN')}</time>
                      <p>{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {replyingTo === entry.id && (
                <form className="guest-reply-form" onSubmit={(event) => publishReply(event, entry.id)}>
                  <input required maxLength={24} value={replyAuthor} onChange={(event) => setReplyAuthor(event.target.value)} placeholder="你的昵称" />
                  <input required maxLength={180} value={replyContent} onChange={(event) => setReplyContent(event.target.value)} placeholder={`回复 ${entry.author}……`} />
                  <button type="submit">发送</button>
                </form>
              )}
            </div>
          </article>
        ))}
      </section>
    </ContentShell>
  );
}

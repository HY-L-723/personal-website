'use client';

import { CheckCircle2, Edit3, ExternalLink, History, Link2, MessageSquare, Pin, Save, Trash2, XCircle } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { useSiteData } from '@/components/site/data-provider';
import type { ChangelogEntry, FriendLink, GuestbookEntry } from '@/lib/types';
import { confirmDelete, localToday, makeId } from '@/components/admin/admin-utils';

const emptyLog = { id: '', date: localToday(), changes: '' };

export function AdminCommunity() {
  const { data, updateData } = useSiteData();
  const [logDraft, setLogDraft] = useState(emptyLog);
  const pending = data.friendLinks.filter((item) => !item.approved);
  const approved = data.friendLinks.filter((item) => item.approved);

  function toggleFriend(friend: FriendLink) {
    updateData((current) => ({ ...current, friendLinks: current.friendLinks.map((item) => item.id === friend.id ? { ...item, approved: !item.approved } : item) }));
  }

  function removeFriend(friend: FriendLink) {
    if (!confirmDelete(friend.name)) return;
    updateData((current) => ({ ...current, friendLinks: current.friendLinks.filter((item) => item.id !== friend.id) }));
  }

  function togglePin(entry: GuestbookEntry) {
    updateData((current) => ({ ...current, guestbook: current.guestbook.map((item) => item.id === entry.id ? { ...item, pinned: !item.pinned } : item) }));
  }

  function removeMessage(entry: GuestbookEntry) {
    if (!confirmDelete(`${entry.author} 的留言`)) return;
    updateData((current) => ({ ...current, guestbook: current.guestbook.filter((item) => item.id !== entry.id) }));
  }

  function saveLog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: ChangelogEntry = {
      id: logDraft.id || makeId('log'),
      date: logDraft.date,
      changes: logDraft.changes.split('\n').map((item) => item.trim()).filter(Boolean),
    };
    updateData((current) => ({
      ...current,
      changelog: logDraft.id
        ? current.changelog.map((item) => item.id === logDraft.id ? next : item)
        : [next, ...current.changelog],
    }));
    setLogDraft(emptyLog);
  }

  function removeLog(entry: ChangelogEntry) {
    if (!confirmDelete(entry.date + ' 的更新日志')) return;
    updateData((current) => ({ ...current, changelog: current.changelog.filter((item) => item.id !== entry.id) }));
  }

  return (
    <div className="admin-workspace">
      <section className="admin-panel">
        <header><div><small>FRIEND REQUESTS</small><h3>友链审核</h3></div><span>{pending.length} 条待处理</span></header>
        {pending.length === 0 && <p className="admin-empty">暂时没有新的友链申请。</p>}
        <div className="admin-friend-list">
          {[...pending, ...approved].map((friend) => (
            <article key={friend.id}>
              <img src={friend.avatar} alt="" />
              <div><strong>{friend.name}</strong><p>{friend.description}</p><a href={friend.url} target="_blank" rel="noreferrer">{friend.url}<ExternalLink /></a></div>
              <span className={friend.approved ? 'is-approved' : ''}>{friend.approved ? '已展示' : '待审核'}</span>
              <div className="admin-row-actions"><button type="button" title={friend.approved ? '撤下' : '通过'} onClick={() => toggleFriend(friend)}>{friend.approved ? <XCircle /> : <CheckCircle2 />}</button><button type="button" className="is-danger" title="删除" onClick={() => removeFriend(friend)}><Trash2 /></button></div>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-panel">
        <header><div><small>GUESTBOOK</small><h3>留言管理</h3></div><MessageSquare /></header>
        <div className="admin-message-list">
          {data.guestbook.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((entry) => (
            <article key={entry.id}>
              <div className="admin-message-avatar">{entry.author.slice(0, 1)}</div>
              <div><div><strong>{entry.author}</strong>{entry.pinned && <em><Pin />置顶</em>}<small>{entry.location} · {new Date(entry.createdAt).toLocaleDateString('zh-CN')}</small></div><p>{entry.content}</p><span>{entry.replies.length} 条回复</span></div>
              <div className="admin-row-actions"><button type="button" title="切换置顶" onClick={() => togglePin(entry)}><Pin /></button><button type="button" className="is-danger" title="删除" onClick={() => removeMessage(entry)}><Trash2 /></button></div>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-two-column admin-log-area">
        <form className="admin-panel admin-editor" onSubmit={saveLog}>
          <header><div><small>CHANGELOG EDITOR</small><h3>{logDraft.id ? '编辑日志' : '添加日志'}</h3></div><History /></header>
          <label>日期<input required type="date" value={logDraft.date} onChange={(e) => setLogDraft({ ...logDraft, date: e.target.value })} /></label>
          <label>更新内容<textarea required rows={7} value={logDraft.changes} onChange={(e) => setLogDraft({ ...logDraft, changes: e.target.value })} placeholder={'每行填写一项更新\n例如：优化移动端导航'} /><small>一行一项</small></label>
          <footer>{logDraft.id && <button type="button" className="admin-button-secondary" onClick={() => setLogDraft(emptyLog)}>取消</button>}<button type="submit" className="admin-button-primary"><Save />保存日志</button></footer>
        </form>
        <section className="admin-panel">
          <header><div><small>CHANGELOG</small><h3>日志列表</h3></div><span>{data.changelog.length} 条</span></header>
          <div className="admin-log-list">
            {data.changelog.slice().sort((a, b) => b.date.localeCompare(a.date)).map((entry) => (
              <article key={entry.id}><time>{entry.date}</time><div>{entry.changes.map((change) => <p key={change}>{change}</p>)}</div><div className="admin-row-actions"><button type="button" onClick={() => setLogDraft({ id: entry.id, date: entry.date, changes: entry.changes.join('\n') })}><Edit3 /></button><button type="button" className="is-danger" onClick={() => removeLog(entry)}><Trash2 /></button></div></article>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}

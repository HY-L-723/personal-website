'use client';

import { Edit3, Feather, Heart, Image as ImageIcon, Plus, Save, Trash2, X } from 'lucide-react';
import { type SubmitEvent, useState } from 'react';
import { useSiteData } from '@/components/site/data-provider';
import type { Moment } from '@/lib/types';
import { confirmDelete, makeId } from '@/components/admin/admin-utils';

interface MomentDraft { id: string; content: string; images: string; likes: number; createdAt: string }

function freshMoment(): MomentDraft {
  return { id: '', content: '', images: '', likes: 0, createdAt: new Date().toISOString() };
}

export function AdminMoments() {
  const { data, updateData } = useSiteData();
  const [draft, setDraft] = useState<MomentDraft>(() => freshMoment());
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState('');

  function save(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Moment = {
      id: draft.id || makeId('moment'),
      content: draft.content.trim(),
      images: draft.images.split(/[\n,，]/).map((image) => image.trim()).filter(Boolean),
      likes: Math.max(0, Number(draft.likes) || 0),
      createdAt: draft.createdAt || new Date().toISOString(),
    };
    updateData((current) => ({
      ...current,
      moments: draft.id
        ? current.moments.map((moment) => moment.id === draft.id ? next : moment)
        : [next, ...current.moments],
    }));
    setNotice(draft.id ? '随笔修改已保存。' : '随笔已发布。');
    setDraft(freshMoment());
    setEditing(false);
  }

  function startEdit(moment: Moment) {
    setDraft({ ...moment, images: moment.images.join('\n') });
    setEditing(true);
    setNotice('');
  }

  function remove(moment: Moment) {
    if (!confirmDelete(moment.content.slice(0, 18))) return;
    updateData((current) => ({ ...current, moments: current.moments.filter((item) => item.id !== moment.id) }));
  }

  return (
    <div className="admin-workspace">
      <section className="admin-page-actions">
        <div><p>发布适合短记录的图文动态，图片地址支持逗号或换行分隔。</p>{notice && <span>{notice}</span>}</div>
        <button type="button" className="admin-button-primary" onClick={() => { setDraft(freshMoment()); setEditing(true); }}><Plus />发布随笔</button>
      </section>

      {editing && (
        <form className="admin-panel admin-editor admin-moment-editor" onSubmit={save}>
          <header><div><small>QUICK NOTE</small><h3>{draft.id ? '编辑随笔' : '记录此刻'}</h3></div><button type="button" className="admin-icon-button" onClick={() => setEditing(false)}><X /></button></header>
          <label>随笔内容<textarea required maxLength={800} rows={6} value={draft.content} onChange={(event) => setDraft({ ...draft, content: event.target.value })} placeholder="写下一件值得记住的小事……" /><small>{draft.content.length}/800</small></label>
          <label>图片地址<textarea rows={3} value={draft.images} onChange={(event) => setDraft({ ...draft, images: event.target.value })} placeholder="/images/example.jpg" /></label>
          <div className="admin-form-grid"><label>点赞数<input min={0} type="number" value={draft.likes} onChange={(event) => setDraft({ ...draft, likes: Number(event.target.value) })} /></label><label>发布时间<input type="datetime-local" value={draft.createdAt.slice(0, 16)} onChange={(event) => setDraft({ ...draft, createdAt: new Date(event.target.value).toISOString() })} /></label></div>
          <footer><button type="button" className="admin-button-secondary" onClick={() => setEditing(false)}>取消</button><button type="submit" className="admin-button-primary"><Save />保存随笔</button></footer>
        </form>
      )}

      <section className="admin-panel">
        <header><div><small>MOMENTS</small><h3>随笔列表</h3></div><span>{data.moments.length} 条</span></header>
        <div className="admin-moment-list">
          {data.moments.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((moment) => (
            <article key={moment.id}>
              <div className="admin-moment-avatar"><Feather /></div>
              <div><p>{moment.content}</p><span><time>{new Date(moment.createdAt).toLocaleString('zh-CN')}</time><em><ImageIcon />{moment.images.length}</em><em><Heart />{moment.likes}</em></span></div>
              <div className="admin-row-actions"><button type="button" onClick={() => startEdit(moment)}><Edit3 /></button><button type="button" className="is-danger" onClick={() => remove(moment)}><Trash2 /></button></div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

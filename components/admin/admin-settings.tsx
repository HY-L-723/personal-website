'use client';

import { Image as ImageIcon, RotateCcw, Save } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { useSiteData } from '@/components/site/data-provider';
import type { SiteSettings } from '@/lib/types';

const textFields: { key: keyof SiteSettings; label: string; hint?: string; type?: string }[] = [
  { key: 'siteName', label: '网站名称' },
  { key: 'nickname', label: '昵称' },
  { key: 'tagline', label: '一句话简介' },
  { key: 'role', label: '职业或身份' },
  { key: 'location', label: '所在地' },
  { key: 'email', label: '联系邮箱', type: 'email' },
  { key: 'heroQuote', label: '首页句子' },
  { key: 'heroQuoteAuthor', label: '句子作者' },
];

export function AdminSettings() {
  const { data, ready, updateData } = useSiteData();
  const [draft, setDraft] = useState<SiteSettings>(data.settings);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (ready && !dirty) setDraft(data.settings);
  }, [data.settings, dirty, ready]);

  function change<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setDirty(true);
    setSaved(false);
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateData((current) => ({ ...current, settings: draft }));
    setDirty(false);
    setSaved(true);
  }

  function restore() {
    setDraft(data.settings);
    setDirty(false);
    setSaved(false);
  }

  return (
    <form className="admin-workspace" onSubmit={save}>
      <section className="admin-panel admin-settings-preview">
        <div><small>IDENTITY</small><h3>站点名片</h3><p>这些信息会同步显示在首页、关于页和页面底部。</p></div>
        <div className="admin-mini-profile"><img src={draft.avatar} alt="头像预览" /><span><strong>{draft.siteName}</strong><small>{draft.nickname} · {draft.role}</small><em>{draft.tagline}</em></span></div>
      </section>

      <section className="admin-panel">
        <header><div><small>BASIC INFORMATION</small><h3>基本资料</h3></div><span>中文为默认语言</span></header>
        <div className="admin-form-grid">
          {textFields.map((field) => (
            <label key={field.key}>{field.label}<input required type={field.type ?? 'text'} value={String(draft[field.key])} onChange={(event) => change(field.key, event.target.value as never)} /></label>
          ))}
          <label className="admin-field-wide">个人简介<textarea required rows={4} value={draft.bio} onChange={(event) => change('bio', event.target.value)} /></label>
          <label className="admin-field-wide">兴趣标签<input value={draft.interests.join('，')} onChange={(event) => change('interests', event.target.value.split(/[，,]/).map((item) => item.trim()).filter(Boolean))} /><small>使用中文或英文逗号分隔</small></label>
        </div>
      </section>

      <section className="admin-panel">
        <header><div><small>VISUAL ASSETS</small><h3>视觉素材</h3></div><ImageIcon /></header>
        <div className="admin-form-grid">
          <label className="admin-field-wide">头像地址<input required type="text" value={draft.avatar} onChange={(event) => change('avatar', event.target.value)} /></label>
          <label className="admin-field-wide">首页背景图<input required type="text" value={draft.heroBackground} onChange={(event) => change('heroBackground', event.target.value)} /></label>
          <label className="admin-field-wide">内容页背景图<input required type="text" value={draft.contentBackground} onChange={(event) => change('contentBackground', event.target.value)} /></label>
        </div>
        <div className="admin-asset-preview"><img src={draft.heroBackground} alt="首页背景预览" /><img src={draft.contentBackground} alt="内容页背景预览" /></div>
      </section>

      <footer className="admin-sticky-actions">
        <span>{saved ? '设置已保存' : dirty ? '有未保存的修改' : '当前内容已同步'}</span>
        <button type="button" className="admin-button-secondary" onClick={restore} disabled={!dirty}><RotateCcw />撤销修改</button>
        <button type="submit" className="admin-button-primary" disabled={!dirty}><Save />保存设置</button>
      </footer>
    </form>
  );
}

'use client';

import { Edit3, Eye, EyeOff, FilePlus2, Pin, Save, Trash2, X } from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';
import { useSiteData } from '@/components/site/data-provider';
import type { Post } from '@/lib/types';
import { confirmDelete, localToday, makeId } from '@/components/admin/admin-utils';

interface PostDraft {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  tags: string;
  publishedAt: string;
  readingMinutes: number;
  pinned: boolean;
  published: boolean;
}

function emptyDraft(): PostDraft {
  return {
    id: '', title: '', slug: '', excerpt: '', content: '# 新文章\n\n从这里开始记录……',
    coverImage: '/images/hero-bg.jpg', category: '杂记', tags: '',
    publishedAt: localToday(), readingMinutes: 3, pinned: false, published: true,
  };
}

function toDraft(post: Post): PostDraft {
  return { ...post, tags: post.tags.join('，') };
}

export function AdminPosts() {
  const { data, updateData } = useSiteData();
  const [draft, setDraft] = useState<PostDraft>(() => emptyDraft());
  const [showEditor, setShowEditor] = useState(false);
  const [notice, setNotice] = useState('');
  const posts = useMemo(() => data.posts.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [data.posts]);

  function update<K extends keyof PostDraft>(key: K, value: PostDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function resetEditor() {
    setDraft(emptyDraft());
    setShowEditor(false);
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedSlug = (draft.slug.trim() || `post-${Date.now()}`)
      .toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\u4e00-\u9fa5-]/g, '');
    const existing = data.posts.find((post) => post.id === draft.id);
    const nextPost: Post = {
      id: draft.id || makeId('post'),
      title: draft.title.trim(),
      slug: normalizedSlug,
      excerpt: draft.excerpt.trim(),
      content: draft.content,
      coverImage: draft.coverImage.trim(),
      category: draft.category.trim(),
      tags: draft.tags.split(/[，,]/).map((tag) => tag.trim()).filter(Boolean),
      publishedAt: draft.publishedAt,
      updatedAt: localToday(),
      readingMinutes: Math.max(1, Number(draft.readingMinutes) || 1),
      pinned: draft.pinned,
      published: draft.published,
    };
    updateData((current) => ({
      ...current,
      posts: existing
        ? current.posts.map((post) => post.id === existing.id ? nextPost : post)
        : [nextPost, ...current.posts],
    }));
    setNotice(existing ? '文章修改已保存。' : '新文章已创建。');
    resetEditor();
  }

  function edit(post: Post) {
    setDraft(toDraft(post));
    setShowEditor(true);
    setNotice('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function remove(post: Post) {
    if (!confirmDelete(post.title)) return;
    updateData((current) => ({ ...current, posts: current.posts.filter((item) => item.id !== post.id) }));
  }

  function togglePublish(post: Post) {
    updateData((current) => ({
      ...current,
      posts: current.posts.map((item) => item.id === post.id ? { ...item, published: !item.published, updatedAt: localToday() } : item),
    }));
  }

  return (
    <div className="admin-workspace">
      <section className="admin-page-actions">
        <div><p>支持 Markdown 正文、分类、标签、置顶与草稿状态。</p>{notice && <span>{notice}</span>}</div>
        <button type="button" className="admin-button-primary" onClick={() => { setDraft(emptyDraft()); setShowEditor(true); }}><FilePlus2 />新建文章</button>
      </section>

      {showEditor && (
        <form className="admin-panel admin-editor" onSubmit={save}>
          <header><div><small>MARKDOWN EDITOR</small><h3>{draft.id ? '编辑文章' : '新建文章'}</h3></div><button type="button" className="admin-icon-button" onClick={resetEditor}><X /></button></header>
          <div className="admin-form-grid">
            <label className="admin-field-wide">文章标题<input required value={draft.title} onChange={(e) => update('title', e.target.value)} placeholder="输入一个清晰的标题" /></label>
            <label>访问路径<input value={draft.slug} onChange={(e) => update('slug', e.target.value)} placeholder="留空自动生成" /><small>/blog/your-slug</small></label>
            <label>分类<input required value={draft.category} onChange={(e) => update('category', e.target.value)} /></label>
            <label className="admin-field-wide">摘要<textarea required rows={2} value={draft.excerpt} onChange={(e) => update('excerpt', e.target.value)} /></label>
            <label className="admin-field-wide">Markdown 正文<textarea required className="admin-markdown-input" rows={15} value={draft.content} onChange={(e) => update('content', e.target.value)} spellCheck={false} /></label>
            <label className="admin-field-wide">封面地址<input required value={draft.coverImage} onChange={(e) => update('coverImage', e.target.value)} /></label>
            <label>标签<input value={draft.tags} onChange={(e) => update('tags', e.target.value)} placeholder="学习，生活" /></label>
            <label>发布日期<input required type="date" value={draft.publishedAt} onChange={(e) => update('publishedAt', e.target.value)} /></label>
            <label>阅读时间（分钟）<input required min={1} type="number" value={draft.readingMinutes} onChange={(e) => update('readingMinutes', Number(e.target.value))} /></label>
            <div className="admin-checks"><label><input type="checkbox" checked={draft.published} onChange={(e) => update('published', e.target.checked)} />公开发布</label><label><input type="checkbox" checked={draft.pinned} onChange={(e) => update('pinned', e.target.checked)} />置顶文章</label></div>
          </div>
          <footer><button type="button" className="admin-button-secondary" onClick={resetEditor}>取消</button><button type="submit" className="admin-button-primary"><Save />保存文章</button></footer>
        </form>
      )}

      <section className="admin-panel">
        <header><div><small>ALL POSTS</small><h3>文章列表</h3></div><span>{posts.length} 篇</span></header>
        <div className="admin-content-list">
          {posts.map((post) => (
            <article key={post.id}>
              <img src={post.coverImage} alt="" />
              <div className="admin-content-copy">
                <div><strong>{post.title}</strong>{post.pinned && <em><Pin />置顶</em>}{!post.published && <em className="is-draft">草稿</em>}</div>
                <p>{post.excerpt}</p>
                <small>{post.category} · {post.tags.join(' / ') || '无标签'} · 更新于 {post.updatedAt}</small>
              </div>
              <div className="admin-row-actions">
                <button type="button" title={post.published ? '转为草稿' : '发布'} onClick={() => togglePublish(post)}>{post.published ? <Eye /> : <EyeOff />}</button>
                <button type="button" title="编辑" onClick={() => edit(post)}><Edit3 /></button>
                <button type="button" className="is-danger" title="删除" onClick={() => remove(post)}><Trash2 /></button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

'use client';

import { CheckCircle2, ExternalLink, Link2, Send, Sparkles } from 'lucide-react';
import { type SubmitEvent, useState } from 'react';
import { ContentShell } from '@/components/site/content-shell';
import { PageBanner } from '@/components/site/page-banner';
import { useSiteData } from '@/components/site/data-provider';

const emptyForm = { name: '', description: '', url: '', avatar: '' };

export function FriendsPage() {
  const { data, updateData } = useSiteData();
  const [form, setForm] = useState(emptyForm);
  const [submitted, setSubmitted] = useState(false);
  const approvedLinks = data.friendLinks.filter((friend) => friend.approved);

  function submitApplication(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `friend-${Date.now()}`;

    updateData((current) => ({
      ...current,
      friendLinks: [
        ...current.friendLinks,
        {
          id,
          name: form.name.trim(),
          description: form.description.trim(),
          url: form.url.trim(),
          avatar: form.avatar.trim() || '/images/avatar.png',
          approved: false,
          createdAt: new Date().toISOString().slice(0, 10),
        },
      ],
    }));
    setForm(emptyForm);
    setSubmitted(true);
  }

  return (
    <ContentShell>
      <PageBanner
        eyebrow="PVL NOTES · FRIENDS"
        title="清风来故人，明月照初心"
        description="互联网很大，但一条友链足以让两座小岛彼此看见。"
        icon={<Link2 />}
      />

      <section className="friend-intro glass-card">
        <div className="friend-site-card">
          <img src={data.settings.avatar} alt={data.settings.nickname + ' 的头像'} />
          <div>
            <span>本站信息</span>
            <h2>{data.settings.siteName}</h2>
            <p>{data.settings.tagline}</p>
            <a href="https://github.com/HY-L-723/personal-website" target="_blank" rel="noreferrer">
              GitHub 仓库 <ExternalLink />
            </a>
          </div>
        </div>
        <div className="friend-rules">
          <span>申请须知</span>
          <ol>
            <li><b>01</b>请先添加本站，再提交你的站点信息</li>
            <li><b>02</b>站点应可以正常访问，并有持续更新的内容</li>
            <li><b>03</b>提交后将进入独立后台的待审核列表</li>
          </ol>
        </div>
      </section>

      <section className="friends-section">
        <header className="section-heading">
          <div><span>FRIEND SITES</span><h2>友情链接</h2></div>
          <p>{approvedLinks.length} 位同行者</p>
        </header>
        <div className="friend-grid">
          {approvedLinks.map((friend) => (
            <a className="friend-card glass-card" href={friend.url} target="_blank" rel="noreferrer" key={friend.id}>
              <img src={friend.avatar} alt="" />
              <div><strong>{friend.name}</strong><p>{friend.description}</p><time>{friend.createdAt}</time></div>
              <ExternalLink />
            </a>
          ))}
        </div>
      </section>

      <section className="friend-apply glass-card" id="apply">
        <div className="friend-apply-copy">
          <span><Sparkles />LET&apos;S CONNECT</span>
          <h2>申请友链</h2>
          <p>填写后会真实保存到当前浏览器，并出现在后台的待审核列表。接入数据库后即可跨设备同步。</p>
          {submitted && (
            <output className="friend-success">
              <CheckCircle2 />申请已保存，等待站长审核。
            </output>
          )}
        </div>
        <form onSubmit={submitApplication}>
          <label>站点名称<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="例如：某某的小站" /></label>
          <label>站点地址<input required type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://example.com" /></label>
          <label>头像地址<input type="url" value={form.avatar} onChange={(e) => setForm({ ...form, avatar: e.target.value })} placeholder="可选，留空使用默认头像" /></label>
          <label>一句介绍<textarea required maxLength={80} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="用一句话介绍你的小站" /></label>
          <button type="submit"><Send />提交申请</button>
        </form>
      </section>
    </ContentShell>
  );
}

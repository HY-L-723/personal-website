'use client';

import Link from 'next/link';
import {
  BarChart3,
  Database,
  Feather,
  FileText,
  Home,
  Images,
  LayoutDashboard,
  Settings2,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { useState, type ComponentType } from 'react';
import { useSiteData } from '@/components/site/data-provider';
import { AdminSettings } from '@/components/admin/admin-settings';
import { AdminPosts } from '@/components/admin/admin-posts';
import { AdminMoments } from '@/components/admin/admin-moments';
import { AdminGallery } from '@/components/admin/admin-gallery';
import { AdminCommunity } from '@/components/admin/admin-community';
import { AdminData } from '@/components/admin/admin-data';
import { useAuth } from '@/components/site/auth-provider';

type TabId = 'overview' | 'settings' | 'posts' | 'moments' | 'gallery' | 'community' | 'data';

const tabs: { id: TabId; label: string; icon: ComponentType }[] = [
  { id: 'overview', label: '总览', icon: LayoutDashboard },
  { id: 'settings', label: '站点设置', icon: Settings2 },
  { id: 'posts', label: '文章管理', icon: FileText },
  { id: 'moments', label: '随笔管理', icon: Feather },
  { id: 'gallery', label: '相册管理', icon: Images },
  { id: 'community', label: '社区管理', icon: Users },
  { id: 'data', label: '数据中心', icon: Database },
];

export function AdminPage() {
  const { data, ready } = useSiteData();
  const { session, status, signOut } = useAuth();
  const [active, setActive] = useState<TabId>('overview');
  const [logoutError, setLogoutError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const pendingFriends = data.friendLinks.filter((item) => !item.approved).length;
  const activeLabel = tabs.find((tab) => tab.id === active)?.label ?? '总览';

  async function logout() {
    setLoggingOut(true);
    setLogoutError('');
    if (await signOut()) window.location.assign('/login');
    else { setLogoutError('退出失败，请重试。'); setLoggingOut(false); }
  }

  if (status === 'loading') return <main className="auth-access-message"><h1>正在确认登录状态</h1></main>;
  if (status !== 'ready' || session?.user?.role !== 'admin') {
    return <main className="auth-access-message"><h1>请重新验证登录身份</h1><p>当前登录已失效，或无法确认管理员权限。</p><Link href="/login?next=%2Fadmin">前往登录</Link></main>;
  }

  return (
    <div className="admin-root">
      <aside className="admin-sidebar">
        <Link href="/" className="admin-brand">
          <span>PVL</span>
          <div><strong>{data.settings.siteName}</strong><small>CONTENT STUDIO</small></div>
        </Link>
        <nav aria-label="后台导航">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button type="button" className={active === id ? 'is-active' : ''} onClick={() => setActive(id)} key={id}>
              <Icon />{label}
              {id === 'community' && pendingFriends > 0 && <b>{pendingFriends}</b>}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-note"><ShieldAlert /><p><strong>站长工作台</strong>当前页面已验证管理员身份。内容仍保存在本机浏览器，可在数据中心导出备份。</p></div>
        <Link href="/" className="admin-back"><Home />返回前台</Link>
        <button type="button" className="admin-back" onClick={logout} disabled={loggingOut}>{loggingOut ? '正在退出' : '退出登录'}</button>
        {logoutError && <p role="alert">{logoutError}</p>}
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div><small>PVL随记 / 后台</small><h1>{activeLabel}</h1></div>
          <span className={ready ? 'is-ready' : ''}><i />{ready ? '本地数据已连接' : '正在载入数据'}</span>
        </header>
        {active === 'overview' && <AdminOverview onNavigate={setActive} />}
        {active === 'settings' && <AdminSettings />}
        {active === 'posts' && <AdminPosts />}
        {active === 'moments' && <AdminMoments />}
        {active === 'gallery' && <AdminGallery />}
        {active === 'community' && <AdminCommunity />}
        {active === 'data' && <AdminData />}
      </main>
    </div>
  );
}

function AdminOverview({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  const { data } = useSiteData();
  const photos = data.albums.reduce((total, album) => total + album.photos.length, 0);
  const views = data.visits.reduce((total, day) => total + day.views, 0);
  const cards = [
    { label: '文章', value: data.posts.length, detail: `${data.posts.filter((post) => post.published).length} 篇已发布`, icon: FileText, tab: 'posts' as TabId },
    { label: '随笔', value: data.moments.length, detail: '生活片段', icon: Feather, tab: 'moments' as TabId },
    { label: '照片', value: photos, detail: `${data.albums.length} 本相册`, icon: Images, tab: 'gallery' as TabId },
    { label: '本机浏览', value: views, detail: '真实本地记录', icon: BarChart3, tab: 'data' as TabId },
  ];
  const recent = data.changelog.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);

  return (
    <div className="admin-workspace">
      <section className="admin-welcome">
        <div><span>WELCOME BACK</span><h2>你好，{data.settings.nickname}</h2><p>这里是 {data.settings.siteName} 的内容工作台。每一次修改都会立即保存在当前浏览器。</p></div>
        <img src={data.settings.avatar} alt="" />
      </section>
      <section className="admin-metric-grid">
        {cards.map(({ label, value, detail, icon: Icon, tab }) => (
          <button type="button" onClick={() => onNavigate(tab)} key={label}>
            <i><Icon /></i><div><small>{label}</small><strong>{value}</strong><span>{detail}</span></div>
          </button>
        ))}
      </section>
      <section className="admin-overview-grid">
        <article className="admin-panel">
          <header><div><small>RECENT ACTIVITY</small><h3>最近更新</h3></div></header>
          <div className="admin-activity-list">
            {recent.map((entry) => <div key={entry.id}><time>{entry.date}</time><span>{entry.changes[0]}</span></div>)}
          </div>
        </article>
        <article className="admin-panel admin-quick-actions">
          <header><div><small>QUICK START</small><h3>快速操作</h3></div></header>
          <button type="button" onClick={() => onNavigate('posts')}><FileText />撰写新文章</button>
          <button type="button" onClick={() => onNavigate('moments')}><Feather />发布一条随笔</button>
          <button type="button" onClick={() => onNavigate('community')}><Users />审核社区内容</button>
        </article>
      </section>
    </div>
  );
}

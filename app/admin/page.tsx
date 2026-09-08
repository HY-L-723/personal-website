import type { Metadata } from 'next';
import { AdminPage } from '@/components/admin/admin-page';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/server';
import { ContentShell } from '@/components/site/content-shell';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '内容后台',
  description: 'PVL随记 的独立本地内容管理后台。',
  robots: { index: false, follow: false },
};

export default async function Page() {
  const session = await getServerSession();
  if (!session) {
    return <ContentShell><section className="auth-access-message glass-card"><h1>暂时无法验证登录状态</h1><p>账号服务恢复后，请刷新此页重试。</p><Link href="/">返回首页</Link></section></ContentShell>;
  }
  if (!session.user) redirect('/login?next=%2Fadmin');
  if (session.user.role !== 'admin') {
    return <ContentShell><section className="auth-access-message glass-card"><h1>此账号没有后台访问权限</h1><p>内容管理仅对站长开放，你仍可浏览网站的公开内容。</p><Link href="/">返回首页</Link></section></ContentShell>;
  }
  return <AdminPage />;
}

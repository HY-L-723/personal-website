'use client';

import Link from 'next/link';
import { LogIn, LogOut, LoaderCircle, UserPlus, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/components/site/auth-provider';

export function AccountControls({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const { session, status, signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const user = session?.user;

  async function logout() {
    setBusy(true);
    setError('');
    if (await signOut()) {
      // Full navigation also clears any cached protected Server Components.
      window.location.assign('/');
    } else {
      setError('退出失败，请重试。');
      setBusy(false);
    }
  }

  if (status === 'loading') return <span className={mobile ? 'mobile-nav-link' : 'account-loading desktop-only'} aria-label="正在确认登录状态"><LoaderCircle size={16} /></span>;
  if (!user) return <>
    <Link href="/login" className={mobile ? 'mobile-nav-link' : 'auth-nav-login desktop-only'} onClick={onNavigate}><LogIn aria-hidden="true" />登录</Link>
    <Link href="/register" className={mobile ? 'mobile-nav-link' : 'auth-nav-register desktop-only'} onClick={onNavigate}><UserPlus aria-hidden="true" />注册</Link>
  </>;

  return <>
    {user.role === 'admin' && <Link href="/admin" className={mobile ? 'mobile-nav-link' : 'header-icon-link desktop-only'} title="管理后台" aria-label="打开管理后台" onClick={onNavigate}><UserRound aria-hidden="true" />{mobile && '管理后台'}</Link>}
    <span className={mobile ? 'mobile-nav-link account-name' : 'account-name desktop-only'} title={user.name}>{user.name}</span>
    <button type="button" className={mobile ? 'mobile-nav-link' : 'auth-nav-login desktop-only'} disabled={busy} onClick={logout} aria-label="退出登录"><LogOut aria-hidden="true" />{busy ? '退出中' : '退出'}</button>
    {error && <span className="account-error" role="alert">{error}</span>}
  </>;
}

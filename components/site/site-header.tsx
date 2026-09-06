'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Archive,
  BarChart3,
  BookOpenText,
  Camera,
  Expand,
  Feather,
  FileClock,
  Heart,
  Home,
  LogIn,
  Menu,
  MessageCircle,
  Moon,
  Shrink,
  Sun,
  UserRound,
  UserPlus,
  UsersRound,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/site/theme-provider';
import { SearchDialog } from '@/components/site/search-dialog';

const navItems = [
  { href: '/', label: '主页', icon: Home },
  { href: '/blog', label: '博客', icon: BookOpenText },
  { href: '/archives', label: '归档', icon: Archive },
  { href: '/stats', label: '统计', icon: BarChart3 },
  { href: '/moments', label: '随笔', icon: Feather },
  { href: '/gallery', label: '相册', icon: Camera },
  { href: '/friends', label: '友链', icon: UsersRound },
  { href: '/changelog', label: '日志', icon: FileClock },
  { href: '/guestbook', label: '留言', icon: MessageCircle },
  { href: '/about', label: '关于', icon: Heart },
];

export function SiteHeader({ transparent = false }: { transparent?: boolean }) {
  const pathname = usePathname();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreen = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreen);
    return () =>
      document.removeEventListener('fullscreenchange', handleFullscreen);
  }, []);

  async function toggleFullscreen() {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await document.documentElement.requestFullscreen();
    }
  }

  return (
    <header
      className={cn(
        'site-header',
        transparent && 'site-header-transparent',
        menuOpen && 'site-header-open',
      )}
    >
      <div className="site-header-inner">
        <Link href="/" className="brand-link" aria-label="PVL随记首页">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </span>
          <span>PVL随记</span>
        </Link>

        <nav className="desktop-nav" aria-label="主要导航">
          {navItems.map((item) => {
            const active =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn('nav-link', active && 'nav-link-active')}
              >
                <Icon aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="header-actions">
          <SearchDialog />
          <Button
            variant="ghost"
            size="icon"
            className="header-icon-button"
            onClick={toggleTheme}
            aria-label={
              resolvedTheme === 'dark' ? '切换到浅色模式' : '切换到深色模式'
            }
            title="切换主题"
          >
            {resolvedTheme === 'dark' ? <Sun /> : <Moon />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="header-icon-button desktop-only"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? '退出全屏' : '进入全屏'}
            title={isFullscreen ? '退出全屏' : '进入全屏'}
          >
            {isFullscreen ? <Shrink /> : <Expand />}
          </Button>
          <Link
            href="/admin"
            className="header-icon-link desktop-only"
            aria-label="打开管理后台"
            title="管理后台"
          >
            <UserRound aria-hidden="true" />
          </Link>
          <Link href="/login" className="auth-nav-login desktop-only">
            <LogIn aria-hidden="true" />
            登录
          </Link>
          <Link href="/register" className="auth-nav-register desktop-only">
            <UserPlus aria-hidden="true" />
            注册
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="header-icon-button mobile-menu-button"
            onClick={() => setMenuOpen((current) => !current)}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            aria-label={menuOpen ? '关闭导航菜单' : '打开导航菜单'}
          >
            {menuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {menuOpen && (
        <nav id="mobile-navigation" className="mobile-nav" aria-label="移动导航">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="mobile-nav-link"
                onClick={() => setMenuOpen(false)}
              >
                <Icon aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/admin"
            className="mobile-nav-link"
            onClick={() => setMenuOpen(false)}
          >
            <UserRound aria-hidden="true" />
            管理后台
          </Link>
          <Link
            href="/login"
            className="mobile-nav-link"
            onClick={() => setMenuOpen(false)}
          >
            <LogIn aria-hidden="true" />
            登录
          </Link>
          <Link
            href="/register"
            className="mobile-nav-link"
            onClick={() => setMenuOpen(false)}
          >
            <UserPlus aria-hidden="true" />
            注册
          </Link>
        </nav>
      )}
    </header>
  );
}

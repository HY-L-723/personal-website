import type { Metadata } from 'next';
import { AuthPage } from '@/components/site/auth-page';

export const metadata: Metadata = {
  title: '登录',
  description: '登录 PVL随记，继续记录与分享。',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AuthPage initialMode="login" />;
}

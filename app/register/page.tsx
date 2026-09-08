import type { Metadata } from 'next';
import { AuthPage } from '@/components/site/auth-page';

export const metadata: Metadata = {
  title: '注册',
  description: '注册 PVL随记账号。',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AuthPage initialMode="register" />;
}

import type { Metadata } from 'next';
import { AuthPage } from '@/components/site/auth-page';

export const metadata: Metadata = {
  title: '注册',
  description: 'PVL随记注册界面演示，不会创建真实账号。',
};

export default function Page() {
  return <AuthPage initialMode="register" />;
}

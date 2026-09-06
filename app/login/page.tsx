import type { Metadata } from 'next';
import { AuthPage } from '@/components/site/auth-page';

export const metadata: Metadata = {
  title: '登录',
  description: 'PVL随记登录界面演示，不会提交或保存账号密码。',
};

export default function Page() {
  return <AuthPage initialMode="login" />;
}

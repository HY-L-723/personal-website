'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { type SubmitEvent, useState } from 'react';
import { ContentShell } from '@/components/site/content-shell';
import { useSiteData } from '@/components/site/data-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

type AuthMode = 'login' | 'register';

interface AuthPageProps {
  initialMode?: AuthMode;
}

export function AuthPage({ initialMode = 'login' }: AuthPageProps) {
  const { data } = useSiteData();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmation, setConfirmation] = useState<AuthMode | null>(null);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>, action: AuthMode) {
    event.preventDefault();
    event.currentTarget.reset();
    setPasswordVisible(false);
    setConfirmation(action);
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setConfirmation(null);
    setPasswordVisible(false);
  }

  return (
    <ContentShell>
      <section className="auth-stage">
        <div className="auth-intro">
          <div className="auth-brand-lockup">
            <img src={data.settings.avatar} alt={`${data.settings.nickname} 的头像`} />
            <span>
              <small>WELCOME TO</small>
              <strong>{data.settings.siteName}</strong>
            </span>
          </div>

          <div className="auth-intro-copy">
            <span className="auth-eyebrow">
              <Sparkles aria-hidden="true" />
              欢迎回来
            </span>
            <h1>
              把生活的片段，
              <em>慢慢写成故事。</em>
            </h1>
            <p>{data.settings.tagline}</p>
          </div>

          <ul className="auth-promises" aria-label="演示说明">
            <li>
              <Check aria-hidden="true" />
              无需真实账号即可体验
            </li>
            <li>
              <Check aria-hidden="true" />
              不会保存或上传密码
            </li>
            <li>
              <Check aria-hidden="true" />
              当前仅展示界面与交互
            </li>
          </ul>

          <Link href="/" className="auth-back-link">
            <ArrowLeft aria-hidden="true" />
            返回首页
          </Link>
        </div>

        <div className="auth-panel glass-card">
          {confirmation ? (
            <div className="auth-confirmation" aria-live="polite">
              <span className="auth-success-icon">
                <CheckCircle2 aria-hidden="true" />
              </span>
              <small>VISUAL DEMO</small>
              <h2>{confirmation === 'login' ? '演示登录完成' : '演示注册完成'}</h2>
              <p>
                这是可视化交互反馈，没有创建会话或账号，也没有保存你填写的密码。
              </p>
              <div className="auth-confirmation-actions">
                <Link href="/" className="auth-primary-link">
                  继续浏览
                  <ArrowRight aria-hidden="true" />
                </Link>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => setConfirmation(null)}
                >
                  再次体验
                </Button>
              </div>
            </div>
          ) : (
            <>
              <header className="auth-panel-header">
                <span className="auth-panel-icon">
                  <ShieldCheck aria-hidden="true" />
                </span>
                <div>
                  <small>ACCOUNT PORTAL</small>
                  <h2>{mode === 'login' ? '很高兴再次见到你' : '创建你的演示账号'}</h2>
                  <p>填写任意有效格式的内容即可查看交互效果。</p>
                </div>
              </header>

              <div className="auth-demo-note" role="note">
                <LockKeyhole aria-hidden="true" />
                <span>
                  <strong>纯前端演示</strong>
                  本页不会进行身份验证，也不会提交或保存密码。
                </span>
              </div>

              <Tabs
                value={mode}
                onValueChange={(value) => switchMode(value as AuthMode)}
                className="auth-tabs"
              >
                <TabsList className="auth-tabs-list">
                  <TabsTrigger value="login">登录</TabsTrigger>
                  <TabsTrigger value="register">注册</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form
                    className="auth-form"
                    onSubmit={(event) => handleSubmit(event, 'login')}
                  >
                    <label htmlFor="login-email">
                      <span>邮箱地址</span>
                      <span className="auth-input-wrap">
                        <Mail aria-hidden="true" />
                        <Input
                          id="login-email"
                          type="email"
                          name="email"
                          placeholder="name@example.com"
                          autoComplete="email"
                          required
                        />
                      </span>
                    </label>
                    <label htmlFor="login-password">
                      <span className="auth-label-row">
                        <span>密码</span>
                        <button type="button" onClick={() => setPasswordVisible((value) => !value)}>
                          {passwordVisible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                          {passwordVisible ? '隐藏' : '显示'}
                        </button>
                      </span>
                      <span className="auth-input-wrap">
                        <KeyRound aria-hidden="true" />
                        <Input
                          id="login-password"
                          type={passwordVisible ? 'text' : 'password'}
                          name="password"
                          placeholder="输入任意演示密码"
                          autoComplete="current-password"
                          minLength={6}
                          required
                        />
                      </span>
                    </label>
                    <div className="auth-form-meta">
                      <label className="auth-check">
                        <input type="checkbox" name="remember" />
                        <span>记住本次选择</span>
                      </label>
                      <span title="演示页面暂不提供找回功能">忘记密码？</span>
                    </div>
                    <Button type="submit" size="lg" className="auth-primary-button">
                      进入 PVL随记
                      <ArrowRight aria-hidden="true" />
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <form
                    className="auth-form"
                    onSubmit={(event) => handleSubmit(event, 'register')}
                  >
                    <label htmlFor="register-nickname">
                      <span>昵称</span>
                      <span className="auth-input-wrap">
                        <UserRound aria-hidden="true" />
                        <Input
                          id="register-nickname"
                          type="text"
                          name="nickname"
                          placeholder="怎么称呼你？"
                          autoComplete="nickname"
                          minLength={2}
                          required
                        />
                      </span>
                    </label>
                    <label htmlFor="register-email">
                      <span>邮箱地址</span>
                      <span className="auth-input-wrap">
                        <Mail aria-hidden="true" />
                        <Input
                          id="register-email"
                          type="email"
                          name="email"
                          placeholder="name@example.com"
                          autoComplete="email"
                          required
                        />
                      </span>
                    </label>
                    <label htmlFor="register-password">
                      <span className="auth-label-row">
                        <span>设置密码</span>
                        <button type="button" onClick={() => setPasswordVisible((value) => !value)}>
                          {passwordVisible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                          {passwordVisible ? '隐藏' : '显示'}
                        </button>
                      </span>
                      <span className="auth-input-wrap">
                        <KeyRound aria-hidden="true" />
                        <Input
                          id="register-password"
                          type={passwordVisible ? 'text' : 'password'}
                          name="password"
                          placeholder="至少 6 位演示密码"
                          autoComplete="new-password"
                          minLength={6}
                          required
                        />
                      </span>
                    </label>
                    <label className="auth-check auth-agreement">
                      <input type="checkbox" name="agreement" required />
                      <span>我已了解：当前注册仅为视觉演示，不会创建真实账号。</span>
                    </label>
                    <Button type="submit" size="lg" className="auth-primary-button">
                      创建演示账号
                      <ArrowRight aria-hidden="true" />
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </section>
    </ContentShell>
  );
}

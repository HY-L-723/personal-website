'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Eye, EyeOff, KeyRound, LoaderCircle, Mail, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { type SubmitEvent, useState } from 'react';
import { ContentShell } from '@/components/site/content-shell';
import { useSiteData } from '@/components/site/data-provider';
import { useAuth } from '@/components/site/auth-provider';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { safeReturnTo } from '@/lib/auth/policy';

type AuthMode = 'login' | 'register';

function errorMessage(code: string, status: number): string {
  if (status === 429) return '尝试次数较多，请稍后再试。';
  const messages: Record<string, string> = {
    INVALID_EMAIL_OR_PASSWORD: '邮箱或密码不正确。',
    USER_ALREADY_EXISTS: '该邮箱已注册，请直接登录。',
    USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: '该邮箱已注册，请直接登录。',
    PASSWORD_TOO_SHORT: '密码至少需要 12 个字符。',
    PASSWORD_TOO_LONG: '密码不能超过 128 个字符。',
    INVALID_EMAIL: '请输入有效的邮箱地址。',
    INVALID_NICKNAME: '昵称需要 2 至 24 个字符。',
    RESERVED_OWNER_EMAIL: '该邮箱不支持自助注册，请使用已有账号登录。',
    INVALID_ORIGIN: '请求来源不匹配，请从网站首页重新进入。',
    USER_BANNED: '此账号暂时无法登录。',
  };
  return messages[code] || (status >= 500 ? '账号服务暂不可用，请稍后重试。' : '操作未完成，请检查填写内容后重试。');
}

export function AuthPage({ initialMode = 'login' }: { initialMode?: AuthMode }) {
  const { data } = useSiteData();
  const { refresh, session, status } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);
  const [destination, setDestination] = useState('/');
  const signedIn = status === 'ready' && !!session?.user;

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>, action: AuthMode) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const textField = (name: string) => { const value = fields.get(name); return typeof value === 'string' ? value : ''; };
    const password = textField('password');
    if (action === 'register' && password !== fields.get('confirmPassword')) {
      setError('两次输入的密码不一致。');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const payload = {
        email: textField('email').trim().toLowerCase(),
        password,
        ...(action === 'register' ? { name: textField('nickname').trim() } : { rememberMe: remember }),
      };
      const response = await fetch(`/api/auth/${action === 'login' ? 'sign-in' : 'sign-up'}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
      });
      const result = await response.json().catch(() => ({}));
      const code = result && typeof result === 'object' && 'code' in result && typeof result.code === 'string' ? result.code : '';
      if (!response.ok) { setError(errorMessage(code, response.status)); return; }
      const current = await refresh();
      if (!current?.user) { setError('提交成功，但暂时无法确认登录状态，请重新登录。'); return; }
      const requested = new URLSearchParams(window.location.search).get('next');
      setDestination(requested ? safeReturnTo(requested) : (current.user.role === 'admin' ? '/admin' : '/'));
      setCompleted(true);
      form.reset();
    } catch {
      setError('连接暂时中断，请重试。');
    } finally {
      for (const name of ['password', 'confirmPassword']) {
        const field = form.elements.namedItem(name);
        if (field instanceof HTMLInputElement) field.value = '';
      }
      setPasswordVisible(false);
      setBusy(false);
    }
  }

  return <ContentShell>
    <section className="auth-stage">
      <div className="auth-intro">
        <div className="auth-brand-lockup">
          <img src={data.settings.avatar} alt={`${data.settings.nickname} 的头像`} />
          <span><small>WELCOME TO</small><strong>{data.settings.siteName}</strong></span>
        </div>
        <div className="auth-intro-copy">
          <span className="auth-eyebrow"><Sparkles aria-hidden="true" />欢迎回来</span>
          <h1>把生活的片段，<em>慢慢写成故事。</em></h1>
          <p>{data.settings.tagline}</p>
        </div>
        <ul className="auth-promises">
          <li><Check aria-hidden="true" />记录学习与生活</li>
          <li><Check aria-hidden="true" />收藏沿途的风景</li>
          <li><Check aria-hidden="true" />让每一段时光有迹可循</li>
        </ul>
        <Link href="/" className="auth-back-link"><ArrowLeft aria-hidden="true" />返回首页</Link>
      </div>

      <div className="auth-panel glass-card">
        {signedIn ? <div className="auth-confirmation" aria-live="polite">
          <span className="auth-success-icon"><CheckCircle2 aria-hidden="true" /></span>
          <small>WELCOME BACK</small>
          <h2>{completed && mode === 'register' ? '注册成功' : '你已登录'}</h2>
          <p>你好，{session?.user?.name}。欢迎来到 {data.settings.siteName}。</p>
          <div className="auth-confirmation-actions">
            <a href={completed ? destination : (session?.user?.role === 'admin' ? '/admin' : '/')} className="auth-primary-link">继续访问<ArrowRight aria-hidden="true" /></a>
            <Link href="/blog" className="auth-primary-link">浏览文章</Link>
          </div>
        </div> : <>
          <header className="auth-panel-header">
            <span className="auth-panel-icon"><ShieldCheck aria-hidden="true" /></span>
            <div><small>ACCOUNT PORTAL</small><h2>{mode === 'login' ? '很高兴再次见到你' : '创建你的账号'}</h2><p>{mode === 'login' ? '使用邮箱和密码登录。' : '用一个昵称，开启你的小站旅程。'}</p></div>
          </header>
          {error && <div className="auth-form-error" role="alert">{error}</div>}
          <Tabs value={mode} onValueChange={(value) => { if (!busy) { setMode(value as AuthMode); setError(''); setPasswordVisible(false); } }} className="auth-tabs">
            <TabsList className="auth-tabs-list"><TabsTrigger value="login" disabled={busy}>登录</TabsTrigger><TabsTrigger value="register" disabled={busy}>注册</TabsTrigger></TabsList>
            {(['login', 'register'] as const).map((action) => <TabsContent value={action} key={action}>
              <form className="auth-form" onSubmit={(event) => { void handleSubmit(event, action); }} aria-busy={busy}>
                {action === 'register' && <label htmlFor="register-nickname"><span>昵称</span><span className="auth-input-wrap"><UserRound aria-hidden="true" /><Input id="register-nickname" name="nickname" placeholder="怎么称呼你？" autoComplete="nickname" minLength={2} maxLength={24} required disabled={busy} /></span></label>}
                <label htmlFor={`${action}-email`}><span>邮箱地址</span><span className="auth-input-wrap"><Mail aria-hidden="true" /><Input id={`${action}-email`} type="email" name="email" placeholder="name@example.com" autoComplete="email" maxLength={254} required disabled={busy} /></span></label>
                <label htmlFor={`${action}-password`}>
                  <span className="auth-label-row"><span>{action === 'login' ? '密码' : '设置密码'}</span><button type="button" onClick={() => setPasswordVisible((value) => !value)} disabled={busy} aria-pressed={passwordVisible}>{passwordVisible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}{passwordVisible ? '隐藏' : '显示'}</button></span>
                  <span className="auth-input-wrap"><KeyRound aria-hidden="true" /><Input id={`${action}-password`} type={passwordVisible ? 'text' : 'password'} name="password" placeholder={action === 'login' ? '请输入密码' : '至少 12 个字符'} autoComplete={action === 'login' ? 'current-password' : 'new-password'} minLength={action === 'register' ? 12 : 1} maxLength={128} required disabled={busy} /></span>
                </label>
                {action === 'register' && <label htmlFor="register-confirm-password"><span>确认密码</span><span className="auth-input-wrap"><KeyRound aria-hidden="true" /><Input id="register-confirm-password" name="confirmPassword" type={passwordVisible ? 'text' : 'password'} placeholder="再输入一次密码" autoComplete="new-password" minLength={12} maxLength={128} required disabled={busy} /></span></label>}
                {action === 'login' && <div className="auth-form-meta"><label className="auth-check" htmlFor="remember-login"><Checkbox id="remember-login" checked={remember} onCheckedChange={setRemember} disabled={busy} /><span>保持登录 7 天</span></label></div>}
                <Button type="submit" size="lg" className="auth-primary-button" disabled={busy}>{busy ? <><LoaderCircle className="animate-spin" aria-hidden="true" />正在处理</> : <>{action === 'login' ? '登录' : '注册账号'}<ArrowRight aria-hidden="true" /></>}</Button>
              </form>
            </TabsContent>)}
          </Tabs>
        </>}
      </div>
    </section>
  </ContentShell>;
}

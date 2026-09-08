'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AccountSession } from '@/lib/auth/types';

interface AuthContextValue {
  session: AccountSession | null;
  status: 'loading' | 'ready' | 'unavailable';
  refresh: () => Promise<AccountSession | null>;
  signOut: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AccountSession | null>(null);
  const [status, setStatus] = useState<AuthContextValue['status']>('loading');
  const sequence = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++sequence.current;
    try {
      const response = await fetch('/api/account/session', { credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(14000) });
      if (!response.ok) throw new Error('Session unavailable');
      const next: AccountSession = await response.json();
      if (requestId === sequence.current) { setSession(next); setStatus('ready'); }
      return next;
    } catch {
      if (requestId === sequence.current) { setSession(null); setStatus('unavailable'); }
      return null;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/sign-out', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: '{}', signal: AbortSignal.timeout(14000) });
      if (!response.ok) return false;
      sequence.current += 1;
      setSession({ user: null, expiresAt: null });
      setStatus('ready');
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onFocus = () => { void refresh(); };
    window.addEventListener('focus', onFocus);
    return () => { sequence.current += 1; window.removeEventListener('focus', onFocus); };
  }, [refresh]);

  useEffect(() => {
    if (!session?.expiresAt) return;
    const remaining = new Date(session.expiresAt).getTime() - Date.now();
    if (!Number.isFinite(remaining)) return;
    const timer = window.setTimeout(() => { void refresh(); }, Math.max(0, Math.min(remaining + 100, 2147483647)));
    return () => window.clearTimeout(timer);
  }, [session?.expiresAt, refresh]);

  const value = useMemo(() => ({ session, status, refresh, signOut }), [session, status, refresh, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}

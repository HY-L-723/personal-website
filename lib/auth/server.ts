import { env } from 'cloudflare:workers';
import { headers } from 'next/headers';
import { callAuthBackend, type AuthBindings } from '@/lib/auth/transport';
import type { AccountSession } from '@/lib/auth/types';

export function authBindings(): AuthBindings {
  return env as unknown as AuthBindings;
}

export async function getServerSession(): Promise<AccountSession | null> {
  const incoming = await headers();
  const forwarded = new Headers();
  const cookie = incoming.get('cookie');
  if (cookie) forwarded.set('cookie', cookie);
  const response = await callAuthBackend(authBindings(), '/internal/session?refresh=0', { method: 'GET', headers: forwarded });
  if (!response.ok) return null;
  return response.json();
}

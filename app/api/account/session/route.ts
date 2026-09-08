import { authBindings } from '@/lib/auth/server';
import { callAuthBackend, clientResponse } from '@/lib/auth/transport';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const headers = new Headers();
  const cookie = request.headers.get('cookie');
  if (cookie) headers.set('cookie', cookie);
  return clientResponse(await callAuthBackend(authBindings(), '/internal/session', { method: 'GET', headers }));
}

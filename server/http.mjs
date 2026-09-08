import { createHash, timingSafeEqual } from 'node:crypto';
import { fromNodeHeaders, toNodeHandler } from 'better-auth/node';
import { hasAdminAccess } from '../lib/auth/policy.ts';

const publicAuthPaths = new Set([
  '/api/auth/sign-up/email',
  '/api/auth/sign-in/email',
  '/api/auth/sign-out',
]);

function matchesSecret(received, expected) {
  if (typeof received !== 'string' || received.length > 512 || !expected) return false;
  const hash = (value) => createHash('sha256').update(value).digest();
  return timingSafeEqual(hash(received), hash(expected));
}

function json(response, status, value, extra = {}) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...extra,
  });
  response.end(JSON.stringify(value));
}

export function createAuthHandler({ auth, config, adminIds }) {
  const handleAuth = toNodeHandler(auth);
  return async (request, response) => {
    try {
      if (!matchesSecret(request.headers['x-pvl-backend-key'], config.proxySecret)) {
        json(response, 401, { code: 'UNAUTHORIZED', message: '需要授权访问。' });
        return;
      }
      const url = new URL(request.url || '/', config.origin);
      if (url.pathname === '/internal/health' && request.method === 'GET') {
        json(response, 200, { ready: true });
        return;
      }
      if (url.pathname === '/internal/session' && request.method === 'GET') {
        const sessionResponse = await auth.api.getSession({
          headers: fromNodeHeaders(request.headers),
          query: { disableCookieCache: true, disableRefresh: url.searchParams.get('refresh') === '0' },
          asResponse: true,
        });
        if (!sessionResponse.ok) {
          json(response, 503, { code: 'AUTH_UNAVAILABLE', message: '暂时无法确认登录状态。' });
          return;
        }
        const session = await sessionResponse.json();
        const cookies = sessionResponse.headers.getSetCookie();
        const user = session?.user;
        json(response, 200, {
          user: user && !user.banned ? {
            id: user.id,
            name: user.name,
            email: user.email,
            role: hasAdminAccess(user.id, adminIds.join(',')) ? 'admin' : 'user',
          } : null,
          expiresAt: user && !user.banned ? session.session.expiresAt : null,
        }, cookies.length ? { 'Set-Cookie': cookies } : {});
        return;
      }
      if (!publicAuthPaths.has(url.pathname)) {
        json(response, 404, { code: 'NOT_FOUND', message: '接口不存在。' });
        return;
      }
      if (request.method !== 'POST') {
        json(response, 405, { code: 'METHOD_NOT_ALLOWED', message: '请求方式不支持。' }, { Allow: 'POST' });
        return;
      }
      // Both the proxy and the authentication library check the public origin.
      if (request.headers.origin !== config.origin) {
        json(response, 403, { code: 'INVALID_ORIGIN', message: '请求来源不受信任。' });
        return;
      }
      response.setHeader('Cache-Control', 'no-store');
      await handleAuth(request, response);
    } catch {
      if (!response.headersSent) json(response, 503, { code: 'AUTH_UNAVAILABLE', message: '账号服务暂不可用，请稍后重试。' });
      else response.end();
    }
  };
}

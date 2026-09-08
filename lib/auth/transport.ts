export interface AuthBindings {
  AUTH_BACKEND_URL?: string;
  AUTH_PROXY_SECRET?: string;
}

const routes = new Map([
  ['/api/auth/sign-in/email', 'POST'],
  ['/api/auth/sign-up/email', 'POST'],
  ['/api/auth/sign-out', 'POST'],
]);

export function unavailableResponse() {
  return Response.json({ code: 'AUTH_UNAVAILABLE', message: '账号服务暂不可用，请稍后重试。' }, {
    status: 503,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function callAuthBackend(
  bindings: AuthBindings,
  path: string,
  init: RequestInit,
): Promise<Response> {
  if (!bindings.AUTH_BACKEND_URL || !bindings.AUTH_PROXY_SECRET || bindings.AUTH_PROXY_SECRET.length < 32) return unavailableResponse();
  try {
    const base = new URL(bindings.AUTH_BACKEND_URL);
    if (base.username || base.password || base.pathname !== '/' || base.search || base.hash) return unavailableResponse();
    if (base.protocol !== 'https:' && !(base.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname))) return unavailableResponse();
    const headers = new Headers(init.headers);
    headers.set('x-pvl-backend-key', bindings.AUTH_PROXY_SECRET);
    return await fetch(new URL(path, base), {
      ...init,
      headers,
      redirect: 'error',
      cache: 'no-store',
      signal: AbortSignal.timeout(12000),
    });
  } catch {
    return unavailableResponse();
  }
}

export function clientResponse(response: Response): Response {
  const headers = new Headers({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  for (const cookie of response.headers.getSetCookie()) headers.append('Set-Cookie', cookie);
  for (const name of ['retry-after', 'allow']) {
    const value = response.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new Response(response.body, { status: response.status, headers });
}

export async function forwardAuthRequest(request: Request, bindings: AuthBindings): Promise<Response> {
  const url = new URL(request.url);
  const method = routes.get(url.pathname);
  if (!method) return Response.json({ code: 'NOT_FOUND' }, { status: 404 });
  if (request.method !== method) return Response.json({ code: 'METHOD_NOT_ALLOWED' }, { status: 405, headers: { Allow: method } });
  if (request.headers.get('origin') !== url.origin) return Response.json({ code: 'INVALID_ORIGIN' }, { status: 403 });
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return Response.json({ code: 'INVALID_CONTENT_TYPE' }, { status: 415 });
  if (Number(request.headers.get('content-length') || '0') > 8192) return Response.json({ code: 'BODY_TOO_LARGE' }, { status: 413 });
  // Read a bounded body so chunked requests cannot bypass the content-length check.
  let size = 0;
  const chunks: Uint8Array[] = [];
  const reader = request.body?.getReader();
  if (reader) {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > 8192) {
        await reader.cancel();
        return Response.json({ code: 'BODY_TOO_LARGE' }, { status: 413 });
      }
      chunks.push(chunk.value);
    }
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  const headers = new Headers({ 'Content-Type': 'application/json', Origin: url.origin });
  const cookie = request.headers.get('cookie');
  if (cookie) headers.set('cookie', cookie);
  const agent = request.headers.get('user-agent');
  if (agent) headers.set('user-agent', agent.slice(0, 512));
  // Never trust a browser-supplied x-pvl-client-ip header. Cloudflare sets this
  // header at the edge; local development deliberately shares a loopback bucket.
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  headers.set('x-pvl-client-ip', loopback ? '127.0.0.1' : (request.headers.get('cf-connecting-ip') || 'unknown'));
  const response = await callAuthBackend(bindings, url.pathname, { method, headers, body });
  const outgoing = clientResponse(response);
  if (response.ok) {
    // The browser only needs a success flag and the HttpOnly Set-Cookie header,
    // never the auth library's token or internal account/session objects.
    await outgoing.body?.cancel();
    return new Response(JSON.stringify({ success: true }), { status: outgoing.status, headers: outgoing.headers });
  }
  return outgoing;
}

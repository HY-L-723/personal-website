import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { randomBytes } from 'node:crypto';
import { test } from 'node:test';
import { callAuthBackend, clientResponse, forwardAuthRequest } from '../lib/auth/transport.ts';

test('backend redirects are rejected without forwarding credentials to their destination', async (t) => {
  let destinationRequests = 0;
  const server = createServer((request, response) => {
    if (request.url === '/redirect') response.writeHead(302, { Location: '/destination' });
    else { destinationRequests += 1; response.writeHead(200); }
    response.end();
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const response = await callAuthBackend({ AUTH_BACKEND_URL: `http://127.0.0.1:${server.address().port}`, AUTH_PROXY_SECRET: randomBytes(48).toString('hex') }, '/redirect', { headers: { Cookie: 'test=value' } });
  assert.equal(response.status, 503);
  assert.equal(destinationRequests, 0);
});

test('proxy preserves separate HttpOnly cookies and fails closed without configuration', async () => {
  const headers = new Headers();
  headers.append('Set-Cookie', 'first=1; HttpOnly; SameSite=Lax; Path=/');
  headers.append('Set-Cookie', 'second=2; HttpOnly; SameSite=Lax; Path=/');
  const response = clientResponse(new Response('{}', { headers }));
  assert.equal(response.headers.getSetCookie().length, 2);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal((await callAuthBackend({}, '/internal/session', {})).status, 503);
});

test('chunked bodies cannot bypass the request size limit', async () => {
  const request = new Request('http://localhost:3000/api/auth/sign-in/email', {
    method: 'POST', duplex: 'half',
    headers: { Origin: 'http://localhost:3000', 'Content-Type': 'application/json' },
    body: new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(5000)); controller.enqueue(new Uint8Array(5000)); controller.close(); } }),
  });
  assert.equal(request.headers.has('content-length'), false);
  assert.equal((await forwardAuthRequest(request, {})).status, 413);
});

test('a dropped connection retries session reads once but never replays mutations', async (t) => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    calls += 1;
    if (calls % 2 === 1) throw new TypeError('Connection lost');
    return Response.json({ user: null });
  });
  const bindings = { AUTH_BACKEND_URL: 'http://127.0.0.1:3001', AUTH_PROXY_SECRET: randomBytes(48).toString('hex') };
  assert.equal((await callAuthBackend(bindings, '/internal/session', { method: 'GET' })).status, 200);
  assert.equal(calls, 2);
  assert.equal((await callAuthBackend(bindings, '/api/auth/sign-up/email', { method: 'POST', body: '{}' })).status, 503);
  assert.equal(calls, 3);
});

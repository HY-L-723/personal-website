import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { getMigrations } from 'better-auth/db/migration';
import { createConfiguredAuth } from '../server/auth.mjs';
import { createAuthHandler } from '../server/http.mjs';
import { forwardAuthRequest } from '../lib/auth/transport.ts';
import { provisionOwner } from '../server/owner.mjs';

// Isolated database for authentication behavior; it does not replace the
// separately required live MySQL connectivity/migration acceptance check.
test('registration, sessions, owner authorization, CSRF, and rate limits', async (t) => {
  const database = new DatabaseSync(':memory:');
  const config = { origin: 'http://localhost:3000', secret: randomBytes(48).toString('hex'), proxySecret: randomBytes(48).toString('hex'), ownerEmail: 'owner@example.com' };
  const adminIds = [];
  const auth = createConfiguredAuth(config, database, adminIds);
  const plan = await getMigrations(auth.options);
  assert.deepEqual(plan.schemaProblems, []);
  assert.ok(plan.toBeCreated.every((item) => item.table.startsWith('pvl_auth_')));
  await plan.runMigrations();
  const server = createServer(createAuthHandler({ auth, config, adminIds }));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const backend = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => { await new Promise((resolve) => server.close(resolve)); database.close(); });
  const bindings = { AUTH_BACKEND_URL: backend, AUTH_PROXY_SECRET: config.proxySecret };
  const post = (path, body, cookie = '', extraHeaders = {}) => forwardAuthRequest(new Request(`${config.origin}/api/auth/${path}`, { method: 'POST', headers: { Origin: config.origin, 'Content-Type': 'application/json', Cookie: cookie, ...extraHeaders }, body: JSON.stringify(body) }), bindings);
  const cookieFrom = (response) => response.headers.getSetCookie().map((value) => value.split(';')[0]).join('; ');
  const session = async (cookie) => {
    const response = await fetch(`${backend}/internal/session`, { headers: { Cookie: cookie, 'x-pvl-backend-key': config.proxySecret } });
    assert.equal(response.status, 200);
    return response.json();
  };
  const password = 'integration-password-123';
  let userId;
  let userCookie;

  await t.test('registration persists a hashed password and issues HttpOnly session', async () => {
    const response = await post('sign-up/email', { email: 'reader@example.com', name: 'Reader', password });
    assert.equal(response.status, 200, await response.clone().text());
    assert.deepEqual(await response.json(), { success: true });
    const setCookie = response.headers.getSetCookie().join(';');
    assert.match(setCookie, /httponly/iu);
    assert.match(setCookie, /samesite=lax/iu);
    userCookie = cookieFrom(response);
    const result = await session(userCookie);
    assert.equal(result.user.role, 'user');
    userId = result.user.id;
    assert.equal('token' in result, false);
    const account = database.prepare('SELECT password FROM pvl_auth_account WHERE userId = ?').get(userId);
    assert.notEqual(account.password, password);
    assert.ok(account.password.length > 30);
  });

  await t.test('logout invalidates the original server-side session', async () => {
    const response = await post('sign-out', {}, userCookie);
    assert.equal(response.status, 200);
    assert.equal((await session(userCookie)).user, null);
  });

  await t.test('bad password fails and a valid login creates a new session', async () => {
    const bad = await post('sign-in/email', { email: 'reader@example.com', password: 'incorrect-password' });
    assert.equal(bad.status, 401);
    const good = await post('sign-in/email', { email: 'reader@example.com', password, rememberMe: true });
    assert.equal(good.status, 200, await good.clone().text());
    userCookie = cookieFrom(good);
    assert.equal((await session(userCookie)).user.id, userId);
  });

  await t.test('expired sessions cannot identify or authorize a user', async () => {
    database.prepare('UPDATE pvl_auth_session SET expiresAt = ? WHERE userId = ?').run(Date.now() - 1000, userId);
    assert.equal((await session(userCookie)).user, null);
  });

  await t.test('public registration cannot claim the reserved owner email or a role', async () => {
    const reserved = await post('sign-up/email', { email: 'OWNER@example.com', name: 'Impostor', password });
    assert.equal(reserved.status, 403);
    const forged = await post('sign-up/email', { email: 'forged@example.com', name: 'Forged', password, role: 'admin' });
    assert.ok([200, 400].includes(forged.status), await forged.clone().text());
    const record = database.prepare('SELECT role FROM pvl_auth_user WHERE email = ?').get('forged@example.com');
    if (record) assert.notEqual(record.role, 'admin');
  });

  await t.test('only the locally provisioned immutable owner ID receives admin access', async () => {
    const created = await auth.api.createUser({ body: { email: config.ownerEmail, name: 'Owner', password, role: 'admin' } });
    const login = await post('sign-in/email', { email: config.ownerEmail, password });
    assert.equal(login.status, 200, await login.clone().text());
    const cookie = cookieFrom(login);
    assert.equal((await session(cookie)).user.role, 'user');
    adminIds.push(created.user.id);
    assert.equal((await session(cookie)).user.role, 'admin');
    adminIds.length = 0;
    assert.equal((await session(cookie)).user.role, 'user');
  });

  await t.test('anonymous backend access and unexposed admin endpoints are denied', async () => {
    const anonymous = await fetch(`${backend}/internal/session`);
    assert.equal(anonymous.status, 401);
    const adminEndpoint = await post('admin/create-user', { email: 'attacker@example.com', password, role: 'admin' });
    assert.equal(adminEndpoint.status, 404);
    const rawAdmin = await fetch(`${backend}/api/auth/admin/create-user`, { method: 'POST', headers: { 'x-pvl-backend-key': config.proxySecret, Origin: config.origin, 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal(rawAdmin.status, 404);
  });

  await t.test('cross-origin and oversized requests fail before the backend', async () => {
    assert.equal((await post('sign-in/email', {}, '', { Origin: 'https://outside.example' })).status, 403);
    assert.equal((await post('sign-in/email', { password: 'x'.repeat(9000) })).status, 413);
    const wrongType = new Request(`${config.origin}/api/auth/sign-out`, { method: 'POST', headers: { Origin: config.origin }, body: '{}' });
    assert.equal((await forwardAuthRequest(wrongType, bindings)).status, 415);
  });

  await t.test('repeated password attempts are limited in the database', async () => {
    let response;
    for (let attempt = 0; attempt < 6; attempt += 1) response = await post('sign-in/email', { email: 'reader@example.com', password: 'incorrect-password' });
    assert.equal(response.status, 429);
    assert.ok(database.prepare('SELECT COUNT(*) AS count FROM pvl_auth_rate_limit').get().count > 0);
  });

  await t.test('local owner recovery requires matching credentials and never promotes a reader', async () => {
    const pool = { execute: async (sql, parameters) => [database.prepare(sql).all(...parameters)] };
    const input = { auth, pool, ownerEmail: 'bootstrap@example.com', password };
    const id = await provisionOwner(input);
    await assert.rejects(provisionOwner(input));
    await assert.rejects(provisionOwner({ ...input, password: 'wrong-password', recover: true }));
    assert.equal(await provisionOwner({ ...input, recover: true }), id);
    await assert.rejects(provisionOwner({ ...input, ownerEmail: 'reader@example.com', recover: true }));
  });

  await t.test('explicit local recovery can complete an interrupted owner credential creation', async () => {
    const pool = { execute: async (sql, parameters) => [database.prepare(sql).all(...parameters)] };
    const email = 'incomplete@example.com';
    const orphan = await auth.api.createUser({ body: { email, name: 'PVL', role: 'admin' } });
    const input = { auth, pool, ownerEmail: email, password, recover: true };
    assert.equal(await provisionOwner(input), orphan.user.id);
    const account = database.prepare('SELECT password FROM pvl_auth_account WHERE userId = ?').get(orphan.user.id);
    assert.ok(account.password);
    await assert.rejects(provisionOwner({ ...input, password: 'different-password' }));
  });
});

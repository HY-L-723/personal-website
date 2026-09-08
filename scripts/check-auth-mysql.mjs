import { spawn } from 'node:child_process';
import { randomUUID, randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { setTimeout as delay } from 'node:timers/promises';
import { getMigrations } from 'better-auth/db/migration';
import { createAuthService } from '../server/auth.mjs';
import { loadPrivateEnvironment, readConfig, readAdminIds } from '../server/config.mjs';

// Opt-in live acceptance check. Uses only local configuration; never logs
// credentials, account identifiers, cookies, raw SQL errors, or response bodies.
class CheckFailure extends Error {}
const check = (condition, label) => { if (!condition) throw new CheckFailure(label); };
const passed = (label) => console.log(`PASS ${label}`);
let stage = 'local configuration';
let config;
let pool;
let backend;
let ownerCookie = '';
let testUserId;
const testEmail = `auth-check-${randomUUID()}@example.invalid`;
const testPassword = randomBytes(32).toString('base64url');

async function health() {
  try {
    const response = await fetch(`http://127.0.0.1:${config.port}/internal/health`, { headers: { 'x-pvl-backend-key': config.proxySecret }, signal: AbortSignal.timeout(1000) });
    await response.arrayBuffer();
    return response.ok;
  } catch { return false; }
}

async function startBackend() {
  backend = spawn(process.execPath, ['server/index.mjs'], { cwd: process.cwd(), stdio: 'ignore', windowsHide: true, env: { ...process.env, AUTH_ADMIN_PASSWORD: '' } });
  let failed = false;
  backend.once('error', () => { failed = true; });
  for (let attempt = 0; attempt < 40; attempt += 1) {
    check(!failed && backend.exitCode === null, 'backend startup');
    if (await health()) return;
    await delay(150);
  }
  throw new Error('backend startup timeout');
}

async function stopBackend() {
  if (!backend || backend.exitCode !== null) return;
  const child = backend;
  const exited = once(child, 'exit');
  child.kill();
  await Promise.race([exited, delay(5000).then(() => { throw new Error('backend shutdown timeout'); })]);
  backend = undefined;
}

async function request(path, { method = 'GET', body, cookie = '', extraHeaders = {} } = {}) {
  return fetch(new URL(path, config.origin), {
    method, redirect: 'manual', signal: AbortSignal.timeout(20000),
    headers: { Cookie: cookie, ...(method === 'POST' ? { Origin: config.origin, 'Content-Type': 'application/json' } : {}), ...extraHeaders },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

const cookieFrom = (response) => response.headers.getSetCookie().map((value) => value.split(';')[0]).join('; ');
async function session(cookie = '') {
  const response = await request('/api/account/session', { cookie });
  check(response.status === 200, `website session response ${response.status}`);
  return { response, data: await response.json() };
}
async function rows(sql, parameters = []) { return (await pool.execute(sql, parameters))[0]; }

async function cleanupTestAccount() {
  if (!pool) return;
  const records = await rows('SELECT id, email, role FROM pvl_auth_user WHERE email = ? LIMIT 1', [testEmail]);
  if (!records.length) return;
  const record = records[0];
  check(record.email === testEmail && record.role === 'user' && !readAdminIds().includes(record.id) && (!testUserId || testUserId === record.id), 'cleanup identity');
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [locked] = await connection.execute('SELECT id FROM pvl_auth_user WHERE id = ? AND email = ? AND role = ? FOR UPDATE', [record.id, testEmail, 'user']);
    check(locked.length === 1, 'cleanup locked identity');
    await connection.execute('DELETE FROM pvl_auth_session WHERE userId = ?', [record.id]);
    await connection.execute('DELETE FROM pvl_auth_account WHERE userId = ?', [record.id]);
    const [deleted] = await connection.execute('DELETE FROM pvl_auth_user WHERE id = ? AND email = ?', [record.id, testEmail]);
    check(deleted.affectedRows === 1, 'cleanup affected rows');
    await connection.commit();
    passed('only the generated temporary account and its records were removed');
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}

try {
  loadPrivateEnvironment();
  config = readConfig();
  check(['localhost', '127.0.0.1', '[::1]'].includes(new URL(config.origin).hostname), 'local website required');
  check(['localhost', '127.0.0.1', '::1'].includes(config.database.host), 'local MySQL required');
  check(process.env.AUTH_ADMIN_PASSWORD?.length >= 12, 'owner password required locally during this check');
  const worker = parseEnv(readFileSync('.dev.vars', 'utf8'));
  check(worker.AUTH_BACKEND_URL === `http://127.0.0.1:${config.port}` && worker.AUTH_PROXY_SECRET === config.proxySecret, 'matching local proxy required');
  check(!await health(), 'stop the existing account service before this opt-in restart check');
  const service = createAuthService(config, readAdminIds());
  pool = service.pool;
  stage = 'MySQL migration idempotency';
  const plan = await getMigrations(service.auth.options);
  check(!plan.toBeCreated.length && !plan.toBeAdded.length && !plan.toBeAddedIndexes.length && !plan.schemaProblems.length && !plan.unsafeChanges.length, 'migration plan must be empty');
  passed(stage);
  const owners = await rows('SELECT id FROM pvl_auth_user WHERE email = ?', [config.ownerEmail]);
  check(owners.length === 1 && readAdminIds().includes(owners[0].id), 'provisioned owner required');
  await startBackend();

  stage = 'anonymous website and admin redirect';
  check((await session()).data.user === null, 'anonymous identity');
  const anonymous = await request('/admin');
  check([302, 303, 307, 308].includes(anonymous.status) && anonymous.headers.get('location') === '/login?next=%2Fadmin', 'anonymous admin redirect');
  await anonymous.arrayBuffer();
  passed(stage);

  stage = 'registration through the website with a server-owned role';
  const registered = await request('/api/auth/sign-up/email', { method: 'POST', body: { email: testEmail, password: testPassword, name: '临时验收账号' } });
  if (registered.status !== 200) {
    const failure = await registered.json().catch(() => ({}));
    const code = typeof failure.code === 'string' && /^[A-Z_]{1,80}$/.test(failure.code) ? failure.code : 'UNKNOWN';
    throw new CheckFailure(`registration status ${registered.status}, ${code}`);
  }
  const registrationBody = await registered.json();
  check(registrationBody.success === true && !('token' in registrationBody), 'no token in JSON');
  const cookieAttributes = registered.headers.getSetCookie().join(';');
  check(/httponly/i.test(cookieAttributes) && /samesite=lax/i.test(cookieAttributes) && /path=\//i.test(cookieAttributes), 'cookie security attributes');
  const readerCookie = cookieFrom(registered);
  const reader = (await session(readerCookie)).data.user;
  check(reader?.role === 'user', 'reader cannot grant admin');
  testUserId = reader.id;
  const accounts = await rows('SELECT password FROM pvl_auth_account WHERE userId = ?', [testUserId]);
  check(accounts.length === 1 && accounts[0].password !== testPassword && accounts[0].password.length > 30, 'persisted password hash');
  passed(stage);

  stage = 'owner login and actual admin route protection';
  const login = await request('/api/auth/sign-in/email', { method: 'POST', body: { email: config.ownerEmail, password: process.env.AUTH_ADMIN_PASSWORD, rememberMe: true } });
  check(login.status === 200, 'owner login');
  await login.arrayBuffer();
  ownerCookie = cookieFrom(login);
  check((await session(ownerCookie)).data.user?.role === 'admin', 'owner role');
  const ownerPage = await request('/admin', { cookie: ownerCookie });
  const ownerHtml = await ownerPage.text();
  check(ownerPage.status === 200 && ownerHtml.includes('正在确认登录状态') && !ownerHtml.includes('此账号没有后台访问权限'), 'owner admin page');
  const readerPage = await request('/admin?role=admin', { cookie: readerCookie, extraHeaders: { 'x-user-role': 'admin' } });
  const readerHtml = await readerPage.text();
  check(readerPage.status === 200 && readerHtml.includes('此账号没有后台访问权限') && !readerHtml.includes('CONTENT STUDIO'), 'reader admin denial');
  const forbiddenApi = await request('/api/auth/admin/create-user', { method: 'POST', cookie: readerCookie, body: {} });
  check(forbiddenApi.status === 404, 'private admin endpoints');
  await forbiddenApi.arrayBuffer();
  passed(stage);

  stage = 'website session renewal and cookie propagation';
  const initialSessions = await rows('SELECT id FROM pvl_auth_session WHERE userId = ?', [testUserId]);
  check(initialSessions.length === 1, 'single test session');
  const testSessionId = initialSessions[0].id;
  await pool.execute('UPDATE pvl_auth_session SET expiresAt = ? WHERE id = ? AND userId = ?', [new Date(Date.now() + 3600000), testSessionId, testUserId]);
  const before = (await rows('SELECT expiresAt FROM pvl_auth_session WHERE id = ? AND userId = ?', [testSessionId, testUserId]))[0].expiresAt;
  const serverOnlyPage = await request('/admin', { cookie: readerCookie });
  await serverOnlyPage.arrayBuffer();
  const afterSsr = (await rows('SELECT expiresAt FROM pvl_auth_session WHERE id = ? AND userId = ?', [testSessionId, testUserId]))[0].expiresAt;
  check(before.getTime() === afterSsr.getTime(), 'SSR does not silently refresh');
  const renewed = await session(readerCookie);
  check(renewed.response.headers.getSetCookie().some((value) => /httponly/i.test(value)), 'renewal cookie reaches website');
  check(new Date(renewed.data.expiresAt).getTime() > Date.now() + 6 * 86400000, 'renewal persisted');
  passed(stage);

  stage = 'sessions persist after restarting the account service';
  await stopBackend();
  await startBackend();
  check((await session(readerCookie)).data.user?.id === testUserId, 'reader persists');
  check((await session(ownerCookie)).data.user?.role === 'admin', 'owner persists');
  passed(stage);

  stage = 'logout revocation persists after restarting';
  const logout = await request('/api/auth/sign-out', { method: 'POST', cookie: readerCookie, body: {} });
  check(logout.status === 200, 'reader logout');
  await logout.arrayBuffer();
  await stopBackend();
  await startBackend();
  check((await session(readerCookie)).data.user === null, 'old cookie remains revoked');
  passed(stage);

  stage = 'wrong passwords and expired sessions';
  const bad = await request('/api/auth/sign-in/email', { method: 'POST', body: { email: testEmail, password: 'incorrect-password' } });
  check(bad.status === 401, 'wrong password rejected');
  await bad.arrayBuffer();
  const readerLogin = await request('/api/auth/sign-in/email', { method: 'POST', body: { email: testEmail, password: testPassword, rememberMe: true } });
  check(readerLogin.status === 200, 'reader password login');
  await readerLogin.arrayBuffer();
  const newCookie = cookieFrom(readerLogin);
  const newSessions = await rows('SELECT id FROM pvl_auth_session WHERE userId = ?', [testUserId]);
  check(newSessions.length === 1, 'new test session');
  await pool.execute('UPDATE pvl_auth_session SET expiresAt = ? WHERE id = ? AND userId = ?', [new Date(Date.now() - 10000), newSessions[0].id, testUserId]);
  check((await session(newCookie)).data.user === null, 'expired cookie denied');
  passed(stage);

  stage = 'cross-origin requests and persistent login limits';
  const crossOrigin = await request('/api/auth/sign-in/email', { method: 'POST', body: {}, extraHeaders: { Origin: 'https://untrusted.example' } });
  check(crossOrigin.status === 403, 'CSRF blocked');
  await crossOrigin.arrayBuffer();
  let limited = false;
  for (let attempt = 0; attempt < 6 && !limited; attempt += 1) {
    const response = await request('/api/auth/sign-in/email', { method: 'POST', body: { email: testEmail, password: 'incorrect-password' } });
    limited = response.status === 429;
    await response.arrayBuffer();
  }
  check(limited, 'login rate limit');
  check((await rows('SELECT COUNT(*) AS total FROM pvl_auth_rate_limit'))[0].total > 0, 'limits in MySQL');
  passed(stage);
} catch (error) {
  console.error(`FAIL ${stage}${error instanceof CheckFailure ? ` (${error.message})` : ''}. Private details were suppressed; inspect configuration and service state locally.`);
  process.exitCode = 1;
} finally {
  if (ownerCookie && backend) {
    try { const response = await request('/api/auth/sign-out', { method: 'POST', cookie: ownerCookie, body: {} }); await response.arrayBuffer(); check(response.ok, 'owner test session logout'); }
    catch { console.error('Owner test session logout could not be confirmed.'); process.exitCode = 1; }
  }
  try { await cleanupTestAccount(); } catch { console.error('Temporary test account cleanup needs local review.'); process.exitCode = 1; }
  try { await stopBackend(); } catch { console.error('Test backend shutdown needs local review.'); process.exitCode = 1; }
  if (pool) await pool.end();
}

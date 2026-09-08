import { ConfigurationError } from './config.mjs';

// This operation is only reachable from the local CLI, never from an HTTP route.
export async function provisionOwner({ auth, pool, ownerEmail, password, recover = false }) {
  const [users] = await pool.execute('SELECT id, role, banned FROM pvl_auth_user WHERE email = ? LIMIT 1', [ownerEmail]);
  const existing = users[0];
  if (!existing) {
    if (recover) throw new ConfigurationError('没有找到待恢复的站长账号，请先运行普通初始化命令。');
    const result = await auth.api.createUser({ body: { email: ownerEmail, password, name: 'PVL', role: 'admin' } });
    return result.user.id;
  }
  if (!recover) throw new ConfigurationError('该邮箱已存在；不会自动提权。如为初始化中断，请核对配置后运行 npm run auth:admin -- --recover。');
  if (existing.role !== 'admin' || existing.banned) {
    throw new ConfigurationError('恢复仅适用于原本由本地初始化创建的站长账号，不能提升普通用户或启用封禁账号。');
  }
  const [accounts] = await pool.execute('SELECT providerId, password FROM pvl_auth_account WHERE userId = ?', [existing.id]);
  const context = await auth.$context;
  const credential = accounts.find((account) => account.providerId === 'credential');
  if (credential?.password) {
    if (!await context.password.verify({ hash: credential.password, password })) {
      throw new ConfigurationError('恢复失败：AUTH_ADMIN_PASSWORD 必须与该站长账号的现有密码一致。');
    }
  } else {
    const [sessions] = await pool.execute('SELECT id FROM pvl_auth_session WHERE userId = ? LIMIT 1', [existing.id]);
    if (accounts.length || sessions.length) {
      throw new ConfigurationError('账号状态不适合自动恢复，请先人工核验；现有密码不会被覆盖。');
    }
    // A failed create-user may leave only its reserved, server-assigned admin
    // row. Explicit local recovery completes it without changing an account
    // that already has credentials or has previously established a session.
    const hash = await context.password.hash(password);
    await context.internalAdapter.linkAccount({ providerId: 'credential', accountId: existing.id, userId: existing.id, password: hash });
  }
  return existing.id;
}

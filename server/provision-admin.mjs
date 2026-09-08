import { existsSync, writeFileSync } from 'node:fs';
import { loadPrivateEnvironment, publicStartupError, readAdminIds, readConfig, ConfigurationError } from './config.mjs';
import { createAuthService } from './auth.mjs';
import { provisionOwner } from './owner.mjs';

let pool;
try {
  loadPrivateEnvironment();
  const config = readConfig();
  const service = createAuthService(config);
  pool = service.pool;
  if (existsSync('.auth-admin.json') || readAdminIds().length) {
    throw new ConfigurationError('站长身份已配置，不会重复创建或覆盖。');
  }
  const password = process.env.AUTH_ADMIN_PASSWORD;
  if (!password || password.length < 12 || password.length > 128) {
    throw new ConfigurationError('请在本地 .env.auth 中设置 12 至 128 位 AUTH_ADMIN_PASSWORD。');
  }
  const id = await provisionOwner({ auth: service.auth, pool, ownerEmail: config.ownerEmail, password, recover: process.argv.includes('--recover') });
  writeFileSync('.auth-admin.json', JSON.stringify({ adminUserIds: [id] }, null, 2) + '\n', { encoding: 'utf8', mode: 0o600, flag: 'wx' });
  delete process.env.AUTH_ADMIN_PASSWORD;
  console.log('站长账号已创建，身份配置仅保存在本机。请清空 .env.auth 的 AUTH_ADMIN_PASSWORD 后重启账号服务。');
} catch (error) {
  console.error(publicStartupError(error));
  if (!(error instanceof ConfigurationError)) console.error('若初始化中断，请核对本地配置后使用 npm run auth:admin -- --recover 恢复；不会自动提升普通账号。');
  process.exitCode = 1;
} finally {
  if (pool) await pool.end();
}

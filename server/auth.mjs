import { betterAuth } from 'better-auth';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { admin } from 'better-auth/plugins';
import { createPool } from 'mysql2/promise';

export function createAuthService(config, adminIds = []) {
  const pool = createPool(config.database);
  return { auth: createConfiguredAuth(config, pool, adminIds), pool };
}

export function createConfiguredAuth(config, database, adminIds = []) {
  return betterAuth({
    appName: 'PVL随记',
    database,
    secret: config.secret,
    baseURL: config.origin,
    basePath: '/api/auth',
    trustedOrigins: [config.origin],
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      autoSignIn: true,
    },
    user: { modelName: 'pvl_auth_user' },
    account: { modelName: 'pvl_auth_account' },
    verification: { modelName: 'pvl_auth_verification' },
    session: {
      modelName: 'pvl_auth_session',
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: false },
    },
    advanced: {
      cookiePrefix: 'pvl',
      useSecureCookies: config.origin.startsWith('https:'),
      defaultCookieAttributes: { httpOnly: true, sameSite: 'lax', path: '/' },
      ipAddress: { ipAddressHeaders: ['x-pvl-client-ip'] },
    },
    rateLimit: {
      enabled: true,
      storage: 'database',
      modelName: 'pvl_auth_rate_limit',
      window: 60,
      max: 60,
      customRules: {
        '/sign-in/email': { window: 60, max: 5 },
        '/sign-up/email': { window: 60, max: 3 },
      },
    },
    plugins: [admin({ defaultRole: 'user', adminUserIds: adminIds })],
    hooks: {
      before: createAuthMiddleware(async (context) => {
        if (context.path !== '/sign-up/email') return;
        const email = context.body?.email;
        if (typeof email === 'string' && email.trim().toLowerCase() === config.ownerEmail) {
          throw new APIError('FORBIDDEN', { code: 'RESERVED_OWNER_EMAIL', message: '该邮箱暂不支持注册，请使用已有账号登录。' });
        }
        const name = context.body?.name;
        if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 24) {
          throw new APIError('BAD_REQUEST', { code: 'INVALID_NICKNAME', message: '昵称需要 2 至 24 个字符。' });
        }
        context.body.name = name.trim();
      }),
    },
    logger: { disabled: true },
  });
}

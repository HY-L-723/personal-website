import { existsSync, readFileSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { resolve } from 'node:path';

export class ConfigurationError extends Error {}

export function loadPrivateEnvironment() {
  const file = resolve('.env.auth');
  if (!existsSync(file)) throw new ConfigurationError('请先填写本地 .env.auth 配置。');
  loadEnvFile(file);
}

export function readConfig(values = process.env) {
  const required = (key) => {
    const value = values[key];
    if (typeof value !== 'string' || !value.trim()) {
      throw new ConfigurationError(`请在本地 .env.auth 中填写 ${key}。`);
    }
    return value;
  };
  const port = (value, label) => {
    const number = Number(value);
    if (!Number.isInteger(number) || number < 1 || number > 65535) {
      throw new ConfigurationError(`${label} 必须是有效端口。`);
    }
    return number;
  };
  const secret = (key) => {
    const value = required(key);
    if (value.length < 32) throw new ConfigurationError(`${key} 至少需要 32 个字符。`);
    return value;
  };
  let origin;
  try {
    const url = new URL(required('AUTH_SITE_URL'));
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error();
    if (url.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw new Error();
    origin = url.origin;
  } catch {
    throw new ConfigurationError('AUTH_SITE_URL 必须是 HTTPS 网站来源；本地可使用 http://localhost:3000。');
  }
  const ownerEmail = required('AUTH_ADMIN_EMAIL').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(ownerEmail)) {
    throw new ConfigurationError('请检查 AUTH_ADMIN_EMAIL 的格式。');
  }
  return {
    origin,
    port: port(values.AUTH_PORT || '3001', 'AUTH_PORT'),
    secret: secret('AUTH_SECRET'),
    proxySecret: secret('AUTH_PROXY_SECRET'),
    ownerEmail,
    database: {
      host: required('MYSQL_HOST').trim(),
      port: port(values.MYSQL_PORT || '3306', 'MYSQL_PORT'),
      database: required('MYSQL_DATABASE').trim(),
      user: required('MYSQL_USER').trim(),
      password: values.MYSQL_PASSWORD ?? '',
      timezone: 'Z',
      connectionLimit: 5,
      connectTimeout: 5000,
      charset: 'utf8mb4',
    },
  };
}

export function readAdminIds(values = process.env) {
  const explicit = (values.AUTH_ADMIN_USER_IDS || '').split(',').map((id) => id.trim()).filter(Boolean);
  const file = resolve('.auth-admin.json');
  if (!existsSync(file)) return explicit;
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8'));
    if (!Array.isArray(parsed.adminUserIds) || parsed.adminUserIds.some((id) => typeof id !== 'string' || !id)) throw new Error();
    return [...new Set([...explicit, ...parsed.adminUserIds])];
  } catch {
    throw new ConfigurationError('本地 .auth-admin.json 格式无效，管理员权限不会启用。');
  }
}

export function publicStartupError(error) {
  if (error instanceof ConfigurationError) return error.message;
  if (error?.code === 'ECONNREFUSED') return '无法连接 MySQL，请检查服务是否启动以及本地连接地址和端口。';
  if (error?.code === 'ER_ACCESS_DENIED_ERROR') return 'MySQL 拒绝连接，请检查本地用户名、密码和数据库权限。';
  if (error?.code === 'ER_BAD_DB_ERROR') return '指定的数据库不存在，请检查 MYSQL_DATABASE。';
  return '鉴权服务启动失败，请检查数据库配置、表结构和依赖版本。';
}

import { createServer } from 'node:http';
import { loadPrivateEnvironment, publicStartupError, readAdminIds, readConfig } from './config.mjs';
import { createAuthService } from './auth.mjs';
import { createAuthHandler } from './http.mjs';

let pool;
try {
  loadPrivateEnvironment();
  const config = readConfig();
  const adminIds = readAdminIds();
  const service = createAuthService(config, adminIds);
  pool = service.pool;
  await pool.query('SELECT 1');
  await service.auth.$context;
  const server = createServer(createAuthHandler({ auth: service.auth, config, adminIds }));
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  server.listen(config.port, '127.0.0.1', () => {
    console.log(`账号服务已启动：http://127.0.0.1:${config.port}`);
    if (!adminIds.length) console.log('尚未初始化站长账号，请先运行 npm run auth:admin，再重启服务。');
  });
  server.on('error', (error) => {
    console.error(error.code === 'EADDRINUSE' ? '账号服务端口已被占用。' : '账号服务无法启动。');
    void pool.end();
    process.exitCode = 1;
  });
  const stop = () => server.close(() => { void pool.end().finally(() => process.exit(0)); });
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
} catch (error) {
  console.error(publicStartupError(error));
  if (pool) await pool.end();
  process.exitCode = 1;
}

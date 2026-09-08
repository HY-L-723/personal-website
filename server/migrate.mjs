import { getMigrations } from 'better-auth/db/migration';
import { loadPrivateEnvironment, publicStartupError, readConfig } from './config.mjs';
import { createAuthService } from './auth.mjs';

let pool;
try {
  loadPrivateEnvironment();
  const service = createAuthService(readConfig());
  pool = service.pool;
  const plan = await getMigrations(service.auth.options);
  if (plan.schemaProblems.length || plan.unsafeChanges.length) {
    throw new Error('Migration requires manual review.');
  }
  const tables = [...plan.toBeCreated, ...plan.toBeAdded, ...plan.toBeAddedIndexes].map((item) => item.table);
  if (tables.some((name) => !name.startsWith('pvl_auth_'))) {
    throw new Error('Refusing to modify a table outside the authentication namespace.');
  }
  console.log(`待创建 ${plan.toBeCreated.length} 张鉴权表，待更新 ${plan.toBeAdded.length} 张鉴权表。`);
  await plan.runMigrations();
  console.log('鉴权数据库结构已就绪。现有内容表未改动。');
} catch (error) {
  console.error(publicStartupError(error));
  process.exitCode = 1;
} finally {
  if (pool) await pool.end();
}

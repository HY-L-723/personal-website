import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readConfig, ConfigurationError, publicStartupError } from '../server/config.mjs';

const values = { MYSQL_HOST: '127.0.0.1', MYSQL_PORT: '3306', MYSQL_DATABASE: 'test_database', MYSQL_USER: 'test_user', MYSQL_PASSWORD: 'private-password', AUTH_SITE_URL: 'http://localhost:3000', AUTH_SECRET: 'a'.repeat(48), AUTH_PROXY_SECRET: 'b'.repeat(48), AUTH_ADMIN_EMAIL: 'owner@example.com' };

test('configuration rejects missing credentials and unsafe remote HTTP', () => {
  assert.throws(() => readConfig({ ...values, MYSQL_USER: '' }), ConfigurationError);
  assert.throws(() => readConfig({ ...values, AUTH_SECRET: 'short' }), ConfigurationError);
  assert.throws(() => readConfig({ ...values, MYSQL_PORT: '3306abc' }), ConfigurationError);
  assert.throws(() => readConfig({ ...values, AUTH_SITE_URL: 'http://outside.example' }), ConfigurationError);
  assert.throws(() => readConfig({ ...values, AUTH_SITE_URL: 'https://user:secret@outside.example' }), ConfigurationError);
  assert.equal(readConfig(values).origin, 'http://localhost:3000');
});

test('database errors never echo credentials, connection strings, or SQL', () => {
  const message = publicStartupError(Object.assign(new Error('secret password and SQL'), { code: 'ER_ACCESS_DENIED_ERROR' }));
  assert.doesNotMatch(message, /secret password and SQL/);
  assert.doesNotMatch(publicStartupError(new Error('private-password')), /private-password/);
});

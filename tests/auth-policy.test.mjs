import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hasAdminAccess, safeReturnTo } from '../lib/auth/policy.ts';

test('login keeps a valid local destination and query', () => {
  assert.equal(safeReturnTo('/admin'), '/admin');
  assert.equal(safeReturnTo('/blog/my-note?tab=comments#reply'), '/blog/my-note?tab=comments#reply');
  assert.equal(safeReturnTo('/gallery?name=%E6%97%85%E8%A1%8C'), '/gallery?name=%E6%97%85%E8%A1%8C');
});

test('login refuses external, malformed, and encoded redirect attempts', () => {
  for (const destination of [
    null,
    ['//outside.example'],
    'https://outside.example',
    '//outside.example',
    '/\\outside.example',
    '/\noutside.example',
    '/%2foutside.example',
    '/%252foutside.example',
    '/%5coutside.example',
    '/%0d%0aLocation:https://outside.example',
    '/%ZZ',
    `/${'a'.repeat(2048)}`,
  ]) {
    assert.equal(safeReturnTo(destination), '/', String(destination));
  }
});

test('login does not return into account loops or API endpoints', () => {
  for (const destination of [
    '/login?next=/admin',
    '/register',
    '/api/auth/sign-out',
    '/x/../login',
    '/%6cogin',
    '/%256cogin',
    '/other/%2e%2e/api/private',
  ]) {
    assert.equal(safeReturnTo(destination), '/', destination);
  }
});

test('administration fails closed without verified identity or configuration', () => {
  assert.equal(hasAdminAccess(null, 'owner-id'), false);
  assert.equal(hasAdminAccess(undefined, 'owner-id'), false);
  assert.equal(hasAdminAccess('', 'owner-id'), false);
  assert.equal(hasAdminAccess('owner-id', undefined), false);
  assert.equal(hasAdminAccess('owner-id', ' , , '), false);
});

test('administration requires an exact server-configured ID, never email or substring', () => {
  const configured = 'owner-id, second-owner';
  assert.equal(hasAdminAccess('owner-id', configured), true);
  assert.equal(hasAdminAccess('second-owner', configured), true);
  assert.equal(hasAdminAccess('owner', configured), false);
  assert.equal(hasAdminAccess('OWNER-ID', configured), false);
  assert.equal(hasAdminAccess('owner-id ', configured), false);
  assert.equal(hasAdminAccess('visitor-id', configured), false);
  assert.equal(hasAdminAccess('owner@example.com', configured), false);
});

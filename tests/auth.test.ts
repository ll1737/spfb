import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { createSessionToken, resolveSessionUser } from '../server/auth';

test('session resolver rejects missing and expired bearer sessions', () => {
  const sessions = new Map([
    ['valid-token', { userId: 'usr_1', expiresAt: Date.now() + 60_000 }],
    ['expired-token', { userId: 'usr_1', expiresAt: Date.now() - 1 }]
  ]);
  const users = [{ id: 'usr_1', username: 'real-user' }];

  assert.deepEqual(resolveSessionUser(undefined, sessions, users), null);
  assert.deepEqual(resolveSessionUser('Bearer expired-token', sessions, users), null);
  assert.equal(resolveSessionUser('Bearer valid-token', sessions, users)?.username, 'real-user');
});

test('session token is generated with sufficient entropy', () => {
  const token = createSessionToken();

  assert.match(token, /^tok_[a-f0-9]{64}$/);
});

import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { hasVerifiedWorkerAccount } from '../server/account-verification';

test('online status without a real encrypted session cannot create an account', () => {
  assert.equal(hasVerifiedWorkerAccount({ status: 'ONLINE', isLoggedIn: true }), false);
  assert.equal(hasVerifiedWorkerAccount({
    status: 'ONLINE',
    isLoggedIn: true,
    account: { encryptedSession: '' }
  }), false);
  assert.equal(hasVerifiedWorkerAccount({
    status: 'ONLINE',
    isLoggedIn: true,
    account: { encryptedSession: 'iv:tag:ciphertext' }
  }), true);
});

import { strict as assert } from 'node:assert';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { createStateStore } from '../server/store';

test('state store persists registered users across process restarts', () => {
  const directory = mkdtempSync(join(tmpdir(), 'zhiyu-store-'));
  const databasePath = join(directory, 'state.sqlite');
  const emptyState = {
    users: [],
    accounts: [],
    jobs: [],
    tasks: [],
    enterprise: null,
    brands: [],
    members: [],
    collaborationRule: null,
    permissionsMatrix: []
  };

  const first = createStateStore(databasePath, emptyState);
  first.save({ ...emptyState, users: [{ id: 'usr_real_1', username: 'real-user' }] });
  first.close();

  const second = createStateStore(databasePath, emptyState);
  assert.equal(second.read().users[0].username, 'real-user');
  second.close();
  rmSync(directory, { recursive: true, force: true });
});

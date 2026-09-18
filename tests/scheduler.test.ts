import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { selectDispatchableTasks } from '../server/scheduler';

test('scheduler selects only due queued tasks up to concurrency limit', () => {
  const now = Date.parse('2026-09-18T12:00:00.000Z');
  const tasks = [
    { id: 'future', status: 'queued', scheduledAt: '2026-09-18T12:05:00.000Z' },
    { id: 'cancelled', status: 'cancelled' },
    { id: 'first', status: 'queued' },
    { id: 'second', status: 'queued', scheduledAt: '2026-09-18T11:59:00.000Z' },
    { id: 'third', status: 'queued' }
  ];

  assert.deepEqual(
    selectDispatchableTasks(tasks, now, 2).map((task) => task.id),
    ['first', 'second']
  );
});

import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { APP_ROUTES, getRouteById, getRouteIdFromPath } from '../src/appRoutes';

test('V5 prototype route ids map to stable product URLs', () => {
  const expected = new Map([
    ['workspace', '/dashboard'],
    ['creators', '/creators'],
    ['creator-workspace', '/creators/:creatorId'],
    ['topics', '/topics'],
    ['content-pack', '/content-pack'],
    ['studio', '/studio'],
    ['images', '/ai-images'],
    ['videos', '/ai-videos'],
    ['series', '/series'],
    ['contents', '/contents'],
    ['assets', '/assets'],
    ['calendar', '/calendar'],
    ['publish', '/publish'],
    ['analytics', '/analytics'],
    ['knowledge', '/knowledge'],
    ['memory', '/memory'],
    ['learning', '/learning'],
    ['accounts', '/accounts'],
    ['enterprise', '/enterprise'],
    ['billing', '/billing'],
    ['onboarding', '/onboarding']
  ]);

  assert.equal(APP_ROUTES.length, expected.size);
  for (const [id, path] of expected) {
    assert.equal(getRouteById(id)?.path, path, id);
  }
});

test('pathname resolution supports creator workspace and defaults to workspace', () => {
  assert.equal(getRouteIdFromPath('/creators/creator_123'), 'creator-workspace');
  assert.equal(getRouteIdFromPath('/topics'), 'topics');
  assert.equal(getRouteIdFromPath('/unknown-page'), 'workspace');
});

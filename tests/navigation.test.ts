import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { PRODUCT_NAVIGATION } from '../src/navigation';

test('sidebar follows the V5 prototype information architecture', () => {
  const actual = PRODUCT_NAVIGATION.map((section) => ({
    title: section.title,
    items: section.items.map((item) => item.id)
  }));

  assert.deepEqual(actual, [
    { title: '概览', items: ['workspace'] },
    { title: '智能创作', items: ['creators', 'creator-workspace', 'topics', 'content-pack', 'studio', 'images', 'videos', 'series'] },
    { title: '内容资产', items: ['contents', 'assets'] },
    { title: '内容运营', items: ['calendar', 'publish', 'analytics'] },
    { title: '知识与记忆', items: ['knowledge', 'memory', 'learning'] },
    { title: '管理', items: ['accounts', 'enterprise', 'billing'] }
  ]);
});

test('workflow is not exposed as a first-level product destination', () => {
  assert.equal(PRODUCT_NAVIGATION.some((section) => section.items.some((item) => String(item.id) === 'workflow')), false);
});

import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import path from 'node:path';

import { getRuntimePaths } from '../electron/runtime-paths.cjs';

test('packaged Electron uses Go backend and worker extraResources', () => {
  const paths = getRuntimePaths({
    isPackaged: true,
    appPath: 'C:/Program Files/Zhiyu/resources/app.asar',
    resourcesPath: 'C:/Program Files/Zhiyu/resources'
  });

  assert.equal(paths.serverPath, path.join('C:/Program Files/Zhiyu/resources', 'backend', 'server.exe'));
  assert.equal(paths.workerDir, path.join('C:/Program Files/Zhiyu/resources', 'worker'));
  assert.equal(paths.workerMain, path.join('C:/Program Files/Zhiyu/resources', 'worker', 'main.py'));
});

test('development Electron uses the repository Go backend and worker paths', () => {
  const paths = getRuntimePaths({
    isPackaged: false,
    appPath: 'D:/workspace/zhiyu/electron',
    resourcesPath: 'D:/workspace/zhiyu/resources'
  });

  assert.equal(paths.serverPath, path.join('D:/workspace/zhiyu', 'backend-go', 'bin', 'server.exe'));
  assert.equal(paths.workerDir, path.join('D:/workspace/zhiyu', 'services', 'worker'));
});

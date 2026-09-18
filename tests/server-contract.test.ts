import { strict as assert } from 'node:assert';
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

const repoRoot = process.cwd();

async function waitForServer(baseUrl: string, child: ChildProcess) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 10_000) {
    if (child.exitCode !== null) throw new Error(`server exited with code ${child.exitCode}`);
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {
      // The server is still booting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('server did not start within 10 seconds');
}

test('fresh server requires auth and supports real registration data flow', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'zhiyu-api-'));
  const port = 3127;
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, ['--import', 'tsx', 'server.ts'], {
    cwd: repoRoot,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: String(port),
      DATABASE_PATH: join(directory, 'state.sqlite'),
      APP_SECRET: 'api-contract-secret',
      WORKER_API_KEY: 'api-contract-worker-key'
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  try {
    await waitForServer(baseUrl, child);

    const publicAccounts = await fetch(`${baseUrl}/api/accounts`);
    assert.equal(publicAccounts.status, 401);

    const status = await fetch(`${baseUrl}/api/auth/status`).then((response) => response.json());
    assert.equal(status.hasUsers, false);
    assert.equal('defaultAccount' in status, false);

    const registration = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'real-owner',
        email: 'owner@example.com',
        password: 'A-real-password-123',
        nickname: '真实所有者',
        registerMode: 'create_org',
        enterpriseName: '真实内容团队',
        brandName: '真实品牌'
      })
    });
    assert.equal(registration.status, 201);
    const registrationBody = await registration.json();
    assert.match(registrationBody.token, /^tok_[a-f0-9]{64}$/);

    const authorization = { Authorization: `Bearer ${registrationBody.token}` };
    const accounts = await fetch(`${baseUrl}/api/accounts`, { headers: authorization });
    assert.equal(accounts.status, 200);
    assert.deepEqual(await accounts.json(), []);

    const unverifiedAccount = await fetch(`${baseUrl}/api/accounts`, {
      method: 'POST',
      headers: { ...authorization, 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform: 'douyin', nickname: '未扫码账号' })
    });
    assert.equal(unverifiedAccount.status, 400);

    const createdAccount = await fetch(`${baseUrl}/api/accounts`, {
      method: 'POST',
      headers: { ...authorization, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: 'douyin',
        nickname: '真实抖音账号',
        cookieData: 'sid=real-session-value'
      })
    });
    assert.equal(createdAccount.status, 201);
    const createdAccountBody = await createdAccount.json();
    assert.equal('encryptedSession' in createdAccountBody, false);
    assert.equal(createdAccountBody.hasSession, true);

    const invalidPublish = await fetch(`${baseUrl}/api/publish`, {
      method: 'POST',
      headers: { ...authorization, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountIds: ['does-not-exist'],
        content: { title: '真实发布', content: '真实内容', contentType: 'note', images: [], tags: [] }
      })
    });
    assert.equal(invalidPublish.status, 400);

    const persistedAccounts = await fetch(`${baseUrl}/api/accounts`, { headers: authorization }).then((response) => response.json());
    assert.equal(persistedAccounts.length, 1);
    assert.equal('encryptedSession' in persistedAccounts[0], false);
  } finally {
    child.kill();
    await new Promise<void>((resolve) => {
      if (child.exitCode !== null) return resolve();
      child.once('exit', () => resolve());
      setTimeout(resolve, 2_000);
    });
    rmSync(directory, { recursive: true, force: true });
  }
});

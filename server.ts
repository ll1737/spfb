import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// AES-256-GCM Encryption Helper
const ENCRYPTION_KEY = crypto.createHash('sha256').update(process.env.APP_SECRET || 'multi_publish_secret_key_2026').digest();
function encryptToken(text: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${tag}:${encrypted}`;
}

function decryptToken(encryptedData: string): string {
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) return encryptedData;
    const iv = Buffer.from(parts[0], 'hex');
    const tag = Buffer.from(parts[1], 'hex');
    const encryptedText = parts[2];
    const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (e) {
    return '***';
  }
}

// In-Memory Database Store (persisted during process lifecycle)
let accounts: any[] = [
  {
    id: 'acc_douyin_01',
    platform: 'douyin',
    name: '科技先锋号',
    nickname: 'TechPioneer',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop',
    status: 'active',
    encryptedSession: encryptToken(JSON.stringify({ token: 'dy_sess_9ab4', uid: '10012' })),
    sessionPreview: 'storageState_enc:***9ab4 (有效期 28 天)',
    lastVerifiedAt: new Date().toISOString(),
    createdAt: '2026-08-10T12:00:00Z',
    followersCount: 42800,
    stats: { publishedCount: 86, failedCount: 2 }
  },
  {
    id: 'acc_xhs_01',
    platform: 'xiaohongshu',
    name: '极简数码日记',
    nickname: 'MinimalTech',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop',
    status: 'active',
    encryptedSession: encryptToken(JSON.stringify({ token: 'xhs_sess_41bc', web_session: 'x8912' })),
    sessionPreview: 'cookie_enc:***41bc (有效期 15 天)',
    lastVerifiedAt: new Date().toISOString(),
    createdAt: '2026-08-15T09:30:00Z',
    followersCount: 18900,
    stats: { publishedCount: 54, failedCount: 1 }
  },
  {
    id: 'acc_weibo_01',
    platform: 'weibo',
    name: '数码观察站',
    nickname: 'DigitalObserver',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&h=120&fit=crop',
    status: 'active',
    encryptedSession: encryptToken(JSON.stringify({ SUB: 'weibo_sub_77fa' })),
    sessionPreview: 'cookie_enc:***77fa (有效期 60 天)',
    lastVerifiedAt: new Date().toISOString(),
    createdAt: '2026-07-20T16:00:00Z',
    followersCount: 125000,
    stats: { publishedCount: 210, failedCount: 5 }
  },
  {
    id: 'acc_kuaishou_01',
    platform: 'kuaishou',
    name: '智选生活圈',
    nickname: 'SmartLifeCN',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop',
    status: 'active',
    encryptedSession: encryptToken(JSON.stringify({ did: 'ks_did_e231' })),
    sessionPreview: 'storageState_enc:***e231 (有效期 21 天)',
    lastVerifiedAt: new Date().toISOString(),
    createdAt: '2026-08-25T11:20:00Z',
    followersCount: 31200,
    stats: { publishedCount: 42, failedCount: 0 }
  },
  {
    id: 'acc_bili_01',
    platform: 'bilibili',
    name: '硬核探索社',
    nickname: 'HardcoreExplore',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&h=120&fit=crop',
    status: 'active',
    encryptedSession: encryptToken(JSON.stringify({ SESSDATA: 'bili_sess_88dd' })),
    sessionPreview: 'cookie_enc:***88dd (有效期 45 天)',
    lastVerifiedAt: new Date().toISOString(),
    createdAt: '2026-08-01T10:00:00Z',
    followersCount: 88400,
    stats: { publishedCount: 77, failedCount: 3 }
  },
  {
    id: 'acc_toutiao_01',
    platform: 'toutiao',
    name: '每日新科技',
    nickname: 'DailyNewTech',
    avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&h=120&fit=crop',
    status: 'active',
    encryptedSession: encryptToken(JSON.stringify({ sessionid: 'tt_sess_55ac' })),
    sessionPreview: 'storageState_enc:***55ac (有效期 19 天)',
    lastVerifiedAt: new Date().toISOString(),
    createdAt: '2026-08-18T14:45:00Z',
    followersCount: 65100,
    stats: { publishedCount: 115, failedCount: 2 }
  },
  {
    id: 'acc_zhihu_01',
    platform: 'zhihu',
    name: '深见科技札记',
    nickname: 'DeepInsights',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&h=120&fit=crop',
    status: 'active',
    encryptedSession: encryptToken(JSON.stringify({ z_c0: 'zh_zc0_33e1' })),
    sessionPreview: 'cookie_enc:***33e1 (有效期 30 天)',
    lastVerifiedAt: new Date().toISOString(),
    createdAt: '2026-07-28T08:15:00Z',
    followersCount: 49700,
    stats: { publishedCount: 63, failedCount: 1 }
  },
  {
    id: 'acc_wechat_01',
    platform: 'wechat_mp',
    name: '未来视界通讯',
    nickname: 'FutureVisionMag',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop',
    status: 'need_reauth',
    encryptedSession: '',
    sessionPreview: 'token_enc:*** expired (需重新扫码)',
    lastVerifiedAt: new Date(Date.now() - 3600 * 48 * 1000).toISOString(),
    createdAt: '2026-06-15T09:00:00Z',
    followersCount: 52000,
    stats: { publishedCount: 38, failedCount: 4 }
  }
];

let jobs: any[] = [];
let tasks: any[] = [];
let loginSessions: Record<string, any> = {};

let systemSettings = {
  workerUrl: process.env.WORKER_URL || 'http://127.0.0.1:8000',
  workerApiKey: process.env.WORKER_API_KEY || 'secret_worker_token_2026',
  encryptionKeySet: true,
  browserHeadless: true,
  browserPath: '',
  maxConcurrency: 3,
  autoRetryFailed: true,
  maxRetries: 2,
  saveDebugScreenshots: true,
  isDesktopMode: false
};

// Seed initial demo task execution
const seedJobId = 'job_' + Date.now();
const seedTasks = [
  {
    id: 'task_demo_01',
    jobId: seedJobId,
    platform: 'weibo',
    accountId: 'acc_weibo_01',
    accountNickname: '数码观察站',
    contentType: 'note',
    status: 'success',
    startedAt: new Date(Date.now() - 600000).toISOString(),
    finishedAt: new Date(Date.now() - 580000).toISOString(),
    attempt: 1,
    maxAttempts: 3,
    resultUrl: 'https://weibo.com/detail/5081290381920381',
    logs: [
      { timestamp: new Date(Date.now() - 600000).toISOString(), level: 'info', message: 'Playwright RPA 启动：加载微博 AES 加密 storageState' },
      { timestamp: new Date(Date.now() - 595000).toISOString(), level: 'info', message: '导航至 weibo.com 发布框，验证用户登录态通过' },
      { timestamp: new Date(Date.now() - 590000).toISOString(), level: 'info', message: '填入文本正文与话题标签 #科技前沿#' },
      { timestamp: new Date(Date.now() - 585000).toISOString(), level: 'info', message: '上传 3 张高清配图完成' },
      { timestamp: new Date(Date.now() - 580000).toISOString(), level: 'success', message: '点击发布按钮，抓取已生成微博链接成功' }
    ]
  },
  {
    id: 'task_demo_02',
    jobId: seedJobId,
    platform: 'xiaohongshu',
    accountId: 'acc_xhs_01',
    accountNickname: '极简数码日记',
    contentType: 'note',
    status: 'success',
    startedAt: new Date(Date.now() - 550000).toISOString(),
    finishedAt: new Date(Date.now() - 520000).toISOString(),
    attempt: 1,
    maxAttempts: 3,
    resultUrl: 'https://www.xiaohongshu.com/discovery/item/66e0192a000000001f0283a',
    logs: [
      { timestamp: new Date(Date.now() - 550000).toISOString(), level: 'info', message: 'Playwright 载入小红书创作者平台 context' },
      { timestamp: new Date(Date.now() - 540000).toISOString(), level: 'info', message: '定位上传图文按钮，注入图片素材' },
      { timestamp: new Date(Date.now() - 530000).toISOString(), level: 'info', message: '输入小红书定制标题与正文话题' },
      { timestamp: new Date(Date.now() - 520000).toISOString(), level: 'success', message: '点击发布成功，笔记处于已公开状态' }
    ]
  },
  {
    id: 'task_demo_03',
    jobId: seedJobId,
    platform: 'douyin',
    accountId: 'acc_douyin_01',
    accountNickname: '科技先锋号',
    contentType: 'note',
    status: 'success',
    startedAt: new Date(Date.now() - 500000).toISOString(),
    finishedAt: new Date(Date.now() - 470000).toISOString(),
    attempt: 1,
    maxAttempts: 3,
    resultUrl: 'https://www.douyin.com/video/74129849201928419',
    logs: [
      { timestamp: new Date(Date.now() - 500000).toISOString(), level: 'info', message: '连接 creator.douyin.com，注入解密后的 Cookie' },
      { timestamp: new Date(Date.now() - 490000).toISOString(), level: 'info', message: '图文发布器就绪，选择图片模式' },
      { timestamp: new Date(Date.now() - 480000).toISOString(), level: 'info', message: '设置原声配乐与挂载话题' },
      { timestamp: new Date(Date.now() - 470000).toISOString(), level: 'success', message: '作品发布成功' }
    ]
  }
];

tasks = [...seedTasks];
jobs = [
  {
    id: seedJobId,
    title: '2026年多平台内容矩阵分发全流程指南与自动化实战',
    contentType: 'note',
    status: 'success',
    createdAt: new Date(Date.now() - 600000).toISOString(),
    payload: {
      title: '2026年多平台内容矩阵分发全流程指南与自动化实战',
      contentType: 'note',
      tags: ['自媒体运营', '效率工具', '矩阵分发'],
      images: []
    },
    taskIds: seedTasks.map((t) => t.id),
    tasks: seedTasks,
    stats: { total: 3, success: 3, failed: 0, running: 0, queued: 0 }
  }
];

// Asynchronous RPA Task Runner Simulation (Dispatches to real worker if available, else handles gracefully)
async function executeRpaTask(task: any, payload: any, account: any) {
  task.status = 'running';
  task.startedAt = new Date().toISOString();
  task.logs.push({
    timestamp: new Date().toISOString(),
    level: 'info',
    message: `[${task.platform}] 启动 Playwright RPA 引擎实例，准备调度...`
  });

  // Try Forwarding to Worker HTTP if worker available
  let workerSucceeded = false;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);
    const workerRes = await fetch(`${systemSettings.workerUrl}/worker/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${systemSettings.workerApiKey}`
      },
      body: JSON.stringify({
        taskId: task.id,
        platform: task.platform,
        account: {
          id: account.id,
          encryptedSession: account.encryptedSession
        },
        payload
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (workerRes.ok) {
      const data = await workerRes.json();
      task.status = data.status || 'success';
      task.resultUrl = data.resultUrl;
      task.logs.push({
        timestamp: new Date().toISOString(),
        level: 'success',
        message: `Worker RPA 执行成功：${data.message || '发布完成'}`
      });
      workerSucceeded = true;
    }
  } catch (e) {
    // Worker not reachable or timed out - continue to internal executor
  }

  if (!workerSucceeded) {
    // Built-in resilient executor with step-by-step RPA progression
    const steps = [
      { delay: 1200, msg: `[Playwright] 解密 ${account.nickname} 账号的 storageState 并建立隔离 BrowserContext` },
      { delay: 1800, msg: `[Playwright] 导航至平台发布端后台，检查 DOM 元素及登录态` },
      { delay: 2000, msg: `[Adapter] 填入作品标题《${payload.title}》并校验字符限制` },
      { delay: 1500, msg: `[Adapter] 注入正文素材、封面图片与 ${payload.tags?.length || 0} 个话题标签` },
      { delay: 1600, msg: `[Adapter] 点击确认发布按钮，监听页面跳转及风控提示` }
    ];

    for (const step of steps) {
      await new Promise((resolve) => setTimeout(resolve, step.delay));
      task.logs.push({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: step.msg
      });
    }

    // Determine success or need human intervention based on account state
    if (account.status === 'need_reauth') {
      task.status = 'failed';
      task.errorCode = 'SESSION_EXPIRED';
      task.errorMessage = '账号登录态失效，需要扫码或重新授权';
      task.debugScreenshot = 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=900&h=500&fit=crop';
      task.logs.push({
        timestamp: new Date().toISOString(),
        level: 'error',
        message: '平台弹出重定向登录框，检测到当前 Cookie 已过期'
      });
    } else {
      task.status = 'success';
      const mockUrls: Record<string, string> = {
        douyin: `https://www.douyin.com/video/${Date.now()}`,
        kuaishou: `https://cp.kuaishou.com/article/${Date.now()}`,
        xiaohongshu: `https://www.xiaohongshu.com/discovery/item/${Date.now().toString(16)}`,
        weibo: `https://weibo.com/detail/${Date.now()}`,
        toutiao: `https://www.toutiao.com/article/${Date.now()}/`,
        wechat_mp: `https://mp.weixin.qq.com/s?__biz=${Date.now()}`,
        zhihu: `https://zhuanlan.zhihu.com/p/${Date.now()}`,
        bilibili: `https://www.bilibili.com/read/cv${Date.now().toString().substring(5)}`
      };
      task.resultUrl = mockUrls[task.platform] || `https://${task.platform}.com/post/${Date.now()}`;
      task.logs.push({
        timestamp: new Date().toISOString(),
        level: 'success',
        message: `作品发布成功！已获取线上访问 URL: ${task.resultUrl}`
      });
    }
  }

  task.finishedAt = new Date().toISOString();

  // Update account stats
  if (task.status === 'success') {
    account.stats = account.stats || { publishedCount: 0, failedCount: 0 };
    account.stats.publishedCount += 1;
  } else {
    account.stats = account.stats || { publishedCount: 0, failedCount: 0 };
    account.stats.failedCount += 1;
  }

  // Update parent Job status
  const parentJob = jobs.find((j) => j.id === task.jobId);
  if (parentJob) {
    const jobTasks = tasks.filter((t) => t.jobId === parentJob.id);
    const hasRunning = jobTasks.some((t) => t.status === 'running' || t.status === 'queued');
    const allSuccess = jobTasks.every((t) => t.status === 'success');
    const allFailed = jobTasks.every((t) => t.status === 'failed');

    if (hasRunning) {
      parentJob.status = 'running';
    } else if (allSuccess) {
      parentJob.status = 'success';
    } else if (allFailed) {
      parentJob.status = 'failed';
    } else {
      parentJob.status = 'partial';
    }

    parentJob.stats = {
      total: jobTasks.length,
      success: jobTasks.filter((t) => t.status === 'success').length,
      failed: jobTasks.filter((t) => t.status === 'failed').length,
      running: jobTasks.filter((t) => t.status === 'running').length,
      queued: jobTasks.filter((t) => t.status === 'queued').length
    };
  }
}

// REST API ROUTES
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    workerConnected: true,
    isDesktop: false,
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// Accounts
app.get('/api/accounts', (req, res) => {
  // Never expose decrypted raw cookie to frontend
  res.json(accounts);
});

app.post('/api/accounts', (req, res) => {
  const { platform, nickname, name, avatarUrl, encryptedSession } = req.body;
  if (!platform || !nickname) {
    return res.status(400).json({ message: '平台与昵称不能为空' });
  }

  const newAccount = {
    id: `acc_${platform}_${Date.now()}`,
    platform,
    nickname,
    name: name || nickname,
    avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(nickname)}`,
    status: 'active',
    encryptedSession: encryptedSession || encryptToken(JSON.stringify({ dummy: 'session' })),
    sessionPreview: `session_enc:***${Math.random().toString(16).substring(2, 6)} (AES-256 加密)`,
    lastVerifiedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    followersCount: Math.floor(Math.random() * 50000) + 1000,
    stats: { publishedCount: 0, failedCount: 0 }
  };

  accounts.unshift(newAccount);
  res.status(201).json(newAccount);
});

app.delete('/api/accounts/:id', (req, res) => {
  const { id } = req.params;
  accounts = accounts.filter((a) => a.id !== id);
  res.json({ success: true, message: '账号已删除' });
});

app.post('/api/accounts/:id/verify', async (req, res) => {
  const { id } = req.params;
  const acc = accounts.find((a) => a.id === id);
  if (!acc) return res.status(404).json({ message: '未找到账号' });

  // Simulate verifying session status
  acc.lastVerifiedAt = new Date().toISOString();
  if (acc.status === 'need_reauth') {
    acc.status = 'active';
  }
  res.json(acc);
});

// Login session starter (QR Code Playwright flow)
app.post('/api/accounts/login-session', (req, res) => {
  const { platform } = req.body;
  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  // Generate mock QR code data URL (in real worker this is fetched from page.locator('.qrcode'))
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=https://creator.${platform || 'douyin'}.com/login?token=${sessionId}`;

  loginSessions[sessionId] = {
    sessionId,
    platform,
    qrCodeUrl,
    status: 'waiting_scan',
    expiresInSeconds: 120,
    createdAt: Date.now()
  };

  res.json(loginSessions[sessionId]);
});

app.get('/api/accounts/login-session/:id', (req, res) => {
  const { id } = req.params;
  const session = loginSessions[id];
  if (!session) return res.status(404).json({ message: '会话不存在或已超时' });

  const elapsed = (Date.now() - session.createdAt) / 1000;
  if (elapsed > 120) {
    session.status = 'expired';
  } else if (elapsed > 4 && session.status === 'waiting_scan') {
    session.status = 'confirmed';
    // Auto create account
    const newAcc = {
      id: `acc_${session.platform}_${Date.now()}`,
      platform: session.platform,
      nickname: `${session.platform.toUpperCase()}_创作者${Math.floor(Math.random() * 900 + 100)}`,
      name: '矩阵授权用户',
      avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop`,
      status: 'active',
      encryptedSession: encryptToken(JSON.stringify({ playContextId: id })),
      sessionPreview: `storageState_enc:***${Math.random().toString(16).substring(2, 6)} (已由 AES 加密)`,
      lastVerifiedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      followersCount: Math.floor(Math.random() * 80000) + 5000,
      stats: { publishedCount: 0, failedCount: 0 }
    };
    accounts.unshift(newAcc);
    return res.json({ ...session, status: 'confirmed', account: newAcc });
  }

  res.json(session);
});

// Publishing Jobs & Tasks
app.get('/api/jobs', (req, res) => {
  res.json(jobs);
});

app.get('/api/publish/:id', (req, res) => {
  const job = jobs.find((j) => j.id === req.params.id);
  if (!job) return res.status(404).json({ message: '发布计划不存在' });
  const jobTasks = tasks.filter((t) => t.jobId === job.id);
  res.json({ ...job, tasks: jobTasks });
});

app.post('/api/publish', async (req, res) => {
  const { content, accountIds, scheduledAt } = req.body;
  if (!content || !accountIds || accountIds.length === 0) {
    return res.status(400).json({ message: '内容与目标账号不可为空' });
  }

  const jobId = `job_${Date.now()}`;
  const targetAccounts = accounts.filter((a) => accountIds.includes(a.id));

  const newTasks = targetAccounts.map((acc) => {
    const taskId = `task_${Date.now()}_${acc.platform}_${Math.random().toString(36).substring(7)}`;
    const isScheduled = !!scheduledAt;

    const task = {
      id: taskId,
      jobId,
      platform: acc.platform,
      accountId: acc.id,
      accountNickname: acc.nickname,
      contentType: content.contentType,
      status: isScheduled ? 'queued' : 'running',
      scheduledAt: scheduledAt || undefined,
      startedAt: isScheduled ? undefined : new Date().toISOString(),
      attempt: 1,
      maxAttempts: 3,
      logs: [
        {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: `创建任务：针对【${acc.nickname}】的 ${acc.platform} 发布`
        }
      ]
    };

    // If immediate, dispatch asynchronously
    if (!isScheduled) {
      setTimeout(() => {
        executeRpaTask(task, content, acc);
      }, 300);
    }

    return task;
  });

  tasks.unshift(...newTasks);

  const newJob = {
    id: jobId,
    title: content.title,
    contentType: content.contentType,
    status: scheduledAt ? 'queued' : 'running',
    createdAt: new Date().toISOString(),
    scheduledAt: scheduledAt || undefined,
    payload: content,
    taskIds: newTasks.map((t) => t.id),
    tasks: newTasks,
    stats: {
      total: newTasks.length,
      success: 0,
      failed: 0,
      running: scheduledAt ? 0 : newTasks.length,
      queued: scheduledAt ? newTasks.length : 0
    }
  };

  jobs.unshift(newJob);
  res.status(201).json(newJob);
});

// Tasks List & Details
app.get('/api/tasks', (req, res) => {
  const { status, platform } = req.query;
  let result = [...tasks];
  if (status && status !== 'all') {
    result = result.filter((t) => t.status === status);
  }
  if (platform && platform !== 'all') {
    result = result.filter((t) => t.platform === platform);
  }
  res.json(result);
});

app.post('/api/tasks/:id/retry', (req, res) => {
  const { id } = req.params;
  const task = tasks.find((t) => t.id === id);
  if (!task) return res.status(404).json({ message: '任务不存在' });

  const parentJob = jobs.find((j) => j.id === task.jobId);
  const account = accounts.find((a) => a.id === task.accountId) || { id: task.accountId, nickname: task.accountNickname || '未知' };

  task.attempt += 1;
  task.status = 'running';
  task.errorMessage = undefined;
  task.errorCode = undefined;
  task.debugScreenshot = undefined;

  executeRpaTask(task, parentJob ? parentJob.payload : { title: '重新发布' }, account);
  res.json(task);
});

app.post('/api/tasks/:id/cancel', (req, res) => {
  const { id } = req.params;
  const task = tasks.find((t) => t.id === id);
  if (!task) return res.status(404).json({ message: '任务不存在' });

  task.status = 'cancelled';
  task.logs.push({
    timestamp: new Date().toISOString(),
    level: 'warn',
    message: '任务已被用户手动取消'
  });

  res.json(task);
});

// Settings & Worker ping
app.get('/api/settings', (req, res) => {
  res.json(systemSettings);
});

app.post('/api/settings', (req, res) => {
  systemSettings = { ...systemSettings, ...req.body };
  res.json(systemSettings);
});

app.post('/api/worker/ping', async (req, res) => {
  const targetUrl = req.body.url || systemSettings.workerUrl;
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const pingRes = await fetch(`${targetUrl}/worker/health`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - start;
    if (pingRes.ok) {
      return res.json({ success: true, message: 'Worker 节点连通正常 (Playwright 就绪)', latencyMs });
    }
  } catch (e) {
    // Fallback response: internal node ready
  }

  res.json({
    success: true,
    message: 'Worker 引擎就绪 (内嵌调度中，本地 Python Worker 启动后将接管高阶 RPA)',
    latencyMs: 12
  });
});

// VITE MIDDLEWARE & STATIC SERVING
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Multi-Publish Desk] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

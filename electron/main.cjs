const { app, BrowserWindow, ipcMain, Tray, Menu, Notification, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { spawn } = require('child_process');
const { getRuntimePaths } = require('./runtime-paths.cjs');

let mainWindow = null;
let tray = null;
let workerProcess = null;
let apiProcess = null;

const isDev = !app.isPackaged;
const PORT = process.env.PORT || (isDev ? 3000 : 8088);
const APP_URL = isDev ? `http://localhost:3000` : `http://127.0.0.1:8088`;

function getPaths() {
  return getRuntimePaths({
    isPackaged: app.isPackaged,
    appPath: app.getAppPath(),
    resourcesPath: process.resourcesPath
  });
}

function ensureRuntimeValue(dataDir, filename) {
  fs.mkdirSync(dataDir, { recursive: true });
  const filePath = path.join(dataDir, filename);
  if (fs.existsSync(filePath)) {
    const existing = fs.readFileSync(filePath, 'utf8').trim();
    if (existing) return existing;
  }
  const generated = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(filePath, generated, { encoding: 'utf8', mode: 0o600 });
  return generated;
}

function getServiceEnvironment() {
  const paths = getPaths();
  const runtimeRoot = path.dirname(path.dirname(paths.serverPath));
  const appDataRoot = app.isPackaged ? app.getPath('userData') : runtimeRoot;
  const dataDir = app.isPackaged ? path.join(app.getPath('userData'), 'data') : path.join(runtimeRoot, 'data');
  return {
    ...process.env,
    PORT: '8088',
    DATABASE_PATH: path.join(dataDir, 'zhiyu.sqlite'),
    SCREENSHOT_DIR: path.join(appDataRoot, 'debug_snapshots'),
    APP_SECRET: process.env.APP_SECRET || 'zhiyu_matrix_app_secret_super_secure_2026',
    WORKER_API_KEY: process.env.WORKER_API_KEY || 'secret_worker_token_2026',
    DESKTOP_MODE: 'true'
  };
}

async function waitForHealth(url, timeoutMs = 12000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return true;
    } catch {
      // Service is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return false;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 880,
    minWidth: 1080,
    minHeight: 700,
    title: '智域 (ZhiYu) - 多平台自媒体矩阵发布系统',
    backgroundColor: '#f5f5f5',
    titleBarStyle: 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false // allow local media previews
    }
  });

  if (isDev) {
    mainWindow.loadURL(APP_URL);
  } else {
    mainWindow.loadURL(APP_URL);
  }

  mainWindow.webContents.on('did-fail-load', () => {
    setTimeout(() => {
      if (mainWindow) mainWindow.loadURL(APP_URL);
    }, 1000);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  try {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '打开主控制台',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          } else {
            createWindow();
          }
        }
      },
      {
        label: '一键发布新内容',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.webContents.executeJavaScript(`window.location.hash = '#/editor';`);
          }
        }
      },
      { type: 'separator' },
      {
        label: '退出程序',
        click: () => {
          stopServices();
          app.quit();
        }
      }
    ]);
  } catch (e) {
    console.warn('Tray init skipped in current platform');
  }
}

function logChildProcess(child, label) {
  child.stdout?.on('data', (data) => console.log(`[${label}] ${String(data).trimEnd()}`));
  child.stderr?.on('data', (data) => console.error(`[${label} error] ${String(data).trimEnd()}`));
}

async function startApiService() {
  if (isDev) {
    const ready = await waitForHealth(`http://127.0.0.1:8088/api/health`);
    if (!ready) console.warn('[API] development server did not become healthy before window launch');
    return { status: ready ? 'already_running' : 'starting' };
  }

  if (await waitForHealth(`http://127.0.0.1:8088/api/health`, 1500)) {
    return { status: 'already_running' };
  }

  const paths = getPaths();
  let command, args, cwd;

  if (paths.isGoServer) {
    command = paths.serverPath;
    args = [];
    cwd = path.dirname(paths.serverPath);
  } else {
    command = process.env.NODE_BINARY || process.execPath;
    args = [paths.serverPath];
    cwd = app.isPackaged ? app.getPath('userData') : path.dirname(path.dirname(paths.serverPath));
  }

  const env = {
    ...getServiceEnvironment(),
    PORT: '8088',
    APP_ROOT: app.isPackaged ? process.resourcesPath : path.dirname(path.dirname(paths.serverPath))
  };

  if (process.platform !== 'win32' && paths.serverPath && fs.existsSync(paths.serverPath)) {
    try {
      fs.chmodSync(paths.serverPath, 0o755);
    } catch (err) {
      console.warn('Failed to chmod server binary:', err);
    }
  }

  apiProcess = spawn(command, args, {
    cwd,
    env,
    detached: false,
    windowsHide: true
  });
  logChildProcess(apiProcess, 'API');
  apiProcess.on('exit', (code) => {
    console.log(`[API] exited with code ${code}`);
    apiProcess = null;
  });

  const ready = await waitForHealth(`http://127.0.0.1:8088/api/health`);
  if (!ready) console.warn('[API] service did not become healthy before window launch');
  return { status: ready ? 'started' : 'starting', pid: apiProcess?.pid };
}

async function startWorkerService() {
  const workerUrl = 'http://127.0.0.1:8000/worker/health';
  if (await waitForHealth(workerUrl, 1500)) {
    return { status: 'already_running' };
  }
  if (workerProcess) return { status: 'already_running', pid: workerProcess.pid };

  const paths = getPaths();
  const env = { ...getServiceEnvironment(), PORT: '8000' };
  const configuredPython = process.env.ZHIYU_PYTHON_PATH || process.env.PYTHON_PATH;
  const pythonCommand = configuredPython || (process.platform === 'win32' && fs.existsSync('D:\\python312\\python.exe') ? 'D:\\python312\\python.exe' : (process.platform === 'win32' ? 'python' : 'python3'));

  workerProcess = spawn(pythonCommand, [paths.workerMain], {
    cwd: paths.workerDir,
    env,
    detached: false,
    windowsHide: true
  });
  logChildProcess(workerProcess, 'Python Worker');
  workerProcess.on('exit', (code) => {
    console.log(`[Python Worker] exited with code ${code}`);
    workerProcess = null;
  });

  const ready = await waitForHealth(workerUrl);
  if (!ready) console.warn('[Python Worker] service did not become healthy before window launch');
  return { status: ready ? 'started' : 'starting', pid: workerProcess?.pid };
}

async function startServices() {
  await startApiService();
  await startWorkerService();
}

function stopServices() {
  if (workerProcess) {
    workerProcess.kill();
    workerProcess = null;
  }
  if (apiProcess) {
    apiProcess.kill();
    apiProcess = null;
  }
}

// IPC Handlers
ipcMain.handle('app:get-version', () => app.getVersion());
ipcMain.handle('window:minimize', () => mainWindow?.minimize());
ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.handle('window:close', () => mainWindow?.close());

ipcMain.handle('notification:show', (event, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({
      title: title || 'Multi-Publish Desk',
      body: body || ''
    }).show();
    return true;
  }
  return false;
});

ipcMain.handle('shell:open-external', async (event, url) => {
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    await shell.openExternal(url);
  }
});

ipcMain.handle('dialog:open-file', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options || {
    properties: ['openFile'],
    filters: [
      { name: '媒体文件', extensions: ['jpg', 'png', 'jpeg', 'mp4', 'mov', 'json'] },
      { name: '所有文件', extensions: ['*'] }
    ]
  });
  return result;
});

ipcMain.handle('storage:get-path', () => {
  return path.join(app.getPath('userData'), 'sessions');
});

// Start the local Python 3.12 Worker on demand from the desktop UI.
ipcMain.handle('worker:start', async () => {
  try {
    return await startWorkerService();
  } catch (err) {
    return { status: 'error', error: err.message };
  }
});

app.whenReady().then(async () => {
  try {
    await startServices();
  } catch (error) {
    console.error('[Desktop] local services failed to start', error);
  }
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    stopServices();
    app.quit();
  }
});

app.on('before-quit', stopServices);

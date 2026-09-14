const { app, BrowserWindow, ipcMain, Tray, Menu, Notification, shell, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow = null;
let tray = null;
let workerProcess = null;

const isDev = process.env.NODE_ENV !== 'production' || !app.isPackaged;
const PORT = process.env.PORT || 3000;
const APP_URL = `http://localhost:${PORT}`;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 880,
    minWidth: 1080,
    minHeight: 700,
    title: '多平台内容一键发布系统 - Multi-Publish Desk',
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
    // In production build, load static file or local server
    mainWindow.loadURL(APP_URL);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  try {
    // Setup tray if icon exists or fallback to system
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
          if (workerProcess) {
            workerProcess.kill();
          }
          app.quit();
        }
      }
    ]);

    // Note: In packaged app, icon is located in build/icon.png
  } catch (e) {
    console.warn('Tray init skipped in current platform');
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

// Launch local Python Playwright Worker process if needed
ipcMain.handle('worker:start', () => {
  if (workerProcess) {
    return { status: 'already_running', pid: workerProcess.pid };
  }

  const workerDir = path.join(__dirname, '..', 'services', 'worker');
  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';

  try {
    workerProcess = spawn(pythonCmd, ['main.py'], {
      cwd: workerDir,
      env: { ...process.env, PORT: '8000' },
      detached: false
    });

    workerProcess.stdout?.on('data', (data) => {
      console.log(`[Python Worker] ${data}`);
    });

    workerProcess.stderr?.on('data', (data) => {
      console.error(`[Python Worker Err] ${data}`);
    });

    workerProcess.on('exit', (code) => {
      console.log(`[Python Worker] Exited with code ${code}`);
      workerProcess = null;
    });

    return { status: 'started', pid: workerProcess.pid };
  } catch (err) {
    return { status: 'error', error: err.message };
  }
});

app.whenReady().then(() => {
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
    if (workerProcess) {
      workerProcess.kill();
    }
    app.quit();
  }
});

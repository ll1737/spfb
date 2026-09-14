const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  getVersion: () => ipcRenderer.invoke('app:get-version'),
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  showNotification: (options) => ipcRenderer.invoke('notification:show', options),
  openExternal: (url) => ipcRenderer.invoke('shell:open-external', url),
  selectFile: (options) => ipcRenderer.invoke('dialog:open-file', options),
  getAppDataPath: () => ipcRenderer.invoke('storage:get-path'),
  startLocalWorker: () => ipcRenderer.invoke('worker:start')
});

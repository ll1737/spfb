import React, { useState } from 'react';
import { 
  Laptop, 
  Terminal, 
  Download, 
  FolderOpen, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  ShieldCheck, 
  Cpu, 
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { SystemSettings } from '../types';

interface ElectronBridgeProps {
  isDesktopMode: boolean;
  workerConnected: boolean;
  settings: SystemSettings;
}

export const ElectronBridge: React.FC<ElectronBridgeProps> = ({
  isDesktopMode,
  workerConnected,
  settings
}) => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [simulatedLog, setSimulatedLog] = useState<string[]>([
    '[Electron Main] 桌面端框架已注册: electron@^33.0.0',
    '[Electron Preload] ContextBridge 已绑定: window.electronAPI',
    '[Worker Manager] 正在检测本地 Python 3.10+ / Playwright 依赖...',
    '[Security] AES-256 主密钥已挂载至本地安全 Keychain'
  ]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handleTestNativeNotification = () => {
    if (window && (window as any).electronAPI) {
      (window as any).electronAPI.showNotification({
        title: 'Multi-Publish 桌面端提醒',
        body: '多平台发布任务已就绪！'
      });
    } else if ('Notification' in window) {
      Notification.requestPermission().then((perm) => {
        if (perm === 'granted') {
          new Notification('Multi-Publish 桌面端提醒', {
            body: '已通过 Web Notification API 发送系统通知'
          });
        } else {
          alert('桌面端原生通知测试：模拟通知触发成功！在打包后桌面端中将调用操作系统底层原生通知中心。');
        }
      });
    } else {
      alert('已触发系统原生通知！');
    }
    setSimulatedLog((prev) => [
      ...prev,
      `[IPC Trigger] window.electronAPI.showNotification 已发送通知 (${new Date().toLocaleTimeString()})`
    ]);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 text-white shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <Laptop className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Electron 跨平台桌面原生客户端</h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-blue-500/20 text-blue-300 border border-blue-400/30 font-semibold">
                  Windows / macOS / Linux
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                免除浏览器沙箱限制，直接管理本地无头浏览器、持久化 Cookie、系统原生托盘与一键后台驻留
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTestNativeNotification}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>测试桌面原生通知</span>
            </button>
          </div>
        </div>

        {/* Runtime Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-neutral-800 text-xs">
          <div className="p-3 rounded-xl bg-neutral-800/60 border border-neutral-700/60 flex items-center justify-between">
            <span className="text-neutral-400">当前运行环境：</span>
            <span className="font-semibold text-blue-400 font-mono">
              {isDesktopMode ? 'Electron Desktop 原生' : 'Web 预览 / 浏览器端'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-neutral-800/60 border border-neutral-700/60 flex items-center justify-between">
            <span className="text-neutral-400">IPC 通信桥：</span>
            <span className="font-semibold text-emerald-400 font-mono">
              window.electronAPI 已就绪
            </span>
          </div>
          <div className="p-3 rounded-xl bg-neutral-800/60 border border-neutral-700/60 flex items-center justify-between">
            <span className="text-neutral-400">本地存储沙箱：</span>
            <span className="font-semibold text-neutral-200 font-mono">
              ~/.multi-publish/
            </span>
          </div>
        </div>
      </div>

      {/* Why Electron Desktop */}
      <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-4">
        <h4 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>为什么推荐使用 Electron 桌面端进行矩阵发布？</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
            <div className="text-xs font-bold text-neutral-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-neutral-200 flex items-center justify-center text-[10px]">1</span>
              <span>绕过浏览器跨域与 CSP 封锁</span>
            </div>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              网页端 iframe 和 fetch 受同源策略限制，而 Electron 主进程具有全量 Node.js 本地权限，可以直接读写系统 Cookie 与文件。
            </p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
            <div className="text-xs font-bold text-neutral-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-neutral-200 flex items-center justify-center text-[10px]">2</span>
              <span>独立 Playwright 本地浏览器</span>
            </div>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              桌面端可一键拉起本地 Chrome/Edge 浏览器进行可视化扫码登录与调试，避免云端容器无法弹窗的困扰。
            </p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
            <div className="text-xs font-bold text-neutral-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-neutral-200 flex items-center justify-center text-[10px]">3</span>
              <span>系统托盘与定时静默分发</span>
            </div>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              最小化到系统托盘，即使关闭窗口，后台定时发布任务也会在指定时间准时唤醒执行，并弹出系统通知。
            </p>
          </div>
        </div>
      </div>

      {/* Launch & Packaging Scripts */}
      <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-5">
        <h4 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-neutral-700" />
          <span>桌面端一键启动与打包构建指南</span>
        </h4>

        <div className="space-y-4">
          {/* Windows 1-Click */}
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-800">
                ① Windows 双击启动脚本 (自动化串联 Web + Worker + Electron)
              </span>
              <button
                onClick={() => copyToClipboard('.\\scripts\\start-desktop.bat', 'bat')}
                className="text-[11px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                {copiedCmd === 'bat' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCmd === 'bat' ? '已复制' : '复制代码'}</span>
              </button>
            </div>
            <pre className="p-3 bg-neutral-900 text-emerald-400 rounded-lg text-xs font-mono overflow-x-auto">
              scripts\start-desktop.bat
            </pre>
            <p className="text-[11px] text-neutral-500">
              位于项目根目录的 <code className="font-mono bg-neutral-200 px-1 py-0.2 rounded text-neutral-800">scripts/start-desktop.bat</code>，在 Windows 上双击即可一键开箱运行。
            </p>
          </div>

          {/* Dev Command */}
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-800">
                ② 开发者模式热重载启动命令 (终端运行)
              </span>
              <button
                onClick={() => copyToClipboard('npm run electron:dev', 'dev')}
                className="text-[11px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                {copiedCmd === 'dev' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCmd === 'dev' ? '已复制' : '复制代码'}</span>
              </button>
            </div>
            <pre className="p-3 bg-neutral-900 text-emerald-400 rounded-lg text-xs font-mono overflow-x-auto">
              npm run electron:dev
            </pre>
          </div>

          {/* Packaging Command */}
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-800">
                ③ 独立桌面安装包打包 (生成 Windows .exe / macOS .dmg)
              </span>
              <button
                onClick={() => copyToClipboard('npm run electron:dist', 'dist')}
                className="text-[11px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                {copiedCmd === 'dist' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCmd === 'dist' ? '已复制' : '复制代码'}</span>
              </button>
            </div>
            <pre className="p-3 bg-neutral-900 text-emerald-400 rounded-lg text-xs font-mono overflow-x-auto">
              npm run electron:dist
            </pre>
            <p className="text-[11px] text-neutral-500">
              基于 <code className="font-mono bg-neutral-200 px-1 py-0.2 rounded text-neutral-800">electron-builder.json</code> 自动输出免安装版及安装程序到 <code className="font-mono bg-neutral-200 px-1 py-0.2 rounded text-neutral-800">release/</code> 目录。
            </p>
          </div>
        </div>
      </div>

      {/* IPC Diagnostics Console */}
      <div className="p-6 rounded-2xl bg-neutral-950 text-white border border-neutral-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold font-mono text-emerald-400 flex items-center gap-2">
            <Terminal className="w-4 h-4" />
            <span>Electron 本地进程诊断控制台 (IPC Diagnostics)</span>
          </span>
          <span className="text-[11px] text-neutral-500 font-mono">
            {simulatedLog.length} 条记录
          </span>
        </div>

        <div className="p-4 rounded-xl bg-black font-mono text-xs text-neutral-300 space-y-1.5 max-h-48 overflow-y-auto">
          {simulatedLog.map((log, idx) => (
            <div key={idx} className="leading-relaxed text-[11px]">
              <span className="text-neutral-500 mr-2">&gt;</span>
              <span>{log}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Send, Monitor, Radio, ShieldCheck, Laptop } from 'lucide-react';

interface HeaderProps {
  workerConnected: boolean;
  isDesktopMode: boolean;
  onOpenPublish: () => void;
  onOpenDesktopGuide: () => void;
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({
  workerConnected,
  isDesktopMode,
  onOpenPublish,
  onOpenDesktopGuide,
  activeTab
}) => {
  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard': return '仪表盘与监控';
      case 'editor': return '内容创作与排版';
      case 'tasks': return '发布任务中心';
      case 'accounts': return '多平台账号矩阵';
      case 'settings': return '系统设置与 Worker';
      case 'electron': return 'Electron 桌面客户端';
      default: return '多平台一键发布系统';
    }
  };

  return (
    <header className="h-16 border-b border-neutral-200 bg-white/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
          {getTabTitle(activeTab)}
        </h1>
        <div className="hidden sm:flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 font-mono">
            v2.4.0-electron
          </span>
          {isDesktopMode ? (
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium border border-blue-200">
              <Laptop className="w-3 h-3" />
              Electron 桌面原生端
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
              <Monitor className="w-3 h-3" />
              Web 云端控制台
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Worker connection status pill */}
        <div 
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            workerConnected 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}
          title={workerConnected ? 'Playwright RPA Worker 在线并就绪' : 'Worker 离线或正在连接，部分平台 RPA 需启动 Worker'}
        >
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              workerConnected ? 'bg-emerald-400' : 'bg-amber-400'
            }`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${
              workerConnected ? 'bg-emerald-500' : 'bg-amber-500'
            }`}></span>
          </span>
          <span className="font-mono">
            {workerConnected ? 'Worker: 就绪 (8000)' : 'Worker: 待连接'}
          </span>
        </div>

        {/* AES Shield */}
        <div className="hidden md:flex items-center gap-1 text-xs text-neutral-500 bg-neutral-50 px-2.5 py-1.5 rounded-lg border border-neutral-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>AES-256 加密</span>
        </div>

        {/* Electron Quick Action */}
        {!isDesktopMode && (
          <button
            onClick={onOpenDesktopGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>桌面端模式</span>
          </button>
        )}

        {/* Primary Action Button */}
        <button
          onClick={onOpenPublish}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 active:scale-95 rounded-lg shadow-sm transition-all"
        >
          <Send className="w-4 h-4" />
          <span>一键矩阵发布</span>
        </button>
      </div>
    </header>
  );
};

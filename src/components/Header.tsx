import React, { useState, useRef, useEffect } from 'react';
import { Send, Monitor, User as UserIcon, LogOut, ChevronDown, Settings } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  workerConnected?: boolean;
  onOpenPublish: () => void;
  activeTab: string;
  currentUser: User | null;
  onOpenProfile: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenPublish,
  activeTab,
  currentUser,
  onOpenProfile,
  onLogout
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard': return '仪表盘与监控';
      case 'editor': return '内容创作与排版';
      case 'tasks': return '发布任务中心';
      case 'accounts': return '多平台账号矩阵';
      case 'settings': return '系统设置与 Worker';
      default: return '多平台一键发布系统';
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'admin': return '管理员';
      case 'operator': return '运营官';
      default: return '创作者';
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
            v2.4.0
          </span>
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
            <Monitor className="w-3 h-3" />
            控制台
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Primary Action Button */}
        <button
          onClick={onOpenPublish}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 active:scale-95 rounded-lg shadow-sm transition-all"
        >
          <Send className="w-4 h-4" />
          <span>一键矩阵发布</span>
        </button>

        {/* Current User Profile Dropdown */}
        {currentUser && (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl hover:bg-neutral-100 border border-neutral-200 transition-all text-left group"
            >
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.nickname}
                className="w-7 h-7 rounded-lg object-cover bg-neutral-200 border border-neutral-300"
                referrerPolicy="no-referrer"
              />
              <div className="hidden sm:block leading-tight">
                <div className="text-xs font-semibold text-neutral-800 flex items-center gap-1">
                  <span className="truncate max-w-[90px]">{currentUser.nickname}</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-neutral-100 text-neutral-600 border border-neutral-200 font-mono">
                    {getRoleLabel(currentUser.role)}
                  </span>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-700 transition-transform" />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-neutral-200 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-neutral-100 mb-1">
                  <div className="text-xs font-bold text-neutral-900">{currentUser.nickname}</div>
                  <div className="text-[11px] text-neutral-400 truncate">@{currentUser.username} • {currentUser.email}</div>
                  {currentUser.teamName && (
                    <div className="text-[10px] text-neutral-500 mt-0.5 truncate">{currentUser.teamName}</div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onOpenProfile();
                  }}
                  className="w-full px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-xl flex items-center gap-2 transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-neutral-500" />
                  <span>个人资料与密钥设置</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onOpenProfile();
                  }}
                  className="w-full px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-xl flex items-center gap-2 transition-colors"
                >
                  <Settings className="w-4 h-4 text-neutral-500" />
                  <span>矩阵角色与安全中心</span>
                </button>

                <div className="border-t border-neutral-100 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onLogout();
                  }}
                  className="w-full px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>退出登录 / 切换账号</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};


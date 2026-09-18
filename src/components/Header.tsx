import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Settings
} from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  activeTab: string;
  currentUser: User | null;
  onOpenProfile: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
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

  const getBreadcrumbs = (tab: string) => {
    switch (tab) {
      case 'creators':
        return { section: 'AI 内容创作', title: 'AI 创作者' };
      case 'topics':
        return { section: 'AI 内容创作', title: '选题池' };
      case 'editor':
        return { section: 'AI 内容创作', title: '文案创作' };
      case 'content_packages':
        return { section: 'AI 内容创作', title: '内容中心' };
      case 'workflow':
        return { section: 'AI 内容创作', title: '自动化工作流' };
      case 'assets':
        return { section: '内容资产', title: '素材中心' };
      case 'memory':
        return { section: '内容资产', title: '知识与记忆' };
      case 'calendar':
        return { section: '矩阵运营', title: '内容日历' };
      case 'tasks':
        return { section: '矩阵运营', title: '发布中心' };
      case 'analytics':
        return { section: '矩阵运营', title: '数据分析' };
      case 'accounts':
        return { section: '管理与设置', title: '平台账号' };
      case 'enterprise':
        return { section: '管理与设置', title: '企业与团队' };
      case 'plans':
        return { section: '管理与设置', title: '套餐与用量' };
      case 'settings':
        return { section: '系统', title: '系统与 Worker' };
      default:
        return { section: '智域', title: 'AI 内容运营操作系统' };
    }
  };

  const { section, title } = getBreadcrumbs(activeTab);

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'admin':
        return '超级管理员';
      case 'operator':
        return '矩阵运营官';
      default:
        return '创作者';
    }
  };

  return (
    <header className="h-[68px] border-b border-[#e8ebf3] bg-white/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-[#75809a]">
        <span className="text-[#647087] font-medium">{section}</span>
        <span className="text-[#cbd1df] font-light">/</span>
        <strong className="text-[#171c2d] font-bold text-sm">{title}</strong>
      </div>

      {/* Middle & Right Actions */}
      <div className="flex items-center gap-3">
        {/* Quick Search */}
        <div className="hidden md:flex items-center gap-2 w-64 h-9 px-3 rounded-lg border border-[#e8ebf3] bg-[#fafbfe] text-xs text-[#9099ae] focus-within:border-[#8c77ff] focus-within:bg-white transition-all shadow-2xs">
          <Search className="w-3.5 h-3.5 text-[#9aa2b4] shrink-0" />
          <input
            type="text"
            placeholder="快捷搜索选题、素材、账号..."
            className="w-full bg-transparent border-none outline-none text-xs text-[#20263a] placeholder:text-[#9aa2b4]"
          />
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-[#e3e6ef] bg-white text-[#9aa2b4] shrink-0">
            ⌘K
          </kbd>
        </div>

        {/* User Profile Dropdown */}
        {currentUser && (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl hover:bg-[#f4f6fa] border border-[#e8ebf3] transition-all text-left group bg-white"
            >
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.nickname}
                className="w-7 h-7 rounded-lg object-cover bg-neutral-200 border border-[#e8ebf3]"
                referrerPolicy="no-referrer"
              />
              <div className="hidden sm:block leading-tight">
                <div className="text-xs font-bold text-[#171c2d] flex items-center gap-1.5">
                  <span className="truncate max-w-[90px]">{currentUser.nickname}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#f0eeff] text-[#7258f5] font-semibold border border-[#ded8ff]">
                    {getRoleLabel(currentUser.role)}
                  </span>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#929cb8] group-hover:text-[#171c2d] transition-transform" />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white border border-[#e8ebf3] rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2.5 border-b border-[#f0f2f7] mb-1">
                  <div className="text-xs font-extrabold text-[#171c2d]">{currentUser.nickname}</div>
                  <div className="text-[11px] text-[#75809a] truncate">@{currentUser.username} • {currentUser.email}</div>
                  {currentUser.teamName && (
                    <div className="text-[10px] text-[#8e98b0] mt-0.5 truncate">{currentUser.teamName}</div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onOpenProfile();
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold text-[#48536b] hover:bg-[#f4f6fa] hover:text-[#171c2d] rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <UserIcon className="w-4 h-4 text-[#7258f5]" />
                  <span>个人资料与密钥设置</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onOpenProfile();
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold text-[#48536b] hover:bg-[#f4f6fa] hover:text-[#171c2d] rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-[#7258f5]" />
                  <span>矩阵权限与安全中心</span>
                </button>

                <div className="border-t border-[#f0f2f7] my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onLogout();
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
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



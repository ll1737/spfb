import React from 'react';
import {
  Users2,
  Sparkles,
  PenTool,
  LayoutGrid,
  GitFork,
  FolderKanban,
  Brain,
  Calendar,
  Send,
  BarChart3,
  Share2,
  Building2,
  CreditCard,
  Settings,
  Layers
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  activeAccountsCount: number;
  totalAccountsCount: number;
  pendingTasksCount: number;
  currentUser?: User | null;
  onOpenProfile?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string | null;
  badgeColor?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  activeAccountsCount,
  totalAccountsCount,
  pendingTasksCount,
  currentUser,
  onOpenProfile
}) => {
  const navSections: NavSection[] = [
    {
      title: 'AI 内容创作',
      items: [
        { id: 'creators', label: 'AI 创作者', icon: Users2 },
        { id: 'topics', label: '选题池', icon: Sparkles },
        { id: 'editor', label: '文案创作', icon: PenTool },
        { id: 'content_packages', label: '内容中心', icon: LayoutGrid },
        { id: 'workflow', label: '自动化工作流', icon: GitFork }
      ]
    },
    {
      title: '内容资产',
      items: [
        { id: 'assets', label: '素材中心', icon: FolderKanban },
        { id: 'memory', label: '知识与记忆', icon: Brain }
      ]
    },
    {
      title: '矩阵运营',
      items: [
        { id: 'calendar', label: '内容日历', icon: Calendar },
        {
          id: 'tasks',
          label: '发布中心',
          icon: Send,
          badge: pendingTasksCount > 0 ? `${pendingTasksCount}` : null,
          badgeColor: 'bg-indigo-500 text-white'
        },
        { id: 'analytics', label: '数据分析', icon: BarChart3 }
      ]
    },
    {
      title: '账号与组织',
      items: [
        {
          id: 'accounts',
          label: '平台账号',
          icon: Share2,
          badge: `${activeAccountsCount}/${totalAccountsCount}`,
          badgeColor:
            activeAccountsCount > 0
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-slate-700/40 text-slate-400'
        },
        { id: 'enterprise', label: '企业与团队', icon: Building2 },
        { id: 'plans', label: '套餐与用量', icon: CreditCard }
      ]
    },
    {
      title: '系统',
      items: [
        { id: 'settings', label: '系统与 Worker', icon: Settings }
      ]
    }
  ];

  return (
    <aside
      className="w-64 flex flex-col h-screen select-none shrink-0 sticky top-0 border-r border-[#1a2236] z-40 text-[#c0c9df]"
      style={{
        background: 'radial-gradient(circle at 28px 0, #28335b 0, #11182a 40%, #0c1120 100%)'
      }}
    >
      {/* Brand Header */}
      <div className="p-5 pb-4 flex items-center gap-3 border-b border-white/[0.06]">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 bg-gradient-to-br from-[#a891ff] via-[#6954ed] to-[#36c8bd]">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="text-lg font-black tracking-tight text-white">智域</h1>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-xs">
              AI
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-0.5">
            <div className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-[#77829f]">
              {section.title}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`relative w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 group cursor-pointer ${
                    isActive
                      ? 'text-white bg-gradient-to-r from-[rgba(130,109,255,0.32)] to-[rgba(130,109,255,0.12)] shadow-sm'
                      : 'text-[#b9c1d5] hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  {/* Active Indicator Bar */}
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-md bg-[#8f7aff] shadow-[0_0_8px_#8f7aff]" />
                  )}

                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 transition-colors shrink-0 ${
                        isActive ? 'text-[#b6abff]' : 'text-[#929db8] group-hover:text-white'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[9px] font-mono font-medium px-1.5 py-0.5 rounded-md ${
                        item.badgeColor || 'bg-white/10 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Current User Card */}
      <div className="p-3 pt-2 border-t border-white/[0.06]">
        {currentUser && (
          <div className="p-2 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.nickname}
                className="w-7 h-7 rounded-lg object-cover bg-white/10 border border-white/15 shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                  <span>{currentUser.nickname}</span>
                </div>
                <div className="text-[10px] text-[#8e98b0] truncate">
                  @{currentUser.username}
                </div>
              </div>
            </div>
            {onOpenProfile && (
              <button
                type="button"
                onClick={onOpenProfile}
                className="p-1 rounded-lg text-[#9aa3be] hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                title="个人设置"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

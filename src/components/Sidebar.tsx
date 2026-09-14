import React from 'react';
import { 
  LayoutDashboard, 
  PenTool, 
  ListTodo, 
  Users, 
  Settings, 
  Send,
  Layers,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  activeAccountsCount: number;
  totalAccountsCount: number;
  pendingTasksCount: number;
  currentUser?: import('../types').User | null;
  onOpenProfile?: () => void;
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
  const menuItems = [
    {
      id: 'dashboard',
      label: '监控大屏',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'editor',
      label: '内容创作',
      icon: PenTool,
      badge: null
    },
    {
      id: 'tasks',
      label: '发布任务',
      icon: ListTodo,
      badge: pendingTasksCount > 0 ? `${pendingTasksCount} 进行中` : null,
      badgeColor: 'bg-amber-100 text-amber-800'
    },
    {
      id: 'accounts',
      label: '账号矩阵',
      icon: Users,
      badge: `${activeAccountsCount}/${totalAccountsCount}`,
      badgeColor: activeAccountsCount > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-600'
    },
    {
      id: 'settings',
      label: '系统与 Worker',
      icon: Settings,
      badge: null
    }
  ];

  return (
    <aside className="w-64 border-r border-neutral-200 bg-neutral-50/70 flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-neutral-200 bg-white">
        <div className="w-9 h-9 rounded-xl bg-neutral-900 flex items-center justify-center text-white shadow-sm shadow-neutral-900/20">
          <Layers className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-sm font-bold tracking-tight text-neutral-900 flex items-center gap-1.5">
            Multi-Publish
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">Pro</span>
          </h2>
          <p className="text-[11px] text-neutral-500">多平台一键发布管理系统</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
          功能模块
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'text-neutral-700 hover:bg-neutral-200/60 hover:text-neutral-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-medium ${
                  isActive ? 'bg-neutral-700 text-white' : item.badgeColor
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Supported Platforms Strip */}
      <div className="p-3 mx-3 mb-3 rounded-xl bg-white border border-neutral-200 shadow-xs">
        <div className="flex items-center justify-between text-[11px] font-medium text-neutral-600 mb-2">
          <span>覆盖 8 大主流平台</span>
          <span className="text-emerald-600 font-semibold">100% 适配</span>
        </div>
        <div className="grid grid-cols-4 gap-1 text-[10px] text-center text-neutral-600">
          <div className="p-1 rounded bg-neutral-100 font-medium">抖音</div>
          <div className="p-1 rounded bg-neutral-100 font-medium">快手</div>
          <div className="p-1 rounded bg-neutral-100 font-medium">小红书</div>
          <div className="p-1 rounded bg-neutral-100 font-medium">微博</div>
          <div className="p-1 rounded bg-neutral-100 font-medium">头条</div>
          <div className="p-1 rounded bg-neutral-100 font-medium">公众号</div>
          <div className="p-1 rounded bg-neutral-100 font-medium">知乎</div>
          <div className="p-1 rounded bg-neutral-100 font-medium">B站</div>
        </div>
      </div>

      {/* Current User Card */}
      {currentUser && (
        <div className="mx-3 mb-2 p-2.5 rounded-xl bg-white border border-neutral-200 shadow-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.nickname}
              className="w-8 h-8 rounded-lg object-cover bg-neutral-100 border border-neutral-200 shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0">
              <div className="text-xs font-bold text-neutral-800 truncate">{currentUser.nickname}</div>
              <div className="text-[10px] text-neutral-400 truncate">@{currentUser.username}</div>
            </div>
          </div>
          {onOpenProfile && (
            <button
              type="button"
              onClick={onOpenProfile}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors shrink-0"
              title="设置个人资料与密码"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Footer Profile / Version info */}
      <div className="p-3 border-t border-neutral-200 bg-white/70 text-[11px] text-neutral-500 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span>Playwright RPA 引擎</span>
        </div>
        <span className="font-mono text-[10px]">v2.4.0</span>
      </div>
    </aside>
  );
};

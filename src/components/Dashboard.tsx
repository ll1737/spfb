import React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Users, 
  Send, 
  ArrowUpRight, 
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  ListTodo
} from 'lucide-react';
import { Account, PublishJob, PublishTask, PlatformId } from '../types';
import { PLATFORMS_META } from '../data/defaultData';

interface DashboardProps {
  accounts: Account[];
  jobs: PublishJob[];
  tasks: PublishTask[];
  onNavigate: (tab: string) => void;
  onOpenPublish: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  workerConnected: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  accounts,
  jobs,
  tasks,
  onNavigate,
  onOpenPublish,
  onRefresh,
  isRefreshing,
  workerConnected
}) => {
  // Compute analytics
  const totalTasks = tasks.length;
  const successTasks = tasks.filter((t) => t.status === 'success').length;
  const failedTasks = tasks.filter((t) => t.status === 'failed').length;
  const runningTasks = tasks.filter((t) => t.status === 'running').length;
  const queuedTasks = tasks.filter((t) => t.status === 'queued').length;
  const successRate = totalTasks > 0 ? `${Math.round((successTasks / totalTasks) * 100)}%` : '—';

  const activeAccounts = accounts.filter((a) => a.status === 'active').length;
  const expiredAccounts = accounts.filter((a) => a.status !== 'active').length;

  const platformKeys = Object.keys(PLATFORMS_META) as PlatformId[];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Alert if Worker offline */}
      {!workerConnected && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-sm">
              <span className="font-semibold">Playwright RPA Worker 尚未启动或正在连接：</span>
              <span className="text-amber-800 ml-1">
                Web 控制台已就绪，若需调度本地真实浏览器自动化发布，请启动本地 Worker 自动化节点。
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('settings')}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg shadow-xs"
            >
              查看 Worker 节点设置
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-medium uppercase tracking-wider">累计发布任务</span>
            <span className="p-2 rounded-lg bg-neutral-100 text-neutral-700">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-neutral-900">{totalTasks}</div>
            <div className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
              <span>共覆盖</span>
              <span className="font-semibold text-neutral-700">{jobs.length} 篇</span>
              <span>核心原创内容</span>
            </div>
          </div>
        </div>

        {/* Success Rate */}
        <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-medium uppercase tracking-wider">发布成功率</span>
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-emerald-600">{successRate}</div>
            <div className="text-xs text-neutral-500 mt-1 flex items-center gap-2">
              <span className="text-emerald-700 font-medium">成功 {successTasks}</span>
              <span>/</span>
              <span className="text-rose-600 font-medium">失败 {failedTasks}</span>
            </div>
          </div>
        </div>

        {/* Accounts Matrix */}
        <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-medium uppercase tracking-wider">活跃账号矩阵</span>
            <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-neutral-900">{activeAccounts} <span className="text-sm font-normal text-neutral-500">/ {accounts.length}</span></div>
            <div className="text-xs text-neutral-500 mt-1">
              {expiredAccounts > 0 ? (
                <span className="text-amber-600 font-medium">{expiredAccounts} 个账号需要重新授权</span>
              ) : (
                <span className="text-emerald-600 font-medium">全部账号登录态有效</span>
              )}
            </div>
          </div>
        </div>

        {/* Task Engine Status */}
        <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-medium uppercase tracking-wider">运行队列与引擎</span>
            <span className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-neutral-900">
              {runningTasks + queuedTasks}
              <span className="text-xs font-normal text-neutral-500 ml-1.5">排队中</span>
            </div>
            <div className="text-xs text-neutral-500 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Playwright 并发池就绪</span>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Health Matrix Section */}
      <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-neutral-900">8 大平台矩阵状态监控</h3>
            <p className="text-xs text-neutral-500 mt-0.5">实时跟踪各平台账号登录状态、适配器健康度与支持的内容类型</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg text-xs font-medium transition-colors"
              title="刷新数据"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => onNavigate('accounts')}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              <span>管理账号</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {platformKeys.map((key) => {
            const meta = PLATFORMS_META[key];
            const platformAccounts = accounts.filter((a) => a.platform === key);
            const activeAcc = platformAccounts.filter((a) => a.status === 'active').length;
            const hasAccounts = platformAccounts.length > 0;

            return (
              <div 
                key={key}
                onClick={() => onNavigate('accounts')}
                className="p-3.5 rounded-xl border border-neutral-200 hover:border-neutral-300 hover:shadow-sm cursor-pointer transition-all bg-neutral-50/50 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-900">{meta.name}</span>
                    <span className={`w-2 h-2 rounded-full ${
                      activeAcc > 0 ? 'bg-emerald-500' : hasAccounts ? 'bg-amber-500' : 'bg-neutral-300'
                    }`} />
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">{meta.nameEn}</div>
                </div>

                <div className="mt-3 pt-2 border-t border-neutral-200/60">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] text-neutral-500">已绑账号</span>
                    <span className="text-xs font-bold text-neutral-800 font-mono">
                      {platformAccounts.length}
                    </span>
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">
                    {meta.supportedTypes.map((t) => t === 'article' ? '文章' : t === 'note' ? '图文' : '视频').join(' / ')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two columns: Recent Tasks & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Tasks Feed */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-neutral-900">最近发布动态</h3>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>查看全部任务</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {tasks.length === 0 ? (
            <div className="py-12 text-center text-neutral-400 text-sm">
              暂无发布任务，点击上方「一键矩阵发布」开启第一次发布！
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {tasks.slice(0, 5).map((task) => {
                const meta = PLATFORMS_META[task.platform];
                const isSuccess = task.status === 'success';
                const isFailed = task.status === 'failed';
                const isRunning = task.status === 'running';

                return (
                  <div key={task.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${meta.badgeBg}`}>
                        {meta.name.substring(0, 1)}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-neutral-900 truncate">
                          {task.accountNickname ? `【${task.accountNickname}】` : ''} 任务 #{task.id.substring(0, 8)}
                        </div>
                        <div className="text-[11px] text-neutral-500 flex items-center gap-2 mt-0.5">
                          <span>{meta.name}</span>
                          <span>•</span>
                          <span>{task.contentType === 'article' ? '长文章' : task.contentType === 'note' ? '图文动态' : '视频'}</span>
                          <span>•</span>
                          <span>{task.startedAt ? new Date(task.startedAt).toLocaleTimeString() : '刚刚'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {isSuccess && (
                        <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          已发布
                        </span>
                      )}
                      {isFailed && (
                        <span className="flex items-center gap-1 text-xs font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                          <XCircle className="w-3.5 h-3.5" />
                          失败
                        </span>
                      )}
                      {isRunning && (
                        <span className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md animate-pulse">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          自动化执行中
                        </span>
                      )}
                      {task.status === 'queued' && (
                        <span className="flex items-center gap-1 text-xs font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md">
                          <Clock className="w-3.5 h-3.5" />
                          排队中
                        </span>
                      )}
                      {task.resultUrl && (
                        <a
                          href={task.resultUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-neutral-500 hover:text-neutral-900 p-1 hover:bg-neutral-100 rounded"
                          title="查看线上链接"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Col: Quick Workflow Card */}
        <div className="p-6 rounded-2xl bg-neutral-900 text-white shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide bg-neutral-800 text-emerald-400 border border-neutral-700">
                快速上手
              </span>
              <ShieldCheck className="w-4 h-4 text-neutral-400" />
            </div>
            <h4 className="text-lg font-bold">三步完成全网矩阵分发</h4>
            <div className="space-y-2.5 text-xs text-neutral-300 pt-2">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-neutral-800 text-emerald-400 flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
                <span>在「账号矩阵」扫码登录或导入 Cookie 保存会话凭证</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-neutral-800 text-emerald-400 flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
                <span>在「内容创作」编辑标题、正文、标签与封面媒体</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-neutral-800 text-emerald-400 flex items-center justify-center font-bold text-[11px] shrink-0">3</span>
                <span>勾选目标平台，一键发起 RPA 自动化多线程分发</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-neutral-800">
            <button
              onClick={onOpenPublish}
              className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Send className="w-4 h-4" />
              <span>立即体验一键矩阵发布</span>
            </button>
            <button
              onClick={() => onNavigate('tasks')}
              className="w-full py-2 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <ListTodo className="w-3.5 h-3.5 text-neutral-400" />
              <span>查看发布任务队列</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

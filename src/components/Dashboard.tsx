import React from 'react';
import { AlertTriangle, ArrowRight, Calendar, Layers, Send, ShieldCheck, Sparkles } from 'lucide-react';
import { Account, PlatformId, PublishJob, PublishTask } from '../types';
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
  onSelectTopicForCreate?: (topicTitle: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ accounts, jobs, tasks, onNavigate, onOpenPublish, onRefresh, workerConnected }) => {
  const safeAccounts = accounts || [];
  const safeJobs = jobs || [];
  const safeTasks = tasks || [];
  const activeAccounts = safeAccounts.filter((account) => account && account.status === 'active').length;
  const runningTasks = safeTasks.filter((task) => task && task.status === 'running').length;
  const queuedTasks = safeTasks.filter((task) => task && task.status === 'queued').length;
  const successTasks = safeTasks.filter((task) => task && task.status === 'success').length;
  const platformList = Object.keys(PLATFORMS_META) as PlatformId[];
  const timelineTasks = safeTasks.filter((task) => task && (task.scheduledAt || task.status === 'running' || task.status === 'queued')).slice(0, 5);

  return (
    <div className="space-y-6 max-w-[1540px] mx-auto pb-10">
      {!workerConnected && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs"><AlertTriangle className="w-4 h-4 shrink-0" /><span><strong>Worker 未连接。</strong>扫码登录和真实发布需要先启动 Python Worker。</span></div>
          <button onClick={() => onNavigate('settings')} className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-bold cursor-pointer">检查 Worker</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ['发布任务', `${safeJobs.length}`, '真实任务记录'],
          ['账号在线率', safeAccounts.length ? `${Math.round((activeAccounts / safeAccounts.length) * 100)}%` : '—', `${activeAccounts}/${safeAccounts.length} 个账号在线`],
          ['执行中', `${runningTasks}`, `${queuedTasks} 个排队中`],
          ['已完成', `${successTasks}`, '来自服务端任务状态']
        ].map(([label, value, note]) => (
          <div key={label} className="p-5 rounded-2xl bg-white border border-[#e8ebf3] shadow-xs"><div className="text-xs font-bold text-[#75809a]">{label}</div><div className="mt-4 text-2xl font-black text-[#171c2d]">{value}</div><div className="mt-1 text-xs text-[#8c97ad]">{note}</div></div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 sm:p-7 rounded-3xl border border-[#ded8ff] bg-gradient-to-br from-[#f3f0ff] to-white shadow-sm">
            <div className="flex items-start gap-3"><div className="w-10 h-10 rounded-2xl bg-[#735bf5] text-white flex items-center justify-center shrink-0"><Sparkles className="w-5 h-5" /></div><div><div className="text-xs font-extrabold text-[#7258f5]">真实内容创作入口</div><h2 className="text-lg font-black text-[#171c2d] mt-2">从空白内容开始创作</h2><p className="text-xs text-[#66718a] mt-2 leading-relaxed">当前不展示演示选题。填写真实标题和正文后，选择已验证的平台账号进行发布。</p><button onClick={() => onNavigate('editor')} className="mt-4 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#735af4] to-[#8876fa] flex items-center gap-2 cursor-pointer">开始创作 <ArrowRight className="w-3.5 h-3.5" /></button></div></div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[#e8ebf3] shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#f0f2f7]"><div><h3 className="text-base font-extrabold text-[#171c2d] flex items-center gap-2"><Calendar className="w-4 h-4 text-[#7258f5]" />发布任务队列</h3><p className="text-xs text-[#75809a] mt-0.5">只展示服务端真实任务</p></div><button onClick={() => onNavigate('tasks')} className="text-xs font-bold text-[#7258f5] flex items-center gap-1 cursor-pointer">查看任务 <ArrowRight className="w-3.5 h-3.5" /></button></div>
            {timelineTasks.length === 0 ? <div className="py-10 text-center text-xs text-[#8c97ad]">暂无真实排期任务</div> : <div className="divide-y divide-[#f0f2f7]">{timelineTasks.map((task) => { const job = safeJobs.find((item) => item && item.id === task.jobId); const meta = PLATFORMS_META[task.platform]; return <div key={task.id} className="py-3.5 flex items-center gap-3"><div className="w-12 text-center font-mono text-xs font-bold text-[#171c2d]">{task.scheduledAt ? new Date(task.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</div><div className="flex-1 min-w-0"><div className="text-xs font-bold text-[#20263a] truncate">{job?.title || '未命名发布任务'}</div><div className="text-[10px] text-[#8c97ad] mt-1">{task.accountNickname || '真实账号'} · {meta?.name || task.platform}</div></div><span className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-600">{task.status}</span><button onClick={onOpenPublish} className="p-1.5 text-[#8c97ad] hover:text-[#7258f5] cursor-pointer" title="创建发布任务"><Send className="w-4 h-4" /></button></div>; })}</div>}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-[#e8ebf3] shadow-xs"><div className="flex items-center justify-between pb-4 border-b border-[#f0f2f7]"><div><h3 className="text-base font-extrabold text-[#171c2d] flex items-center gap-2"><Layers className="w-4 h-4 text-[#7258f5]" />平台账号状态</h3><p className="text-xs text-[#75809a] mt-0.5">只显示服务端真实账号数据</p></div><button onClick={() => onNavigate('accounts')} className="text-xs font-bold text-[#7258f5] flex items-center gap-1 cursor-pointer">管理账号 <ArrowRight className="w-3.5 h-3.5" /></button></div><div className="grid grid-cols-2 gap-2.5 mt-4">{platformList.map((platform) => { const meta = PLATFORMS_META[platform]; const platformAccounts = safeAccounts.filter((account) => account && account.platform === platform); const online = platformAccounts.some((account) => account && account.status === 'active'); return <div key={platform} className="p-3 rounded-2xl border border-[#edf0f5] bg-[#fafbfe] flex items-center justify-between"><div className="flex items-center gap-2 min-w-0"><span className="w-6 h-6 rounded-lg text-white font-black text-[10px] flex items-center justify-center" style={{ backgroundColor: meta?.color || '#666' }}>{meta?.name?.slice(0, 1) || platform.slice(0, 1)}</span><div className="min-w-0"><div className="text-xs font-bold truncate">{meta?.name || platform}</div><div className="text-[10px] text-[#8e98b0]">{platformAccounts.length ? `${platformAccounts.length} 个账号` : '未接入'}</div></div></div><span className={`w-2 h-2 rounded-full ${online ? 'bg-emerald-500' : 'bg-slate-300'}`} /></div>; })}</div></div>

          <div className="p-6 rounded-3xl bg-white border border-[#e8ebf3] shadow-xs space-y-4"><h3 className="text-base font-extrabold text-[#171c2d] flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500" />自动化服务状态</h3><div className="flex items-center justify-between p-3 rounded-xl bg-[#f7f8fc] text-xs"><span className="text-[#647087]">Python Playwright Worker</span><span className={workerConnected ? 'font-bold text-emerald-600' : 'font-bold text-rose-600'}>{workerConnected ? '在线' : '离线'}</span></div><div className="flex items-center justify-between p-3 rounded-xl bg-[#f7f8fc] text-xs"><span className="text-[#647087]">有效账号</span><span className="font-bold text-[#171c2d]">{activeAccounts}</span></div><button onClick={onRefresh} className="w-full py-2.5 rounded-xl border border-[#e2e6ef] bg-white hover:bg-purple-50 text-xs font-bold text-[#505b73] cursor-pointer">刷新真实状态</button></div>
        </div>
      </div>
    </div>
  );
};

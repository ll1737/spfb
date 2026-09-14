import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RefreshCw, 
  StopCircle, 
  ExternalLink, 
  Camera, 
  FileCode, 
  Search, 
  AlertTriangle,
  Terminal,
  Filter,
  X,
  Play
} from 'lucide-react';
import { PublishTask, TaskStatus, PlatformId } from '../types';
import { PLATFORMS_META } from '../data/defaultData';
import { api } from '../lib/api';

interface TaskCenterProps {
  tasks: PublishTask[];
  onRefresh: () => void;
}

export const TaskCenter: React.FC<TaskCenterProps> = ({ tasks, onRefresh }) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTaskForLogs, setActiveTaskForLogs] = useState<PublishTask | null>(null);
  const [inspectScreenshotUrl, setInspectScreenshotUrl] = useState<string | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (platformFilter !== 'all' && t.platform !== platformFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = t.id.toLowerCase().includes(q);
      const matchAcc = t.accountNickname?.toLowerCase().includes(q);
      const matchError = t.errorMessage?.toLowerCase().includes(q);
      return matchId || matchAcc || matchError;
    }
    return true;
  });

  const handleRetryTask = async (task: PublishTask) => {
    setIsProcessingAction(true);
    try {
      await api.retryTask(task.id);
      onRefresh();
    } catch (err: any) {
      alert('重试任务失败: ' + err.message);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleCancelTask = async (task: PublishTask) => {
    if (confirm('确认取消此任务的自动化调度吗？')) {
      setIsProcessingAction(true);
      try {
        await api.cancelTask(task.id);
        onRefresh();
      } catch (err: any) {
        alert('取消任务失败: ' + err.message);
      } finally {
        setIsProcessingAction(false);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: 'all', label: '全部任务', count: tasks.length },
            { id: 'running', label: '执行中', count: tasks.filter((t) => t.status === 'running').length },
            { id: 'queued', label: '排队中', count: tasks.filter((t) => t.status === 'queued').length },
            { id: 'success', label: '发布成功', count: tasks.filter((t) => t.status === 'success').length },
            { id: 'failed', label: '执行失败', count: tasks.filter((t) => t.status === 'failed').length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                statusFilter === tab.id ? 'bg-neutral-700 text-white' : 'bg-neutral-200 text-neutral-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索任务 ID / 账号 / 错误..."
              className="pl-8 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:bg-white w-52"
            />
          </div>

          <button
            onClick={onRefresh}
            className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl text-xs font-medium border border-neutral-200"
            title="刷新任务状态"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-neutral-200 shadow-xs text-neutral-400 text-sm">
            没有匹配的发布任务记录
          </div>
        ) : (
          filteredTasks.map((task) => {
            const meta = PLATFORMS_META[task.platform];
            const isSuccess = task.status === 'success';
            const isFailed = task.status === 'failed';
            const isRunning = task.status === 'running';

            return (
              <div
                key={task.id}
                className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-4 hover:border-neutral-300 transition-all"
              >
                {/* Header: Platform, Account, Task ID, Status */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${meta.badgeBg}`}>
                      {meta.name.substring(0, 1)}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-neutral-900 truncate">
                          {task.accountNickname ? `【${task.accountNickname}】` : ''} {meta.name} 发布任务
                        </span>
                        <span className="font-mono text-[11px] text-neutral-400">
                          #{task.id.substring(0, 8)}
                        </span>
                        <span className="text-[10px] px-2 py-0.2 rounded bg-neutral-100 text-neutral-600 font-medium">
                          {task.contentType === 'article' ? '长文章' : task.contentType === 'note' ? '图文' : '短视频'}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-400 flex items-center gap-2 mt-0.5 font-mono">
                        <span>提交：{new Date(task.startedAt || Date.now()).toLocaleTimeString()}</span>
                        <span>•</span>
                        <span>重试：第 {task.attempt} / {task.maxAttempts} 次</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex items-center gap-3 shrink-0">
                    {isSuccess && (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        发布成功
                      </span>
                    )}
                    {isFailed && (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle className="w-3.5 h-3.5" />
                        发布失败
                      </span>
                    )}
                    {isRunning && (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Playwright RPA 执行中
                      </span>
                    )}
                    {task.status === 'queued' && (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200">
                        <Clock className="w-3.5 h-3.5" />
                        排队等待调度
                      </span>
                    )}
                  </div>
                </div>

                {/* Error Banner or Result URL */}
                {isFailed && (
                  <div className="p-3.5 rounded-xl bg-rose-50/80 border border-rose-200 text-xs text-rose-900 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold">
                          [{task.errorCode || 'RPA_EXECUTION_ERROR'}]: {task.errorMessage || '自动化定位发布按钮或表单输入超时'}
                        </div>
                        <div className="text-[11px] text-rose-700 mt-0.5">
                          建议：核对各平台会话 Cookie 是否失效，或进入创作者后台完成安全验证码。
                        </div>
                      </div>
                    </div>
                    {task.debugScreenshot && (
                      <button
                        onClick={() => setInspectScreenshotUrl(task.debugScreenshot || null)}
                        className="px-2.5 py-1 bg-white hover:bg-rose-100 text-rose-800 text-[11px] font-medium rounded-lg border border-rose-200 flex items-center gap-1 shrink-0"
                      >
                        <Camera className="w-3 h-3" />
                        <span>查看失败截图</span>
                      </button>
                    )}
                  </div>
                )}

                {isSuccess && task.resultUrl && (
                  <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-medium">线上正式发布地址：</span>
                      <a
                        href={task.resultUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-emerald-800 underline truncate hover:text-emerald-950"
                      >
                        {task.resultUrl}
                      </a>
                    </div>
                    <a
                      href={task.resultUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 text-[11px] font-medium rounded-lg border border-emerald-200 flex items-center gap-1 shrink-0"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>直接访问</span>
                    </a>
                  </div>
                )}

                {/* Step Logs / Progress Summary */}
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 text-neutral-600 truncate">
                    <Terminal className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                    <span className="font-mono text-[11px]">最新日志：</span>
                    <span className="truncate text-[11px] text-neutral-800">
                      {task.logs.length > 0
                        ? task.logs[task.logs.length - 1].message
                        : '等待初始化 Playwright 运行时...'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <button
                      onClick={() => setActiveTaskForLogs(task)}
                      className="text-[11px] text-blue-600 hover:text-blue-700 font-medium underline"
                    >
                      查看完整步骤日志 ({task.logs.length})
                    </button>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  {isFailed && (
                    <button
                      onClick={() => handleRetryTask(task)}
                      disabled={isProcessingAction}
                      className="px-3 py-1.5 text-xs font-semibold text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>重试此任务</span>
                    </button>
                  )}
                  {isRunning && (
                    <button
                      onClick={() => handleCancelTask(task)}
                      disabled={isProcessingAction}
                      className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <StopCircle className="w-3.5 h-3.5" />
                      <span>取消执行</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Task Logs Modal */}
      {activeTaskForLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-neutral-950 text-neutral-200 rounded-2xl shadow-2xl border border-neutral-800 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between bg-neutral-900">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold font-mono">
                  RPA 执行步骤日志 #{activeTaskForLogs.id.substring(0, 8)}
                </span>
              </div>
              <button
                onClick={() => setActiveTaskForLogs(null)}
                className="p-1 rounded text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 font-mono text-xs space-y-2 overflow-y-auto flex-1 bg-black/50">
              {activeTaskForLogs.logs.map((log, i) => (
                <div key={i} className="flex items-start gap-2.5 leading-relaxed">
                  <span className="text-neutral-500 shrink-0 text-[10px]">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] shrink-0 ${
                    log.level === 'error' ? 'bg-rose-950 text-rose-400' :
                    log.level === 'warn' ? 'bg-amber-950 text-amber-400' :
                    log.level === 'success' ? 'bg-emerald-950 text-emerald-400' :
                    'bg-neutral-800 text-neutral-400'
                  }`}>
                    {log.level.toUpperCase()}
                  </span>
                  <span className={`${
                    log.level === 'error' ? 'text-rose-300' :
                    log.level === 'success' ? 'text-emerald-300' :
                    'text-neutral-300'
                  }`}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Screenshot Preview Modal */}
      {inspectScreenshotUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-neutral-900 rounded-2xl p-4 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between text-white">
              <span className="text-xs font-semibold flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-rose-400" />
                Playwright 失败现场调试截图
              </span>
              <button
                onClick={() => setInspectScreenshotUrl(null)}
                className="p-1 rounded text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-xl overflow-hidden bg-black flex items-center justify-center max-h-[70vh]">
              <img src={inspectScreenshotUrl} alt="Debug Screenshot" className="max-w-full max-h-full object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

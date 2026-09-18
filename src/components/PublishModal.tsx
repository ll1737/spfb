import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Send, 
  Clock, 
  CheckSquare, 
  Square, 
  AlertCircle, 
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  Shield,
  Filter,
  Timer,
  Terminal,
  Video,
  Copy,
  Sliders,
  UserPlus
} from 'lucide-react';
import { Account, ContentPayload, PlatformId } from '../types';
import { PLATFORMS_META } from '../data/defaultData';
import { api } from '../lib/api';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  content: ContentPayload;
  onSubmit: (params: {
    content: ContentPayload;
    accountIds: string[];
    scheduledAt?: string;
  }) => Promise<void>;
  onNavigateToAccounts?: () => void;
}

export const PublishModal: React.FC<PublishModalProps> = ({
  isOpen,
  onClose,
  accounts,
  content,
  onSubmit,
  onNavigateToAccounts
}) => {
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [jobTitle, setJobTitle] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [publishMode, setPublishMode] = useState<'immediate' | 'scheduled'>('immediate');
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [enableStagger, setEnableStagger] = useState(true);
  const [staggerMinutes, setStaggerMinutes] = useState(3);
  const [coverTimestamp, setCoverTimestamp] = useState<number>(content.coverTimestamp ?? 1.5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showCliPreview, setShowCliPreview] = useState(false);
  const [cliOutput, setCliOutput] = useState<{ command: string; dockerCommand: string; explanation: string } | null>(null);
  const [isGeneratingCli, setIsGeneratingCli] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);

  // Sync selected accounts and title whenever the modal opens or accounts change
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      const validActiveAccounts = accounts.filter((a) => a.status === 'active');
      const targetIds = validActiveAccounts.length > 0 
        ? validActiveAccounts.map((a) => a.id) 
        : accounts.map((a) => a.id);
      setSelectedAccountIds(targetIds);

      // Default title
      const initialTitle = content.title && content.title.trim() 
        ? content.title.trim() 
        : `多平台内容矩阵分发_${new Date().toLocaleDateString()}`;
      setJobTitle(initialTitle);
      setCoverTimestamp(content.coverTimestamp ?? 1.5);
    }
  }, [isOpen, accounts, content.title, content.coverTimestamp]);

  // Extract distinct account groups
  const availableGroups = useMemo(() => {
    const rawGroups = accounts.map((a) => a.group).filter(Boolean) as string[];
    return ['all', ...Array.from(new Set(rawGroups))];
  }, [accounts]);

  const displayedAccounts = useMemo(() => {
    if (selectedGroup === 'all') return accounts;
    return accounts.filter((a) => a.group === selectedGroup);
  }, [accounts, selectedGroup]);

  if (!isOpen) return null;

  const toggleAccount = (id: string) => {
    if (selectedAccountIds.includes(id)) {
      setSelectedAccountIds(selectedAccountIds.filter((item) => item !== id));
    } else {
      setSelectedAccountIds([...selectedAccountIds, id]);
    }
  };

  const handleSelectGroupOnly = (groupName: string) => {
    const groupAccountIds = accounts
      .filter((a) => (groupName === 'all' ? true : a.group === groupName) && a.status === 'active')
      .map((a) => a.id);
    setSelectedAccountIds(groupAccountIds);
  };

  const handleSelectAllActive = () => {
    const activeIds = accounts.filter((a) => a.status === 'active').map((a) => a.id);
    setSelectedAccountIds(activeIds);
  };

  const handleClearAll = () => {
    setSelectedAccountIds([]);
  };

  const handleGenerateCli = async () => {
    setIsGeneratingCli(true);
    try {
      const firstAcc = accounts.find((a) => selectedAccountIds.includes(a.id)) || accounts[0];
      const platform = firstAcc ? firstAcc.platform : 'douyin';
      if (!firstAcc) {
        setErrorMsg('请先接入并选择一个真实平台账号');
        return;
      }
      const accountName = firstAcc.nickname;
      
      const res = await api.generateCliCommand({
        platform,
        accountName,
        title: content.title,
        content: content.content,
        tags: content.tags,
        coverTimestamp: coverTimestamp,
        scheduleTime: publishMode === 'scheduled' ? scheduledDateTime : undefined
      });
      setCliOutput(res);
      setShowCliPreview(true);
    } catch (err: any) {
      alert('生成 CLI 命令失败: ' + err.message);
    } finally {
      setIsGeneratingCli(false);
    }
  };

  const handleCopyCli = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  const handleConfirm = async () => {
    setErrorMsg('');
    
    const finalSelectedIds = selectedAccountIds.filter((id) => accounts.some((a) => a.id === id && a.status === 'active'));

    if (finalSelectedIds.length === 0) {
      setErrorMsg('请先勾选至少一个目标平台账号（或先在账号管理中添加账号）！');
      return;
    }

    const titleToUse = jobTitle.trim() || content.title?.trim() || '';
    if (!titleToUse) {
      setErrorMsg('请输入真实内容标题');
      return;
    }
    if (!content.content.trim()) {
      setErrorMsg('请输入真实正文内容');
      return;
    }
    if (publishMode === 'scheduled' && (!scheduledDateTime || Date.parse(scheduledDateTime) <= Date.now())) {
      setErrorMsg('请选择一个未来的排期时间');
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedContent: ContentPayload = {
        ...content,
        title: titleToUse,
        coverTimestamp: coverTimestamp,
        platformOptions: {
          ...content.platformOptions,
          coverTimestamp: coverTimestamp
        }
      };

      await onSubmit({
        content: updatedContent,
        accountIds: finalSelectedIds,
        scheduledAt: publishMode === 'scheduled' ? scheduledDateTime : undefined
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || '发布任务创建失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">配置分发参数与目标矩阵</h3>
              <p className="text-xs text-neutral-500">选择发布账号并指定执行方式</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Publishing Summary & Editable Title */}
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex-1 flex items-center gap-2">
                <label className="text-xs font-semibold text-neutral-700 shrink-0">待发布标题：</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="请输入或确认分发内容标题..."
                  className="flex-1 px-3 py-1.5 text-xs font-semibold text-neutral-900 bg-white border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-all"
                />
              </div>
              <span className="self-start sm:self-auto shrink-0 font-mono text-[11px] px-2.5 py-1 rounded-md bg-neutral-200 text-neutral-800 font-semibold">
                {content.contentType === 'article' ? '长文章' : content.contentType === 'note' ? '图文动态' : '短视频'}
              </span>
            </div>
            <div className="text-[11px] text-neutral-500 flex items-center gap-4 pt-1 border-t border-neutral-200/60">
              <span>正文字数：{content.content?.length || 0}</span>
              <span>配图：{content.images?.length || 0} 张</span>
              <span>标签：{content.tags?.length || 0} 个</span>
            </div>
          </div>

          {/* Account Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                选择目标账号 ({selectedAccountIds.length} / {accounts.length})
              </label>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleSelectAllActive}
                  className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                >
                  全选在线账号
                </button>
                <span className="text-neutral-300">|</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-neutral-500 hover:text-neutral-700 cursor-pointer"
                >
                  清空选择
                </button>
              </div>
            </div>

            {/* Group Filter Tabs */}
            {availableGroups.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <span className="text-[11px] text-neutral-400 font-medium shrink-0 flex items-center gap-1">
                  <Filter className="w-3 h-3" /> 矩阵分组：
                </span>
                {availableGroups.map((g) => {
                  const label = g === 'all' ? '全部账号' : g;
                  const isCur = selectedGroup === g;
                  const count = g === 'all' ? accounts.length : accounts.filter((a) => a.group === g).length;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setSelectedGroup(g)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition-all cursor-pointer ${
                        isCur
                          ? 'bg-neutral-900 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      {label} ({count})
                    </button>
                  );
                })}
                {selectedGroup !== 'all' && (
                  <button
                    type="button"
                    onClick={() => handleSelectGroupOnly(selectedGroup)}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 ml-1 shrink-0 cursor-pointer"
                  >
                    + 仅勾选此组
                  </button>
                )}
              </div>
            )}

            {displayedAccounts.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-neutral-300 bg-neutral-50/50 text-center space-y-2">
                <AlertCircle className="w-7 h-7 text-amber-500 mx-auto" />
                <div className="text-xs font-semibold text-neutral-800">当前尚未录入任何平台账号</div>
                <div className="text-[11px] text-neutral-500">
                  请先接入抖音、微信视频号、小红书等平台矩阵账号，以便调度 RPA 自动分发
                </div>
                {onNavigateToAccounts && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateToAccounts();
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-xl cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>前往接入新账号</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-52 overflow-y-auto pr-1">
                {displayedAccounts.map((acc) => {
                  const meta = PLATFORMS_META[acc.platform];
                  const isSelected = selectedAccountIds.includes(acc.id);
                  const isActive = acc.status === 'active';

                  return (
                    <div
                      key={acc.id}
                      onClick={() => toggleAccount(acc.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'border-neutral-900 bg-neutral-900/5 shadow-xs ring-1 ring-neutral-900'
                          : 'border-neutral-200 hover:border-neutral-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative">
                          <img
                            src={acc.avatarUrl}
                            alt={acc.nickname}
                            className="w-9 h-9 rounded-full object-cover border border-neutral-200"
                          />
                          <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${meta.badgeBg}`}>
                            {meta.name.substring(0, 1)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-neutral-900 truncate flex items-center gap-1.5">
                            <span>{acc.nickname}</span>
                            {acc.group && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-600 font-normal">
                                {acc.group}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-neutral-500 flex items-center gap-1.5 mt-0.5">
                            <span>{meta.name}</span>
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            <span>{isActive ? '就绪' : '待更新会话'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 ml-2 text-neutral-400">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-neutral-900" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Time & Scheduling */}
          <div className="space-y-3 pt-2 border-t border-neutral-100">
            <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider block">
              执行时机
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPublishMode('immediate')}
                className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  publishMode === 'immediate'
                    ? 'border-neutral-900 bg-neutral-900/5'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <Send className="w-4 h-4 mt-0.5 text-neutral-700" />
                <div>
                  <div className="text-xs font-semibold text-neutral-900">立即开始分发</div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">提交后立即交由 Playwright 并发队列自动化执行</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPublishMode('scheduled')}
                className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  publishMode === 'scheduled'
                    ? 'border-neutral-900 bg-neutral-900/5'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <Calendar className="w-4 h-4 mt-0.5 text-neutral-700" />
                <div>
                  <div className="text-xs font-semibold text-neutral-900">定时预约分发</div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">指定未来的精确时间点，自动触发平台发布</div>
                </div>
              </button>
            </div>

            {publishMode === 'scheduled' && (
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center gap-3">
                <Clock className="w-4 h-4 text-neutral-500" />
                <input
                  type="datetime-local"
                  value={scheduledDateTime}
                  onChange={(e) => setScheduledDateTime(e.target.value)}
                  className="bg-white px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-mono text-neutral-800 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Anti-ban Staggered Strategy */}
          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-neutral-900 text-white flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <div className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                    <span>矩阵防风控错峰调度 (Anti-ban Jitter)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-semibold">推荐开启</span>
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    在多个账号发布之间引入动态随机延迟，模拟真人操作，规避同一 IP 瞬时群控风控
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={enableStagger}
                  onChange={(e) => setEnableStagger(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neutral-900"></div>
              </label>
            </div>

            {enableStagger && (
              <div className="pt-2 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-600 font-medium">防关联间隔：</span>
                  {[
                    { label: '快速 (1~2 分钟)', min: 1 },
                    { label: '稳妥 (2~4 分钟)', min: 3 },
                    { label: '深度防护 (5~8 分钟)', min: 5 }
                  ].map((preset) => (
                    <button
                      key={preset.min}
                      type="button"
                      onClick={() => setStaggerMinutes(preset.min)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        staggerMinutes === preset.min
                          ? 'bg-neutral-900 text-white shadow-xs'
                          : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="text-[11px] font-mono text-neutral-500 flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>
                    预计总耗时：约 {Math.max(1, (selectedAccountIds.length - 1) * staggerMinutes)} ~ {Math.max(2, (selectedAccountIds.length - 1) * (staggerMinutes + 2))} 分钟
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* social-auto-upload Specific Parameters & CLI Generator */}
          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-neutral-700" />
                <span className="text-xs font-bold text-neutral-900">social-auto-upload 参数配置</span>
              </div>

              <button
                type="button"
                onClick={handleGenerateCli}
                disabled={isGeneratingCli}
                className="text-[11px] font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
              >
                <Terminal className="w-3 h-3" />
                <span>{isGeneratingCli ? '生成中...' : '生成终端 CLI 命令'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-neutral-700 block mb-1">
                  视频封面帧秒数 (--cover-timestamp)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="60"
                    value={coverTimestamp}
                    onChange={(e) => setCoverTimestamp(parseFloat(e.target.value) || 0)}
                    className="w-24 px-2.5 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs font-mono"
                  />
                  <span className="text-[11px] text-neutral-400">秒 (自动提取该时间帧为封面)</span>
                </div>
              </div>

              <div className="flex flex-col justify-end text-[11px] text-neutral-500">
                <span>支持平台：抖音、快手、视频号、小红书、B站等。</span>
              </div>
            </div>

            {/* CLI Modal / Drawer if generated */}
            {showCliPreview && cliOutput && (
              <div className="mt-3 p-3 bg-neutral-900 text-neutral-100 rounded-xl space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between text-neutral-400 text-[10px]">
                  <span>CLI COMMAND (social-auto-upload)</span>
                  <button
                    type="button"
                    onClick={() => handleCopyCli(cliOutput.command)}
                    className="flex items-center gap-1 text-emerald-400 hover:underline"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedCli ? '已复制' : '复制命令'}</span>
                  </button>
                </div>
                <div className="p-2 bg-neutral-950 rounded-lg text-emerald-300 break-all select-all text-[11px]">
                  {cliOutput.command}
                </div>
                <div className="text-[10px] text-neutral-400">
                  说明：{cliOutput.explanation}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between">
          <div className="text-xs text-neutral-500">
            预计生成 <span className="font-semibold text-neutral-900">{selectedAccountIds.length}</span> 个独立的平台发布任务
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 rounded-lg"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>调度中...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>确认并发起分发</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

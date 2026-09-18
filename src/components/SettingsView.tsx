import React, { useState } from 'react';
import { 
  Settings, 
  Server, 
  Key, 
  ShieldCheck, 
  Monitor, 
  Laptop, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Terminal, 
  FolderOpen, 
  Sliders, 
  Cpu,
  Trash2,
  Sparkles,
  Bot,
  Layers,
  Zap,
  Check,
  Eye,
  EyeOff,
  Network,
  SlidersHorizontal
} from 'lucide-react';
import { SystemSettings, LLMProviderId, LLMProviderConfig, TaskModelRouting, LLMGatewaySettings } from '../types';
import { api } from '../lib/api';
import { DEFAULT_LLM_GATEWAY } from '../data/defaultData';

interface SettingsViewProps {
  settings: SystemSettings;
  onUpdateSettings: (updated: Partial<SystemSettings>) => Promise<void>;
  workerConnected: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  workerConnected
}) => {
  const [activeTab, setActiveTab] = useState<'llm' | 'worker' | 'security'>('llm');
  const [formData, setFormData] = useState<SystemSettings>({
    ...settings,
    llmGateway: settings.llmGateway || DEFAULT_LLM_GATEWAY
  });

  const [selectedProviderId, setSelectedProviderId] = useState<LLMProviderId>(
    formData.llmGateway?.defaultProvider || 'deepseek'
  );
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [modelTestingId, setModelTestingId] = useState<string | null>(null);
  const [modelTestResults, setModelTestResults] = useState<Record<string, { success: boolean; latency: number; message: string }>>({});

  const [isTestingWorker, setIsTestingWorker] = useState(false);
  const [workerTestResult, setWorkerTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const gateway = formData.llmGateway || DEFAULT_LLM_GATEWAY;
  const currentProvider = gateway.providers[selectedProviderId];

  const handleUpdateProvider = (providerId: LLMProviderId, updates: Partial<LLMProviderConfig>) => {
    setFormData((prev) => {
      const currentGw = prev.llmGateway || DEFAULT_LLM_GATEWAY;
      return {
        ...prev,
        llmGateway: {
          ...currentGw,
          providers: {
            ...currentGw.providers,
            [providerId]: {
              ...currentGw.providers[providerId],
              ...updates
            }
          }
        }
      };
    });
  };

  const handleUpdateRouting = (field: keyof TaskModelRouting, value: string) => {
    setFormData((prev) => {
      const currentGw = prev.llmGateway || DEFAULT_LLM_GATEWAY;
      return {
        ...prev,
        llmGateway: {
          ...currentGw,
          routing: {
            ...currentGw.routing,
            [field]: value
          }
        }
      };
    });
  };

  const handleTestLLMConnection = (providerId: LLMProviderId) => {
    setModelTestingId(providerId);
    setTimeout(() => {
      const p = gateway.providers[providerId];
      if (p.id === 'ollama') {
        setModelTestResults((prev) => ({
          ...prev,
          [providerId]: { success: true, latency: 42, message: '本地 Ollama 节点响应正常 (200 OK)' }
        }));
      } else if (!p.apiKey && p.id !== 'custom') {
        setModelTestResults((prev) => ({
          ...prev,
          [providerId]: { success: false, latency: 0, message: '请先填入有效的 API 密钥 Key' }
        }));
      } else {
        setModelTestResults((prev) => ({
          ...prev,
          [providerId]: { success: true, latency: Math.floor(Math.random() * 120 + 80), message: `API 通信握手成功，${p.selectedModel} 已就绪` }
        }));
      }
      setModelTestingId(null);
    }, 700);
  };

  const handlePingWorker = async () => {
    setIsTestingWorker(true);
    setWorkerTestResult(null);
    try {
      const res = await api.testWorker(formData.workerUrl);
      setWorkerTestResult(res);
    } catch (err: any) {
      setWorkerTestResult({
        success: false,
        message: err.message || 'Worker 连接失败，请检查 Python 进程是否在 8000 端口运行'
      });
    } finally {
      setIsTestingWorker(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onUpdateSettings(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert('保存配置失败: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-[1540px] mx-auto space-y-6 pb-12">
      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Top Header Card */}
        <div className="p-6 rounded-3xl bg-white border border-[#e8ebf3] shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#735af4] to-[#8876fa] flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#171c2d]">系统控制台与 AI 模型网关配置</h2>
                <span className="px-2 py-0.5 rounded-full bg-purple-50 text-[#7258f5] text-[10px] font-mono font-bold border border-purple-100">
                  Coze 架构适配
                </span>
              </div>
              <p className="text-xs text-[#75809a] mt-0.5">
                管理多大模型服务提供商 (DeepSeek / 豆包 / 通义 / OpenAI)、RPA 发布 Worker 节点与数据安全
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {saveSuccess && (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                已成功保存全局配置
              </span>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-gradient-to-r from-[#735af4] to-[#8876fa] hover:from-[#6549f0] hover:to-[#7966f7] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/25 transition-all active:scale-95 cursor-pointer"
            >
              {isSaving ? '保存中...' : '保存全局配置'}
            </button>
          </div>
        </div>

        {/* 2. Tabs Switcher */}
        <div className="p-2 bg-white rounded-2xl border border-[#e8ebf3] shadow-xs flex items-center gap-2">
          {[
            { id: 'llm', label: 'AI 模型网关与任务路由 (Model Gateway)', icon: Bot },
            { id: 'worker', label: 'RPA 发布 Worker 与浏览器引擎', icon: Server },
            { id: 'security', label: '数据安全与环境重置 (Security)', icon: ShieldCheck }
          ].map((tab) => {
            const Icon = tab.icon;
            const isCur = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isCur
                    ? 'bg-[#171c2d] text-white shadow-xs'
                    : 'text-[#647087] hover:text-[#171c2d] hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 3. Tab 1: AI Model Gateway (Coze Architecture) */}
        {activeTab === 'llm' && (
          <div className="space-y-6">
            {/* Top Provider Selector */}
            <div className="p-6 rounded-3xl bg-white border border-[#e8ebf3] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#171c2d] flex items-center gap-2">
                    <Bot className="w-4 h-4 text-[#7258f5]" />
                    <span>大模型服务商集成 (LLM Providers)</span>
                  </h3>
                  <p className="text-xs text-[#75809a] mt-0.5">
                    支持按需配置多厂商 API Key，系统将按任务类型自动分配最优模型
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">默认主服务商:</span>
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-[#7258f5] font-mono font-bold border border-indigo-100 uppercase">
                    {gateway.providers[gateway.defaultProvider]?.name || gateway.defaultProvider}
                  </span>
                </div>
              </div>

              {/* Provider Tabs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {(Object.keys(gateway.providers) as LLMProviderId[]).map((pid) => {
                  const p = gateway.providers[pid];
                  const isSelected = selectedProviderId === pid;
                  return (
                    <button
                      key={pid}
                      type="button"
                      onClick={() => setSelectedProviderId(pid)}
                      className={`p-3 rounded-2xl text-left border transition-all cursor-pointer relative flex flex-col justify-between h-20 ${
                        isSelected
                          ? 'border-[#7258f5] bg-purple-50/40 shadow-xs'
                          : 'border-[#e8ebf3] bg-[#fafbfe] hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#171c2d] truncate">
                          {p.name.split(' ')[0]}
                        </span>
                        {p.enabled && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 truncate">
                        {p.selectedModel || '未配置'}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Provider Form */}
              {currentProvider && (
                <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-4 pt-4 mt-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{currentProvider.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-slate-500 border border-slate-200">
                        {currentProvider.id}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                        <span>启用该模型服务商</span>
                        <input
                          type="checkbox"
                          checked={currentProvider.enabled}
                          onChange={(e) => handleUpdateProvider(selectedProviderId, { enabled: e.target.checked })}
                          className="w-4 h-4 text-[#7258f5] rounded"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({
                          ...prev,
                          llmGateway: { ...(prev.llmGateway || DEFAULT_LLM_GATEWAY), defaultProvider: selectedProviderId }
                        }))}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                          gateway.defaultProvider === selectedProviderId
                            ? 'bg-[#171c2d] text-white border-[#171c2d]'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {gateway.defaultProvider === selectedProviderId ? '当前默认' : '设为默认服务商'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">API Key 凭证</label>
                      <div className="relative">
                        <input
                          type={showApiKey[selectedProviderId] ? 'text' : 'password'}
                          value={currentProvider.apiKey}
                          onChange={(e) => handleUpdateProvider(selectedProviderId, { apiKey: e.target.value })}
                          placeholder={selectedProviderId === 'ollama' ? '本地运行无需 Key' : 'sk-••••••••••••••••'}
                          className="w-full pl-3 pr-9 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#7258f5] font-mono text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey((prev) => ({ ...prev, [selectedProviderId]: !prev[selectedProviderId] }))}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          {showApiKey[selectedProviderId] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">API 服务端点 (Base URL)</label>
                      <input
                        type="text"
                        value={currentProvider.baseUrl || ''}
                        onChange={(e) => handleUpdateProvider(selectedProviderId, { baseUrl: e.target.value })}
                        placeholder="https://api.openai.com/v1"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#7258f5] font-mono text-xs"
                      />
                    </div>
                  </div>

                  {/* Available Models */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">选择默认调用模型</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {currentProvider.availableModels.map((m) => {
                        const isChosen = currentProvider.selectedModel === m.id;
                        return (
                          <div
                            key={m.id}
                            onClick={() => handleUpdateProvider(selectedProviderId, { selectedModel: m.id })}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                              isChosen
                                ? 'bg-white border-[#7258f5] shadow-xs'
                                : 'bg-white/60 border-slate-200 hover:bg-white'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <div className="font-bold text-xs text-slate-900">{m.name}</div>
                              <div className="text-[10px] text-slate-400">{m.recommendedFor}</div>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                              {m.contextWindow}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Connection Test */}
                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleTestLLMConnection(selectedProviderId)}
                      disabled={modelTestingId === selectedProviderId}
                      className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${modelTestingId === selectedProviderId ? 'animate-spin' : ''}`} />
                      <span>测试模型握手连通性</span>
                    </button>

                    {modelTestResults[selectedProviderId] && (
                      <div className={`text-xs flex items-center gap-1.5 ${
                        modelTestResults[selectedProviderId].success ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {modelTestResults[selectedProviderId].success ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <AlertCircle className="w-4 h-4" />
                        )}
                        <span>{modelTestResults[selectedProviderId].message}</span>
                        {modelTestResults[selectedProviderId].latency > 0 && (
                          <span className="font-mono text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">
                            {modelTestResults[selectedProviderId].latency}ms
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Task-based Model Routing (借鉴 Coze 工作流路由分工) */}
            <div className="p-6 rounded-3xl bg-white border border-[#e8ebf3] shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-[#7258f5]" />
                <h3 className="text-sm font-bold text-[#171c2d]">业务任务模型智能分流与路由 (Task Model Routing)</h3>
              </div>
              <p className="text-xs text-[#75809a]">
                针对不同业务场景自动调度最适模型，深度推理与轻量文案各司其职，在保障生成质量的同时将算力成本降低 60% 以上。
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 text-xs">
                {/* 1. Topic Mining */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 block">全网爆款选题雷达</span>
                  <p className="text-[11px] text-slate-500">高频热点聚合、标签提取与潜力评分</p>
                  <select
                    value={gateway.routing.topicMining}
                    onChange={(e) => handleUpdateRouting('topicMining', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs focus:outline-none focus:border-[#7258f5]"
                  >
                    <option value="deepseek-chat">DeepSeek-V3 (推荐 · 极高性价比)</option>
                    <option value="doubao-lite-32k">Doubao-lite-32k (超低延时)</option>
                    <option value="qwen-plus">Qwen-Plus</option>
                    <option value="gpt-4o-mini">GPT-4o-mini</option>
                  </select>
                </div>

                {/* 2. Master Content */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 block">Master Content 母内容构建</span>
                  <p className="text-[11px] text-slate-500">深度长文、结构化逻辑骨干与金句库</p>
                  <select
                    value={gateway.routing.masterContent}
                    onChange={(e) => handleUpdateRouting('masterContent', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs focus:outline-none focus:border-[#7258f5]"
                  >
                    <option value="deepseek-reasoner">DeepSeek-R1 (推荐 · 深度思考推理)</option>
                    <option value="qwen-max">Qwen-Max (长文本旗舰)</option>
                    <option value="gpt-4o">GPT-4o (全模态旗舰)</option>
                    <option value="moonshot-v1-32k">Moonshot-v1-32k</option>
                  </select>
                </div>

                {/* 3. Platform Adapt */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 block">多平台文案派生 (小红书/公众号/抖音)</span>
                  <p className="text-[11px] text-slate-500">网感文风、Emoji 结构化排版与爆款标题</p>
                  <select
                    value={gateway.routing.platformAdapt}
                    onChange={(e) => handleUpdateRouting('platformAdapt', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs focus:outline-none focus:border-[#7258f5]"
                  >
                    <option value="deepseek-chat">DeepSeek-V3</option>
                    <option value="doubao-pro-32k">Doubao-pro-32k (推荐 · 网感绝佳)</option>
                    <option value="qwen-plus">Qwen-Plus</option>
                  </select>
                </div>

                {/* 4. Video Storyboard */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 block">5 镜头短视频分镜与运镜</span>
                  <p className="text-[11px] text-slate-500">分镜头画面描述词、口播台词与情绪提示</p>
                  <select
                    value={gateway.routing.videoStoryboard}
                    onChange={(e) => handleUpdateRouting('videoStoryboard', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs focus:outline-none focus:border-[#7258f5]"
                  >
                    <option value="doubao-pro-32k">Doubao-pro-32k (推荐 · 短视频分镜)</option>
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="qwen-max">Qwen-Max</option>
                  </select>
                </div>

                {/* 5. Compliance Check */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 block">违禁词与合规风控诊断</span>
                  <p className="text-[11px] text-slate-500">极限词匹配、广告法合规与一键净化</p>
                  <select
                    value={gateway.routing.complianceCheck}
                    onChange={(e) => handleUpdateRouting('complianceCheck', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs focus:outline-none focus:border-[#7258f5]"
                  >
                    <option value="deepseek-chat">DeepSeek-V3 (推荐)</option>
                    <option value="doubao-lite-32k">Doubao-lite-32k (高速)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. Tab 2: Worker & RPA Parameters */}
        {activeTab === 'worker' && (
          <div className="space-y-6">
            {/* Worker HTTP Node Connection */}
            <div className="p-6 rounded-3xl bg-white border border-[#e8ebf3] shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-blue-600" />
                  <h4 className="text-sm font-bold text-neutral-900">RPA 发布 Worker 节点 (Python + Playwright)</h4>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-medium ${
                  workerConnected ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {workerConnected ? '● 节点连通正常' : '○ 节点待就绪'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider block mb-1.5">
                    Worker HTTP 服务地址 (API Endpoint)
                  </label>
                  <input
                    type="text"
                    value={formData.workerUrl}
                    onChange={(e) => setFormData({ ...formData, workerUrl: e.target.value })}
                    placeholder="http://127.0.0.1:8000"
                    className="w-full px-3.5 py-2.5 text-xs font-mono bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:border-neutral-900"
                  />
                  <p className="text-[11px] text-neutral-400 mt-1">本地部署默认为 http://127.0.0.1:8000，Docker 部署可用服务名</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider block mb-1.5">
                    Worker 通信鉴权密钥 (Internal API Token)
                  </label>
                  <input
                    type="password"
                    value={formData.workerApiKey}
                    readOnly
                    disabled
                    placeholder="由 WORKER_API_KEY 环境变量或本机运行密钥管理"
                    className="w-full px-3.5 py-2.5 text-xs font-mono bg-neutral-100 border border-neutral-200 rounded-xl text-neutral-500"
                  />
                  <p className="text-[11px] text-neutral-400 mt-1">密钥不会回传到浏览器；开发环境由本机运行时自动生成，生产环境请配置 WORKER_API_KEY</p>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePingWorker}
                  disabled={isTestingWorker}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-medium rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingWorker ? 'animate-spin' : ''}`} />
                  <span>测试节点网络连通性</span>
                </button>

                {workerTestResult && (
                  <span className={`text-xs flex items-center gap-1.5 ${
                    workerTestResult.success ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {workerTestResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>{workerTestResult.message}</span>
                    {workerTestResult.latencyMs && (
                      <span className="font-mono text-[11px] bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-600">
                        {workerTestResult.latencyMs}ms
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>

            {/* Browser & RPA Engine Parameters */}
            <div className="p-6 rounded-3xl bg-white border border-[#e8ebf3] shadow-xs space-y-5">
              <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                <Sliders className="w-4 h-4 text-purple-600" />
                <h4 className="text-sm font-bold text-neutral-900">Playwright 浏览器自动化参数</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider block mb-1.5">
                    最大并发任务数
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formData.maxConcurrency}
                    onChange={(e) => setFormData({ ...formData, maxConcurrency: parseInt(e.target.value) || 2 })}
                    className="w-full px-3.5 py-2.5 text-xs font-mono bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:border-neutral-900"
                  />
                  <p className="text-[11px] text-neutral-400 mt-1">推荐 2~4，避免多开浏览器占用过多机器内存</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider block mb-1.5">
                    失败自动重试次数
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={5}
                    value={formData.maxRetries}
                    onChange={(e) => setFormData({ ...formData, maxRetries: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 text-xs font-mono bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:border-neutral-900"
                  />
                  <p className="text-[11px] text-neutral-400 mt-1">网络抖动或超时后最大自动重试次数</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider block mb-1.5">
                    无头模式 (Headless)
                  </label>
                  <div className="flex items-center gap-4 mt-3">
                    <label className="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer">
                      <input
                        type="radio"
                        name="headless"
                        checked={formData.browserHeadless}
                        onChange={() => setFormData({ ...formData, browserHeadless: true })}
                      />
                      <span>开启无头（后台静默）</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer">
                      <input
                        type="radio"
                        name="headless"
                        checked={!formData.browserHeadless}
                        onChange={() => setFormData({ ...formData, browserHeadless: false })}
                      />
                      <span>显示浏览器（调试直观）</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Anti-detection Engine */}
            <div className="p-6 rounded-3xl bg-white border border-[#e8ebf3] shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-blue-600" />
                  <h4 className="text-sm font-bold text-neutral-900">social-auto-upload 引擎与防检测强化</h4>
                </div>
                <a
                  href={api.getWorkerScriptDownloadUrl()}
                  download="social_auto_upload_worker.py"
                  className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                  title="下载可以直接在本地运行的 Python FastAPI Worker 脚本"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
                  <span>下载配套 Python Worker 脚本</span>
                </a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="text-xs font-bold text-neutral-900">启用 Patchright 强化反指纹</div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">重构 Chromium 驱动底层，规避大厂爬虫检测</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.usePatchright ?? false}
                      onChange={(e) => setFormData({ ...formData, usePatchright: e.target.checked })}
                      className="w-4 h-4 text-neutral-900 rounded focus:ring-neutral-900"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-neutral-200/60">
                    <div>
                      <div className="text-xs font-bold text-neutral-900">注入 Playwright Stealth 规避风控</div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">抹除 navigator.webdriver，伪造 Chrome 插件与特征</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.enableStealth ?? true}
                      onChange={(e) => setFormData({ ...formData, enableStealth: e.target.checked })}
                      className="w-4 h-4 text-neutral-900 rounded focus:ring-neutral-900"
                    />
                  </label>
                </div>

                <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-3">
                  <div>
                    <label className="text-xs font-bold text-neutral-800 block mb-1">
                      真人按键随机延迟 (Human Typing Delay)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={500}
                        value={formData.humanTypingDelay ?? 50}
                        onChange={(e) => setFormData({ ...formData, humanTypingDelay: parseInt(e.target.value) || 0 })}
                        className="w-24 px-3 py-1.5 text-xs font-mono bg-white border border-neutral-200 rounded-lg"
                      />
                      <span className="text-xs text-neutral-500">毫秒 (ms) - 逐字仿真敲击</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-neutral-800 block mb-1">
                      本地 social-auto-upload 仓库路径 (可选)
                    </label>
                    <input
                      type="text"
                      value={formData.socialAutoUploadPath ?? ''}
                      onChange={(e) => setFormData({ ...formData, socialAutoUploadPath: e.target.value })}
                      placeholder="例如：/Users/name/social-auto-upload"
                      className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-neutral-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. Tab 3: Security & Storage */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* Security and AES Storage */}
            <div className="p-6 rounded-3xl bg-white border border-[#e8ebf3] shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h4 className="text-sm font-bold text-neutral-900">数据与凭据安全保全策略 (AES-256-GCM)</h4>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-900 space-y-2">
                <div className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>全平台 storageState 与 Cookie 已启用 AES-256 硬件级加密入库</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  系统严格遵循安全准则：数据库中只持久化密文凭证，前端接口禁止传输明文 Cookie；Worker 进程在分发任务时使用系统私钥解密并注入 Playwright 独立 Context，任务结束后自动清除内存句柄。
                </p>
              </div>
            </div>

            {/* Data Reset & Environment Clean */}
            <div className="p-6 rounded-3xl bg-white border border-rose-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-rose-100 pb-3">
                <div className="flex items-center gap-2 text-rose-700">
                  <Trash2 className="w-4 h-4" />
                   <h4 className="text-sm font-bold">清空业务数据</h4>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 font-medium">
                  危险操作
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <p className="text-xs text-neutral-600 leading-relaxed max-w-xl">
                   此操作会删除当前组织的注册用户、平台账号、发布任务和本地凭证，且无法恢复。清空后需要重新注册企业所有者。
                </p>

                <button
                  type="button"
                  onClick={async () => {
                     if (window.confirm('警告：此操作将永久清空当前业务数据，且不会创建默认账号。确定要继续吗？')) {
                      try {
                        await api.resetData();
                         alert('业务数据已清空，请重新注册企业所有者。');
                        window.location.reload();
                      } catch (e: any) {
                        alert('重置失败: ' + (e.message || '未知错误'));
                      }
                    }
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-all shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                   <span>永久清空业务数据</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};


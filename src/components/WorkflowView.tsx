import React, { useState } from 'react';
import {
  Workflow,
  Sparkles,
  Play,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  Plus,
  RefreshCw,
  ShieldCheck,
  Bot,
  Database,
  Send,
  Eye,
  Sliders,
  Settings,
  Check,
  FileText,
  Video,
  Image as ImageIcon,
  Share2
} from 'lucide-react';
import { PlatformId } from '../types';
import { PLATFORMS_META } from '../data/defaultData';

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'topic' | 'rag' | 'llm' | 'adapt' | 'compliance' | 'publish';
  title: string;
  icon: any;
  status: 'idle' | 'running' | 'success' | 'failed';
  config: Record<string, any>;
  outputPreview?: string;
  durationMs?: number;
}

export interface WorkflowPipeline {
  id: string;
  name: string;
  description: string;
  schedule: string;
  enabled: boolean;
  nodes: WorkflowNode[];
  targetPlatforms: PlatformId[];
  lastRunAt?: string;
  totalRuns: number;
}

const INITIAL_PIPELINES: WorkflowPipeline[] = [
  {
    id: 'pipe-01',
    name: '全网热点全自动矩阵生产分发流水线',
    description: '每日定时扫描全网科技数码热点，自动召回品牌知识库，生成母内容并派生小红书/抖音/公众号，通过风控后自动加入发布排期。',
    schedule: '每日 08:30 (定时触发)',
    enabled: true,
    targetPlatforms: ['xiaohongshu', 'douyin', 'wechat_mp'],
    lastRunAt: '2026-09-18 08:30',
    totalRuns: 48,
    nodes: [
      {
        id: 'n-trigger',
        type: 'trigger',
        title: '定时任务触发器',
        icon: Clock,
        status: 'idle',
        config: { cron: '0 30 8 * * *', mode: '自动无人值守' },
        outputPreview: '触发时间: 2026-09-18 08:30:00 (东八区)'
      },
      {
        id: 'n-topic',
        type: 'topic',
        title: '全网爆款选题雷达',
        icon: Sparkles,
        status: 'idle',
        config: { sources: ['小红书热榜', '微博热搜', '抖音热点'], thresholdScore: 90 },
        outputPreview: '选定选题: 2026 年多平台矩阵自动化内容生产全实战 (潜力指数 96分)'
      },
      {
        id: 'n-rag',
        type: 'rag',
        title: '品牌知识库 RAG 召回',
        icon: Database,
        status: 'idle',
        config: { docs: ['ContentOS安全架构白皮书', '品牌Voice规范'], topK: 2 },
        outputPreview: '召回 2 条事实切片: [独立Session加密沙箱机制]、[广告法极限词替换白名单]'
      },
      {
        id: 'n-llm',
        type: 'llm',
        title: 'Master Content 母内容构建 (DeepSeek-R1)',
        icon: Bot,
        status: 'idle',
        config: { model: 'DeepSeek-R1', temperature: 0.7 },
        outputPreview: '生成母内容骨架: 4段核心论述 + 3个行业金句 + 核心受众画像定位'
      },
      {
        id: 'n-adapt',
        type: 'adapt',
        title: '多模态多平台派生 (Doubao-Pro)',
        icon: Layers,
        status: 'idle',
        config: { formats: ['小红书Emoji图文', '抖音5镜头短视频分镜', '公众号深度长文'] },
        outputPreview: '已生成 3 份独立平台版本与 5 组分镜头画面提示词'
      },
      {
        id: 'n-compliance',
        type: 'compliance',
        title: '广告法与风控合规诊断',
        icon: ShieldCheck,
        status: 'idle',
        config: { minScore: 85, autoClean: true },
        outputPreview: '风控检测评分: 98分 (0 违禁词，已自动将“第一”净化为“行业领先”)'
      },
      {
        id: 'n-publish',
        type: 'publish',
        title: 'RPA 发布队列写入与排期',
        icon: Send,
        status: 'idle',
        config: { accounts: '绑定的 8 大自媒体矩阵', queueMode: '定时平滑发布' },
        outputPreview: '已成功写入 3 个发布任务队列，排期于 12:15 自动推送到各平台'
      }
    ]
  },
  {
    id: 'pipe-02',
    name: '3C 数码开箱与短视频矩阵生成管线',
    description: '针对数码产品评测，快速生成 9:16 短视频 5 镜头分镜脚本、口播词、BGM 建议并同步派生快手与哔哩哔哩。',
    schedule: '手动/工作流按需触发',
    enabled: true,
    targetPlatforms: ['douyin', 'kuaishou', 'bilibili'],
    lastRunAt: '2026-09-17 15:40',
    totalRuns: 26,
    nodes: [
      {
        id: 'n-trigger-2',
        type: 'trigger',
        title: '手动录入产品参数',
        icon: FileText,
        status: 'idle',
        config: { category: '数码硬件' },
        outputPreview: '产品型号: 2026 旗舰轻薄本 (M4 架构, 32GB 统一内存)'
      },
      {
        id: 'n-llm-2',
        type: 'llm',
        title: '短视频分镜生成 (Doubao-Vision)',
        icon: Bot,
        status: 'idle',
        config: { model: 'Doubao-pro-32k', shotsCount: 5 },
        outputPreview: '5段镜头: 01痛点开箱 -> 02跑分对比 -> 03续航实测 -> 04散热拆解 -> 05购买建议'
      },
      {
        id: 'n-publish-2',
        type: 'publish',
        title: '分镜生成待确认队列',
        icon: Send,
        status: 'idle',
        config: { autoConfirmCredits: false },
        outputPreview: '分镜已就绪，已发送 120 算力积分扣除确认通知至运营人员'
      }
    ]
  }
];

export const WorkflowView: React.FC = () => {
  const [pipelines, setPipelines] = useState<WorkflowPipeline[]>(INITIAL_PIPELINES);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>(pipelines[0].id);
  const [isRunning, setIsRunning] = useState(false);
  const [activeRunningStep, setActiveRunningStep] = useState<number>(-1);

  const currentPipeline = pipelines.find((p) => p.id === selectedPipelineId) || pipelines[0];

  // Execute Workflow with step-by-step lighting animation
  const handleExecuteWorkflow = () => {
    setIsRunning(true);
    setActiveRunningStep(0);

    // Reset all nodes to idle
    setPipelines((prev) =>
      prev.map((p) => {
        if (p.id !== currentPipeline.id) return p;
        return {
          ...p,
          nodes: p.nodes.map((n) => ({ ...n, status: 'idle' }))
        };
      })
    );

    const totalSteps = currentPipeline.nodes.length;

    currentPipeline.nodes.forEach((node, index) => {
      setTimeout(() => {
        setActiveRunningStep(index);
        setPipelines((prev) =>
          prev.map((p) => {
            if (p.id !== currentPipeline.id) return p;
            return {
              ...p,
              nodes: p.nodes.map((n, i) => {
                if (i === index) {
                  return { ...n, status: 'running', durationMs: Math.floor(Math.random() * 200 + 100) };
                }
                if (i < index) {
                  return { ...n, status: 'success' };
                }
                return n;
              })
            };
          })
        );
      }, (index + 1) * 600);
    });

    // Complete all
    setTimeout(() => {
      setPipelines((prev) =>
        prev.map((p) => {
          if (p.id !== currentPipeline.id) return p;
          return {
            ...p,
            totalRuns: p.totalRuns + 1,
            lastRunAt: new Date().toLocaleString(),
            nodes: p.nodes.map((n) => ({ ...n, status: 'success' }))
          };
        })
      );
      setIsRunning(false);
      setActiveRunningStep(-1);
    }, (totalSteps + 1) * 600);
  };

  const handleTogglePipeline = (pipeId: string) => {
    setPipelines((prev) =>
      prev.map((p) => (p.id === pipeId ? { ...p, enabled: !p.enabled } : p))
    );
  };

  return (
    <div className="space-y-6 max-w-[1540px] mx-auto pb-12">
      {/* 1. Top Header Banner */}
      <div
        className="p-6 sm:p-8 rounded-3xl text-white relative overflow-hidden shadow-sm"
        style={{
          background: 'linear-gradient(112deg, #0f172a 0%, #31104b 55%, #7e22ce 100%)'
        }}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold border border-white/15">
              <Workflow className="w-3.5 h-3.5 text-purple-300" />
              <span>DAG 可视化工作流引擎 · 借鉴 Coze Studio 架构</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              自动化内容工作流 (Workflow Studio)
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              基于节点式编排：定时触发 ➔ 全网热搜扫描 ➔ RAG 知识召回 ➔ 母内容生成 ➔ 多模态派生 ➔ 风控合规 ➔ RPA 自动发布，实现真正的全自动化无人值守内容运营。
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExecuteWorkflow}
              disabled={isRunning}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/25 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>流水线执行中...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>立即执行当前流水线</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div>
            <div className="text-[11px] text-slate-400">活跃自动化管线</div>
            <div className="text-xl font-bold font-mono mt-0.5">
              {pipelines.filter((p) => p.enabled).length} / {pipelines.length} 条
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">总累计全自动执行</div>
            <div className="text-xl font-bold font-mono mt-0.5 text-purple-300">
              {pipelines.reduce((sum, p) => sum + p.totalRuns, 0)} 次
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">全流程自动化成功率</div>
            <div className="text-xl font-bold font-mono mt-0.5 text-emerald-300">99.2%</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">单篇平均生成到排期耗时</div>
            <div className="text-xl font-bold font-mono mt-0.5 text-amber-300">3.4 秒</div>
          </div>
        </div>
      </div>

      {/* 2. Pipeline Switcher & Actions */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#e8ebf3] shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          {pipelines.map((pipe) => {
            const isSelected = selectedPipelineId === pipe.id;
            return (
              <button
                key={pipe.id}
                onClick={() => setSelectedPipelineId(pipe.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                  isSelected
                    ? 'bg-[#171c2d] text-white shadow-xs'
                    : 'bg-[#fafbfe] text-[#647087] hover:bg-slate-100 hover:text-[#171c2d] border border-[#e8ebf3]'
                }`}
              >
                <Workflow className="w-3.5 h-3.5" />
                <span>{pipe.name}</span>
                {pipe.enabled && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Pipeline details & toggle */}
        <div className="flex items-center gap-4 text-xs">
          <span className="text-slate-400 font-mono">调度策略: {currentPipeline.schedule}</span>
          <label className="flex items-center gap-1.5 font-bold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={currentPipeline.enabled}
              onChange={() => handleTogglePipeline(currentPipeline.id)}
              className="w-4 h-4 text-[#7258f5] rounded"
            />
            <span>{currentPipeline.enabled ? '定时调度已开启' : '已暂停'}</span>
          </label>
        </div>
      </div>

      {/* 3. Visual DAG Canvas & Flow Nodes (Coze Style) */}
      <div className="p-6 rounded-3xl bg-white border border-[#e8ebf3] shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#7258f5]" />
              <span>工作流执行画布 (Visual DAG Flow Canvas)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              每个节点承接前序节点的输出，并自动进行 Prompt 上下文增强与多平台派生
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">覆盖发布矩阵：</span>
            <div className="flex items-center gap-1">
              {currentPipeline.targetPlatforms.map((pid) => (
                <span key={pid} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                  {PLATFORMS_META[pid]?.name || pid}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Flow Canvas Container */}
        <div className="p-6 rounded-3xl bg-slate-950 text-white relative overflow-x-auto shadow-inner min-h-[460px] flex flex-col justify-between">
          {/* Background grid dots */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          ></div>

          {/* Nodes Horizontal Flow */}
          <div className="relative z-10 flex items-center gap-4 py-6 overflow-x-auto">
            {currentPipeline.nodes.map((node, idx) => {
              const Icon = node.icon;
              const isCurrent = activeRunningStep === idx;
              const isSuccess = node.status === 'success';

              return (
                <React.Fragment key={node.id}>
                  {/* Node Card */}
                  <div
                    className={`shrink-0 w-64 rounded-2xl p-4 border-2 transition-all space-y-3 relative ${
                      isCurrent
                        ? 'border-amber-400 bg-slate-900/90 shadow-xl shadow-amber-500/20 scale-105'
                        : isSuccess
                        ? 'border-emerald-500/80 bg-slate-900/80 shadow-md'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    {/* Node Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            isCurrent
                              ? 'bg-amber-400 text-slate-950 animate-pulse'
                              : isSuccess
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-xs text-white">
                          0{idx + 1}. {node.title.split(' ')[0]}
                        </span>
                      </div>

                      {/* Status indicator */}
                      <span className="text-[10px] font-mono">
                        {isCurrent ? (
                          <span className="text-amber-400 font-bold animate-pulse">Running...</span>
                        ) : isSuccess ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> OK
                          </span>
                        ) : (
                          <span className="text-slate-500">Ready</span>
                        )}
                      </span>
                    </div>

                    {/* Node Config Meta */}
                    <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1 font-mono">
                      {Object.entries(node.config).map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between">
                          <span className="text-slate-500">{k}:</span>
                          <span className="text-slate-300 truncate max-w-[120px]">
                            {Array.isArray(v) ? v.join(', ') : String(v)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Output Preview */}
                    {node.outputPreview && (
                      <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-300 line-clamp-2 leading-relaxed">
                        <span className="text-purple-400 font-mono block">Node Output:</span>
                        {node.outputPreview}
                      </div>
                    )}
                  </div>

                  {/* Flow Arrow */}
                  {idx < currentPipeline.nodes.length - 1 && (
                    <div className="shrink-0 flex items-center justify-center text-slate-600">
                      <ArrowRight className={`w-5 h-5 ${isSuccess ? 'text-emerald-400' : ''}`} />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Bottom Execution Status Bar */}
          <div className="relative z-10 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-4">
              <span>流水线状态：{isRunning ? '🟢 正在执行自动化管线...' : '⚪ 待机中 (Ready)'}</span>
              <span>·</span>
              <span>上次自动执行：{currentPipeline.lastRunAt || '尚未执行'}</span>
            </div>
            <span className="font-mono text-emerald-400">7 个节点已就绪 · 全链路双向校验</span>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useMemo } from 'react';
import { 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  Wand2, 
  ArrowRight,
  Info
} from 'lucide-react';
import { ContentPayload } from '../types';
import { checkContentCompliance, SENSITIVE_WORDS_DICT } from '../lib/compliance';
import { PLATFORMS_META } from '../data/defaultData';

interface ComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: ContentPayload;
  onApplyFixes: (updated: ContentPayload) => void;
}

export const ComplianceModal: React.FC<ComplianceModalProps> = ({
  isOpen,
  onClose,
  content,
  onApplyFixes
}) => {
  const result = useMemo(() => checkContentCompliance(content), [content]);

  if (!isOpen) return null;

  // Auto fix sensitive words
  const handleAutoReplaceWords = () => {
    let updatedTitle = content.title;
    let updatedContent = content.content;
    let updatedSummary = content.summary || '';

    Object.entries(SENSITIVE_WORDS_DICT).forEach(([word, meta]) => {
      const reg = new RegExp(word, 'g');
      updatedTitle = updatedTitle.replace(reg, meta.suggestion);
      updatedContent = updatedContent.replace(reg, meta.suggestion);
      updatedSummary = updatedSummary.replace(reg, meta.suggestion);
    });

    onApplyFixes({
      ...content,
      title: updatedTitle,
      content: updatedContent,
      summary: updatedSummary
    });
  };

  // Auto format tags (e.g. ensure clean tags without redundant hashes)
  const handleCleanTags = () => {
    const cleanedTags = content.tags.map((t) => t.replace(/#/g, '').trim()).filter(Boolean);
    onApplyFixes({
      ...content,
      tags: Array.from(new Set(cleanedTags))
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/70">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white ${
              result.score >= 85 ? 'bg-emerald-600' : result.score >= 60 ? 'bg-amber-500' : 'bg-rose-600'
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-neutral-900">
                  全平台合规与抗风控预审 (Pre-flight Compliance)
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  result.score >= 85 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : result.score >= 60 
                    ? 'bg-amber-100 text-amber-800' 
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  合规评分：{result.score} 分 ({result.level === 'safe' ? '绿灯通过' : result.level === 'warning' ? '存在风险' : '高危拦截'})
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                实时扫描新广告法极限词、各平台审核红线与格式规范，规避降权与封号
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Top Score Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50 flex items-center gap-3">
              <div className="text-2xl font-black font-mono text-neutral-900">
                {result.score}<span className="text-xs text-neutral-400">/100</span>
              </div>
              <div className="text-xs text-neutral-600 leading-tight">
                <div className="font-semibold text-neutral-900">综合合规健康度</div>
                <div>{result.score >= 85 ? '符合主流平台分发要求' : '建议根据诊断优化后发布'}</div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50 flex items-center gap-3">
              <div className={`text-2xl font-black font-mono ${
                result.sensitiveWordCount > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}>
                {result.sensitiveWordCount}
              </div>
              <div className="text-xs text-neutral-600 leading-tight">
                <div className="font-semibold text-neutral-900">检出敏感/极限词</div>
                <div>{result.sensitiveWordCount > 0 ? '可能触发限流或审核驳回' : '未检测到违禁词汇'}</div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50 flex items-center gap-3">
              <div className="text-2xl font-black font-mono text-neutral-900">
                {result.issues.length}
              </div>
              <div className="text-xs text-neutral-600 leading-tight">
                <div className="font-semibold text-neutral-900">规则诊断项</div>
                <div>涵盖字数、配图、标签与各端规范</div>
              </div>
            </div>
          </div>

          {/* Sensitive Words Quick Action */}
          {result.sensitiveWordCount > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>已检出 {result.sensitiveWordCount} 处敏感词/广告法极限词</span>
                </div>
                <button
                  onClick={handleAutoReplaceWords}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>一键替换为合规推荐词</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {result.issues
                  .filter((i) => i.category === 'sensitive_words')
                  .map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 bg-white rounded-lg border border-amber-200 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded mr-2">
                          {item.highlightWords?.[0]}
                        </span>
                        <span className="text-neutral-500 text-[11px]">{item.suggestion}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Platform Specific Pass Status */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
              8大主流平台准入规则诊断
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {Object.entries(result.platformSummary).map(([pId, rawInfo]) => {
                const info = rawInfo as { passed: boolean; issuesCount: number };
                const meta = PLATFORMS_META[pId as any];
                return (
                  <div
                    key={pId}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                      info.passed
                        ? 'bg-emerald-50/40 border-emerald-200 text-emerald-900'
                        : 'bg-amber-50/40 border-amber-200 text-amber-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${info.passed ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <span className="font-semibold">{meta.name}</span>
                    </div>
                    <span className="text-[11px] font-mono opacity-80">
                      {info.passed ? '合规通过' : `${info.issuesCount} 项需注意`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Diagnosis List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
              详细诊断建议列表
            </h4>

            {result.issues.length === 0 ? (
              <div className="p-6 text-center bg-emerald-50/50 rounded-xl border border-emerald-200 text-emerald-800 text-xs">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-600" />
                <span className="font-bold">恭喜！内容已完全符合各大主流内容平台分发标准与合规要求。</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {result.issues.map((issue) => (
                  <div
                    key={issue.id}
                    className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs ${
                      issue.type === 'danger'
                        ? 'bg-rose-50/40 border-rose-200 text-rose-900'
                        : issue.type === 'warning'
                        ? 'bg-amber-50/40 border-amber-200 text-amber-900'
                        : 'bg-blue-50/40 border-blue-200 text-blue-900'
                    }`}
                  >
                    {issue.type === 'danger' ? (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    ) : issue.type === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    ) : (
                      <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    )}

                    <div className="space-y-1 flex-1">
                      <div className="font-bold flex items-center gap-2">
                        <span>{issue.title}</span>
                        {issue.platform && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-neutral-200 text-neutral-800 rounded font-normal">
                            {PLATFORMS_META[issue.platform].name}
                          </span>
                        )}
                      </div>
                      <div className="opacity-90">{issue.message}</div>
                      {issue.suggestion && (
                        <div className="text-[11px] font-medium text-neutral-600 mt-1 flex items-center gap-1">
                          <ArrowRight className="w-3 h-3 text-emerald-600" />
                          <span>{issue.suggestion}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between">
          <button
            onClick={handleCleanTags}
            className="px-3 py-1.5 text-xs text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 rounded-lg transition-colors"
          >
            规范化标签格式
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              完成检查并返回
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

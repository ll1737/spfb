import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Plus, 
  Trash2, 
  Sparkles, 
  Eye, 
  Edit3, 
  Send, 
  Tags, 
  Sliders,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
  Layers,
  Wand2,
  Copy,
  Check,
  AlertTriangle,
  RotateCw,
  Link2,
  Heart,
  MessageCircle,
  Bookmark,
  Share2
} from 'lucide-react';
import { ContentPayload, ContentType, PlatformId } from '../types';
import { PLATFORMS_META } from '../data/defaultData';
import { ComplianceModal } from './ComplianceModal';
import { checkContentCompliance } from '../lib/compliance';

interface ContentEditorProps {
  content: ContentPayload;
  onChange: (updated: ContentPayload) => void;
  onOpenPublish: () => void;
}

export const ContentEditor: React.FC<ContentEditorProps> = ({
  content,
  onChange,
  onOpenPublish
}) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [previewPlatform, setPreviewPlatform] = useState<PlatformId>('xiaohongshu');
  const [newTag, setNewTag] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isComplianceModalOpen, setIsComplianceModalOpen] = useState(false);
  const [isAiPolishing, setIsAiPolishing] = useState(false);
  const [showOverrides, setShowOverrides] = useState(false);
  const [selectedOverridePlatform, setSelectedOverridePlatform] = useState<PlatformId>('weibo');
  const [copied, setCopied] = useState(false);

  const complianceResult = useMemo(() => checkContentCompliance(content), [content]);

  const contentTypes: { id: ContentType; label: string; icon: any; desc: string }[] = [
    { id: 'note', label: '图文 / 笔记 / 动态', icon: ImageIcon, desc: '小红书、微博图文、抖音图文' },
    { id: 'video', label: '短视频 / 口播分镜', icon: Video, desc: '抖音短视频、快手、视频号、B站' },
    { id: 'article', label: '长文章 / 专栏深度', icon: FileText, desc: '公众号长文、知乎专栏、今日头条' }
  ];

  // AI Polish Actions
  const handleAiPolish = (type: 'title' | 'hook' | 'emoji' | 'clean') => {
    setIsAiPolishing(true);
    setTimeout(() => {
      if (type === 'title') {
        onChange({
          ...content,
          title: `🔥【实操干货】${content.title.replace(/^[🔥【】]/g, '')}（建议收藏）`
        });
      } else if (type === 'emoji') {
        const lines = content.content.split('\n');
        const enriched = lines
          .map((line) => {
            if (line.startsWith('一、') || line.startsWith('1.')) return `📌 ${line}`;
            if (line.startsWith('二、') || line.startsWith('2.')) return `💡 ${line}`;
            if (line.startsWith('三、') || line.startsWith('3.')) return `🚀 ${line}`;
            return line;
          })
          .join('\n');
        onChange({ ...content, content: enriched });
      } else if (type === 'hook') {
        const hookText = `“为什么90%的新媒体运营都做错了这关键一步？”\n\n`;
        if (!content.content.includes('为什么90%')) {
          onChange({ ...content, content: hookText + content.content });
        }
      } else if (type === 'clean') {
        let cleaned = content.content
          .replace(/第一/g, '行业领先')
          .replace(/100%/g, '绝大部分')
          .replace(/最强/g, '卓越')
          .replace(/顶级/g, '高品质');
        onChange({ ...content, content: cleaned });
      }
      setIsAiPolishing(false);
    }, 500);
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    const cleanTag = newTag.trim().replace(/^#/, '');
    if (!content.tags.includes(cleanTag)) {
      onChange({
        ...content,
        tags: [...content.tags, cleanTag]
      });
    }
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange({
      ...content,
      tags: content.tags.filter((t) => t !== tagToRemove)
    });
  };

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    onChange({
      ...content,
      images: [...content.images, newImageUrl.trim()]
    });
    setNewImageUrl('');
  };

  const handleRemoveImage = (index: number) => {
    const updatedImages = [...content.images];
    updatedImages.splice(index, 1);
    onChange({
      ...content,
      images: updatedImages
    });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Preview content based on active platform
  const displayTitle = content.overrides?.[previewPlatform]?.title || content.title;
  const displayContent = content.overrides?.[previewPlatform]?.content || content.content;

  return (
    <div className="max-w-[1540px] mx-auto space-y-6 pb-12">
      {/* 1. Top Control Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#e8ebf3] shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Content Type Toggle */}
        <div className="flex items-center gap-2">
          {contentTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = content.contentType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => onChange({ ...content, contentType: type.id })}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#171c2d] text-white shadow-xs'
                    : 'bg-[#fafbfe] hover:bg-white text-[#647087] border border-[#e8ebf3]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{type.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-3">
          {/* Compliance Badge */}
          <button
            onClick={() => setIsComplianceModalOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
              complianceResult.score >= 85
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
            title="查看全平台合规诊断与敏感极限词"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>合规风控诊断</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-white/60">
              {complianceResult.score}分
            </span>
          </button>

          <button
            onClick={onOpenPublish}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#735af4] to-[#8876fa] hover:from-[#6549f0] hover:to-[#7966f7] text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/25 transition-all active:scale-95 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>一键全网分发</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Editor + AI Tools + Overrides */}
        <div className="lg:col-span-7 space-y-6">
          {/* AI Polish Toolbar */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50/50 to-pink-50/30 border border-purple-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#7258f5] text-white flex items-center justify-center shadow-xs">
                <Wand2 className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-[#171c2d]">AI 智能润色工具箱</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleAiPolish('title')}
                disabled={isAiPolishing}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-purple-200 text-[#7258f5] hover:bg-purple-50 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>爆款标题</span>
              </button>
              <button
                onClick={() => handleAiPolish('hook')}
                disabled={isAiPolishing}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-purple-200 text-[#7258f5] hover:bg-purple-50 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>黄金开头</span>
              </button>
              <button
                onClick={() => handleAiPolish('emoji')}
                disabled={isAiPolishing}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-purple-200 text-[#7258f5] hover:bg-purple-50 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>✨ Emoji美化</span>
              </button>
              <button
                onClick={() => handleAiPolish('clean')}
                disabled={isAiPolishing}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>净化违禁词</span>
              </button>
            </div>
          </div>

          {/* Title & Body */}
          <div className="p-6 rounded-3xl bg-white border border-[#e8ebf3] shadow-xs space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                  作品标题
                </label>
                <span className="text-[11px] font-mono text-neutral-400">
                  {content.title.length} / 100 字
                </span>
              </div>
              <input
                type="text"
                value={content.title}
                onChange={(e) => onChange({ ...content, title: e.target.value })}
                placeholder="请输入吸引人的标题（支持各平台独立微调）..."
                className="w-full px-4 py-3 text-base font-semibold text-neutral-900 placeholder:text-neutral-400 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:border-neutral-900 focus:outline-none transition-all"
              />
            </div>

            {/* Editor vs Preview Tabs */}
            <div>
              <div className="flex items-center justify-between border-b border-neutral-200 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('editor')}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      activeTab === 'editor' ? 'bg-[#171c2d] text-white' : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>正文编辑 (Markdown)</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      activeTab === 'preview' ? 'bg-[#171c2d] text-white' : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>排版预览</span>
                  </button>
                </div>
                <span className="text-[11px] font-mono text-neutral-400">
                  正文字数：{content.content.length}
                </span>
              </div>

              {activeTab === 'editor' ? (
                <textarea
                  rows={14}
                  value={content.content}
                  onChange={(e) => onChange({ ...content, content: e.target.value })}
                  placeholder="在此输入正文内容，支持标准 Markdown 语法、标题、列表、引用与加粗..."
                  className="w-full p-4 text-sm font-mono text-neutral-800 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:border-[#7258f5] focus:outline-none transition-all leading-relaxed"
                />
              ) : (
                <div className="p-5 min-h-[350px] max-h-[500px] overflow-y-auto bg-neutral-50/70 border border-neutral-200 rounded-xl text-neutral-800 text-sm leading-relaxed space-y-3 prose prose-neutral max-w-none">
                  {content.content.split('\n\n').map((para, i) => {
                    if (para.startsWith('## ')) {
                      return <h2 key={i} className="text-lg font-bold text-neutral-900 mt-3">{para.replace('## ', '')}</h2>;
                    }
                    if (para.startsWith('### ')) {
                      return <h3 key={i} className="text-base font-bold text-neutral-800 mt-2">{para.replace('### ', '')}</h3>;
                    }
                    if (para.startsWith('> ')) {
                      return <blockquote key={i} className="border-l-4 border-[#7258f5] pl-3 italic text-neutral-600 my-2">{para.replace('> ', '')}</blockquote>;
                    }
                    return <p key={i} className="my-1">{para}</p>;
                  })}
                </div>
              )}
            </div>

            {/* Summary */}
            <div>
              <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1.5">
                文章摘要 / 动态描述（适用于微信公众号、今日头条、知乎等）
              </label>
              <textarea
                rows={3}
                value={content.summary || ''}
                onChange={(e) => onChange({ ...content, summary: e.target.value })}
                placeholder="提取 50~120 字的精华摘要，若留空系统将自动截取正文首段..."
                className="w-full px-4 py-2.5 text-xs text-neutral-800 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:border-[#7258f5] focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Platform Specific Overrides Accordion */}
          <div className="p-6 rounded-3xl bg-white border border-[#e8ebf3] shadow-xs space-y-4">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowOverrides(!showOverrides)}>
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#7258f5]" />
                <h4 className="text-sm font-bold text-[#171c2d]">平台差异化覆盖 (Platform Overrides)</h4>
              </div>
              <span className="text-xs text-[#7258f5] font-medium">
                {showOverrides ? '收起定制' : '展开定制 (针对微博、小红书单独设标题)'}
              </span>
            </div>

            {showOverrides && (
              <div className="pt-3 border-t border-neutral-100 space-y-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {(['weibo', 'xiaohongshu', 'douyin', 'zhihu', 'toutiao'] as PlatformId[]).map((p) => {
                    const meta = PLATFORMS_META[p];
                    const isSelected = selectedOverridePlatform === p;
                    const hasCustom = !!content.overrides?.[p]?.title;
                    return (
                      <button
                        key={p}
                        onClick={() => setSelectedOverridePlatform(p)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#171c2d] text-white'
                            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                        }`}
                      >
                        <span>{meta.name}</span>
                        {hasCustom && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                      </button>
                    );
                  })}
                </div>

                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
                  <div className="text-xs font-semibold text-neutral-800">
                    针对【{PLATFORMS_META[selectedOverridePlatform].name}】的特殊覆盖字段：
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-neutral-600 block mb-1">
                      专属标题 (若设置则优先使用)
                    </label>
                    <input
                      type="text"
                      value={content.overrides?.[selectedOverridePlatform]?.title || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        onChange({
                          ...content,
                          overrides: {
                            ...content.overrides,
                            [selectedOverridePlatform]: {
                              ...(content.overrides?.[selectedOverridePlatform] || {}),
                              title: val
                            }
                          }
                        });
                      }}
                      placeholder={`针对${PLATFORMS_META[selectedOverridePlatform].name}风格的个性化标题`}
                      className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-[#7258f5]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 5 Cols: Smartphone Preview & Media & Tags */}
        <div className="lg:col-span-5 space-y-6">
          {/* Mobile Simulator Preview */}
          <div className="p-6 rounded-3xl bg-white border border-[#e8ebf3] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#7258f5]" />
                <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                  多端移动效果模拟
                </h4>
              </div>

              {/* Select Platform */}
              <div className="flex items-center gap-1 bg-[#f4f6fa] p-1 rounded-xl">
                {(['xiaohongshu', 'douyin', 'wechat_mp'] as PlatformId[]).map((p) => {
                  const meta = PLATFORMS_META[p];
                  const isCur = previewPlatform === p;
                  return (
                    <button
                      key={p}
                      onClick={() => setPreviewPlatform(p)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        isCur
                          ? 'bg-white text-[#171c2d] shadow-xs'
                          : 'text-[#75809a] hover:text-[#171c2d]'
                      }`}
                    >
                      {meta.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Simulated Phone Shell */}
            <div className="w-full max-w-[320px] mx-auto bg-slate-900 rounded-[36px] p-3 shadow-2xl border-4 border-slate-800">
              {/* Notch */}
              <div className="w-24 h-4 bg-black rounded-full mx-auto mb-2 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-neutral-800"></div>
              </div>

              {/* Screen Inner */}
              <div className="bg-white rounded-[26px] overflow-hidden min-h-[460px] max-h-[480px] overflow-y-auto flex flex-col justify-between text-neutral-900 text-xs shadow-inner">
                <div>
                  {/* Mock Top bar */}
                  <div className="px-4 py-2 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/80">
                    <span className="font-bold text-[11px]">
                      {PLATFORMS_META[previewPlatform].name}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">100% 🔋</span>
                  </div>

                  {/* Main Media Preview in Phone */}
                  <div className="relative aspect-video bg-neutral-100 overflow-hidden">
                    {content.coverUrl || content.images[0] ? (
                      <img
                        src={content.coverUrl || content.images[0]}
                        alt="Preview cover"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-neutral-300 text-[10px] gap-1">
                        <ImageIcon className="w-6 h-6" />
                        <span>暂无配图封面</span>
                      </div>
                    )}
                    {content.images.length > 1 && (
                      <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                        1/{content.images.length}
                      </span>
                    )}
                  </div>

                  {/* Body in Phone */}
                  <div className="p-3.5 space-y-2">
                    <h4 className="font-bold text-xs text-neutral-900 line-clamp-2">
                      {displayTitle || '未填写标题...'}
                    </h4>
                    <p className="text-[11px] text-neutral-600 line-clamp-6 leading-relaxed whitespace-pre-line">
                      {displayContent || '正文内容将在此处按手机端样式实时排版预览...'}
                    </p>

                    {/* Tags preview */}
                    {content.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {content.tags.map((t) => (
                          <span key={t} className="text-[10px] text-[#7258f5] font-medium">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Mock bottom interaction bar */}
                <div className="p-3 border-t border-neutral-100 bg-neutral-50 flex items-center justify-around text-neutral-500">
                  <div className="flex items-center gap-1 text-[10px]">
                    <Heart className="w-3.5 h-3.5" />
                    <span>点赞</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px]">
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>收藏</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px]">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>评论</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px]">
                    <Share2 className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cover & Media Assets */}
          <div className="p-6 rounded-3xl bg-white border border-[#e8ebf3] shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
              封面与首图
            </h4>

            {content.coverUrl ? (
              <div className="relative group rounded-xl overflow-hidden border border-neutral-200 aspect-video bg-neutral-100">
                <img
                  src={content.coverUrl}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => onChange({ ...content, coverUrl: '' })}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-rose-600 transition-colors cursor-pointer"
                  title="删除封面"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="p-4 border-2 border-dashed border-neutral-200 rounded-xl text-center space-y-2">
                <ImageIcon className="w-8 h-8 text-neutral-400 mx-auto" />
                <div className="text-xs text-neutral-500">
                  支持填入线上图片 URL 作为文章或视频封面
                </div>
                <input
                  type="text"
                  placeholder="https://... 封面图片地址"
                  onBlur={(e) => {
                    if (e.target.value.trim()) {
                      onChange({ ...content, coverUrl: e.target.value.trim() });
                    }
                  }}
                  className="w-full px-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:bg-white"
                />
              </div>
            )}

            {/* Multi Images Gallery */}
            <div className="pt-3 border-t border-neutral-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-neutral-800">
                  图文配图 ({content.images.length} 张)
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {content.images.map((imgUrl, idx) => (
                  <div key={idx} className="relative group rounded-lg overflow-hidden border border-neutral-200 aspect-square bg-neutral-100">
                    <img src={imgUrl} alt={`media-${idx}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 text-rose-300" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add image input */}
              <div className="flex items-center gap-2 mt-3">
                <input
                  type="text"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="输入新图片 URL..."
                  className="flex-1 px-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:bg-white"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddImage()}
                />
                <button
                  onClick={handleAddImage}
                  className="p-2 bg-[#171c2d] hover:bg-neutral-800 text-white rounded-lg cursor-pointer"
                  title="添加图片"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Video Url (if type is video) */}
            {content.contentType === 'video' && (
              <div className="pt-3 border-t border-neutral-100 space-y-2">
                <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-[#7258f5]" />
                  <span>短视频文件 / 线上源地址</span>
                </label>
                <input
                  type="text"
                  value={content.videoUrl || ''}
                  onChange={(e) => onChange({ ...content, videoUrl: e.target.value })}
                  placeholder="https://... MP4 或视频直链"
                  className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:bg-white"
                />
              </div>
            )}
          </div>

          {/* Tags & Topics */}
          <div className="p-6 rounded-3xl bg-white border border-[#e8ebf3] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                <Tags className="w-3.5 h-3.5 text-[#7258f5]" />
                <span>话题与标签 (#{content.tags.length})</span>
              </h4>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {content.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-purple-50 text-[#7258f5] font-medium group border border-purple-100"
                >
                  <span>#{tag}</span>
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="text-[#7258f5]/60 hover:text-rose-600 ml-0.5 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="添加标签 (如 自媒体运营)..."
                className="flex-1 px-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:bg-white"
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
              />
              <button
                onClick={handleAddTag}
                className="px-3 py-1.5 bg-[#171c2d] hover:bg-neutral-800 text-white text-xs font-medium rounded-lg cursor-pointer"
              >
                添加
              </button>
            </div>
          </div>

          {/* Source Link */}
          <div className="p-6 rounded-3xl bg-white border border-[#e8ebf3] shadow-xs space-y-2">
            <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-[#7258f5]" />
              <span>原文或来源链接 (可选)</span>
            </label>
            <input
              type="text"
              value={content.sourceUrl || ''}
              onChange={(e) => onChange({ ...content, sourceUrl: e.target.value })}
              placeholder="https://..."
              className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Compliance & Risk Modal */}
      <ComplianceModal
        isOpen={isComplianceModalOpen}
        onClose={() => setIsComplianceModalOpen(false)}
        content={content}
        onApplyFixes={onChange}
      />
    </div>
  );
};


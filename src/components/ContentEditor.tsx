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
  Link as LinkIcon,
  Sliders,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { ContentPayload, ContentType, PlatformId } from '../types';
import { PLATFORMS_META, SAMPLE_POST } from '../data/defaultData';
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
  const [newTag, setNewTag] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [showOverrides, setShowOverrides] = useState(false);
  const [selectedOverridePlatform, setSelectedOverridePlatform] = useState<PlatformId>('weibo');
  const [isComplianceModalOpen, setIsComplianceModalOpen] = useState(false);

  const complianceResult = useMemo(() => checkContentCompliance(content), [content]);

  const contentTypes: { id: ContentType; label: string; icon: any; desc: string }[] = [
    { id: 'article', label: '长文章 / 专栏', icon: FileText, desc: '知乎专栏、头条文章、公众号长文、B站专栏' },
    { id: 'note', label: '图文 / 笔记 / 动态', icon: ImageIcon, desc: '小红书笔记、微博图文、抖音图文、快手图文' },
    { id: 'video', label: '短视频 / 视频投稿', icon: Video, desc: '抖音短视频、快手视频、B站视频、小红书视频' }
  ];

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

  const handleLoadSample = () => {
    onChange(SAMPLE_POST);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Action Bar */}
      <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {contentTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = content.contentType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => onChange({ ...content, contentType: type.id })}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{type.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsComplianceModalOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              complianceResult.score >= 85
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                : complianceResult.score >= 60
                ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                : 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100'
            }`}
            title="查看全平台合规诊断与敏感极限词"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>合规与抗风控预审</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              complianceResult.score >= 85 ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
            }`}>
              {complianceResult.score}分
            </span>
          </button>

          <button
            onClick={handleLoadSample}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>载入精选范例</span>
          </button>
          <button
            onClick={onOpenPublish}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs rounded-xl shadow-xs transition-all active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>下一步：选择账号并发布</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Editor (Title, Markdown/Body, Summary) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-4">
            {/* Title Input */}
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
                    className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg ${
                      activeTab === 'editor' ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Markdown 正文编辑</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg ${
                      activeTab === 'preview' ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>排版预览</span>
                  </button>
                </div>
                <span className="text-[11px] font-mono text-neutral-400">
                  字数：{content.content.length}
                </span>
              </div>

              {activeTab === 'editor' ? (
                <textarea
                  rows={14}
                  value={content.content}
                  onChange={(e) => onChange({ ...content, content: e.target.value })}
                  placeholder="在此输入正文内容，支持标准 Markdown 语法、标题、列表、引用与加粗..."
                  className="w-full p-4 text-sm font-mono text-neutral-800 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:border-neutral-900 focus:outline-none transition-all leading-relaxed"
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
                      return <blockquote key={i} className="border-l-4 border-emerald-500 pl-3 italic text-neutral-600 my-2">{para.replace('> ', '')}</blockquote>;
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
                className="w-full px-4 py-2.5 text-xs text-neutral-800 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:border-neutral-900 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Platform Specific Overrides Accordion */}
          <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowOverrides(!showOverrides)}>
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <h4 className="text-sm font-bold text-neutral-900">平台独立定制与差异化覆盖 (Platform Overrides)</h4>
              </div>
              <span className="text-xs text-blue-600 font-medium">
                {showOverrides ? '收起配置' : '展开定制 (针对微博、小红书单独设标题)'}
              </span>
            </div>

            {showOverrides && (
              <div className="pt-3 border-t border-neutral-100 space-y-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {(['weibo', 'xiaohongshu', 'douyin', 'zhihu', 'toutiao'] as PlatformId[]).map((p) => {
                    const meta = PLATFORMS_META[p];
                    const isSelected = selectedOverridePlatform === p;
                    const hasCustom = !!content.overrides?.[p];
                    return (
                      <button
                        key={p}
                        onClick={() => setSelectedOverridePlatform(p)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                          isSelected
                            ? 'bg-neutral-900 text-white'
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
                      className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Media, Tags, Source Link */}
        <div className="space-y-4">
          {/* Cover & Media Assets */}
          <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-4">
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
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-rose-600 transition-colors"
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
                      className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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
                  className="p-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg"
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
                  <Video className="w-3.5 h-3.5 text-purple-600" />
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
          <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                <Tags className="w-3.5 h-3.5 text-neutral-600" />
                <span>话题与标签 (#{content.tags.length})</span>
              </h4>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {content.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-neutral-100 text-neutral-800 font-medium group"
                >
                  <span>#{tag}</span>
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="text-neutral-400 hover:text-rose-600 ml-0.5"
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
                placeholder="添加标签 (如 自媒体)..."
                className="flex-1 px-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:bg-white"
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
              />
              <button
                onClick={handleAddTag}
                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-lg"
              >
                添加
              </button>
            </div>
          </div>

          {/* Source Link */}
          <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-2">
            <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-neutral-600" />
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

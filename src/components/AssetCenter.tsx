import React, { useState } from 'react';
import {
  FolderKanban,
  Image as ImageIcon,
  Video,
  Music,
  Sparkles,
  Plus,
  Search,
  Filter,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  Download,
  SlidersHorizontal,
  Layers,
  ArrowUpRight,
  Send,
  Eye,
  X
} from 'lucide-react';

export interface Asset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio' | 'brand';
  url: string;
  thumbnailUrl?: string;
  size: string;
  dimensions?: string;
  duration?: string;
  tags: string[];
  category: string;
  createdAt: string;
  isAiGenerated?: boolean;
}

const INITIAL_ASSETS: Asset[] = [
  {
    id: 'ast-001',
    name: '极简智能工作台主视觉 KV.png',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    size: '2.4 MB',
    dimensions: '1920x1080',
    tags: ['主视觉', '数码科技', '办公场景', '极简'],
    category: '品牌视觉',
    createdAt: '2026-09-15',
    isAiGenerated: true
  },
  {
    id: 'ast-002',
    name: 'AI 知识图谱与神经元科技插画.png',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    size: '1.8 MB',
    dimensions: '1200x800',
    tags: ['AI', '知识库', '插画', '小红书首图'],
    category: '高清配图',
    createdAt: '2026-09-16',
    isAiGenerated: true
  },
  {
    id: 'ast-003',
    name: '企业品牌标准矢量 Logo 与规范.png',
    type: 'brand',
    url: 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&w=1200&q=80',
    size: '850 KB',
    dimensions: '1024x1024',
    tags: ['Logo', 'VI规范', '品牌资产'],
    category: '品牌视觉',
    createdAt: '2026-09-10',
    isAiGenerated: false
  },
  {
    id: 'ast-004',
    name: '抖音短视频 9:16 动态运镜样片.mp4',
    type: 'video',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-code-42845-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
    size: '14.2 MB',
    dimensions: '1080x1920',
    duration: '00:15',
    tags: ['短视频', '代码演示', '分镜素材', '抖音'],
    category: '视频素材',
    createdAt: '2026-09-17',
    isAiGenerated: true
  },
  {
    id: 'ast-005',
    name: '数码旗舰开箱高光特写.png',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
    size: '3.1 MB',
    dimensions: '2400x1600',
    tags: ['数码测评', '耳机', '产品特写'],
    category: '高清配图',
    createdAt: '2026-09-14',
    isAiGenerated: false
  },
  {
    id: 'ast-006',
    name: '轻快科技感背景音乐 BGM.mp3',
    type: 'audio',
    url: 'https://example.com/audio/tech-upbeat.mp3',
    size: '3.8 MB',
    duration: '01:30',
    tags: ['BGM', '节奏轻快', '短视频配乐'],
    category: '音频配乐',
    createdAt: '2026-09-12',
    isAiGenerated: false
  }
];

interface AssetCenterProps {
  onUseInEditor?: (url: string) => void;
}

export const AssetCenter: React.FC<AssetCenterProps> = ({ onUseInEditor }) => {
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [activeType, setActiveType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAiGenModalOpen, setIsAiGenModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Asset Form State
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetUrl, setNewAssetUrl] = useState('');
  const [newAssetType, setNewAssetType] = useState<'image' | 'video' | 'audio' | 'brand'>('image');
  const [newAssetTags, setNewAssetTags] = useState('');

  // AI Gen Form State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiStyle, setAiStyle] = useState('科技未来感 3D 渲染');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Extract all unique tags
  const allTags = Array.from(new Set(assets.flatMap((a) => a.tags)));

  // Filtered Assets
  const filteredAssets = assets.filter((asset) => {
    if (activeType !== 'all' && asset.type !== activeType) return false;
    if (selectedTag !== 'all' && !asset.tags.includes(selectedTag)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = asset.name.toLowerCase().includes(q);
      const matchTag = asset.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchName && !matchTag) return false;
    }
    return true;
  });

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
    if (previewAsset?.id === id) setPreviewAsset(null);
  };

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetName.trim() || !newAssetUrl.trim()) return;

    const tagsArray = newAssetTags
      .split(/[,，\s]+/)
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    const newEntry: Asset = {
      id: `ast-${Date.now().toString().slice(-4)}`,
      name: newAssetName.trim(),
      type: newAssetType,
      url: newAssetUrl.trim(),
      size: '1.2 MB',
      tags: tagsArray.length > 0 ? tagsArray : ['未分类'],
      category: newAssetType === 'brand' ? '品牌视觉' : newAssetType === 'video' ? '视频素材' : '高清配图',
      createdAt: new Date().toISOString().split('T')[0],
      isAiGenerated: false
    };

    setAssets([newEntry, ...assets]);
    setIsAddModalOpen(false);
    setNewAssetName('');
    setNewAssetUrl('');
    setNewAssetTags('');
  };

  const handleAiGenerate = () => {
    if (!aiPrompt.trim()) return;
    setIsAiGenerating(true);

    setTimeout(() => {
      const generated: Asset = {
        id: `ast-ai-${Date.now().toString().slice(-4)}`,
        name: `AI生成 - ${aiPrompt.slice(0, 14)}...png`,
        type: 'image',
        url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=1200&q=80',
        size: '3.4 MB',
        dimensions: '1024x1024',
        tags: ['AI生成', '3D渲染', '视觉KV', '即时沉淀'],
        category: '高清配图',
        createdAt: new Date().toISOString().split('T')[0],
        isAiGenerated: true
      };

      setAssets([generated, ...assets]);
      setIsAiGenerating(false);
      setIsAiGenModalOpen(false);
      setAiPrompt('');
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-[1540px] mx-auto pb-12">
      {/* 1. Top Header Banner */}
      <div
        className="p-6 sm:p-8 rounded-3xl text-white relative overflow-hidden shadow-sm"
        style={{
          background: 'linear-gradient(112deg, #0c1222 0%, #1e1b4b 50%, #4338ca 100%)'
        }}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              <span>多模态视觉与音视频知识资产库</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              品牌多媒体素材中心 (Asset Center)
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              集中管理企业 VI 视觉资产、AI 生成素材、分镜样片与配乐 BGM。一键推送到多平台创作编辑器，构建品牌一致性视觉记忆。
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAiGenModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#735af4] to-[#a855f7] hover:from-[#6549f0] hover:to-[#9333ea] text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>AI 即时生图入库</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#171c2d] hover:bg-slate-100 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>导入新素材</span>
            </button>
          </div>
        </div>

        {/* Stat badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div>
            <div className="text-[11px] text-slate-400">总沉淀素材</div>
            <div className="text-xl font-bold font-mono mt-0.5">{assets.length} 件</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">AI 算力生成</div>
            <div className="text-xl font-bold font-mono mt-0.5 text-purple-300">
              {assets.filter((a) => a.isAiGenerated).length} 件
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">存储占用</div>
            <div className="text-xl font-bold font-mono mt-0.5 text-emerald-300">
              26.8 MB <span className="text-xs text-slate-400 font-normal">/ 20 GB</span>
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">品牌视觉规范一致度</div>
            <div className="text-xl font-bold font-mono mt-0.5 text-amber-300">99.4%</div>
          </div>
        </div>
      </div>

      {/* 2. Search & Category Filters */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#e8ebf3] shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Type Tabs */}
          <div className="flex items-center gap-1.5 bg-[#f4f6fa] p-1 rounded-2xl overflow-x-auto">
            {[
              { id: 'all', label: '全部素材', count: assets.length },
              { id: 'brand', label: '品牌视觉 (VI)', count: assets.filter((a) => a.type === 'brand').length },
              { id: 'image', label: '高清配图', count: assets.filter((a) => a.type === 'image').length },
              { id: 'video', label: '视频分镜', count: assets.filter((a) => a.type === 'video').length },
              { id: 'audio', label: '音频与 BGM', count: assets.filter((a) => a.type === 'audio').length }
            ].map((tab) => {
              const isCur = activeType === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveType(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isCur
                      ? 'bg-white text-[#171c2d] shadow-xs'
                      : 'text-[#647087] hover:text-[#171c2d]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isCur ? 'bg-[#7258f5]/10 text-[#7258f5]' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="按名称、标签搜索素材..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-[#f4f6fa] border border-[#e8ebf3] rounded-xl focus:bg-white focus:border-[#7258f5] focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Tag Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 whitespace-nowrap">
            <Filter className="w-3.5 h-3.5" />
            <span>热门标签：</span>
          </span>
          <button
            onClick={() => setSelectedTag('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
              selectedTag === 'all'
                ? 'bg-[#171c2d] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            全部
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                selectedTag === tag
                  ? 'bg-[#7258f5] text-white'
                  : 'bg-purple-50 text-[#7258f5] hover:bg-purple-100'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Assets Grid */}
      {filteredAssets.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#e8ebf3]">
          <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">没有找到匹配的素材</h3>
          <p className="text-xs text-slate-400 mt-1">请尝试更换筛选条件，或点击右上角导入新素材。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredAssets.map((asset) => {
            const isVideo = asset.type === 'video';
            const isAudio = asset.type === 'audio';

            return (
              <div
                key={asset.id}
                className="bg-white rounded-2xl border border-[#e8ebf3] overflow-hidden shadow-xs hover:shadow-md hover:border-indigo-200 transition-all group flex flex-col justify-between"
              >
                {/* Media Preview Card */}
                <div className="relative aspect-video bg-slate-100 overflow-hidden flex items-center justify-center">
                  {isAudio ? (
                    <div className="flex flex-col items-center gap-2 text-indigo-600 p-4">
                      <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
                        <Music className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-mono text-slate-500">{asset.duration}</span>
                    </div>
                  ) : (
                    <img
                      src={asset.thumbnailUrl || asset.url}
                      alt={asset.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}

                  {/* AI Generated Badge */}
                  {asset.isAiGenerated && (
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-purple-900/80 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1 shadow-sm">
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>AI 生成</span>
                    </span>
                  )}

                  {/* Type Badge */}
                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-slate-900/75 backdrop-blur-md text-white text-[10px] font-mono font-medium">
                    {isVideo ? 'VIDEO' : isAudio ? 'AUDIO' : 'IMAGE'}
                  </span>

                  {/* Hover Quick Actions */}
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-xs">
                    <button
                      onClick={() => setPreviewAsset(asset)}
                      className="p-2 rounded-xl bg-white text-slate-800 hover:bg-slate-100 transition-colors shadow-sm cursor-pointer"
                      title="预览详情"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {onUseInEditor && asset.type !== 'audio' && (
                      <button
                        onClick={() => onUseInEditor(asset.url)}
                        className="px-3 py-2 rounded-xl bg-[#7258f5] hover:bg-[#6044ec] text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-1 cursor-pointer"
                        title="推送到编辑器使用"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>用于创作</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Info Content */}
                <div className="p-4 space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-[#7258f5] transition-colors" title={asset.name}>
                      {asset.name}
                    </h4>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-1">
                      <span>{asset.dimensions || asset.duration || '矢量'}</span>
                      <span>{asset.size}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {asset.tags.map((t) => (
                      <span
                        key={t}
                        className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>

                  {/* Bottom footer */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-400 font-mono">{asset.createdAt}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopy(asset.url, asset.id)}
                        className="p-1 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                        title="复制直链"
                      >
                        {copiedId === asset.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(asset.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="删除素材"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Preview Modal */}
      {previewAsset && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">{previewAsset.name}</h3>
              <button
                onClick={() => setPreviewAsset(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden bg-slate-900 max-h-[400px] flex items-center justify-center">
              {previewAsset.type === 'video' ? (
                <video src={previewAsset.url} controls className="max-h-[380px] w-auto mx-auto" />
              ) : previewAsset.type === 'audio' ? (
                <div className="p-8 text-center text-white space-y-3">
                  <Music className="w-12 h-12 mx-auto text-indigo-400" />
                  <audio src={previewAsset.url} controls className="mx-auto" />
                </div>
              ) : (
                <img
                  src={previewAsset.url}
                  alt={previewAsset.name}
                  className="max-h-[380px] object-contain mx-auto"
                />
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl text-xs font-mono">
              <div>
                <span className="text-slate-400 block text-[10px]">分类</span>
                <span className="font-bold text-slate-800">{previewAsset.category}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">尺寸/时长</span>
                <span className="font-bold text-slate-800">{previewAsset.dimensions || previewAsset.duration || '矢量'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">文件大小</span>
                <span className="font-bold text-slate-800">{previewAsset.size}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">入库日期</span>
                <span className="font-bold text-slate-800">{previewAsset.createdAt}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => handleCopy(previewAsset.url, previewAsset.id)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>复制直链</span>
              </button>
              {onUseInEditor && previewAsset.type !== 'audio' && (
                <button
                  onClick={() => {
                    onUseInEditor(previewAsset.url);
                    setPreviewAsset(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#7258f5] text-white hover:bg-[#6044ec] flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>注入创作编辑器</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Import Asset Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddAsset}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">导入新素材资产</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">素材名称</label>
                <input
                  type="text"
                  required
                  value={newAssetName}
                  onChange={(e) => setNewAssetName(e.target.value)}
                  placeholder="例如：春季新品发布会主视觉 KV.png"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#7258f5]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">素材类型</label>
                <select
                  value={newAssetType}
                  onChange={(e) => setNewAssetType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#7258f5]"
                >
                  <option value="image">高清配图 (Image)</option>
                  <option value="video">视频分镜 (Video)</option>
                  <option value="audio">音频与BGM (Audio)</option>
                  <option value="brand">品牌 VI / Logo (Brand)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">素材线上 URL 地址</label>
                <input
                  type="url"
                  required
                  value={newAssetUrl}
                  onChange={(e) => setNewAssetUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... 或 OSS 直链"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#7258f5]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">标签 (用空格或逗号分隔)</label>
                <input
                  type="text"
                  value={newAssetTags}
                  onChange={(e) => setNewAssetTags(e.target.value)}
                  placeholder="科技, 智能办公, 旗舰"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#7258f5]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#171c2d] text-white hover:bg-slate-800 cursor-pointer shadow-md"
              >
                确认导入
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 6. AI Prompt Image Generation Modal */}
      {isAiGenModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#735af4] to-[#a855f7] flex items-center justify-center text-white">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">AI 智能生图并自动沉淀入库</h3>
              </div>
              <button
                onClick={() => setIsAiGenModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">画面描述词 (Prompt)</label>
                <textarea
                  rows={3}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="例如：极简科技感未来办公空间，桌面摆放着轻薄笔记本，窗外是赛博朋克城市天际线，柔和丁达尔光线..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#7258f5]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">视觉艺术风格</label>
                <div className="grid grid-cols-3 gap-2">
                  {['科技未来感 3D 渲染', '小红书极简风摄影', '扁平商务插画'].map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setAiStyle(style)}
                      className={`p-2 rounded-xl text-center font-bold text-[11px] border transition-all cursor-pointer ${
                        aiStyle === style
                          ? 'border-[#7258f5] bg-purple-50 text-[#7258f5]'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between text-slate-600">
                <span>生成消耗积分</span>
                <span className="font-bold font-mono text-[#7258f5]">15 AI 积分 / 张</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAiGenModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleAiGenerate}
                disabled={isAiGenerating || !aiPrompt.trim()}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#735af4] to-[#a855f7] text-white hover:from-[#6549f0] hover:to-[#9333ea] cursor-pointer shadow-lg shadow-indigo-500/25 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isAiGenerating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>AI 正在渲染中...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>立即生成并入库</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

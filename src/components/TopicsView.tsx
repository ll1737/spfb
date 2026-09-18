import React, { useEffect, useMemo, useState } from 'react';
import {
  Sparkles,
  Flame,
  HelpCircle,
  Repeat,
  SlidersHorizontal,
  Plus,
  ArrowRight,
  RefreshCw,
  Zap,
  CheckCircle2,
  Calendar,
  Layers,
  X,
  Search,
  Filter,
  Trash2,
  TrendingUp,
  Award,
  ChevronDown
} from 'lucide-react';
import { api } from '../lib/api';
import { Topic, TopicOverviewStats, TopicPreference, TopicType } from '../types';

interface TopicsViewProps {
  onNavigateToEditor: (topicTitle: string) => void;
  onNavigateToContentPack?: (topic: Topic) => void;
}

export const TopicsView: React.FC<TopicsViewProps> = ({
  onNavigateToEditor,
  onNavigateToContentPack
}) => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [overview, setOverview] = useState<TopicOverviewStats | null>(null);
  const [preferences, setPreferences] = useState<TopicPreference | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('all'); // all | ai_recommended | industry_hot | user_qa | reusable_viral
  const [sortBy, setSortBy] = useState<'score' | 'heat' | 'commercial'>('score');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isPrefModalOpen, setIsPrefModalOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isWeeklyPlanModalOpen, setIsWeeklyPlanModalOpen] = useState<boolean>(false);
  const [weeklyPlan, setWeeklyPlan] = useState<Topic[]>([]);

  // Create Form
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<TopicType>('ai_recommended');
  const [newCategory, setNewCategory] = useState('');
  const [newReason, setNewReason] = useState('');
  const [newTags, setNewTags] = useState('');

  // Preference Form
  const [prefIndustry, setPrefIndustry] = useState('口腔医疗');
  const [prefKeywords, setPrefKeywords] = useState('种植牙, 牙齿矫正, 口腔健康, 价格避坑, 真实案例');
  const [prefPlatforms, setPrefPlatforms] = useState<string[]>(['weibo', 'douyin', 'kuaishou', 'zhihu', 'xiaohongshu']);
  const [prefAutoSync, setPrefAutoSync] = useState(true);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [topicList, overviewData, prefData] = await Promise.all([
        api.getTopics(),
        api.getTopicOverview().catch(() => null),
        api.getTopicPreferences().catch(() => null)
      ]);

      setTopics(Array.isArray(topicList) ? topicList : []);
      if (overviewData) {
        setOverview(overviewData);
      }
      if (prefData) {
        setPreferences(prefData);
        setPrefIndustry(prefData.industry || '口腔医疗');
        setPrefKeywords(prefData.keywords || '');
        setPrefPlatforms(prefData.platforms || ['weibo', 'douyin', 'kuaishou', 'zhihu', 'xiaohongshu']);
        setPrefAutoSync(prefData.autoSyncDaily);
      }
    } catch (e: any) {
      showToast('加载选题数据失败: ' + (e.message || '网络异常'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle live trend sync
  const handleSyncTrending = async () => {
    setIsSyncing(true);
    try {
      const res = await api.syncTrendingTopics(prefIndustry);
      showToast(`✨ ${res.message || '已成功更新最新推荐选题！'}`);
      await loadData();
    } catch (e: any) {
      showToast('推荐选题更新失败: ' + (e.message || '请检查后端网络连接'));
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle save preferences
  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await api.saveTopicPreferences({
        industry: prefIndustry.trim(),
        keywords: prefKeywords.trim(),
        platforms: prefPlatforms,
        autoSyncDaily: prefAutoSync,
        syncHour: 8
      });
      setPreferences(updated);
      setIsPrefModalOpen(false);
      showToast('✅ 选题偏好与行业分类已更新！');
      // Trigger a refresh with the new industry
      handleSyncTrending();
    } catch (e: any) {
      showToast('保存偏好失败: ' + e.message);
    }
  };

  // Handle create topic
  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const created = await api.createTopic({
        title: newTitle.trim(),
        type: newType,
        category: newCategory.trim() || '业务重点',
        reason: newReason.trim() || '人工指定高优先级业务选题',
        tags: newTags.split(/[,，]/).map((t) => t.trim()).filter(Boolean),
        score: 95,
        heatScore: 88,
        matchScore: 96,
        commercialScore: 94
      });
      setTopics((prev) => [created, ...prev]);
      setNewTitle('');
      setNewCategory('');
      setNewReason('');
      setNewTags('');
      setIsCreateModalOpen(false);
      showToast('🎉 新选题已成功加入选题池！');
    } catch (e: any) {
      showToast('创建选题失败: ' + e.message);
    }
  };

  // Handle delete topic
  const handleDeleteTopic = async (id: string, title: string) => {
    if (!window.confirm(`确定从选题池中移除选题【${title}】吗？`)) return;
    try {
      await api.deleteTopic(id);
      setTopics((prev) => prev.filter((t) => t.id !== id));
      showToast('已移除该选题');
    } catch (e: any) {
      showToast('删除失败: ' + e.message);
    }
  };

  // Handle weekly plan generation
  const handleGenerateWeeklyPlan = async () => {
    try {
      const res = await api.generateWeeklyPlan();
      setWeeklyPlan(res.plan || []);
      setIsWeeklyPlanModalOpen(true);
      showToast('🎉 已根据当前行业缺口与热度生成 7 天选题排期！');
    } catch (e: any) {
      showToast('生成排期失败: ' + e.message);
    }
  };

  // Filter & Sort Topics
  const filteredTopics = useMemo(() => {
    let list = topics;
    if (activeTab === 'ai_recommended') {
      list = list.filter((t) => !t.type || t.type === 'ai_recommended');
    } else if (activeTab === 'industry_hot') {
      list = list.filter((t) => t.type === 'industry_hot');
    } else if (activeTab === 'user_qa') {
      list = list.filter((t) => t.type === 'user_qa');
    } else if (activeTab === 'reusable_viral') {
      list = list.filter((t) => t.type === 'reusable_viral');
    }

    return [...list].sort((a, b) => {
      if (sortBy === 'heat') {
        return (b.heatScore || 0) - (a.heatScore || 0);
      }
      if (sortBy === 'commercial') {
        return (b.commercialScore || 0) - (a.commercialScore || 0);
      }
      return (b.score || 90) - (a.score || 90);
    });
  }, [topics, activeTab, sortBy]);

  // Default Stats numbers if overview not yet loaded
  const todayRecCount = overview?.todayRecommendedCount ?? 12;
  const industryHotCount = overview?.industryHotCount ?? 8;
  const userQaCount = overview?.userQaCount ?? 26;
  const reusableViralCount = overview?.reusableViralCount ?? 4;
  const currentIndustryName = preferences?.industry || overview?.currentIndustry || '口腔行业';

  return (
    <div className="space-y-6 max-w-[1540px] mx-auto pb-16 font-sans text-neutral-900 select-none">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-black uppercase tracking-wider text-indigo-600 mb-1 flex items-center gap-1.5">
            <span>CONTENTOS · AI CONTENT OPERATIONS</span>
          </div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight flex items-center gap-2">
            <span>AI选题中心</span>
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            将行业趋势、账号策略和历史内容转化为优先选题
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsPrefModalOpen(true)}
            className="px-3.5 py-2 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 text-xs font-semibold rounded-xl transition-all shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-500" />
            <span>选题偏好</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-indigo-500/20 transition-all active:scale-95 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ 手动创建选题</span>
          </button>
        </div>
      </div>

      {/* 2. Top 4 Metric & Stat Cards (Pixel-aligned with prototype) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: 今日推荐 */}
        <div
          onClick={() => setActiveTab('ai_recommended')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden bg-white ${
            activeTab === 'ai_recommended' || activeTab === 'all'
              ? 'border-violet-300 ring-2 ring-violet-500/10 shadow-xs'
              : 'border-neutral-200/80 hover:border-neutral-300'
          }`}
        >
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-gradient-to-br from-violet-100/40 to-indigo-200/30 rounded-tl-full pointer-events-none" />
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded-md bg-violet-100 text-violet-700 flex items-center justify-center text-[10px] font-bold">
              ✦
            </span>
            <span className="text-xs font-bold text-neutral-700">今日推荐</span>
          </div>
          <div className="text-3xl font-black text-neutral-900 tracking-tight leading-none mb-1.5">
            {todayRecCount < 10 ? `0${todayRecCount}` : todayRecCount}
          </div>
          <div className="text-[11px] text-neutral-400 font-medium">待你挑选</div>
        </div>

        {/* Card 2: 行业热点 */}
        <div
          onClick={() => setActiveTab('industry_hot')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden bg-white ${
            activeTab === 'industry_hot'
              ? 'border-amber-300 ring-2 ring-amber-500/10 shadow-xs'
              : 'border-neutral-200/80 hover:border-neutral-300'
          }`}
        >
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-gradient-to-br from-amber-100/50 to-orange-200/30 rounded-tl-full pointer-events-none" />
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center text-[10px]">
              🔥
            </span>
            <span className="text-xs font-bold text-neutral-700">行业热点</span>
          </div>
          <div className="text-3xl font-black text-neutral-900 tracking-tight leading-none mb-1.5">
            {industryHotCount < 10 ? `0${industryHotCount}` : industryHotCount}
          </div>
          <div className="text-[11px] text-neutral-400 font-medium truncate">
            {currentIndustryName.replace('医疗', '').replace('行业', '')}行业高相关
          </div>
        </div>

        {/* Card 3: 用户问题 */}
        <div
          onClick={() => setActiveTab('user_qa')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden bg-white ${
            activeTab === 'user_qa'
              ? 'border-emerald-300 ring-2 ring-emerald-500/10 shadow-xs'
              : 'border-neutral-200/80 hover:border-neutral-300'
          }`}
        >
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-gradient-to-br from-emerald-100/50 to-teal-200/30 rounded-tl-full pointer-events-none" />
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center text-[11px] font-bold">
              ?
            </span>
            <span className="text-xs font-bold text-neutral-700">用户问题</span>
          </div>
          <div className="text-3xl font-black text-neutral-900 tracking-tight leading-none mb-1.5">
            {userQaCount < 10 ? `0${userQaCount}` : userQaCount}
          </div>
          <div className="text-[11px] text-neutral-400 font-medium">来自评论 / FAQ</div>
        </div>

        {/* Card 4: 可复用爆款 */}
        <div
          onClick={() => setActiveTab('reusable_viral')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden bg-white ${
            activeTab === 'reusable_viral'
              ? 'border-blue-300 ring-2 ring-blue-500/10 shadow-xs'
              : 'border-neutral-200/80 hover:border-neutral-300'
          }`}
        >
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-gradient-to-br from-blue-100/50 to-sky-200/30 rounded-tl-full pointer-events-none" />
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">
              🔄
            </span>
            <span className="text-xs font-bold text-neutral-700">可复用爆款</span>
          </div>
          <div className="text-3xl font-black text-neutral-900 tracking-tight leading-none mb-1.5">
            {reusableViralCount < 10 ? `0${reusableViralCount}` : reusableViralCount}
          </div>
          <div className="text-[11px] text-neutral-400 font-medium">值得重新制作</div>
        </div>
      </div>

      {/* 3. Main Body: Two-Column Layout (Left 70% Topic List, Right 30% Strategy & Gap) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================================= */}
        {/* Left Column: Topic List (8 / 12) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-2xs space-y-4">
          {/* Tabs & Sort Header */}
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 gap-2 flex-wrap">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-neutral-900 text-white shadow-2xs'
                    : 'bg-neutral-100/80 text-neutral-600 hover:bg-neutral-200/60'
                }`}
              >
                全部
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ai_recommended')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'ai_recommended'
                    ? 'bg-neutral-900 text-white shadow-2xs'
                    : 'bg-neutral-100/80 text-neutral-600 hover:bg-neutral-200/60'
                }`}
              >
                AI 推荐
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('industry_hot')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'industry_hot'
                    ? 'bg-neutral-900 text-white shadow-2xs'
                    : 'bg-neutral-100/80 text-neutral-600 hover:bg-neutral-200/60'
                }`}
              >
                行业热点
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('user_qa')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'user_qa'
                    ? 'bg-neutral-900 text-white shadow-2xs'
                    : 'bg-neutral-100/80 text-neutral-600 hover:bg-neutral-200/60'
                }`}
              >
                用户问题
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('reusable_viral')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'reusable_viral'
                    ? 'bg-neutral-900 text-white shadow-2xs'
                    : 'bg-neutral-100/80 text-neutral-600 hover:bg-neutral-200/60'
                }`}
              >
                历史爆款
              </button>
            </div>

            {/* Sorting Dropdown */}
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-neutral-50 border border-neutral-200 text-neutral-700 text-xs rounded-lg px-2.5 py-1.5 font-medium outline-hidden cursor-pointer hover:border-neutral-300"
              >
                <option value="score">推荐指数 ↓</option>
                <option value="heat">全网热度 ↓</option>
                <option value="commercial">商业价值 ↓</option>
              </select>
            </div>
          </div>

          {/* Topic Items List */}
          {loading ? (
            <div className="p-16 text-center text-xs text-neutral-400 flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span>正在分析全网趋势与企业内容缺口...</span>
            </div>
          ) : filteredTopics.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-neutral-50/50 border border-dashed border-neutral-200 space-y-3">
              <Sparkles className="w-8 h-8 text-neutral-300 mx-auto" />
              <p className="text-xs font-semibold text-neutral-600">当前分类暂无选题</p>
              <button
                type="button"
                onClick={handleSyncTrending}
                className="px-4 py-2 bg-neutral-900 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                ✨ 智能生成推荐选题
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredTopics.map((topic, idx) => {
                const score = topic.score || 90 - idx * 2;
                const heat = topic.heatScore || 85;
                const match = topic.matchScore || 92;
                const commercial = topic.commercialScore || 90;

                return (
                  <div
                    key={topic.id || idx}
                    className="p-4 rounded-xl border border-neutral-100 hover:border-neutral-300/80 bg-white hover:bg-neutral-50/30 transition-all flex items-center justify-between gap-4 group shadow-2xs"
                  >
                    {/* Left: Score Badge & Details */}
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      {/* Score Badge (Prototype Purple Rounded Box) */}
                      <div className="w-12 h-12 rounded-xl bg-[#f0ecfc] text-[#6b46c1] font-black text-lg flex items-center justify-center shrink-0 shadow-2xs border border-[#e2d9f8]">
                        {score}
                      </div>

                      {/* Main Title & AI Reasoning */}
                      <div className="min-w-0 space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-neutral-900 leading-snug group-hover:text-indigo-600 transition-colors">
                            {topic.title}
                          </h3>
                          {topic.category && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500 font-medium">
                              {topic.category}
                            </span>
                          )}
                        </div>

                        {/* AI Reasoning Text */}
                        <p className="text-xs text-neutral-500 leading-relaxed line-clamp-2">
                          {topic.reason || '过去 30 天内容分析显示：该方向覆盖不充分，具备极高转化价值。'}
                        </p>

                        {/* Dimensional Metric Pills */}
                        <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                          <span className="text-[11px] font-medium text-neutral-500 flex items-center gap-1">
                            <span>热点</span>
                            <strong className="text-neutral-700 font-bold font-mono">{heat}</strong>
                          </span>
                          <span className="text-neutral-300">•</span>
                          <span className="text-[11px] font-medium text-neutral-500 flex items-center gap-1">
                            <span>用户匹配</span>
                            <strong className="text-neutral-700 font-bold font-mono">{match}</strong>
                          </span>
                          <span className="text-neutral-300">•</span>
                          <span className="text-[11px] font-medium text-neutral-500 flex items-center gap-1">
                            <span>商业价值</span>
                            <strong className="text-neutral-700 font-bold font-mono">{commercial}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Action Button (Prototype "生成内容包") */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (onNavigateToContentPack) {
                            onNavigateToContentPack(topic);
                          } else {
                            onNavigateToEditor(topic.title);
                          }
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold rounded-xl shadow-xs shadow-indigo-500/20 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                      >
                        生成内容包
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteTopic(topic.id, topic.title)}
                        className="p-1.5 text-neutral-300 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                        title="删除该选题"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* Right Column: AI Strategy & Content Gap (4 / 12) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 space-y-5">
          {/* Card 1: AI 选题依据 */}
          <div className="p-5 rounded-2xl bg-white border border-neutral-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                <span>AI 选题依据</span>
              </h2>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 font-mono">
                实时
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-violet-50/50 border border-violet-100/60 text-xs text-neutral-600 leading-relaxed space-y-1.5">
              <p>
                推荐会综合<strong>行业趋势、品牌匹配度、历史相似度、业务目标和平台语境</strong>，而不仅是追热度。
              </p>
            </div>
          </div>

          {/* Card 2: 本周内容缺口 */}
          <div className="p-5 rounded-2xl bg-white border border-neutral-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-neutral-900">本周内容缺口</h2>
              <span className="text-[11px] text-neutral-400">紧缺度</span>
            </div>

            {/* Gap Progress Bars (Exact prototype gradients and numbers) */}
            <div className="space-y-3.5">
              {/* Item 1: 价格 / 选择 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-700">价格 / 选择</span>
                  <span className="font-bold text-neutral-900 font-mono">92</span>
                </div>
                <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-400 to-cyan-500 rounded-full transition-all duration-500"
                    style={{ width: '92%' }}
                  />
                </div>
              </div>

              {/* Item 2: 术后护理 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-700">术后护理</span>
                  <span className="font-bold text-neutral-900 font-mono">74</span>
                </div>
                <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                    style={{ width: '74%' }}
                  />
                </div>
              </div>

              {/* Item 3: 真实案例 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-700">真实案例</span>
                  <span className="font-bold text-neutral-900 font-mono">67</span>
                </div>
                <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: '67%' }}
                  />
                </div>
              </div>

              {/* Item 4: 品牌故事 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-700">品牌故事</span>
                  <span className="font-bold text-neutral-900 font-mono">43</span>
                </div>
                <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full transition-all duration-500"
                    style={{ width: '43%' }}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Full-Width Action Button (Prototype "生成一周选题计划") */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleGenerateWeeklyPlan}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-indigo-500/25 transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>生成一周选题计划</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Modal 1: 选题偏好与行业设置 */}
      {/* ========================================================================= */}
      {isPrefModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">选题偏好与推荐设置</h3>
                  <p className="text-[11px] text-neutral-500">配置您企业所属的行业赛道与内容推荐规则</p>
                </div>
              </div>
              <button
                onClick={() => setIsPrefModalOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePreferences} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-800 block mb-1">
                  企业所属行业 / 赛道 <span className="text-rose-500">*</span>
                </label>
                <select
                  value={prefIndustry}
                  onChange={(e) => setPrefIndustry(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-hidden focus:border-neutral-900"
                >
                  <option value="口腔医疗">口腔医疗 (牙齿矫正 / 种植牙 / 美白洁牙)</option>
                  <option value="数码科技">数码科技 (AI 工具 / 手机电脑 / 生产力软件)</option>
                  <option value="美妆护肤">美妆护肤 (换季修护 / 早C晚A / 美妆测评)</option>
                  <option value="职场教育">职场教育 (职业技能 / 考研考证 / 商业认知)</option>
                  <option value="本地生活">本地生活 (餐饮探店 / 休闲娱乐 / 亲子活动)</option>
                  <option value="自媒体运营">自媒体运营 (短视频运营 / 个人IP打造)</option>
                </select>
                <span className="text-[10px] text-neutral-400 mt-1 block">
                  系统每日将根据此行业分类与热门趋势进行智能语义转化与推荐。
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-800 block mb-1">
                  重点关注关键词 / 话题标签
                </label>
                <input
                  type="text"
                  value={prefKeywords}
                  onChange={(e) => setPrefKeywords(e.target.value)}
                  placeholder="例如：种植牙, 价格避坑, 骨量不足, 数字化导板"
                  className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-hidden focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-800 block mb-1.5">
                  参考热门平台来源
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {['weibo', 'douyin', 'kuaishou', 'zhihu', 'xiaohongshu', 'baidu'].map((p) => {
                    const labelMap: Record<string, string> = {
                      weibo: '微博热搜',
                      douyin: '抖音热榜',
                      kuaishou: '快手热榜',
                      zhihu: '知乎热榜',
                      xiaohongshu: '小红书趋势',
                      baidu: '百度实时榜'
                    };
                    const isChecked = prefPlatforms.includes(p);
                    return (
                      <label
                        key={p}
                        className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
                          isChecked ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900' : 'border-neutral-200 text-neutral-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPrefPlatforms([...prefPlatforms, p]);
                            } else {
                              setPrefPlatforms(prefPlatforms.filter((x) => x !== p));
                            }
                          }}
                          className="rounded text-indigo-600"
                        />
                        <span className="font-semibold">{labelMap[p]}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 border border-neutral-200/80">
                <div>
                  <div className="text-xs font-bold text-neutral-800">每日 08:00 自动更新推荐</div>
                  <div className="text-[10px] text-neutral-400">开启后每天早上自动将最新热榜选题注入选题池</div>
                </div>
                <input
                  type="checkbox"
                  checked={prefAutoSync}
                  onChange={(e) => setPrefAutoSync(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsPrefModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  保存偏好
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Modal 2: 手动创建选题 */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">手动新增选题</h3>
                  <p className="text-[11px] text-neutral-500">将企业自定核心选题直接录入创作池</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTopic} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-800 block mb-1">
                  选题标题 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="例如：为什么种植牙价格差这么多？"
                  className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-hidden focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-800 block mb-1">
                  选题分类 / 归属模块
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-hidden focus:border-neutral-900"
                >
                  <option value="ai_recommended">AI 推荐 (今日推荐)</option>
                  <option value="industry_hot">行业热点</option>
                  <option value="user_qa">用户问题 / FAQ</option>
                  <option value="reusable_viral">可复用爆款 / 历史爆款</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-800 block mb-1">
                  推荐理由 / AI 分析依据
                </label>
                <textarea
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="例如：过去 30 天内容分析显示：对价格核心痛点覆盖不充分。"
                  rows={2}
                  className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-hidden focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-800 block mb-1">
                  标签（以逗号分隔）
                </label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="例如：种植牙, 价格避坑, 科普"
                  className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-hidden focus:border-neutral-900"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  加入选题池
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Modal 3: 一周选题排期计划 */}
      {/* ========================================================================= */}
      {isWeeklyPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">本周 7 天智能选题排期计划</h3>
                  <p className="text-[11px] text-neutral-500">根据行业缺口自动生成周度发布序列</p>
                </div>
              </div>
              <button
                onClick={() => setIsWeeklyPlanModalOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
              {weeklyPlan.map((p, i) => {
                const days = ['周一 (痛点科普)', '周二 (行业热点)', '周三 (用户答疑)', '周四 (方案对比)', '周五 (真实案例)', '周六 (爆款重构)', '周日 (品牌故事)'];
                return (
                  <div
                    key={p.id || i}
                    className="p-3.5 rounded-xl border border-neutral-200/80 bg-neutral-50/40 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="px-2 py-1 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-bold shrink-0 font-mono">
                        {days[i % 7]}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-neutral-900 truncate">{p.title}</div>
                        <div className="text-[10px] text-neutral-400 truncate">{p.reason}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsWeeklyPlanModalOpen(false);
                        onNavigateToEditor(p.title);
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg shrink-0 cursor-pointer"
                    >
                      创作此篇
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-neutral-100 bg-neutral-50/50 flex justify-end">
              <button
                type="button"
                onClick={() => setIsWeeklyPlanModalOpen(false)}
                className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                确认并关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Toast Message */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-neutral-900 text-white text-xs font-semibold rounded-2xl shadow-xl border border-neutral-700 flex items-center gap-2 animate-in slide-in-from-bottom duration-200">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};


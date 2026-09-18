import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  Heart,
  Share2,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
  CheckCircle2,
  Layers,
  Award,
  ExternalLink,
  MessageSquare,
  Bookmark,
  Clock
} from 'lucide-react';
import { PLATFORMS_META } from '../data/defaultData';
import { PlatformId } from '../types';

interface TopPost {
  id: string;
  title: string;
  platform: PlatformId;
  author: string;
  views: string;
  likes: string;
  comments: string;
  shares: string;
  ctr: string;
  publishedAt: string;
  score: number;
}

const TOP_POSTS: TopPost[] = [
  {
    id: 'post-01',
    title: '🔥【实操干货】90%新媒体人都忽略的矩阵分发秘籍（建议收藏）',
    platform: 'xiaohongshu',
    author: '林墨 (极客测评)',
    views: '342,800',
    likes: '28,400',
    comments: '1,420',
    shares: '8,900',
    ctr: '14.2%',
    publishedAt: '2026-09-15',
    score: 98
  },
  {
    id: 'post-02',
    title: '为什么每天发10条短视频，播放量却一直卡在500？',
    platform: 'douyin',
    author: '苏浅 (知识博主)',
    views: '890,200',
    likes: '64,100',
    comments: '3,890',
    shares: '14,200',
    ctr: '18.6%',
    publishedAt: '2026-09-16',
    score: 95
  },
  {
    id: 'post-03',
    title: 'ContentOS 架构揭秘：如何用本地沙箱与 RPA 替代传统低效爬虫',
    platform: 'wechat_mp',
    author: '陈卓 (行业研究员)',
    views: '45,600',
    likes: '3,200',
    comments: '310',
    shares: '1,890',
    ctr: '8.4%',
    publishedAt: '2026-09-14',
    score: 93
  },
  {
    id: 'post-04',
    title: '2026 旗舰数码工作流开箱与算力测评实录',
    platform: 'bilibili',
    author: '林墨 (极客测评)',
    views: '128,400',
    likes: '11,200',
    comments: '980',
    shares: '2,400',
    ctr: '11.8%',
    publishedAt: '2026-09-12',
    score: 90
  }
];

export const AnalyticsView: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [savedMemoryId, setSavedMemoryId] = useState<string | null>(null);

  const handleSaveToMemory = (postId: string) => {
    setSavedMemoryId(postId);
    setTimeout(() => setSavedMemoryId(null), 2500);
  };

  // Matrix platform stats
  const platformStats: {
    id: PlatformId;
    views: string;
    interactions: string;
    growth: string;
    followers: string;
    healthScore: number;
  }[] = [
    { id: 'douyin', views: '1.24M', interactions: '98.4K', growth: '+24.5%', followers: '142.8K', healthScore: 98 },
    { id: 'xiaohongshu', views: '840.5K', interactions: '62.1K', growth: '+18.2%', followers: '86.4K', healthScore: 96 },
    { id: 'wechat_mp', views: '210.8K', interactions: '14.3K', growth: '+12.0%', followers: '45.2K', healthScore: 94 },
    { id: 'bilibili', views: '320.1K', interactions: '28.9K', growth: '+15.4%', followers: '58.0K', healthScore: 92 },
    { id: 'weibo', views: '145.0K', interactions: '9.8K', growth: '+8.6%', followers: '32.1K', healthScore: 90 },
    { id: 'zhihu', views: '98.2K', interactions: '7.4K', growth: '+10.2%', followers: '19.4K', healthScore: 95 }
  ];

  return (
    <div className="space-y-6 max-w-[1540px] mx-auto pb-12">
      {/* 1. Top Header Banner */}
      <div
        className="p-6 sm:p-8 rounded-3xl text-white relative overflow-hidden shadow-sm"
        style={{
          background: 'linear-gradient(112deg, #0b1329 0%, #1e293b 50%, #0369a1 100%)'
        }}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold border border-white/15">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-300" />
              <span>全域新媒体矩阵数据回流与转化中枢</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              矩阵数据分析看板 (Matrix Analytics)
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              实时聚合 8 大平台曝光量、互动率与粉丝增长。智能洞察爆款归因并自动提炼为可复用的 Performance Memory。
            </p>
          </div>

          {/* Time Range Filter */}
          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md p-1 rounded-2xl border border-white/15">
            {(['7d', '30d', '90d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  timeRange === r
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {r === '7d' ? '近 7 天' : r === '30d' ? '近 30 天' : '近 90 天'}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Core Big Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div>
            <div className="text-[11px] text-slate-400">全网矩阵总曝光</div>
            <div className="text-2xl sm:text-3xl font-bold font-mono mt-0.5 text-white">
              2,854,600
            </div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono mt-1">
              <ArrowUpRight className="w-3 h-3" />
              <span>较上周期 +18.4%</span>
            </div>
          </div>

          <div>
            <div className="text-[11px] text-slate-400">总互动数 (赞藏评转)</div>
            <div className="text-2xl sm:text-3xl font-bold font-mono mt-0.5 text-cyan-300">
              220,900
            </div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono mt-1">
              <ArrowUpRight className="w-3 h-3" />
              <span>较上周期 +24.2%</span>
            </div>
          </div>

          <div>
            <div className="text-[11px] text-slate-400">全网矩阵粉丝总量</div>
            <div className="text-2xl sm:text-3xl font-bold font-mono mt-0.5 text-indigo-300">
              384,100
            </div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono mt-1">
              <ArrowUpRight className="w-3 h-3" />
              <span>净增 +12,480 人</span>
            </div>
          </div>

          <div>
            <div className="text-[11px] text-slate-400">平均内容健康与合规分</div>
            <div className="text-2xl sm:text-3xl font-bold font-mono mt-0.5 text-amber-300">
              95.8 分
            </div>
            <div className="flex items-center gap-1 text-[10px] text-amber-300 font-mono mt-1">
              <span>全平台 0 违规拦截</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Visual Trends & AI Insight Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Trend Visualization */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-white border border-[#e8ebf3] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-[#7258f5] flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                矩阵曝光量与互动走势 ({timeRange === '7d' ? '近7天每日分布' : '近30天趋势'})
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">单位: 万次 (Views)</span>
          </div>

          {/* SVG Trend Chart */}
          <div className="h-64 w-full pt-4 flex flex-col justify-end">
            <div className="flex-1 grid grid-cols-7 gap-3 items-end pb-4 border-b border-slate-100">
              {[
                { day: '09-12', val: 28, inter: 4.2 },
                { day: '09-13', val: 34, inter: 5.1 },
                { day: '09-14', val: 42, inter: 6.8 },
                { day: '09-15', val: 68, inter: 11.4 },
                { day: '09-16', val: 54, inter: 8.9 },
                { day: '09-17', val: 78, inter: 14.2 },
                { day: '09-18 (今)', val: 86, inter: 16.8 }
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                  <div className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.val}w
                  </div>
                  {/* Bar */}
                  <div
                    className="w-full max-w-[36px] rounded-t-xl bg-gradient-to-t from-[#735af4] to-[#38bdf8] group-hover:from-[#6549f0] group-hover:to-[#0284c7] transition-all relative"
                    style={{ height: `${(item.val / 90) * 100}%` }}
                  ></div>
                  <span className="text-[10px] text-slate-400 font-mono mt-1">{item.day}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 text-xs text-slate-500">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-gradient-to-r from-[#735af4] to-[#38bdf8]"></div>
                  <span>全网总播放 / 阅读量</span>
                </div>
              </div>
              <span className="text-emerald-600 font-bold font-mono">周环比增长 +34.2%</span>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: AI Performance Insight Radar */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-white border border-purple-100 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#7258f5] text-white flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">AI 矩阵效果智能洞察</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-white rounded-2xl border border-purple-100 shadow-2xs space-y-1">
              <div className="font-bold text-indigo-950 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>爆款渠道突破：抖音 & 小红书</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                以「痛点直击 + 测评对比」为核心的图文和 15s 短视频完播率较行业基准高出 41%。
              </p>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-purple-100 shadow-2xs space-y-1">
              <div className="font-bold text-indigo-950 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-cyan-600" />
                <span>最佳黄金发布时间窗</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                工作日中午 12:15 ~ 12:45 与晚间 20:30 ~ 21:30 算法初始冷启动权重提升 2.4 倍。
              </p>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-purple-100 shadow-2xs space-y-1">
              <div className="font-bold text-indigo-950 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span>长尾效应资产：微信公众号</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                公众号长文在发布 48 小时后持续带来 35% 的外部搜索流量与深度企业询盘。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Platform Breakdown Cards */}
      <div className="p-6 rounded-3xl bg-white border border-[#e8ebf3] shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">多平台渠道表现矩阵</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {platformStats.map((p) => {
            const meta = PLATFORMS_META[p.id];
            return (
              <div
                key={p.id}
                className="p-4 rounded-2xl border border-[#e8ebf3] bg-[#fafbfe] hover:bg-white hover:border-indigo-200 transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{meta.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-bold">
                    {p.growth}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-lg font-bold font-mono text-slate-900">{p.views}</div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>互动: {p.interactions}</span>
                    <span>粉: {p.followers}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">健康分</span>
                  <span className="font-mono font-bold text-[#7258f5]">{p.healthScore}分</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Top Performing Content Ranking */}
      <div className="p-6 rounded-3xl bg-white border border-[#e8ebf3] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900">全网爆款内容 TOP 榜单</h3>
          </div>
          <span className="text-xs text-slate-400">支持一键将爆款规律提炼写入 Performance Memory</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase font-mono">
                <th className="py-2.5 px-3">排名</th>
                <th className="py-2.5 px-3">作品标题</th>
                <th className="py-2.5 px-3">发布平台</th>
                <th className="py-2.5 px-3">创作者</th>
                <th className="py-2.5 px-3">播放/阅读</th>
                <th className="py-2.5 px-3">点赞</th>
                <th className="py-2.5 px-3">转发</th>
                <th className="py-2.5 px-3">点击率 (CTR)</th>
                <th className="py-2.5 px-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {TOP_POSTS.map((post, idx) => {
                const meta = PLATFORMS_META[post.platform];
                const isSaved = savedMemoryId === post.id;

                return (
                  <tr key={post.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      <span className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[11px] ${
                        idx === 0
                          ? 'bg-amber-100 text-amber-700 font-extrabold'
                          : idx === 1
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 max-w-xs truncate" title={post.title}>
                      {post.title}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-600">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[10px]">
                        {meta.name}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500">{post.author}</td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">{post.views}</td>
                    <td className="py-3 px-3 font-mono text-slate-600">{post.likes}</td>
                    <td className="py-3 px-3 font-mono text-slate-600">{post.shares}</td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-600">{post.ctr}</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleSaveToMemory(post.id)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ml-auto ${
                          isSaved
                            ? 'bg-emerald-500 text-white'
                            : 'bg-purple-50 text-[#7258f5] hover:bg-purple-100 border border-purple-200'
                        }`}
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>{isSaved ? '已写入记忆' : '沉淀为记忆'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

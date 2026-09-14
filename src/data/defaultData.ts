import { PlatformId, PlatformMeta, Account, ContentPayload } from '../types';

export const PLATFORMS_META: Record<PlatformId, PlatformMeta> = {
  douyin: {
    id: 'douyin',
    name: '抖音',
    nameEn: 'Douyin / TikTok CN',
    icon: 'Music2',
    color: '#000000',
    badgeBg: 'bg-neutral-900 text-white',
    supportedTypes: ['video', 'note'],
    characterLimit: 1000,
    supportsTags: true,
    supportsCover: true,
    supportsVideo: true,
    supportsMultiImage: true,
    status: 'production',
    loginType: 'qr_code',
    homeUrl: 'https://www.douyin.com',
    creatorUrl: 'https://creator.douyin.com'
  },
  kuaishou: {
    id: 'kuaishou',
    name: '快手',
    nameEn: 'Kuaishou',
    icon: 'Flame',
    color: '#FF4500',
    badgeBg: 'bg-orange-600 text-white',
    supportedTypes: ['video', 'note'],
    characterLimit: 1000,
    supportsTags: true,
    supportsCover: true,
    supportsVideo: true,
    supportsMultiImage: true,
    status: 'production',
    loginType: 'qr_code',
    homeUrl: 'https://www.kuaishou.com',
    creatorUrl: 'https://cp.kuaishou.com'
  },
  xiaohongshu: {
    id: 'xiaohongshu',
    name: '小红书',
    nameEn: 'Xiaohongshu (RED)',
    icon: 'BookOpen',
    color: '#FF2442',
    badgeBg: 'bg-red-600 text-white',
    supportedTypes: ['note', 'video'],
    characterLimit: 1000,
    supportsTags: true,
    supportsCover: true,
    supportsVideo: true,
    supportsMultiImage: true,
    status: 'production',
    loginType: 'qr_code',
    homeUrl: 'https://www.xiaohongshu.com',
    creatorUrl: 'https://creator.xiaohongshu.com'
  },
  weibo: {
    id: 'weibo',
    name: '微博',
    nameEn: 'Weibo',
    icon: 'Radio',
    color: '#E6162D',
    badgeBg: 'bg-rose-600 text-white',
    supportedTypes: ['note', 'article'],
    characterLimit: 2000,
    supportsTags: true,
    supportsCover: true,
    supportsVideo: false,
    supportsMultiImage: true,
    status: 'production',
    loginType: 'qr_code',
    homeUrl: 'https://weibo.com',
    creatorUrl: 'https://weibo.com'
  },
  toutiao: {
    id: 'toutiao',
    name: '今日头条',
    nameEn: 'Toutiao',
    icon: 'Newspaper',
    color: '#F85959',
    badgeBg: 'bg-red-500 text-white',
    supportedTypes: ['article', 'note'],
    characterLimit: 5000,
    supportsTags: true,
    supportsCover: true,
    supportsVideo: true,
    supportsMultiImage: true,
    status: 'production',
    loginType: 'qr_code',
    homeUrl: 'https://www.toutiao.com',
    creatorUrl: 'https://mp.toutiao.com'
  },
  wechat_mp: {
    id: 'wechat_mp',
    name: '微信公众号',
    nameEn: 'WeChat Official Account',
    icon: 'MessageSquare',
    color: '#07C160',
    badgeBg: 'bg-emerald-600 text-white',
    supportedTypes: ['article'],
    characterLimit: 20000,
    supportsTags: false,
    supportsCover: true,
    supportsVideo: false,
    supportsMultiImage: true,
    status: 'beta',
    loginType: 'qr_code',
    homeUrl: 'https://mp.weixin.qq.com',
    creatorUrl: 'https://mp.weixin.qq.com'
  },
  zhihu: {
    id: 'zhihu',
    name: '知乎',
    nameEn: 'Zhihu',
    icon: 'HelpCircle',
    color: '#0084FF',
    badgeBg: 'bg-blue-600 text-white',
    supportedTypes: ['article', 'note'],
    characterLimit: 15000,
    supportsTags: true,
    supportsCover: true,
    supportsVideo: false,
    supportsMultiImage: true,
    status: 'production',
    loginType: 'qr_code',
    homeUrl: 'https://www.zhihu.com',
    creatorUrl: 'https://zhuanlan.zhihu.com/write'
  },
  bilibili: {
    id: 'bilibili',
    name: '哔哩哔哩 (B站)',
    nameEn: 'Bilibili',
    icon: 'Tv',
    color: '#00AEEC',
    badgeBg: 'bg-sky-500 text-white',
    supportedTypes: ['article', 'video'],
    characterLimit: 8000,
    supportsTags: true,
    supportsCover: true,
    supportsVideo: true,
    supportsMultiImage: true,
    status: 'production',
    loginType: 'qr_code',
    homeUrl: 'https://www.bilibili.com',
    creatorUrl: 'https://member.bilibili.com'
  }
};

export const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'acc_douyin_01',
    platform: 'douyin',
    name: '科技先锋号',
    nickname: 'TechPioneer',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop',
    status: 'active',
    sessionPreview: 'storageState_enc:***9ab4 (有效期 28 天)',
    lastVerifiedAt: new Date().toISOString(),
    createdAt: '2026-08-10T12:00:00Z',
    followersCount: 42800,
    stats: { publishedCount: 86, failedCount: 2 }
  },
  {
    id: 'acc_xhs_01',
    platform: 'xiaohongshu',
    name: '极简数码日记',
    nickname: 'MinimalTech',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop',
    status: 'active',
    sessionPreview: 'cookie_enc:***41bc (有效期 15 天)',
    lastVerifiedAt: new Date().toISOString(),
    createdAt: '2026-08-15T09:30:00Z',
    followersCount: 18900,
    stats: { publishedCount: 54, failedCount: 1 }
  },
  {
    id: 'acc_weibo_01',
    platform: 'weibo',
    name: '数码观察站',
    nickname: 'DigitalObserver',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&h=120&fit=crop',
    status: 'active',
    sessionPreview: 'cookie_enc:***77fa (有效期 60 天)',
    lastVerifiedAt: new Date().toISOString(),
    createdAt: '2026-07-20T16:00:00Z',
    followersCount: 125000,
    stats: { publishedCount: 210, failedCount: 5 }
  },
  {
    id: 'acc_kuaishou_01',
    platform: 'kuaishou',
    name: '智选生活圈',
    nickname: 'SmartLifeCN',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop',
    status: 'active',
    sessionPreview: 'storageState_enc:***e231 (有效期 21 天)',
    lastVerifiedAt: new Date().toISOString(),
    createdAt: '2026-08-25T11:20:00Z',
    followersCount: 31200,
    stats: { publishedCount: 42, failedCount: 0 }
  },
  {
    id: 'acc_bili_01',
    platform: 'bilibili',
    name: '硬核探索社',
    nickname: 'HardcoreExplore',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&h=120&fit=crop',
    status: 'active',
    sessionPreview: 'cookie_enc:***88dd (有效期 45 天)',
    lastVerifiedAt: new Date().toISOString(),
    createdAt: '2026-08-01T10:00:00Z',
    followersCount: 88400,
    stats: { publishedCount: 77, failedCount: 3 }
  },
  {
    id: 'acc_toutiao_01',
    platform: 'toutiao',
    name: '每日新科技',
    nickname: 'DailyNewTech',
    avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&h=120&fit=crop',
    status: 'active',
    sessionPreview: 'storageState_enc:***55ac (有效期 19 天)',
    lastVerifiedAt: new Date().toISOString(),
    createdAt: '2026-08-18T14:45:00Z',
    followersCount: 65100,
    stats: { publishedCount: 115, failedCount: 2 }
  },
  {
    id: 'acc_zhihu_01',
    platform: 'zhihu',
    name: '深见科技札记',
    nickname: 'DeepInsights',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&h=120&fit=crop',
    status: 'active',
    sessionPreview: 'cookie_enc:***33e1 (有效期 30 天)',
    lastVerifiedAt: new Date().toISOString(),
    createdAt: '2026-07-28T08:15:00Z',
    followersCount: 49700,
    stats: { publishedCount: 63, failedCount: 1 }
  },
  {
    id: 'acc_wechat_01',
    platform: 'wechat_mp',
    name: '未来视界通讯',
    nickname: 'FutureVisionMag',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop',
    status: 'need_reauth',
    sessionPreview: 'token_enc:*** expired (需重新扫码)',
    lastVerifiedAt: new Date(Date.now() - 3600 * 48 * 1000).toISOString(),
    createdAt: '2026-06-15T09:00:00Z',
    followersCount: 52000,
    stats: { publishedCount: 38, failedCount: 4 }
  }
];

export const SAMPLE_POST: ContentPayload = {
  title: '2026年多平台内容矩阵分发全流程指南与自动化实战',
  summary: '基于 Playwright 自动化技术与多平台适配器，实现抖音、小红书、微博、知乎等一键矩阵发布，显著提升创作者分发效率。',
  contentType: 'article',
  content: `## 为什么需要多平台内容一键发布？

在当前的创作者生态中，单一平台不仅流量波动剧烈，且面临账号合规的系统性风险。因此，**跨平台内容矩阵分发**已成为自媒体工作室与企业品牌营销的刚需。

### 核心难点剖析：
1. **格式差异大**：微信公众号要求富文本/长排版，知乎侧重 Markdown 专栏，小红书要求图文卡片，抖音与快手更适配 9:16 短视频或快拍图文。
2. **账号风控严**：各平台检测自动化手段频繁，粗暴的 API 限制多且容易封号。
3. **维护成本高**：不同平台的登录态维持（Cookie/Session）、发布器 DOM 更新都需要持久化维护。

### 本系统的架构设计：
- **Adapter 模式解耦**：统一 \`publish_article\`、\`publish_note\`、\`publish_video\` 接口；
- **AES 加密会话**：Playwright storageState 本地加密存储，杜绝明文凭证泄露；
- **任务分发与重试**：支持定时发布、失败自动重试与截图留证；
- **双端支持**：既支持标准 Web 浏览器管理，也原生支持 Electron 桌面端快速启动。

> 提示：发布前请确认各平台已登录，并仔细核对各平台的字数限制与独立话题标签！`,
  coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=675&fit=crop',
  images: [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=600&fit=crop'
  ],
  videoUrl: '',
  tags: ['自媒体运营', '内容矩阵', '效率工具', '自动化发布', '科技前沿'],
  sourceUrl: 'https://github.com/Colinchiu007/Multi-Publish',
  overrides: {
    weibo: {
      title: '2026多平台一键矩阵发布实战指南',
      tags: ['数码科技', '效率神器', '互联网运营']
    },
    xiaohongshu: {
      title: '自媒体人必看！多平台一键发布神器太省时间了✨',
      tags: ['自媒体干货', '打工人摸鱼神器', '内容运营']
    }
  }
};

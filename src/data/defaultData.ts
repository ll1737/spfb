import { PlatformId, PlatformMeta, Account, ContentPayload, LLMGatewaySettings, SystemSettings } from '../types';

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
  },
  channels: {
    id: 'channels',
    name: '微信视频号',
    nameEn: 'WeChat Channels',
    icon: 'Video',
    color: '#07C160',
    badgeBg: 'bg-emerald-600 text-white',
    supportedTypes: ['video'],
    characterLimit: 2000,
    supportsTags: true,
    supportsCover: true,
    supportsVideo: true,
    supportsMultiImage: false,
    status: 'production',
    loginType: 'qr_code',
    homeUrl: 'https://channels.weixin.qq.com',
    creatorUrl: 'https://channels.weixin.qq.com/platform'
  },
  baijiahao: {
    id: 'baijiahao',
    name: '百家号',
    nameEn: 'Baidu Baijiahao',
    icon: 'Share2',
    color: '#2932E1',
    badgeBg: 'bg-indigo-600 text-white',
    supportedTypes: ['article', 'video', 'note'],
    characterLimit: 10000,
    supportsTags: true,
    supportsCover: true,
    supportsVideo: true,
    supportsMultiImage: true,
    status: 'production',
    loginType: 'qr_code',
    homeUrl: 'https://baijiahao.baidu.com',
    creatorUrl: 'https://baijiahao.baidu.com/builder/rc/home'
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    nameEn: 'TikTok Global',
    icon: 'Music',
    color: '#000000',
    badgeBg: 'bg-black text-white',
    supportedTypes: ['video', 'note'],
    characterLimit: 2200,
    supportsTags: true,
    supportsCover: true,
    supportsVideo: true,
    supportsMultiImage: true,
    status: 'beta',
    loginType: 'cookie',
    homeUrl: 'https://www.tiktok.com',
    creatorUrl: 'https://www.tiktok.com/creator-center'
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    nameEn: 'YouTube / Shorts',
    icon: 'Youtube',
    color: '#FF0000',
    badgeBg: 'bg-red-600 text-white',
    supportedTypes: ['video'],
    characterLimit: 5000,
    supportsTags: true,
    supportsCover: true,
    supportsVideo: true,
    supportsMultiImage: false,
    status: 'beta',
    loginType: 'cookie',
    homeUrl: 'https://www.youtube.com',
    creatorUrl: 'https://studio.youtube.com'
  }
};

export const DEFAULT_LLM_GATEWAY: LLMGatewaySettings = {
  defaultProvider: 'deepseek',
  temperature: 0.7,
  maxTokens: 4096,
  routing: {
    topicMining: 'deepseek-chat',
    masterContent: 'deepseek-reasoner',
    platformAdapt: 'deepseek-chat',
    videoStoryboard: 'doubao-pro-32k',
    complianceCheck: 'deepseek-chat'
  },
  providers: {
    deepseek: {
      id: 'deepseek',
      name: 'DeepSeek (深度求索)',
      enabled: true,
      apiKey: '',
      baseUrl: 'https://api.deepseek.com/v1',
      selectedModel: 'deepseek-chat',
      availableModels: [
        { id: 'deepseek-chat', name: 'DeepSeek-V3 (通用高性价比)', contextWindow: '64k', recommendedFor: '选题雷达、各平台文案派生、风控初筛', costTier: 'low' },
        { id: 'deepseek-reasoner', name: 'DeepSeek-R1 (强深度推理)', contextWindow: '64k', recommendedFor: 'Master Content 母内容构建、深度专栏', costTier: 'medium' }
      ]
    },
    doubao: {
      id: 'doubao',
      name: '火山引擎 / 豆包 (ByteDance Doubao)',
      enabled: false,
      apiKey: '',
      baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
      selectedModel: 'doubao-pro-32k',
      availableModels: [
        { id: 'doubao-pro-32k', name: 'Doubao-pro-32k (多模态与文案)', contextWindow: '32k', recommendedFor: '短视频口播脚本、分镜提示词、小红书图文', costTier: 'low' },
        { id: 'doubao-lite-32k', name: 'Doubao-lite-32k (极致低延时)', contextWindow: '32k', recommendedFor: '实时敏感词检测、高频批量派生', costTier: 'low' }
      ]
    },
    qwen: {
      id: 'qwen',
      name: '阿里通义千问 (Aliyun Qwen)',
      enabled: false,
      apiKey: '',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      selectedModel: 'qwen-max',
      availableModels: [
        { id: 'qwen-max', name: 'Qwen-Max (旗舰超长上下文)', contextWindow: '32k', recommendedFor: '企业知识库 RAG、长视频脚本分镜拆解', costTier: 'medium' },
        { id: 'qwen-plus', name: 'Qwen-Plus (高性价比均衡)', contextWindow: '128k', recommendedFor: '全网热点总结、全平台文案批量适配', costTier: 'low' }
      ]
    },
    moonshot: {
      id: 'moonshot',
      name: '月之暗面 (Kimi / Moonshot)',
      enabled: false,
      apiKey: '',
      baseUrl: 'https://api.moonshot.cn/v1',
      selectedModel: 'moonshot-v1-32k',
      availableModels: [
        { id: 'moonshot-v1-32k', name: 'Moonshot-v1-32k (长文本记忆)', contextWindow: '32k', recommendedFor: '品牌知识库大文档解析、历史内容复盘', costTier: 'medium' }
      ]
    },
    openai: {
      id: 'openai',
      name: 'OpenAI / Azure (国际通用)',
      enabled: false,
      apiKey: '',
      baseUrl: 'https://api.openai.com/v1',
      selectedModel: 'gpt-4o',
      availableModels: [
        { id: 'gpt-4o', name: 'GPT-4o (全模态旗舰)', contextWindow: '128k', recommendedFor: '跨语言国际化分发、复杂分镜视觉描述', costTier: 'high' },
        { id: 'gpt-4o-mini', name: 'GPT-4o-mini (高速轻量)', contextWindow: '128k', recommendedFor: '海量标题生成、快速格式清洗', costTier: 'low' }
      ]
    },
    ollama: {
      id: 'ollama',
      name: '本地离线模型 (Ollama / LocalAI)',
      enabled: false,
      apiKey: 'ollama-local',
      baseUrl: 'http://localhost:11434/v1',
      selectedModel: 'qwen2.5:7b',
      availableModels: [
        { id: 'qwen2.5:7b', name: 'Qwen2.5-7B (本地隐私运行)', contextWindow: '32k', recommendedFor: '企业内网无外网数据安全生产', costTier: 'low' },
        { id: 'deepseek-r1:8b', name: 'DeepSeek-R1-Distill-8B (本地推理)', contextWindow: '32k', recommendedFor: '本地免费离线母内容撰写', costTier: 'low' }
      ]
    },
    custom: {
      id: 'custom',
      name: '自定义 OpenAI 协议模型 (Custom)',
      enabled: false,
      apiKey: '',
      baseUrl: '',
      selectedModel: '',
      availableModels: [
        { id: 'custom-model', name: '自定义接入模型', contextWindow: 'Custom', recommendedFor: '私有化部署网关', costTier: 'medium' }
      ]
    }
  }
};

export const DEFAULT_SETTINGS: SystemSettings = {
  workerUrl: 'http://localhost:8000',
  workerApiKey: 'sk_matrix_worker_default_2026',
  encryptionKeySet: true,
  browserHeadless: false,
  browserPath: '',
  maxConcurrency: 3,
  autoRetryFailed: true,
  maxRetries: 3,
  saveDebugScreenshots: true,
  enableStealth: true,
  usePatchright: true,
  humanTypingDelay: true,
  socialAutoUploadPath: './social-auto-upload',
  llmGateway: DEFAULT_LLM_GATEWAY
};

export const INITIAL_ACCOUNTS: Account[] = [];

export const EMPTY_POST: ContentPayload = {
  title: '',
  summary: '',
  contentType: 'note',
  content: '',
  coverUrl: '',
  images: [],
  videoUrl: '',
  tags: [],
  sourceUrl: '',
  overrides: {}
};

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
- **全流程管控**：提供一体化 Web 控制台与自动化 Worker 节点协同。

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

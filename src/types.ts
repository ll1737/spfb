export type PlatformId =
  | 'douyin'
  | 'kuaishou'
  | 'xiaohongshu'
  | 'channels'
  | 'bilibili'
  | 'baijiahao'
  | 'weibo'
  | 'toutiao'
  | 'wechat_mp'
  | 'zhihu'
  | 'tiktok'
  | 'youtube';

export type ContentType = 'article' | 'note' | 'video';

export interface PlatformUploadOptions {
  // Video Options
  coverTimestamp?: number; // e.g. 1.5 seconds for video frame cover
  // B站专属
  bilibiliTid?: string; // 科技/生活/动画等分区
  bilibiliCopyright?: 1 | 2; // 1: 原创, 2: 转载
  bilibiliSource?: string; // 转载来源
  bilibiliNoReprint?: boolean; // 禁止转载
  // 微信视频号专属 (Tencent Channels)
  channelsOriginal?: boolean; // 原创声明
  channelsLinkTitle?: string; // 扩展链接文本
  channelsLinkUrl?: string; // 扩展链接URL
  channelsCollection?: string; // 活动或合集
  // 抖音专属
  douyinAllowSave?: boolean; // 允许下载保存
  douyinAllowDuet?: boolean; // 允许合拍
  douyinLocationPoi?: string; // 位置打卡 (POI)
  // 快手专属
  kuaishouPrivacy?: 'public' | 'friends' | 'private'; // 隐私级别
  kuaishouOriginal?: boolean; // 原创声明
  // 小红书专属
  xhsNoteType?: 'normal' | 'video'; // 笔记类型
  xhsAutoCoverText?: string; // 封面打字
  // 百度百家号专属
  baijiahaoOriginal?: boolean; // 原创声明
}

export interface PlatformMeta {
  id: PlatformId;
  name: string;
  nameEn: string;
  icon: string;
  color: string;
  badgeBg: string;
  supportedTypes: ContentType[];
  characterLimit: number;
  supportsTags: boolean;
  supportsCover: boolean;
  supportsVideo: boolean;
  supportsMultiImage: boolean;
  status: 'production' | 'beta' | 'experimental';
  loginType: 'qr_code' | 'cookie' | 'password';
  homeUrl: string;
  creatorUrl: string;
}

export interface Account {
  id: string;
  platform: PlatformId;
  name: string;
  nickname: string;
  avatarUrl: string;
  status: 'active' | 'expired' | 'need_reauth' | 'logging_in';
  group?: string; // e.g. "数码科技组", "生活消费组"
  encryptedSession?: string; // AES encrypted storageState or cookie json
  sessionPreview?: string;  // e.g. "auth_token: ***8a9f (Expires in 14 days)"
  lastVerifiedAt: string;
  createdAt: string;
  followersCount?: number;
  stats?: {
    publishedCount: number;
    failedCount: number;
  };
}

export interface MediaAsset {
  id: string;
  type: 'image' | 'video';
  name: string;
  url: string;
  thumbnailUrl?: string;
  sizeBytes?: number;
  durationSeconds?: number;
}

export interface ContentPayload {
  title: string;
  content: string; // Markdown or raw text
  summary?: string;
  contentType: ContentType;
  coverUrl?: string;
  coverTimestamp?: number; // social-auto-upload video frame timestamp (e.g. 1.5)
  images: string[];
  videoUrl?: string;
  tags: string[];
  sourceUrl?: string;
  platformOptions?: PlatformUploadOptions;
  // Platform specific overrides
  overrides?: Partial<Record<PlatformId, {
    title?: string;
    content?: string;
    tags?: string[];
    customParams?: Record<string, string | boolean | number>;
  }>>;
}

export type TaskStatus = 'queued' | 'running' | 'success' | 'failed' | 'cancelled';

export interface TaskLogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  step?: string;
}

export interface PublishTask {
  id: string;
  jobId: string;
  platform: PlatformId;
  accountId: string;
  accountNickname?: string;
  contentType: ContentType;
  status: TaskStatus;
  createdAt?: string;
  scheduledAt?: string;
  startedAt?: string;
  finishedAt?: string;
  completedAt?: string;
  attempt: number;
  maxAttempts: number;
  errorCode?: string;
  errorMessage?: string;
  resultUrl?: string;
  debugScreenshot?: string;
  debugHtmlSnapshot?: string;
  logs: TaskLogEntry[];
}

export type JobStatus = 'queued' | 'running' | 'success' | 'partial' | 'failed' | 'cancelled';

export interface PublishJob {
  id: string;
  title: string;
  contentType: ContentType;
  status: JobStatus;
  createdAt: string;
  scheduledAt?: string;
  payload: ContentPayload;
  taskIds: string[];
  tasks?: PublishTask[];
  stats: {
    total: number;
    success: number;
    failed: number;
    running: number;
    queued: number;
  };
}

export interface SystemSettings {
  workerUrl: string;
  workerApiKey: string;
  encryptionKeySet: boolean;
  browserHeadless: boolean;
  browserPath?: string;
  maxConcurrency: number;
  autoRetryFailed: boolean;
  maxRetries: number;
  saveDebugScreenshots: boolean;
  enableStealth: boolean; // stealth.min.js anti-detection
  usePatchright: boolean; // Patchright stealth engine
  humanTypingDelay: boolean; // True user simulated delay
  socialAutoUploadPath?: string; // social-auto-upload path or CLI bridge
  isDesktopMode?: boolean;
}

export interface LoginSessionResponse {
  sessionId: string;
  platform: PlatformId;
  qrCodeUrl?: string;
  status: 'waiting_scan' | 'scanned' | 'confirmed' | 'expired' | 'error';
  expiresInSeconds: number;
}

export type UserRole = 'admin' | 'creator' | 'operator' | 'editor';

export interface User {
  id: string;
  username: string;
  email: string;
  nickname: string;
  avatarUrl: string;
  role: UserRole;
  teamName?: string;
  phone?: string;
  bio?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}

export interface LoginPayload {
  account: string; // username or email
  password: string;
  rememberMe?: boolean;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  nickname: string;
  role?: UserRole;
  teamName?: string;
  phone?: string;
}

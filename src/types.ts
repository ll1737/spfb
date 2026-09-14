export type PlatformId =
  | 'douyin'
  | 'kuaishou'
  | 'xiaohongshu'
  | 'weibo'
  | 'toutiao'
  | 'wechat_mp'
  | 'zhihu'
  | 'bilibili';

export type ContentType = 'article' | 'note' | 'video';

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
  images: string[];
  videoUrl?: string;
  tags: string[];
  sourceUrl?: string;
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
  scheduledAt?: string;
  startedAt?: string;
  finishedAt?: string;
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
  isDesktopMode: boolean;
}

export interface LoginSessionResponse {
  sessionId: string;
  platform: PlatformId;
  qrCodeUrl?: string;
  status: 'waiting_scan' | 'scanned' | 'confirmed' | 'expired' | 'error';
  expiresInSeconds: number;
}

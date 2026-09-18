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

export interface CreatorPersona {
  id: string;
  orgId?: string;
  brandId?: string;
  name: string;
  avatar?: string;
  title?: string;
  domain?: string;
  toneStyle?: string;
  systemPrompt?: string;
  knowledgeBase?: string;
  targetAudience?: string;
  status?: 'active' | 'disabled';
  createdAt?: string;
  updatedAt?: string;
}

export interface MemoryCategory {
  id: string;
  orgId?: string;
  name: string;
  icon?: string;
  description?: string;
  itemCount?: number;
  updatedAt?: string;
}

export interface MemoryItem {
  id: string;
  orgId?: string;
  brandId?: string;
  categoryId: string;
  title: string;
  content: string;
  tags?: string[];
  weight?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Topic {
  id: string;
  orgId?: string;
  brandId?: string;
  title: string;
  category?: string;
  heatScore?: number;
  tags?: string[];
  angles?: string[];
  status?: 'recommended' | 'adopted' | 'archived';
  createdAt?: string;
  updatedAt?: string;
}

export interface ContentPackage {
  id: string;
  orgId?: string;
  brandId?: string;
  topicId?: string;
  title: string;
  masterContent: string;
  status?: 'draft' | 'generated' | 'scheduled' | 'published';
  createdAt?: string;
  updatedAt?: string;
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

export type LLMProviderId =
  | 'deepseek'
  | 'doubao'
  | 'qwen'
  | 'moonshot'
  | 'openai'
  | 'ollama'
  | 'custom';

export interface LLMModelInfo {
  id: string;
  name: string;
  contextWindow: string;
  recommendedFor: string;
  costTier: 'low' | 'medium' | 'high';
}

export interface LLMProviderConfig {
  id: LLMProviderId;
  name: string;
  enabled: boolean;
  apiKey: string;
  baseUrl?: string;
  selectedModel: string;
  availableModels: LLMModelInfo[];
}

export interface TaskModelRouting {
  topicMining: string;
  masterContent: string;
  platformAdapt: string;
  videoStoryboard: string;
  complianceCheck: string;
}

export interface LLMGatewaySettings {
  defaultProvider: LLMProviderId;
  providers: Record<LLMProviderId, LLMProviderConfig>;
  routing: TaskModelRouting;
  temperature: number;
  maxTokens: number;
}

export interface SystemSettings {
  workerUrl: string;
  workerApiKey: string;
  workerApiKeySet?: boolean;
  encryptionKeySet: boolean;
  browserHeadless: boolean;
  browserPath?: string;
  maxConcurrency: number;
  autoRetryFailed: boolean;
  maxRetries: number;
  saveDebugScreenshots: boolean;
  enableStealth?: boolean; // stealth.min.js anti-detection
  usePatchright?: boolean; // Patchright stealth engine
  humanTypingDelay?: boolean; // True user simulated delay
  socialAutoUploadPath?: string; // social-auto-upload path or CLI bridge
  isDesktopMode?: boolean;
  llmGateway?: LLMGatewaySettings;
}

export interface LoginSessionResponse {
  sessionId: string;
  platform: PlatformId;
  qrCodeUrl?: string;
  status: 'waiting_scan' | 'scanned' | 'confirmed' | 'expired' | 'error';
  expiresInSeconds: number;
}

export type UserRole =
  | 'owner'       // 企业所有者 / 超级管理员
  | 'admin'       // 企业管理员
  | 'asset_admin' // AI 资产 / 专家
  | 'operator'    // 内容运营官
  | 'publisher'   // 发布专员
  | 'reviewer'    // 审核员
  | 'creator'     // 创作者
  | 'viewer';     // 观察员

export interface EnterpriseInfo {
  id: string;
  name: string;
  industry: string;
  location: string;
  code: string;
  tier: string;
  status: 'active' | 'trial' | 'suspended';
  quotaGenerated: string;
  quotaStorageGB: number;
  usedStorageGB: number;
  logoText: string;
  logoBg?: string;
  inviteCode?: string;
  createdAt: string;
}

export interface Brand {
  id: string;
  orgId: string;
  name: string;
  type: 'main' | 'sub';
  accountsCount: number;
  membersCount: number;
  isCurrent: boolean;
  iconText: string;
  description?: string;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  orgId: string;
  userId?: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  roleLabel: string;
  badge: string;
  badgeColor: string;
  avatarText: string;
  avatarUrl?: string;
  isOwner?: boolean;
  assignedBrands: string[]; // Brand IDs
  joinedAt: string;
  status: 'active' | 'invited' | 'disabled';
}

export interface CollaborationRule {
  enabled: boolean;
  ruleDescription: string;
  requireAiAudit: boolean;
  requireManualAudit: boolean;
  requireRiskCheck: boolean;
  approverRole: UserRole;
  allowedPublishers: UserRole[];
}

export interface ModulePermissionRule {
  moduleId: string;
  moduleName: string;
  category: string;
  permissions: Record<UserRole, {
    canRead: boolean;
    canWrite: boolean;
    canPublish?: boolean;
    canAdmin?: boolean;
  }>;
}

export interface EnterpriseDataResponse {
  enterprise: EnterpriseInfo;
  brands: Brand[];
  members: TeamMember[];
  collaborationRule: CollaborationRule;
  currentBrand: Brand | null;
  permissionsMatrix: ModulePermissionRule[];
}

export interface User {
  id: string;
  username: string;
  email: string;
  nickname: string;
  avatarUrl: string;
  role: UserRole;
  roleLabel?: string;
  enterpriseId?: string;
  enterpriseName?: string;
  currentBrandId?: string;
  currentBrandName?: string;
  teamName?: string;
  phone?: string;
  bio?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  enterprise?: EnterpriseInfo;
  message?: string;
}

export interface LoginPayload {
  encryptionKeySet: boolean;
  browserHeadless: boolean;
  browserPath?: string;
  maxConcurrency: number;
  autoRetryFailed: boolean;
  maxRetries: number;
  saveDebugScreenshots: boolean;
  enableStealth?: boolean; // stealth.min.js anti-detection
  usePatchright?: boolean; // Patchright stealth engine
  humanTypingDelay?: boolean; // True user simulated delay
  socialAutoUploadPath?: string; // social-auto-upload path or CLI bridge
  isDesktopMode?: boolean;
  llmGateway?: LLMGatewaySettings;
}

export interface LoginSessionResponse {
  sessionId: string;
  platform: PlatformId;
  qrCodeUrl?: string;
  status: 'waiting_scan' | 'scanned' | 'confirmed' | 'expired' | 'error';
  expiresInSeconds: number;
}

export type UserRole =
  | 'owner'       // 企业所有者 / 超级管理员
  | 'admin'       // 企业管理员
  | 'asset_admin' // AI 资产 / 专家
  | 'operator'    // 内容运营官
  | 'publisher'   // 发布专员
  | 'reviewer'    // 审核员
  | 'creator'     // 创作者
  | 'viewer';     // 观察员

export interface EnterpriseInfo {
  id: string;
  name: string;
  industry: string;
  location: string;
  code: string;
  tier: string;
  status: 'active' | 'trial' | 'suspended';
  quotaGenerated: string;
  quotaStorageGB: number;
  usedStorageGB: number;
  logoText: string;
  logoBg?: string;
  inviteCode?: string;
  createdAt: string;
}

export interface Brand {
  id: string;
  orgId: string;
  name: string;
  type: 'main' | 'sub';
  accountsCount: number;
  membersCount: number;
  isCurrent: boolean;
  iconText: string;
  description?: string;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  orgId: string;
  userId?: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  roleLabel: string;
  badge: string;
  badgeColor: string;
  avatarText: string;
  avatarUrl?: string;
  isOwner?: boolean;
  assignedBrands: string[]; // Brand IDs
  joinedAt: string;
  status: 'active' | 'invited' | 'disabled';
}

export interface CollaborationRule {
  enabled: boolean;
  ruleDescription: string;
  requireAiAudit: boolean;
  requireManualAudit: boolean;
  requireRiskCheck: boolean;
  approverRole: UserRole;
  allowedPublishers: UserRole[];
}

export interface ModulePermissionRule {
  moduleId: string;
  moduleName: string;
  category: string;
  permissions: Record<UserRole, {
    canRead: boolean;
    canWrite: boolean;
    canPublish?: boolean;
    canAdmin?: boolean;
  }>;
}

export interface EnterpriseDataResponse {
  enterprise: EnterpriseInfo;
  brands: Brand[];
  members: TeamMember[];
  collaborationRule: CollaborationRule;
  currentBrand: Brand | null;
  permissionsMatrix: ModulePermissionRule[];
}

export interface User {
  id: string;
  username: string;
  email: string;
  nickname: string;
  avatarUrl: string;
  role: UserRole;
  roleLabel?: string;
  enterpriseId?: string;
  enterpriseName?: string;
  currentBrandId?: string;
  currentBrandName?: string;
  teamName?: string;
  phone?: string;
  bio?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  enterprise?: EnterpriseInfo;
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
  registerMode?: 'create_org' | 'join_org';
  enterpriseName?: string;
  enterpriseIndustry?: string;
  enterpriseLocation?: string;
  brandName?: string;
  inviteCode?: string;
  teamName?: string;
  phone?: string;
}

// ContentOS SaaS Types
export interface CalendarEvent {
  id: string;
  contentProjectId?: string;
  publishTaskId?: string;
  title: string;
  platform: string;
  accountNickname?: string;
  scheduledAt: string;
  status: 'scheduled' | 'publishing' | 'success' | 'failed';
  contentType: string;
  coverUrl?: string;
}

export interface AsyncJob {
  id: string;
  tenantId: string;
  creatorId?: string;
  contentProjectId?: string;
  type: string;
  status: 'queued' | 'running' | 'success' | 'failed' | 'cancelled';
  progress: number;
  currentStep: string;
  result?: Record<string, any>;
  errorMessage?: string;
  startedAt: string;
  finishedAt?: string;
}

export interface CreditWallet {
  tenantId: string;
  balance: number;
  frozen: number;
  updatedAt: string;
}

export interface CreditLedger {
  id: string;
  tenantId: string;
  direction: 'IN' | 'OUT' | 'FREEZE' | 'UNFREEZE' | 'REFUND';
  amount: number;
  balanceAfter: number;
  bizType: string;
  bizId?: string;
  idempotencyKey?: string;
  remark?: string;
  createdAt: string;
}

export interface Asset {
  id: string;
  tenantId: string;
  creatorId?: string;
  brandId?: string;
  assetType: 'image' | 'video' | 'audio' | 'document';
  sourceType: 'upload' | 'ai_generated' | 'platform_synced';
  name: string;
  storageKey: string;
  url: string;
  thumbnailUrl?: string;
  mimeType: string;
  width?: number;
  height?: number;
  durationSec?: number;
  sizeBytes?: number;
  aiReusable: boolean;
  commercialLicense: boolean;
  createdAt: string;
}

export interface ContentMetricSnapshot {
  id: string;
  tenantId: string;
  creatorId?: string;
  contentProjectId: string;
  platform: string;
  impressions: number;
  views: number;
  likes: number;
  comments: number;
  favorites: number;
  shares: number;
  followersGain: number;
  leads: number;
  engagementRate: number;
  collectedAt: string;
}

export interface PerformanceInsight {
  id: string;
  tenantId: string;
  creatorId: string;
  insightType: 'HOOK' | 'STRUCTURE' | 'CTA' | 'TOPIC' | 'TIMING';
  statement: string;
  evidenceJson?: string;
  sampleSize: number;
  confidence: number;
  status: 'pending' | 'approved' | 'rejected' | 'archived';
  approvedBy?: string;
  createdAt: string;
}

export interface MasterContent {
  id: string;
  contentProjectId: string;
  title: string;
  summary: string;
  hook: string;
  corePoints?: string[];
  body: string;
  cta: string;
  version: number;
  aiGenerated: boolean;
  createdAt: string;
}

export interface ContentProject {
  id: string;
  tenantId: string;
  brandId?: string;
  creatorId: string;
  title: string;
  contentType: string;
  status: string;
  currentStep: string;
  masterContent?: MasterContent;
  createdAt: string;
}

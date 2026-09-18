import {
  Account,
  PublishJob,
  PublishTask,
  SystemSettings,
  ContentPayload,
  LoginSessionResponse,
  User,
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  EnterpriseDataResponse,
  EnterpriseInfo,
  Brand,
  TeamMember,
  CollaborationRule,
  ModulePermissionRule,
  CreatorPersona,
  MemoryCategory,
  MemoryItem,
  Topic,
  ContentPackage
} from '../types';

const BASE_URL = '/api';
const TOKEN_KEY = 'matrix_publish_auth_token';
const USER_KEY = 'matrix_publish_auth_user';

export const authStorage = {
  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  setToken(token: string | null) {
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch {}
  },
  getUser(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  setUser(user: User | null) {
    try {
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_KEY);
      }
    } catch {}
  },
  clear() {
    this.setToken(null);
    this.setUser(null);
  }
};

async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = authStorage.getToken();
  const headers = new Headers(options.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(url, { ...options, headers });
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    if (res.status === 401) authStorage.clear();
    const errorText = await res.text();
    let message = `API Error (${res.status})`;
    try {
      const parsed = JSON.parse(errorText);
      message = parsed.message || message;
    } catch {
      message = errorText || message;
    }
    throw new Error(message);
  }
  return res.json();
}

export const api = {
  async getAuthStatus(): Promise<{ hasUsers: boolean; userCount: number }> {
    try {
      const res = await fetch(`${BASE_URL}/auth/status`);
      return await handleResponse<{ hasUsers: boolean; userCount: number }>(res);
    } catch {
      return { hasUsers: false, userCount: 0 };
    }
  },

  async resetData(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${BASE_URL}/system/reset-data`, {
      method: 'POST'
    });
    authStorage.clear();
    return handleResponse(res);
  },

  // Auth APIs
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await handleResponse<AuthResponse>(res);
    authStorage.setToken(data.token);
    authStorage.setUser(data.user);
    return data;
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await handleResponse<AuthResponse>(res);
    authStorage.setToken(data.token);
    authStorage.setUser(data.user);
    return data;
  },

  async getCurrentUser(): Promise<User> {
    const res = await authFetch(`${BASE_URL}/auth/me`);
    const data = await handleResponse<{ user: User }>(res);
    authStorage.setUser(data.user);
    return data.user;
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const res = await authFetch(`${BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await handleResponse<{ user: User; message: string }>(res);
    authStorage.setUser(result.user);
    return result.user;
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const res = await authFetch(`${BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPassword, newPassword })
    });
    return handleResponse(res);
  },

  async logout(): Promise<void> {
    try {
      await authFetch(`${BASE_URL}/auth/logout`, { method: 'POST' });
    } catch {}
    authStorage.clear();
  },

  async getHealth(): Promise<{ status: string; workerConnected: boolean; isDesktop: boolean; uptime: number }> {
    const res = await authFetch(`${BASE_URL}/health`);
    return handleResponse(res);
  },

  async getAccounts(): Promise<Account[]> {
    const res = await authFetch(`${BASE_URL}/accounts`);
    return handleResponse(res);
  },

  async createAccount(data: Partial<Account>): Promise<Account> {
    const res = await authFetch(`${BASE_URL}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateAccount(id: string, data: Partial<Account> & { cookieData?: string }): Promise<{ success: boolean; account: Account }> {
    const res = await authFetch(`${BASE_URL}/accounts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteAccount(id: string): Promise<{ success: boolean; message?: string }> {
    const res = await authFetch(`${BASE_URL}/accounts/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(res);
  },

  async batchDeleteAccounts(ids: string[]): Promise<{ success: boolean; deletedCount: number; remainingCount: number }> {
    const res = await authFetch(`${BASE_URL}/accounts/batch-delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids })
    });
    return handleResponse(res);
  },

  async verifyAccount(id: string): Promise<Account> {
    const res = await authFetch(`${BASE_URL}/accounts/${id}/verify`, {
      method: 'POST'
    });
    return handleResponse(res);
  },

  async startLoginSession(platform: string): Promise<LoginSessionResponse> {
    const res = await authFetch(`${BASE_URL}/accounts/login-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform })
    });
    return handleResponse(res);
  },

  async checkLoginSession(sessionId: string): Promise<LoginSessionResponse & { account?: Account }> {
    const res = await authFetch(`${BASE_URL}/accounts/login-session/${sessionId}`);
    return handleResponse(res);
  },

  async startPlatformLogin(platform: string, id: string): Promise<{ success: boolean; status: string; loginSessionId?: string; errorMessage?: string }> {
    const res = await authFetch(`${BASE_URL}/accounts/platform/${encodeURIComponent(platform)}/${encodeURIComponent(id)}/login/start`, {
      method: 'POST'
    });
    return handleResponse(res);
  },

  async getPlatformQrCode(platform: string, id: string): Promise<{ success: boolean; status: string; qrCodeUrl?: string; errorMessage?: string }> {
    const res = await authFetch(`${BASE_URL}/accounts/platform/${encodeURIComponent(platform)}/${encodeURIComponent(id)}/login/qrcode`);
    return handleResponse(res);
  },

  async getPlatformLoginStatus(platform: string, id: string): Promise<{ success: boolean; status: string; isLoggedIn?: boolean; nickname?: string; avatarUrl?: string; cookieNames?: string[]; errorMessage?: string }> {
    const res = await authFetch(`${BASE_URL}/accounts/platform/${encodeURIComponent(platform)}/${encodeURIComponent(id)}/login/status`);
    return handleResponse(res);
  },

  async getCreators(): Promise<CreatorPersona[]> {
    const res = await authFetch(`${BASE_URL}/creators`);
    return handleResponse<CreatorPersona[]>(res);
  },

  async createCreator(data: Omit<CreatorPersona, 'id'>): Promise<CreatorPersona> {
    const res = await authFetch(`${BASE_URL}/creators`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<CreatorPersona>(res);
  },

  async updateCreator(id: string, data: Partial<CreatorPersona>): Promise<CreatorPersona> {
    const res = await authFetch(`${BASE_URL}/creators/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<CreatorPersona>(res);
  },

  async deleteCreator(id: string): Promise<{ success: boolean }> {
    const res = await authFetch(`${BASE_URL}/creators/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return handleResponse<{ success: boolean }>(res);
  },

  async getMemoryCategories(): Promise<MemoryCategory[]> {
    const res = await authFetch(`${BASE_URL}/memory/categories`);
    return handleResponse<MemoryCategory[]>(res);
  },

  async createMemoryCategory(data: Pick<MemoryCategory, 'name' | 'icon' | 'description'>): Promise<MemoryCategory> {
    const res = await authFetch(`${BASE_URL}/memory/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<MemoryCategory>(res);
  },

  async deleteMemoryCategory(id: string): Promise<{ success: boolean }> {
    const res = await authFetch(`${BASE_URL}/memory/categories/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return handleResponse<{ success: boolean }>(res);
  },

  async getMemoryItems(categoryId?: string): Promise<MemoryItem[]> {
    const suffix = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : '';
    const res = await authFetch(`${BASE_URL}/memory/items${suffix}`);
    return handleResponse<MemoryItem[]>(res);
  },

  async createMemoryItem(data: Omit<MemoryItem, 'id'>): Promise<MemoryItem> {
    const res = await authFetch(`${BASE_URL}/memory/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<MemoryItem>(res);
  },

  async deleteMemoryItem(id: string): Promise<{ success: boolean }> {
    const res = await authFetch(`${BASE_URL}/memory/items/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return handleResponse<{ success: boolean }>(res);
  },

  async getTopics(status?: string): Promise<Topic[]> {
    const suffix = status ? `?status=${encodeURIComponent(status)}` : '';
    const res = await authFetch(`${BASE_URL}/topics${suffix}`);
    return handleResponse<Topic[]>(res);
  },

  async createTopic(data: Pick<Topic, 'title' | 'category' | 'tags' | 'angles'>): Promise<Topic> {
    const res = await authFetch(`${BASE_URL}/topics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<Topic>(res);
  },

  async deleteTopic(id: string): Promise<{ success: boolean }> {
    const res = await authFetch(`${BASE_URL}/topics/${encodeURIComponent(id)}`, { method: 'DELETE' });
    return handleResponse<{ success: boolean }>(res);
  },

  async getContentPackages(): Promise<ContentPackage[]> {
    const res = await authFetch(`${BASE_URL}/content-packages`);
    return handleResponse<ContentPackage[]>(res);
  },

  async createContentPackage(data: Pick<ContentPackage, 'title' | 'masterContent' | 'topicId'>): Promise<ContentPackage> {
    const res = await authFetch(`${BASE_URL}/content-packages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<ContentPackage>(res);
  },

  async deleteContentPackage(id: string): Promise<{ success: boolean }> {
    const res = await authFetch(`${BASE_URL}/content-packages/${encodeURIComponent(id)}`, { method: 'DELETE' });
    return handleResponse<{ success: boolean }>(res);
  },

  async startZhihuLogin(id: string): Promise<{ success: boolean; status: string; loginSessionId?: string; errorMessage?: string }> {
    return this.startPlatformLogin('zhihu', id);
  },

  async getZhihuQrCode(id: string): Promise<{ success: boolean; status: string; qrCodeUrl?: string; errorMessage?: string }> {
    return this.getPlatformQrCode('zhihu', id);
  },

  async getZhihuLoginStatus(id: string): Promise<{ success: boolean; status: string; isLoggedIn?: boolean; nickname?: string; avatarUrl?: string; cookieNames?: string[]; errorMessage?: string }> {
    return this.getPlatformLoginStatus('zhihu', id);
  },

  async confirmLoginSession(
    sessionId: string,
    nickname?: string,
    group?: string,
    platform?: string,
    cookieData?: any,
    isTestSimulated?: boolean
  ): Promise<LoginSessionResponse & { account?: Account; message?: string; success?: boolean }> {
    const res = await authFetch(`${BASE_URL}/accounts/login-session/${sessionId}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname, group, platform, cookieData, isTestSimulated })
    });
    return handleResponse(res);
  },

  async getJobs(): Promise<PublishJob[]> {
    const res = await authFetch(`${BASE_URL}/jobs`);
    return handleResponse(res);
  },

  async getJob(id: string): Promise<PublishJob> {
    const res = await authFetch(`${BASE_URL}/publish/${id}`);
    return handleResponse(res);
  },

  async createPublish(payload: {
    content: ContentPayload;
    accountIds: string[];
    scheduledAt?: string;
  }): Promise<PublishJob> {
    const res = await authFetch(`${BASE_URL}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  async retryJob(id: string): Promise<PublishJob> {
    const res = await authFetch(`${BASE_URL}/publish/${id}/retry`, {
      method: 'POST'
    });
    return handleResponse(res);
  },

  async cancelJob(id: string): Promise<PublishJob> {
    const res = await authFetch(`${BASE_URL}/publish/${id}/cancel`, {
      method: 'POST'
    });
    return handleResponse(res);
  },

  async getTasks(status?: string): Promise<PublishTask[]> {
    const url = status ? `${BASE_URL}/tasks?status=${status}` : `${BASE_URL}/tasks`;
    const res = await authFetch(url);
    return handleResponse(res);
  },

  async retryTask(taskId: string): Promise<PublishTask> {
    const res = await authFetch(`${BASE_URL}/tasks/${taskId}/retry`, {
      method: 'POST'
    });
    return handleResponse(res);
  },

  async cancelTask(taskId: string): Promise<PublishTask> {
    const res = await authFetch(`${BASE_URL}/tasks/${taskId}/cancel`, {
      method: 'POST'
    });
    return handleResponse(res);
  },

  async getSettings(): Promise<SystemSettings> {
    const res = await authFetch(`${BASE_URL}/settings`);
    return handleResponse(res);
  },

  async updateSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    const res = await authFetch(`${BASE_URL}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    return handleResponse(res);
  },

  async testWorker(url?: string): Promise<{ success: boolean; message: string; latencyMs: number }> {
    const res = await authFetch(`${BASE_URL}/worker/ping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    return handleResponse(res);
  },

  // dreammis/social-auto-upload integration
  async generateCliCommand(params: {
    platform: string;
    accountName?: string;
    title?: string;
    content?: string;
    videoPath?: string;
    coverTimestamp?: number;
    tags?: string[];
    scheduleTime?: string;
    customOptions?: Record<string, any>;
  }): Promise<{ platform: string; command: string; dockerCommand: string; explanation: string }> {
    const res = await authFetch(`${BASE_URL}/social-upload/cli-command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return handleResponse(res);
  },

  async importSocialCookie(params: {
    fileName?: string;
    content: string | object;
    customPlatform?: string;
    customNickname?: string;
    group?: string;
  }): Promise<{ success: boolean; message: string; account: Account }> {
    const res = await authFetch(`${BASE_URL}/social-upload/import-cookie`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return handleResponse(res);
  },

  getExportSocialCookieUrl(accountId: string): string {
    return `${BASE_URL}/social-upload/export-cookie/${accountId}`;
  },

  async exportSocialCookie(accountId: string, filename: string): Promise<void> {
    const res = await authFetch(this.getExportSocialCookieUrl(accountId));
    if (!res.ok) await handleResponse(res);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  },

  getWorkerScriptDownloadUrl(): string {
    return `${BASE_URL}/social-upload/worker-script`;
  },

  // Enterprise & Team APIs
  async getEnterprise(): Promise<EnterpriseDataResponse> {
    const res = await authFetch(`${BASE_URL}/enterprise`);
    return handleResponse<EnterpriseDataResponse>(res);
  },

  async updateEnterprise(data: Partial<EnterpriseInfo>): Promise<{ enterprise: EnterpriseInfo; message: string }> {
    const res = await authFetch(`${BASE_URL}/enterprise`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async createBrand(data: { name: string; type?: 'main' | 'sub'; description?: string; iconText?: string }): Promise<{ brand: Brand; brands: Brand[]; message: string }> {
    const res = await authFetch(`${BASE_URL}/enterprise/brands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async switchBrand(brandId: string): Promise<{ currentBrand: Brand; brands: Brand[]; message: string }> {
    const res = await authFetch(`${BASE_URL}/enterprise/brands/switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandId })
    });
    return handleResponse(res);
  },

  async deleteBrand(brandId: string): Promise<{ brands: Brand[]; currentBrand: Brand; message: string }> {
    const res = await authFetch(`${BASE_URL}/enterprise/brands/${brandId}`, {
      method: 'DELETE'
    });
    return handleResponse(res);
  },

  async inviteMember(data: { name: string; email: string; role: string; assignedBrands?: string[] }): Promise<{ member: TeamMember; members: TeamMember[]; message: string }> {
    const res = await authFetch(`${BASE_URL}/enterprise/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateMember(memberId: string, data: Partial<TeamMember>): Promise<{ member: TeamMember; members: TeamMember[]; message: string }> {
    const res = await authFetch(`${BASE_URL}/enterprise/members/${memberId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async removeMember(memberId: string): Promise<{ members: TeamMember[]; message: string }> {
    const res = await authFetch(`${BASE_URL}/enterprise/members/${memberId}`, {
      method: 'DELETE'
    });
    return handleResponse(res);
  },

  async updateCollaborationRule(rule: Partial<CollaborationRule>): Promise<{ collaborationRule: CollaborationRule; message: string }> {
    const res = await authFetch(`${BASE_URL}/enterprise/rules`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rule)
    });
    return handleResponse(res);
  },

  async getPermissionsMatrix(): Promise<{ permissionsMatrix: ModulePermissionRule[] }> {
    const res = await authFetch(`${BASE_URL}/enterprise/permissions`);
    return handleResponse(res);
  },

  async updatePermissionsMatrix(matrix: ModulePermissionRule[]): Promise<{ permissionsMatrix: ModulePermissionRule[]; message: string }> {
    const res = await authFetch(`${BASE_URL}/enterprise/permissions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matrix })
    });
    return handleResponse(res);
  },

  // --- ContentOS SaaS New APIs ---

  // Content Calendar
  async getCalendarEvents(params?: { creatorId?: string; platform?: string; start?: string; end?: string }): Promise<{ code: number; data: any[] }> {
    const query = new URLSearchParams(params as any).toString();
    const res = await authFetch(`${BASE_URL}/calendar?${query}`);
    return handleResponse(res);
  },

  async rescheduleCalendarTask(taskId: string, scheduledAt: string): Promise<{ code: number; message: string }> {
    const res = await authFetch(`${BASE_URL}/calendar/tasks/${taskId}/reschedule`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduledAt })
    });
    return handleResponse(res);
  },

  // Async Jobs
  async getAsyncJob(jobId: string): Promise<{ code: number; data: any }> {
    const res = await authFetch(`${BASE_URL}/async-jobs/${jobId}`);
    return handleResponse(res);
  },

  async listAsyncJobs(creatorId?: string): Promise<{ code: number; data: any[] }> {
    const query = creatorId ? `?creatorId=${encodeURIComponent(creatorId)}` : '';
    const res = await authFetch(`${BASE_URL}/async-jobs${query}`);
    return handleResponse(res);
  },

  // AI Credits & Wallet
  async getCreditWallet(): Promise<{ code: number; data: any }> {
    const res = await authFetch(`${BASE_URL}/credits/wallet`);
    return handleResponse(res);
  },

  async listCreditLedgers(): Promise<{ code: number; data: any[] }> {
    const res = await authFetch(`${BASE_URL}/credits/ledgers`);
    return handleResponse(res);
  },

  // DAM Digital Assets
  async listAssets(params?: { creatorId?: string; type?: string; limit?: number; offset?: number }): Promise<{ code: number; data: { total: number; items: any[] } }> {
    const query = new URLSearchParams(params as any).toString();
    const res = await authFetch(`${BASE_URL}/assets?${query}`);
    return handleResponse(res);
  },

  async createAsset(assetData: any): Promise<{ code: number; data: any }> {
    const res = await authFetch(`${BASE_URL}/assets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assetData)
    });
    return handleResponse(res);
  },

  // Content Project AI Workflow
  async generateMasterContent(payload: { creatorId: string; topicTitle: string; angle?: string; contentType?: string }): Promise<{ code: number; data: { projectId: string; masterContent: any } }> {
    const res = await authFetch(`${BASE_URL}/content-projects/generate-master`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  // AI Learning & Insights
  async getPerformanceInsights(creatorId: string): Promise<{ code: number; data: any[] }> {
    const res = await authFetch(`${BASE_URL}/learning/creators/${creatorId}/insights`);
    return handleResponse(res);
  },

  async approvePerformanceInsight(insightId: string): Promise<{ code: number; data: any }> {
    const res = await authFetch(`${BASE_URL}/learning/insights/${insightId}/approve`, {
      method: 'POST'
    });
    return handleResponse(res);
  }
};


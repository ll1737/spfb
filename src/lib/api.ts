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
  RegisterPayload
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

  async deleteAccount(id: string): Promise<{ success: boolean }> {
    const res = await authFetch(`${BASE_URL}/accounts/${id}`, {
      method: 'DELETE'
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

  async confirmLoginSession(sessionId: string, nickname?: string, group?: string): Promise<LoginSessionResponse & { account?: Account }> {
    const res = await authFetch(`${BASE_URL}/accounts/login-session/${sessionId}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname, group })
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
  }
};


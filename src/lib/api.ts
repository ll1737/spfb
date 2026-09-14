import { Account, PublishJob, PublishTask, SystemSettings, ContentPayload, LoginSessionResponse } from '../types';

const BASE_URL = '/api';

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
  async getHealth(): Promise<{ status: string; workerConnected: boolean; isDesktop: boolean; uptime: number }> {
    const res = await fetch(`${BASE_URL}/health`);
    return handleResponse(res);
  },

  async getAccounts(): Promise<Account[]> {
    const res = await fetch(`${BASE_URL}/accounts`);
    return handleResponse(res);
  },

  async createAccount(data: Partial<Account>): Promise<Account> {
    const res = await fetch(`${BASE_URL}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteAccount(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${BASE_URL}/accounts/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(res);
  },

  async verifyAccount(id: string): Promise<Account> {
    const res = await fetch(`${BASE_URL}/accounts/${id}/verify`, {
      method: 'POST'
    });
    return handleResponse(res);
  },

  async startLoginSession(platform: string): Promise<LoginSessionResponse> {
    const res = await fetch(`${BASE_URL}/accounts/login-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform })
    });
    return handleResponse(res);
  },

  async checkLoginSession(sessionId: string): Promise<LoginSessionResponse & { account?: Account }> {
    const res = await fetch(`${BASE_URL}/accounts/login-session/${sessionId}`);
    return handleResponse(res);
  },

  async getJobs(): Promise<PublishJob[]> {
    const res = await fetch(`${BASE_URL}/jobs`);
    return handleResponse(res);
  },

  async getJob(id: string): Promise<PublishJob> {
    const res = await fetch(`${BASE_URL}/publish/${id}`);
    return handleResponse(res);
  },

  async createPublish(payload: {
    content: ContentPayload;
    accountIds: string[];
    scheduledAt?: string;
  }): Promise<PublishJob> {
    const res = await fetch(`${BASE_URL}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  async retryJob(id: string): Promise<PublishJob> {
    const res = await fetch(`${BASE_URL}/publish/${id}/retry`, {
      method: 'POST'
    });
    return handleResponse(res);
  },

  async cancelJob(id: string): Promise<PublishJob> {
    const res = await fetch(`${BASE_URL}/publish/${id}/cancel`, {
      method: 'POST'
    });
    return handleResponse(res);
  },

  async getTasks(status?: string): Promise<PublishTask[]> {
    const url = status ? `${BASE_URL}/tasks?status=${status}` : `${BASE_URL}/tasks`;
    const res = await fetch(url);
    return handleResponse(res);
  },

  async retryTask(taskId: string): Promise<PublishTask> {
    const res = await fetch(`${BASE_URL}/tasks/${taskId}/retry`, {
      method: 'POST'
    });
    return handleResponse(res);
  },

  async cancelTask(taskId: string): Promise<PublishTask> {
    const res = await fetch(`${BASE_URL}/tasks/${taskId}/cancel`, {
      method: 'POST'
    });
    return handleResponse(res);
  },

  async getSettings(): Promise<SystemSettings> {
    const res = await fetch(`${BASE_URL}/settings`);
    return handleResponse(res);
  },

  async updateSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    const res = await fetch(`${BASE_URL}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    return handleResponse(res);
  },

  async testWorker(url?: string): Promise<{ success: boolean; message: string; latencyMs: number }> {
    const res = await fetch(`${BASE_URL}/worker/ping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    return handleResponse(res);
  }
};

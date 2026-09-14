import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ContentEditor } from './components/ContentEditor';
import { PublishModal } from './components/PublishModal';
import { AccountManager } from './components/AccountManager';
import { TaskCenter } from './components/TaskCenter';
import { SettingsView } from './components/SettingsView';
import { AuthPage } from './components/AuthPage';
import { UserProfileModal } from './components/UserProfileModal';

import { Account, PublishJob, PublishTask, SystemSettings, ContentPayload, User } from './types';
import { INITIAL_ACCOUNTS, EMPTY_POST } from './data/defaultData';
import { api, authStorage } from './lib/api';
import { Layers } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(authStorage.getUser());
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [jobs, setJobs] = useState<PublishJob[]>([]);
  const [tasks, setTasks] = useState<PublishTask[]>([]);
  const [content, setContent] = useState<ContentPayload>(EMPTY_POST);
  const [settings, setSettings] = useState<SystemSettings>({
    workerUrl: 'http://127.0.0.1:8000',
    workerApiKey: 'secret_worker_token_2026',
    encryptionKeySet: true,
    browserHeadless: true,
    maxConcurrency: 3,
    autoRetryFailed: true,
    maxRetries: 2,
    saveDebugScreenshots: true
  });
  const [workerConnected, setWorkerConnected] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Show Toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Check initial user authentication
  useEffect(() => {
    const initAuth = async () => {
      const token = authStorage.getToken();
      if (!token) {
        setIsAuthLoading(false);
        return;
      }
      try {
        const user = await api.getCurrentUser();
        setCurrentUser(user);
      } catch (err) {
        console.warn('Authentication token expired or server reset', err);
        authStorage.clear();
        setCurrentUser(null);
      } finally {
        setIsAuthLoading(false);
      }
    };

    initAuth();
  }, []);

  // Fetch initial data from server
  const loadData = async () => {
    if (!authStorage.getToken()) return;
    setIsRefreshing(true);
    try {
      const [health, accs, jbs, tsks, stt] = await Promise.allSettled([
        api.getHealth(),
        api.getAccounts(),
        api.getJobs(),
        api.getTasks(),
        api.getSettings()
      ]);

      if (health.status === 'fulfilled') {
        setWorkerConnected(health.value.workerConnected);
      }
      if (accs.status === 'fulfilled') {
        setAccounts(accs.value);
      }
      if (jbs.status === 'fulfilled') {
        setJobs(jbs.value);
      }
      if (tsks.status === 'fulfilled') {
        setTasks(tsks.value);
      }
      if (stt.status === 'fulfilled') {
        setSettings(stt.value);
      }
    } catch (e) {
      console.warn('Backend load error, using local fallback state', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadData();

      // Periodic poll for running tasks
      const interval = setInterval(() => {
        api.getTasks().then((t) => setTasks(t)).catch(() => {});
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [currentUser]);

  // Handle Logout
  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {}
    setCurrentUser(null);
    showToast('已安全退出登录');
  };


  // Submit Publish Job
  const handlePublishSubmit = async (params: {
    content: ContentPayload;
    accountIds: string[];
    scheduledAt?: string;
  }) => {
    try {
      const newJob = await api.createPublish(params);
      showToast('🎉 发布任务已创建，RPA 自动化分发正在多线程执行！');
      // Update local state
      setJobs((prev) => [newJob, ...prev]);
      if (newJob.tasks) {
        setTasks((prev) => [...(newJob.tasks || []), ...prev]);
      }
      setActiveTab('tasks');
    } catch (err: any) {
      showToast(`❌ 提交失败: ${err.message}`);
      throw err;
    }
  };

  // Account operations
  const handleAccountAdded = (acc: Account) => {
    setAccounts((prev) => [acc, ...prev]);
    showToast(`✅ 已接入新账号【${acc.nickname}】`);
  };

  const handleAccountDeleted = (id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    showToast('已移除账号及凭证');
  };

  const handleAccountUpdated = (updated: Account) => {
    setAccounts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    showToast(`✅ 账号【${updated.nickname}】资料已更新`);
  };

  const handleUpdateSettings = async (updated: Partial<SystemSettings>) => {
    const res = await api.updateSettings(updated);
    setSettings(res);
    showToast('系统设置已更新');
  };

  const activeAccountsCount = accounts.filter((a) => a.status === 'active').length;
  const pendingTasksCount = tasks.filter((t) => t.status === 'running' || t.status === 'queued').length;

  // 1. Initial Authentication Loading Screen
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-4 shadow-xl">
          <Layers className="w-6 h-6 text-emerald-400 animate-pulse" />
        </div>
        <div className="text-sm font-semibold tracking-wide text-neutral-200">
          多平台发布矩阵系统
        </div>
        <div className="text-xs text-neutral-500 mt-1 flex items-center gap-2">
          <div className="w-3.5 h-3.5 border-2 border-neutral-600 border-t-emerald-400 rounded-full animate-spin" />
          <span>正在校验证书与登录令牌...</span>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated: Render AuthPage (Login / Register)
  if (!currentUser) {
    return (
      <>
        <AuthPage
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            showToast(`欢迎进入工作台，${user.nickname}！`);
          }}
        />
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-neutral-900 text-white text-xs font-semibold rounded-2xl shadow-xl border border-neutral-700 flex items-center gap-2 animate-in slide-in-from-bottom duration-200">
            <span>{toastMessage}</span>
          </div>
        )}
      </>
    );
  }

  // 3. Authenticated: Render Main Application
  return (
    <div className="flex h-screen bg-neutral-100/60 font-sans text-neutral-900 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        activeAccountsCount={activeAccountsCount}
        totalAccountsCount={accounts.length}
        pendingTasksCount={pendingTasksCount}
        currentUser={currentUser}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <Header
          workerConnected={workerConnected}
          activeTab={activeTab}
          onOpenPublish={() => setIsPublishModalOpen(true)}
          currentUser={currentUser}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onLogout={handleLogout}
        />

        {/* Dynamic Body */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === 'dashboard' && (
            <Dashboard
              accounts={accounts}
              jobs={jobs}
              tasks={tasks}
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenPublish={() => setIsPublishModalOpen(true)}
              onRefresh={loadData}
              isRefreshing={isRefreshing}
              workerConnected={workerConnected}
            />
          )}

          {activeTab === 'editor' && (
            <ContentEditor
              content={content}
              onChange={setContent}
              onOpenPublish={() => setIsPublishModalOpen(true)}
            />
          )}

          {activeTab === 'tasks' && (
            <TaskCenter
              tasks={tasks}
              onRefresh={loadData}
            />
          )}

          {activeTab === 'accounts' && (
            <AccountManager
              accounts={accounts}
              onRefresh={loadData}
              onAccountAdded={handleAccountAdded}
              onAccountDeleted={handleAccountDeleted}
              onAccountUpdated={handleAccountUpdated}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              workerConnected={workerConnected}
            />
          )}
        </main>
      </div>

      {/* Global Publish Modal */}
      <PublishModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        accounts={accounts}
        content={content}
        onSubmit={handlePublishSubmit}
        onNavigateToAccounts={() => setActiveTab('accounts')}
      />

      {/* User Profile & Security Modal */}
      {currentUser && (
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={currentUser}
          onUserUpdated={(updated) => {
            setCurrentUser(updated);
            authStorage.setUser(updated);
            showToast('个人信息已同步');
          }}
          onLogout={handleLogout}
        />
      )}

      {/* Global Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-neutral-900 text-white text-xs font-semibold rounded-2xl shadow-xl border border-neutral-700 flex items-center gap-2 animate-in slide-in-from-bottom duration-200">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}


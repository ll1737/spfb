import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ContentEditor } from './components/ContentEditor';
import { PublishModal } from './components/PublishModal';
import { AccountManager } from './components/AccountManager';
import { TaskCenter } from './components/TaskCenter';
import { SettingsView } from './components/SettingsView';
import { ElectronBridge } from './components/ElectronBridge';

import { Account, PublishJob, PublishTask, SystemSettings, ContentPayload } from './types';
import { INITIAL_ACCOUNTS, SAMPLE_POST } from './data/defaultData';
import { api } from './lib/api';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [jobs, setJobs] = useState<PublishJob[]>([]);
  const [tasks, setTasks] = useState<PublishTask[]>([]);
  const [content, setContent] = useState<ContentPayload>(SAMPLE_POST);
  const [settings, setSettings] = useState<SystemSettings>({
    workerUrl: 'http://127.0.0.1:8000',
    workerApiKey: 'secret_worker_token_2026',
    encryptionKeySet: true,
    browserHeadless: true,
    maxConcurrency: 3,
    autoRetryFailed: true,
    maxRetries: 2,
    saveDebugScreenshots: true,
    isDesktopMode: false
  });
  const [workerConnected, setWorkerConnected] = useState<boolean>(true);
  const [isDesktopMode, setIsDesktopMode] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Show Toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Detect Electron environment
  useEffect(() => {
    const isElectron = !!(
      (window && (window as any).process && (window as any).process.type) ||
      (navigator.userAgent && navigator.userAgent.toLowerCase().includes('electron')) ||
      (window as any).electronAPI
    );
    setIsDesktopMode(isElectron);
  }, []);

  // Fetch initial data from server
  const loadData = async () => {
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
      if (accs.status === 'fulfilled' && accs.value.length > 0) {
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
    loadData();

    // Periodic poll for running tasks
    const interval = setInterval(() => {
      api.getTasks().then((t) => setTasks(t)).catch(() => {});
    }, 4000);

    return () => clearInterval(interval);
  }, []);

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

  const handleUpdateSettings = async (updated: Partial<SystemSettings>) => {
    const res = await api.updateSettings(updated);
    setSettings(res);
    showToast('系统设置已更新');
  };

  const activeAccountsCount = accounts.filter((a) => a.status === 'active').length;
  const pendingTasksCount = tasks.filter((t) => t.status === 'running' || t.status === 'queued').length;

  return (
    <div className="flex h-screen bg-neutral-100/60 font-sans text-neutral-900 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        activeAccountsCount={activeAccountsCount}
        totalAccountsCount={accounts.length}
        pendingTasksCount={pendingTasksCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <Header
          workerConnected={workerConnected}
          isDesktopMode={isDesktopMode}
          activeTab={activeTab}
          onOpenPublish={() => setIsPublishModalOpen(true)}
          onOpenDesktopGuide={() => setActiveTab('electron')}
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
            />
          )}

          {activeTab === 'electron' && (
            <ElectronBridge
              isDesktopMode={isDesktopMode}
              workerConnected={workerConnected}
              settings={settings}
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
      />

      {/* Global Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-neutral-900 text-white text-xs font-semibold rounded-2xl shadow-xl border border-neutral-700 flex items-center gap-2 animate-in slide-in-from-bottom duration-200">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

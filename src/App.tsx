import React, { useState, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ContentEditor } from './components/ContentEditor';
import { PublishModal } from './components/PublishModal';
import { AccountManager } from './components/AccountManager';
import { TaskCenter } from './components/TaskCenter';
import { SettingsView } from './components/SettingsView';
import { AuthPage } from './components/AuthPage';
import { CalendarView } from './components/CalendarView';
import { CreatorsView } from './components/CreatorsView';
import { TopicsView } from './components/TopicsView';
import { AssetCenter } from './components/AssetCenter';
import { MemoryCenter } from './components/MemoryCenter';
import { PlansView } from './components/PlansView';
import { AnalyticsView } from './components/AnalyticsView';
import { EnterpriseView } from './components/EnterpriseView';
import { UserProfileModal } from './components/UserProfileModal';
import { CreatorWorkspaceView } from './components/CreatorWorkspaceView';
import { PrototypeModulePage } from './components/PrototypeModulePage';
import { ContentCenterView } from './components/ContentCenterView';
import { SmartContentPackView } from './components/SmartContentPackView';
import { KnowledgeBaseView } from './components/KnowledgeBaseView';
import { BookOpen, GraduationCap, Image as ImageIcon, Layers, ListTree, Sparkles as SparklesIcon, Video } from 'lucide-react';

import { Account, PublishJob, PublishTask, SystemSettings, ContentPayload, User } from './types';
import { EMPTY_POST } from './data/defaultData';
import { api, authStorage } from './lib/api';
import { AppRouteId, getRouteById, getRouteIdFromPath } from './appRoutes';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(authStorage.getUser());
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  const activeTab: AppRouteId | 'settings' = location.pathname === '/settings' ? 'settings' : getRouteIdFromPath(location.pathname);

  const setActiveTab = (tab: string) => {
    const aliases: Record<string, AppRouteId | 'settings'> = {
      dashboard: 'workspace',
      editor: 'studio',
      content_packages: 'content-pack',
      tasks: 'publish',
      plans: 'billing'
    };
    const routeId = aliases[tab] ?? tab;
    if (routeId === 'settings') {
      navigate('/settings');
      return;
    }
    if (routeId === 'creator-workspace') {
      navigate('/creators');
      return;
    }
    const route = getRouteById(routeId);
    navigate(route?.path ?? '/dashboard');
  };
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [jobs, setJobs] = useState<PublishJob[]>([]);
  const [tasks, setTasks] = useState<PublishTask[]>([]);
  const [content, setContent] = useState<ContentPayload>(EMPTY_POST);
  const [settings, setSettings] = useState<SystemSettings>({
    workerUrl: 'http://127.0.0.1:8000',
    workerApiKey: '',
    encryptionKeySet: true,
    browserHeadless: true,
    maxConcurrency: 3,
    autoRetryFailed: true,
    maxRetries: 2,
    saveDebugScreenshots: true
  });
  const [workerConnected, setWorkerConnected] = useState<boolean>(false);
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

      if (health.status === 'fulfilled' && health.value) {
        setWorkerConnected(Boolean(health.value.workerConnected));
      }
      if (accs.status === 'fulfilled') {
        setAccounts(Array.isArray(accs.value) ? accs.value : []);
      }
      if (jbs.status === 'fulfilled') {
        setJobs(Array.isArray(jbs.value) ? jbs.value : []);
      }
      if (tsks.status === 'fulfilled') {
        setTasks(Array.isArray(tsks.value) ? tsks.value : []);
      }
      if (stt.status === 'fulfilled' && stt.value) {
        setSettings(stt.value);
      }
    } catch (e) {
      console.warn('Backend load error; displaying only server-backed data', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadData();

      // Periodic poll for running tasks
      const interval = setInterval(() => {
        api.getTasks().then((t) => setTasks(Array.isArray(t) ? t : [])).catch(() => {});
      }, 4000);

      return () => clearInterval(interval);
    } else {
      setAccounts([]);
      setJobs([]);
      setTasks([]);
    }
  }, [currentUser]);

  // Handle Logout
  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {}
    setCurrentUser(null);
    setAccounts([]);
    setJobs([]);
    setTasks([]);
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
      setJobs((prev) => [newJob, ...(prev || [])]);
      if (newJob.tasks) {
        setTasks((prev) => [...(newJob.tasks || []), ...(prev || [])]);
      }
      setActiveTab('tasks');
    } catch (err: any) {
      showToast(`❌ 提交失败: ${err.message}`);
      throw err;
    }
  };

  // Account operations
  const handleAccountAdded = (acc: Account) => {
    setAccounts((prev) => [acc, ...(prev || [])]);
    showToast(`✅ 已接入新账号【${acc.nickname}】`);
  };

  const handleAccountDeleted = (id: string) => {
    setAccounts((prev) => (prev || []).filter((a) => a.id !== id));
    showToast('已移除账号及凭证');
  };

  const handleAccountUpdated = (updated: Account) => {
    setAccounts((prev) => (prev || []).map((a) => (a.id === updated.id ? updated : a)));
    showToast(`✅ 账号【${updated.nickname}】资料已更新`);
  };

  const handleUpdateSettings = async (updated: Partial<SystemSettings>) => {
    const res = await api.updateSettings(updated);
    setSettings(res);
    showToast('系统设置已更新');
  };

  const activeAccountsCount = (accounts || []).filter((a) => a && a.status === 'active').length;
  const pendingTasksCount = (tasks || []).filter((t) => t && (t.status === 'running' || t.status === 'queued')).length;

  // 1. Initial Authentication Loading Screen
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-4 shadow-xl">
          <Layers className="w-6 h-6 text-emerald-400 animate-pulse" />
        </div>
        <div className="text-sm font-semibold tracking-wide text-neutral-200">
          智域 · 全域智能创作与矩阵发布系统
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
        totalAccountsCount={(accounts || []).length}
        pendingTasksCount={pendingTasksCount}
        currentUser={currentUser}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <Header
          activeTab={activeTab}
          currentUser={currentUser}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onLogout={handleLogout}
        />

        {/* Dynamic Body */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#f5f7fb]">
          <Routes>
            <Route path="/dashboard" element={<Dashboard accounts={accounts || []} jobs={jobs || []} tasks={tasks || []} onNavigate={setActiveTab} onOpenPublish={() => setIsPublishModalOpen(true)} onRefresh={loadData} isRefreshing={isRefreshing} workerConnected={workerConnected} onSelectTopicForCreate={(topicTitle) => { setContent((prev) => ({ ...prev, title: topicTitle })); setActiveTab('studio'); }} />} />
            <Route path="/creators" element={<CreatorsView onNavigateToEditor={(topicTitle) => { if (topicTitle) setContent((prev) => ({ ...prev, title: topicTitle })); setActiveTab('studio'); }} onOpenPublish={() => setIsPublishModalOpen(true)} onOpenWorkspace={(creatorId) => navigate(`/creators/${encodeURIComponent(creatorId)}`)} />} />
            <Route path="/creators/:creatorId" element={<CreatorWorkspaceRoute onNavigate={setActiveTab} />} />
            <Route path="/topics" element={<TopicsView onNavigateToEditor={(topicTitle) => { setContent((prev) => ({ ...prev, title: topicTitle })); setActiveTab('studio'); }} />} />
            <Route path="/content-pack" element={<SmartContentPackView onOpenStudio={(payload) => { setContent(payload); setActiveTab('studio'); }} />} />
            <Route path="/studio" element={<ContentEditor content={content} onChange={setContent} onOpenPublish={() => setIsPublishModalOpen(true)} />} />
            <Route path="/ai-images" element={<PrototypeModulePage icon={ImageIcon} eyebrow="ContentProject Media" title="AI 图片" description="按 ContentProject 生成封面、知识卡片、正文配图与 CTA 视觉，并继承品牌视觉规则。" steps={['选择 ContentProject 与 Creator', '确定素材角色与平台比例', '计算生成成本', '保存结果到素材中心']} onPrimaryAction={() => setActiveTab('contents')} primaryActionLabel="选择内容项目" />} />
            <Route path="/ai-videos" element={<PrototypeModulePage icon={Video} eyebrow="Storyboard Workflow" title="AI 视频" description="视频生产遵循脚本、分镜、成本确认和成片生成流程，不会第一次点击就产生高成本任务。" steps={['确认视频脚本', '生成并编辑分镜', '选择配音与镜头素材', '确认预计积分后生成']} onPrimaryAction={() => setActiveTab('content-pack')} primaryActionLabel="进入智能内容包" />} />
            <Route path="/series" element={<PrototypeModulePage icon={ListTree} eyebrow="Content Series" title="内容系列" description="围绕同一 Creator 管理连续选题和 ContentProject，例如专题栏目、连载课程与长期问答。" steps={['创建系列目标', '规划期数与顺序', '关联选题和内容项目', '跟踪生产与发布进度']} />} />
            <Route path="/contents" element={<ContentCenterView onOpenStudio={(project) => { setContent((previous) => ({ ...previous, title: project.title, content: project.masterContent?.body || previous.content })); setActiveTab('studio'); }} />} />
            <Route path="/assets" element={<AssetCenter onUseInEditor={(url) => { setContent((prev) => ({ ...prev, images: prev.images.includes(url) ? prev.images : [url, ...prev.images] })); setActiveTab('studio'); showToast('已将素材加入文案创作'); }} />} />
            <Route path="/calendar" element={<CalendarView tasks={tasks || []} onSelectTask={() => setActiveTab('publish')} />} />
            <Route path="/publish" element={<TaskCenter tasks={tasks || []} onRefresh={loadData} />} />
            <Route path="/analytics" element={<AnalyticsView />} />
            <Route path="/knowledge" element={<KnowledgeBaseView />} />
            <Route path="/memory" element={<MemoryCenter />} />
            <Route path="/learning" element={<PrototypeModulePage icon={GraduationCap} eyebrow="Performance Insight" title="AI学习中心" description="把真实内容指标分析为可确认的洞察，确认后才写入 Creator Performance Memory。" steps={['同步真实平台指标', '生成 Performance Insight', '人工确认或驳回', '写入 Creator Memory']} onPrimaryAction={() => setActiveTab('analytics')} primaryActionLabel="查看数据分析" />} />
            <Route path="/accounts" element={<AccountManager accounts={accounts || []} onRefresh={loadData} onAccountAdded={handleAccountAdded} onAccountDeleted={handleAccountDeleted} onAccountUpdated={handleAccountUpdated} />} />
            <Route path="/enterprise" element={<EnterpriseView onShowToast={showToast} currentUserRole={currentUser?.role || 'owner'} onBrandChanged={(brand) => { const updated = { ...currentUser, currentBrandId: brand.id, currentBrandName: brand.name }; setCurrentUser(updated); authStorage.setUser(updated); }} />} />
            <Route path="/billing" element={<PlansView />} />
            <Route path="/onboarding" element={<PrototypeModulePage icon={SparklesIcon} eyebrow="5-Step Onboarding" title="新手引导" description="完成行业、内容身份、内容目标、平台和首位 AI Creator 的五步初始化。" steps={['选择行业', '设置内容身份', '确认内容目标', '选择运营平台', '创建首位 AI Creator']} />} />
            <Route path="/settings" element={<SettingsView settings={settings} onUpdateSettings={handleUpdateSettings} workerConnected={workerConnected} />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>

      {/* Global Publish Modal */}
      <PublishModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        accounts={accounts || []}
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

const CreatorWorkspaceRoute: React.FC<{ onNavigate: (routeId: string) => void }> = ({ onNavigate }) => {
  const { creatorId = '' } = useParams();
  return <CreatorWorkspaceView creatorId={creatorId} onNavigate={onNavigate} />;
};

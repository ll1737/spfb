import React, { useEffect, useState } from 'react';
import { BarChart3, CalendarDays, FileText, Loader2, Settings2, Sparkles, Target, UserRound } from 'lucide-react';
import { api } from '../lib/api';
import { Creator, CreatorPlan } from '../types';

type WorkspaceTab = 'overview' | 'plan' | 'topics' | 'content' | 'calendar' | 'analytics' | 'settings';

interface CreatorWorkspaceViewProps {
  creatorId: string;
  onNavigate: (routeId: string) => void;
}

const tabs: { id: WorkspaceTab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: '运营概览', icon: Target },
  { id: 'plan', label: '任务计划', icon: CalendarDays },
  { id: 'topics', label: '预生成选题', icon: Sparkles },
  { id: 'content', label: '预生产内容', icon: FileText },
  { id: 'calendar', label: '发布日历', icon: CalendarDays },
  { id: 'analytics', label: '数据统计', icon: BarChart3 },
  { id: 'settings', label: '角色设置', icon: Settings2 }
];

export const CreatorWorkspaceView: React.FC<CreatorWorkspaceViewProps> = ({ creatorId, onNavigate }) => {
  const [creator, setCreator] = useState<Creator | null>(null);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.getCreators()
      .then((rows) => {
        if (!active) return;
        setCreator(rows.find((row) => row.id === creatorId) ?? null);
      })
      .catch((err) => active && setError(err instanceof Error ? err.message : '创作者数据加载失败'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [creatorId]);

  if (loading) return <div className="rounded-3xl border border-[#e5e9f1] bg-white p-12 text-center text-sm text-[#66718a]"><Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" />正在加载创作者工作台…</div>;
  if (error) return <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  if (!creator) return <div className="rounded-3xl border border-dashed border-[#d8deea] bg-white p-12 text-center"><UserRound className="mx-auto mb-3 h-9 w-9 text-[#9ba6bb]" /><h1 className="text-base font-black text-[#232a3a]">未找到该创作者</h1><p className="mt-2 text-sm text-[#66718a]">请返回 AI内容生产者页面选择当前企业中的真实 Creator。</p></div>;

  return <div className="mx-auto max-w-[1480px] space-y-5 pb-12">
    <section className="rounded-3xl border border-[#e5e9f1] bg-white p-6 sm:p-8">
      <div className="flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#171717] text-xl font-black text-white">{creator.name.slice(0, 1)}</div><div><div className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#6654d9]">Creator Workspace</div><h1 className="mt-1 text-2xl font-black text-[#151a28]">{creator.name}</h1><p className="mt-1 text-sm text-[#66718a]">{creator.profession || creator.industry || '尚未设置运营定位'}</p></div></div>
      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">{tabs.map((tab) => { const Icon = tab.icon; return <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-bold transition-colors cursor-pointer ${activeTab === tab.id ? 'bg-[#171717] text-white' : 'bg-[#f4f6fa] text-[#566178] hover:bg-[#eaedf4]'}`}><Icon className="h-4 w-4" />{tab.label}</button>; })}</div>
    </section>

    <section className="rounded-3xl border border-[#e5e9f1] bg-white p-6 sm:p-8">
      {activeTab === 'overview' && <div><h2 className="text-lg font-black text-[#202636]">运营概览</h2><p className="mt-2 text-sm text-[#66718a]">当前已接入真实 Persona。任务、内容、发布和指标数量会在 Creator 聚合 API 完成后由服务器统计。</p><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{['今日任务','预生成选题','待审核','待发布'].map((label) => <div key={label} className="rounded-2xl border border-[#edf0f5] bg-[#fafbfe] p-4"><div className="text-xs font-semibold text-[#66718a]">{label}</div><div className="mt-2 text-2xl font-black text-[#1d2433]">—</div></div>)}</div></div>}
      {activeTab === 'plan' && <CreatorPlanPanel creatorId={creator.id} />}
      {activeTab === 'topics' && <WorkspaceAction title="预生成选题" description="查看当前 Creator 的日、周、月独立选题池。" action="打开 AI选题" onClick={() => onNavigate('topics')} />}
      {activeTab === 'content' && <WorkspaceAction title="预生产内容" description="查看由选题进入 ContentProject 后的母内容和平台版本。" action="打开智能内容包" onClick={() => onNavigate('content-pack')} />}
      {activeTab === 'calendar' && <WorkspaceAction title="发布日历" description="按 Creator、平台和状态查看真实发布排期。" action="打开内容日历" onClick={() => onNavigate('calendar')} />}
      {activeTab === 'analytics' && <WorkspaceAction title="数据统计" description="查看真实发布后的曝光、互动、涨粉和内容表现。" action="打开数据分析" onClick={() => onNavigate('analytics')} />}
      {activeTab === 'settings' && <div><h2 className="text-lg font-black text-[#202636]">角色设置</h2><dl className="mt-5 grid gap-3 md:grid-cols-2"><Info label="表达语气" value={creator.persona?.toneStyle} /><Info label="目标受众" value={creator.persona?.targetAudience} /><Info label="系统提示词" value={creator.persona?.systemPrompt} wide /><Info label="知识范围" value={creator.persona?.knowledgeBase} wide /></dl></div>}
    </section>
  </div>;
};

const WorkspaceAction = ({ title, description, action, onClick }: { title: string; description: string; action: string; onClick: () => void }) => <div><h2 className="text-lg font-black text-[#202636]">{title}</h2><p className="mt-2 text-sm text-[#66718a]">{description}</p><button type="button" onClick={onClick} className="mt-5 min-h-11 rounded-xl bg-[#171717] px-4 text-sm font-bold text-white hover:bg-[#333] cursor-pointer">{action}</button></div>;

const Info = ({ label, value, wide }: { label: string; value?: string; wide?: boolean }) => <div className={`rounded-2xl border border-[#edf0f5] bg-[#fafbfe] p-4 ${wide ? 'md:col-span-2' : ''}`}><dt className="text-xs font-bold text-[#566178]">{label}</dt><dd className="mt-2 whitespace-pre-wrap text-sm text-[#202636]">{value || '尚未配置'}</dd></div>;

const CreatorPlanPanel: React.FC<{ creatorId: string }> = ({ creatorId }) => {
  const [plan, setPlan] = useState<CreatorPlan | null>(null);
  const [dailyTarget, setDailyTarget] = useState(2);
  const [productionMode, setProductionMode] = useState<CreatorPlan['productionMode']>('manual');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    api.getCreatorPlans(creatorId).then((rows) => {
      if (!active) return;
      const current = rows.find((row) => row.status === 'active') ?? rows[0] ?? null;
      setPlan(current);
      if (current) {
        setDailyTarget(current.dailyTarget);
        setProductionMode(current.productionMode);
      }
    }).catch((err) => active && setMessage(err instanceof Error ? err.message : '计划加载失败')).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [creatorId]);

  const save = async () => {
    setSaving(true);
    setMessage('');
    try {
      const saved = await api.saveCreatorPlan(creatorId, { id: plan?.id, planType: plan?.planType || 'daily', dailyTarget, productionMode, status: 'active', platforms: plan?.platforms || [] });
      setPlan(saved);
      setMessage('任务计划已保存');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '任务计划保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-10 text-center text-sm text-[#66718a]"><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />正在读取任务计划…</div>;
  return <div><h2 className="text-lg font-black text-[#202636]">任务计划</h2><p className="mt-2 text-sm text-[#66718a]">设置当前 Creator 的真实生产节奏。平台账号和发布时间会在绑定后写入同一计划。</p><div className="mt-5 grid gap-4 md:grid-cols-2"><label className="text-sm font-bold text-[#3b455b]">每日发布篇数<input type="number" min={1} max={100} value={dailyTarget} onChange={(event) => setDailyTarget(Number(event.target.value))} className="mt-2 h-11 w-full rounded-xl border border-[#dfe4ee] px-3 font-normal outline-none focus:border-[#6654d9]" /></label><label className="text-sm font-bold text-[#3b455b]">生产方式<select value={productionMode} onChange={(event) => setProductionMode(event.target.value as CreatorPlan['productionMode'])} className="mt-2 h-11 w-full rounded-xl border border-[#dfe4ee] bg-white px-3 font-normal outline-none focus:border-[#6654d9]"><option value="manual">手动生产</option><option value="semi_auto">半自动生产</option><option value="auto">自动生产</option></select></label></div>{message && <p className={`mt-4 text-sm ${message.includes('失败') || message.includes('无效') ? 'text-red-600' : 'text-emerald-600'}`}>{message}</p>}<button type="button" disabled={saving || dailyTarget < 1} onClick={() => void save()} className="mt-5 min-h-11 rounded-xl bg-[#171717] px-5 text-sm font-bold text-white transition-colors hover:bg-[#333] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer">{saving ? '保存中…' : '保存任务计划'}</button></div>;
};

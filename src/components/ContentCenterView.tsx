import React, { useEffect, useMemo, useState } from 'react';
import { FileText, Filter, Loader2, Plus, Search } from 'lucide-react';
import { api } from '../lib/api';
import { ContentProject, Creator } from '../types';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: '草稿', TOPIC_READY: '选题就绪', GENERATING: '生成中', CONTENT_READY: '内容就绪', MEDIA_GENERATING: '媒体生成中', REVIEWING: '审核中', REJECTED: '已驳回', APPROVED: '已通过', SCHEDULED: '已排期', PUBLISHING: '发布中', PUBLISHED: '已发布', PARTIAL_FAILED: '部分失败', FAILED: '失败', ARCHIVED: '已归档'
};

export const ContentCenterView: React.FC<{ onOpenStudio: (project: ContentProject) => void }> = ({ onOpenStudio }) => {
  const [projects, setProjects] = useState<ContentProject[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [creatorId, setCreatorId] = useState('');
  const [title, setTitle] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [projectResult, creatorRows] = await Promise.all([api.listContentProjects(), api.getCreators()]);
      setProjects(projectResult.data.items || []);
      setCreators(creatorRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : '内容项目加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const visible = useMemo(() => projects.filter((project) => {
    const matchesQuery = !query.trim() || project.title.toLowerCase().includes(query.trim().toLowerCase());
    return matchesQuery && (!status || project.status === status) && (!creatorId || project.creatorId === creatorId);
  }), [projects, query, status, creatorId]);

  const createProject = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!creatorId || !title.trim()) return;
    setSaving(true);
    try {
      const result = await api.createContentProject({ creatorId, title: title.trim(), contentType: 'article' });
      setProjects((previous) => [result.data, ...previous]);
      setTitle('');
      setIsCreateOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '内容项目创建失败');
    } finally {
      setSaving(false);
    }
  };

  return <div className="mx-auto max-w-[1500px] space-y-5 pb-12">
    <section className="flex flex-col justify-between gap-5 rounded-3xl border border-[#e5e9f1] bg-white p-7 sm:flex-row sm:items-center"><div><div className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#6654d9]">Content CMS</div><h1 className="mt-2 text-2xl font-black text-[#151a28]">内容中心</h1><p className="mt-2 text-sm text-[#66718a]">统一查看真实 ContentProject 的生产、审核、排期和发布状态。</p></div><button type="button" onClick={() => setIsCreateOpen(true)} disabled={creators.length === 0} className="min-h-11 rounded-xl bg-[#171717] px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"><Plus className="mr-2 inline h-4 w-4" />新建内容项目</button></section>
    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    <section className="flex flex-col gap-3 rounded-2xl border border-[#e5e9f1] bg-white p-4 md:flex-row"><label className="flex min-h-11 flex-1 items-center gap-2 rounded-xl border border-[#e3e7ef] bg-[#fafbfe] px-3"><Search className="h-4 w-4 text-[#8994a8]" /><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="搜索内容项目" placeholder="搜索标题" className="w-full bg-transparent text-sm outline-none" /></label><label className="flex min-h-11 items-center gap-2 rounded-xl border border-[#e3e7ef] bg-white px-3 text-sm"><Filter className="h-4 w-4 text-[#8994a8]" /><select value={creatorId} onChange={(event) => setCreatorId(event.target.value)} aria-label="按创作者筛选" className="bg-transparent outline-none"><option value="">全部 Creator</option>{creators.map((creator) => <option key={creator.id} value={creator.id}>{creator.name}</option>)}</select></label><select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="按状态筛选" className="min-h-11 rounded-xl border border-[#e3e7ef] bg-white px-3 text-sm outline-none"><option value="">全部状态</option>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></section>
    {loading ? <div className="rounded-3xl border border-[#e5e9f1] bg-white p-12 text-center text-sm text-[#66718a]"><Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" />正在读取 ContentProject…</div> : visible.length === 0 ? <div className="rounded-3xl border border-dashed border-[#d8deea] bg-white p-14 text-center"><FileText className="mx-auto mb-3 h-10 w-10 text-[#a3adc0]" /><h2 className="font-black text-[#232a3a]">暂无内容项目</h2><p className="mt-2 text-sm text-[#66718a]">创建后才会显示，不填充演示内容。</p></div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visible.map((project) => <button key={project.id} type="button" onClick={() => onOpenStudio(project)} className="rounded-2xl border border-[#e5e9f1] bg-white p-5 text-left transition-colors hover:border-[#9a8bea] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6654d9] cursor-pointer"><div className="flex items-center justify-between gap-3"><span className="rounded-full bg-[#f0edff] px-2.5 py-1 text-[10px] font-bold text-[#6654d9]">{STATUS_LABELS[project.status] || project.status}</span><span className="text-[11px] text-[#8b95a8]">{project.contentType}</span></div><h3 className="mt-4 line-clamp-2 text-base font-black text-[#202636]">{project.title}</h3><p className="mt-3 text-xs text-[#6d778b]">当前步骤：{project.currentStep || 'init'}</p></button>)}</div>}
    {isCreateOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><form onSubmit={(event) => void createProject(event)} className="w-full max-w-lg space-y-4 rounded-3xl bg-white p-7 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="create-project-title"><h2 id="create-project-title" className="text-xl font-black text-[#202636]">新建内容项目</h2><label className="block text-sm font-bold text-[#3b455b]">Creator<select required value={creatorId} onChange={(event) => setCreatorId(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#dfe4ee] bg-white px-3 font-normal"><option value="">请选择</option>{creators.map((creator) => <option key={creator.id} value={creator.id}>{creator.name}</option>)}</select></label><label className="block text-sm font-bold text-[#3b455b]">项目标题<input autoFocus required value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#dfe4ee] px-3 font-normal" /></label><div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setIsCreateOpen(false)} className="min-h-11 px-4 text-sm font-bold text-[#66718a] cursor-pointer">取消</button><button disabled={saving} className="min-h-11 rounded-xl bg-[#171717] px-5 text-sm font-bold text-white cursor-pointer">{saving ? '创建中…' : '创建'}</button></div></form></div>}
  </div>;
};

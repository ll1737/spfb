import React, { useEffect, useState } from 'react';
import { ArrowRight, FileStack, Loader2, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import { ContentPayload, ContentProject, Creator } from '../types';

export const SmartContentPackView: React.FC<{ onOpenStudio: (payload: ContentPayload) => void }> = ({ onOpenStudio }) => {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [projects, setProjects] = useState<ContentProject[]>([]);
  const [creatorId, setCreatorId] = useState('');
  const [topicTitle, setTopicTitle] = useState('');
  const [angle, setAngle] = useState('');
  const [contentType, setContentType] = useState('article');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [creatorRows, projectResult] = await Promise.all([api.getCreators(), api.listContentProjects()]);
      setCreators(creatorRows);
      setProjects(projectResult.data.items || []);
      setCreatorId((current) => current || creatorRows[0]?.id || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : '智能内容包加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const generate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!creatorId || !topicTitle.trim()) return;
    setGenerating(true);
    setError('');
    try {
      const result = await api.generateMasterContent({ creatorId, topicTitle: topicTitle.trim(), angle: angle.trim(), contentType });
      const master = result.data.masterContent;
      onOpenStudio({ title: master.title || topicTitle, content: master.body || '', summary: master.summary, contentType: contentType === 'video' ? 'video' : 'article', images: [], tags: [] });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI 生成失败，请检查模型配置');
    } finally {
      setGenerating(false);
    }
  };

  return <div className="mx-auto max-w-[1450px] space-y-5 pb-12">
    <section className="rounded-3xl border border-[#e5e9f1] bg-white p-7 sm:p-9"><div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[#6654d9]"><FileStack className="h-4 w-4" />ContentProject Production</div><h1 className="mt-2 text-2xl font-black text-[#151a28]">智能内容包</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[#66718a]">从 Creator 与选题创建 ContentProject，生成 Master Content 后再进入平台适配、媒体和审核流程。</p></section>
    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
      <form onSubmit={(event) => void generate(event)} className="h-fit space-y-4 rounded-3xl border border-[#e5e9f1] bg-white p-6"><h2 className="text-base font-black text-[#202636]">创建生产任务</h2><label className="block text-sm font-bold text-[#3b455b]">Creator<select required value={creatorId} onChange={(event) => setCreatorId(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#dfe4ee] bg-white px-3 font-normal"><option value="">请选择</option>{creators.map((creator) => <option key={creator.id} value={creator.id}>{creator.name}</option>)}</select></label><label className="block text-sm font-bold text-[#3b455b]">选题<input required value={topicTitle} onChange={(event) => setTopicTitle(event.target.value)} placeholder="输入真实选题" className="mt-2 h-11 w-full rounded-xl border border-[#dfe4ee] px-3 font-normal" /></label><label className="block text-sm font-bold text-[#3b455b]">创作角度<textarea value={angle} onChange={(event) => setAngle(event.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-[#dfe4ee] p-3 font-normal resize-none" /></label><label className="block text-sm font-bold text-[#3b455b]">内容类型<select value={contentType} onChange={(event) => setContentType(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#dfe4ee] bg-white px-3 font-normal"><option value="article">文章</option><option value="note">图文笔记</option><option value="video">视频脚本</option><option value="multi_platform">多平台内容</option></select></label><button disabled={generating || !creatorId} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#171717] text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer">{generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{generating ? '正在调用真实 AI Gateway…' : '生成 Master Content'}</button><p className="text-xs leading-5 text-[#6d778b]">没有可用模型或 Prompt 时任务会失败并显示原因，不会返回模拟内容。</p></form>
      <section className="rounded-3xl border border-[#e5e9f1] bg-white p-6"><div className="flex items-center justify-between"><div><h2 className="text-base font-black text-[#202636]">最近 ContentProject</h2><p className="mt-1 text-xs text-[#6d778b]">{projects.length} 个真实项目</p></div></div>{loading ? <div className="py-16 text-center text-sm text-[#66718a]"><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />加载中…</div> : projects.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed border-[#d8deea] py-16 text-center text-sm text-[#66718a]">暂无内容项目</div> : <div className="mt-5 space-y-3">{projects.slice(0, 10).map((project) => <button key={project.id} type="button" onClick={() => project.masterContent && onOpenStudio({ title: project.masterContent.title || project.title, content: project.masterContent.body, summary: project.masterContent.summary, contentType: project.contentType === 'video' ? 'video' : 'article', images: [], tags: [] })} className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[#edf0f5] bg-[#fafbfe] p-4 text-left hover:border-[#9a8bea] cursor-pointer"><div><div className="text-sm font-black text-[#202636]">{project.title}</div><div className="mt-1 text-xs text-[#6d778b]">{project.status} · {project.currentStep}</div></div><ArrowRight className="h-4 w-4 text-[#6654d9]" /></button>)}</div>}</section>
    </div>
  </div>;
};

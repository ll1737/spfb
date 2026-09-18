import React, { useEffect, useState } from 'react';
import { ArrowRight, FileText, Loader2, Package, Plus, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { ContentPackage, ContentPayload } from '../types';

interface ContentPackageProps {
  onNavigateToEditorWithContent: (payload: ContentPayload) => void;
  onOpenPublish: () => void;
}

export const ContentPackagesView: React.FC<ContentPackageProps> = ({ onNavigateToEditorWithContent, onOpenPublish }) => {
  const [packages, setPackages] = useState<ContentPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [masterContent, setMasterContent] = useState('');

  const loadPackages = async () => {
    setLoading(true);
    try {
      setPackages(await api.getContentPackages());
    } catch (err) {
      setError(err instanceof Error ? err.message : '内容包加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadPackages(); }, []);

  const createPackage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !masterContent.trim()) return;
    setSaving(true);
    try {
      const created = await api.createContentPackage({ title: title.trim(), masterContent: masterContent.trim() });
      setPackages((previous) => [created, ...previous]);
      setTitle('');
      setMasterContent('');
      setIsCreateOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '内容包创建失败');
    } finally {
      setSaving(false);
    }
  };

  const deletePackage = async (row: ContentPackage) => {
    if (!window.confirm(`确定删除“${row.title}”吗？`)) return;
    try {
      await api.deleteContentPackage(row.id);
      setPackages((previous) => previous.filter((item) => item.id !== row.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : '内容包删除失败');
    }
  };

  const openEditor = (row: ContentPackage) => {
    onNavigateToEditorWithContent({ title: row.title, content: row.masterContent, contentType: 'article', images: [], tags: [] });
  };

  return <div className="space-y-6 max-w-[1540px] mx-auto pb-12">
    <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#e8ebf3] flex items-center justify-between gap-4"><div><div className="flex items-center gap-2 text-[#7258f5] text-xs font-extrabold"><Package className="w-4 h-4" />Content Project · Master Content</div><h1 className="mt-2 text-xl font-black text-[#171c2d]">内容包</h1><p className="mt-1 text-xs text-[#75809a]">母内容会保存在当前企业空间，后续再派生平台版本和发布任务。</p></div><button onClick={() => setIsCreateOpen(true)} className="px-3 py-2 rounded-xl bg-[#7258f5] text-white text-xs font-bold cursor-pointer"><Plus className="w-4 h-4 inline mr-1" />新建内容包</button></div>
    {error && <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-600">{error}</div>}
    {loading ? <div className="p-12 rounded-3xl bg-white border border-[#e8ebf3] text-center text-sm text-[#75809a]"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />正在读取真实内容…</div> : packages.length === 0 ? <div className="p-12 rounded-3xl bg-white border border-dashed border-[#dfe3ee] text-center"><FileText className="w-10 h-10 mx-auto text-[#b2b9ca] mb-3" /><h2 className="text-base font-bold text-[#30394f]">暂无内容包</h2><p className="text-xs text-[#75809a] mt-2">创建第一份母内容后，它才会进入内容中心。</p></div> : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{packages.map((row) => <article key={row.id} className="p-6 rounded-3xl bg-white border border-[#e8ebf3] flex flex-col gap-4"><div><div className="flex items-center justify-between gap-3"><span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-50 text-[#7258f5] font-bold">{row.status || 'draft'}</span><span className="text-[11px] text-[#9aa3b7]">{row.createdAt ? new Date(row.createdAt).toLocaleDateString('zh-CN') : '未记录时间'}</span></div><h3 className="mt-3 text-base font-bold text-[#171c2d]">{row.title}</h3><p className="mt-2 text-xs text-[#66718a] leading-relaxed line-clamp-5">{row.masterContent}</p></div><div className="pt-4 border-t border-[#f0f2f7] flex items-center justify-between"><div className="flex gap-2"><button onClick={() => openEditor(row)} className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#7258f5] cursor-pointer">编辑母内容 <ArrowRight className="w-3.5 h-3.5 inline ml-1" /></button><button onClick={onOpenPublish} className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#7258f5] bg-[#f3f0ff] cursor-pointer">安排发布</button></div><button onClick={() => void deletePackage(row)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"><Trash2 className="w-4 h-4" /></button></div></article>)}</div>}
    {isCreateOpen && <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><form onSubmit={(event) => void createPackage(event)} className="w-full max-w-lg bg-white rounded-3xl p-6 space-y-4"><h3 className="text-lg font-black text-[#171c2d]">新建内容包</h3><input autoFocus required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="内容标题" className="w-full h-10 px-3 rounded-xl border border-[#e2e6ef] outline-none text-xs" /><textarea required value={masterContent} onChange={(event) => setMasterContent(event.target.value)} placeholder="输入真实母内容" rows={10} className="w-full p-3 rounded-xl border border-[#e2e6ef] outline-none text-xs resize-none" /><div className="flex justify-end gap-3"><button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 text-xs text-[#75809a] cursor-pointer">取消</button><button disabled={saving} type="submit" className="px-4 py-2 rounded-xl bg-[#7258f5] text-white text-xs font-bold cursor-pointer">保存内容</button></div></form></div>}
  </div>;
};

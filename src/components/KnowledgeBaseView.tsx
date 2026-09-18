import React, { useEffect, useState } from 'react';
import { BookOpen, Loader2, Plus, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { Creator, KnowledgeDocument } from '../types';

export const KnowledgeBaseView: React.FC = () => {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [creatorId, setCreatorId] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [rows, creatorRows] = await Promise.all([api.getKnowledgeDocuments(), api.getCreators()]);
      setDocuments(rows);
      setCreators(creatorRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : '知识库加载失败');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void load(); }, []);

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const value = await api.createKnowledgeDocument({ name: name.trim(), content: content.trim(), creatorId: creatorId || undefined, sourceType: 'manual', mimeType: 'text/plain' });
      setDocuments((previous) => [value, ...previous]);
      setName(''); setContent(''); setCreatorId(''); setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '知识文档创建失败');
    } finally { setSaving(false); }
  };

  const remove = async (value: KnowledgeDocument) => {
    if (!window.confirm(`确定删除“${value.name}”吗？`)) return;
    try {
      await api.deleteKnowledgeDocument(value.id);
      setDocuments((previous) => previous.filter((row) => row.id !== value.id));
    } catch (err) { setError(err instanceof Error ? err.message : '删除失败'); }
  };

  return <div className="mx-auto max-w-[1450px] space-y-5 pb-12"><section className="flex flex-col justify-between gap-5 rounded-3xl border border-[#e5e9f1] bg-white p-7 sm:flex-row sm:items-center"><div><div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[#6654d9]"><BookOpen className="h-4 w-4" />RAG Knowledge</div><h1 className="mt-2 text-2xl font-black text-[#151a28]">品牌知识库</h1><p className="mt-2 text-sm text-[#66718a]">保存客观资料与引用内容；Creator Memory 和运营洞察不会混入这里。</p></div><button onClick={() => setOpen(true)} className="min-h-11 rounded-xl bg-[#171717] px-4 text-sm font-bold text-white cursor-pointer"><Plus className="mr-2 inline h-4 w-4" />添加文档</button></section>{error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}{loading ? <div className="rounded-3xl border border-[#e5e9f1] bg-white p-12 text-center text-sm text-[#66718a]"><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />加载知识库…</div> : documents.length === 0 ? <div className="rounded-3xl border border-dashed border-[#d8deea] bg-white p-14 text-center"><BookOpen className="mx-auto mb-3 h-10 w-10 text-[#a3adc0]" /><h2 className="font-black text-[#232a3a]">暂无品牌知识</h2><p className="mt-2 text-sm text-[#66718a]">添加真实资料后才会出现在这里。</p></div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{documents.map((doc) => <article key={doc.id} className="rounded-2xl border border-[#e5e9f1] bg-white p-5"><div className="flex items-start justify-between gap-3"><div><span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">{doc.status}</span><h2 className="mt-3 text-base font-black text-[#202636]">{doc.name}</h2></div><button onClick={() => void remove(doc)} aria-label={`删除 ${doc.name}`} className="min-h-11 min-w-11 rounded-xl text-red-500 hover:bg-red-50 cursor-pointer"><Trash2 className="mx-auto h-4 w-4" /></button></div><p className="mt-3 line-clamp-5 whitespace-pre-wrap text-sm leading-6 text-[#66718a]">{doc.content}</p><p className="mt-4 text-xs text-[#8b95a8]">{doc.creatorId ? `Creator: ${creators.find((row) => row.id === doc.creatorId)?.name || doc.creatorId}` : '品牌通用'}</p></article>)}</div>}{open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><form onSubmit={(event) => void create(event)} className="w-full max-w-xl space-y-4 rounded-3xl bg-white p-7" role="dialog" aria-modal="true"><h2 className="text-xl font-black text-[#202636]">添加知识文档</h2><label className="block text-sm font-bold text-[#3b455b]">名称<input autoFocus required value={name} onChange={(event) => setName(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#dfe4ee] px-3 font-normal" /></label><label className="block text-sm font-bold text-[#3b455b]">适用 Creator<select value={creatorId} onChange={(event) => setCreatorId(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#dfe4ee] bg-white px-3 font-normal"><option value="">品牌通用</option>{creators.map((creator) => <option key={creator.id} value={creator.id}>{creator.name}</option>)}</select></label><label className="block text-sm font-bold text-[#3b455b]">真实内容<textarea required rows={10} value={content} onChange={(event) => setContent(event.target.value)} className="mt-2 w-full rounded-xl border border-[#dfe4ee] p-3 font-normal resize-none" /></label><div className="flex justify-end gap-3"><button type="button" onClick={() => setOpen(false)} className="min-h-11 px-4 text-sm font-bold text-[#66718a] cursor-pointer">取消</button><button disabled={saving} className="min-h-11 rounded-xl bg-[#171717] px-5 text-sm font-bold text-white cursor-pointer">{saving ? '保存中…' : '保存'}</button></div></form></div>}</div>;
};

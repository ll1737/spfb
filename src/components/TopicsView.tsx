import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Flame, Loader2, Plus, Search, Sparkles, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { Topic } from '../types';

interface TopicsViewProps {
  onNavigateToEditor: (topicTitle: string) => void;
}

export const TopicsView: React.FC<TopicsViewProps> = ({ onNavigateToEditor }) => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [tags, setTags] = useState('');

  const loadTopics = async () => {
    setLoading(true);
    setError('');
    try {
      setTopics(await api.getTopics());
    } catch (err) {
      setError(err instanceof Error ? err.message : '选题加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadTopics(); }, []);

  const categories = useMemo(() => Array.from(new Set(topics.map((topic) => topic.category).filter(Boolean) as string[])), [topics]);
  const filteredTopics = topics.filter((topic) => {
    const query = searchQuery.trim().toLowerCase();
    return (!category || topic.category === category) && (!query || topic.title.toLowerCase().includes(query) || (topic.tags || []).some((tag) => tag.toLowerCase().includes(query)));
  });

  const createTopic = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const created = await api.createTopic({ title: title.trim(), category: newCategory.trim(), tags: tags.split(/[,，]/).map((tag) => tag.trim()).filter(Boolean), angles: [] });
      setTopics((previous) => [created, ...previous]);
      setTitle('');
      setNewCategory('');
      setTags('');
      setIsCreateOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '选题创建失败');
    } finally {
      setSaving(false);
    }
  };

  const deleteTopic = async (topic: Topic) => {
    if (!window.confirm(`确定删除选题“${topic.title}”吗？`)) return;
    try {
      await api.deleteTopic(topic.id);
      setTopics((previous) => previous.filter((row) => row.id !== topic.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : '选题删除失败');
    }
  };

  return <div className="space-y-6 max-w-[1540px] mx-auto pb-12">
    <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#e8ebf3] flex items-center justify-between gap-4"><div><div className="flex items-center gap-2 text-[#7258f5] text-xs font-extrabold"><Sparkles className="w-4 h-4" />Topic · 真实企业数据</div><h1 className="mt-2 text-xl font-black text-[#171c2d]">选题池</h1><p className="mt-1 text-xs text-[#75809a]">当前只显示你创建或后续由真实数据源生成的选题，不展示预置热点。</p></div><button onClick={() => setIsCreateOpen(true)} className="px-3 py-2 rounded-xl bg-[#7258f5] text-white text-xs font-bold cursor-pointer"><Plus className="w-4 h-4 inline mr-1" />新建选题</button></div>
    {error && <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-600">{error}</div>}
    <div className="p-4 rounded-2xl bg-white border border-[#e8ebf3] flex flex-col sm:flex-row gap-3"><div className="flex items-center gap-2 flex-1 h-9 px-3 rounded-xl border border-[#e8ebf3] bg-[#fafbfe]"><Search className="w-4 h-4 text-[#9aa2b4]" /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="搜索选题或标签" className="w-full bg-transparent outline-none text-xs" /></div><select value={category} onChange={(event) => setCategory(event.target.value)} className="h-9 px-3 rounded-xl border border-[#e8ebf3] bg-white text-xs outline-none"><option value="">全部领域</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
    {loading ? <div className="p-12 rounded-3xl bg-white border border-[#e8ebf3] text-center text-sm text-[#75809a]"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />正在读取真实选题…</div> : filteredTopics.length === 0 ? <div className="p-12 rounded-3xl bg-white border border-dashed border-[#dfe3ee] text-center"><Sparkles className="w-10 h-10 mx-auto text-[#b2b9ca] mb-3" /><h2 className="text-base font-bold text-[#30394f]">暂无选题</h2><p className="text-xs text-[#75809a] mt-2">先创建一个真实选题，后续再接入 AI 选题任务。</p></div> : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{filteredTopics.map((topic) => <article key={topic.id} className="p-6 rounded-3xl bg-white border border-[#e8ebf3] flex flex-col justify-between gap-5"><div><div className="flex items-center justify-between gap-3"><span className="px-2 py-0.5 rounded-md bg-purple-50 text-[#7258f5] text-[10px] font-bold">{topic.category || '未分类'}</span><span className="flex items-center gap-1 text-xs text-[#75809a]"><Flame className="w-3.5 h-3.5 text-rose-400" />{topic.heatScore || '未评分'}</span></div><h3 className="mt-3 text-base font-bold text-[#171c2d] leading-snug">{topic.title}</h3><div className="flex flex-wrap gap-1.5 mt-3">{(topic.tags || []).map((tag) => <span key={tag} className="px-2 py-0.5 rounded-md bg-[#fafbfe] border border-[#edf0f5] text-[#75809a] text-[10px]">#{tag}</span>)}</div></div><div className="pt-4 border-t border-[#f0f2f7] flex items-center justify-between gap-3"><button onClick={() => onNavigateToEditor(topic.title)} className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#7258f5] cursor-pointer">投入创作 <ArrowRight className="w-3.5 h-3.5 inline ml-1" /></button><button onClick={() => void deleteTopic(topic)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"><Trash2 className="w-4 h-4" /></button></div></article>)}</div>}
    {isCreateOpen && <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><form onSubmit={(event) => void createTopic(event)} className="w-full max-w-lg bg-white rounded-3xl p-6 space-y-4"><h3 className="text-lg font-black text-[#171c2d]">新建选题</h3><input autoFocus required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="选题标题" className="w-full h-10 px-3 rounded-xl border border-[#e2e6ef] outline-none text-xs" /><input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="领域（可选）" className="w-full h-10 px-3 rounded-xl border border-[#e2e6ef] outline-none text-xs" /><input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="标签，用逗号分隔（可选）" className="w-full h-10 px-3 rounded-xl border border-[#e2e6ef] outline-none text-xs" /><div className="flex justify-end gap-3"><button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 text-xs text-[#75809a] cursor-pointer">取消</button><button disabled={saving} type="submit" className="px-4 py-2 rounded-xl bg-[#7258f5] text-white text-xs font-bold cursor-pointer">保存选题</button></div></form></div>}
  </div>;
};

import React, { useEffect, useMemo, useState } from 'react';
import { BrainCircuit, FolderPlus, Loader2, Plus, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { MemoryCategory, MemoryItem } from '../types';

export const MemoryCenter: React.FC = () => {
  const [categories, setCategories] = useState<MemoryCategory[]>([]);
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [itemTitle, setItemTitle] = useState('');
  const [itemContent, setItemContent] = useState('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);

  const selectedCategory = useMemo(() => categories.find((category) => category.id === selectedCategoryId), [categories, selectedCategoryId]);
  const visibleItems = selectedCategoryId ? items.filter((item) => item.categoryId === selectedCategoryId) : items;

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [categoryRows, itemRows] = await Promise.all([api.getMemoryCategories(), api.getMemoryItems()]);
      setCategories(categoryRows);
      setItems(itemRows);
      setSelectedCategoryId((previous) => categoryRows.some((category) => category.id === previous) ? previous : '');
    } catch (err) {
      setError(err instanceof Error ? err.message : '记忆数据加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadData(); }, []);

  const createCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!categoryName.trim()) return;
    setSaving(true);
    try {
      const category = await api.createMemoryCategory({ name: categoryName.trim() });
      setCategories((previous) => [category, ...previous]);
      setSelectedCategoryId(category.id);
      setCategoryName('');
      setIsCategoryModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '记忆分类创建失败');
    } finally {
      setSaving(false);
    }
  };

  const createItem = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedCategoryId || !itemTitle.trim() || !itemContent.trim()) return;
    setSaving(true);
    try {
      const item = await api.createMemoryItem({ categoryId: selectedCategoryId, title: itemTitle.trim(), content: itemContent.trim(), tags: [] });
      setItems((previous) => [item, ...previous]);
      setItemTitle('');
      setItemContent('');
      setIsItemModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '记忆保存失败');
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (item: MemoryItem) => {
    if (!window.confirm(`确定删除“${item.title}”吗？`)) return;
    try {
      await api.deleteMemoryItem(item.id);
      setItems((previous) => previous.filter((row) => row.id !== item.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : '记忆删除失败');
    }
  };

  return (
    <div className="space-y-6 max-w-[1540px] mx-auto pb-12">
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#e8ebf3] flex items-center justify-between gap-4"><div><div className="flex items-center gap-2 text-[#7258f5] text-xs font-extrabold"><BrainCircuit className="w-4 h-4" />AI Memory · 真实企业数据</div><h1 className="mt-2 text-xl font-black text-[#171c2d]">知识与长期记忆</h1><p className="mt-1 text-xs text-[#75809a]">只展示当前企业实际保存的分类和记忆，不预置白皮书、案例或虚构效果。</p></div><button onClick={() => setIsCategoryModalOpen(true)} className="px-3 py-2 rounded-xl bg-[#7258f5] text-white text-xs font-bold cursor-pointer"><FolderPlus className="w-4 h-4 inline mr-1" />新建分类</button></div>
      {error && <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-600">{error}</div>}
      {loading ? <div className="p-12 rounded-3xl bg-white border border-[#e8ebf3] text-center text-sm text-[#75809a]"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />正在读取真实记忆…</div> : <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5"><aside className="p-4 rounded-2xl bg-white border border-[#e8ebf3] h-fit"><div className="flex items-center justify-between mb-3"><span className="text-xs font-black text-[#30394f]">记忆分类</span><span className="text-[11px] text-[#9aa3b7]">{categories.length}</span></div><button onClick={() => setSelectedCategoryId('')} className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer ${!selectedCategoryId ? 'bg-[#f3f0ff] text-[#7258f5]' : 'text-[#75809a] hover:bg-[#fafbfe]'}`}>全部记忆</button>{categories.map((category) => <button key={category.id} onClick={() => setSelectedCategoryId(category.id)} className={`w-full mt-1 text-left px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer ${selectedCategoryId === category.id ? 'bg-[#f3f0ff] text-[#7258f5]' : 'text-[#75809a] hover:bg-[#fafbfe]'}`}>{category.name}<span className="float-right text-[10px]">{category.itemCount || items.filter((item) => item.categoryId === category.id).length}</span></button>)}</aside><section className="p-6 rounded-2xl bg-white border border-[#e8ebf3]"><div className="flex items-center justify-between gap-3 mb-5"><div><h2 className="text-base font-black text-[#171c2d]">{selectedCategory?.name || '全部记忆'}</h2><p className="text-xs text-[#75809a] mt-1">{visibleItems.length} 条真实记录</p></div><button disabled={!selectedCategoryId} onClick={() => setIsItemModalOpen(true)} className="px-3 py-2 rounded-xl bg-[#f3f0ff] text-[#7258f5] text-xs font-bold disabled:opacity-40 cursor-pointer"><Plus className="w-4 h-4 inline mr-1" />添加记忆</button></div>{visibleItems.length === 0 ? <div className="py-16 text-center border border-dashed border-[#dfe3ee] rounded-2xl"><BrainCircuit className="w-9 h-9 mx-auto text-[#b2b9ca] mb-3" /><p className="text-sm font-bold text-[#30394f]">暂无真实记忆</p><p className="text-xs text-[#75809a] mt-1">先创建分类，再录入你自己的资料、偏好或经验。</p></div> : <div className="space-y-3">{visibleItems.map((item) => <article key={item.id} className="p-4 rounded-2xl bg-[#fafbfe] border border-[#edf0f5]"><div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-bold text-[#171c2d]">{item.title}</h3><p className="mt-2 text-xs leading-relaxed text-[#5f6b84] whitespace-pre-wrap">{item.content}</p></div><button onClick={() => void deleteItem(item)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"><Trash2 className="w-4 h-4" /></button></div></article>)}</div>}</section></div>}

      {isCategoryModalOpen && <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><form onSubmit={(event) => void createCategory(event)} className="w-full max-w-md bg-white rounded-3xl p-6 space-y-4"><h3 className="text-lg font-black text-[#171c2d]">新建记忆分类</h3><input autoFocus required value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="例如：品牌规范、产品资料" className="w-full h-10 px-3 rounded-xl border border-[#e2e6ef] outline-none text-xs" /><div className="flex justify-end gap-3"><button type="button" onClick={() => setIsCategoryModalOpen(false)} className="px-4 py-2 text-xs text-[#75809a] cursor-pointer">取消</button><button disabled={saving} type="submit" className="px-4 py-2 rounded-xl bg-[#7258f5] text-white text-xs font-bold cursor-pointer">创建</button></div></form></div>}
      {isItemModalOpen && <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><form onSubmit={(event) => void createItem(event)} className="w-full max-w-lg bg-white rounded-3xl p-6 space-y-4"><h3 className="text-lg font-black text-[#171c2d]">添加记忆</h3><input autoFocus required value={itemTitle} onChange={(event) => setItemTitle(event.target.value)} placeholder="标题" className="w-full h-10 px-3 rounded-xl border border-[#e2e6ef] outline-none text-xs" /><textarea required value={itemContent} onChange={(event) => setItemContent(event.target.value)} placeholder="输入真实资料、规则、偏好或复盘结论" rows={6} className="w-full p-3 rounded-xl border border-[#e2e6ef] outline-none text-xs resize-none" /><div className="flex justify-end gap-3"><button type="button" onClick={() => setIsItemModalOpen(false)} className="px-4 py-2 text-xs text-[#75809a] cursor-pointer">取消</button><button disabled={saving || !selectedCategoryId} type="submit" className="px-4 py-2 rounded-xl bg-[#7258f5] text-white text-xs font-bold cursor-pointer">保存记忆</button></div></form></div>}
    </div>
  );
};

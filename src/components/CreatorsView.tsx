import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BrainCircuit, Calendar, CheckCircle2, Loader2, Plus, Trash2, Users2 } from 'lucide-react';
import { api } from '../lib/api';
import { CreatorPersona } from '../types';

interface CreatorsViewProps {
  onNavigateToEditor: (topicTitle?: string) => void;
  onOpenPublish: () => void;
}

const formatDate = (value?: string) => {
  if (!value) return '尚未记录';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('zh-CN');
};

export const CreatorsView: React.FC<CreatorsViewProps> = ({ onNavigateToEditor, onOpenPublish }) => {
  const [creators, setCreators] = useState<CreatorPersona[]>([]);
  const [selectedCreatorId, setSelectedCreatorId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState('');
  const [toneStyle, setToneStyle] = useState('');
  const [targetAudience, setTargetAudience] = useState('');

  const currentCreator = useMemo(
    () => creators.find((creator) => creator.id === selectedCreatorId) ?? creators[0],
    [creators, selectedCreatorId]
  );

  const loadCreators = async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await api.getCreators();
      setCreators(rows);
      setSelectedCreatorId((previous) => rows.some((row) => row.id === previous) ? previous : (rows[0]?.id ?? ''));
    } catch (err) {
      setError(err instanceof Error ? err.message : '创作者数据加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadCreators(); }, []);

  const resetForm = () => {
    setName('');
    setTitle('');
    setDomain('');
    setToneStyle('');
    setTargetAudience('');
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError('');
    try {
      const created = await api.createCreator({
        name: name.trim(), title: title.trim(), domain: domain.trim(), toneStyle: toneStyle.trim(), targetAudience: targetAudience.trim(), status: 'active'
      });
      setCreators((previous) => [created, ...previous]);
      setSelectedCreatorId(created.id);
      setIsCreateModalOpen(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : '创作者创建失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentCreator || !window.confirm(`确定删除创作者“${currentCreator.name}”吗？`)) return;
    setSaving(true);
    try {
      await api.deleteCreator(currentCreator.id);
      const remaining = creators.filter((creator) => creator.id !== currentCreator.id);
      setCreators(remaining);
      setSelectedCreatorId(remaining[0]?.id ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : '创作者删除失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1540px] mx-auto pb-12">
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#e8ebf3] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 text-[#7258f5] text-xs font-extrabold uppercase tracking-wider"><Users2 className="w-4 h-4" /><span>AI Creator · 真实企业数据</span></div>
          <h1 className="text-xl sm:text-2xl font-black text-[#171c2d] tracking-tight">AI 创作者运营空间</h1>
          <p className="text-xs text-[#75809a] leading-relaxed">每个创作者的人设、知识和记忆都归属于当前企业空间。没有创建记录时，这里不会显示演示数据。</p>
        </div>
        <button onClick={() => setIsCreateModalOpen(true)} className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#735af4] to-[#8876fa] shadow-md shadow-indigo-500/25 transition-all flex items-center gap-2 cursor-pointer"><Plus className="w-4 h-4" /> 创建 AI 创作者</button>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-600">{error}</div>}

      {loading ? (
        <div className="p-12 rounded-3xl bg-white border border-[#e8ebf3] text-center text-sm text-[#75809a]"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />正在读取真实创作者数据…</div>
      ) : creators.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white border border-dashed border-[#dfe3ee] text-center"><Users2 className="w-10 h-10 mx-auto text-[#b2b9ca] mb-3" /><h2 className="text-base font-bold text-[#30394f]">还没有创作者</h2><p className="text-xs text-[#75809a] mt-2">创建你的第一位 AI Creator 后，人设配置会保存到企业空间。</p><button onClick={() => setIsCreateModalOpen(true)} className="mt-5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#7258f5] cursor-pointer"><Plus className="w-4 h-4 inline mr-1" />创建第一位创作者</button></div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {creators.map((creator) => <button key={creator.id} onClick={() => setSelectedCreatorId(creator.id)} className={`text-left p-5 rounded-2xl border transition-all cursor-pointer ${creator.id === currentCreator?.id ? 'border-[#7258f5] bg-purple-50/50 shadow-sm' : 'border-[#e8ebf3] bg-white hover:border-[#c8c0ff]'}`}><div className="flex items-start justify-between gap-3"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7258f5] to-[#35c7bd] text-white flex items-center justify-center font-black">{creator.name.slice(0, 1)}</div>{creator.status === 'active' && <span className="text-[10px] text-emerald-600 font-bold">已启用</span>}</div><h3 className="mt-4 text-sm font-black text-[#171c2d] truncate">{creator.name}</h3><p className="mt-1 text-xs text-[#75809a] truncate">{creator.title || creator.domain || '未设置定位'}</p><p className="mt-3 text-[11px] text-[#9aa3b7]">更新于 {formatDate(creator.updatedAt || creator.createdAt)}</p></button>)}
          </div>
          {currentCreator && <div className="bg-white rounded-3xl border border-[#e8ebf3] shadow-xs overflow-hidden"><div className="p-6 border-b border-[#edf0f5] flex flex-col sm:flex-row justify-between gap-4"><div><div className="flex items-center gap-2 text-xs font-extrabold text-[#7258f5]"><BrainCircuit className="w-4 h-4" />当前 Creator</div><h2 className="mt-2 text-xl font-black text-[#171c2d]">{currentCreator.name}</h2><p className="mt-1 text-xs text-[#75809a]">{currentCreator.title || currentCreator.domain || '尚未设置领域定位'}</p></div><div className="flex items-start gap-2"><button onClick={onOpenPublish} className="px-3 py-2 rounded-xl bg-[#f5f3ff] text-[#7258f5] text-xs font-bold cursor-pointer"><Calendar className="w-4 h-4 inline mr-1" />安排发布</button><button onClick={() => onNavigateToEditor()} className="px-3 py-2 rounded-xl bg-[#7258f5] text-white text-xs font-bold cursor-pointer">开始创作 <ArrowRight className="w-4 h-4 inline ml-1" /></button><button onClick={() => void handleDelete()} disabled={saving} className="p-2 rounded-xl text-red-500 hover:bg-red-50 cursor-pointer" title="删除创作者"><Trash2 className="w-4 h-4" /></button></div></div><div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4"><div className="p-4 rounded-2xl bg-[#fafbfe] border border-[#edf0f5]"><div className="text-xs font-bold text-[#48536b]">表达语气</div><p className="mt-2 text-sm text-[#171c2d]">{currentCreator.toneStyle || '尚未配置'}</p></div><div className="p-4 rounded-2xl bg-[#fafbfe] border border-[#edf0f5]"><div className="text-xs font-bold text-[#48536b]">目标受众</div><p className="mt-2 text-sm text-[#171c2d]">{currentCreator.targetAudience || '尚未配置'}</p></div><div className="p-4 rounded-2xl bg-[#fafbfe] border border-[#edf0f5] md:col-span-2"><div className="text-xs font-bold text-[#48536b]">系统提示词</div><p className="mt-2 text-sm text-[#171c2d] whitespace-pre-wrap">{currentCreator.systemPrompt || '尚未配置。后续可在 Persona 编辑中补充。'}</p></div></div><div className="px-6 pb-6 flex items-center gap-2 text-xs text-[#75809a]"><CheckCircle2 className="w-4 h-4 text-emerald-500" />数据来自当前企业空间，尚未关联内容统计。</div></div>}
        </>
      )}

      {isCreateModalOpen && <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"><form onSubmit={(event) => void handleCreate(event)} className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#e8ebf3] space-y-4"><div><h3 className="text-lg font-black text-[#171c2d]">创建 AI 创作者</h3><p className="text-xs text-[#75809a] mt-1">只保存你提交的真实配置，不会自动生成默认角色。</p></div><input required value={name} onChange={(event) => setName(event.target.value)} placeholder="创作者名称" className="w-full h-10 px-3 rounded-xl border border-[#e2e6ef] outline-none text-xs" /><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="职位或对外定位（可选）" className="w-full h-10 px-3 rounded-xl border border-[#e2e6ef] outline-none text-xs" /><input value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="内容领域（可选）" className="w-full h-10 px-3 rounded-xl border border-[#e2e6ef] outline-none text-xs" /><input value={toneStyle} onChange={(event) => setToneStyle(event.target.value)} placeholder="表达语气（可选）" className="w-full h-10 px-3 rounded-xl border border-[#e2e6ef] outline-none text-xs" /><input value={targetAudience} onChange={(event) => setTargetAudience(event.target.value)} placeholder="目标受众（可选）" className="w-full h-10 px-3 rounded-xl border border-[#e2e6ef] outline-none text-xs" /><div className="flex justify-end gap-3 pt-3 border-t border-[#f0f2f7]"><button type="button" onClick={() => { setIsCreateModalOpen(false); resetForm(); }} className="px-4 py-2 rounded-xl text-xs font-bold text-[#75809a] cursor-pointer">取消</button><button disabled={saving} type="submit" className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#7258f5] cursor-pointer">{saving ? '保存中…' : '确认创建'}</button></div></form></div>}
    </div>
  );
};

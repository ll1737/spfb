import React, { useState, useEffect } from 'react';
import {
  Building2,
  Shield,
  UserPlus,
  Users,
  Sparkles,
  Layers,
  ChevronRight,
  Edit2,
  Plus,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Check,
  X,
  Lock,
  Unlock,
  Trash2,
  RefreshCw,
  ExternalLink,
  Crown,
  KeyRound,
  SlidersHorizontal,
  FolderTree
} from 'lucide-react';
import {
  EnterpriseInfo,
  Brand,
  TeamMember,
  CollaborationRule,
  ModulePermissionRule,
  UserRole
} from '../types';
import { api } from '../lib/api';

interface EnterpriseViewProps {
  onShowToast: (msg: string) => void;
  currentUserRole?: string;
  onBrandChanged?: (brand: Brand) => void;
}

export const EnterpriseView: React.FC<EnterpriseViewProps> = ({
  onShowToast,
  currentUserRole = 'owner',
  onBrandChanged
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [enterprise, setEnterprise] = useState<EnterpriseInfo | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [rule, setRule] = useState<CollaborationRule | null>(null);
  const [permissionsMatrix, setPermissionsMatrix] = useState<ModulePermissionRule[]>([]);
  const [currentBrand, setCurrentBrand] = useState<Brand | null>(null);

  // Modals state
  const [isEditOrgOpen, setIsEditOrgOpen] = useState(false);
  const [isAddBrandOpen, setIsAddBrandOpen] = useState(false);
  const [isInviteMemberOpen, setIsInviteMemberOpen] = useState(false);
  const [isEditMemberOpen, setIsEditMemberOpen] = useState(false);
  const [isEditRuleOpen, setIsEditRuleOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  // Form states
  const [orgForm, setOrgForm] = useState({ name: '', industry: '', location: '', tier: '企业版', inviteCode: '' });
  const [brandForm, setBrandForm] = useState({ name: '', type: 'sub' as 'main' | 'sub', description: '', iconText: '' });
  const [memberForm, setMemberForm] = useState({ name: '', email: '', role: 'operator' as UserRole, assignedBrands: [] as string[] });
  const [ruleForm, setRuleForm] = useState({ enabled: true, ruleDescription: '', requireAiAudit: true, requireManualAudit: true, requireRiskCheck: true });

  const isOwnerOrAdmin = currentUserRole === 'owner' || currentUserRole === 'admin';

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await api.getEnterprise();
      setEnterprise(data.enterprise);
      setBrands(data.brands);
      setMembers(data.members);
      setRule(data.collaborationRule);
      setCurrentBrand(data.currentBrand || data.brands[0]);
      setPermissionsMatrix(data.permissionsMatrix);

      if (data.enterprise) {
        setOrgForm({
          name: data.enterprise.name,
          industry: data.enterprise.industry,
          location: data.enterprise.location,
          tier: data.enterprise.tier,
          inviteCode: data.enterprise.inviteCode || ''
        });
      }
      if (data.collaborationRule) {
        setRuleForm({
          enabled: data.collaborationRule.enabled,
          ruleDescription: data.collaborationRule.ruleDescription,
          requireAiAudit: data.collaborationRule.requireAiAudit,
          requireManualAudit: data.collaborationRule.requireManualAudit,
          requireRiskCheck: data.collaborationRule.requireRiskCheck
        });
      }
    } catch (err: any) {
      console.warn('Failed to load enterprise data', err);
      onShowToast(err.message || '加载企业与团队数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save Enterprise Info
  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgForm.name.trim()) return;
    try {
      const res = await api.updateEnterprise(orgForm);
      setEnterprise(res.enterprise);
      setIsEditOrgOpen(false);
      onShowToast(res.message);
    } catch (err: any) {
      onShowToast(err.message || '更新企业信息失败');
    }
  };

  // Add Brand
  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandForm.name.trim()) return;
    try {
      const res = await api.createBrand(brandForm);
      setBrands(res.brands);
      setIsAddBrandOpen(false);
      setBrandForm({ name: '', type: 'sub', description: '', iconText: '' });
      onShowToast(res.message);
    } catch (err: any) {
      onShowToast(err.message || '新增品牌失败');
    }
  };

  // Switch Active Brand
  const handleSwitchBrand = async (brandId: string) => {
    try {
      const res = await api.switchBrand(brandId);
      setCurrentBrand(res.currentBrand);
      setBrands(res.brands);
      if (onBrandChanged) onBrandChanged(res.currentBrand);
      onShowToast(res.message);
    } catch (err: any) {
      onShowToast(err.message || '切换品牌失败');
    }
  };

  // Delete Brand
  const handleDeleteBrand = async (brandId: string) => {
    if (!confirm('确定要删除该品牌吗？关联的排期与账号需重新分配。')) return;
    try {
      const res = await api.deleteBrand(brandId);
      setBrands(res.brands);
      setCurrentBrand(res.currentBrand);
      onShowToast(res.message);
    } catch (err: any) {
      onShowToast(err.message || '删除品牌失败');
    }
  };

  // Invite Member
  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.name.trim() || !memberForm.email.trim()) return;
    try {
      const res = await api.inviteMember(memberForm);
      setMembers(res.members);
      setIsInviteMemberOpen(false);
      setMemberForm({ name: '', email: '', role: 'operator', assignedBrands: [] });
      onShowToast(res.message);
    } catch (err: any) {
      onShowToast(err.message || '邀请成员失败');
    }
  };

  // Update Member
  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    try {
      const res = await api.updateMember(selectedMember.id, selectedMember);
      setMembers(res.members);
      setIsEditMemberOpen(false);
      setSelectedMember(null);
      onShowToast(res.message);
    } catch (err: any) {
      onShowToast(err.message || '更新成员权限失败');
    }
  };

  // Remove Member
  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('确定将该成员移出企业组织吗？')) return;
    try {
      const res = await api.removeMember(memberId);
      setMembers(res.members);
      onShowToast(res.message);
    } catch (err: any) {
      onShowToast(err.message || '移出成员失败');
    }
  };

  // Save Collaboration Rules
  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.updateCollaborationRule(ruleForm);
      setRule(res.collaborationRule);
      setIsEditRuleOpen(false);
      onShowToast(res.message);
    } catch (err: any) {
      onShowToast(err.message || '更新协作规则失败');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[420px] text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin text-indigo-500 mr-2" />
        <span>正在载入企业与团队配置...</span>
      </div>
    );
  }

  const storagePercent = enterprise
    ? Math.min(100, Math.round((enterprise.usedStorageGB / enterprise.quotaStorageGB) * 100))
    : 26;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 mb-1">
            ENTERPRISE &amp; TEAM GOVERNANCE
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#171c2d]">企业与团队</h1>
          <p className="text-xs text-[#75809a] mt-0.5">
            管理企业组织、旗下品牌矩阵、成员协作角色与内容发布审批流权限
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsPermissionsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#454f6b] bg-white border border-[#e3e6ef] rounded-xl hover:bg-slate-50 transition-all shadow-2xs"
          >
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            <span>权限配置</span>
          </button>

          {isOwnerOrAdmin && (
            <button
              onClick={() => setIsInviteMemberOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#735af4] to-[#8876fa] hover:from-[#6549f0] hover:to-[#7966f7] rounded-xl shadow-md shadow-indigo-500/20 transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ 邀请团队成员</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: 4 Core Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Col (7 cols): Enterprise Info + Brands */}
        <div className="lg:col-span-7 space-y-5">
          {/* Card 1: Enterprise Information */}
          <div className="p-6 rounded-2xl bg-white border border-[#e8ebf3] shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-5">
              <h2 className="text-sm font-black text-[#171c2d]">企业信息</h2>
              {isOwnerOrAdmin && (
                <button
                  onClick={() => setIsEditOrgOpen(true)}
                  className="text-xs font-semibold text-[#735af4] hover:text-[#5a3feb] flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>编辑</span>
                </button>
              )}
            </div>

            {enterprise && (
              <div className="space-y-5">
                {/* Org Identity Row */}
                <div className="flex items-start gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md shrink-0"
                    style={{ background: enterprise.logoBg || 'linear-gradient(135deg,#2b3145,#6277cc)' }}
                  >
                    {enterprise.logoText || enterprise.name.substring(0, 1)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-extrabold text-[#171c2d] truncate">
                      {enterprise.name}
                    </h3>
                    <p className="text-xs text-[#75809a] mt-0.5">
                      {enterprise.industry} · {enterprise.location}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                        {enterprise.tier}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {enterprise.status === 'active' ? '运营中' : '测试体验'}
                      </span>
                      {enterprise.inviteCode && (
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          邀请码: {enterprise.inviteCode}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#f0f2f7]">
                  <div>
                    <div className="text-[11px] font-semibold text-[#8a94a6]">企业 ID</div>
                    <div className="text-xs font-mono font-bold text-[#20263a] mt-1">
                      {enterprise.code || enterprise.id}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-semibold text-[#8a94a6]">当前方案额度</div>
                    <div className="text-xs font-bold text-[#20263a] mt-1">
                      {enterprise.quotaGenerated}
                    </div>
                  </div>
                </div>

                {/* Storage Quota Progress */}
                <div className="pt-3">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-[#8a94a6]">数据空间用量</span>
                    <span className="font-mono font-bold text-[#20263a]">
                      {enterprise.usedStorageGB} GB / {enterprise.quotaStorageGB} GB
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                      style={{ width: `${storagePercent}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Brands Matrix */}
          <div className="p-6 rounded-2xl bg-white border border-[#e8ebf3] shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-[#171c2d]">旗下品牌</h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {brands.length} 个
                </span>
              </div>
              {isOwnerOrAdmin && (
                <button
                  onClick={() => setIsAddBrandOpen(true)}
                  className="text-xs font-semibold text-[#735af4] hover:text-[#5a3feb] flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>新增品牌</span>
                </button>
              )}
            </div>

            <div className="space-y-3">
              {brands.map((b) => (
                <div
                  key={b.id}
                  className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                    b.isCurrent
                      ? 'border-indigo-200 bg-indigo-50/40 shadow-xs'
                      : 'border-[#edf0f6] bg-[#fafbfe] hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                        b.type === 'main'
                          ? 'bg-gradient-to-br from-indigo-600 to-violet-700 text-white'
                          : 'bg-gradient-to-br from-teal-600 to-emerald-700 text-white'
                      }`}
                    >
                      {b.iconText || b.name.substring(0, 1)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-[#1a2035] truncate">{b.name}</h4>
                        {b.type === 'main' && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700">
                            主品牌
                          </span>
                        )}
                        {b.type === 'sub' && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-teal-100 text-teal-700">
                            子品牌
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#8c96ac] mt-0.5 truncate">
                        {b.type === 'main' ? '主品牌' : '子品牌'} · {b.accountsCount} 个内容账号 · {b.membersCount} 名成员
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {b.isCurrent ? (
                      <span className="text-[11px] font-bold text-emerald-600 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>当前</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSwitchBrand(b.id)}
                        className="text-xs font-bold text-[#57627a] px-3 py-1.5 rounded-lg border border-[#e0e4ef] bg-white hover:bg-slate-100 hover:text-[#1e2538] transition-all cursor-pointer"
                      >
                        切换
                      </button>
                    )}

                    {isOwnerOrAdmin && brands.length > 1 && (
                      <button
                        onClick={() => handleDeleteBrand(b.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                        title="删除品牌"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col (5 cols): Team Members + Collaboration Rules */}
        <div className="lg:col-span-5 space-y-5">
          {/* Card 3: Team Members */}
          <div className="p-6 rounded-2xl bg-white border border-[#e8ebf3] shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-[#171c2d]">团队成员</h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {members.length} 人
                </span>
              </div>
              <button
                onClick={() => setIsPermissionsModalOpen(true)}
                className="text-xs font-semibold text-[#735af4] hover:text-[#5a3feb] flex items-center gap-1"
              >
                <span>成员管理 →</span>
              </button>
            </div>

            <div className="space-y-3">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-xl border border-[#edf0f6] bg-[#fafbfe] hover:bg-white hover:border-slate-300 transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6853ed] to-[#36c8bd] text-white flex items-center justify-center font-extrabold text-xs shrink-0 shadow-xs">
                      {m.avatarText || m.name.substring(0, 1)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#1f263e] truncate">{m.name}</span>
                        {m.isOwner && (
                          <Crown className="w-3 h-3 text-amber-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-[10px] text-[#8c96ac] truncate">
                        {m.roleLabel} · {m.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        m.badgeColor || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {m.badge}
                    </span>

                    {isOwnerOrAdmin && !m.isOwner && (
                      <button
                        onClick={() => {
                          setSelectedMember(m);
                          setIsEditMemberOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                        title="修改权限"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 4: Collaboration Rules */}
          <div className="p-6 rounded-2xl bg-white border border-[#e8ebf3] shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-[#171c2d]">协作规则</h2>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  rule?.enabled
                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {rule?.enabled ? '已启用' : '未开启'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-[#faf9ff] to-[#f3f0ff] border border-[#e7e2fa] mb-4">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <p className="text-xs text-[#524584] leading-relaxed">
                  {rule?.ruleDescription || '所有医疗与品牌合规内容需经 AI + 人工审核后方可进入发布队列。'}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-[#636e88] mb-4">
              <div className="flex items-center justify-between py-1 border-b border-[#f0f2f7]">
                <span>AI 大模型合规净化校验</span>
                <span className="font-bold text-emerald-600">✓ 强制执行</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#f0f2f7]">
                <span>人工审核审批流</span>
                <span className="font-bold text-emerald-600">✓ 所有者审批</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span>自动化排期发布门禁</span>
                <span className="font-bold text-purple-600">双重签名就绪</span>
              </div>
            </div>

            {isOwnerOrAdmin && (
              <button
                onClick={() => setIsEditRuleOpen(true)}
                className="w-full py-2 text-xs font-bold text-[#5c44cf] bg-white border border-[#dcd4fb] hover:bg-[#faf9ff] rounded-xl transition-all text-center cursor-pointer"
              >
                编辑审批流
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ================= MODALS ================= */}

      {/* 1. Permissions Matrix Modal */}
      {isPermissionsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">角色与模块权限矩阵 (RBAC)</h3>
                  <p className="text-xs text-slate-500">按模块细化 6 大角色的查看、创作、发布与管理权限</p>
                </div>
              </div>
              <button
                onClick={() => setIsPermissionsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                      <th className="p-3">功能模块</th>
                      <th className="p-3">所属分类</th>
                      <th className="p-3 text-center">所有者 (Owner)</th>
                      <th className="p-3 text-center">资产专家</th>
                      <th className="p-3 text-center">内容运营</th>
                      <th className="p-3 text-center">发布专员</th>
                      <th className="p-3 text-center">审核员</th>
                      <th className="p-3 text-center">观察员</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {permissionsMatrix.map((item) => (
                      <tr key={item.moduleId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-bold text-slate-800">{item.moduleName}</td>
                        <td className="p-3 text-slate-500">{item.category}</td>
                        <td className="p-3 text-center">
                          <span className="font-bold text-emerald-600">全权</span>
                        </td>
                        <td className="p-3 text-center">
                          {item.permissions.asset_admin?.canWrite ? (
                            <span className="font-semibold text-indigo-600">管理</span>
                          ) : item.permissions.asset_admin?.canRead ? (
                            <span className="text-slate-600">只读</span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {item.permissions.operator?.canPublish ? (
                            <span className="font-semibold text-indigo-600">创作/发布</span>
                          ) : item.permissions.operator?.canWrite ? (
                            <span className="font-semibold text-blue-600">创作</span>
                          ) : item.permissions.operator?.canRead ? (
                            <span className="text-slate-600">只读</span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {item.permissions.publisher?.canPublish ? (
                            <span className="font-semibold text-emerald-600">发布执行</span>
                          ) : item.permissions.publisher?.canRead ? (
                            <span className="text-slate-600">查看</span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {item.permissions.reviewer?.canWrite ? (
                            <span className="font-semibold text-amber-600">审核</span>
                          ) : item.permissions.reviewer?.canRead ? (
                            <span className="text-slate-600">只读</span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {item.permissions.viewer?.canRead ? (
                            <span className="text-slate-500">只读</span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
              <button
                onClick={() => setIsPermissionsModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Edit Enterprise Info Modal */}
      {isEditOrgOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-extrabold text-slate-900">编辑企业基本信息</h3>
              <button onClick={() => setIsEditOrgOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveOrg} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">企业/组织全称</label>
                <input
                  type="text"
                  value={orgForm.name}
                  onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">所属行业领域</label>
                <input
                  type="text"
                  value={orgForm.industry}
                  onChange={(e) => setOrgForm({ ...orgForm, industry: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-indigo-500"
                  placeholder="例如：医疗健康 · 口腔服务"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">所在地域城市</label>
                <input
                  type="text"
                  value={orgForm.location}
                  onChange={(e) => setOrgForm({ ...orgForm, location: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">企业邀请码</label>
                <input
                  type="text"
                  value={orgForm.inviteCode}
                  onChange={(e) => setOrgForm({ ...orgForm, inviteCode: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:outline-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditOrgOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700"
                >
                  保存更新
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Add Brand Modal */}
      {isAddBrandOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-extrabold text-slate-900">新建旗下运营品牌</h3>
              <button onClick={() => setIsAddBrandOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateBrand} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">品牌名称</label>
                <input
                  type="text"
                  value={brandForm.name}
                  onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-indigo-500"
                  placeholder="例如：微笑齿科教育"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">品牌类型</label>
                <select
                  value={brandForm.type}
                  onChange={(e) => setBrandForm({ ...brandForm, type: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-indigo-500"
                >
                  <option value="sub">子品牌 / 衍生业务线</option>
                  <option value="main">主品牌</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">品牌定位与描述</label>
                <textarea
                  value={brandForm.description}
                  onChange={(e) => setBrandForm({ ...brandForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-indigo-500"
                  placeholder="简要说明该品牌的内容定位与受众..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddBrandOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700"
                >
                  确认创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Invite Member Modal */}
      {isInviteMemberOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-extrabold text-slate-900">邀请新团队成员</h3>
              <button onClick={() => setIsInviteMemberOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleInviteMember} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">成员姓名 / 昵称</label>
                <input
                  type="text"
                  value={memberForm.name}
                  onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-indigo-500"
                  placeholder="例如：陈晓琳"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">工作邮箱</label>
                <input
                  type="email"
                  value={memberForm.email}
                  onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-indigo-500"
                  placeholder="chen@company.com"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">分配角色与职责</label>
                <select
                  value={memberForm.role}
                  onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-indigo-500"
                >
                  <option value="operator">内容运营官 (负责选题与创作)</option>
                  <option value="asset_admin">AI内容资产 / 专家 (负责Persona与知识库)</option>
                  <option value="publisher">发布专员 (负责账号与发布监控)</option>
                  <option value="reviewer">审核员 (负责合规审批)</option>
                  <option value="admin">企业管理员 (全功能管理)</option>
                  <option value="viewer">观察员 (仅看板查看)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">可访问的品牌矩阵</label>
                <div className="space-y-1.5 pt-1">
                  {brands.map((b) => (
                    <label key={b.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={memberForm.assignedBrands.includes(b.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setMemberForm({ ...memberForm, assignedBrands: [...memberForm.assignedBrands, b.id] });
                          } else {
                            setMemberForm({ ...memberForm, assignedBrands: memberForm.assignedBrands.filter((id) => id !== b.id) });
                          }
                        }}
                        className="rounded text-indigo-600 focus:ring-0"
                      />
                      <span>{b.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteMemberOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700"
                >
                  发送邀请并加入
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Edit Member Role Modal */}
      {isEditMemberOpen && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-extrabold text-slate-900">配置成员权限 - {selectedMember.name}</h3>
              <button onClick={() => setIsEditMemberOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateMember} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">成员角色</label>
                <select
                  value={selectedMember.role}
                  onChange={(e) => setSelectedMember({ ...selectedMember, role: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-indigo-500"
                >
                  <option value="owner">企业所有者</option>
                  <option value="admin">企业管理员</option>
                  <option value="asset_admin">AI内容资产 / 专家</option>
                  <option value="operator">内容运营</option>
                  <option value="publisher">发布专员</option>
                  <option value="reviewer">审核员</option>
                  <option value="viewer">观察员</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">关联品牌矩阵</label>
                <div className="space-y-1.5 pt-1">
                  {brands.map((b) => (
                    <label key={b.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedMember.assignedBrands?.includes(b.id)}
                        onChange={(e) => {
                          const current = selectedMember.assignedBrands || [];
                          if (e.target.checked) {
                            setSelectedMember({ ...selectedMember, assignedBrands: [...current, b.id] });
                          } else {
                            setSelectedMember({ ...selectedMember, assignedBrands: current.filter((id) => id !== b.id) });
                          }
                        }}
                        className="rounded text-indigo-600 focus:ring-0"
                      />
                      <span>{b.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                {!selectedMember.isOwner && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditMemberOpen(false);
                      handleRemoveMember(selectedMember.id);
                    }}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700"
                  >
                    移出团队
                  </button>
                )}
                <div className="flex gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsEditMemberOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700"
                  >
                    保存配置
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Edit Approval Rules Modal */}
      {isEditRuleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-extrabold text-slate-900">配置内容协作与审核审批流</h3>
              <button onClick={() => setIsEditRuleOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveRule} className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">启用发布审批流门禁</div>
                  <div className="text-[11px] text-slate-500">未审核通过的内容禁止进入定时发布队列</div>
                </div>
                <input
                  type="checkbox"
                  checked={ruleForm.enabled}
                  onChange={(e) => setRuleForm({ ...ruleForm, enabled: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">门禁策略说明</label>
                <textarea
                  value={ruleForm.ruleDescription}
                  onChange={(e) => setRuleForm({ ...ruleForm, ruleDescription: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-indigo-500"
                  rows={3}
                />
              </div>

              <div className="space-y-2 pt-1 border-t border-slate-100">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ruleForm.requireAiAudit}
                    onChange={(e) => setRuleForm({ ...ruleForm, requireAiAudit: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>必须通过 AI 合规净化检查 (敏感词/广告法)</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ruleForm.requireManualAudit}
                    onChange={(e) => setRuleForm({ ...ruleForm, requireManualAudit: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>必须通过人工审核员复核签名</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditRuleOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700"
                >
                  保存审批规则
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

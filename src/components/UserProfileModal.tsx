import React, { useState } from 'react';
import {
  X,
  User as UserIcon,
  Mail,
  Shield,
  Building,
  Phone,
  Key,
  Calendar,
  CheckCircle2,
  AlertCircle,
  LogOut,
  RefreshCw,
  Sparkles,
  Lock
} from 'lucide-react';
import { User } from '../types';
import { api } from '../lib/api';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUserUpdated: (user: User) => void;
  onLogout: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserUpdated,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'roles'>('profile');
  
  // Profile edit states
  const [nickname, setNickname] = useState(user.nickname);
  const [teamName, setTeamName] = useState(user.teamName || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [bio, setBio] = useState(user.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);

  // Security edit states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const handleRandomAvatar = () => {
    const seed = Math.random().toString(36).substring(2, 8);
    setAvatarUrl(`https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setIsLoading(true);

    try {
      const updated = await api.updateProfile({
        nickname: nickname.trim(),
        teamName: teamName.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
        avatarUrl: avatarUrl.trim()
      });
      onUserUpdated(updated);
      setFeedback({ type: 'success', message: '个人信息保存成功！' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || '更新失败，请重试' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (newPassword.length < 6) {
      setFeedback({ type: 'error', message: '新密码不能少于 6 位' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', message: '两次输入的新密码不一致' });
      return;
    }

    setIsLoading(true);
    try {
      await api.changePassword(oldPassword, newPassword);
      setFeedback({ type: 'success', message: '密码已成功更新，下次请使用新密码登录' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setFeedback(null), 3500);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || '修改密码失败，请核对原密码' });
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return { label: '超级架构师 (Admin)', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'operator':
        return { label: '矩阵运营官 (Operator)', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      default:
        return { label: '内容创作者 (Creator)', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
  };

  const roleInfo = getRoleBadge(user.role);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <img
                src={avatarUrl || user.avatarUrl}
                alt={user.nickname}
                className="w-12 h-12 rounded-2xl object-cover bg-neutral-200 border border-neutral-300 shadow-xs"
                referrerPolicy="no-referrer"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-neutral-900">{user.nickname}</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${roleInfo.bg}`}>
                  {roleInfo.label}
                </span>
              </div>
              <p className="text-xs text-neutral-500 flex items-center gap-2 mt-0.5">
                <span>@{user.username}</span>
                <span>•</span>
                <span>{user.email}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-neutral-100 px-6 gap-6 text-xs font-semibold bg-white">
          <button
            type="button"
            onClick={() => {
              setActiveTab('profile');
              setFeedback(null);
            }}
            className={`py-3.5 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-400 hover:text-neutral-700'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>个人资料</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('security');
              setFeedback(null);
            }}
            className={`py-3.5 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-400 hover:text-neutral-700'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>密码与安全</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('roles');
              setFeedback(null);
            }}
            className={`py-3.5 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'roles'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-400 hover:text-neutral-700'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>矩阵权限体系</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          
          {feedback && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* TAB 1: PROFILE EDIT */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-neutral-50 border border-neutral-100">
                <img
                  src={avatarUrl}
                  alt="avatar preview"
                  className="w-14 h-14 rounded-2xl object-cover bg-neutral-200 border border-neutral-300"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 space-y-1">
                  <div className="text-xs font-semibold text-neutral-800">自定义头像</div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRandomAvatar}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 flex items-center gap-1 transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      随机生成
                    </button>
                    <span className="text-[11px] text-neutral-400">基于 Dicebear 生成密态数字形象</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">
                    创作者昵称
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:bg-white focus:border-neutral-900"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">
                    所属团队 / 部门
                  </label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="如：数码自媒体矩阵组"
                    className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:bg-white focus:border-neutral-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">
                    联系电话 (可选)
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="如：13800000000"
                    className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:bg-white focus:border-neutral-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">
                    系统登录用户名
                  </label>
                  <input
                    type="text"
                    value={user.username}
                    disabled
                    className="w-full px-3 py-2 text-xs bg-neutral-100 text-neutral-500 border border-neutral-200 rounded-xl cursor-not-allowed font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  创作者个人简介
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="介绍您的创作领域或团队矩阵职能..."
                  className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:bg-white focus:border-neutral-900 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold transition-all shadow-xs disabled:opacity-50"
                >
                  {isLoading ? '保存中...' : '保存修改'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: SECURITY & PASSWORD */}
          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-amber-700" />
                  <span>密码安全建议</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  修改密码后，您当前设备仍保持有效，其他远程登录会话将在 24 小时内失效重新要求登录。
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  当前原密码
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="输入当前使用的密码"
                  className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:bg-white focus:border-neutral-900"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">
                    新密码 (不少于6位)
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="输入新密码"
                    className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:bg-white focus:border-neutral-900"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">
                    再次确认新密码
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="再次输入新密码"
                    className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:bg-white focus:border-neutral-900"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold transition-all shadow-xs disabled:opacity-50"
                >
                  {isLoading ? '更新中...' : '确认更新密码'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: ROLE PERMISSIONS */}
          {activeTab === 'roles' && (
            <div className="space-y-3">
              <div className="text-xs text-neutral-600 mb-2">
                当前账号在企业矩阵分发系统中的分级权限体系：
              </div>

              {[
                {
                  id: 'admin',
                  name: '超级架构师 (Admin)',
                  isCurrent: user.role === 'admin',
                  rights: ['管理所有矩阵账号与凭证', '调整 Playwright RPA 与 Worker 架构', '用户体系增删与权限重置', '查看系统底层运行日志与加密秘钥']
                },
                {
                  id: 'operator',
                  name: '矩阵运营官 (Operator)',
                  isCurrent: user.role === 'operator',
                  rights: ['全平台账号批量分发', '防风控错峰调度参数设定', '排期日历全局拖拽重排', '账号分组与批量健康自检']
                },
                {
                  id: 'creator',
                  name: '内容创作者 (Creator)',
                  isCurrent: user.role === 'creator',
                  rights: ['多平台内容创作与富文本排版', '合规检测与敏感词一键脱敏', '查看个人发布任务与执行进度', '自备平台账号扫码登录接入']
                }
              ].map((role) => (
                <div
                  key={role.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    role.isCurrent
                      ? 'bg-blue-50/60 border-blue-200'
                      : 'bg-neutral-50/50 border-neutral-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-900">{role.name}</span>
                      {role.isCurrent && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600 text-white font-semibold">
                          当前您的角色
                        </span>
                      )}
                    </div>
                  </div>
                  <ul className="space-y-1">
                    {role.rights.map((r, i) => (
                      <li key={i} className="text-xs text-neutral-600 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Modal Footer with Logout */}
        <div className="p-4 border-t border-neutral-100 bg-neutral-50/80 flex items-center justify-between">
          <div className="text-[11px] text-neutral-400 font-mono">
            注册时间：{new Date(user.createdAt).toLocaleDateString()}
          </div>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('确定要退出登录吗？您将返回登录页面。')) {
                onLogout();
                onClose();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>退出当前账号</span>
          </button>
        </div>

      </div>
    </div>
  );
};

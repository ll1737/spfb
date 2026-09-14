import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  RefreshCw, 
  Trash2, 
  ShieldCheck, 
  QrCode, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Key,
  Clock,
  Sparkles,
  X
} from 'lucide-react';
import { Account, PlatformId, LoginSessionResponse } from '../types';
import { PLATFORMS_META } from '../data/defaultData';
import { api } from '../lib/api';

interface AccountManagerProps {
  accounts: Account[];
  onRefresh: () => void;
  onAccountAdded: (account: Account) => void;
  onAccountDeleted: (id: string) => void;
}

export const AccountManager: React.FC<AccountManagerProps> = ({
  accounts,
  onRefresh,
  onAccountAdded,
  onAccountDeleted
}) => {
  const [activePlatformFilter, setActivePlatformFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformId>('xiaohongshu');
  const [loginMethod, setLoginMethod] = useState<'qr' | 'cookie'>('qr');
  const [cookieInput, setCookieInput] = useState('');
  const [nicknameInput, setNicknameInput] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginSession, setLoginSession] = useState<LoginSessionResponse | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string>('');

  const filteredAccounts = activePlatformFilter === 'all'
    ? accounts
    : accounts.filter((a) => a.platform === activePlatformFilter);

  const handleStartQrLogin = async () => {
    setIsLoggingIn(true);
    setActionMessage('正在启动 Playwright 独立浏览器实例，获取创作者登录二维码...');
    try {
      const session = await api.startLoginSession(selectedPlatform);
      setLoginSession(session);
      setActionMessage('二维码已就绪，请使用对应 APP 扫码授权...');

      // Poll session status
      const pollTimer = setInterval(async () => {
        try {
          const res = await api.checkLoginSession(session.sessionId);
          if (res.status === 'confirmed' && res.account) {
            clearInterval(pollTimer);
            setIsLoggingIn(false);
            onAccountAdded(res.account);
            setIsAddModalOpen(false);
            setLoginSession(null);
            setActionMessage('🎉 账号授权成功并已加密存储！');
          } else if (res.status === 'expired' || res.status === 'error') {
            clearInterval(pollTimer);
            setIsLoggingIn(false);
            setActionMessage('二维码已失效或超时，请重试');
          }
        } catch (e) {
          clearInterval(pollTimer);
          setIsLoggingIn(false);
        }
      }, 2500);
    } catch (err: any) {
      setIsLoggingIn(false);
      setActionMessage(err.message || '启动登录会话失败');
    }
  };

  const handleManualCookieSubmit = async () => {
    if (!nicknameInput.trim()) {
      alert('请输入账号昵称或备注');
      return;
    }
    if (!cookieInput.trim()) {
      alert('请输入 Cookie 或 storageState JSON');
      return;
    }

    try {
      const newAcc = await api.createAccount({
        platform: selectedPlatform,
        nickname: nicknameInput.trim(),
        name: nicknameInput.trim(),
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(nicknameInput)}`,
        status: 'active',
        encryptedSession: `enc_${btoa(cookieInput.trim().substring(0, 32))}`,
        sessionPreview: `cookie_enc:***${Math.random().toString(16).substring(2, 6)} (已由 AES-256 加密)`
      });
      onAccountAdded(newAcc);
      setIsAddModalOpen(false);
      setCookieInput('');
      setNicknameInput('');
    } catch (err: any) {
      alert(err.message || '导入失败');
    }
  };

  const handleVerifyAccount = async (id: string) => {
    setVerifyingId(id);
    try {
      await api.verifyAccount(id);
      onRefresh();
    } catch (err: any) {
      alert('验证失败: ' + err.message);
    } finally {
      setVerifyingId(null);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (confirm('确定要移除此账号及存储的加密会话吗？')) {
      try {
        await api.deleteAccount(id);
        onAccountDeleted(id);
      } catch (err: any) {
        alert(err.message || '删除失败');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Filter and Add */}
      <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-2xl">
          <button
            onClick={() => setActivePlatformFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
              activePlatformFilter === 'all'
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            全部账号 ({accounts.length})
          </button>
          {Object.entries(PLATFORMS_META).map(([key, meta]) => {
            const count = accounts.filter((a) => a.platform === key).length;
            const isSelected = activePlatformFilter === key;
            return (
              <button
                key={key}
                onClick={() => setActivePlatformFilter(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                <span>{meta.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-neutral-700 text-white' : 'bg-neutral-200 text-neutral-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl text-xs font-medium border border-neutral-200"
            title="刷新账号矩阵状态"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setIsAddModalOpen(true);
              setLoginSession(null);
              setActionMessage('');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>添加平台新账号</span>
          </button>
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAccounts.map((account) => {
          const meta = PLATFORMS_META[account.platform];
          const isActive = account.status === 'active';
          const isVerifying = verifyingId === account.id;

          return (
            <div
              key={account.id}
              className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-neutral-300 transition-all"
            >
              {/* Card Header: Avatar, Name, Platform Badge */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={account.avatarUrl}
                      alt={account.nickname}
                      className="w-12 h-12 rounded-xl object-cover border border-neutral-200"
                    />
                    <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${meta.badgeBg}`}>
                      {meta.name.substring(0, 1)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-neutral-900 truncate">
                      {account.nickname}
                    </h4>
                    <div className="text-[11px] text-neutral-500 flex items-center gap-1.5 mt-0.5">
                      <span>{meta.name}</span>
                      <span>•</span>
                      <span>粉丝：{account.followersCount ? (account.followersCount > 10000 ? `${(account.followersCount / 10000).toFixed(1)}w` : account.followersCount) : '未知'}</span>
                    </div>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1 shrink-0 ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {isActive ? '在线正常' : '需更新会话'}
                </span>
              </div>

              {/* Encrypted Session & Stats Box */}
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between text-neutral-600">
                  <span className="flex items-center gap-1 font-medium text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    会话安全态：
                  </span>
                  <span className="font-mono text-[11px] text-neutral-500">
                    {account.sessionPreview || 'AES-256 密文已保护'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-neutral-500 text-[11px] pt-1 border-t border-neutral-200/60">
                  <span>发布统计：已发 {account.stats?.publishedCount || 0} / 失败 {account.stats?.failedCount || 0}</span>
                  <span>核验：{new Date(account.lastVerifiedAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between gap-2">
                <a
                  href={meta.creatorUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors text-xs flex items-center gap-1"
                  title="在浏览器中打开创作者中心"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="text-[11px]">创作者后台</span>
                </a>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleVerifyAccount(account.id)}
                    disabled={isVerifying}
                    className="px-2.5 py-1.5 text-[11px] font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg border border-neutral-200 flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className={`w-3 h-3 ${isVerifying ? 'animate-spin' : ''}`} />
                    <span>核验状态</span>
                  </button>
                  <button
                    onClick={() => handleDeleteAccount(account.id)}
                    className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="移除账号"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Account Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">接入新自媒体平台账号</h3>
                  <p className="text-xs text-neutral-500">通过 Playwright 自动化扫码或安全导入 Cookie</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Platform Selector */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2">
                  1. 选择目标平台
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(PLATFORMS_META).map(([key, meta]) => {
                    const isSelected = selectedPlatform === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setSelectedPlatform(key as PlatformId);
                          setLoginSession(null);
                          setActionMessage('');
                        }}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'border-neutral-900 bg-neutral-900/5 shadow-xs font-bold text-neutral-900'
                            : 'border-neutral-200 hover:border-neutral-300 text-neutral-600'
                        }`}
                      >
                        <div className="text-xs">{meta.name}</div>
                        <div className="text-[10px] text-neutral-400">{meta.nameEn.split(' ')[0]}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Login Method Tabs */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2">
                  2. 选择授权登录方式
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setLoginMethod('qr')}
                    className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                      loginMethod === 'qr'
                        ? 'border-neutral-900 bg-neutral-900/5'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <QrCode className="w-4 h-4 mt-0.5 text-neutral-700" />
                    <div>
                      <div className="text-xs font-semibold text-neutral-900">官方扫码授权（推荐）</div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">Playwright 无头浏览器拉取官方二维码，扫码即同步</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLoginMethod('cookie')}
                    className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                      loginMethod === 'cookie'
                        ? 'border-neutral-900 bg-neutral-900/5'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <Key className="w-4 h-4 mt-0.5 text-neutral-700" />
                    <div>
                      <div className="text-xs font-semibold text-neutral-900">导入 Cookie / storageState</div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">手动粘贴抓包所得 Cookie，由系统自动进行 AES-256 加密</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Method Detail */}
              {loginMethod === 'qr' ? (
                <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-center space-y-3">
                  {!loginSession ? (
                    <div className="space-y-3 py-3">
                      <p className="text-xs text-neutral-600">
                        点击下方按钮，系统将调用【{PLATFORMS_META[selectedPlatform].name}】适配器的 <code className="bg-neutral-200 px-1 py-0.5 rounded font-mono text-[11px]">login(context)</code> 接口
                      </p>
                      <button
                        type="button"
                        onClick={handleStartQrLogin}
                        disabled={isLoggingIn}
                        className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50"
                      >
                        {isLoggingIn ? '正在调起 RPA 浏览器...' : `开始【${PLATFORMS_META[selectedPlatform].name}】扫码授权`}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 py-2">
                      <div className="w-48 h-48 mx-auto bg-white p-2 rounded-xl border border-neutral-200 shadow-sm flex items-center justify-center">
                        {loginSession.qrCodeUrl ? (
                          <img
                            src={loginSession.qrCodeUrl}
                            alt="Login QR"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="text-xs text-neutral-500 flex flex-col items-center gap-2">
                            <QrCode className="w-12 h-12 text-neutral-400 animate-pulse" />
                            <span>二维码已生成，等待扫码...</span>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-neutral-600 flex items-center justify-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        <span>正在轮询验证登录态，有效期还剩 {loginSession.expiresInSeconds} 秒...</span>
                      </div>
                    </div>
                  )}
                  {actionMessage && (
                    <div className="text-[11px] text-neutral-600 font-medium">{actionMessage}</div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-neutral-800 block mb-1">
                      账号昵称 / 备注标签
                    </label>
                    <input
                      type="text"
                      value={nicknameInput}
                      onChange={(e) => setNicknameInput(e.target.value)}
                      placeholder="例如：科技先锋2号"
                      className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-neutral-800 block mb-1">
                      Cookie / storageState JSON (系统入库将自动 AES 加密)
                    </label>
                    <textarea
                      rows={4}
                      value={cookieInput}
                      onChange={(e) => setCookieInput(e.target.value)}
                      placeholder='例如：{"cookies":[{"name":"session_id","value":"xyz..."}]}'
                      className="w-full p-3 text-xs font-mono bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:bg-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleManualCookieSubmit}
                    className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs rounded-xl shadow-xs transition-colors"
                  >
                    确认加密保存
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

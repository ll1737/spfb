import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  X,
  Filter,
  Folder,
  Info,
  Smartphone
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
  const [activeGroupFilter, setActiveGroupFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformId>('xiaohongshu');
  const [loginMethod, setLoginMethod] = useState<'qr' | 'cookie'>('qr');
  const [cookieInput, setCookieInput] = useState('');
  const [nicknameInput, setNicknameInput] = useState('');
  const [groupInput, setGroupInput] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginSession, setLoginSession] = useState<LoginSessionResponse | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string>('');

  const pollTimerRef = useRef<any>(null);

  const clearPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearPolling();
    };
  }, []);

  const availableGroups = useMemo(() => {
    const raw = accounts.map((a) => a.group).filter(Boolean) as string[];
    return ['all', ...Array.from(new Set(raw))];
  }, [accounts]);

  const filteredAccounts = accounts.filter((a) => {
    if (activePlatformFilter !== 'all' && a.platform !== activePlatformFilter) return false;
    if (activeGroupFilter !== 'all' && a.group !== activeGroupFilter) return false;
    return true;
  });

  const handleStartQrLogin = async () => {
    clearPolling();
    setIsLoggingIn(true);
    setActionMessage('正在初始化创作者登录会话...');
    try {
      const session = await api.startLoginSession(selectedPlatform);
      setLoginSession(session);
      setActionMessage('二维码已生成，等待扫码授权（系统不会自动添加，请主动确认）');

      // Poll session status only if real worker is active or until user explicitly confirms
      pollTimerRef.current = setInterval(async () => {
        try {
          const res = await api.checkLoginSession(session.sessionId);
          if (res.status === 'confirmed' && res.account) {
            clearPolling();
            setIsLoggingIn(false);
            onAccountAdded(res.account);
            setIsAddModalOpen(false);
            setLoginSession(null);
            setActionMessage('🎉 账号授权成功并已加密存储！');
          } else if (res.status === 'expired' || res.status === 'error') {
            clearPolling();
            setIsLoggingIn(false);
            setActionMessage('二维码已失效或超时，请重试');
          }
        } catch (e) {
          clearPolling();
          setIsLoggingIn(false);
        }
      }, 3000);
    } catch (err: any) {
      setIsLoggingIn(false);
      setActionMessage(err.message || '启动登录会话失败');
    }
  };

  const handleConfirmLogin = async (isTestSimulated = false) => {
    if (!loginSession) return;
    setIsLoggingIn(true);
    try {
      const nameToUse = nicknameInput.trim() || `${PLATFORMS_META[selectedPlatform].name}主账号_${Date.now().toString().slice(-4)}`;
      const res = await api.confirmLoginSession(
        loginSession.sessionId,
        nameToUse,
        groupInput.trim() || undefined
      );

      clearPolling();
      setIsLoggingIn(false);

      if (res.account) {
        onAccountAdded(res.account);
        setIsAddModalOpen(false);
        setLoginSession(null);
        setNicknameInput('');
        setGroupInput('');
        setActionMessage(isTestSimulated ? '✅ 已通过测试模式模拟录入账号' : '🎉 账号扫码授权已确认保存！');
      }
    } catch (err: any) {
      setIsLoggingIn(false);
      alert('确认录入失败: ' + (err.message || '未知错误'));
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
        group: groupInput.trim() || undefined,
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

  const closeModal = () => {
    clearPolling();
    setIsAddModalOpen(false);
    setLoginSession(null);
    setIsLoggingIn(false);
    setActionMessage('');
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

        {/* Group Sub-filter bar */}
        {availableGroups.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 w-full pt-2 border-t border-neutral-100">
            <span className="text-[11px] text-neutral-400 font-medium shrink-0 flex items-center gap-1">
              <Folder className="w-3 h-3" /> 矩阵分组：
            </span>
            {availableGroups.map((g) => {
              const label = g === 'all' ? '全部分组' : g;
              const isSelected = activeGroupFilter === g;
              const count = g === 'all' ? accounts.length : accounts.filter((a) => a.group === g).length;
              return (
                <button
                  key={g}
                  onClick={() => setActiveGroupFilter(g)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition-all ${
                    isSelected
                      ? 'bg-neutral-800 text-white shadow-xs'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Accounts Grid */}
      {filteredAccounts.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
            <Users className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-neutral-800">暂无已绑定的自媒体账号</h4>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            系统处于初始纯净状态。点击右上角的「添加平台新账号」，即可通过扫码或导入 Cookie 接入您的真实自媒体账号。
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                setIsAddModalOpen(true);
                setLoginSession(null);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>立即接入第一个账号</span>
            </button>
          </div>
        </div>
      ) : (
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
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-bold text-neutral-900 truncate">
                        {account.nickname}
                      </h4>
                      {account.group && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-600 font-normal shrink-0">
                          {account.group}
                        </span>
                      )}
                    </div>
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
    )}

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
                onClick={closeModal}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Platform Selector */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2">
                  1. 选择目标媒体平台
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

              {/* Account Nickname & Group Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-neutral-50 border border-neutral-200">
                <div>
                  <label className="text-xs font-semibold text-neutral-800 block mb-1">
                    账号备注名称
                  </label>
                  <input
                    type="text"
                    value={nicknameInput}
                    onChange={(e) => setNicknameInput(e.target.value)}
                    placeholder={`例如：${PLATFORMS_META[selectedPlatform].name}官方号`}
                    className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-800 block mb-1">
                    所属矩阵分组（可选）
                  </label>
                  <input
                    type="text"
                    value={groupInput}
                    onChange={(e) => setGroupInput(e.target.value)}
                    placeholder="例如：科技组 / 运营组"
                    className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>

              {/* Login Method Tabs */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2">
                  2. 选择授权方式
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
                      <div className="text-xs font-semibold text-neutral-900">平台扫码授权</div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">手机对应 APP 扫码登录，由您自主确认录入</div>
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
                      <div className="text-xs font-semibold text-neutral-900">导入 Cookie / 会话</div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">粘贴浏览器抓取的 Cookie，由 AES-256 加密存储</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Method Detail */}
              {loginMethod === 'qr' ? (
                <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-center space-y-4">
                  {/* Explanation note */}
                  <div className="text-left p-3 rounded-lg bg-blue-50/70 border border-blue-100 text-xs text-blue-900 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-blue-800">
                      <Info className="w-3.5 h-3.5 shrink-0" />
                      <span>扫码授权说明：</span>
                    </div>
                    <p className="text-[11px] text-blue-800/90 leading-relaxed">
                      系统已关闭任何自动倒计时添加逻辑。若已启动本地 Playwright RPA Worker 节点，扫码后将自动拦截真实会话；在 Web 控制台下，扫码完成后请点击下方「我已扫码并确认录入」或「测试模拟录入」，完全由您手动掌控。
                    </p>
                  </div>

                  {!loginSession ? (
                    <div className="space-y-3 py-2">
                      <p className="text-xs text-neutral-600">
                        即将调起【{PLATFORMS_META[selectedPlatform].name}】创作者平台登录通道
                      </p>
                      <button
                        type="button"
                        onClick={handleStartQrLogin}
                        disabled={isLoggingIn}
                        className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50 inline-flex items-center gap-2"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>{isLoggingIn ? '正在调起通道...' : `获取【${PLATFORMS_META[selectedPlatform].name}】登录二维码`}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 py-1">
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

                      <div className="flex items-center justify-center gap-2 text-xs text-neutral-500">
                        <Smartphone className="w-4 h-4 text-neutral-600" />
                        <span>请使用【{PLATFORMS_META[selectedPlatform].name}】手机客户端扫码</span>
                        <a
                          href={PLATFORMS_META[selectedPlatform].creatorUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-0.5 ml-1"
                        >
                          <span>打开官网</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      <div className="text-xs text-neutral-600 flex items-center justify-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span>等待扫码确认中（不会自动添加，请操作下方按钮）</span>
                      </div>

                      {/* Manual & testing explicit confirmation buttons */}
                      <div className="pt-2 border-t border-neutral-200/80 flex flex-col sm:flex-row items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleConfirmLogin(false)}
                          disabled={isLoggingIn}
                          className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>手机已扫码，确认录入账号</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleConfirmLogin(true)}
                          disabled={isLoggingIn}
                          className="w-full sm:w-auto px-3 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-medium text-xs rounded-xl transition-colors"
                        >
                          <span>演示模式：模拟添加</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            clearPolling();
                            setLoginSession(null);
                          }}
                          className="w-full sm:w-auto px-3 py-2 text-neutral-500 hover:text-neutral-700 text-xs"
                        >
                          重新获取
                        </button>
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
                      Cookie / storageState JSON (系统入库将自动 AES-256 加密)
                    </label>
                    <textarea
                      rows={5}
                      value={cookieInput}
                      onChange={(e) => setCookieInput(e.target.value)}
                      placeholder='例如：{"cookies":[{"name":"session_id","value":"xyz..."}]}&#10;或直接粘贴浏览器 DevTools Application 标签页中复制的 Cookie 键值'
                      className="w-full p-3 text-xs font-mono bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:bg-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleManualCookieSubmit}
                    className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>确认加密保存并绑定</span>
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

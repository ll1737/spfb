import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  Mail,
  User as UserIcon,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Eye,
  EyeOff,
  Layers,
  Building,
  AlertCircle,
  Cpu,
  Radio,
  UserPlus
} from 'lucide-react';
import { User, UserRole, LoginPayload, RegisterPayload } from '../types';
import { api } from '../lib/api';

interface AuthPageProps {
  onLoginSuccess: (user: User) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [hasRegisteredUsers, setHasRegisteredUsers] = useState<boolean | null>(null);

  // Login Form States (Prefilled with default credentials)
  const [loginAccount, setLoginAccount] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('123456');
  const [rememberMe, setRememberMe] = useState(true);

  // Register Form States
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regNickname, setRegNickname] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('admin');
  const [regTeamName, setRegTeamName] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Check auth status on mount to direct new user to registration or preset login
  useEffect(() => {
    let isMounted = true;
    api.getAuthStatus().then((status) => {
      if (!isMounted) return;
      setHasRegisteredUsers(status.hasUsers);
      if (!status.hasUsers) {
        setMode('register');
      } else {
        setMode('login');
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '无', color: 'bg-neutral-200' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd) || /[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { score: 1, label: '弱 (建议补充数字或符号)', color: 'bg-rose-500 text-rose-600' };
    if (score <= 2) return { score: 2, label: '良好', color: 'bg-amber-500 text-amber-600' };
    return { score: 3, label: '强 (高强度防护)', color: 'bg-emerald-500 text-emerald-600' };
  };

  const strength = getPasswordStrength(regPassword);

  // Submit Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!loginAccount.trim()) {
      setErrorMessage('请输入登录账号或邮箱');
      return;
    }
    if (!loginPassword) {
      setErrorMessage('请输入登录密码');
      return;
    }

    setIsLoading(true);
    try {
      const payload: LoginPayload = {
        account: loginAccount.trim(),
        password: loginPassword,
        rememberMe
      };
      const res = await api.login(payload);
      setSuccessMessage('登录成功，正在进入多平台分发工作台...');
      setTimeout(() => {
        onLoginSuccess(res.user);
      }, 400);
    } catch (err: any) {
      setErrorMessage(err.message || '登录失败，请检查账号密码');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Register
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!regUsername.trim() || regUsername.trim().length < 3) {
      setErrorMessage('用户名至少需要 3 个字符（支持英文与数字）');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setErrorMessage('请输入有效的工作邮箱或常用邮箱');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setErrorMessage('登录密码长度不能少于 6 位');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage('两次输入的密码不一致，请仔细核对');
      return;
    }
    if (!agreeTerms) {
      setErrorMessage('请先阅读并勾选同意平台使用协议');
      return;
    }

    setIsLoading(true);
    try {
      const payload: RegisterPayload = {
        username: regUsername.trim(),
        email: regEmail.trim(),
        nickname: regNickname.trim() || regUsername.trim(),
        password: regPassword,
        role: regRole,
        teamName: regTeamName.trim()
      };
      const res = await api.register(payload);
      setSuccessMessage('注册成功！已为您生成密钥凭证并自动登录');
      setTimeout(() => {
        onLoginSuccess(res.user);
      }, 500);
    } catch (err: any) {
      setErrorMessage(err.message || '注册失败，请更换用户名或稍后再试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background Ambience / Subtle Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[300px] bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-5xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10">
        
        {/* Left Hero & Feature Showcase Column (40% desktop) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-8 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-neutral-800 relative">
          <div className="space-y-6">
            {/* Logo & Brand Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-1.5">
                  <span>多平台一键发布矩阵</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-mono">
                    v2.4
                  </span>
                </h2>
                <p className="text-xs text-neutral-400">Multi-Publish Control Hub</p>
              </div>
            </div>

            {/* Value Proposition */}
            <div className="space-y-2 pt-2">
              <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                一个终端，一键调度 8 大主流社交媒体
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                面向自媒体创作者与企业新媒体矩阵团队，提供端到端自动化排版、密态会话托管与合规风控分发。
              </p>
            </div>

            {/* Key Platform Badges */}
            <div className="pt-2">
              <div className="text-[11px] font-semibold text-neutral-400 mb-2 flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-emerald-400" /> 已原生支持的媒体矩阵：
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { name: '抖音短视频', tag: '创作者后台' },
                  { name: '小红书笔记', tag: '图文/视频' },
                  { name: '新浪微博', tag: '博文/话题' },
                  { name: '微信公众号', tag: '草稿/图文' },
                  { name: '快手创作者', tag: '双列信息流' },
                  { name: '哔哩哔哩', tag: '专栏/动态' },
                  { name: '知乎专栏', tag: '回答/文章' },
                  { name: '今日头条', tag: '微头条/文章' }
                ].map((item) => (
                  <div
                    key={item.name}
                    className="p-2 rounded-xl bg-neutral-900/90 border border-neutral-800 flex items-center justify-between text-neutral-300"
                  >
                    <span className="font-medium text-xs text-neutral-200">{item.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400">
                      {item.tag}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Architecture Highlights */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-start gap-2.5 text-xs text-neutral-300">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>AES-256-GCM 硬件密态凭证，Session 与 Cookie 本地安全隔离</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-neutral-300">
                <Cpu className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>Playwright 浏览器自动化集群驱动，支持错峰与多账号并发调度</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-neutral-300">
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span>内容合规雷达 + 防关联错峰发布调度，规避平台群控限流</span>
              </div>
            </div>
          </div>

          {/* Bottom Trust Stat */}
          <div className="mt-8 pt-4 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-500">
            <span>安全认证平台</span>
            <span className="font-mono">Ready for Multi-Tenant</span>
          </div>
        </div>

        {/* Right Form Column (60% desktop) */}
        <div className="lg:col-span-7 p-6 sm:p-10 bg-neutral-900 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-6">
            
            {/* Segmented Mode Switcher */}
            <div className="flex bg-neutral-950 p-1 rounded-2xl border border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  mode === 'login'
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                账号密码登录
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  mode === 'register'
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                新创作者注册
              </button>
            </div>

            {/* Fresh State Notification Banner */}
            {hasRegisteredUsers === false && (
              <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-800/60 text-blue-300 text-xs flex items-center gap-2.5">
                <UserPlus className="w-4 h-4 text-blue-400 shrink-0" />
                <span>测试数据已清空。当前系统为纯净初始状态，请注册您的首个主创/管理账号。</span>
              </div>
            )}

            {/* Error or Success Alert */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="flex-1">{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="flex-1">{successMessage}</span>
              </div>
            )}

            {/* Mode 1: LOGIN FORM */}
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Default Preset Account Prompt Card */}
                <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-800/60 text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-blue-200 min-w-0">
                    <Shield className="w-4 h-4 text-blue-400 shrink-0" />
                    <div className="text-xs truncate">
                      <span className="text-neutral-400">已为您配置管理员：</span>
                      <strong className="text-white font-mono bg-blue-900/50 px-1.5 py-0.5 rounded ml-1">admin</strong>
                      <span className="text-neutral-400 ml-2">密码：</span>
                      <strong className="text-white font-mono bg-blue-900/50 px-1.5 py-0.5 rounded ml-1">123456</strong>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginAccount('admin');
                      setLoginPassword('123456');
                      setErrorMessage('');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-blue-600/40 hover:bg-blue-600/70 text-blue-200 hover:text-white text-[11px] font-medium transition-colors shrink-0"
                  >
                    一键填入
                  </button>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                    登录用户名 或 电子邮箱
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      type="text"
                      value={loginAccount}
                      onChange={(e) => setLoginAccount(e.target.value)}
                      placeholder="请输入用户名或注册邮箱"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs sm:text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-neutral-300">
                      账户密码
                    </label>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="请输入登录密码"
                      className="w-full pl-10 pr-10 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs sm:text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-neutral-400 hover:text-neutral-300">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-neutral-700 bg-neutral-950 text-blue-600 focus:ring-0 focus:ring-offset-0"
                    />
                    <span>保持登录状态 (30天免密)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setErrorMessage('如遗忘密码，请联系您团队的管理员在个人中心重置，或重新注册新账号')}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    忘记密码？
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>验证凭证并进入工作台</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Mode 2: REGISTER FORM */}
            {mode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">
                      用户名 (唯一账号)
                    </label>
                    <div className="relative">
                      <UserIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                      <input
                        type="text"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        placeholder="如 matrix_user"
                        className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">
                      显示昵称 / 主理人姓名
                    </label>
                    <input
                      type="text"
                      value={regNickname}
                      onChange={(e) => setRegNickname(e.target.value)}
                      placeholder="如 极客科技说"
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">
                      工作邮箱
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">
                      所属团队 / 工作室
                    </label>
                    <div className="relative">
                      <Building className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                      <input
                        type="text"
                        value={regTeamName}
                        onChange={(e) => setRegTeamName(e.target.value)}
                        placeholder="团队或项目名称"
                        className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Role selection */}
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    系统权限角色
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'creator', label: '内容创作者', desc: '创作与分发' },
                      { id: 'operator', label: '矩阵运营官', desc: '多号群控' },
                      { id: 'admin', label: '系统架构师', desc: '最高权限' }
                    ].map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRegRole(r.id as UserRole)}
                        className={`p-2 rounded-xl text-left border transition-all ${
                          regRole === r.id
                            ? 'bg-blue-950/40 border-blue-500 text-white'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                        }`}
                      >
                        <div className="text-xs font-bold text-neutral-200">{r.label}</div>
                        <div className="text-[10px] text-neutral-400">{r.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Password Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">
                      设置登录密码 (≥6位)
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="输入密码"
                        className="w-full pl-9 pr-8 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">
                      确认密码
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="再次确认密码"
                        className="w-full pl-9 pr-8 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200"
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Password Strength Indicator */}
                {regPassword && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-neutral-400">密码安全度：</span>
                      <span className={strength.color.split(' ')[1] || 'text-neutral-400'}>
                        {strength.label}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden flex gap-1">
                      <div className={`h-full flex-1 ${strength.score >= 1 ? strength.color.split(' ')[0] : 'bg-neutral-800'}`} />
                      <div className={`h-full flex-1 ${strength.score >= 2 ? strength.color.split(' ')[0] : 'bg-neutral-800'}`} />
                      <div className={`h-full flex-1 ${strength.score >= 3 ? strength.color.split(' ')[0] : 'bg-neutral-800'}`} />
                    </div>
                  </div>
                )}

                {/* Terms agreement */}
                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-400">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="w-4 h-4 rounded border-neutral-700 bg-neutral-950 text-blue-600 focus:ring-0 focus:ring-offset-0"
                    />
                    <span>
                      我已仔细阅读并同意《平台矩阵安全规范》与《AES密态凭证托管声明》
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50 mt-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>完成注册并进入工作台</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Footer switcher hint */}
            <div className="text-center text-xs text-neutral-500 pt-2">
              {mode === 'login' ? (
                <p>
                  还没有账号？{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setErrorMessage('');
                    }}
                    className="text-blue-400 hover:text-blue-300 font-medium"
                  >
                    立即免费注册新创作者
                  </button>
                </p>
              ) : (
                <p>
                  已有账号？{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMessage('');
                    }}
                    className="text-blue-400 hover:text-blue-300 font-medium"
                  >
                    返回直接登录
                  </button>
                </p>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

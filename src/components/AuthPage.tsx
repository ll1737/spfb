import React, { useState, useEffect } from 'react';
import {
  Lock,
  User as UserIcon,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  Layers,
  Sparkles,
  ShieldCheck,
  Check,
  Zap,
  AlertCircle
} from 'lucide-react';
import { User, UserRole, LoginPayload, RegisterPayload } from '../types';
import { api } from '../lib/api';

interface AuthPageProps {
  onLoginSuccess: (user: User) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  // Login Form States
  const [loginAccount, setLoginAccount] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Register Form States
  const [regMode, setRegMode] = useState<'create_org' | 'join_org'>('create_org');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regNickname, setRegNickname] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('owner');
  const [regOrgName, setRegOrgName] = useState('');
  const [regOrgIndustry, setRegOrgIndustry] = useState('');
  const [regOrgLocation, setRegOrgLocation] = useState('');
  const [regBrandName, setRegBrandName] = useState('');
  const [regInviteCode, setRegInviteCode] = useState('');

  // Check auth status on mount
  useEffect(() => {
    let isMounted = true;
    api.getAuthStatus().then((status) => {
      if (!isMounted) return;
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

  // Submit Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!loginAccount.trim()) {
      setErrorMessage('请输入登录账号');
      return;
    }
    if (!loginPassword) {
      setErrorMessage('请输入密码');
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
      setSuccessMessage('登录成功，正在进入工作空间...');
      setTimeout(() => {
        onLoginSuccess(res.user);
      }, 400);
    } catch (err: any) {
      setErrorMessage(err.message || '登录失败，请核对账号与密码');
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
      setErrorMessage('用户名长度至少为 3 个字符');
      return;
    }
    if (!regNickname.trim()) {
      setErrorMessage('请输入展示昵称');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setErrorMessage('请输入真实有效的电子邮箱地址');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setErrorMessage('登录密码长度不能少于 6 位');
      return;
    }

    if (regMode === 'create_org' && !regOrgName.trim()) {
      setErrorMessage('请输入企业/组织全称');
      return;
    }

     if (regMode === 'join_org' && !regInviteCode.trim()) {
       setErrorMessage('请输入企业管理员提供的有效邀请码');
      return;
    }

    setIsLoading(true);
    try {
      const payload: RegisterPayload = {
        username: regUsername.trim(),
        email: regEmail.trim(),
        nickname: regNickname.trim(),
        password: regPassword,
        role: regMode === 'create_org' ? 'owner' : regRole,
        registerMode: regMode,
        enterpriseName: regOrgName.trim(),
        enterpriseIndustry: regOrgIndustry.trim(),
        enterpriseLocation: regOrgLocation.trim(),
        brandName: regBrandName.trim(),
        inviteCode: regInviteCode.trim()
      };
      const res = await api.register(payload);
      setSuccessMessage('企业与团队初始化完成，正在进入工作空间...');
      setTimeout(() => {
        onLoginSuccess(res.user);
      }, 500);
    } catch (err: any) {
      setErrorMessage(err.message || '注册失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const platforms = [
    { name: '小红书', tag: 'xhs', bg: 'bg-[#ff2442]' },
    { name: '抖音', tag: 'dy', bg: 'bg-[#1e1e24]' },
    { name: '微信公众号', tag: 'wx', bg: 'bg-[#07c160]' },
    { name: '视频号', tag: 'sph', bg: 'bg-[#fa9d3b]' },
    { name: '哔哩哔哩', tag: 'bili', bg: 'bg-[#fb7299]' },
    { name: '知乎', tag: 'zh', bg: 'bg-[#0066ff]' },
    { name: '微博', tag: 'wb', bg: 'bg-[#eb182c]' },
    { name: '今日头条', tag: 'tt', bg: 'bg-[#ed4040]' }
  ];

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8 relative overflow-hidden select-none"
      style={{
        background: 'radial-gradient(circle at 50% 20%, #1f274a 0%, #11182c 45%, #0a0e1a 100%)'
      }}
    >
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <div className="relative w-full max-w-md bg-white border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
        {/* Left Side: Brand Showcase */}
        <div
          className="hidden"
          style={{
            background: 'linear-gradient(145deg, #182038 0%, #0d1222 100%)'
          }}
        >
          {/* Subtle decoration circles */}
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full border-[18px] border-white/[0.04] pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full border-[14px] border-indigo-500/[0.08] pointer-events-none" />

          {/* Brand Top */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 bg-gradient-to-br from-[#a891ff] via-[#6954ed] to-[#36c8bd]">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  智域
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-violet-500/40 text-violet-200 border border-violet-400/30">
                    AI
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4 my-8">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100">企业级多模态创作中枢</h4>
                  <p className="text-[11px] text-[#8e98b0] mt-0.5">
                    一键由选题派生母内容、多平台图文、配图与视频分镜。
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100">多角色权限与审批门禁</h4>
                  <p className="text-[11px] text-[#8e98b0] mt-0.5">
                    组织架构管理、主/子品牌矩阵与 AI+人工双重审核流。
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100">Playwright RPA 自动化发布</h4>
                  <p className="text-[11px] text-[#8e98b0] mt-0.5">
                    AES-256 加密存储凭据，多平台无感免登排期发布。
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Platform Matrix tags */}
          <div className="relative z-10 pt-4 border-t border-white/[0.08]">
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#737f9e] mb-2.5">
              已支持主流平台
            </div>
            <div className="flex flex-wrap gap-1.5">
              {platforms.map((p) => (
                <span
                  key={p.tag}
                  className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/[0.08] text-slate-200 border border-white/[0.06]"
                >
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Clean Form */}
        <div className="w-full p-6 sm:p-8 flex flex-col justify-between bg-white overflow-y-auto max-h-[90vh]">
          <div>
            <div className="flex flex-col items-center text-center mb-7">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 bg-gradient-to-br from-[#a891ff] via-[#6954ed] to-[#36c8bd]">
                <Layers className="w-6 h-6" />
              </div>
              <h1 className="mt-3 text-2xl font-black tracking-tight text-[#171c2d]">智域</h1>
              <p className="mt-1 text-xs text-[#75809a]">智能创作与多平台发布工作台</p>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center justify-center mb-6">
              <div className="flex p-1 rounded-xl bg-[#f0f2f7] border border-[#e4e7ef]">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage('');
                  }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    mode === 'login'
                      ? 'bg-white text-[#171c2d] shadow-sm'
                      : 'text-[#75809a] hover:text-[#171c2d]'
                  }`}
                >
                  账号登录
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMessage('');
                  }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    mode === 'register'
                      ? 'bg-white text-[#171c2d] shadow-sm'
                      : 'text-[#75809a] hover:text-[#171c2d]'
                  }`}
                >
                  企业注册 / 加入
                </button>
              </div>

            </div>

            {/* Error / Success Notice */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 animate-in fade-in duration-200">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Login Form */}
            {mode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#48536b] mb-1.5">
                    登录账号 / 邮箱
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-[#9aa2b4] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={loginAccount}
                      onChange={(e) => setLoginAccount(e.target.value)}
                      placeholder="用户名或邮箱"
                      className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-[#e2e6ef] bg-[#fafbfe] focus:bg-white focus:border-[#7258f5] focus:ring-3 focus:ring-[#7258f5]/10 outline-none text-xs text-[#171c2d] font-medium transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#48536b] mb-1.5">
                    登录密码
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#9aa2b4] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="请输入密码"
                      className="w-full h-11 pl-10 pr-10 rounded-xl border border-[#e2e6ef] bg-[#fafbfe] focus:bg-white focus:border-[#7258f5] focus:ring-3 focus:ring-[#7258f5]/10 outline-none text-xs text-[#171c2d] font-medium transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9aa2b4] hover:text-[#48536b]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 text-[#647087] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-[#cbd1df] text-[#7258f5] focus:ring-purple-500"
                    />
                    <span>保持登录状态</span>
                  </label>
                  <span className="text-[11px] text-[#9aa2b4]">请使用注册时设置的密码</span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 mt-4 rounded-xl text-white font-bold text-xs bg-gradient-to-r from-[#735af4] to-[#8876fa] hover:from-[#6549f0] hover:to-[#7966f7] shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>进入智域工作空间</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Register Form */
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                {/* Org sub-mode switcher */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl mb-2">
                  <button
                    type="button"
                    onClick={() => setRegMode('create_org')}
                    className={`py-1 text-xs font-bold rounded-lg transition-all ${
                      regMode === 'create_org' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    创建新企业 / 团队
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegMode('join_org')}
                    className={`py-1 text-xs font-bold rounded-lg transition-all ${
                      regMode === 'join_org' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    输入邀请码加入企业
                  </button>
                </div>

                {regMode === 'create_org' ? (
                  <div className="space-y-2.5 p-3 rounded-xl bg-purple-50/50 border border-purple-100">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">企业 / 组织全称</label>
                      <input
                        type="text"
                        value={regOrgName}
                        onChange={(e) => setRegOrgName(e.target.value)}
                        placeholder="请输入企业或组织全称"
                        className="w-full h-8 px-2.5 text-xs bg-white border border-purple-200 rounded-lg focus:outline-indigo-500"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">所属行业领域</label>
                        <input
                          type="text"
                          value={regOrgIndustry}
                          onChange={(e) => setRegOrgIndustry(e.target.value)}
                          placeholder="例如：科技、教育、消费品"
                          className="w-full h-8 px-2.5 text-xs bg-white border border-purple-200 rounded-lg focus:outline-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">首个主品牌名称</label>
                        <input
                          type="text"
                          value={regBrandName}
                          onChange={(e) => setRegBrandName(e.target.value)}
                          placeholder="请输入主品牌名称"
                          className="w-full h-8 px-2.5 text-xs bg-white border border-purple-200 rounded-lg focus:outline-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100">
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">企业专属邀请码</label>
                    <input
                      type="text"
                      value={regInviteCode}
                      onChange={(e) => setRegInviteCode(e.target.value)}
                        placeholder="请输入企业管理员提供的邀请码"
                      className="w-full h-8 px-2.5 text-xs font-mono bg-white border border-indigo-200 rounded-lg focus:outline-indigo-500"
                      required
                    />
                    <div className="mt-2">
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">申请加入角色</label>
                      <select
                        value={regRole}
                        onChange={(e) => setRegRole(e.target.value as UserRole)}
                        className="w-full h-8 px-2 text-xs bg-white border border-indigo-200 rounded-lg focus:outline-indigo-500"
                      >
                        <option value="operator">内容运营官 (负责选题与创作)</option>
                        <option value="asset_admin">AI资产专家 (负责Persona与记忆)</option>
                        <option value="publisher">发布专员 (负责账号与发布)</option>
                        <option value="reviewer">审核员 (负责合规复审)</option>
                        <option value="viewer">观察员 (仅看板查看)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* User Credentials */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-[#48536b] mb-0.5">登录用户名</label>
                    <input
                      type="text"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="operator1"
                      className="w-full h-8 px-2.5 rounded-lg border border-[#e2e6ef] bg-[#fafbfe] focus:bg-white focus:border-[#7258f5] outline-none text-xs text-[#171c2d]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#48536b] mb-0.5">展示姓名 / 昵称</label>
                    <input
                      type="text"
                      value={regNickname}
                      onChange={(e) => setRegNickname(e.target.value)}
                      placeholder="如: 陈晓琳"
                      className="w-full h-8 px-2.5 rounded-lg border border-[#e2e6ef] bg-[#fafbfe] focus:bg-white focus:border-[#7258f5] outline-none text-xs text-[#171c2d]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-[#48536b] mb-0.5">工作邮箱</label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                       placeholder="user@example.com"
                       className="w-full h-8 px-2.5 rounded-lg border border-[#e2e6ef] bg-[#fafbfe] focus:bg-white focus:border-[#7258f5] outline-none text-xs text-[#171c2d]"
                       required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#48536b] mb-0.5">登录密码</label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="不少于 6 位"
                      className="w-full h-8 px-2.5 rounded-lg border border-[#e2e6ef] bg-[#fafbfe] focus:bg-white focus:border-[#7258f5] outline-none text-xs text-[#171c2d]"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 mt-2 rounded-xl text-white font-bold text-xs bg-gradient-to-r from-[#735af4] to-[#8876fa] hover:from-[#6549f0] hover:to-[#7966f7] shadow-md shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{regMode === 'create_org' ? '创建企业并进入工作空间' : '加入企业并进入工作空间'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

           {/* Bottom Security Footer */}
           <div className="mt-6 pt-3 border-t border-[#f0f2f7] flex items-center justify-between text-[11px] text-[#9aa2b4]">
             <span />
             <span>智域 v2.4.0</span>
           </div>
        </div>
      </div>
    </div>
  );
};


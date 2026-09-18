import React, { useState } from 'react';
import {
  CreditCard,
  Zap,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Clock,
  QrCode,
  Check,
  X,
  AlertCircle,
  HelpCircle,
  Coins
} from 'lucide-react';

export interface PlanOption {
  id: string;
  name: string;
  badge?: string;
  priceMonthly: number;
  priceAnnual: number;
  description: string;
  features: string[];
  isPopular?: boolean;
  ctaText: string;
}

const PLANS: PlanOption[] = [
  {
    id: 'free',
    name: '免费体验版',
    priceMonthly: 0,
    priceAnnual: 0,
    description: '适用于个人创作者初步探索 AI 内容生产与单账号分发。',
    features: [
      '最多托管 2 个社交平台账号',
      '每月赠送 500 AI 算力积分',
      '单平台基础文案与图文生成',
      '社区工单支持',
      '基础发布任务排队'
    ],
    ctaText: '当前正在使用'
  },
  {
    id: 'pro',
    name: '专业创作者版 (Pro)',
    badge: '最受欢迎 · 主推',
    priceMonthly: 199,
    priceAnnual: 159,
    description: '面向全职自媒体人与工作室，提供全自动化母内容派生与矩阵分发。',
    features: [
      '最多托管 15 个全网社交平台账号',
      '每月 10,000 AI 算力积分 (支持视频分镜)',
      '3 位独立 AI 创作者空间 (Persona/记忆)',
      '多平台母内容 (Master Content) 自动派生',
      '违禁词实时风控诊断与一键净化',
      '优先发布调度通道与专属客服'
    ],
    isPopular: true,
    ctaText: '立即升级 Pro 版'
  },
  {
    id: 'team',
    name: '企业团队版 (Team)',
    priceMonthly: 599,
    priceAnnual: 479,
    description: '适用于新媒体运营团队与 MCN 机构，支持多成员协同与品牌资产库。',
    features: [
      '无限量托管社交平台账号 (50+ 账号)',
      '每月 40,000 AI 算力积分',
      '10 位 AI 创作者矩阵与专属知识库',
      '多成员权限协作与内容审批流',
      '品牌多媒体素材中心 (20GB 专属存储)',
      '全网矩阵数据回流与 Performance Memory 深度沉淀',
      '7x24 小时技术专属保障'
    ],
    ctaText: '升级企业团队版'
  },
  {
    id: 'enterprise',
    name: '集团私有化部署版',
    priceMonthly: 1999,
    priceAnnual: 1599,
    description: '面向大型品牌与金融/医疗企业，支持私有模型微调与专属 Worker 节点。',
    features: [
      '独立私有化服务器部署与专属算力集群',
      '企业专属私域模型微调与定制 Persona',
      '无限量 AI 算力与不限账号并发',
      '全链路审计日志与 SSO 单点登录对接',
      '1 对 1 架构师落地实施与定制开发'
    ],
    ctaText: '联系商务定制'
  }
];

interface CreditPackage {
  id: string;
  points: number;
  price: number;
  bonus: number;
  tag?: string;
}

const CREDIT_PACKAGES: CreditPackage[] = [
  { id: 'cp-10k', points: 10000, price: 69, bonus: 0 },
  { id: 'cp-50k', points: 50000, price: 299, bonus: 5000, tag: '超值特惠' },
  { id: 'cp-100k', points: 100000, price: 499, bonus: 20000, tag: '加赠20%' },
  { id: 'cp-500k', points: 500000, price: 1999, bonus: 150000, tag: '企业首选' }
];

export const PlansView: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [activeTab, setActiveTab] = useState<'plans' | 'credits' | 'logs'>('plans');
  const [currentCredits, setCurrentCredits] = useState<number>(3420);
  const [selectedPlan, setSelectedPlan] = useState<PlanOption | null>(null);
  const [selectedCreditPkg, setSelectedCreditPkg] = useState<CreditPackage | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'wechat' | 'alipay' | 'bank'>('wechat');
  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);

  // Mock Logs
  const [logs] = useState([
    { id: 'lg-1', date: '2026-09-18 10:15', task: '小红书图文笔记派生与封面生成', points: -15, balance: 3420 },
    { id: 'lg-2', date: '2026-09-17 18:30', task: '抖音 5 镜头分镜短视频渲染', points: -120, balance: 3435 },
    { id: 'lg-3', date: '2026-09-16 14:00', task: '月度会员权益赠送', points: +2000, balance: 3555 },
    { id: 'lg-4', date: '2026-09-15 09:20', task: '全网爆款选题雷达深度扫描', points: -10, balance: 1555 }
  ]);

  const handleOpenPlanPay = (plan: PlanOption) => {
    if (plan.id === 'free') return;
    setSelectedPlan(plan);
    setSelectedCreditPkg(null);
    setIsPaymentSuccess(false);
    setIsPayModalOpen(true);
  };

  const handleOpenCreditPay = (pkg: CreditPackage) => {
    setSelectedCreditPkg(pkg);
    setSelectedPlan(null);
    setIsPaymentSuccess(false);
    setIsPayModalOpen(true);
  };

  const handleConfirmPayment = () => {
    setTimeout(() => {
      if (selectedCreditPkg) {
        setCurrentCredits((prev) => prev + selectedCreditPkg.points + selectedCreditPkg.bonus);
      } else if (selectedPlan) {
        setCurrentCredits((prev) => prev + 10000);
      }
      setIsPaymentSuccess(true);
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-[1540px] mx-auto pb-12">
      {/* 1. Top Subscription & Credits Status Hero */}
      <div
        className="p-6 sm:p-8 rounded-3xl text-white relative overflow-hidden shadow-sm"
        style={{
          background: 'linear-gradient(112deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)'
        }}
      >
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold border border-white/15">
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>当前计划：专业版 Pro（年度订阅）</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              套餐与 AI 算力中心 (Plans & Billing)
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              随时按需调整订阅计划，灵活充值长期有效的 AI 算力积分包。支持企业专属对公转账与正规增值税发票。
            </p>
          </div>

          {/* Point Counter Widget */}
          <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 min-w-[280px] space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-300" />
                <span>可用 AI 算力余额</span>
              </span>
              <span className="font-mono text-emerald-300">充足</span>
            </div>
            <div className="text-3xl font-bold font-mono text-white flex items-baseline gap-1.5">
              <span>{currentCredits.toLocaleString()}</span>
              <span className="text-xs text-slate-400 font-normal">Points</span>
            </div>
            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">有效期：长期有效不过期</span>
              <button
                onClick={() => setActiveTab('credits')}
                className="px-3 py-1 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-xs hover:from-amber-300 hover:to-amber-400 transition-all cursor-pointer"
              >
                充值算力包
              </button>
            </div>
          </div>
        </div>

        {/* Quota Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div>
            <div className="text-[11px] text-slate-400">托管账号配额</div>
            <div className="text-xl font-bold font-mono mt-0.5">8 / 15 个</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">AI 创作者配额</div>
            <div className="text-xl font-bold font-mono mt-0.5 text-cyan-300">3 / 3 位</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">专属素材库空间</div>
            <div className="text-xl font-bold font-mono mt-0.5 text-indigo-300">1.4 GB / 20 GB</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">订阅到期时间</div>
            <div className="text-xl font-bold font-mono mt-0.5 text-emerald-300">2027-09-18</div>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#e8ebf3] shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-[#f4f6fa] p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'plans'
                ? 'bg-white text-[#171c2d] shadow-xs'
                : 'text-[#647087] hover:text-[#171c2d]'
            }`}
          >
            <CreditCard className="w-4 h-4 text-[#7258f5]" />
            <span>订阅套餐方案 (Plans)</span>
          </button>

          <button
            onClick={() => setActiveTab('credits')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'credits'
                ? 'bg-white text-[#171c2d] shadow-xs'
                : 'text-[#647087] hover:text-[#171c2d]'
            }`}
          >
            <Coins className="w-4 h-4 text-amber-500" />
            <span>购买 AI 算力积分包</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'logs'
                ? 'bg-white text-[#171c2d] shadow-xs'
                : 'text-[#647087] hover:text-[#171c2d]'
            }`}
          >
            <Clock className="w-4 h-4 text-slate-500" />
            <span>算力消耗流水明细</span>
          </button>
        </div>

        {/* Monthly vs Annual Toggle */}
        {activeTab === 'plans' && (
          <div className="flex items-center gap-2 bg-[#f4f6fa] p-1 rounded-2xl border border-[#e8ebf3]">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-white text-[#171c2d] shadow-xs'
                  : 'text-[#647087] hover:text-[#171c2d]'
              }`}
            >
              按月支付
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                billingCycle === 'annual'
                  ? 'bg-gradient-to-r from-[#735af4] to-[#8876fa] text-white shadow-xs'
                  : 'text-[#647087] hover:text-[#171c2d]'
              }`}
            >
              <span>按年支付</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-extrabold">
                省 20%
              </span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Subscription Plans Grid */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {PLANS.map((plan) => {
            const price = billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;

            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-6 flex flex-col justify-between transition-all relative ${
                  plan.isPopular
                    ? 'bg-gradient-to-b from-[#1c1a44] to-[#121829] text-white border-2 border-[#7258f5] shadow-xl shadow-indigo-500/15'
                    : 'bg-white border border-[#e8ebf3] text-[#171c2d] shadow-xs hover:shadow-md'
                }`}
              >
                {/* Popular Pill */}
                {plan.badge && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md">
                    {plan.badge}
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold">{plan.name}</h3>
                    <p className={`text-xs mt-1.5 leading-relaxed ${plan.isPopular ? 'text-slate-300' : 'text-slate-500'}`}>
                      {plan.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="py-2 border-y border-white/10">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs font-bold font-mono">¥</span>
                      <span className="text-3xl font-extrabold font-mono tracking-tight">{price}</span>
                      <span className={`text-xs ${plan.isPopular ? 'text-slate-400' : 'text-slate-500'}`}>
                        / 月 {billingCycle === 'annual' && '(年付计费)'}
                      </span>
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="space-y-2.5 pt-2 text-xs">
                    <div className={`font-bold text-[11px] uppercase tracking-wider ${plan.isPopular ? 'text-indigo-300' : 'text-slate-400'}`}>
                      包含权益
                    </div>
                    {plan.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            plan.isPopular ? 'text-emerald-400' : 'text-[#7258f5]'
                          }`}
                        />
                        <span className={plan.isPopular ? 'text-slate-200' : 'text-slate-700'}>
                          {feat}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 mt-4">
                  <button
                    onClick={() => handleOpenPlanPay(plan)}
                    disabled={plan.id === 'free'}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md ${
                      plan.isPopular
                        ? 'bg-gradient-to-r from-[#735af4] to-[#a855f7] hover:from-[#6549f0] hover:to-[#9333ea] text-white shadow-indigo-500/25'
                        : plan.id === 'free'
                        ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                        : 'bg-[#171c2d] hover:bg-slate-800 text-white'
                    }`}
                  >
                    <span>{plan.ctaText}</span>
                    {plan.id !== 'free' && <ArrowRight className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Credit Packages Tab Content */}
      {activeTab === 'credits' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-[#e8ebf3] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">按需购买 AI 算力积分包</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  所有额外购买的算力积分永久有效，优先在订阅额度耗尽后扣除。
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block">当前积分余额</span>
                <span className="text-xl font-bold font-mono text-[#7258f5]">
                  {currentCredits.toLocaleString()} Pts
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {CREDIT_PACKAGES.map((pkg) => (
                <div
                  key={pkg.id}
                  onClick={() => handleOpenCreditPay(pkg)}
                  className="p-5 rounded-2xl border-2 border-[#e8ebf3] hover:border-[#7258f5] bg-white hover:bg-purple-50/20 transition-all cursor-pointer relative group flex flex-col justify-between"
                >
                  {pkg.tag && (
                    <span className="absolute -top-3 right-3 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-[10px] shadow-sm">
                      {pkg.tag}
                    </span>
                  )}

                  <div className="space-y-2">
                    <div className="text-2xl font-bold font-mono text-slate-900">
                      {pkg.points.toLocaleString()}
                      <span className="text-xs text-slate-400 font-normal ml-1">积分</span>
                    </div>

                    {pkg.bonus > 0 && (
                      <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>额外赠送 +{pkg.bonus.toLocaleString()} 积分</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400">单价：</span>
                      <span className="text-lg font-bold font-mono text-[#7258f5]">¥{pkg.price}</span>
                    </div>
                    <button className="px-3 py-1.5 rounded-xl bg-[#171c2d] group-hover:bg-[#7258f5] text-white text-xs font-bold transition-colors">
                      立即充值
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Credit Cost Reference Table */}
          <div className="p-6 rounded-3xl bg-white border border-[#e8ebf3] shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-[#7258f5]" />
              <span>AI 任务积分消耗标准对照表</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="font-bold text-slate-800">文本与选题派生</span>
                <p className="text-slate-500 text-[11px]">母内容生成、各平台文案派生、爆款标题重写</p>
                <span className="font-mono font-bold text-[#7258f5] block pt-1">1 ~ 3 积分 / 次</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="font-bold text-slate-800">AI 视觉与配图生成</span>
                <p className="text-slate-500 text-[11px]">小红书首图、高清商品渲染、主视觉 KV 入库</p>
                <span className="font-mono font-bold text-[#7258f5] block pt-1">15 积分 / 张</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="font-bold text-slate-800">多分镜短视频渲染</span>
                <p className="text-slate-500 text-[11px]">5 镜头运镜生成、数字人口播台词、音视频合成</p>
                <span className="font-mono font-bold text-[#7258f5] block pt-1">120 积分 / 支 (需二次确认)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Logs Tab Content */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-3xl border border-[#e8ebf3] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">算力流水与扣费明细</h3>
            <span className="text-xs text-slate-400 font-mono">共 {logs.length} 条记录</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-mono">
                  <th className="py-2.5 px-3">时间</th>
                  <th className="py-2.5 px-3">任务名称 / 变动原因</th>
                  <th className="py-2.5 px-3">积分变动</th>
                  <th className="py-2.5 px-3">变动后余额</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-mono text-slate-400">{log.date}</td>
                    <td className="py-3 px-3 font-bold text-slate-800">{log.task}</td>
                    <td className={`py-3 px-3 font-mono font-bold ${log.points > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {log.points > 0 ? `+${log.points}` : log.points} Pts
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 font-bold">{log.balance} Pts</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Checkout & Payment Modal */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">收银台与安全结算</h3>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isPaymentSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-900">支付成功！</h3>
                <p className="text-xs text-slate-500">
                  {selectedCreditPkg
                    ? `已成功充值 ${selectedCreditPkg.points + selectedCreditPkg.bonus} AI 算力积分`
                    : `已成功开通 ${selectedPlan?.name}`}
                </p>
                <div className="pt-3">
                  <button
                    onClick={() => setIsPayModalOpen(false)}
                    className="px-6 py-2 rounded-xl bg-[#171c2d] text-white text-xs font-bold cursor-pointer"
                  >
                    返回控制台
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Order Summary */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">结算项目：</span>
                    <span className="font-bold text-slate-800">
                      {selectedPlan ? `${selectedPlan.name} (${billingCycle === 'annual' ? '按年' : '按月'})` : `${selectedCreditPkg?.points.toLocaleString()} 算力积分包`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">应付金额：</span>
                    <span className="text-xl font-bold font-mono text-[#7258f5]">
                      ¥{selectedPlan ? (billingCycle === 'annual' ? selectedPlan.priceAnnual * 12 : selectedPlan.priceMonthly) : selectedCreditPkg?.price}
                    </span>
                  </div>
                </div>

                {/* Payment Methods */}
                <div>
                  <label className="block font-bold text-slate-700 mb-2">选择支付方式</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'wechat', label: '微信支付' },
                      { id: 'alipay', label: '支付宝' },
                      { id: 'bank', label: '对公转账' }
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                          paymentMethod === m.id
                            ? 'border-[#7258f5] bg-purple-50 text-[#7258f5]'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mock QR code */}
                <div className="p-4 border border-dashed border-slate-200 rounded-2xl text-center space-y-2">
                  <div className="w-28 h-28 bg-slate-100 rounded-xl mx-auto flex items-center justify-center text-slate-400">
                    <QrCode className="w-16 h-16 text-slate-800" />
                  </div>
                  <p className="text-[11px] text-slate-400">请使用{paymentMethod === 'wechat' ? '微信' : paymentMethod === 'alipay' ? '支付宝' : '网银对公'}扫码完成支付</p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsPayModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmPayment}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-[#7258f5] hover:bg-[#6044ec] text-white cursor-pointer shadow-md shadow-indigo-500/20"
                  >
                    模拟扫码支付完成
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { ArrowRight, CircleDashed, LucideIcon } from 'lucide-react';

interface PrototypeModulePageProps {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  steps: string[];
  onPrimaryAction?: () => void;
  primaryActionLabel?: string;
}

export const PrototypeModulePage: React.FC<PrototypeModulePageProps> = ({
  icon: Icon,
  eyebrow,
  title,
  description,
  steps,
  onPrimaryAction,
  primaryActionLabel
}) => (
  <div className="mx-auto max-w-[1180px] space-y-5 pb-12">
    <section className="rounded-3xl border border-[#e5e9f1] bg-white p-7 sm:p-9 shadow-xs">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <div className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[#6654d9]">
            <Icon className="h-4 w-4" aria-hidden="true" />
            {eyebrow}
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#151a28]">{title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#566178]">{description}</p>
        </div>
        <span className="inline-flex w-fit items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">Beta</span>
      </div>
    </section>

    <section className="rounded-3xl border border-[#e5e9f1] bg-white p-6 sm:p-8">
      <div className="flex items-center gap-2 text-sm font-black text-[#252c3d]">
        <CircleDashed className="h-4 w-4 text-[#6654d9]" aria-hidden="true" />
        原型流程已建立
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {steps.map((step, index) => (
          <div key={step} className="flex min-h-14 items-center gap-3 rounded-2xl border border-[#edf0f5] bg-[#fafbfe] px-4 py-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#ece9ff] text-xs font-black text-[#6654d9]">{index + 1}</span>
            <span className="text-sm font-semibold text-[#3b455b]">{step}</span>
          </div>
        ))}
      </div>
      <p className="mt-5 text-xs leading-5 text-[#6b758b]">当前页面不生成演示结果；真实记录会在对应后端能力接通后出现。</p>
      {onPrimaryAction && primaryActionLabel && (
        <button type="button" onClick={onPrimaryAction} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#171717] px-4 text-sm font-bold text-white transition-colors duration-200 hover:bg-[#333] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6654d9] cursor-pointer">
          {primaryActionLabel}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </section>
  </div>
);

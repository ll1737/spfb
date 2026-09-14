import React, { useState } from 'react';
import { 
  Settings, 
  Server, 
  Key, 
  ShieldCheck, 
  Monitor, 
  Laptop, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Terminal, 
  FolderOpen, 
  Sliders, 
  Cpu,
  Trash2
} from 'lucide-react';
import { SystemSettings } from '../types';
import { api } from '../lib/api';

interface SettingsViewProps {
  settings: SystemSettings;
  onUpdateSettings: (updated: Partial<SystemSettings>) => Promise<void>;
  workerConnected: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  workerConnected
}) => {
  const [formData, setFormData] = useState<SystemSettings>(settings);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handlePingWorker = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await api.testWorker(formData.workerUrl);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Worker 连接失败，请检查 Python 进程是否在 8000 端口运行'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onUpdateSettings(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert('保存配置失败: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <form onSubmit={handleSave} className="space-y-6">
        {/* Top Header Card */}
        <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center text-white">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">系统调度与 Worker 节点配置</h3>
              <p className="text-xs text-neutral-500">管理 Python FastAPI RPA 节点通信、AES-256 加密与并发策略</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {saveSuccess && (
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                已保存配置
              </span>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-95"
            >
              {isSaving ? '保存中...' : '保存全局配置'}
            </button>
          </div>
        </div>

        {/* Worker HTTP Node Connection */}
        <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-600" />
              <h4 className="text-sm font-bold text-neutral-900">RPA 发布 Worker 节点 (Python + Playwright)</h4>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-medium ${
              workerConnected ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {workerConnected ? '● 节点连通正常' : '○ 节点待就绪'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider block mb-1.5">
                Worker HTTP 服务地址 (API Endpoint)
              </label>
              <input
                type="text"
                value={formData.workerUrl}
                onChange={(e) => setFormData({ ...formData, workerUrl: e.target.value })}
                placeholder="http://127.0.0.1:8000"
                className="w-full px-3.5 py-2.5 text-xs font-mono bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:border-neutral-900"
              />
              <p className="text-[11px] text-neutral-400 mt-1">本地部署默认为 http://127.0.0.1:8000，Docker 部署可用服务名</p>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider block mb-1.5">
                Worker 通信鉴权密钥 (Internal API Token)
              </label>
              <input
                type="password"
                value={formData.workerApiKey}
                onChange={(e) => setFormData({ ...formData, workerApiKey: e.target.value })}
                placeholder="••••••••••••••••"
                className="w-full px-3.5 py-2.5 text-xs font-mono bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:border-neutral-900"
              />
              <p className="text-[11px] text-neutral-400 mt-1">用于 Web 与 Worker 间跨进程 HTTP 签权，防止越权调用</p>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={handlePingWorker}
              disabled={isTesting}
              className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-medium rounded-xl flex items-center gap-2 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>测试节点网络连通性</span>
            </button>

            {testResult && (
              <span className={`text-xs flex items-center gap-1.5 ${
                testResult.success ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{testResult.message}</span>
                {testResult.latencyMs && (
                  <span className="font-mono text-[11px] bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-600">
                    {testResult.latencyMs}ms
                  </span>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Browser & RPA Engine Parameters */}
        <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
            <Sliders className="w-4 h-4 text-purple-600" />
            <h4 className="text-sm font-bold text-neutral-900">Playwright 浏览器自动化参数</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider block mb-1.5">
                最大并发任务数
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={formData.maxConcurrency}
                onChange={(e) => setFormData({ ...formData, maxConcurrency: parseInt(e.target.value) || 2 })}
                className="w-full px-3.5 py-2.5 text-xs font-mono bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:border-neutral-900"
              />
              <p className="text-[11px] text-neutral-400 mt-1">推荐 2~4，避免多开浏览器占用过多机器内存</p>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider block mb-1.5">
                失败自动重试次数
              </label>
              <input
                type="number"
                min={0}
                max={5}
                value={formData.maxRetries}
                onChange={(e) => setFormData({ ...formData, maxRetries: parseInt(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 text-xs font-mono bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:border-neutral-900"
              />
              <p className="text-[11px] text-neutral-400 mt-1">网络抖动或超时后最大自动重试次数</p>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider block mb-1.5">
                无头模式 (Headless)
              </label>
              <div className="flex items-center gap-4 mt-3">
                <label className="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer">
                  <input
                    type="radio"
                    name="headless"
                    checked={formData.browserHeadless}
                    onChange={() => setFormData({ ...formData, browserHeadless: true })}
                  />
                  <span>开启无头（后台静默）</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer">
                  <input
                    type="radio"
                    name="headless"
                    checked={!formData.browserHeadless}
                    onChange={() => setFormData({ ...formData, browserHeadless: false })}
                  />
                  <span>显示浏览器（调试直观）</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* dreammis/social-auto-upload Integration Engine */}
        <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-blue-600" />
              <h4 className="text-sm font-bold text-neutral-900">social-auto-upload 引擎与防检测强化</h4>
            </div>
            <a
              href={api.getWorkerScriptDownloadUrl()}
              download="social_auto_upload_worker.py"
              className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
              title="下载可以直接在本地运行的 Python FastAPI Worker 脚本"
            >
              <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>下载配套 Python Worker 脚本</span>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-neutral-900">启用 Patchright 强化反指纹</div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">重构 Chromium 驱动底层，规避 Cloudflare 和大厂爬虫检测</div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.usePatchright ?? false}
                  onChange={(e) => setFormData({ ...formData, usePatchright: e.target.checked })}
                  className="w-4 h-4 text-neutral-900 rounded focus:ring-neutral-900"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-neutral-200/60">
                <div>
                  <div className="text-xs font-bold text-neutral-900">注入 Playwright Stealth 规避风控</div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">抹除 navigator.webdriver，伪造 Chrome 插件与特征</div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.enableStealth ?? true}
                  onChange={(e) => setFormData({ ...formData, enableStealth: e.target.checked })}
                  className="w-4 h-4 text-neutral-900 rounded focus:ring-neutral-900"
                />
              </label>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-3">
              <div>
                <label className="text-xs font-bold text-neutral-800 block mb-1">
                  真人按键随机延迟 (Human Typing Delay)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={500}
                    value={formData.humanTypingDelay ?? 50}
                    onChange={(e) => setFormData({ ...formData, humanTypingDelay: parseInt(e.target.value) || 0 })}
                    className="w-24 px-3 py-1.5 text-xs font-mono bg-white border border-neutral-200 rounded-lg"
                  />
                  <span className="text-xs text-neutral-500">毫秒 (ms) - 标题和文本逐字仿真敲击</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-800 block mb-1">
                  本地 social-auto-upload 仓库路径 (可选)
                </label>
                <input
                  type="text"
                  value={formData.socialAutoUploadPath ?? ''}
                  onChange={(e) => setFormData({ ...formData, socialAutoUploadPath: e.target.value })}
                  placeholder="例如：/Users/name/social-auto-upload"
                  className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-neutral-200 rounded-lg"
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-600 font-mono flex items-center justify-between">
            <span className="truncate">本地启动命令：pip install fastapi uvicorn playwright &amp;&amp; python social_auto_upload_worker.py</span>
            <span className="shrink-0 text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold ml-2">自动同步状态</span>
          </div>
        </div>

        {/* Security and AES Storage */}
        <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h4 className="text-sm font-bold text-neutral-900">数据与凭据安全保全策略 (AES-256-GCM)</h4>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-900 space-y-2">
            <div className="font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>全平台 storageState 与 Cookie 已启用 AES-256 硬件级加密入库</span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              系统严格遵循安全准则：数据库中只持久化密文凭证，前端接口禁止传输明文 Cookie；Worker 进程在分发任务时使用系统私钥解密并注入 Playwright 独立 Context，任务结束后自动清除内存句柄。
            </p>
          </div>
        </div>

        {/* Data Reset & Environment Clean */}
        <div className="p-6 rounded-2xl bg-white border border-rose-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-rose-100 pb-3">
            <div className="flex items-center gap-2 text-rose-700">
              <Trash2 className="w-4 h-4" />
              <h4 className="text-sm font-bold">真实测试环境重置 (清空所有运行数据)</h4>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 font-medium">
              危险操作
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-xs text-neutral-600 leading-relaxed max-w-xl">
              一键彻底清空系统中的所有注册创作者、关联自媒体账号、发布任务与历史凭证，恢复纯净出厂状态以供您随时重新进行实操验收。
            </p>

            <button
              type="button"
              onClick={async () => {
                if (window.confirm('警告：此操作将清空所有矩阵账号和发布任务，并将系统恢复为默认管理员 (admin / 123456)！确定要继续吗？')) {
                  try {
                    await api.resetData();
                    alert('数据已清空！已重置为默认管理员账号 (admin / 123456)。');
                    window.location.reload();
                  } catch (e: any) {
                    alert('重置失败: ' + (e.message || '未知错误'));
                  }
                }
              }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-all shrink-0 flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>清空所有数据并重新测试</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

# 智域真实应用化改造 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将当前智域原型改造成可真实注册、登录、接入平台账号、创建/排期/执行发布任务，并在 Electron 桌面端可独立启动和打包的应用。

**Architecture:** 保留 React/Vite、Express 和 Python FastAPI/Playwright 三层，但把共享 JSON 状态收敛为 SQLite 持久化，Express 统一负责用户鉴权、账号/任务 API 和调度，Worker 只负责真实浏览器执行。Electron 主进程负责启动打包后的 Node API 与 Python 3.12 Worker，并通过健康检查把前端连到真实服务。

**Tech Stack:** React 19, TypeScript, Vite, Express, Node `node:sqlite`/SQLite, Electron, Python 3.12, FastAPI, Playwright, pytest.

---

## 文件边界

- `server.ts`: API、认证、持久化适配、任务调度；只保留业务路由，不再把测试回退当成功。
- `server/store.ts`: SQLite schema、迁移、读写封装和密码/会话所需数据结构。
- `server/auth.ts`: Bearer session 生成、校验、撤销和密码策略。
- `server/scheduler.ts`: 任务状态机、并发限制、排期扫描、重试和取消。
- `services/worker/main.py`: Worker 鉴权、任务路由、真实能力声明。
- `services/worker/app/core/security.py`: Python 3.12 下可用的 AES-GCM 会话加解密。
- `services/worker/app/adapters/*.py`: 仅声明真实实现；未实现平台不得返回成功。
- `electron/main.cjs`: 启动/停止打包后的 Node API 与 Python Worker，开发/打包路径统一。
- `electron/preload.cjs`: 暴露健康检查、Worker/API 控制和文件选择能力。
- `src/lib/api.ts`, `src/App.tsx`, `src/components/*`: 所有可见业务操作接真实 API，统一处理登录过期与服务离线。
- `tests/` / `services/worker/tests/`: API、调度、加解密、Worker 鉴权和平台能力测试。
- `Dockerfile`, `services/worker/Dockerfile`, `.env.example`, `.gitignore`, `README.md`: 可复现运行与发布说明。

## Task 1: 建立真实运行基线与失败测试

**Files:**
- Create: `tests/server.test.ts`
- Create: `services/worker/tests/test_security.py`
- Modify: `task_plan.md`, `findings.md`, `progress.md`

- [ ] 用 `D:\python312\python.exe -m pip --version`、`D:\python312\python.exe -m pytest --version`、`npm run lint` 记录当前工具链。
- [ ] 写 Node 测试，验证未认证访问账号和发布 API 返回 401，排期任务不会立即调用 Worker，非法账号 ID 不会回退到全部账号。
- [ ] 写 Python 测试，验证 `security.encrypt_session` 可在 Python 3.12 往返，并验证 Worker 请求缺少/错误 token 返回 401。
- [ ] 运行上述测试确认它们因现有实现失败，再进入实现阶段。

## Task 2: SQLite、认证与真实数据初始化

**Files:**
- Create: `server/store.ts`
- Create: `server/auth.ts`
- Modify: `server.ts`, `src/lib/api.ts`, `src/components/AuthPage.tsx`, `.env.example`, `.gitignore`
- Test: `tests/server.test.ts`

- [ ] 迁移 users/accounts/jobs/tasks/settings/enterprise 数据到 SQLite，首次启动只创建空业务库和首个管理员注册流程，不写入演示账号、演示任务或默认密码。
- [ ] 使用 `crypto.scrypt` 或高成本 PBKDF2 哈希密码；session token 只存哈希和过期时间，API 通过统一 `requireAuth` 中间件保护。
- [ ] 删除 `/api/auth/status` 中的明文默认密码和 reset-data 公开入口；管理员角色不能由注册请求直接指定。
- [ ] API 返回账号时去掉 `encryptedSession`，Cookie 导入/导出必须鉴权并校验账号归属。
- [ ] 让 `PORT`、`DATABASE_PATH`、`APP_SECRET`、`WORKER_API_KEY` 从环境读取；生产环境缺少密钥直接启动失败。
- [ ] 用失败测试驱动这些行为变绿，再保留旧 `matrix_data.json` 的一次性只读导入脚本，避免把历史用户数据当测试数据。

## Task 3: 真实任务状态机与调度

**Files:**
- Create: `server/scheduler.ts`
- Modify: `server.ts`, `src/types.ts`, `src/lib/api.ts`, `src/components/PublishModal.tsx`, `src/components/TaskCenter.tsx`
- Test: `tests/scheduler.test.ts`, `tests/server.test.ts`

- [ ] 定义 queued/running/success/failed/cancelled 状态迁移，写失败测试覆盖排期、并发上限、重试上限和取消。
- [ ] 用固定间隔扫描数据库中的 `scheduledAt <= now` 任务，按 `maxConcurrency` 拉起 Worker，进程重启后继续处理 queued/running 超时任务。
- [ ] 每次状态、日志、结果 URL、错误和账号统计变化都持久化；取消使用 AbortController 并把 Worker 任务标记为 cancelled。
- [ ] `accountIds` 为空与非法 ID 直接 400；绝不自动扩大到所有 active 账号。
- [ ] 前端只展示 API 返回的真实状态，删除本地假成功/假任务回退。

## Task 4: Worker 真实能力与平台适配

**Files:**
- Modify: `services/worker/main.py`, `services/worker/app/core/security.py`, `services/worker/app/core/config.py`, `services/worker/app/adapters/toutiao.py`, `services/worker/app/adapters/wechat_mp.py`, `services/worker/test_worker.py`
- Test: `services/worker/tests/test_security.py`, `services/worker/tests/test_api.py`

- [ ] Python 3.12 下修复 `os` 导入和依赖安装，统一 AES-GCM 格式。
- [ ] Worker 对非 health 路由强制校验 Bearer token；CORS 默认关闭或只允许本机/配置来源。
- [ ] 为每个适配器增加 `capabilities`，未实现内容返回 `UNSUPPORTED_CAPABILITY`/`NOT_CONFIGURED`，不能返回合成成功 URL。
- [ ] 对真实 Playwright 适配器保留截图、日志、session cleanup，并为 HTTP 层增加不启动浏览器的契约测试。
- [ ] 用 Python 3.12 运行全部 Worker 测试。

## Task 5: 前端真实闭环

**Files:**
- Modify: `src/App.tsx`, `src/lib/api.ts`, `src/components/AuthPage.tsx`, `src/components/AccountManager.tsx`, `src/components/PublishModal.tsx`, `src/components/TaskCenter.tsx`, `src/components/SettingsView.tsx`, `src/components/Sidebar.tsx`
- Create/Modify: `src/components/ServiceStatus.tsx` if needed
- Test: `tests/ui-contracts.test.ts`

- [ ] 注册成功后自动登录，登录过期统一清理本地 token 并回到登录页；不再依赖 localStorage 中的假用户绕过服务端。
- [ ] 账号添加、扫码登录、Cookie 导入、校验和删除全部调用真实 API，并对不可用平台显示明确状态。
- [ ] 发布弹窗要求至少一个明确账号，显示真实排期时间和 Worker 状态；任务中心支持真实重试/取消/日志/截图。
- [ ] 素材、内容包、工作流、记忆、分析和计划页面若没有后端能力，改为明确的“本地草稿”并提供保存/导出，不能伪装成已持久化的企业数据。
- [ ] 接通企业页面到 enterprise API，并由服务端按角色校验权限。

## Task 6: Electron、桌面 Worker 和发布

**Files:**
- Modify: `electron/main.cjs`, `electron/preload.cjs`, `electron-builder.json`, `package.json`, `start-app.bat`, `scripts/start-desktop.bat`
- Create: `scripts/start-api.bat`, `scripts/start-worker.bat` if missing/replace; `Dockerfile`, `services/worker/Dockerfile`
- Test: `tests/electron-paths.test.ts`

- [ ] 开发模式启动 `npm run dev`，生产模式从 `process.resourcesPath` 启动打包后的 `dist/server.cjs`，并等待 `/api/health` 后创建窗口。
- [ ] Worker 从 `process.resourcesPath/worker` 启动，优先使用 `D:\python312\python.exe` 或配置的 Python 路径，记录 stdout/stderr 并在退出时通知 UI。
- [ ] 修复 `app.isPackaged`、`loadURL`、`extraResources` 路径和 Windows 关闭清理，确保桌面端不依赖手工先开端口 3000。
- [ ] 添加 Dockerfile 与健康检查，更新 README、品牌名和 lock 文件一致性。

## Task 7: 完整验证与交付

**Files:**
- Modify: `README.md`, `.env.example`, `progress.md`, `findings.md`

- [ ] 用 Python 3.12 安装 requirements 并执行 `pytest -q`。
- [ ] 执行 `npm run lint`、`npm run build`、API 集成测试和 Electron 打包检查。
- [ ] 启动全新空数据库，验证注册 → 登录 → 添加真实账号/扫码 → 创作 → 立即发布/排期 → 任务完成/失败重试 → 退出重登全流程。
- [ ] 检查工作区不包含 Cookie、Profile、截图、数据库和测试输出；输出准确的剩余限制，尤其是未接入平台。

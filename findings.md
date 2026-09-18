# 项目分析发现

## 工作区基线

- 分析开始时工作区已有大量已修改文件及新增文件；这些变化未由本次分析产生。
- 项目根目录包含 `src`、`electron`、`services`、`scripts`、`data`、`outputs`、`debug_snapshots`、`dist` 等目录。

## 初步定位与技术栈

- 产品定位是多平台内容矩阵发布/运营桌面工具，目标平台为抖音、快手、小红书、微博、头条、公众号、知乎、B站。
- 前端为 React 19 + TypeScript + Vite + Tailwind 4；`src/App.tsx` 是业务壳层，功能页面集中在 `src/components`。
- 本地 API/服务层为 Node.js + Express + Vite 中间件，入口为根目录 `server.ts`，默认端口 3000。
- 自动化执行层为 Python + FastAPI + Playwright，入口为 `services/worker/main.py`，默认端口 8000；平台差异由 `services/worker/app/adapters` 适配器承载。
- 桌面封装为 Electron，主进程为 `electron/main.cjs`，预加载桥为 `electron/preload.cjs`。
- 包脚本同时覆盖 Web 开发、生产构建、Worker、Electron 开发和打包；存在 `npm run lint`，但当前 `tsconfig.json` 未启用严格类型检查选项。

## 初步工程信号

- README 描述的架构与实际目录大体一致，但 `docker-compose.yml` 引用了根目录 `Dockerfile` 和 `services/worker/Dockerfile`，当前文件清单中未发现这两个 Dockerfile，容器化路径疑似不可直接运行。
- `.env.example` 只列出 Gemini/APP_URL，而 compose 与服务配置还依赖 `WORKER_URL`、`WORKER_API_KEY`、`APP_SECRET`、`BROWSER_HEADLESS` 等变量；环境配置文档不完整。
- 工作区存在 `__pycache__`、`dist`、`outputs`、`debug_snapshots` 等生成物，虽部分被打包过滤或 Vite 忽略，但仓库卫生和发布边界需要进一步核对。

- 分析期间检测到工作区被其他进程/协作者继续修改：`package.json` 从初读的 `multi-publish-desk` 变为当前的 `zhiyu`，`server.ts` 从约 1314 行扩展到约 1999 行并新增企业/团队接口。以下结论以最终复核时的当前文件为准；早期读取结果只用于识别变更轨迹。
- `package-lock.json` 和 `start-app.bat` 属于当前新增文件；不能据此判断其是否是产品设计还是开发过程产物。

## 核心数据流与边界

- 前端登录后由 `App.tsx` 轮询 `/api/tasks`，并通过 `src/lib/api.ts` 调用 Express；发布请求在 `/api/publish` 被拆分为每个账号一个 Task，再由 `executeRpaTask` 调用 Worker 的 `/worker/publish`。
- 任务调度目前是进程内 `setTimeout` + 数组状态，不是持久化队列：服务重启后运行中的任务不会恢复，`scheduledAt` 任务也没有看到真正的定时执行器。
- 账号、用户、Job、Task 统一写入根目录 `matrix_data.json`；这使系统适合单机/演示，但不适合多进程、多用户或高并发生产部署。
- Worker 以平台适配器注册表路由，统一区分 article/note/video；部分平台适配器是完整 Playwright 流程，部分平台仍是简化/占位式返回，需以真实平台回归测试确认 README 中的“生产就绪”。

## 已确认的安全/权限问题

- Express 只有少数认证接口显式调用 `getAuthUser`；账号、发布、任务、设置、Cookie 导入/导出等主要 API 没有统一认证中间件，存在未登录读写敏感数据的风险。
- Worker 的 `verify_token` 在没有 `Authorization` 头时直接返回 `True`，所以依赖该函数的接口实际上允许匿名访问；Worker API key 不是强制认证。
- `server.ts` 内置默认 `APP_SECRET`、`WORKER_API_KEY`，并且预置 `admin / 123456`，登录逻辑还额外接受 `admin123`；这些默认值不应出现在可部署生产配置中。
- CORS 配置为 `allow_origins=["*"]` + `allow_credentials=True`；若 Worker 暴露到非受信网络，跨域边界过宽。
- `/api/accounts` 会把完整 account 对象返回给前端，其中包含 `encryptedSession`；虽然不是明文，但凭证密文与导出 Cookie 接口一起暴露扩大了攻击面。
- `/debug_snapshots` 被直接静态挂载，失败截图可能包含账号、页面或验证码相关敏感信息。

## 可运行性与测试信号

- `npm run lint` 通过；但当前脚本实际只是 `tsc --noEmit`，且 `tsconfig.json` 未启用 `strict`，因此只能说明当前 TypeScript 可编译，不代表类型约束严格。
- 最终快照的 `npm run build` 通过，Vite 产出 644.31 KB 的 JS 主包（gzip 约 167.11 KB），且提示存在超过 500 KB 的 chunk，后续可做路由/页面级拆包。
- `py -3.12 -m pytest -q` 未执行测试：系统有 Python 3.7.2，但没有已安装的 Python 3.12；使用 3.7 执行 pytest 也因未安装 pytest 失败。README 声称的 Python 测试覆盖尚未在本环境得到验证。
- `test_worker.py` 的测试直接调用多个适配器的真实 `publish_note`，没有隔离浏览器/网络；同时只覆盖 5 个适配器，不覆盖 FastAPI 路由、鉴权、任务恢复和 HTTP 契约。
- `toutiao.py` 与 `wechat_mp.py` 的发布方法返回合成的成功结果和未来 URL，没有创建 Playwright 页面或真正提交平台；与 README 中“生产就绪”的表述不一致。
- `services/worker/app/core/security.py` 的 `encrypt_session` 使用 `os.urandom`，但文件没有导入 `os`；该模块被 `test_worker.py` 直接使用，Python 测试在有解释器后很可能首先暴露该错误。
- `src/components` 中账号、任务、发布、设置、个人资料和新增的企业页面涉及 API；素材、记忆、工作流、选题、创作者、内容包、分析、计划等页面主要使用本地 `useState`/初始数据，刷新或重启后数据不持久化。企业页面与 App 导航的接入在分析期间仍发生变化。

## 运行时与发布链路风险

- 现场只读请求验证：未带 token 访问 `/api/auth/me` 返回 401，但 `/api/accounts`、`/api/jobs`、`/api/tasks`、`/api/settings` 返回 200；说明认证缺口不是理论问题，而是当前运行实例可复现。
- `/api/auth/status` 直接返回默认管理员账号和密码提示；这会把初始化凭证暴露给任何能访问 API 的人。
- `/api/health` 将 `workerConnected` 固定为 `true`；即使 Worker 不可达，前端仍可能显示“RPA 就绪”。现场 Worker 当前可达，但代码健康检查不能反映真实状态。
- `server.ts` 的 `PORT` 写死为 3000，未读取环境变量；与通用容器/部署配置的预期不一致。
- `executeRpaTask` 完成后没有调用 `persistDataStore()`；任务最终状态、日志和账号统计在服务重启时可能丢失。`scheduledAt` 只把任务置为 queued，未发现定时执行器；`maxConcurrency`、`autoRetryFailed`、`maxRetries` 也未参与实际调度。
- `/api/publish` 在传入的账号 ID 全部无效时会回退到全部 active 账号，可能造成超出用户选择范围的发布；取消任务也没有中断正在执行的 Worker 请求。
- Electron 生产封装存在断链：`electron-builder.json` 把 `dist/server.cjs` 打进包，但 `electron/main.cjs` 没有启动 Node 服务，窗口始终加载 `http://localhost:3000`；同时打包后的 Worker 位于 `extraResources`，代码却从 `../services/worker` 启动，路径不匹配。
- 项目根 `.gitignore` 未忽略 `matrix_data.json`、`data/profiles`、`debug_snapshots`、`outputs`、`__pycache__`；当前工作区已存在未忽略的浏览器 Profile/Cookies 文件、截图和运行数据，存在凭证/隐私误提交风险。
- `docker-compose.yml` 依赖的两个 Dockerfile 和 README/生成脚本提到的 `stealth.min.js` 当前不存在；容器化和部分“social-auto-upload”路径无法按文档直接复现。

## 当前版本漂移

- 当前 manifest 已改名为 `zhiyu` / “智域”，但 `package-lock.json`、`electron-builder.json`、README 和部分界面文案仍保留 `multi-publish-desk` / `Multi-Publish Desk`，发布产物的品牌、应用 ID、锁文件和文档不一致。
- 当前 `server.ts` 新增了企业、品牌、成员、审批规则和权限矩阵接口，但多数接口没有校验登录用户；例如 GET 企业信息、品牌增删切换、成员增删改、规则和权限矩阵接口都直接操作共享内存/文件数据。
- 当前 `src/lib/api.ts` 已有企业接口客户端，但主页面与现有组件的调用面仍主要集中在账号、发布、任务、设置和个人资料；企业功能的 UI 接入在分析期间仍处于变化中，不能视为已形成完整闭环。
- `matrix_data.json` 当前顶层仍只看到 users/accounts/jobs/tasks，而服务端代码已引入 enterprise/brands/members 等持久化字段；这表明数据迁移/兼容策略尚未稳定。

## 分析完成

- 技术栈、核心数据流、运行验证和主要风险均已记录；结论以最终复核时的当前快照为准。

## 应用化改造进展

- Python 3.12 实际路径为 `D:\python312\python.exe`，pytest 9.1.1 可用。
- Worker 会话加解密和缺失 token 拒绝已通过首轮 TDD 测试；后续仍需补 HTTP 契约、真实任务和 API 集成测试。
- 已完成首轮真实化改造：SQLite 空库持久化、注册/登录认证、统一 API 鉴权、凭证脱敏、严格账号选择、排期/并发/取消/重试队列、动态 Worker 健康检查、未配置平台禁止伪成功。
- Electron 已改为自动启动 API 和 Python Worker，开发/打包路径分离，并优先使用 `D:\python312\python.exe`。
- 前端已移除默认登录账号、预置角色、示例内容入口和 Dashboard 假 KPI/假排期，发布弹窗要求真实标题、正文和有效账号。
- `npm run lint`、`npm test`、`npm run build`、Electron JS 语法检查均通过；Python 3.12 测试在临时依赖目录中曾通过 7 项，但清理临时依赖后裸环境无法导入 `pytest-asyncio/httpx2`，需按 `requirements.txt` 安装依赖后重跑。
- Electron Builder 已补入依赖，但三次打包验证均在 Windows Electron 解压目录重命名阶段遇到 `EPERM`，目标目录被现有 Electron 进程锁定；源码路径测试通过，实际安装包尚未生成。
- 当前工作区仍保留用户原有的 `matrix_data.json`、浏览器 Profile 和截图文件；新版本不会读取旧 JSON，改用 `data/zhiyu.sqlite`，也没有擅自删除这些可能包含用户凭证的旧文件。

## 平台账号未扫码却落库的根因与修复

- 根因一：`POST /api/accounts` 没有凭证时曾自动生成 `{empty:true}` 密文并标记 `active`。
- 根因二：登录状态接口只要收到 `ONLINE/isLoggedIn` 就会在 Express 侧自行拼接一个持久化账号，即使 Worker 没有返回本次扫码生成的真实加密 session。
- 根因三：单账号“核验”接口原来只是把 `need_reauth` 改回 `active`，没有调用 Worker。
- 现已改为：无凭证拒绝创建；必须有 Worker 返回的真实加密 session 才能创建；核验请求真实 Worker，失败保持 `need_reauth`；前端显示 `CONFIRM_REQUIRED`，不会把历史 Profile 当成本次扫码成功。

## 运行时链路复核（Go 后端）

- 当前 `package.json` 已被切换为 `vite + backend-go`，前端 `/api` 通过 Vite 代理到 `127.0.0.1:8088`；因此实际行为由 `backend-go` 决定，不是 `server.ts`。
- Go 后端原先在 `ConfirmLoginSession` 中写死 `mock_session_token` 并直接调用 `AddAccount`，这是截图中“未扫码也添加”的直接根因。
- Go 后端原先 `AddAccount` 无条件把账号标记为 `active`，即使没有 `EncryptedSession`；现已增加凭证校验，支持真实 `cookieData` 加密后保存。
- Go 后端原先启动时自动导入 `matrix_data.json`，会把旧测试账号带进 MySQL；现改为只有 `IMPORT_LEGACY_DATA=true` 才允许迁移。已存在的 MySQL 旧记录不会自动删除，需用户在平台账号页面手动清理或执行明确的数据清理操作。
- Go 路由原先没有注册前端实际调用的 `/accounts/{platform}/{id}/login/start|qrcode|status`，导致获取二维码 404；现已增加 Worker 代理接口。
# 2026-09-18 参考方案执行新增发现

- 参考文档是完整 SaaS 路线图，不能用一次性静态页面改动冒充完成；当前按 Phase 1/2 的真实数据垂直切片执行。
- 原有 CreatorsView、MemoryCenter、TopicsView 都在组件初始化时直接写死了业务记录；这会让新企业注册后看到别人的示例数据，也会让刷新后数据丢失。已改为 API 加载、空状态和真实创建/删除。
- Go 后端原本只有 `GET /api/creators` 和 Memory 读写，缺少 Creator/Category/Topic 的完整写入边界；已补齐路由、Repository 和企业空间条件。
- Electron 测试仍断言旧 Express `server.cjs` 路径，当前运行架构实际是 Go `server.exe`；测试和 runtime path 已统一，避免桌面端打包后启动错误。
- 当前可确认的下一条主链路仍是 Topic → ContentProject/MasterContent → PlatformContent → Review → Calendar/PublishTask。AI 生成尚未接入真实模型和异步队列，不能把按钮文案写成已完成。

# 智域（真实多平台内容创作与发布系统）

> 深度参考开源项目：[Multi-Publish](https://github.com/Colinchiu007/Multi-Publish)、[PostBot](https://github.com/gitcoffee-os/postbot)、[social-auto-upload](https://github.com/dreammis/social-auto-upload)、[multi-publisher](https://github.com/xwh5/multi-publisher) 构建。
> 支持 **Web 运营后台** 与 **Electron 原生桌面端**。用户必须先注册真实企业/团队账号，再接入真实平台登录态，系统不会预置管理员、账号、任务或成功结果。

---

## 平台支持矩阵 (8大主流平台)

| 平台名称 | 平台标识 | 支持内容类型 | 授权方式 | 自动化引擎 | 状态 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **抖音** | `douyin` | 短视频 / 图文动态 | Playwright 扫码 / Cookie | RPA 创作者后台 | 生产就绪 (Production) |
| **快手** | `kuaishou` | 短视频 / 图文动态 | Playwright 扫码 / Cookie | RPA 创作者后台 | 生产就绪 (Production) |
| **小红书** | `xiaohongshu` | 图文笔记 / 短视频 | 创作者平台扫码 / storageState | RPA 创作者服务 | 生产就绪 (Production) |
| **微博** | `weibo` | 微博图文 / 头条文章 | 网页端扫码 / SUB Cookie | RPA 发布框 / 富文本 | 生产就绪 (Production) |
| **今日头条** | `toutiao` | 微头条 / 长图文文章 | 待接入真实登录适配器 | 暂未配置 | 未配置（不会伪造成功） |
| **微信公众号** | `wechat_mp` | 图文素材草稿 / 预览 | 待接入真实登录适配器 | 暂未配置 | 未配置（不会伪造成功） |
| **知乎** | `zhihu` | 专栏文章 / 想法 | 知乎扫码 / z_c0 Cookie | RPA 专栏编辑器 | 生产就绪 (Production) |
| **哔哩哔哩** | `bilibili` | 专栏投稿 / 视频投稿 | 官方扫码 / SESSDATA | RPA 创作中心 | 生产就绪 (Production) |

---

## 系统架构与核心目录

```text
├── electron/
│   ├── main.cjs                # Electron 主进程 (窗口生命周期、托盘驻留、本地 Worker 拉起、IPC)
│   ├── preload.cjs             # ContextBridge 安全隔离桥 (window.electronAPI)
├── services/
│   └── worker/                 # Python + FastAPI + Playwright 自动化执行节点
│       ├── main.py             # FastAPI 服务入口 (Port 8000)
│       ├── test_worker.py      # 自动化测试用例 (覆盖 AES 加解密、Adapter 路由、健康监测)
│       ├── requirements.txt    # Python 依赖清单
│       └── app/
│           ├── core/           # 核心配置、AES-256 会话解密、Playwright 浏览器池
│           └── adapters/       # 统一 BasePlatformAdapter 接口实现
│               ├── base.py
│               ├── douyin.py
│               ├── kuaishou.py
│               ├── xiaohongshu.py
│               ├── weibo.py
│               ├── toutiao.py
│               ├── wechat_mp.py
│               ├── zhihu.py
│               └── bilibili.py
├── src/                        # 前端 React + TypeScript + Tailwind 控制台
│   ├── types.ts                # 严格 TypeScript 类型定义
│   ├── lib/                    # API 客户端与 AES 加密工具
│   ├── components/             # 仪表盘、编辑器、账号管理、任务中心、Electron 桥接
│   └── App.tsx
├── server.ts                   # Node.js + Express 全栈后端 (Port 3000) 与 Vite 统一集成
├── server/
│   ├── auth.ts                 # Bearer session 与密码哈希
│   ├── store.ts                # SQLite 持久化
│   └── scheduler.ts            # 排期、并发、重试和取消调度
├── scripts/
│   ├── start-web.bat           # Windows 一键启动 Web & API
│   ├── start-worker.bat        # Windows 一键启动 Python Worker
│   └── start-desktop.bat       # Windows 一键拉起 Electron 桌面端
├── electron-builder.json       # 桌面端打包配置文件 (可生成 .exe, .dmg, .AppImage)
└── docker-compose.yml          # Docker 容器化编排
```

---

## 快速安装与启动

### 环境前置要求
- **Node.js**: `>= 22.5`（使用内置 `node:sqlite`）
- **Python**: `3.12`（Windows 默认使用 `D:\python312\python.exe`）

### 方式一：Windows 一键启动
1. **启动桌面端 (推荐)**：双击运行 `scripts\start-desktop.bat`，脚本将自动拉起 Web 服务、Worker 节点并调起 Electron 原生桌面窗口。
2. **仅启动 Web 控制台**：双击运行 `scripts\start-web.bat`。
3. **仅启动 RPA Worker**：双击运行 `scripts\start-worker.bat`。

### 方式二：命令行手动启动

#### 1. 启动 Web & Express 全栈端 (Port 3000)
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```
打开浏览器访问：`http://localhost:3000`

#### 2. 启动 Python Playwright Worker (Port 8000)
```bash
cd services/worker
`D:\python312\python.exe` -m pip install -r requirements.txt
`D:\python312\python.exe` -m playwright install chromium
`D:\python312\python.exe` main.py
```

#### 3. 调起 Electron 桌面端
```bash
npm run electron
# 或执行全量热重载：
npm run electron:dev
```

#### 4. 打包桌面端安装包 (.exe / .dmg)
```bash
npm run electron:dist
```
安装包将自动输出至 `release/` 目录。

---

## 首次使用指引

### 第一步：注册真实企业与用户

首次打开应用时没有默认账号。请填写真实用户名、邮箱、密码、企业/组织名称和主品牌，注册后系统自动登录。加入已有企业时，需要企业管理员提供真实邀请码。

### 第二步：首次登录与授权各平台账号
1. 打开系统左侧导航的 **「账号矩阵」**。
2. 点击 **「添加平台新账号」**，选择目标平台（如小红书、抖音、微博等）。
3. **推荐方式**：选择 **「官方扫码授权」**，系统调用 Playwright 无头浏览器渲染官方实时二维码，使用手机 APP 扫描后系统自动捕获并在本地完成 **AES-256 加密存储**。
4. **备用方式**：选择 **「导入 Cookie / storageState」**，粘贴现有凭证，后端自动加密持久化。

### 第三步：编辑并发布第一条真实内容
1. 点击左侧导航 **「内容创作」**，填写真实标题、正文、媒体素材和标签。
2. 支持输入 Markdown 正文、长文章摘要、配图（支持多图画廊）或短视频链接。
3. 可点击 **「展开定制」** 为微博定制精炼字数，或为小红书定制吸睛爆款标题。
4. 点击 **「下一步：选择账号并发布」**，勾选已授权的目标账号。
5. 选择 **「立即开始分发」**，点击 **「确认并发起分发」**。

### 第四步：在「发布任务中心」跟踪执行日志与结果
1. 系统自动跳转至 **「发布任务」** 页面。
2. 实时查看 Playwright RPA 自动化执行进度：
   - `[初始化环境]` -> `[解密 storageState]` -> `[打开创作者后台]` -> `[填充素材与标签]` -> `[发布成功]`
3. 成功后直接点击 **「直接访问」** 打开线上各平台真实发布 URL；
4. 若遇平台风控或验证码，系统自动截取失败现场屏幕快照（Screenshot），支持一键点击 **「查看失败截图」** 和 **「重试任务」**。

---

## 验证状态与风控说明

- **真实 Playwright 适配器**：抖音、快手、小红书、微博、知乎、B站；实际可用范围取决于当前平台页面、账号登录态和人工验证码。
- **未配置平台**：今日头条、微信公众号。系统会返回 `NOT_CONFIGURED`，不会生成假的线上 URL。
- **人工验证**：若平台弹出滑动拼图或短信验证码，请在「系统设置」中关闭无头模式，完成登录后再继续任务。

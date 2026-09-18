# ContentOS 参考方案执行计划

## 目标

按 `ContentOS_Go_SaaS_Implementation_v2_开源参考增强版.md` 把现有原型逐步落成真实可运营应用。当前工作区已有大量用户修改，本计划在现有 Go + React + Python Worker 架构上增量执行，不回滚已有功能，也不把演示数据当业务结果。

## 阶段拆分

1. **真实数据基础闭环（已执行）**
   - Creator Persona 租户隔离的 CRUD API。
   - Memory Category / Item 的租户隔离 CRUD API。
   - 前端 Creator 与 Memory 页面只读真实接口，空数据进入空状态。
   - 账号凭证继续要求真实扫码或真实 Cookie 导入。
2. **内容生产闭环（进行中）**
   - 已完成 Topic、ContentPackage/MasterContent 的真实 CRUD 和前端空状态。
   - 待接入 ContentProject、PlatformContent、Review，以及真实 AI Gateway/异步 Job。
3. **运营发布闭环**
   - 日历、PublishTask、平台 Adapter、重试、发布日志和 Worker 回写。
4. **数据回流与学习**
   - 指标快照、分析接口、Performance Memory 和下一轮 Creator Context。
5. **商业化与企业治理**
   - RBAC/Casbin 边界、用量、积分 Ledger、订阅、支付、审计和通知。
6. **桌面发布与部署**
   - Electron 启动编排、Python 3.12 Worker、构建产物、Docker Compose 和发布验收。

## 本次验收标准

- 新注册用户的 Creator、Memory、Account 列表默认为空。
- 创建 Creator 后刷新页面仍能从 Go/MySQL 读取，不依赖浏览器状态。
- 删除或修改 Creator/Memory 不能访问其他企业的数据。
- 没有真实 Cookie/session 时，平台账号不会被创建为有效账号。
- `go test ./...`、`npm run lint`、`npm run build` 通过。

## 本轮执行结果

- 已完成 Creator、Memory、Topic、ContentPackage 的真实 API 与页面连接。
- 已验证无效身份访问四类新 API 均返回 401，路由未落入公开接口。
- 已验证 MySQL 自动迁移、Go 后端启动、前端 TypeScript 检查、Node 测试和生产构建通过。

## 执行顺序

每个垂直切片先增加失败测试，再实现最小代码，最后执行后端、前端和构建验证。未完成阶段保留在本文件中，不能用静态占位数据冒充已完成。

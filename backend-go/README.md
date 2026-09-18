# 智域 (ZhiYu) - 企业级 Go 后端工程

本项目为「智域 (ZhiYu)」全媒体智能创作与矩阵分发系统的生产级 Go 后端服务，基于 **Gin + GORM (MySQL 8.0) + Redis 7.x** 构建，采用业界标准的 **Clean Architecture (整洁架构 / 分层设计)**。

---

## 🏗️ 工程目录结构

```
backend-go/
├── cmd/
│   └── server/
│       └── main.go                    # 服务入口：依赖注入、配置装载、平滑停机
├── configs/
│   ├── config.yaml                    # 全局配置文件
│   └── config.example.yaml            # 配置模板
├── internal/                          # 私有业务包（外部不可引用）
│   ├── config/                        # 配置加载与 Viper 映射
│   ├── domain/                        # 领域模型、GORM 数据库实体与 DTO
│   ├── repository/                    # 数据访问层 (DAO)
│   │   ├── mysql/                     # GORM MySQL 实现 (AutoMigrate、连接池)
│   │   └── redis/                     # Redis Client、会话缓存、扫码临时态
│   ├── service/                       # 核心业务逻辑层 (Auth、Enterprise、Account、Publish)
│   └── delivery/
│       └── http/                      # HTTP 协议交付层
│           ├── handler/               # 控制器 (REST API Handlers)
│           ├── middleware/            # 中间件 (JWT、RBAC、Logger、CORS、Recovery)
│           ├── response/              # 统一标准响应与错误码
│           └── router/                # 路由注册中心 (/api/*)
├── pkg/                               # 可复用公共组件
│   ├── crypto/                        # 标准 AES-256-GCM 密文加解密
│   ├── jwt/                           # JWT Token 签发与解析
│   ├── logger/                        # Zap 高性能结构化日志
│   └── password/                      # 密码安全加盐 SHA-512 Hash
├── scripts/
│   ├── build.bat                      # 二进制编译脚本
│   └── run.bat                        # 本地运行脚本
├── go.mod
└── go.sum
```

---

## 🚀 核心特性

1. **多租户企业与矩阵组织体系**：
   - 支持多企业/团队创建与加入，主品牌与子品牌矩阵无缝切换。
   - 6 级 RBAC 细粒度角色权限矩阵（Owner、Admin、AssetAdmin、Operator、Publisher、Reviewer）。
2. **账号凭证与社交平台矩阵**：
   - 跨平台账号（小红书、抖音、快手、B站、视频号等）统一凭证管理。
   - AES-256-GCM 高强度密文存储，无缝兼容 `social-auto-upload` 与 Cookie 导入导出。
3. **分发任务编排与 RPA 调度**：
   - 批量任务创建、重试、取消与调度。
   - 异步 HTTP 调度 Python RPA Worker（Port 8000），支持失败自动重试与执行日志溯源。
4. **Redis 高速缓存与会话状态**：
   - Token 毫秒级在线状态验证与主动下线。
   - 扫码登录态管理（TTL 过期控制）。
5. **数据自动迁移与初始化导入**：
   - GORM `AutoMigrate` 自动建表与维护索引。
   - 首次启动自动将 `matrix_data.json` 数据平滑导入 MySQL，保障历史资产无损。

---

## 🛠️ 快速启动

### 1. 配置数据库与 Redis
编辑 `configs/config.yaml` 或 `.env` 文件，填入您的 MySQL 密码与连接信息：
```yaml
database:
  mysql:
    host: "127.0.0.1"
    port: 3306
    user: "root"
    password: "your_mysql_password"
    dbname: "zhiyu_db"
```

### 2. 编译并运行
- **开发模式运行**：
  ```bash
  scripts\run.bat
  ```
- **编译生产可执行文件**：
  ```bash
  scripts\build.bat
  ```
  生成产物位于 `bin/server.exe`。

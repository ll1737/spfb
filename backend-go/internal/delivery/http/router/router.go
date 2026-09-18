package router

import (
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"zhiyu-backend/internal/config"
	"zhiyu-backend/internal/delivery/http/handler"
	"zhiyu-backend/internal/delivery/http/middleware"
)

type Handlers struct {
	Auth           *handler.AuthHandler
	Enterprise     *handler.EnterpriseHandler
	Account        *handler.AccountHandler
	Publish        *handler.PublishHandler
	Memory         *handler.MemoryHandler
	Creator        *handler.CreatorHandler
	Topic          *handler.TopicHandler
	ContentPackage *handler.ContentPackageHandler
	ContentProject *handler.ContentProjectHandler
	Calendar       *handler.CalendarHandler
	Job            *handler.JobHandler
	Credit         *handler.CreditHandler
	Asset          *handler.AssetHandler
	Learning       *handler.LearningHandler
	Knowledge      *handler.KnowledgeHandler
	SocialUpload   *handler.SocialUploadHandler
	Settings       *handler.SettingsHandler
}

func SetupRouter(cfg *config.Config, h *Handlers) *gin.Engine {
	if cfg.Server.Mode == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()
	r.Use(middleware.Logger())
	r.Use(middleware.Recovery())
	r.Use(middleware.CORS())

	// Static route for snapshots
	r.Static("/debug_snapshots", "./debug_snapshots")

	// Public Health
	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":    "healthy",
			"framework": "Gin GORM Go 1.27",
			"system":    "智域 (ZhiYu) Enterprise Backend",
		})
	})

	api := r.Group("/api")
	{
		// Public Auth
		api.GET("/auth/status", h.Auth.AuthStatus)
		api.POST("/auth/login", h.Auth.Login)
		api.POST("/auth/register", h.Auth.Register)
		api.POST("/auth/logout", h.Auth.Logout)

		// Protected Routes
		authGroup := api.Group("")
		authGroup.Use(middleware.Auth(cfg))
		{
			// System Settings & Worker probe (Protected)
			authGroup.GET("/settings", h.Settings.GetSettings)
			authGroup.PUT("/settings", h.Settings.UpdateSettings)
			authGroup.POST("/settings", h.Settings.UpdateSettings)
			authGroup.POST("/worker/ping", h.Settings.PingWorker)

			// Social-upload CLI & Cookie export (Protected)
			authGroup.POST("/social-upload/cli-command", h.SocialUpload.GenerateCLI)
			authGroup.GET("/social-upload/export-cookie/:id", h.SocialUpload.ExportCookie)

			// Current User
			authGroup.GET("/auth/me", h.Auth.Me)
			authGroup.PUT("/auth/profile", h.Auth.UpdateProfile)
			authGroup.POST("/auth/change-password", h.Auth.ChangePassword)

			// Enterprise & Multi-Brand & RBAC
			authGroup.GET("/enterprise", h.Enterprise.GetEnterprise)
			authGroup.PUT("/enterprise", h.Enterprise.UpdateEnterprise)
			authGroup.POST("/enterprise/brands", h.Enterprise.AddBrand)
			authGroup.POST("/enterprise/brands/switch", h.Enterprise.SwitchBrand)
			authGroup.DELETE("/enterprise/brands/:id", h.Enterprise.DeleteBrand)
			authGroup.POST("/enterprise/members", h.Enterprise.AddMember)
			authGroup.PUT("/enterprise/members/:id", h.Enterprise.UpdateMember)
			authGroup.DELETE("/enterprise/members/:id", h.Enterprise.DeleteMember)
			authGroup.PUT("/enterprise/rules", h.Enterprise.UpdateRules)
			authGroup.GET("/enterprise/permissions", h.Enterprise.GetPermissions)
			authGroup.PUT("/enterprise/permissions", h.Enterprise.UpdatePermissions)

			// Accounts
			authGroup.GET("/accounts", h.Account.ListAccounts)
			authGroup.POST("/accounts", h.Account.AddAccount)
			authGroup.POST("/accounts/platform/:platform/:id/login/start", h.Account.StartPlatformLogin)
			authGroup.GET("/accounts/platform/:platform/:id/login/qrcode", h.Account.GetPlatformQRCode)
			authGroup.GET("/accounts/platform/:platform/:id/login/status", h.Account.GetPlatformLoginStatus)
			authGroup.PUT("/accounts/:id", h.Account.UpdateAccount)
			authGroup.DELETE("/accounts/:id", h.Account.DeleteAccount)
			authGroup.POST("/accounts/batch-delete", h.Account.BatchDelete)
			authGroup.POST("/accounts/:id/verify", h.Account.VerifyAccount)
			authGroup.POST("/accounts/login-session", h.Account.CreateLoginSession)
			authGroup.GET("/accounts/login-session/:id", h.Account.GetLoginSession)
			authGroup.POST("/accounts/login-session/:id/confirm", h.Account.ConfirmLoginSession)
			authGroup.POST("/social-upload/import-cookie", h.SocialUpload.ImportCookie)

			// Publish & Jobs & Tasks
			authGroup.GET("/jobs", h.Publish.ListJobs)
			authGroup.GET("/publish/:id", h.Publish.GetJob)
			authGroup.POST("/publish", h.Publish.CreateJob)
			authGroup.GET("/tasks", h.Publish.ListTasks)
			authGroup.POST("/tasks/:id/retry", h.Publish.RetryTask)
			authGroup.POST("/tasks/:id/cancel", h.Publish.CancelTask)

			// Creator aggregate (Creator + Persona + Plan)
			authGroup.GET("/creators", h.Creator.List)
			authGroup.POST("/creators", h.Creator.Create)
			authGroup.GET("/creators/ops-summary", h.Creator.ListOpsSummary)
			authGroup.GET("/creators/:id", h.Creator.Get)
			authGroup.PUT("/creators/:id", h.Creator.Update)
			authGroup.DELETE("/creators/:id", h.Creator.Delete)
			authGroup.GET("/creators/:id/plans", h.Creator.ListPlans)
			authGroup.PUT("/creators/:id/plans", h.Creator.SavePlan)

			// Legacy Persona compatibility API. New product pages must not use it.
			authGroup.GET("/creator-personas", h.Memory.ListCreators)
			authGroup.POST("/creator-personas", h.Memory.CreateCreator)
			authGroup.PUT("/creator-personas/:id", h.Memory.UpdateCreator)
			authGroup.DELETE("/creator-personas/:id", h.Memory.DeleteCreator)
			authGroup.GET("/memory/categories", h.Memory.ListCategories)
			authGroup.POST("/memory/categories", h.Memory.CreateCategory)
			authGroup.DELETE("/memory/categories/:id", h.Memory.DeleteCategory)
			authGroup.GET("/memory/items", h.Memory.ListItems)
			authGroup.POST("/memory/items", h.Memory.CreateItem)
			authGroup.DELETE("/memory/items/:id", h.Memory.DeleteItem)

			// Topics
			authGroup.GET("/topics", h.Topic.List)
			authGroup.GET("/topics/overview", h.Topic.GetOverview)
			authGroup.POST("/topics", h.Topic.Create)
			authGroup.POST("/topics/sync-trending", h.Topic.SyncTrending)
			authGroup.GET("/topics/preferences", h.Topic.GetPreferences)
			authGroup.POST("/topics/preferences", h.Topic.SavePreferences)
			authGroup.POST("/topics/generate-weekly-plan", h.Topic.GenerateWeeklyPlan)
			authGroup.DELETE("/topics/:id", h.Topic.Delete)

			// Content packages / Master Content
			authGroup.GET("/content-packages", h.ContentPackage.List)
			authGroup.POST("/content-packages", h.ContentPackage.Create)
			authGroup.DELETE("/content-packages/:id", h.ContentPackage.Delete)

			// Content Projects (SaaS AI Creator workflow)
			if h.ContentProject != nil {
				authGroup.GET("/content-projects", h.ContentProject.List)
				authGroup.POST("/content-projects", h.ContentProject.Create)
				authGroup.POST("/content-projects/generate-master", h.ContentProject.CreateAndGenerateMaster)
				authGroup.GET("/content-projects/:id", h.ContentProject.Get)
			}

			// Content Calendar & Scheduling
			if h.Calendar != nil {
				authGroup.GET("/calendar", h.Calendar.GetCalendar)
				authGroup.PUT("/calendar/tasks/:id/reschedule", h.Calendar.RescheduleTask)
			}

			// Async Jobs & Queue Progress
			if h.Job != nil {
				authGroup.GET("/async-jobs", h.Job.ListJobs)
				authGroup.GET("/async-jobs/:id", h.Job.GetJob)
			}

			// AI Credit & Wallet
			if h.Credit != nil {
				authGroup.GET("/credits/wallet", h.Credit.GetWallet)
				authGroup.GET("/credits/ledgers", h.Credit.ListLedgers)
			}

			// DAM Digital Assets
			if h.Asset != nil {
				authGroup.GET("/assets", h.Asset.ListAssets)
				authGroup.POST("/assets", h.Asset.CreateAsset)
			}

			// Analytics & AI Learning
			if h.Learning != nil {
				authGroup.POST("/analytics/snapshots", h.Learning.RecordSnapshot)
				authGroup.GET("/learning/creators/:creatorId/insights", h.Learning.AnalyzeMetrics)
				authGroup.POST("/learning/insights/:id/approve", h.Learning.ApproveInsight)
			}

			if h.Knowledge != nil {
				authGroup.GET("/knowledge/documents", h.Knowledge.List)
				authGroup.POST("/knowledge/documents", h.Knowledge.Create)
				authGroup.DELETE("/knowledge/documents/:id", h.Knowledge.Delete)
			}
		}
	}

	// Static SPA fallback
	for _, distPath := range []string{"./dist", "../dist"} {
		if fi, err := os.Stat(distPath); err == nil && fi.IsDir() {
			r.Static("/assets", distPath+"/assets")
			r.NoRoute(func(c *gin.Context) {
				if !strings.HasPrefix(c.Request.URL.Path, "/api") && !strings.HasPrefix(c.Request.URL.Path, "/debug_snapshots") {
					c.File(distPath + "/index.html")
				}
			})
			break
		}
	}

	return r
}

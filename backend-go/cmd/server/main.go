package main

import (
	"fmt"
	"net/http"
	"os"
	"time"

	"zhiyu-backend/internal/aigateway"
	"zhiyu-backend/internal/asset"
	"zhiyu-backend/internal/calendar"
	"zhiyu-backend/internal/config"
	creatorapp "zhiyu-backend/internal/creator"
	"zhiyu-backend/internal/credit"
	"zhiyu-backend/internal/delivery/http/handler"
	"zhiyu-backend/internal/delivery/http/router"
	"zhiyu-backend/internal/knowledge"
	"zhiyu-backend/internal/learning"
	"zhiyu-backend/internal/platformcontent/adapter"
	"zhiyu-backend/internal/prompt"
	"zhiyu-backend/internal/queue"
	"zhiyu-backend/internal/repository/mysql"
	"zhiyu-backend/internal/repository/redis"
	"zhiyu-backend/internal/service"
	"zhiyu-backend/internal/topic"
	"zhiyu-backend/pkg/logger"
)

func main() {
	// 1. Load Config
	cfg, err := config.LoadConfig("")
	if err != nil {
		fmt.Printf("Failed to load config: %v\n", err)
		os.Exit(1)
	}

	// 2. Initialize Logger
	log := logger.InitLogger(cfg.Log)
	defer log.Sync()

	log.Infof("Starting 智域 (ZhiYu) Enterprise Backend Server [Port: %d, Mode: %s]...", cfg.Server.Port, cfg.Server.Mode)

	// 3. Initialize MySQL Database & AutoMigrate
	db, err := mysql.InitMySQL(cfg.Database.MySQL)
	if err != nil {
		log.Fatalf("MySQL initialization failed: %v", err)
	}

	// 4. Initialize Redis Client
	rdb, err := redis.InitRedis(cfg.Redis)
	if err != nil {
		log.Warnf("Redis initialization warning: %v", err)
	}
	_ = rdb

	// 5. Legacy data import is opt-in. Never seed test accounts into a fresh runtime by default.
	if os.Getenv("IMPORT_LEGACY_DATA") == "true" {
		migrationService := service.NewMigrationService(db)
		if err := migrationService.AutoImportFromJSON("matrix_data.json", "../matrix_data.json"); err != nil {
			log.Warnf("Initial data seed error: %v", err)
		}
	} else {
		log.Info("Skipping legacy matrix_data.json import; set IMPORT_LEGACY_DATA=true only for an explicit migration")
	}

	// 6. Initialize Repositories (Data Layer)
	userRepo := mysql.NewUserRepository(db)
	entRepo := mysql.NewEnterpriseRepository(db)
	accRepo := mysql.NewAccountRepository(db)
	pubRepo := mysql.NewPublishRepository(db)
	memRepo := mysql.NewMemoryRepository(db)
	topicRepo := mysql.NewTopicRepository(db)
	contentPackageRepo := mysql.NewContentPackageRepository(db)
	contentProjectRepo := mysql.NewContentProjectRepository(db)
	creatorRepo := mysql.NewCreatorRepository(db)
	knowledgeRepo := mysql.NewKnowledgeRepository(db)

	// 7. Initialize AI Infrastructure & Platform Adapters & Async Queue
	aiGateway := aigateway.NewAIGateway()
	if baseURL, model := os.Getenv("AI_BASE_URL"), os.Getenv("AI_MODEL"); baseURL != "" && model != "" {
		providerName := os.Getenv("AI_PROVIDER")
		if providerName == "" {
			providerName = "openai-compatible"
		}
		aiGateway.RegisterProvider(providerName, aigateway.NewOpenAICompatibleProvider(aigateway.OpenAICompatibleConfig{
			Name:         providerName,
			BaseURL:      baseURL,
			APIKey:       os.Getenv("AI_API_KEY"),
			DefaultModel: model,
			TimeoutSec:   90,
		}), true)
		log.Infof("AI Gateway provider registered: %s / %s", providerName, model)
	} else {
		log.Warn("AI Gateway is not configured; AI generation endpoints will return an explicit error")
	}
	promptService := prompt.NewPromptService(db)
	adapterRegistry := adapter.NewAdapterRegistry()
	jobQueue := queue.NewJobQueue()

	// 8. Initialize Services (Business Layer)
	workerClient := service.NewWorkerClient(cfg)
	authService := service.NewAuthService(userRepo, entRepo, cfg)
	entService := service.NewEnterpriseService(entRepo, userRepo)
	accService := service.NewAccountService(accRepo, cfg)
	pubService := service.NewPublishService(pubRepo, accRepo, workerClient, cfg)
	contentProjectService := service.NewContentProjectService(contentProjectRepo, aiGateway, promptService, adapterRegistry)
	calendarService := calendar.NewCalendarService(db)
	creditService := credit.NewCreditService(db)
	assetService := asset.NewAssetService(db)
	learningService := learning.NewLearningService(db, aiGateway)
	creatorService := creatorapp.NewService(creatorRepo, nil)
	knowledgeService := knowledge.NewService(knowledgeRepo, nil)
	topicService := topic.NewTopicService(topicRepo)

	// 9. Initialize Handlers (Delivery Layer)
	handlers := &router.Handlers{
		Auth:           handler.NewAuthHandler(authService, entService),
		Enterprise:     handler.NewEnterpriseHandler(entService),
		Account:        handler.NewAccountHandler(accService, workerClient),
		Publish:        handler.NewPublishHandler(pubService),
		Memory:         handler.NewMemoryHandler(memRepo),
		Creator:        handler.NewCreatorHandler(creatorService),
		Topic:          handler.NewTopicHandler(topicRepo, topicService),
		ContentPackage: handler.NewContentPackageHandler(contentPackageRepo),
		ContentProject: handler.NewContentProjectHandler(contentProjectService, creatorService),
		Calendar:       handler.NewCalendarHandler(calendarService),
		Job:            handler.NewJobHandler(jobQueue),
		Credit:         handler.NewCreditHandler(creditService),
		Asset:          handler.NewAssetHandler(assetService),
		Learning:       handler.NewLearningHandler(learningService),
		Knowledge:      handler.NewKnowledgeHandler(knowledgeService),
		SocialUpload:   handler.NewSocialUploadHandler(accService),
		Settings:       handler.NewSettingsHandler(cfg, workerClient),
	}

	// 9. Setup Router
	r := router.SetupRouter(cfg, handlers)

	// 10. Start HTTP Server with Graceful Shutdown
	addr := fmt.Sprintf(":%d", cfg.Server.Port)
	srv := &http.Server{
		Addr:           addr,
		Handler:        r,
		ReadTimeout:    30 * time.Second,
		WriteTimeout:   30 * time.Second,
		MaxHeaderBytes: 50 << 20, // 50MB
	}

	log.Infof("Server listening on http://0.0.0.0:%d", cfg.Server.Port)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Server failed to listen: %v", err)
	}
}

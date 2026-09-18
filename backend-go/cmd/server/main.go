package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"zhiyu-backend/internal/config"
	"zhiyu-backend/internal/delivery/http/handler"
	"zhiyu-backend/internal/delivery/http/router"
	"zhiyu-backend/internal/repository/mysql"
	"zhiyu-backend/internal/repository/redis"
	"zhiyu-backend/internal/service"
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

	// 7. Initialize Services (Business Layer)
	workerClient := service.NewWorkerClient(cfg)
	authService := service.NewAuthService(userRepo, entRepo, cfg)
	entService := service.NewEnterpriseService(entRepo, userRepo)
	accService := service.NewAccountService(accRepo, cfg)
	pubService := service.NewPublishService(pubRepo, accRepo, workerClient, cfg)

	// 8. Initialize Handlers (Delivery Layer)
	handlers := &router.Handlers{
		Auth:         handler.NewAuthHandler(authService, entService),
		Enterprise:   handler.NewEnterpriseHandler(entService),
		Account:      handler.NewAccountHandler(accService, workerClient),
		Publish:      handler.NewPublishHandler(pubService),
		Memory:       handler.NewMemoryHandler(memRepo),
		Topic:        handler.NewTopicHandler(topicRepo),
		ContentPackage: handler.NewContentPackageHandler(contentPackageRepo),
		SocialUpload: handler.NewSocialUploadHandler(accService),
		Settings:     handler.NewSettingsHandler(cfg, workerClient),
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

	go func() {
		log.Infof("Server listening on http://0.0.0.0:%d", cfg.Server.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed to listen: %v", err)
		}
	}()

	// 11. Graceful Shutdown Signal Handling
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Info("Shutting down 智域 Enterprise Backend Server gracefully...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Errorf("Server forced to shutdown: %v", err)
	}

	log.Info("Server exited cleanly.")
}

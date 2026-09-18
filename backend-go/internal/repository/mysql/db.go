package mysql

import (
	"database/sql"
	"fmt"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"
	"zhiyu-backend/internal/config"
	"zhiyu-backend/internal/domain"
	"zhiyu-backend/pkg/logger"
)

var DB *gorm.DB

// InitMySQL connects to MySQL, creates database if not exists, and performs AutoMigrate
func InitMySQL(cfg config.MySQLConfig) (*gorm.DB, error) {
	// 1. Ensure database exists
	rootDSN := cfg.RootDSN()
	rootDB, err := sql.Open("mysql", rootDSN)
	if err == nil {
		defer rootDB.Close()
		query := fmt.Sprintf("CREATE DATABASE IF NOT EXISTS `%s` CHARACTER SET %s COLLATE %s_general_ci;",
			cfg.DBName, cfg.Charset, cfg.Charset)
		if _, execErr := rootDB.Exec(query); execErr != nil {
			logger.Log.Warnf("Could not auto-create database: %v", execErr)
		} else {
			logger.Log.Infof("Database `%s` checked/created successfully", cfg.DBName)
		}
	}

	// 2. Connect with GORM
	dsn := cfg.DSN()
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: gormlogger.Default.LogMode(gormlogger.Warn),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to MySQL: %w", err)
	}

	// 3. Configure Connection Pool
	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get generic DB from GORM: %w", err)
	}

	maxOpen := cfg.MaxOpenConns
	if maxOpen <= 0 {
		maxOpen = 100
	}
	maxIdle := cfg.MaxIdleConns
	if maxIdle <= 0 {
		maxIdle = 20
	}
	connMaxLifetime := time.Duration(cfg.ConnMaxLifetimeMin) * time.Minute
	if connMaxLifetime <= 0 {
		connMaxLifetime = 10 * time.Minute
	}

	sqlDB.SetMaxOpenConns(maxOpen)
	sqlDB.SetMaxIdleConns(maxIdle)
	sqlDB.SetConnMaxLifetime(connMaxLifetime)

	// 4. Auto Migration
	if cfg.AutoMigrate {
		err = db.AutoMigrate(
			&domain.User{},
			&domain.Tenant{},
			&domain.TenantMember{},
			&domain.EnterpriseInfo{},
			&domain.Brand{},
			&domain.TeamMember{},
			&domain.CollaborationRule{},
			&domain.ModulePermissionRule{},
			&domain.Account{},
			&domain.PublishJob{},
			&domain.PublishTask{},
			&domain.Creator{},
			&domain.CreatorPlan{},
			&domain.CreatorPlanPlatform{},
			&domain.CreatorPersona{},
			&domain.MemoryCategory{},
			&domain.MemoryItem{},
			&domain.Topic{},
			&domain.ContentPackage{},
			&domain.ContentProject{},
			&domain.MasterContent{},
			&domain.PlatformContent{},
			&domain.ContentVersion{},
			&domain.ContentReview{},
			&domain.PromptTemplate{},
			&domain.CreditWallet{},
			&domain.CreditLedger{},
			&domain.Plan{},
			&domain.Subscription{},
			&domain.Asset{},
			&domain.ContentMetricSnapshot{},
			&domain.PerformanceInsight{},
			&domain.AuditLog{},
		)
		if err != nil {
			return nil, fmt.Errorf("failed to auto migrate tables: %w", err)
		}
		logger.Log.Info("GORM MySQL AutoMigrate completed for all domain models")
	}

	DB = db
	return db, nil
}

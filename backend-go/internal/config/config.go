package config

import (
	"fmt"
	"strings"
	"time"

	"github.com/spf13/viper"
)

type Config struct {
	Server   ServerConfig   `mapstructure:"server"`
	Database DatabaseConfig `mapstructure:"database"`
	Redis    RedisConfig    `mapstructure:"redis"`
	JWT      JWTConfig      `mapstructure:"jwt"`
	Log      LogConfig      `mapstructure:"log"`
}

type ServerConfig struct {
	Port         int    `mapstructure:"port"`
	Mode         string `mapstructure:"mode"`
	AppSecret    string `mapstructure:"app_secret"`
	WorkerURL    string `mapstructure:"worker_url"`
	WorkerAPIKey string `mapstructure:"worker_api_key"`
}

type DatabaseConfig struct {
	MySQL MySQLConfig `mapstructure:"mysql"`
}

type MySQLConfig struct {
	Host               string `mapstructure:"host"`
	Port               int    `mapstructure:"port"`
	User               string `mapstructure:"user"`
	Password           string `mapstructure:"password"`
	DBName             string `mapstructure:"dbname"`
	Charset            string `mapstructure:"charset"`
	MaxOpenConns       int    `mapstructure:"max_open_conns"`
	MaxIdleConns       int    `mapstructure:"max_idle_conns"`
	ConnMaxLifetimeMin int    `mapstructure:"conn_max_lifetime_min"`
	AutoMigrate        bool   `mapstructure:"auto_migrate"`
}

func (m MySQLConfig) DSN() string {
	return fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=%s&collation=utf8mb4_unicode_ci&parseTime=True&loc=Local",
		m.User, m.Password, m.Host, m.Port, m.DBName, m.Charset)
}

func (m MySQLConfig) RootDSN() string {
	return fmt.Sprintf("%s:%s@tcp(%s:%d)/?charset=%s&collation=utf8mb4_unicode_ci&parseTime=True&loc=Local",
		m.User, m.Password, m.Host, m.Port, m.Charset)
}

type RedisConfig struct {
	Host         string `mapstructure:"host"`
	Port         int    `mapstructure:"port"`
	Password     string `mapstructure:"password"`
	DB           int    `mapstructure:"db"`
	PoolSize     int    `mapstructure:"pool_size"`
	MinIdleConns int    `mapstructure:"min_idle_conns"`
}

func (r RedisConfig) Addr() string {
	return fmt.Sprintf("%s:%d", r.Host, r.Port)
}

type JWTConfig struct {
	Secret      string `mapstructure:"secret"`
	ExpireHours int    `mapstructure:"expire_hours"`
}

func (j JWTConfig) ExpireDuration() time.Duration {
	if j.ExpireHours <= 0 {
		return 7 * 24 * time.Hour
	}
	return time.Duration(j.ExpireHours) * time.Hour
}

type LogConfig struct {
	Level      string `mapstructure:"level"`
	Filename   string `mapstructure:"filename"`
	MaxSize    int    `mapstructure:"max_size"`
	MaxBackups int    `mapstructure:"max_backups"`
	MaxAge     int    `mapstructure:"max_age"`
	Compress   bool   `mapstructure:"compress"`
}

var GlobalConfig *Config

func LoadConfig(configPath string) (*Config, error) {
	v := viper.New()
	if configPath != "" {
		v.SetConfigFile(configPath)
	} else {
		v.AddConfigPath("./configs")
		v.AddConfigPath("../configs")
		v.AddConfigPath("../../configs")
		v.SetConfigName("config")
		v.SetConfigType("yaml")
	}

	v.AutomaticEnv()
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))

	if err := v.ReadInConfig(); err != nil {
		// Fallback to default configs
		fmt.Printf("[Config] Warning: config file not found (%v), using defaults\n", err)
	}

	var cfg Config
	if err := v.Unmarshal(&cfg); err != nil {
		return nil, fmt.Errorf("failed to unmarshal config: %w", err)
	}

	// Apply defaults if empty
	if cfg.Server.Port == 0 {
		cfg.Server.Port = 3000
	}
	if cfg.Database.MySQL.Port == 0 {
		cfg.Database.MySQL.Port = 3306
	}
	if cfg.Database.MySQL.Host == "" {
		cfg.Database.MySQL.Host = "127.0.0.1"
	}
	if cfg.Database.MySQL.User == "" {
		cfg.Database.MySQL.User = "root"
	}
	if cfg.Database.MySQL.DBName == "" {
		cfg.Database.MySQL.DBName = "zhiyu_db"
	}
	if cfg.Database.MySQL.Charset == "" {
		cfg.Database.MySQL.Charset = "utf8mb4"
	}
	if cfg.Redis.Host == "" {
		cfg.Redis.Host = "127.0.0.1"
	}
	if cfg.Redis.Port == 0 {
		cfg.Redis.Port = 6379
	}
	if cfg.JWT.Secret == "" {
		cfg.JWT.Secret = "zhiyu_jwt_super_secret_token_2026"
	}
	if cfg.Server.AppSecret == "" {
		cfg.Server.AppSecret = "zhiyu_matrix_app_secret_super_secure_2026"
	}

	GlobalConfig = &cfg
	return &cfg, nil
}

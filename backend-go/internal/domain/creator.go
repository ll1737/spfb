package domain

import (
	"time"
)

// Creator represents an AI Creator entity operating under a Tenant & Brand
type Creator struct {
	ID              string    `gorm:"primaryKey;size:64" json:"id"`
	TenantID        string    `gorm:"index;size:64;not null" json:"tenantId"`
	BrandID         string    `gorm:"index;size:64;not null" json:"brandId"`
	Name            string    `gorm:"size:128;not null" json:"name"`
	Avatar          string    `gorm:"size:512" json:"avatar"`
	Type            string    `gorm:"size:32;default:'expert'" json:"type"` // expert | influencer | brand_spokesperson | virtual_anchor
	Industry        string    `gorm:"size:64" json:"industry"`
	Profession      string    `gorm:"size:64" json:"profession"`
	Intro           string    `gorm:"type:text" json:"intro"`
	Status          string    `gorm:"size:32;default:'active'" json:"status"`         // active | paused | archived
	ProductionMode  string    `gorm:"size:32;default:'manual'" json:"productionMode"` // auto | semi_auto | manual
	DailyTarget     int       `gorm:"default:2" json:"dailyTarget"`                   // number of posts per day
	DefaultTimezone string    `gorm:"size:64;default:'Asia/Shanghai'" json:"defaultTimezone"`
	CreatedBy       string    `gorm:"size:64" json:"createdBy"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`

	// Relational / View Helpers
	Persona *CreatorPersona `gorm:"foreignKey:CreatorID" json:"persona,omitempty"`
	Plans   []CreatorPlan   `gorm:"foreignKey:CreatorID" json:"plans,omitempty"`
}

// CreatorPlan defines scheduled operating rhythm (daily/weekly/monthly target)
type CreatorPlan struct {
	ID             string    `gorm:"primaryKey;size:64" json:"id"`
	TenantID       string    `gorm:"index;size:64;not null" json:"tenantId"`
	CreatorID      string    `gorm:"index;size:64;not null" json:"creatorId"`
	PlanType       string    `gorm:"size:32;default:'daily'" json:"planType"` // daily | weekly | monthly
	StartDate      string    `gorm:"size:32" json:"startDate"`
	EndDate        string    `gorm:"size:32" json:"endDate"`
	DailyTarget    int       `gorm:"default:2" json:"dailyTarget"`
	ProductionMode string    `gorm:"size:32;default:'manual'" json:"productionMode"`
	Status         string    `gorm:"size:32;default:'active'" json:"status"` // active | paused | completed
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`

	Platforms []CreatorPlanPlatform `gorm:"foreignKey:PlanID" json:"platforms,omitempty"`
}

// CreatorPlanPlatform defines per-platform publishing time slots
type CreatorPlanPlatform struct {
	ID               uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	PlanID           string    `gorm:"index;size:64;not null" json:"planId"`
	Platform         string    `gorm:"size:32;not null" json:"platform"` // xiaohongshu | douyin | wechat_channel | etc.
	AccountID        string    `gorm:"size:64;not null" json:"accountId"`
	DailyCount       int       `gorm:"default:1" json:"dailyCount"`
	PublishTimesJSON string    `gorm:"type:text" json:"publishTimesJson"` // e.g. ["10:00", "18:00"]
	PublishTimes     []string  `gorm:"-" json:"publishTimes"`
	CreatedAt        time.Time `json:"createdAt"`
	UpdatedAt        time.Time `json:"updatedAt"`
}

// CreatorAIContext is the fully assembled context injected into AI prompts
type CreatorAIContext struct {
	CreatorID             string   `json:"creatorId"`
	CreatorName           string   `json:"creatorName"`
	Profession            string   `json:"profession"`
	ToneStyle             string   `json:"toneStyle"`
	SystemPrompt          string   `json:"systemPrompt"`
	ProhibitedExpressions []string `json:"prohibitedExpressions,omitempty"`
	PreferredExpressions  []string `json:"preferredExpressions,omitempty"`
	CoreMemories          []string `json:"coreMemories,omitempty"`
	PerformanceInsights   []string `json:"performanceInsights,omitempty"`
	BrandRules            string   `json:"brandRules,omitempty"`
	KnowledgeSnippets     []string `json:"knowledgeSnippets,omitempty"`
}

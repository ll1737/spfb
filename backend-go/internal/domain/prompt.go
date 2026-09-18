package domain

import (
	"time"
)

// PromptTemplate represents configurable, versioned prompt templates
type PromptTemplate struct {
	ID          string    `gorm:"primaryKey;size:64" json:"id"`
	TenantID    string    `gorm:"index;size:64" json:"tenantId,omitempty"` // nullable for global default
	Code        string    `gorm:"index;size:64;not null" json:"code"`      // e.g. "creator.topic.generate.v1"
	Name        string    `gorm:"size:128;not null" json:"name"`
	TaskType    string    `gorm:"size:64;not null" json:"taskType"`        // topic | master_content | platform_rewrite | ai_review
	Version     int       `gorm:"default:1" json:"version"`
	Template    string    `gorm:"type:longtext;not null" json:"template"`
	ModelHint   string    `gorm:"size:64" json:"modelHint,omitempty"`      // deepseek-chat | qwen-plus | gpt-4o
	Description string    `gorm:"size:256" json:"description,omitempty"`
	Status      string    `gorm:"size:32;default:'active'" json:"status"`  // active | draft | archived
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

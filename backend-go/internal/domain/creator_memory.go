package domain

import (
	"time"
)

type CreatorPersona struct {
	ID                    string    `gorm:"primaryKey;size:64" json:"id"`
	TenantID              string    `gorm:"index;size:64" json:"tenantId,omitempty"`
	OrgID                 string    `gorm:"index;size:64" json:"orgId,omitempty"`
	BrandID               string    `gorm:"index;size:64" json:"brandId,omitempty"`
	CreatorID             string    `gorm:"index;size:64" json:"creatorId,omitempty"`
	Name                  string    `gorm:"size:128;not null" json:"name"`
	Avatar                string    `gorm:"size:512" json:"avatar"`
	Title                 string    `gorm:"size:128" json:"title"`
	Domain                string    `gorm:"size:64" json:"domain"`
	ToneStyle             string    `gorm:"size:128" json:"toneStyle"`
	SystemPrompt          string    `gorm:"type:text" json:"systemPrompt"`
	KnowledgeBase         string    `gorm:"type:text" json:"knowledgeBase"`
	TargetAudience        string    `gorm:"size:256" json:"targetAudience"`
	ProhibitedExpressions string    `gorm:"type:text" json:"prohibitedExpressions,omitempty"`
	PreferredExpressions  string    `gorm:"type:text" json:"preferredExpressions,omitempty"`
	CTAStyle              string    `gorm:"size:256" json:"ctaStyle,omitempty"`
	Version               int       `gorm:"default:1" json:"version"`
	Status                string    `gorm:"size:32;default:'active'" json:"status"`
	CreatedAt             time.Time `json:"createdAt"`
	UpdatedAt             time.Time `json:"updatedAt"`
}

type MemoryCategory struct {
	ID          string    `gorm:"primaryKey;size:64" json:"id"`
	OrgID       string    `gorm:"index;size:64" json:"orgId,omitempty"`
	Name        string    `gorm:"size:128;not null" json:"name"`
	Icon        string    `gorm:"size:64" json:"icon"`
	Description string    `gorm:"size:256" json:"description"`
	ItemCount   int       `gorm:"default:0" json:"itemCount"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type MemoryItem struct {
	ID         string    `gorm:"primaryKey;size:64" json:"id"`
	OrgID      string    `gorm:"index;size:64" json:"orgId,omitempty"`
	BrandID    string    `gorm:"index;size:64" json:"brandId,omitempty"`
	CategoryID string    `gorm:"index;size:64;not null" json:"categoryId"`
	Title      string    `gorm:"size:256;not null" json:"title"`
	Content    string    `gorm:"type:longtext;not null" json:"content"`
	TagsJSON   string    `gorm:"type:text" json:"-"`
	Tags       []string  `gorm:"-" json:"tags"`
	Weight     float64   `gorm:"default:1.0" json:"weight"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}

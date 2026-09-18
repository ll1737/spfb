package domain

import (
	"time"
)

// ContentMetricSnapshot records periodic time-series metrics from platforms
type ContentMetricSnapshot struct {
	ID               string    `gorm:"primaryKey;size:64" json:"id"`
	TenantID         string    `gorm:"index;size:64;not null" json:"tenantId"`
	CreatorID        string    `gorm:"index;size:64" json:"creatorId,omitempty"`
	ContentProjectID string    `gorm:"index;size:64;not null" json:"contentProjectId"`
	PublishTaskID    string    `gorm:"index;size:64" json:"publishTaskId,omitempty"`
	Platform         string    `gorm:"size:32;not null" json:"platform"`
	Impressions      int64     `gorm:"default:0" json:"impressions"`
	Views            int64     `gorm:"default:0" json:"views"`
	Likes            int64     `gorm:"default:0" json:"likes"`
	Comments         int64     `gorm:"default:0" json:"comments"`
	Favorites        int64     `gorm:"default:0" json:"favorites"`
	Shares           int64     `gorm:"default:0" json:"shares"`
	FollowersGain    int64     `gorm:"default:0" json:"followersGain"`
	Leads            int64     `gorm:"default:0" json:"leads"`
	EngagementRate   float64   `gorm:"default:0" json:"engagementRate"` // (likes+comments+favorites)/views
	CollectedAt      time.Time `json:"collectedAt"`
	CreatedAt        time.Time `json:"createdAt"`
}

// PerformanceInsight captures AI-learned insights from top-performing content
type PerformanceInsight struct {
	ID           string    `gorm:"primaryKey;size:64" json:"id"`
	TenantID     string    `gorm:"index;size:64;not null" json:"tenantId"`
	CreatorID    string    `gorm:"index;size:64;not null" json:"creatorId"`
	InsightType  string    `gorm:"size:64;not null" json:"insightType"` // HOOK | STRUCTURE | CTA | TOPIC | TIMING
	Statement    string    `gorm:"type:text;not null" json:"statement"`
	EvidenceJSON string    `gorm:"type:text" json:"evidenceJson"`
	SampleSize   int       `gorm:"default:1" json:"sampleSize"`
	Confidence   float64   `gorm:"default:0.85" json:"confidence"`
	Status       string    `gorm:"size:32;default:'pending'" json:"status"` // pending | approved | rejected | archived
	ApprovedBy   string    `gorm:"size:64" json:"approvedBy,omitempty"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

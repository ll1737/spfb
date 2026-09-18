package domain

import (
	"time"
)

// ProjectStatus defines the lifecycle states of a ContentProject
type ProjectStatus string

const (
	ProjectStatusDraft           ProjectStatus = "DRAFT"
	ProjectStatusTopicReady      ProjectStatus = "TOPIC_READY"
	ProjectStatusGenerating      ProjectStatus = "GENERATING"
	ProjectStatusContentReady    ProjectStatus = "CONTENT_READY"
	ProjectStatusMediaGenerating ProjectStatus = "MEDIA_GENERATING"
	ProjectStatusReviewing       ProjectStatus = "REVIEWING"
	ProjectStatusRejected        ProjectStatus = "REJECTED"
	ProjectStatusApproved        ProjectStatus = "APPROVED"
	ProjectStatusScheduled       ProjectStatus = "SCHEDULED"
	ProjectStatusPublishing      ProjectStatus = "PUBLISHING"
	ProjectStatusPublished       ProjectStatus = "PUBLISHED"
	ProjectStatusPartialFailed   ProjectStatus = "PARTIAL_FAILED"
	ProjectStatusFailed          ProjectStatus = "FAILED"
	ProjectStatusArchived        ProjectStatus = "ARCHIVED"
)

// ContentProject is the central aggregate root for all content production
type ContentProject struct {
	ID          string        `gorm:"primaryKey;size:64" json:"id"`
	TenantID    string        `gorm:"index;size:64;not null" json:"tenantId"`
	BrandID     string        `gorm:"index;size:64" json:"brandId,omitempty"`
	CreatorID   string        `gorm:"index;size:64;not null" json:"creatorId"`
	TopicID     string        `gorm:"size:64" json:"topicId,omitempty"`
	SeriesID    string        `gorm:"size:64" json:"seriesId,omitempty"`
	Title       string        `gorm:"size:256;not null" json:"title"`
	ContentType string        `gorm:"size:32;default:'article'" json:"contentType"` // article | note | video | multi_platform
	Status      ProjectStatus `gorm:"size:32;default:'DRAFT'" json:"status"`
	CurrentStep string        `gorm:"size:64;default:'init'" json:"currentStep"`
	ScheduledAt *time.Time    `json:"scheduledAt,omitempty"`
	CreatedBy   string        `gorm:"size:64" json:"createdBy"`
	CreatedAt   time.Time     `json:"createdAt"`
	UpdatedAt   time.Time     `json:"updatedAt"`

	// Sub-entities
	MasterContent    *MasterContent    `gorm:"foreignKey:ContentProjectID" json:"masterContent,omitempty"`
	PlatformContents []PlatformContent `gorm:"foreignKey:ContentProjectID" json:"platformContents,omitempty"`
	Reviews          []ContentReview   `gorm:"foreignKey:ContentProjectID" json:"reviews,omitempty"`
}

// MasterContent represents the canonical master manuscript
type MasterContent struct {
	ID                 string    `gorm:"primaryKey;size:64" json:"id"`
	ContentProjectID   string    `gorm:"uniqueIndex;size:64;not null" json:"contentProjectId"`
	Title              string    `gorm:"size:256;not null" json:"title"`
	Summary            string    `gorm:"type:text" json:"summary"`
	Hook               string    `gorm:"size:512" json:"hook"`
	CorePointsJSON     string    `gorm:"type:text" json:"-"`
	CorePoints         []string  `gorm:"-" json:"corePoints"`
	Body               string    `gorm:"type:longtext;not null" json:"body"`
	CTA                string    `gorm:"size:512" json:"cta"`
	SourceCitationsJSON string   `gorm:"type:text" json:"-"`
	Version            int       `gorm:"default:1" json:"version"`
	AIGenerated        bool      `gorm:"default:true" json:"aiGenerated"`
	CreatedAt          time.Time `json:"createdAt"`
	UpdatedAt          time.Time `json:"updatedAt"`
}

// PlatformContent represents platform-specific adapted content
type PlatformContent struct {
	ID               string    `gorm:"primaryKey;size:64" json:"id"`
	ContentProjectID string    `gorm:"index;size:64;not null" json:"contentProjectId"`
	Platform         string    `gorm:"size:32;not null" json:"platform"` // xiaohongshu | douyin | wechat_channel | zhihu | weibo
	Title            string    `gorm:"size:256" json:"title"`
	Body             string    `gorm:"type:longtext;not null" json:"body"`
	MediaUrlsJSON    string    `gorm:"type:text" json:"-"`
	MediaUrls        []string  `gorm:"-" json:"mediaUrls"`
	HashtagsJSON     string    `gorm:"type:text" json:"-"`
	Hashtags         []string  `gorm:"-" json:"hashtags"`
	CoverImageURL    string    `gorm:"size:512" json:"coverImageUrl,omitempty"`
	Status           string    `gorm:"size:32;default:'draft'" json:"status"` // draft | ready | published
	Version          int       `gorm:"default:1" json:"version"`
	CreatedAt        time.Time `json:"createdAt"`
	UpdatedAt        time.Time `json:"updatedAt"`
}

// ContentVersion stores editing history for rollback and tracking
type ContentVersion struct {
	ID          string    `gorm:"primaryKey;size:64" json:"id"`
	ContentID   string    `gorm:"index;size:64;not null" json:"contentId"`
	ContentType string    `gorm:"size:32;not null" json:"contentType"` // master | platform
	Version     int       `gorm:"not null" json:"version"`
	Content     string    `gorm:"type:longtext;not null" json:"content"`
	Source      string    `gorm:"size:32;default:'ai'" json:"source"` // ai | user | system
	Instruction string    `gorm:"size:256" json:"instruction,omitempty"`
	CreatedBy   string    `gorm:"size:64" json:"createdBy"`
	CreatedAt   time.Time `json:"createdAt"`
}

// ContentReview records AI and manual audit results
type ContentReview struct {
	ID               string    `gorm:"primaryKey;size:64" json:"id"`
	TenantID         string    `gorm:"index;size:64;not null" json:"tenantId"`
	ContentProjectID string    `gorm:"index;size:64;not null" json:"contentProjectId"`
	ReviewerType     string    `gorm:"size:32;default:'ai'" json:"reviewerType"` // ai | user
	ReviewerID       string    `gorm:"size:64" json:"reviewerId,omitempty"`
	Status           string    `gorm:"size:32;default:'passed'" json:"status"` // passed | rejected | warning
	OverallScore     int       `gorm:"default:90" json:"overallScore"`
	PersonaScore     int       `gorm:"default:90" json:"personaScore"`
	BrandScore       int       `gorm:"default:90" json:"brandScore"`
	ComplianceScore  int       `gorm:"default:95" json:"complianceScore"`
	PlatformScore    int       `gorm:"default:90" json:"platformScore"`
	RisksJSON        string    `gorm:"type:text" json:"risksJson"`
	SuggestionsJSON  string    `gorm:"type:text" json:"suggestionsJson"`
	CreatedAt        time.Time `json:"createdAt"`
}

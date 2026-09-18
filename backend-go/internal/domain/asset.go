package domain

import (
	"time"
)

// Asset represents unified digital media asset in DAM (images, videos, audio, documents)
type Asset struct {
	ID                string    `gorm:"primaryKey;size:64" json:"id"`
	TenantID          string    `gorm:"index;size:64;not null" json:"tenantId"`
	CreatorID         string    `gorm:"index;size:64" json:"creatorId,omitempty"`
	BrandID           string    `gorm:"index;size:64" json:"brandId,omitempty"`
	ContentProjectID  string    `gorm:"index;size:64" json:"contentProjectId,omitempty"`
	AssetType         string    `gorm:"size:32;not null" json:"assetType"` // image | video | audio | document
	SourceType        string    `gorm:"size:32;default:'upload'" json:"sourceType"` // upload | ai_generated | platform_synced
	Name              string    `gorm:"size:256;not null" json:"name"`
	StorageKey        string    `gorm:"size:512;not null" json:"storageKey"`
	URL               string    `gorm:"size:1024;not null" json:"url"`
	ThumbnailURL      string    `gorm:"size:1024" json:"thumbnailUrl,omitempty"`
	MimeType          string    `gorm:"size:128" json:"mimeType"`
	Width             int       `gorm:"default:0" json:"width"`
	Height            int       `gorm:"default:0" json:"height"`
	DurationSec       float64   `gorm:"default:0" json:"durationSec"`
	SizeBytes         int64     `gorm:"default:0" json:"sizeBytes"`
	HashMD5           string    `gorm:"size:64;index" json:"hashMd5,omitempty"`
	AIReusable        bool      `gorm:"default:true" json:"aiReusable"`
	CommercialLicense bool      `gorm:"default:true" json:"commercialLicense"`
	TagsJSON          string    `gorm:"type:text" json:"tagsJson,omitempty"`
	CreatedAt         time.Time `json:"createdAt"`
	UpdatedAt         time.Time `json:"updatedAt"`
}

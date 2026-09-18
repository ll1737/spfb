package domain

import (
	"time"
)

type Topic struct {
	ID          string    `gorm:"primaryKey;size:64" json:"id"`
	OrgID       string    `gorm:"index;size:64" json:"orgId,omitempty"`
	BrandID     string    `gorm:"index;size:64" json:"brandId,omitempty"`
	Title       string    `gorm:"size:256;not null" json:"title"`
	Category    string    `gorm:"size:64" json:"category"`
	HeatScore   int       `gorm:"default:85" json:"heatScore"`
	TagsJSON    string    `gorm:"type:text" json:"-"`
	Tags        []string  `gorm:"-" json:"tags"`
	AnglesJSON  string    `gorm:"type:text" json:"-"`
	Angles      []string  `gorm:"-" json:"angles"`
	Status      string    `gorm:"size:32;default:'recommended'" json:"status"` // recommended | adopted | archived
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type ContentPackage struct {
	ID          string    `gorm:"primaryKey;size:64" json:"id"`
	OrgID       string    `gorm:"index;size:64" json:"orgId,omitempty"`
	BrandID     string    `gorm:"index;size:64" json:"brandId,omitempty"`
	TopicID     string    `gorm:"size:64" json:"topicId"`
	Title       string    `gorm:"size:256;not null" json:"title"`
	MasterContent string  `gorm:"type:longtext;not null" json:"masterContent"`
	Status      string    `gorm:"size:32;default:'draft'" json:"status"` // draft | generated | scheduled | published
	AdaptationsJSON string `gorm:"type:longtext" json:"-"` // JSON map of platform adaptations
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

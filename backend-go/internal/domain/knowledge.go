package domain

import "time"

type KnowledgeDocument struct {
	ID         string    `gorm:"primaryKey;size:64" json:"id"`
	TenantID   string    `gorm:"index;size:64;not null" json:"tenantId"`
	BrandID    string    `gorm:"index;size:64" json:"brandId,omitempty"`
	CreatorID  string    `gorm:"index;size:64" json:"creatorId,omitempty"`
	Name       string    `gorm:"size:256;not null" json:"name"`
	SourceType string    `gorm:"size:32;not null" json:"sourceType"`
	SourceURL  string    `gorm:"size:1024" json:"sourceUrl,omitempty"`
	MimeType   string    `gorm:"size:128" json:"mimeType,omitempty"`
	Content    string    `gorm:"type:longtext;not null" json:"content"`
	Status     string    `gorm:"size:32;default:'ready'" json:"status"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}

type KnowledgeChunk struct {
	ID           string    `gorm:"primaryKey;size:64" json:"id"`
	TenantID     string    `gorm:"index;size:64;not null" json:"tenantId"`
	DocumentID   string    `gorm:"index;size:64;not null" json:"documentId"`
	Content      string    `gorm:"type:longtext;not null" json:"content"`
	ChunkIndex   int       `gorm:"not null" json:"chunkIndex"`
	MetadataJSON string    `gorm:"type:text" json:"metadataJson,omitempty"`
	CreatedAt    time.Time `json:"createdAt"`
}

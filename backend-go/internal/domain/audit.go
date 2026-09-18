package domain

import (
	"time"
)

// AuditLog records security, administrative, and content operations
type AuditLog struct {
	ID           string    `gorm:"primaryKey;size:64" json:"id"`
	TenantID     string    `gorm:"index;size:64;not null" json:"tenantId"`
	UserID       string    `gorm:"index;size:64;not null" json:"userId"`
	Action       string    `gorm:"size:64;not null" json:"action"` // creator.create | content.delete | memory.update | account.bind | credit.freeze
	ResourceType string    `gorm:"size:64;not null" json:"resourceType"`
	ResourceID   string    `gorm:"size:64" json:"resourceId"`
	IP           string    `gorm:"size:64" json:"ip"`
	UserAgent    string    `gorm:"size:512" json:"userAgent"`
	BeforeJSON   string    `gorm:"type:text" json:"beforeJson,omitempty"`
	AfterJSON    string    `gorm:"type:text" json:"afterJson,omitempty"`
	RequestID    string    `gorm:"size:64;index" json:"requestId,omitempty"`
	CreatedAt    time.Time `json:"createdAt"`
}

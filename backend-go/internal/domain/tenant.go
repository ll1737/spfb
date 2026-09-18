package domain

import (
	"time"
)

// Tenant represents top-level multi-tenant boundary for SaaS
type Tenant struct {
	ID             string    `gorm:"primaryKey;size:64" json:"id"`
	Name           string    `gorm:"size:128;not null" json:"name"`
	Plan           string    `gorm:"size:32;default:'free'" json:"plan"` // free | pro | enterprise
	Status         string    `gorm:"size:32;default:'active'" json:"status"` // active | suspended | trial
	OwnerUserID    string    `gorm:"size:64;index" json:"ownerUserId"`
	MaxCreators    int       `gorm:"default:5" json:"maxCreators"`
	MaxBrands      int       `gorm:"default:3" json:"maxBrands"`
	MaxMembers     int       `gorm:"default:10" json:"maxMembers"`
	StorageLimitGB float64   `gorm:"default:50.0" json:"storageLimitGB"`
	StorageUsedGB  float64   `gorm:"default:0.0" json:"storageUsedGB"`
	SettingsJSON   string    `gorm:"type:text" json:"-"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

// TenantMember links users to tenants with specific roles
type TenantMember struct {
	ID        string    `gorm:"primaryKey;size:64" json:"id"`
	TenantID  string    `gorm:"index;size:64;not null" json:"tenantId"`
	UserID    string    `gorm:"index;size:64;not null" json:"userId"`
	Role      string    `gorm:"size:32;default:'member'" json:"role"` // owner | admin | operator | reviewer | viewer
	Status    string    `gorm:"size:32;default:'active'" json:"status"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// UserContext carries multi-tenant and user metadata across requests
type UserContext struct {
	UserID   string
	TenantID string
	RoleID   string
}

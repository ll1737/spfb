package domain

import (
	"time"
)

type UserRole string

const (
	RoleOwner      UserRole = "owner"
	RoleAdmin      UserRole = "admin"
	RoleAssetAdmin UserRole = "asset_admin"
	RoleOperator   UserRole = "operator"
	RolePublisher  UserRole = "publisher"
	RoleReviewer   UserRole = "reviewer"
	RoleCreator    UserRole = "creator"
	RoleViewer     UserRole = "viewer"
)

// User represents a user record in MySQL
type User struct {
	ID             string    `gorm:"primaryKey;size:64" json:"id"`
	Username       string    `gorm:"uniqueIndex;size:64;not null" json:"username"`
	Email          string    `gorm:"uniqueIndex;size:128;not null" json:"email"`
	PasswordHash   string    `gorm:"size:256;not null" json:"-"`
	Salt           string    `gorm:"size:64;not null" json:"-"`
	Nickname       string    `gorm:"size:64;not null" json:"nickname"`
	AvatarURL      string    `gorm:"size:512" json:"avatarUrl"`
	Role           UserRole  `gorm:"size:32;default:'admin'" json:"role"`
	RoleLabel      string    `gorm:"size:64" json:"roleLabel,omitempty"`
	EnterpriseID   string    `gorm:"size:64;index" json:"enterpriseId,omitempty"`
	EnterpriseName string    `gorm:"size:128" json:"enterpriseName,omitempty"`
	CurrentBrandID string    `gorm:"size:64" json:"currentBrandId,omitempty"`
	CurrentBrandName string  `gorm:"size:128" json:"currentBrandName,omitempty"`
	TeamName       string    `gorm:"size:128" json:"teamName,omitempty"`
	Phone          string    `gorm:"size:32" json:"phone,omitempty"`
	Bio            string    `gorm:"type:text" json:"bio,omitempty"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
	LastLoginAt    *time.Time `json:"lastLoginAt,omitempty"`
}

type LoginRequest struct {
	Account    string `json:"account" binding:"required"`
	Password   string `json:"password" binding:"required"`
	RememberMe bool   `json:"rememberMe"`
}

type RegisterRequest struct {
	Username           string   `json:"username" binding:"required"`
	Email              string   `json:"email" binding:"required,email"`
	Password           string   `json:"password" binding:"required,min=6"`
	Nickname           string   `json:"nickname" binding:"required"`
	Role               UserRole `json:"role"`
	RegisterMode       string   `json:"registerMode"` // create_org | join_org
	EnterpriseName     string   `json:"enterpriseName"`
	EnterpriseIndustry string   `json:"enterpriseIndustry"`
	EnterpriseLocation string   `json:"enterpriseLocation"`
	BrandName          string   `json:"brandName"`
	InviteCode         string   `json:"inviteCode"`
	TeamName           string   `json:"teamName"`
	Phone              string   `json:"phone"`
}

type ChangePasswordRequest struct {
	OldPassword string `json:"oldPassword" binding:"required"`
	NewPassword string `json:"newPassword" binding:"required,min=6"`
}

type UpdateProfileRequest struct {
	Nickname string `json:"nickname"`
	AvatarURL string `json:"avatarUrl"`
	Phone    string `json:"phone"`
	Bio      string `json:"bio"`
	TeamName string `json:"teamName"`
}

type AuthResponse struct {
	Token      string          `json:"token"`
	User       *User           `json:"user"`
	Enterprise *EnterpriseInfo `json:"enterprise,omitempty"`
	Message    string          `json:"message,omitempty"`
}

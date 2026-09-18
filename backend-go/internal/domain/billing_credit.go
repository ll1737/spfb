package domain

import (
	"time"
)

type CreditDirection string

const (
	CreditDirectionIn       CreditDirection = "IN"
	CreditDirectionOut      CreditDirection = "OUT"
	CreditDirectionFreeze   CreditDirection = "FREEZE"
	CreditDirectionUnfreeze CreditDirection = "UNFREEZE"
	CreditDirectionRefund   CreditDirection = "REFUND"
)

// CreditWallet stores real-time balance and frozen credits for a tenant
type CreditWallet struct {
	TenantID  string    `gorm:"primaryKey;size:64" json:"tenantId"`
	Balance   int64     `gorm:"default:1000" json:"balance"` // available credits
	Frozen    int64     `gorm:"default:0" json:"frozen"`       // frozen credits during long-running tasks
	UpdatedAt time.Time `json:"updatedAt"`
}

// CreditLedger maintains an immutable double-entry journal of every credit transaction
type CreditLedger struct {
	ID             string          `gorm:"primaryKey;size:64" json:"id"`
	TenantID       string          `gorm:"index;size:64;not null" json:"tenantId"`
	Direction      CreditDirection `gorm:"size:32;not null" json:"direction"`
	Amount         int64           `gorm:"not null" json:"amount"`
	BalanceAfter   int64           `gorm:"not null" json:"balanceAfter"`
	BizType        string          `gorm:"size:64;not null" json:"bizType"` // content.generate | image.generate | video.generate | subscription.grant | manual.recharge
	BizID          string          `gorm:"size:64" json:"bizId,omitempty"`
	IdempotencyKey string          `gorm:"uniqueIndex;size:128" json:"idempotencyKey,omitempty"`
	Remark         string          `gorm:"size:256" json:"remark,omitempty"`
	CreatedAt      time.Time       `json:"createdAt"`
}

// Plan defines SaaS subscription tiers and limits
type Plan struct {
	ID          string    `gorm:"primaryKey;size:64" json:"id"`
	Code        string    `gorm:"uniqueIndex;size:64;not null" json:"code"` // free | pro | enterprise
	Name        string    `gorm:"size:128;not null" json:"name"`
	PriceMonthly int64    `gorm:"default:0" json:"priceMonthly"` // in cents (分)
	MaxCreators int       `gorm:"default:3" json:"maxCreators"`
	MaxBrands   int       `gorm:"default:1" json:"maxBrands"`
	MonthlyCredits int64  `gorm:"default:1000" json:"monthlyCredits"`
	FeaturesJSON string   `gorm:"type:text" json:"featuresJson"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// Subscription tracks tenant active subscription plan
type Subscription struct {
	ID         string    `gorm:"primaryKey;size:64" json:"id"`
	TenantID   string    `gorm:"uniqueIndex;size:64;not null" json:"tenantId"`
	PlanCode   string    `gorm:"size:64;not null" json:"planCode"`
	Status     string    `gorm:"size:32;default:'active'" json:"status"` // active | expired | cancelled
	StartDate  time.Time `json:"startDate"`
	EndDate    time.Time `json:"endDate"`
	AutoRenew  bool      `gorm:"default:true" json:"autoRenew"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}

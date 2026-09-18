package credit

import (
	"context"
	"errors"
	"fmt"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"zhiyu-backend/internal/domain"
	"zhiyu-backend/pkg/idgen"
)

type CreditService struct {
	db *gorm.DB
}

func NewCreditService(db *gorm.DB) *CreditService {
	return &CreditService{db: db}
}

// GetWallet gets or initializes a tenant's credit wallet
func (s *CreditService) GetWallet(ctx context.Context, tenantID string) (*domain.CreditWallet, error) {
	var wallet domain.CreditWallet
	err := s.db.WithContext(ctx).Where("tenant_id = ?", tenantID).First(&wallet).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		wallet = domain.CreditWallet{
			TenantID:  tenantID,
			Balance:   2000, // grant initial 2000 credits for free tier
			Frozen:    0,
			UpdatedAt: time.Now(),
		}
		if err := s.db.WithContext(ctx).Create(&wallet).Error; err != nil {
			return nil, err
		}
	} else if err != nil {
		return nil, err
	}
	return &wallet, nil
}

// CheckBalance verifies if a tenant has enough available credits
func (s *CreditService) CheckBalance(ctx context.Context, tenantID string, requiredCredits int64) error {
	wallet, err := s.GetWallet(ctx, tenantID)
	if err != nil {
		return err
	}
	if wallet.Balance < requiredCredits {
		return fmt.Errorf("AI 积分不足: 当前可用 %d, 所需 %d", wallet.Balance, requiredCredits)
	}
	return nil
}

// FreezeCredits temporarily holds credits for a long-running AI task
func (s *CreditService) FreezeCredits(ctx context.Context, tenantID string, amount int64, bizType, bizID, idempotencyKey string) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var wallet domain.CreditWallet
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("tenant_id = ?", tenantID).First(&wallet).Error; err != nil {
			return err
		}

		if wallet.Balance < amount {
			return fmt.Errorf("积分余额不足以预冻结")
		}

		wallet.Balance -= amount
		wallet.Frozen += amount
		wallet.UpdatedAt = time.Now()

		if err := tx.Save(&wallet).Error; err != nil {
			return err
		}

		ledger := domain.CreditLedger{
			ID:             idgen.GenerateID("cdl"),
			TenantID:       tenantID,
			Direction:      domain.CreditDirectionFreeze,
			Amount:         amount,
			BalanceAfter:   wallet.Balance,
			BizType:        bizType,
			BizID:          bizID,
			IdempotencyKey: idempotencyKey,
			Remark:         "任务预冻结积分",
			CreatedAt:      time.Now(),
		}
		return tx.Create(&ledger).Error
	})
}

// ConfirmConsume confirms the consumption of frozen or direct credits
func (s *CreditService) ConfirmConsume(ctx context.Context, tenantID string, amount int64, bizType, bizID, idempotencyKey string) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var wallet domain.CreditWallet
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("tenant_id = ?", tenantID).First(&wallet).Error; err != nil {
			return err
		}

		if wallet.Frozen >= amount {
			wallet.Frozen -= amount
		} else {
			// Direct deduction if not frozen
			if wallet.Balance < amount {
				return fmt.Errorf("积分不足")
			}
			wallet.Balance -= amount
		}
		wallet.UpdatedAt = time.Now()

		if err := tx.Save(&wallet).Error; err != nil {
			return err
		}

		ledger := domain.CreditLedger{
			ID:             idgen.GenerateID("cdl"),
			TenantID:       tenantID,
			Direction:      domain.CreditDirectionOut,
			Amount:         amount,
			BalanceAfter:   wallet.Balance,
			BizType:        bizType,
			BizID:          bizID,
			IdempotencyKey: idempotencyKey,
			Remark:         "任务执行完成正式结算",
			CreatedAt:      time.Now(),
		}
		return tx.Create(&ledger).Error
	})
}

// UnfreezeCredits returns frozen credits to available balance upon failure
func (s *CreditService) UnfreezeCredits(ctx context.Context, tenantID string, amount int64, bizType, bizID string) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var wallet domain.CreditWallet
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("tenant_id = ?", tenantID).First(&wallet).Error; err != nil {
			return err
		}

		if wallet.Frozen >= amount {
			wallet.Frozen -= amount
		} else {
			amount = wallet.Frozen
			wallet.Frozen = 0
		}
		wallet.Balance += amount
		wallet.UpdatedAt = time.Now()

		if err := tx.Save(&wallet).Error; err != nil {
			return err
		}

		ledger := domain.CreditLedger{
			ID:           idgen.GenerateID("cdl"),
			TenantID:     tenantID,
			Direction:    domain.CreditDirectionUnfreeze,
			Amount:       amount,
			BalanceAfter: wallet.Balance,
			BizType:      bizType,
			BizID:        bizID,
			Remark:       "任务失败释放预冻结积分",
			CreatedAt:    time.Now(),
		}
		return tx.Create(&ledger).Error
	})
}

// ListLedger returns recent credit transaction history
func (s *CreditService) ListLedger(ctx context.Context, tenantID string, limit int) ([]domain.CreditLedger, error) {
	var ledgers []domain.CreditLedger
	err := s.db.WithContext(ctx).Where("tenant_id = ?", tenantID).Order("created_at DESC").Limit(limit).Find(&ledgers).Error
	return ledgers, err
}

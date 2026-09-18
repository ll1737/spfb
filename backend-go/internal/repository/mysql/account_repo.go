package mysql

import (
	"errors"

	"gorm.io/gorm"
	"zhiyu-backend/internal/domain"
)

type AccountRepository struct {
	db *gorm.DB
}

func NewAccountRepository(db *gorm.DB) *AccountRepository {
	return &AccountRepository{db: db}
}

func (r *AccountRepository) List(orgID, brandID string) ([]domain.Account, error) {
	accounts := make([]domain.Account, 0)
	if orgID == "" {
		return accounts, nil
	}
	query := r.db.Where("org_id = ?", orgID).Order("created_at DESC")
	if brandID != "" {
		query = query.Where("brand_id = ? OR brand_id = '' OR brand_id IS NULL", brandID)
	}
	err := query.Find(&accounts).Error
	return accounts, err
}

func (r *AccountRepository) FindByID(id string) (*domain.Account, error) {
	var acc domain.Account
	err := r.db.Where("id = ?", id).First(&acc).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &acc, nil
}

func (r *AccountRepository) Save(acc *domain.Account) error {
	return r.db.Save(acc).Error
}

func (r *AccountRepository) Delete(id string) error {
	return r.db.Where("id = ?", id).Delete(&domain.Account{}).Error
}

func (r *AccountRepository) BatchDelete(ids []string) error {
	return r.db.Where("id IN ?", ids).Delete(&domain.Account{}).Error
}

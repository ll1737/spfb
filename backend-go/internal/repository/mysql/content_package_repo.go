package mysql

import (
	"gorm.io/gorm"
	"zhiyu-backend/internal/domain"
)

type ContentPackageRepository struct {
	db *gorm.DB
}

func NewContentPackageRepository(db *gorm.DB) *ContentPackageRepository {
	return &ContentPackageRepository{db: db}
}

func (r *ContentPackageRepository) List(orgID, brandID string) ([]domain.ContentPackage, error) {
	rows := make([]domain.ContentPackage, 0)
	query := r.db.Where("org_id = ?", orgID).Order("created_at DESC")
	if brandID != "" {
		query = query.Where("brand_id = ? OR brand_id = '' OR brand_id IS NULL", brandID)
	}
	if err := query.Find(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}

func (r *ContentPackageRepository) Save(row *domain.ContentPackage) error {
	return r.db.Save(row).Error
}

func (r *ContentPackageRepository) Delete(orgID, brandID, id string) error {
	query := r.db.Where("org_id = ? AND id = ?", orgID, id)
	if brandID != "" {
		query = query.Where("brand_id = ? OR brand_id = '' OR brand_id IS NULL", brandID)
	}
	return query.Delete(&domain.ContentPackage{}).Error
}

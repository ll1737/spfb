package asset

import (
	"context"
	"time"

	"gorm.io/gorm"
	"zhiyu-backend/internal/domain"
	"zhiyu-backend/pkg/idgen"
)

type AssetService struct {
	db *gorm.DB
}

func NewAssetService(db *gorm.DB) *AssetService {
	return &AssetService{db: db}
}

func (s *AssetService) CreateAsset(ctx context.Context, asset *domain.Asset) error {
	if asset.ID == "" {
		asset.ID = idgen.GenerateID("ast")
	}
	asset.CreatedAt = time.Now()
	asset.UpdatedAt = time.Now()
	return s.db.WithContext(ctx).Create(asset).Error
}

func (s *AssetService) ListAssets(ctx context.Context, tenantID, creatorID, assetType string, limit, offset int) ([]domain.Asset, int64, error) {
	var assets []domain.Asset
	var total int64

	query := s.db.WithContext(ctx).Model(&domain.Asset{})
	if tenantID != "" {
		query = query.Where("tenant_id = ?", tenantID)
	}
	if creatorID != "" {
		query = query.Where("creator_id = ?", creatorID)
	}
	if assetType != "" {
		query = query.Where("asset_type = ?", assetType)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&assets).Error; err != nil {
		return nil, 0, err
	}

	return assets, total, nil
}

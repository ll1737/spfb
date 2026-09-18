package mysql

import (
	"context"

	"gorm.io/gorm"
	"zhiyu-backend/internal/domain"
)

type KnowledgeRepository struct {
	db *gorm.DB
}

func NewKnowledgeRepository(db *gorm.DB) *KnowledgeRepository {
	return &KnowledgeRepository{db: db}
}

func (r *KnowledgeRepository) List(ctx context.Context, tenantID, brandID, creatorID string) ([]domain.KnowledgeDocument, error) {
	rows := make([]domain.KnowledgeDocument, 0)
	query := r.db.WithContext(ctx).Where("tenant_id = ?", tenantID).Order("created_at DESC")
	if brandID != "" {
		query = query.Where("brand_id = ? OR brand_id = '' OR brand_id IS NULL", brandID)
	}
	if creatorID != "" {
		query = query.Where("creator_id = ? OR creator_id = '' OR creator_id IS NULL", creatorID)
	}
	err := query.Find(&rows).Error
	return rows, err
}

func (r *KnowledgeRepository) Create(ctx context.Context, value *domain.KnowledgeDocument) error {
	return r.db.WithContext(ctx).Create(value).Error
}

func (r *KnowledgeRepository) Delete(ctx context.Context, tenantID, documentID string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("tenant_id = ? AND document_id = ?", tenantID, documentID).Delete(&domain.KnowledgeChunk{}).Error; err != nil {
			return err
		}
		return tx.Where("tenant_id = ? AND id = ?", tenantID, documentID).Delete(&domain.KnowledgeDocument{}).Error
	})
}

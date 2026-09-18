package mysql

import (
	"context"
	"encoding/json"
	"time"

	"gorm.io/gorm"
	creatorapp "zhiyu-backend/internal/creator"
	"zhiyu-backend/internal/domain"
)

type CreatorRepository struct {
	db *gorm.DB
}

func NewCreatorRepository(db *gorm.DB) *CreatorRepository {
	return &CreatorRepository{db: db}
}

func (r *CreatorRepository) List(ctx context.Context, tenantID, brandID string) ([]domain.Creator, error) {
	rows := make([]domain.Creator, 0)
	query := r.db.WithContext(ctx).Where("tenant_id = ?", tenantID).Order("created_at DESC")
	if brandID != "" {
		query = query.Where("brand_id = ?", brandID)
	}
	err := query.Preload("Persona").Preload("Plans.Platforms").Find(&rows).Error
	return rows, err
}

func (r *CreatorRepository) Get(ctx context.Context, tenantID, creatorID string) (*domain.Creator, error) {
	var value domain.Creator
	err := r.db.WithContext(ctx).
		Where("tenant_id = ? AND id = ?", tenantID, creatorID).
		Preload("Persona").
		Preload("Plans.Platforms").
		First(&value).Error
	if err != nil {
		return nil, err
	}
	return &value, nil
}

func (r *CreatorRepository) Create(ctx context.Context, value *domain.Creator) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Omit("Persona", "Plans").Create(value).Error; err != nil {
			return err
		}
		if value.Persona != nil {
			return tx.Create(value.Persona).Error
		}
		return nil
	})
}

func (r *CreatorRepository) Update(ctx context.Context, value *domain.Creator) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Omit("Persona", "Plans").Save(value).Error; err != nil {
			return err
		}
		if value.Persona != nil {
			return tx.Save(value.Persona).Error
		}
		return nil
	})
}

func (r *CreatorRepository) Delete(ctx context.Context, tenantID, creatorID string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("creator_id = ? AND tenant_id = ?", creatorID, tenantID).Delete(&domain.CreatorPersona{}).Error; err != nil {
			return err
		}
		if err := tx.Where("creator_id = ? AND tenant_id = ?", creatorID, tenantID).Delete(&domain.CreatorPlan{}).Error; err != nil {
			return err
		}
		return tx.Where("id = ? AND tenant_id = ?", creatorID, tenantID).Delete(&domain.Creator{}).Error
	})
}

func (r *CreatorRepository) LoadOpsCounts(ctx context.Context, tenantID string, creatorIDs []string) (map[string]creatorapp.OpsCounts, error) {
	result := make(map[string]creatorapp.OpsCounts, len(creatorIDs))
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	weekAgo := now.AddDate(0, 0, -7)
	for _, creatorID := range creatorIDs {
		base := r.db.WithContext(ctx).Model(&domain.ContentProject{}).Where("tenant_id = ? AND creator_id = ?", tenantID, creatorID)
		var todayTasks, preProduced, pendingReview, scheduled, published7d int64
		if err := base.Where("created_at >= ?", today).Count(&todayTasks).Error; err != nil {
			return nil, err
		}
		if err := base.Where("status IN ?", []domain.ProjectStatus{domain.ProjectStatusContentReady, domain.ProjectStatusReviewing, domain.ProjectStatusApproved}).Count(&preProduced).Error; err != nil {
			return nil, err
		}
		if err := base.Where("status = ?", domain.ProjectStatusReviewing).Count(&pendingReview).Error; err != nil {
			return nil, err
		}
		if err := base.Where("status = ?", domain.ProjectStatusScheduled).Count(&scheduled).Error; err != nil {
			return nil, err
		}
		if err := base.Where("status = ? AND updated_at >= ?", domain.ProjectStatusPublished, weekAgo).Count(&published7d).Error; err != nil {
			return nil, err
		}
		result[creatorID] = creatorapp.OpsCounts{
			TodayTasks:         int(todayTasks),
			PreProducedContent: int(preProduced),
			PendingReview:      int(pendingReview),
			Scheduled:          int(scheduled),
			Published7d:        int(published7d),
			AccountHealth:      "unbound",
		}
	}
	return result, nil
}

func (r *CreatorRepository) ListPlans(ctx context.Context, tenantID, creatorID string) ([]domain.CreatorPlan, error) {
	rows := make([]domain.CreatorPlan, 0)
	err := r.db.WithContext(ctx).
		Where("tenant_id = ? AND creator_id = ?", tenantID, creatorID).
		Order("created_at DESC").
		Preload("Platforms").
		Find(&rows).Error
	for i := range rows {
		for j := range rows[i].Platforms {
			if rows[i].Platforms[j].PublishTimesJSON != "" {
				_ = json.Unmarshal([]byte(rows[i].Platforms[j].PublishTimesJSON), &rows[i].Platforms[j].PublishTimes)
			}
		}
	}
	return rows, err
}

func (r *CreatorRepository) SavePlan(ctx context.Context, plan *domain.CreatorPlan) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Omit("Platforms").Save(plan).Error; err != nil {
			return err
		}
		if err := tx.Where("plan_id = ?", plan.ID).Delete(&domain.CreatorPlanPlatform{}).Error; err != nil {
			return err
		}
		if len(plan.Platforms) > 0 {
			return tx.Create(&plan.Platforms).Error
		}
		return nil
	})
}

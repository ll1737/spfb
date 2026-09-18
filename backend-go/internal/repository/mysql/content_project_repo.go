package mysql

import (
	"context"
	"fmt"
	"gorm.io/gorm"
	"zhiyu-backend/internal/domain"
)

type ContentProjectRepository struct {
	db *gorm.DB
}

func NewContentProjectRepository(db *gorm.DB) *ContentProjectRepository {
	return &ContentProjectRepository{db: db}
}

func (r *ContentProjectRepository) CreateProject(ctx context.Context, project *domain.ContentProject) error {
	return r.db.WithContext(ctx).Create(project).Error
}

func (r *ContentProjectRepository) GetProjectByID(ctx context.Context, tenantID, projectID string) (*domain.ContentProject, error) {
	var p domain.ContentProject
	query := r.db.WithContext(ctx).
		Preload("MasterContent").
		Preload("PlatformContents").
		Preload("Reviews").
		Where("id = ?", projectID)

	if tenantID != "" {
		query = query.Where("tenant_id = ?", tenantID)
	}

	if err := query.First(&p).Error; err != nil {
		return nil, fmt.Errorf("content project not found: %w", err)
	}
	return &p, nil
}

func (r *ContentProjectRepository) ListProjects(ctx context.Context, tenantID, creatorID string, limit, offset int) ([]domain.ContentProject, int64, error) {
	var projects []domain.ContentProject
	var total int64

	query := r.db.WithContext(ctx).Model(&domain.ContentProject{})
	if tenantID != "" {
		query = query.Where("tenant_id = ?", tenantID)
	}
	if creatorID != "" {
		query = query.Where("creator_id = ?", creatorID)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := query.Preload("MasterContent").Preload("PlatformContents").
		Order("created_at DESC").
		Limit(limit).Offset(offset).
		Find(&projects).Error; err != nil {
		return nil, 0, err
	}

	return projects, total, nil
}

func (r *ContentProjectRepository) UpdateStatus(ctx context.Context, projectID string, status domain.ProjectStatus, step string) error {
	updates := map[string]interface{}{
		"status": status,
	}
	if step != "" {
		updates["current_step"] = step
	}
	return r.db.WithContext(ctx).Model(&domain.ContentProject{}).Where("id = ?", projectID).Updates(updates).Error
}

func (r *ContentProjectRepository) SaveMasterContent(ctx context.Context, mc *domain.MasterContent) error {
	return r.db.WithContext(ctx).Save(mc).Error
}

func (r *ContentProjectRepository) SavePlatformContent(ctx context.Context, pc *domain.PlatformContent) error {
	return r.db.WithContext(ctx).Save(pc).Error
}

func (r *ContentProjectRepository) SaveReview(ctx context.Context, rev *domain.ContentReview) error {
	return r.db.WithContext(ctx).Create(rev).Error
}

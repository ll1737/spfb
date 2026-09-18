package audit

import (
	"context"
	"time"

	"gorm.io/gorm"
	"zhiyu-backend/internal/domain"
	"zhiyu-backend/pkg/idgen"
)

type AuditService struct {
	db *gorm.DB
}

func NewAuditService(db *gorm.DB) *AuditService {
	return &AuditService{db: db}
}

func (s *AuditService) Log(ctx context.Context, tenantID, userID, action, resourceType, resourceID, ip, userAgent, beforeJSON, afterJSON, requestID string) {
	if s.db == nil {
		return
	}
	log := domain.AuditLog{
		ID:           idgen.GenerateID("audit"),
		TenantID:     tenantID,
		UserID:       userID,
		Action:       action,
		ResourceType: resourceType,
		ResourceID:   resourceID,
		IP:           ip,
		UserAgent:    userAgent,
		BeforeJSON:   beforeJSON,
		AfterJSON:    afterJSON,
		RequestID:    requestID,
		CreatedAt:    time.Now(),
	}
	_ = s.db.WithContext(ctx).Create(&log)
}

func (s *AuditService) ListLogs(ctx context.Context, tenantID string, limit, offset int) ([]domain.AuditLog, int64, error) {
	var logs []domain.AuditLog
	var total int64

	query := s.db.WithContext(ctx).Model(&domain.AuditLog{})
	if tenantID != "" {
		query = query.Where("tenant_id = ?", tenantID)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&logs).Error; err != nil {
		return nil, 0, err
	}

	return logs, total, nil
}

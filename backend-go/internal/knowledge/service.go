package knowledge

import (
	"context"
	"errors"
	"strings"
	"time"

	"zhiyu-backend/internal/domain"
	"zhiyu-backend/pkg/idgen"
)

type Repository interface {
	List(ctx context.Context, tenantID, brandID, creatorID string) ([]domain.KnowledgeDocument, error)
	Create(ctx context.Context, value *domain.KnowledgeDocument) error
	Delete(ctx context.Context, tenantID, documentID string) error
}

type Service struct {
	repository Repository
	newID      func() string
}

type CreateInput struct {
	CreatorID  string `json:"creatorId"`
	Name       string `json:"name"`
	SourceType string `json:"sourceType"`
	SourceURL  string `json:"sourceUrl"`
	MimeType   string `json:"mimeType"`
	Content    string `json:"content"`
}

func NewService(repository Repository, newID func() string) *Service {
	if newID == nil {
		newID = idgen.GenerateUUID
	}
	return &Service{repository: repository, newID: newID}
}

func (s *Service) List(ctx context.Context, tenantID, brandID, creatorID string) ([]domain.KnowledgeDocument, error) {
	if tenantID == "" {
		return []domain.KnowledgeDocument{}, nil
	}
	return s.repository.List(ctx, tenantID, brandID, creatorID)
}

func (s *Service) Create(ctx context.Context, tenantID, brandID string, input CreateInput) (*domain.KnowledgeDocument, error) {
	if strings.TrimSpace(tenantID) == "" {
		return nil, errors.New("企业空间未初始化")
	}
	if strings.TrimSpace(input.Name) == "" {
		return nil, errors.New("知识文档名称不能为空")
	}
	if strings.TrimSpace(input.Content) == "" {
		return nil, errors.New("知识文档内容不能为空")
	}
	sourceType := input.SourceType
	if sourceType == "" {
		sourceType = "manual"
	}
	now := time.Now()
	value := &domain.KnowledgeDocument{
		ID:         "knowledge_" + s.newID(),
		TenantID:   tenantID,
		BrandID:    brandID,
		CreatorID:  input.CreatorID,
		Name:       strings.TrimSpace(input.Name),
		SourceType: sourceType,
		SourceURL:  input.SourceURL,
		MimeType:   input.MimeType,
		Content:    strings.TrimSpace(input.Content),
		Status:     "ready",
		CreatedAt:  now,
		UpdatedAt:  now,
	}
	if err := s.repository.Create(ctx, value); err != nil {
		return nil, err
	}
	return value, nil
}

func (s *Service) Delete(ctx context.Context, tenantID, documentID string) error {
	return s.repository.Delete(ctx, tenantID, documentID)
}

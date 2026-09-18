package knowledge

import (
	"context"
	"testing"

	"zhiyu-backend/internal/domain"
)

type memoryRepository struct {
	created *domain.KnowledgeDocument
}

func (r *memoryRepository) List(context.Context, string, string, string) ([]domain.KnowledgeDocument, error) {
	return nil, nil
}
func (r *memoryRepository) Create(_ context.Context, value *domain.KnowledgeDocument) error {
	r.created = value
	return nil
}
func (r *memoryRepository) Delete(context.Context, string, string) error { return nil }

func TestCreateDocumentScopesKnowledgeToTenant(t *testing.T) {
	repo := &memoryRepository{}
	service := NewService(repo, func() string { return "doc-id" })
	created, err := service.Create(context.Background(), "tenant-a", "brand-a", CreateInput{
		Name:       "品牌规范",
		SourceType: "manual",
		Content:    "所有内容必须引用真实资料。",
	})
	if err != nil {
		t.Fatalf("create knowledge document: %v", err)
	}
	if created.TenantID != "tenant-a" || created.BrandID != "brand-a" || created.Status != "ready" {
		t.Fatalf("unexpected document: %#v", created)
	}
}

func TestCreateDocumentRejectsEmptyContent(t *testing.T) {
	service := NewService(&memoryRepository{}, func() string { return "doc-id" })
	if _, err := service.Create(context.Background(), "tenant-a", "brand-a", CreateInput{Name: "空文档"}); err == nil {
		t.Fatal("expected empty content to be rejected")
	}
}

package creator

import (
	"context"
	"testing"

	"zhiyu-backend/internal/domain"
)

type memoryCreatorRepository struct {
	created *domain.Creator
	stored  *domain.Creator
	updated *domain.Creator
	plan    *domain.CreatorPlan
}

func (r *memoryCreatorRepository) List(context.Context, string, string) ([]domain.Creator, error) {
	return nil, nil
}

func (r *memoryCreatorRepository) Get(context.Context, string, string) (*domain.Creator, error) {
	return r.stored, nil
}

func (r *memoryCreatorRepository) Create(_ context.Context, value *domain.Creator) error {
	r.created = value
	return nil
}

func (r *memoryCreatorRepository) Update(_ context.Context, value *domain.Creator) error {
	r.updated = value
	return nil
}
func (r *memoryCreatorRepository) Delete(context.Context, string, string) error { return nil }
func (r *memoryCreatorRepository) LoadOpsCounts(context.Context, string, []string) (map[string]OpsCounts, error) {
	return map[string]OpsCounts{}, nil
}
func (r *memoryCreatorRepository) ListPlans(context.Context, string, string) ([]domain.CreatorPlan, error) {
	return nil, nil
}
func (r *memoryCreatorRepository) SavePlan(_ context.Context, plan *domain.CreatorPlan) error {
	r.plan = plan
	return nil
}

func TestCreateBuildsCreatorAggregateWithPersona(t *testing.T) {
	repo := &memoryCreatorRepository{}
	service := NewService(repo, func() string { return "generated-id" })

	created, err := service.Create(context.Background(), "tenant-a", "brand-a", "user-a", CreateInput{
		Name:           "张医生",
		Profession:     "口腔种植专家",
		ProductionMode: "manual",
		DailyTarget:    4,
		Persona: PersonaInput{
			ToneStyle:      "专业、克制",
			TargetAudience: "种植牙患者",
		},
	})
	if err != nil {
		t.Fatalf("create creator: %v", err)
	}
	if repo.created == nil {
		t.Fatal("repository did not receive creator")
	}
	if created.TenantID != "tenant-a" || created.BrandID != "brand-a" {
		t.Fatalf("unexpected scope: tenant=%q brand=%q", created.TenantID, created.BrandID)
	}
	if created.Persona == nil || created.Persona.CreatorID != created.ID {
		t.Fatalf("persona must belong to creator: %#v", created.Persona)
	}
	if created.Persona.TenantID != "tenant-a" {
		t.Fatalf("persona tenant mismatch: %q", created.Persona.TenantID)
	}
}

func TestCreateRejectsMissingCreatorName(t *testing.T) {
	service := NewService(&memoryCreatorRepository{}, func() string { return "generated-id" })
	if _, err := service.Create(context.Background(), "tenant-a", "brand-a", "user-a", CreateInput{}); err == nil {
		t.Fatal("expected missing creator name to be rejected")
	}
}

func TestUpdateChangesCreatorAndPersonaWithoutChangingTenant(t *testing.T) {
	repo := &memoryCreatorRepository{stored: &domain.Creator{
		ID:       "creator-1",
		TenantID: "tenant-a",
		BrandID:  "brand-a",
		Name:     "旧名称",
		Persona:  &domain.CreatorPersona{ID: "persona-1", CreatorID: "creator-1", TenantID: "tenant-a", Name: "旧名称"},
	}}
	service := NewService(repo, func() string { return "generated-id" })

	updated, err := service.Update(context.Background(), "tenant-a", "creator-1", UpdateInput{
		Name:       "新名称",
		Profession: "新定位",
		Persona:    PersonaInput{ToneStyle: "专业"},
	})
	if err != nil {
		t.Fatalf("update creator: %v", err)
	}
	if repo.updated == nil || updated.Name != "新名称" || updated.Persona.ToneStyle != "专业" {
		t.Fatalf("creator aggregate was not updated: %#v", updated)
	}
	if updated.TenantID != "tenant-a" || updated.Persona.TenantID != "tenant-a" {
		t.Fatalf("tenant scope changed during update: %#v", updated)
	}
}

func TestBuildAIContextUsesStoredCreatorPersona(t *testing.T) {
	repo := &memoryCreatorRepository{stored: &domain.Creator{
		ID:         "creator-1",
		TenantID:   "tenant-a",
		Name:       "张医生",
		Profession: "口腔种植专家",
		Persona: &domain.CreatorPersona{
			ToneStyle:      "专业、克制",
			SystemPrompt:   "只引用已验证资料",
			TargetAudience: "种植牙患者",
		},
	}}
	service := NewService(repo, func() string { return "generated-id" })

	ctx, err := service.BuildAIContext(context.Background(), "tenant-a", "creator-1")
	if err != nil {
		t.Fatalf("build AI context: %v", err)
	}
	if ctx.CreatorName != "张医生" || ctx.Profession != "口腔种植专家" || ctx.ToneStyle != "专业、克制" {
		t.Fatalf("unexpected AI context: %#v", ctx)
	}
}

func TestSavePlanScopesPlanToCreatorAndTenant(t *testing.T) {
	repo := &memoryCreatorRepository{stored: &domain.Creator{ID: "creator-1", TenantID: "tenant-a"}}
	service := NewService(repo, func() string { return "generated-id" })

	plan, err := service.SavePlan(context.Background(), "tenant-a", "creator-1", PlanInput{
		PlanType:       "weekly",
		DailyTarget:    4,
		ProductionMode: "auto",
		Platforms: []PlanPlatformInput{
			{Platform: "xiaohongshu", AccountID: "account-1", DailyCount: 2, PublishTimes: []string{"10:00", "18:00"}},
		},
	})
	if err != nil {
		t.Fatalf("save plan: %v", err)
	}
	if repo.plan == nil || plan.TenantID != "tenant-a" || plan.CreatorID != "creator-1" {
		t.Fatalf("plan scope mismatch: %#v", plan)
	}
	if len(plan.Platforms) != 1 || plan.Platforms[0].PlanID != plan.ID {
		t.Fatalf("platform plan relation mismatch: %#v", plan.Platforms)
	}
}

func TestSavePlanRejectsInvalidDailyTarget(t *testing.T) {
	repo := &memoryCreatorRepository{stored: &domain.Creator{ID: "creator-1", TenantID: "tenant-a"}}
	service := NewService(repo, func() string { return "generated-id" })
	if _, err := service.SavePlan(context.Background(), "tenant-a", "creator-1", PlanInput{DailyTarget: 0}); err == nil {
		t.Fatal("expected invalid daily target to be rejected")
	}
}

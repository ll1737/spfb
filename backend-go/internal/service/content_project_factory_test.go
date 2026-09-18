package service

import "testing"

func TestNewContentProjectBuildsTenantScopedDraft(t *testing.T) {
	project, err := NewContentProject("tenant-a", "brand-a", "creator-a", "user-a", CreateContentProjectInput{
		Title:       "种植牙术后护理",
		ContentType: "article",
		TopicID:     "topic-a",
	})
	if err != nil {
		t.Fatalf("new content project: %v", err)
	}
	if project.TenantID != "tenant-a" || project.BrandID != "brand-a" || project.CreatorID != "creator-a" {
		t.Fatalf("project scope mismatch: %#v", project)
	}
	if project.Status != "DRAFT" || project.CurrentStep != "init" {
		t.Fatalf("unexpected initial lifecycle: %#v", project)
	}
}

func TestNewContentProjectRejectsMissingCreatorOrTitle(t *testing.T) {
	if _, err := NewContentProject("tenant-a", "brand-a", "", "user-a", CreateContentProjectInput{Title: "标题"}); err == nil {
		t.Fatal("expected missing creator to be rejected")
	}
	if _, err := NewContentProject("tenant-a", "brand-a", "creator-a", "user-a", CreateContentProjectInput{}); err == nil {
		t.Fatal("expected missing title to be rejected")
	}
}

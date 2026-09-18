package creator

import (
	"testing"

	"zhiyu-backend/internal/domain"
)

func TestBuildOpsSummaryUsesCreatorPlanAndRealCounts(t *testing.T) {
	value := domain.Creator{
		ID:          "creator-1",
		Name:        "张医生",
		DailyTarget: 2,
		Plans: []domain.CreatorPlan{
			{Status: "active", DailyTarget: 4},
		},
	}
	counts := OpsCounts{
		TodayTasks:         3,
		PreProducedContent: 5,
		PendingReview:      2,
		Scheduled:          1,
		Published7d:        7,
	}

	summary := BuildOpsSummary(value, counts)
	if summary.TomorrowTarget != 4 {
		t.Fatalf("expected active plan target, got %d", summary.TomorrowTarget)
	}
	if summary.TodayTasks != 3 || summary.PreProducedContent != 5 || summary.Published7d != 7 {
		t.Fatalf("unexpected real counts: %#v", summary)
	}
}

func TestBuildOpsSummaryFallsBackToCreatorDailyTarget(t *testing.T) {
	summary := BuildOpsSummary(domain.Creator{DailyTarget: 2}, OpsCounts{})
	if summary.TomorrowTarget != 2 {
		t.Fatalf("expected creator daily target, got %d", summary.TomorrowTarget)
	}
}

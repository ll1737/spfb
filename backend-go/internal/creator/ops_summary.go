package creator

import "zhiyu-backend/internal/domain"

type OpsCounts struct {
	TodayTasks         int
	PreGeneratedTopics int
	PreProducedContent int
	PendingReview      int
	Scheduled          int
	Published7d        int
	PerformanceDelta   float64
	AccountHealth      string
}

type OpsSummary struct {
	Creator            domain.Creator `json:"creator"`
	TodayTasks         int            `json:"todayTasks"`
	TomorrowTarget     int            `json:"tomorrowTarget"`
	PreGeneratedTopics int            `json:"preGeneratedTopics"`
	PreProducedContent int            `json:"preProducedContent"`
	PendingReview      int            `json:"pendingReview"`
	Scheduled          int            `json:"scheduled"`
	Published7d        int            `json:"published7d"`
	PerformanceDelta   float64        `json:"performanceDelta"`
	AccountHealth      string         `json:"accountHealth"`
}

func BuildOpsSummary(value domain.Creator, counts OpsCounts) OpsSummary {
	tomorrowTarget := value.DailyTarget
	for _, plan := range value.Plans {
		if plan.Status == "active" && plan.DailyTarget > 0 {
			tomorrowTarget = plan.DailyTarget
			break
		}
	}
	accountHealth := counts.AccountHealth
	if accountHealth == "" {
		accountHealth = "unbound"
	}
	return OpsSummary{
		Creator:            value,
		TodayTasks:         counts.TodayTasks,
		TomorrowTarget:     tomorrowTarget,
		PreGeneratedTopics: counts.PreGeneratedTopics,
		PreProducedContent: counts.PreProducedContent,
		PendingReview:      counts.PendingReview,
		Scheduled:          counts.Scheduled,
		Published7d:        counts.Published7d,
		PerformanceDelta:   counts.PerformanceDelta,
		AccountHealth:      accountHealth,
	}
}

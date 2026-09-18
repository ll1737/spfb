package calendar

import (
	"context"
	"fmt"
	"time"

	"gorm.io/gorm"
	"zhiyu-backend/internal/domain"
	"zhiyu-backend/pkg/idgen"
)

type CalendarEvent struct {
	ID               string               `json:"id"`
	ContentProjectID string               `json:"contentProjectId,omitempty"`
	PublishTaskID    string               `json:"publishTaskId,omitempty"`
	Title            string               `json:"title"`
	Platform         string               `json:"platform"`
	AccountNickname  string               `json:"accountNickname,omitempty"`
	ScheduledAt      time.Time            `json:"scheduledAt"`
	Status           string               `json:"status"` // scheduled | publishing | success | failed
	ContentType      string               `json:"contentType"`
	MasterSummary    string               `json:"masterSummary,omitempty"`
	CoverURL         string               `json:"coverUrl,omitempty"`
}

type CalendarService struct {
	db *gorm.DB
}

func NewCalendarService(db *gorm.DB) *CalendarService {
	return &CalendarService{db: db}
}

// GetCalendarEvents retrieves scheduled items between startDate and endDate
func (s *CalendarService) GetCalendarEvents(ctx context.Context, tenantID, creatorID, platform string, startDate, endDate time.Time) ([]CalendarEvent, error) {
	var tasks []domain.PublishTask
	query := s.db.WithContext(ctx).Model(&domain.PublishTask{}).
		Where("scheduled_at >= ? AND scheduled_at <= ?", startDate, endDate)

	if platform != "" {
		query = query.Where("platform = ?", platform)
	}

	if err := query.Order("scheduled_at ASC").Find(&tasks).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch calendar tasks: %w", err)
	}

	var events []CalendarEvent
	for _, t := range tasks {
		var schedTime time.Time
		if t.ScheduledAt != nil {
			schedTime = *t.ScheduledAt
		} else {
			schedTime = t.CreatedAt
		}

		events = append(events, CalendarEvent{
			ID:              t.ID,
			PublishTaskID:   t.ID,
			Title:           "矩阵分发 - " + string(t.Platform),
			Platform:        string(t.Platform),
			AccountNickname: t.AccountNickname,
			ScheduledAt:     schedTime,
			Status:          string(t.Status),
			ContentType:     string(t.ContentType),
			CoverURL:        t.ResultURL,
		})
	}

	return events, nil
}

// ScheduleTask creates a new scheduled task
func (s *CalendarService) ScheduleTask(ctx context.Context, projectID, platform, accountID string, scheduledAt time.Time) (*domain.PublishTask, error) {
	task := &domain.PublishTask{
		ID:          idgen.GenerateID("task_sched"),
		JobID:       idgen.GenerateID("job_sched"),
		Platform:    domain.PlatformID(platform),
		AccountID:   accountID,
		ContentType: domain.ContentTypeArticle,
		Status:      domain.TaskStatusQueued,
		Attempt:     0,
		MaxAttempts: 3,
		ScheduledAt: &scheduledAt,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := s.db.WithContext(ctx).Create(task).Error; err != nil {
		return nil, fmt.Errorf("failed to schedule task: %w", err)
	}

	return task, nil
}

// RescheduleTask modifies the scheduled time of an existing task (e.g. drag and drop)
func (s *CalendarService) RescheduleTask(ctx context.Context, taskID string, newTime time.Time) error {
	return s.db.WithContext(ctx).Model(&domain.PublishTask{}).
		Where("id = ?", taskID).
		Updates(map[string]interface{}{
			"scheduled_at": newTime,
			"updated_at":   time.Now(),
		}).Error
}

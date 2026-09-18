package mysql

import (
	"encoding/json"
	"errors"

	"gorm.io/gorm"
	"zhiyu-backend/internal/domain"
)

type PublishRepository struct {
	db *gorm.DB
}

func NewPublishRepository(db *gorm.DB) *PublishRepository {
	return &PublishRepository{db: db}
}

func (r *PublishRepository) ListJobs(orgID, brandID string) ([]domain.PublishJob, error) {
	jobs := make([]domain.PublishJob, 0)
	if orgID == "" {
		return jobs, nil
	}
	query := r.db.Where("org_id = ?", orgID).Order("created_at DESC")
	if brandID != "" {
		query = query.Where("brand_id = ? OR brand_id = '' OR brand_id IS NULL", brandID)
	}
	err := query.Find(&jobs).Error
	if err != nil {
		return jobs, err
	}

	for i := range jobs {
		if jobs[i].PayloadJSON != "" {
			_ = json.Unmarshal([]byte(jobs[i].PayloadJSON), &jobs[i].Payload)
		}
		if jobs[i].TaskIDsJSON != "" {
			_ = json.Unmarshal([]byte(jobs[i].TaskIDsJSON), &jobs[i].TaskIDs)
		}
		// Populate Tasks
		if len(jobs[i].TaskIDs) > 0 {
			var tasks []domain.PublishTask
			_ = r.db.Where("id IN ?", jobs[i].TaskIDs).Find(&tasks).Error
			jobs[i].Tasks = make([]domain.PublishTaskDTO, len(tasks))
			for j, t := range tasks {
				var logs []domain.TaskLogEntry
				if t.LogsJSON != "" {
					_ = json.Unmarshal([]byte(t.LogsJSON), &logs)
				}
				jobs[i].Tasks[j] = domain.PublishTaskDTO{
					ID:                t.ID,
					JobID:             t.JobID,
					Platform:          t.Platform,
					AccountID:         t.AccountID,
					AccountNickname:   t.AccountNickname,
					ContentType:       t.ContentType,
					Status:            t.Status,
					Attempt:           t.Attempt,
					MaxAttempts:       t.MaxAttempts,
					ErrorCode:         t.ErrorCode,
					ErrorMessage:      t.ErrorMessage,
					ResultURL:         t.ResultURL,
					DebugScreenshot:   t.DebugScreenshot,
					DebugHtmlSnapshot: t.DebugHtmlSnapshot,
					Logs:              logs,
				}
			}
		}
	}
	return jobs, nil
}

func (r *PublishRepository) FindJobByID(id string) (*domain.PublishJob, error) {
	var job domain.PublishJob
	err := r.db.Where("id = ?", id).First(&job).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	if job.PayloadJSON != "" {
		_ = json.Unmarshal([]byte(job.PayloadJSON), &job.Payload)
	}
	if job.TaskIDsJSON != "" {
		_ = json.Unmarshal([]byte(job.TaskIDsJSON), &job.TaskIDs)
	}
	return &job, nil
}

func (r *PublishRepository) SaveJob(job *domain.PublishJob) error {
	if job.Payload != nil {
		bytes, _ := json.Marshal(job.Payload)
		job.PayloadJSON = string(bytes)
	}
	if len(job.TaskIDs) > 0 {
		bytes, _ := json.Marshal(job.TaskIDs)
		job.TaskIDsJSON = string(bytes)
	}
	return r.db.Save(job).Error
}

func (r *PublishRepository) ListTasks(orgID, brandID string) ([]domain.PublishTask, error) {
	tasks := make([]domain.PublishTask, 0)
	if orgID == "" {
		return tasks, nil
	}
	err := r.db.Table("publish_tasks").
		Joins("JOIN publish_jobs ON publish_tasks.job_id = publish_jobs.id").
		Where("publish_jobs.org_id = ?", orgID).
		Order("publish_tasks.created_at DESC").
		Find(&tasks).Error
	return tasks, err
}

func (r *PublishRepository) FindTaskByID(id string) (*domain.PublishTask, error) {
	var task domain.PublishTask
	err := r.db.Where("id = ?", id).First(&task).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &task, nil
}

func (r *PublishRepository) SaveTask(task *domain.PublishTask) error {
	return r.db.Save(task).Error
}

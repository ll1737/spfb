package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"zhiyu-backend/internal/config"
	"zhiyu-backend/internal/domain"
	"zhiyu-backend/internal/repository/mysql"
)

type PublishService struct {
	pubRepo      *mysql.PublishRepository
	accRepo      *mysql.AccountRepository
	workerClient *WorkerClient
	cfg          *config.Config
}

func NewPublishService(pubRepo *mysql.PublishRepository, accRepo *mysql.AccountRepository, workerClient *WorkerClient, cfg *config.Config) *PublishService {
	return &PublishService{
		pubRepo:      pubRepo,
		accRepo:      accRepo,
		workerClient: workerClient,
		cfg:          cfg,
	}
}

func (s *PublishService) ListJobs(orgID, brandID string) ([]domain.PublishJob, error) {
	return s.pubRepo.ListJobs(orgID, brandID)
}

func (s *PublishService) GetJobByID(id string) (*domain.PublishJob, error) {
	return s.pubRepo.FindJobByID(id)
}

type CreatePublishJobRequest struct {
	Title          string                 `json:"title"`
	ContentType    domain.ContentType     `json:"contentType"`
	Content        string                 `json:"content"`
	Summary        string                 `json:"summary,omitempty"`
	CoverURL       string                 `json:"coverUrl,omitempty"`
	CoverTimestamp float64                `json:"coverTimestamp,omitempty"`
	Images         []string               `json:"images,omitempty"`
	VideoURL       string                 `json:"videoUrl,omitempty"`
	Tags           []string               `json:"tags,omitempty"`
	TargetAccounts []string               `json:"targetAccounts"`
	ScheduledAt    string                 `json:"scheduledAt,omitempty"`
	PlatformOptions map[string]interface{} `json:"platformOptions,omitempty"`
}

func (s *PublishService) CreateJob(orgID, brandID string, req CreatePublishJobRequest) (*domain.PublishJob, error) {
	if len(req.TargetAccounts) == 0 {
		return nil, errors.New("请选择至少一个发布目标账号")
	}

	jobID := fmt.Sprintf("job_%d", time.Now().UnixNano()/1000000)
	var taskIDs []string
	var tasks []domain.PublishTaskDTO

	now := time.Now()

	for _, accID := range req.TargetAccounts {
		acc, _ := s.accRepo.FindByID(accID)
		platform := domain.PlatformDouyin
		nickname := "矩阵账号"
		if acc != nil {
			platform = acc.Platform
			nickname = acc.Nickname
		}

		taskID := fmt.Sprintf("task_%d_%s", time.Now().UnixNano()/1000000, platform)
		taskIDs = append(taskIDs, taskID)

		task := domain.PublishTask{
			ID:              taskID,
			JobID:           jobID,
			Platform:        platform,
			AccountID:       accID,
			AccountNickname: nickname,
			ContentType:     req.ContentType,
			Status:          domain.TaskStatusRunning,
			Attempt:         1,
			MaxAttempts:     3,
			LogsJSON:        `[{"timestamp":"` + now.Format(time.RFC3339) + `","level":"info","message":"任务已创建，准备分发至 RPA 引擎","step":"init"}]`,
			CreatedAt:       now,
			UpdatedAt:       now,
		}

		_ = s.pubRepo.SaveTask(&task)

		tasks = append(tasks, domain.PublishTaskDTO{
			ID:              task.ID,
			JobID:           task.JobID,
			Platform:        task.Platform,
			AccountID:       task.AccountID,
			AccountNickname: task.AccountNickname,
			ContentType:     task.ContentType,
			Status:          task.Status,
			Attempt:         task.Attempt,
			MaxAttempts:     task.MaxAttempts,
			Logs: []domain.TaskLogEntry{
				{
					Timestamp: now.Format(time.RFC3339),
					Level:     "info",
					Message:   "任务已创建，准备分发至 RPA 引擎",
					Step:      "init",
				},
			},
			CreatedAt: now.Format(time.RFC3339),
		})

		// Asynchronously dispatch to Python Worker
		go s.dispatchTaskAsync(task, req)
	}

	payloadMap := map[string]interface{}{
		"title":          req.Title,
		"content":        req.Content,
		"summary":        req.Summary,
		"contentType":    req.ContentType,
		"coverUrl":       req.CoverURL,
		"coverTimestamp": req.CoverTimestamp,
		"images":         req.Images,
		"videoUrl":       req.VideoURL,
		"tags":           req.Tags,
	}

	job := domain.PublishJob{
		ID:          jobID,
		OrgID:       orgID,
		BrandID:     brandID,
		Title:       req.Title,
		ContentType: req.ContentType,
		Status:      domain.JobStatusRunning,
		Payload:     payloadMap,
		TaskIDs:     taskIDs,
		Tasks:       tasks,
		Stats: domain.JobStats{
			Total:   len(taskIDs),
			Running: len(taskIDs),
		},
		CreatedAt: now,
		UpdatedAt: now,
	}

	if err := s.pubRepo.SaveJob(&job); err != nil {
		return nil, err
	}

	return &job, nil
}

func (s *PublishService) dispatchTaskAsync(task domain.PublishTask, req CreatePublishJobRequest) {
	time.Sleep(1 * time.Second) // simulate graceful queue
	resp, err := s.workerClient.Publish(context.Background(), task.ID, string(task.Platform), task.AccountID, req)
	
	now := time.Now()
	task.UpdatedAt = now
	task.FinishedAt = &now

	if err != nil || (resp != nil && resp.Status != "success") {
		task.Status = domain.TaskStatusFailed
		if err != nil {
			task.ErrorMessage = err.Error()
		} else if resp != nil {
			task.ErrorMessage = resp.Message
		}
		task.LogsJSON = `[{"timestamp":"` + now.Format(time.RFC3339) + `","level":"error","message":"` + task.ErrorMessage + `","step":"failed"}]`
	} else {
		task.Status = domain.TaskStatusSuccess
		task.ResultURL = resp.ResultURL
		task.LogsJSON = `[{"timestamp":"` + now.Format(time.RFC3339) + `","level":"success","message":"RPA发布成功","step":"done"}]`
	}

	_ = s.pubRepo.SaveTask(&task)
}

func (s *PublishService) ListTasks(orgID, brandID string) ([]domain.PublishTaskDTO, error) {
	tasks, err := s.pubRepo.ListTasks(orgID, brandID)
	if err != nil {
		return nil, err
	}
	dtos := make([]domain.PublishTaskDTO, 0, len(tasks))
	for _, t := range tasks {
		var logs []domain.TaskLogEntry
		if t.LogsJSON != "" {
			_ = json.Unmarshal([]byte(t.LogsJSON), &logs)
		}
		dtos = append(dtos, domain.PublishTaskDTO{
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
			CreatedAt:         t.CreatedAt.Format(time.RFC3339),
		})
	}
	return dtos, nil
}

func (s *PublishService) RetryTask(id string) (*domain.PublishTask, error) {
	task, err := s.pubRepo.FindTaskByID(id)
	if err != nil || task == nil {
		return nil, errors.New("任务不存在")
	}
	task.Status = domain.TaskStatusRunning
	task.Attempt++
	task.UpdatedAt = time.Now()
	_ = s.pubRepo.SaveTask(task)
	return task, nil
}

func (s *PublishService) CancelTask(id string) (*domain.PublishTask, error) {
	task, err := s.pubRepo.FindTaskByID(id)
	if err != nil || task == nil {
		return nil, errors.New("任务不存在")
	}
	task.Status = domain.TaskStatusCancelled
	task.UpdatedAt = time.Now()
	_ = s.pubRepo.SaveTask(task)
	return task, nil
}

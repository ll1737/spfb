package queue

import (
	"context"
	"fmt"
	"sync"
	"time"

	"zhiyu-backend/pkg/idgen"
)

type JobStatus string

const (
	JobStatusQueued    JobStatus = "queued"
	JobStatusRunning   JobStatus = "running"
	JobStatusSuccess   JobStatus = "success"
	JobStatusFailed    JobStatus = "failed"
	JobStatusCancelled JobStatus = "cancelled"
)

// AsyncJob represents an asynchronous AI or publishing background job
type AsyncJob struct {
	ID               string                 `json:"id"`
	TenantID         string                 `json:"tenantId"`
	CreatorID        string                 `json:"creatorId,omitempty"`
	ContentProjectID string                 `json:"contentProjectId,omitempty"`
	Type             string                 `json:"type"` // topic.generate | content.generate_master | publish.execute
	Status           JobStatus              `json:"status"`
	Progress         int                    `json:"progress"` // 0 - 100
	CurrentStep      string                 `json:"currentStep"`
	Result           map[string]interface{} `json:"result,omitempty"`
	ErrorMessage     string                 `json:"errorMessage,omitempty"`
	StartedAt        time.Time              `json:"startedAt"`
	FinishedAt       *time.Time             `json:"finishedAt,omitempty"`
	CreatedAt        time.Time              `json:"createdAt"`
}

// JobHandlerFunc is the execution handler for a specific job type
type JobHandlerFunc func(ctx context.Context, job *AsyncJob, updateProgress func(progress int, step string)) (map[string]interface{}, error)

// JobQueue manages and executes background async jobs with progress reporting
type JobQueue struct {
	mu       sync.RWMutex
	jobs     map[string]*AsyncJob
	handlers map[string]JobHandlerFunc
}

var GlobalJobQueue *JobQueue

func NewJobQueue() *JobQueue {
	jq := &JobQueue{
		jobs:     make(map[string]*AsyncJob),
		handlers: make(map[string]JobHandlerFunc),
	}
	GlobalJobQueue = jq
	return jq
}

func (q *JobQueue) RegisterHandler(jobType string, fn JobHandlerFunc) {
	q.mu.Lock()
	defer q.mu.Unlock()
	q.handlers[jobType] = fn
}

// Enqueue creates and immediately runs an asynchronous job
func (q *JobQueue) Enqueue(tenantID, creatorID, projectID, jobType string, initialPayload map[string]interface{}) *AsyncJob {
	q.mu.Lock()
	jobID := idgen.GenerateID("job")
	job := &AsyncJob{
		ID:               jobID,
		TenantID:         tenantID,
		CreatorID:        creatorID,
		ContentProjectID: projectID,
		Type:             jobType,
		Status:           JobStatusQueued,
		Progress:         0,
		CurrentStep:      "任务已入队，等待执行",
		StartedAt:        time.Now(),
		CreatedAt:        time.Now(),
	}
	q.jobs[jobID] = job
	handlerFn, exists := q.handlers[jobType]
	q.mu.Unlock()

	if !exists {
		job.Status = JobStatusFailed
		job.ErrorMessage = fmt.Sprintf("no handler registered for job type: %s", jobType)
		now := time.Now()
		job.FinishedAt = &now
		return job
	}

	go func() {
		job.Status = JobStatusRunning
		job.Progress = 10
		job.CurrentStep = "开始执行任务"

		updateProgress := func(pct int, step string) {
			q.mu.Lock()
			job.Progress = pct
			job.CurrentStep = step
			q.mu.Unlock()
		}

		result, err := handlerFn(context.Background(), job, updateProgress)
		now := time.Now()
		q.mu.Lock()
		job.FinishedAt = &now
		if err != nil {
			job.Status = JobStatusFailed
			job.ErrorMessage = err.Error()
			job.CurrentStep = "任务执行失败: " + err.Error()
		} else {
			job.Status = JobStatusSuccess
			job.Progress = 100
			job.CurrentStep = "任务执行完成"
			job.Result = result
		}
		q.mu.Unlock()
	}()

	return job
}

func (q *JobQueue) GetJob(id string) (*AsyncJob, bool) {
	q.mu.RLock()
	defer q.mu.RUnlock()
	job, ok := q.jobs[id]
	return job, ok
}

func (q *JobQueue) ListJobs(tenantID, creatorID string, limit int) []*AsyncJob {
	q.mu.RLock()
	defer q.mu.RUnlock()

	var result []*AsyncJob
	for _, j := range q.jobs {
		if tenantID != "" && j.TenantID != tenantID {
			continue
		}
		if creatorID != "" && j.CreatorID != creatorID {
			continue
		}
		result = append(result, j)
		if limit > 0 && len(result) >= limit {
			break
		}
	}
	return result
}

package domain

import (
	"time"
)

type ContentType string

const (
	ContentTypeArticle ContentType = "article"
	ContentTypeNote    ContentType = "note"
	ContentTypeVideo   ContentType = "video"
)

type TaskStatus string

const (
	TaskStatusQueued    TaskStatus = "queued"
	TaskStatusRunning   TaskStatus = "running"
	TaskStatusSuccess   TaskStatus = "success"
	TaskStatusFailed    TaskStatus = "failed"
	TaskStatusCancelled TaskStatus = "cancelled"
)

type JobStatus string

const (
	JobStatusQueued    JobStatus = "queued"
	JobStatusRunning   JobStatus = "running"
	JobStatusSuccess   JobStatus = "success"
	JobStatusPartial   JobStatus = "partial"
	JobStatusFailed    JobStatus = "failed"
	JobStatusCancelled JobStatus = "cancelled"
)

type PublishJob struct {
	ID          string      `gorm:"primaryKey;size:64" json:"id"`
	OrgID       string      `gorm:"index;size:64" json:"orgId,omitempty"`
	BrandID     string      `gorm:"index;size:64" json:"brandId,omitempty"`
	Title       string      `gorm:"size:256;not null" json:"title"`
	ContentType ContentType `gorm:"size:32;not null" json:"contentType"`
	Status      JobStatus   `gorm:"size:32;default:'queued'" json:"status"`
	ScheduledAt *time.Time  `json:"scheduledAt,omitempty"`
	PayloadJSON string      `gorm:"type:longtext;not null" json:"-"`
	TaskIDsJSON string      `gorm:"type:text" json:"-"`
	CreatedAt   time.Time   `json:"createdAt"`
	UpdatedAt   time.Time   `json:"updatedAt"`

	// Non-persisted computed fields for response
	Payload map[string]interface{} `gorm:"-" json:"payload"`
	TaskIDs []string               `gorm:"-" json:"taskIds"`
	Tasks   []PublishTaskDTO       `gorm:"-" json:"tasks,omitempty"`
	Stats   JobStats               `gorm:"-" json:"stats"`
}

type JobStats struct {
	Total   int `json:"total"`
	Success int `json:"success"`
	Failed  int `json:"failed"`
	Running int `json:"running"`
	Queued  int `json:"queued"`
}

type PublishTask struct {
	ID                string      `gorm:"primaryKey;size:64" json:"id"`
	JobID             string      `gorm:"index;size:64;not null" json:"jobId"`
	Platform          PlatformID  `gorm:"size:32;not null" json:"platform"`
	AccountID         string      `gorm:"index;size:64;not null" json:"accountId"`
	AccountNickname   string      `gorm:"size:128" json:"accountNickname"`
	ContentType       ContentType `gorm:"size:32;not null" json:"contentType"`
	Status            TaskStatus  `gorm:"size:32;default:'queued'" json:"status"`
	Attempt           int         `gorm:"default:0" json:"attempt"`
	MaxAttempts       int         `gorm:"default:3" json:"maxAttempts"`
	ErrorCode         string      `gorm:"size:64" json:"errorCode,omitempty"`
	ErrorMessage      string      `gorm:"type:text" json:"errorMessage,omitempty"`
	ResultURL         string      `gorm:"size:512" json:"resultUrl,omitempty"`
	DebugScreenshot   string      `gorm:"size:512" json:"debugScreenshot,omitempty"`
	DebugHtmlSnapshot string      `gorm:"size:512" json:"debugHtmlSnapshot,omitempty"`
	LogsJSON          string      `gorm:"type:longtext" json:"-"`
	ScheduledAt       *time.Time  `json:"scheduledAt,omitempty"`
	StartedAt         *time.Time  `json:"startedAt,omitempty"`
	FinishedAt        *time.Time  `json:"finishedAt,omitempty"`
	CreatedAt         time.Time   `json:"createdAt"`
	UpdatedAt         time.Time   `json:"updatedAt"`
}

type TaskLogEntry struct {
	Timestamp string `json:"timestamp"`
	Level     string `json:"level"`
	Message   string `json:"message"`
	Step      string `json:"step,omitempty"`
}

type PublishTaskDTO struct {
	ID                string         `json:"id"`
	JobID             string         `json:"jobId"`
	Platform          PlatformID     `json:"platform"`
	AccountID         string         `json:"accountId"`
	AccountNickname   string         `json:"accountNickname"`
	ContentType       ContentType    `json:"contentType"`
	Status            TaskStatus     `json:"status"`
	Attempt           int            `json:"attempt"`
	MaxAttempts       int            `json:"maxAttempts"`
	ErrorCode         string         `json:"errorCode,omitempty"`
	ErrorMessage      string         `json:"errorMessage,omitempty"`
	ResultURL         string         `json:"resultUrl,omitempty"`
	DebugScreenshot   string         `json:"debugScreenshot,omitempty"`
	DebugHtmlSnapshot string         `json:"debugHtmlSnapshot,omitempty"`
	Logs              []TaskLogEntry `json:"logs"`
	ScheduledAt       string         `json:"scheduledAt,omitempty"`
	StartedAt         string         `json:"startedAt,omitempty"`
	FinishedAt        string         `json:"finishedAt,omitempty"`
	CreatedAt         string         `json:"createdAt"`
}

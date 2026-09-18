package platform

import (
	"context"
	"time"
)

type PublishPayload struct {
	Title          string                 `json:"title"`
	Content        string                 `json:"content"`
	Summary        string                 `json:"summary,omitempty"`
	ContentType    string                 `json:"contentType"`
	CoverURL       string                 `json:"coverUrl,omitempty"`
	CoverTimestamp float64                `json:"coverTimestamp,omitempty"`
	Images         []string               `json:"images,omitempty"`
	VideoURL       string                 `json:"videoUrl,omitempty"`
	Tags           []string               `json:"tags,omitempty"`
	PlatformOptions map[string]interface{} `json:"platformOptions,omitempty"`
}

type PublishResult struct {
	Success        bool      `json:"success"`
	ExternalPostID string    `json:"externalPostId,omitempty"`
	ResultURL      string    `json:"resultUrl,omitempty"`
	ErrorCode      string    `json:"errorCode,omitempty"` // TOKEN_EXPIRED | RISK_CONTROL | TIMEOUT | INVALID_CONTENT
	ErrorMessage   string    `json:"errorMessage,omitempty"`
	PublishedAt    time.Time `json:"publishedAt"`
}

type AccountStatus struct {
	Valid          bool      `json:"valid"`
	Nickname       string    `json:"nickname"`
	AvatarURL      string    `json:"avatarUrl,omitempty"`
	FollowerCount  int       `json:"followerCount,omitempty"`
	LastCheckedAt  time.Time `json:"lastCheckedAt"`
	NeedsRelogin   bool      `json:"needsRelogin"`
	RiskWarning    string    `json:"riskWarning,omitempty"`
}

// PlatformProvider abstracts external account login, verification, and publishing operations
type PlatformProvider interface {
	Platform() string
	Publish(ctx context.Context, taskID string, accountID string, payload PublishPayload) (*PublishResult, error)
	CheckStatus(ctx context.Context, accountID string) (*AccountStatus, error)
}

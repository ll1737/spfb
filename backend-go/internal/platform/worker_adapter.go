package platform

import (
	"context"
	"strings"
	"time"

	"zhiyu-backend/internal/domain"
	"zhiyu-backend/internal/service"
)

// PythonWorkerAdapter adapts the existing RPA Python Worker into standard PlatformProvider
type PythonWorkerAdapter struct {
	platformName string
	workerClient *service.WorkerClient
}

func NewPythonWorkerAdapter(platformName string, workerClient *service.WorkerClient) *PythonWorkerAdapter {
	return &PythonWorkerAdapter{
		platformName: platformName,
		workerClient: workerClient,
	}
}

func (a *PythonWorkerAdapter) Platform() string {
	return a.platformName
}

func (a *PythonWorkerAdapter) Publish(ctx context.Context, taskID string, accountID string, payload PublishPayload) (*PublishResult, error) {
	req := service.CreatePublishJobRequest{
		Title:          payload.Title,
		ContentType:    domain.ContentType(payload.ContentType),
		Content:        payload.Content,
		Summary:        payload.Summary,
		CoverURL:       payload.CoverURL,
		CoverTimestamp: payload.CoverTimestamp,
		Images:         payload.Images,
		VideoURL:       payload.VideoURL,
		Tags:           payload.Tags,
	}

	resp, err := a.workerClient.Publish(ctx, taskID, a.platformName, accountID, req)
	if err != nil {
		errStr := err.Error()
		errCode := "PUBLISH_FAILED"
		if strings.Contains(errStr, "timeout") {
			errCode = "TIMEOUT"
		} else if strings.Contains(errStr, "cookie") || strings.Contains(errStr, "token") {
			errCode = "TOKEN_EXPIRED"
		}

		return &PublishResult{
			Success:      false,
			ErrorCode:    errCode,
			ErrorMessage: errStr,
			PublishedAt:  time.Now(),
		}, nil
	}

	if resp.Status != "success" {
		return &PublishResult{
			Success:      false,
			ErrorCode:    "RPA_ERROR",
			ErrorMessage: resp.Message,
			PublishedAt:  time.Now(),
		}, nil
	}

	return &PublishResult{
		Success:     true,
		ResultURL:   resp.ResultURL,
		PublishedAt: time.Now(),
	}, nil
}

func (a *PythonWorkerAdapter) CheckStatus(ctx context.Context, accountID string) (*AccountStatus, error) {
	resp, err := a.workerClient.AccountLoginStatus(ctx, a.platformName, accountID)
	if err != nil {
		return &AccountStatus{
			Valid:         false,
			LastCheckedAt: time.Now(),
			NeedsRelogin:  true,
			RiskWarning:   err.Error(),
		}, nil
	}

	isLoggedIn, _ := resp["isLoggedIn"].(bool)
	nickname, _ := resp["nickname"].(string)

	return &AccountStatus{
		Valid:         isLoggedIn,
		Nickname:      nickname,
		LastCheckedAt: time.Now(),
		NeedsRelogin:  !isLoggedIn,
	}, nil
}

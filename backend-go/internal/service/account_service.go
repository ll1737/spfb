package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"zhiyu-backend/internal/config"
	"zhiyu-backend/internal/domain"
	"zhiyu-backend/internal/repository/mysql"
	"zhiyu-backend/internal/repository/redis"
	"zhiyu-backend/pkg/crypto"
)

type AccountService struct {
	accRepo *mysql.AccountRepository
	cfg     *config.Config
}

func NewAccountService(accRepo *mysql.AccountRepository, cfg *config.Config) *AccountService {
	return &AccountService{
		accRepo: accRepo,
		cfg:     cfg,
	}
}

func (s *AccountService) ListAccounts(orgID, brandID string) ([]domain.AccountDTO, error) {
	accs, err := s.accRepo.List(orgID, brandID)
	if err != nil {
		return nil, err
	}
	dtos := make([]domain.AccountDTO, 0, len(accs))
	for i := range accs {
		dtos = append(dtos, accs[i].ToDTO())
	}
	return dtos, nil
}

func (s *AccountService) AddAccount(orgID, brandID string, acc *domain.Account) (*domain.AccountDTO, error) {
	if err := ValidateAccountSession(acc); err != nil {
		return nil, err
	}
	if strings.TrimSpace(acc.EncryptedSession) == "" && strings.TrimSpace(acc.CookieData) != "" {
		encrypted, err := crypto.EncryptToken(acc.CookieData, s.cfg.Server.AppSecret)
		if err != nil {
			return nil, fmt.Errorf("凭证加密失败: %w", err)
		}
		acc.EncryptedSession = encrypted
	}

	if acc.Nickname == "" {
		acc.Nickname = fmt.Sprintf("%s_%d", acc.Platform, time.Now().Unix()%10000)
	}
	if acc.Name == "" {
		acc.Name = acc.Nickname
	}
	if acc.ID == "" {
		acc.ID = fmt.Sprintf("acc_%s_%d", acc.Platform, time.Now().UnixNano()/1000000)
	}
	acc.OrgID = orgID
	acc.BrandID = brandID
	acc.Status = "active"
	acc.LastVerifiedAt = time.Now()
	acc.CreatedAt = time.Now()
	acc.UpdatedAt = time.Now()
	if acc.AvatarURL == "" {
		acc.AvatarURL = fmt.Sprintf("https://api.dicebear.com/7.x/identicon/svg?seed=%s", acc.ID)
	}

	if err := s.accRepo.Save(acc); err != nil {
		return nil, err
	}
	dto := acc.ToDTO()
	return &dto, nil
}

func (s *AccountService) UpdateAccount(id string, update *domain.Account) (*domain.AccountDTO, error) {
	acc, err := s.accRepo.FindByID(id)
	if err != nil || acc == nil {
		return nil, errors.New("账号不存在")
	}

	if update.Nickname != "" {
		acc.Nickname = update.Nickname
	}
	if update.Name != "" {
		acc.Name = update.Name
	}
	if update.Group != "" {
		acc.Group = update.Group
	}
	if update.Status != "" {
		acc.Status = update.Status
	}
	acc.UpdatedAt = time.Now()

	if err := s.accRepo.Save(acc); err != nil {
		return nil, err
	}
	dto := acc.ToDTO()
	return &dto, nil
}

func (s *AccountService) DeleteAccount(id string) error {
	return s.accRepo.Delete(id)
}

func (s *AccountService) BatchDeleteAccounts(ids []string) error {
	return s.accRepo.BatchDelete(ids)
}

func (s *AccountService) ImportCookie(orgID, brandID, fileName, rawContent, customPlatform, customNickname, group string) (*domain.AccountDTO, error) {
	if strings.TrimSpace(rawContent) == "" {
		return nil, errors.New("Cookie 内容不能为空")
	}

	detectedPlatform := customPlatform
	detectedNickname := customNickname

	if fileName != "" && (detectedPlatform == "" || detectedNickname == "") {
		baseName := strings.TrimSuffix(fileName, ".json")
		parts := strings.Split(baseName, "_")
		prefix := strings.ToLower(parts[0])

		known := map[string]bool{
			"douyin": true, "kuaishou": true, "xiaohongshu": true, "channels": true,
			"bilibili": true, "baijiahao": true, "weibo": true, "toutiao": true,
			"wechat_mp": true, "zhihu": true, "tiktok": true, "youtube": true,
		}
		if detectedPlatform == "" && known[prefix] {
			detectedPlatform = prefix
			if detectedNickname == "" && len(parts) > 1 {
				detectedNickname = strings.Join(parts[1:], "_")
			}
		}
	}

	if detectedPlatform == "" {
		detectedPlatform = "douyin"
	}
	if detectedNickname == "" {
		detectedNickname = fmt.Sprintf("创作者_%d", time.Now().Unix()%10000)
	}

	encrypted, err := crypto.EncryptToken(rawContent, s.cfg.Server.AppSecret)
	if err != nil {
		return nil, fmt.Errorf("encryption error: %w", err)
	}

	acc := &domain.Account{
		ID:               fmt.Sprintf("acc_%s_%d", detectedPlatform, time.Now().UnixNano()/1000000),
		OrgID:            orgID,
		BrandID:          brandID,
		Platform:         domain.PlatformID(detectedPlatform),
		Nickname:         detectedNickname,
		Name:             detectedNickname,
		Group:            group,
		AvatarURL:        fmt.Sprintf("https://api.dicebear.com/7.x/bottts/svg?seed=%s", detectedNickname),
		Status:           "active",
		EncryptedSession: encrypted,
		SessionPreview:   fmt.Sprintf("social-auto-upload 凭据 (AES-256 已加密)"),
		LastVerifiedAt:   time.Now(),
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}

	if err := s.accRepo.Save(acc); err != nil {
		return nil, err
	}

	dto := acc.ToDTO()
	return &dto, nil
}

func (s *AccountService) ExportCookie(id string) (string, string, error) {
	acc, err := s.accRepo.FindByID(id)
	if err != nil || acc == nil {
		return "", "", errors.New("未找到对应账号")
	}

	decrypted, err := crypto.DecryptToken(acc.EncryptedSession, s.cfg.Server.AppSecret)
	if err != nil {
		return "", "", fmt.Errorf("decryption error: %w", err)
	}

	filename := fmt.Sprintf("%s_%s.json", acc.Platform, acc.Nickname)
	return filename, decrypted, nil
}

func (s *AccountService) GetQRLoginStatus(ctx context.Context, sessionID string) (*domain.LoginSessionResponse, error) {
	stateJSON, err := redis.GetQRLoginState(ctx, sessionID)
	if err != nil || stateJSON == "" {
		return &domain.LoginSessionResponse{
			SessionID:        sessionID,
			Status:           "waiting_scan",
			ExpiresInSeconds: 300,
		}, nil
	}

	var resp domain.LoginSessionResponse
	if err := json.Unmarshal([]byte(stateJSON), &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

package service

import (
	"errors"
	"strings"

	"zhiyu-backend/internal/domain"
)

func ValidateAccountSession(account *domain.Account) error {
	if account == nil {
		return errors.New("账号凭证不能为空，请先完成扫码或导入有效 Cookie")
	}
	if strings.TrimSpace(account.EncryptedSession) == "" && strings.TrimSpace(account.CookieData) == "" {
		return errors.New("账号凭证不能为空，请先完成扫码或导入有效 Cookie")
	}
	return nil
}

func ExtractWorkerSession(result map[string]interface{}) (string, error) {
	if result == nil {
		return "", errors.New("平台登录状态为空")
	}
	isLoggedIn, _ := result["isLoggedIn"].(bool)
	if !isLoggedIn {
		return "", errors.New("平台账号尚未完成扫码登录")
	}
	session, _ := result["encryptedSession"].(string)
	if strings.TrimSpace(session) != "" {
		return session, nil
	}
	profileDir, _ := result["profileDir"].(string)
	if strings.TrimSpace(profileDir) != "" {
		return "profile_dir:" + profileDir, nil
	}
	credentialRef, _ := result["credentialRef"].(string)
	if strings.TrimSpace(credentialRef) != "" {
		return credentialRef, nil
	}
	return "", errors.New("平台未返回有效登录凭证，请完成扫码后重试")
}

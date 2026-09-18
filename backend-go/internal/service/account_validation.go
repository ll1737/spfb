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

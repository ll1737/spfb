package domain

import (
	"time"
)

type PlatformID string

const (
	PlatformDouyin      PlatformID = "douyin"
	PlatformKuaishou    PlatformID = "kuaishou"
	PlatformXiaohongshu PlatformID = "xiaohongshu"
	PlatformChannels    PlatformID = "channels"
	PlatformBilibili    PlatformID = "bilibili"
	PlatformBaijiahao   PlatformID = "baijiahao"
	PlatformWeibo       PlatformID = "weibo"
	PlatformToutiao     PlatformID = "toutiao"
	PlatformWechatMP    PlatformID = "wechat_mp"
	PlatformZhihu       PlatformID = "zhihu"
	PlatformTiktok      PlatformID = "tiktok"
	PlatformYoutube     PlatformID = "youtube"
)

type Account struct {
	ID               string     `gorm:"primaryKey;size:64" json:"id"`
	OrgID            string     `gorm:"index;size:64" json:"orgId,omitempty"`
	BrandID          string     `gorm:"index;size:64" json:"brandId,omitempty"`
	Platform         PlatformID `gorm:"size:32;not null;index" json:"platform"`
	Name             string     `gorm:"size:128;not null" json:"name"`
	Nickname         string     `gorm:"size:128;not null" json:"nickname"`
	AvatarURL        string     `gorm:"size:512" json:"avatarUrl"`
	Status           string     `gorm:"size:32;default:'active'" json:"status"` // active | expired | need_reauth | logging_in
	Group            string     `gorm:"size:64" json:"group,omitempty"`
	EncryptedSession string     `gorm:"type:text" json:"-"`
	CookieData       string     `gorm:"-" json:"cookieData,omitempty"`
	SessionPreview   string     `gorm:"size:256" json:"sessionPreview,omitempty"`
	FollowersCount   int        `gorm:"default:0" json:"followersCount"`
	PublishedCount   int        `gorm:"default:0" json:"publishedCount"`
	FailedCount      int        `gorm:"default:0" json:"failedCount"`
	LastVerifiedAt   time.Time  `json:"lastVerifiedAt"`
	CreatedAt        time.Time  `json:"createdAt"`
	UpdatedAt        time.Time  `json:"updatedAt"`
}

type AccountStats struct {
	PublishedCount int `json:"publishedCount"`
	FailedCount    int `json:"failedCount"`
}

type AccountDTO struct {
	ID             string       `json:"id"`
	Platform       PlatformID   `json:"platform"`
	Name           string       `json:"name"`
	Nickname       string       `json:"nickname"`
	AvatarURL      string       `json:"avatarUrl"`
	Status         string       `json:"status"`
	Group          string       `json:"group,omitempty"`
	SessionPreview string       `json:"sessionPreview,omitempty"`
	LastVerifiedAt string       `json:"lastVerifiedAt"`
	CreatedAt      string       `json:"createdAt"`
	FollowersCount int          `json:"followersCount"`
	Stats          AccountStats `json:"stats"`
}

func (a *Account) ToDTO() AccountDTO {
	return AccountDTO{
		ID:             a.ID,
		Platform:       a.Platform,
		Name:           a.Name,
		Nickname:       a.Nickname,
		AvatarURL:      a.AvatarURL,
		Status:         a.Status,
		Group:          a.Group,
		SessionPreview: a.SessionPreview,
		LastVerifiedAt: a.LastVerifiedAt.Format(time.RFC3339),
		CreatedAt:      a.CreatedAt.Format(time.RFC3339),
		FollowersCount: a.FollowersCount,
		Stats: AccountStats{
			PublishedCount: a.PublishedCount,
			FailedCount:    a.FailedCount,
		},
	}
}

type LoginSessionResponse struct {
	SessionID        string     `json:"sessionId"`
	Platform         PlatformID `json:"platform"`
	QRCodeURL        string     `json:"qrCodeUrl,omitempty"`
	Status           string     `json:"status"` // waiting_scan | scanned | confirmed | expired | error
	ExpiresInSeconds int        `json:"expiresInSeconds"`
	EncryptedSession string     `json:"encryptedSession,omitempty"`
	Nickname         string     `json:"nickname,omitempty"`
	AvatarURL        string     `json:"avatarUrl,omitempty"`
}

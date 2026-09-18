package domain

import (
	"time"
)

type TopicType string

const (
	TopicTypeAIRecommended TopicType = "ai_recommended" // 今日推荐 / AI 推荐
	TopicTypeIndustryHot   TopicType = "industry_hot"   // 行业热点
	TopicTypeUserQA        TopicType = "user_qa"        // 用户问题 / FAQ
	TopicTypeReusableViral TopicType = "reusable_viral" // 可复用爆款 / 历史爆款
)

type Topic struct {
	ID              string    `gorm:"primaryKey;size:64" json:"id"`
	OrgID           string    `gorm:"index;size:64" json:"orgId,omitempty"`
	BrandID         string    `gorm:"index;size:64" json:"brandId,omitempty"`
	Title           string    `gorm:"size:256;not null" json:"title"`
	Type            TopicType `gorm:"size:32;default:'ai_recommended'" json:"type"`
	Category        string    `gorm:"size:64" json:"category"`
	Industry        string    `gorm:"size:64" json:"industry"`
	Score           int       `gorm:"default:90" json:"score"`           // 综合推荐指数 (e.g. 93, 92, 89, 86)
	HeatScore       int       `gorm:"default:85" json:"heatScore"`       // 热点指数
	MatchScore      int       `gorm:"default:92" json:"matchScore"`      // 用户匹配度 / 新鲜度 / 用户需求 / 复用价值
	CommercialScore int       `gorm:"default:90" json:"commercialScore"` // 商业价值 / 平台适配 / 专业价值 / 表现预期
	Reason          string    `gorm:"type:text" json:"reason"`           // AI 推荐依据与决策分析
	SourcePlatform  string    `gorm:"size:64" json:"sourcePlatform"`     // weibo, douyin, kuaishou, zhihu, baidu, user_comment
	SourceURL       string    `gorm:"size:512" json:"sourceUrl"`
	TagsJSON        string    `gorm:"type:text" json:"-"`
	Tags            []string  `gorm:"-" json:"tags"`
	AnglesJSON      string    `gorm:"type:text" json:"-"`
	Angles          []string  `gorm:"-" json:"angles"`
	Status          string    `gorm:"size:32;default:'recommended'" json:"status"` // recommended | adopted | archived
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

type TopicContentGap struct {
	Category   string `json:"category"`   // 价格 / 选择, 术后护理, 真实案例, 品牌故事
	Percentage int    `json:"percentage"` // 92, 74, 67, 43
	Priority   string `json:"priority"`   // high, medium, low
}

type TopicOverviewStats struct {
	TodayRecommendedCount int               `json:"todayRecommendedCount"` // 12 待你挑选
	IndustryHotCount      int               `json:"industryHotCount"`      // 08 行业高相关
	UserQACount           int               `json:"userQaCount"`           // 26 来自评论 / FAQ
	ReusableViralCount    int               `json:"reusableViralCount"`    // 04 值得重新制作
	ContentGaps           []TopicContentGap `json:"contentGaps"`
	CurrentIndustry       string            `json:"currentIndustry"`
	LastSyncedAt          time.Time         `json:"lastSyncedAt"`
}

type TopicPreference struct {
	OrgID           string    `gorm:"primaryKey;size:64" json:"orgId"`
	BrandID         string    `gorm:"primaryKey;size:64" json:"brandId"`
	Industry        string    `gorm:"size:64" json:"industry"`
	Keywords        string    `gorm:"size:512" json:"keywords"`
	PlatformsJSON   string    `gorm:"type:text" json:"-"`
	Platforms       []string  `gorm:"-" json:"platforms"`
	AutoSyncDaily   bool      `gorm:"default:true" json:"autoSyncDaily"`
	SyncHour        int       `gorm:"default:8" json:"syncHour"` // 08:00 AM
	UpdatedAt       time.Time `json:"updatedAt"`
}

type ContentPackage struct {
	ID              string    `gorm:"primaryKey;size:64" json:"id"`
	OrgID           string    `gorm:"index;size:64" json:"orgId,omitempty"`
	BrandID         string    `gorm:"index;size:64" json:"brandId,omitempty"`
	TopicID         string    `gorm:"size:64" json:"topicId"`
	Title           string    `gorm:"size:256;not null" json:"title"`
	MasterContent   string    `gorm:"type:longtext;not null" json:"masterContent"`
	Status          string    `gorm:"size:32;default:'draft'" json:"status"` // draft | generated | scheduled | published
	AdaptationsJSON string    `gorm:"type:longtext" json:"-"`                // JSON map of platform adaptations
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}


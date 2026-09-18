package domain

import (
	"time"
)

// EnterpriseInfo represents enterprise organization in MySQL
type EnterpriseInfo struct {
	ID             string    `gorm:"primaryKey;size:64" json:"id"`
	Name           string    `gorm:"size:128;not null" json:"name"`
	Industry       string    `gorm:"size:64" json:"industry"`
	Location       string    `gorm:"size:128" json:"location"`
	Code           string    `gorm:"uniqueIndex;size:64" json:"code"`
	Tier           string    `gorm:"size:32;default:'Enterprise 旗舰旗舰版'" json:"tier"`
	Status         string    `gorm:"size:32;default:'active'" json:"status"`
	QuotaGenerated string    `gorm:"size:64;default:'8,420 / 50,000 条'" json:"quotaGenerated"`
	QuotaStorageGB float64   `gorm:"default:500" json:"quotaStorageGB"`
	UsedStorageGB  float64   `gorm:"default:128.4" json:"usedStorageGB"`
	LogoText       string    `gorm:"size:32" json:"logoText"`
	LogoBg         string    `gorm:"size:64;default:'from-indigo-600 to-purple-600'" json:"logoBg"`
	InviteCode     string    `gorm:"size:64" json:"inviteCode"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

// Brand represents brand/sub-brand matrix under an enterprise
type Brand struct {
	ID            string    `gorm:"primaryKey;size:64" json:"id"`
	OrgID         string    `gorm:"index;size:64;not null" json:"orgId"`
	Name          string    `gorm:"size:128;not null" json:"name"`
	Type          string    `gorm:"size:32;default:'sub'" json:"type"` // main | sub
	AccountsCount int       `gorm:"default:0" json:"accountsCount"`
	MembersCount  int       `gorm:"default:0" json:"membersCount"`
	IsCurrent     bool      `gorm:"default:false" json:"isCurrent"`
	IconText      string    `gorm:"size:32" json:"iconText"`
	Description   string    `gorm:"type:text" json:"description"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

// TeamMember represents team member with role & assigned brands
type TeamMember struct {
	ID             string    `gorm:"primaryKey;size:64" json:"id"`
	OrgID          string    `gorm:"index;size:64;not null" json:"orgId"`
	UserID         string    `gorm:"size:64;index" json:"userId,omitempty"`
	Name           string    `gorm:"size:64;not null" json:"name"`
	Username       string    `gorm:"size:64" json:"username"`
	Email          string    `gorm:"size:128" json:"email"`
	Role           UserRole  `gorm:"size:32;not null" json:"role"`
	RoleLabel      string    `gorm:"size:64" json:"roleLabel"`
	Badge          string    `gorm:"size:64" json:"badge"`
	BadgeColor     string    `gorm:"size:64" json:"badgeColor"`
	AvatarText     string    `gorm:"size:32" json:"avatarText"`
	AvatarURL      string    `gorm:"size:512" json:"avatarUrl,omitempty"`
	IsOwner        bool      `gorm:"default:false" json:"isOwner"`
	AssignedBrands string    `gorm:"type:text" json:"assignedBrandsJson"` // JSON array string
	AssignedBrandIDs []string `gorm:"-" json:"assignedBrands"`
	JoinedAt       string    `gorm:"size:64" json:"joinedAt"`
	Status         string    `gorm:"size:32;default:'active'" json:"status"` // active | invited | disabled
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

// CollaborationRule represents approval flow and publishing permissions
type CollaborationRule struct {
	ID                 uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	OrgID              string    `gorm:"uniqueIndex;size:64;not null" json:"orgId"`
	Enabled            bool      `gorm:"default:true" json:"enabled"`
	RuleDescription    string    `gorm:"type:text" json:"ruleDescription"`
	RequireAiAudit     bool      `gorm:"default:true" json:"requireAiAudit"`
	RequireManualAudit bool      `gorm:"default:true" json:"requireManualAudit"`
	RequireRiskCheck   bool      `gorm:"default:true" json:"requireRiskCheck"`
	ApproverRole       UserRole  `gorm:"size:32;default:'reviewer'" json:"approverRole"`
	AllowedPublishers  string    `gorm:"type:text" json:"allowedPublishersJson"` // JSON array
	AllowedRoles       []UserRole `gorm:"-" json:"allowedPublishers"`
	UpdatedAt          time.Time `json:"updatedAt"`
}

type RolePermissions struct {
	CanRead    bool `json:"canRead"`
	CanWrite   bool `json:"canWrite"`
	CanPublish bool `json:"canPublish,omitempty"`
	CanAdmin   bool `json:"canAdmin,omitempty"`
}

// ModulePermissionRule represents RBAC permission rule for a specific module
type ModulePermissionRule struct {
	ID              uint                            `gorm:"primaryKey;autoIncrement" json:"id"`
	OrgID           string                          `gorm:"index;size:64;not null" json:"orgId"`
	ModuleID        string                          `gorm:"size:64;not null" json:"moduleId"`
	ModuleName      string                          `gorm:"size:128;not null" json:"moduleName"`
	Category        string                          `gorm:"size:64;not null" json:"category"`
	PermissionsJSON string                          `gorm:"column:permissions;type:text" json:"-"`
	Permissions     map[string]RolePermissions      `gorm:"-" json:"permissions"`
	UpdatedAt       time.Time                       `json:"updatedAt"`
}

type EnterpriseDataResponse struct {
	Enterprise        *EnterpriseInfo         `json:"enterprise"`
	Brands            []Brand                `json:"brands"`
	Members           []TeamMember           `json:"members"`
	CollaborationRule *CollaborationRule     `json:"collaborationRule"`
	CurrentBrand      *Brand                 `json:"currentBrand"`
	PermissionsMatrix []ModulePermissionRule `json:"permissionsMatrix"`
}

func DefaultModulePermissions(orgID string) []ModulePermissionRule {
	now := time.Now()
	standardRoles := func(readAll, writeOp, pubOp, writeAdmin bool) map[string]RolePermissions {
		return map[string]RolePermissions{
			"owner":       {CanRead: true, CanWrite: true, CanPublish: true, CanAdmin: true},
			"admin":       {CanRead: true, CanWrite: true, CanPublish: true, CanAdmin: true},
			"asset_admin": {CanRead: true, CanWrite: writeAdmin, CanPublish: false, CanAdmin: writeAdmin},
			"operator":    {CanRead: true, CanWrite: writeOp, CanPublish: pubOp, CanAdmin: false},
			"publisher":   {CanRead: true, CanWrite: false, CanPublish: true, CanAdmin: false},
			"reviewer":    {CanRead: true, CanWrite: true, CanPublish: false, CanAdmin: false},
			"viewer":      {CanRead: readAll, CanWrite: false, CanPublish: false, CanAdmin: false},
		}
	}

	modules := []struct {
		id, name, cat string
		roles         map[string]RolePermissions
	}{
		{"dashboard", "数据大屏与资产概览", "核心看板", standardRoles(true, false, false, true)},
		{"publish", "矩阵发布中心", "全网分发", standardRoles(true, true, true, true)},
		{"accounts", "矩阵账号管理", "资产配置", standardRoles(true, false, false, true)},
		{"matrix_topology", "矩阵拓扑与策略流", "策略流控", standardRoles(true, true, false, true)},
		{"batch_generator", "AI 批量内容生产", "AI 智创引擎", standardRoles(true, true, false, true)},
		{"ai_clip", "智能短视频剪辑", "音视频智剪", standardRoles(true, true, false, true)},
		{"content_vault", "企业内容资产库", "数字资产", standardRoles(true, true, false, true)},
		{"creator_memory", "AI 创作者记忆库", "个性化记忆", standardRoles(true, true, false, true)},
		{"analytics", "全网数据看板与投后洞察", "全域罗盘", standardRoles(true, false, false, true)},
		{"enterprise_collaboration", "企业组织与多品牌协同", "组织管理", standardRoles(true, false, false, true)},
		{"auto_pilot", "自动驾驶与流控引擎", "自动化调度", standardRoles(true, true, true, true)},
		{"traffic_radar", "流量雷达与爆款监测", "趋势洞察", standardRoles(true, false, false, true)},
		{"compliance_security", "合规风控与安全审计", "安全合规", standardRoles(true, false, false, true)},
		{"digital_human", "AI 数字人播报", "数字人生成", standardRoles(true, true, false, true)},
	}

	res := make([]ModulePermissionRule, len(modules))
	for i, m := range modules {
		res[i] = ModulePermissionRule{
			OrgID:       orgID,
			ModuleID:    m.id,
			ModuleName:  m.name,
			Category:    m.cat,
			Permissions: m.roles,
			UpdatedAt:   now,
		}
	}
	return res
}


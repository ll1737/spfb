package service

import (
	"errors"
	"fmt"
	"time"

	"zhiyu-backend/internal/domain"
	"zhiyu-backend/internal/repository/mysql"
)

type EnterpriseService struct {
	entRepo  *mysql.EnterpriseRepository
	userRepo *mysql.UserRepository
}

func NewEnterpriseService(entRepo *mysql.EnterpriseRepository, userRepo *mysql.UserRepository) *EnterpriseService {
	return &EnterpriseService{
		entRepo:  entRepo,
		userRepo: userRepo,
	}
}

func (s *EnterpriseService) GetFullEnterpriseData(orgID string) (*domain.EnterpriseDataResponse, error) {
	if orgID == "" {
		return &domain.EnterpriseDataResponse{
			Enterprise:        nil,
			Brands:            []domain.Brand{},
			Members:           []domain.TeamMember{},
			CollaborationRule: nil,
			CurrentBrand:      nil,
			PermissionsMatrix: []domain.ModulePermissionRule{},
		}, nil
	}

	ent, err := s.entRepo.GetEnterprise(orgID)
	if err != nil {
		return nil, err
	}
	if ent == nil {
		ent = &domain.EnterpriseInfo{
			ID:             orgID,
			Name:           "智域企业空间",
			Industry:       "人工智能 / 全域内容运营",
			Location:       "中国",
			Code:           fmt.Sprintf("ZY-%s", orgID),
			Tier:           "Enterprise 旗舰版",
			Status:         "active",
			QuotaGenerated: "0 / 50,000 条",
			QuotaStorageGB: 500,
			UsedStorageGB:  0,
			LogoText:       "企",
			LogoBg:         "from-indigo-600 to-purple-600",
			InviteCode:     fmt.Sprintf("ZY%d", time.Now().UnixNano()%100000),
			CreatedAt:      time.Now(),
			UpdatedAt:      time.Now(),
		}
		_ = s.entRepo.SaveEnterprise(ent)
	}

	brands, _ := s.entRepo.GetBrands(orgID)
	if len(brands) == 0 {
		defaultBrand := domain.Brand{
			ID:        fmt.Sprintf("brand_%d", time.Now().UnixNano()/1000000),
			OrgID:     orgID,
			Name:      ent.Name + " 主品牌",
			Type:      "main",
			IsCurrent: true,
			IconText:  string([]rune(ent.Name)[:1]),
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
		_ = s.entRepo.SaveBrand(&defaultBrand)
		brands = []domain.Brand{defaultBrand}
	}

	members, _ := s.entRepo.GetMembers(orgID)
	rule, _ := s.entRepo.GetCollaborationRule(orgID)
	if rule == nil {
		rule = &domain.CollaborationRule{
			OrgID:              orgID,
			Enabled:            true,
			RuleDescription:    "标准企业协同发布与矩阵安全审核策略",
			RequireAiAudit:     true,
			RequireManualAudit: false,
			RequireRiskCheck:   true,
			ApproverRole:       domain.RoleAdmin,
			AllowedRoles:       []domain.UserRole{domain.RoleOwner, domain.RoleAdmin, domain.RoleOperator},
			UpdatedAt:          time.Now(),
		}
		_ = s.entRepo.SaveCollaborationRule(rule)
	}

	matrix, _ := s.entRepo.GetPermissionsMatrix(orgID)
	if len(matrix) == 0 {
		matrix = domain.DefaultModulePermissions(orgID)
		_ = s.entRepo.SavePermissionsMatrix(orgID, matrix)
	}

	var currentBrand *domain.Brand
	for i := range brands {
		if brands[i].IsCurrent {
			currentBrand = &brands[i]
			break
		}
	}
	if currentBrand == nil && len(brands) > 0 {
		currentBrand = &brands[0]
	}

	return &domain.EnterpriseDataResponse{
		Enterprise:        ent,
		Brands:            brands,
		Members:           members,
		CollaborationRule: rule,
		CurrentBrand:      currentBrand,
		PermissionsMatrix: matrix,
	}, nil
}

func (s *EnterpriseService) UpdateEnterprise(orgID string, update *domain.EnterpriseInfo) (*domain.EnterpriseInfo, error) {
	ent, err := s.entRepo.GetEnterprise(orgID)
	if err != nil || ent == nil {
		return nil, errors.New("企业不存在")
	}

	if update.Name != "" {
		ent.Name = update.Name
	}
	if update.Industry != "" {
		ent.Industry = update.Industry
	}
	if update.Location != "" {
		ent.Location = update.Location
	}
	if update.LogoText != "" {
		ent.LogoText = update.LogoText
	}
	ent.UpdatedAt = time.Now()

	if err := s.entRepo.SaveEnterprise(ent); err != nil {
		return nil, err
	}
	return ent, nil
}

func (s *EnterpriseService) AddBrand(orgID string, brand *domain.Brand) (*domain.Brand, error) {
	if brand.Name == "" {
		return nil, errors.New("品牌名称不能为空")
	}
	brand.ID = fmt.Sprintf("brand_%d", time.Now().UnixNano()/1000000)
	brand.OrgID = orgID
	brand.CreatedAt = time.Now()
	brand.UpdatedAt = time.Now()
	if brand.IconText == "" {
		brand.IconText = string([]rune(brand.Name)[:1])
	}
	if err := s.entRepo.SaveBrand(brand); err != nil {
		return nil, err
	}
	return brand, nil
}

func (s *EnterpriseService) SwitchBrand(orgID, brandID string) error {
	return s.entRepo.SetCurrentBrand(orgID, brandID)
}

func (s *EnterpriseService) DeleteBrand(brandID string) error {
	return s.entRepo.DeleteBrand(brandID)
}

func (s *EnterpriseService) AddMember(orgID string, member *domain.TeamMember) (*domain.TeamMember, error) {
	if member.Name == "" || member.Email == "" {
		return nil, errors.New("成员姓名和邮箱不能为空")
	}
	member.ID = fmt.Sprintf("mem_%d", time.Now().UnixNano()/1000000)
	member.OrgID = orgID
	member.JoinedAt = time.Now().Format("2006-01-02")
	member.CreatedAt = time.Now()
	member.UpdatedAt = time.Now()
	if member.AvatarText == "" {
		member.AvatarText = string([]rune(member.Name)[:1])
	}
	if member.Status == "" {
		member.Status = "active"
	}
	if err := s.entRepo.SaveMember(member); err != nil {
		return nil, err
	}
	return member, nil
}

func (s *EnterpriseService) UpdateMember(memberID string, update *domain.TeamMember) (*domain.TeamMember, error) {
	update.ID = memberID
	update.UpdatedAt = time.Now()
	if err := s.entRepo.SaveMember(update); err != nil {
		return nil, err
	}
	return update, nil
}

func (s *EnterpriseService) DeleteMember(memberID string) error {
	return s.entRepo.DeleteMember(memberID)
}

func (s *EnterpriseService) UpdateCollaborationRule(orgID string, rule *domain.CollaborationRule) (*domain.CollaborationRule, error) {
	rule.OrgID = orgID
	rule.UpdatedAt = time.Now()
	if err := s.entRepo.SaveCollaborationRule(rule); err != nil {
		return nil, err
	}
	return rule, nil
}

func (s *EnterpriseService) GetPermissionsMatrix(orgID string) ([]domain.ModulePermissionRule, error) {
	return s.entRepo.GetPermissionsMatrix(orgID)
}

func (s *EnterpriseService) UpdatePermissionsMatrix(orgID string, rules []domain.ModulePermissionRule) error {
	return s.entRepo.SavePermissionsMatrix(orgID, rules)
}

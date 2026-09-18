package mysql

import (
	"encoding/json"
	"errors"

	"gorm.io/gorm"
	"zhiyu-backend/internal/domain"
)

type EnterpriseRepository struct {
	db *gorm.DB
}

func NewEnterpriseRepository(db *gorm.DB) *EnterpriseRepository {
	return &EnterpriseRepository{db: db}
}

func (r *EnterpriseRepository) GetEnterprise(orgID string) (*domain.EnterpriseInfo, error) {
	if orgID == "" {
		return nil, nil
	}
	var ent domain.EnterpriseInfo
	err := r.db.Where("id = ?", orgID).First(&ent).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &ent, nil
}

func (r *EnterpriseRepository) GetEnterpriseByInviteCode(inviteCode string) (*domain.EnterpriseInfo, error) {
	if inviteCode == "" {
		return nil, nil
	}
	var ent domain.EnterpriseInfo
	err := r.db.Where("invite_code = ?", inviteCode).First(&ent).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &ent, nil
}

func (r *EnterpriseRepository) SaveEnterprise(ent *domain.EnterpriseInfo) error {
	return r.db.Save(ent).Error
}

func (r *EnterpriseRepository) GetBrands(orgID string) ([]domain.Brand, error) {
	brands := make([]domain.Brand, 0)
	if orgID == "" {
		return brands, nil
	}
	err := r.db.Where("org_id = ?", orgID).Find(&brands).Error
	return brands, err
}

func (r *EnterpriseRepository) SaveBrand(brand *domain.Brand) error {
	return r.db.Save(brand).Error
}

func (r *EnterpriseRepository) DeleteBrand(id string) error {
	return r.db.Where("id = ?", id).Delete(&domain.Brand{}).Error
}

func (r *EnterpriseRepository) SetCurrentBrand(orgID, brandID string) error {
	_ = r.db.Model(&domain.Brand{}).Where("org_id = ?", orgID).Update("is_current", false).Error
	return r.db.Model(&domain.Brand{}).Where("id = ? AND org_id = ?", brandID, orgID).Update("is_current", true).Error
}

func (r *EnterpriseRepository) GetMembers(orgID string) ([]domain.TeamMember, error) {
	members := make([]domain.TeamMember, 0)
	if orgID == "" {
		return members, nil
	}
	err := r.db.Where("org_id = ?", orgID).Find(&members).Error
	for i := range members {
		if members[i].AssignedBrands != "" {
			_ = json.Unmarshal([]byte(members[i].AssignedBrands), &members[i].AssignedBrandIDs)
		}
	}
	return members, err
}

func (r *EnterpriseRepository) SaveMember(member *domain.TeamMember) error {
	if len(member.AssignedBrandIDs) > 0 {
		bytes, _ := json.Marshal(member.AssignedBrandIDs)
		member.AssignedBrands = string(bytes)
	}
	return r.db.Save(member).Error
}

func (r *EnterpriseRepository) DeleteMember(id string) error {
	return r.db.Where("id = ?", id).Delete(&domain.TeamMember{}).Error
}

func (r *EnterpriseRepository) GetCollaborationRule(orgID string) (*domain.CollaborationRule, error) {
	var rule domain.CollaborationRule
	if orgID == "" {
		return nil, nil
	}
	err := r.db.Where("org_id = ?", orgID).First(&rule).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	if rule.AllowedPublishers != "" {
		_ = json.Unmarshal([]byte(rule.AllowedPublishers), &rule.AllowedRoles)
	}
	return &rule, nil
}

func (r *EnterpriseRepository) SaveCollaborationRule(rule *domain.CollaborationRule) error {
	if len(rule.AllowedRoles) > 0 {
		bytes, _ := json.Marshal(rule.AllowedRoles)
		rule.AllowedPublishers = string(bytes)
	}
	return r.db.Save(rule).Error
}

func (r *EnterpriseRepository) GetPermissionsMatrix(orgID string) ([]domain.ModulePermissionRule, error) {
	rules := make([]domain.ModulePermissionRule, 0)
	if orgID == "" {
		return rules, nil
	}
	err := r.db.Where("org_id = ?", orgID).Find(&rules).Error
	if err != nil {
		return rules, err
	}
	for i := range rules {
		if rules[i].PermissionsJSON != "" {
			_ = json.Unmarshal([]byte(rules[i].PermissionsJSON), &rules[i].Permissions)
		}
		if rules[i].Permissions == nil {
			rules[i].Permissions = make(map[string]domain.RolePermissions)
		}
	}
	return rules, nil
}

func (r *EnterpriseRepository) SavePermissionsMatrix(orgID string, rules []domain.ModulePermissionRule) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		_ = tx.Where("org_id = ?", orgID).Delete(&domain.ModulePermissionRule{}).Error
		for _, rule := range rules {
			rule.OrgID = orgID
			if len(rule.Permissions) > 0 {
				bytes, _ := json.Marshal(rule.Permissions)
				rule.PermissionsJSON = string(bytes)
			}
			if err := tx.Create(&rule).Error; err != nil {
				return err
			}
		}
		return nil
	})
}


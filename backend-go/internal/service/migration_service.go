package service

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"gorm.io/gorm"
	"zhiyu-backend/internal/domain"
	"zhiyu-backend/pkg/logger"
)

type MigrationService struct {
	db *gorm.DB
}

func NewMigrationService(db *gorm.DB) *MigrationService {
	return &MigrationService{db: db}
}

// AutoImportFromJSON imports existing matrix_data.json into MySQL if database is fresh
func (s *MigrationService) AutoImportFromJSON(jsonPaths ...string) error {
	var count int64
	if err := s.db.Model(&domain.User{}).Count(&count).Error; err != nil {
		return err
	}

	if count > 0 {
		logger.Log.Info("MySQL database already initialized (skipping JSON seed import)")
		return nil
	}

	var rawPath string
	for _, p := range jsonPaths {
		if _, err := os.Stat(p); err == nil {
			rawPath = p
			break
		}
	}

	if rawPath == "" {
		// Try searching relative paths
		candidates := []string{
			"matrix_data.json",
			"../matrix_data.json",
			"../../matrix_data.json",
			filepath.Join("..", "matrix_data.json"),
		}
		for _, p := range candidates {
			if _, err := os.Stat(p); err == nil {
				rawPath = p
				break
			}
		}
	}

	if rawPath == "" {
		logger.Log.Warn("matrix_data.json not found for initial seeding")
		return nil
	}

	data, err := os.ReadFile(rawPath)
	if err != nil {
		return fmt.Errorf("read matrix_data.json failed: %w", err)
	}

	var root map[string]json.RawMessage
	if err := json.Unmarshal(data, &root); err != nil {
		return fmt.Errorf("unmarshal matrix_data.json failed: %w", err)
	}

	logger.Log.Infof("Starting initial migration from %s to MySQL...", rawPath)

	return s.db.Transaction(func(tx *gorm.DB) error {
		// 1. Users
		if uData, ok := root["users"]; ok {
			var users []domain.User
			if err := json.Unmarshal(uData, &users); err == nil {
				for i := range users {
					if users[i].CreatedAt.IsZero() {
						users[i].CreatedAt = time.Now()
					}
					users[i].UpdatedAt = time.Now()
					tx.Save(&users[i])
				}
				logger.Log.Infof("Imported %d users to MySQL", len(users))
			}
		}

		// 2. Enterprise
		if eData, ok := root["enterprise"]; ok {
			var ent domain.EnterpriseInfo
			if err := json.Unmarshal(eData, &ent); err == nil {
				if ent.CreatedAt.IsZero() {
					ent.CreatedAt = time.Now()
				}
				ent.UpdatedAt = time.Now()
				tx.Save(&ent)
				logger.Log.Infof("Imported enterprise info (%s) to MySQL", ent.Name)
			}
		}

		// 3. Brands
		if bData, ok := root["brands"]; ok {
			var brands []domain.Brand
			if err := json.Unmarshal(bData, &brands); err == nil {
				for i := range brands {
					if brands[i].CreatedAt.IsZero() {
						brands[i].CreatedAt = time.Now()
					}
					brands[i].UpdatedAt = time.Now()
					tx.Save(&brands[i])
				}
				logger.Log.Infof("Imported %d brands to MySQL", len(brands))
			}
		}

		// 4. Team Members
		if mData, ok := root["members"]; ok {
			var rawMembers []map[string]interface{}
			if err := json.Unmarshal(mData, &rawMembers); err == nil {
				for _, rm := range rawMembers {
					assignedBrandsJSON, _ := json.Marshal(rm["assignedBrands"])
					member := domain.TeamMember{
						ID:             fmt.Sprintf("%v", rm["id"]),
						OrgID:          fmt.Sprintf("%v", rm["orgId"]),
						UserID:         fmt.Sprintf("%v", rm["userId"]),
						Name:           fmt.Sprintf("%v", rm["name"]),
						Username:       fmt.Sprintf("%v", rm["username"]),
						Email:          fmt.Sprintf("%v", rm["email"]),
						Role:           domain.UserRole(fmt.Sprintf("%v", rm["role"])),
						RoleLabel:      fmt.Sprintf("%v", rm["roleLabel"]),
						Badge:          fmt.Sprintf("%v", rm["badge"]),
						BadgeColor:     fmt.Sprintf("%v", rm["badgeColor"]),
						AvatarText:     fmt.Sprintf("%v", rm["avatarText"]),
						AvatarURL:      fmt.Sprintf("%v", rm["avatarUrl"]),
						AssignedBrands: string(assignedBrandsJSON),
						JoinedAt:       fmt.Sprintf("%v", rm["joinedAt"]),
						Status:         fmt.Sprintf("%v", rm["status"]),
						CreatedAt:      time.Now(),
						UpdatedAt:      time.Now(),
					}
					if isOwner, ok := rm["isOwner"].(bool); ok {
						member.IsOwner = isOwner
					}
					tx.Save(&member)
				}
				logger.Log.Infof("Imported %d team members to MySQL", len(rawMembers))
			}
		}

		// 5. Collaboration Rule
		if rData, ok := root["collaborationRule"]; ok {
			var rawRule map[string]interface{}
			if err := json.Unmarshal(rData, &rawRule); err == nil {
				allowedPubJSON, _ := json.Marshal(rawRule["allowedPublishers"])
				rule := domain.CollaborationRule{
					OrgID:              "ent_default_001",
					Enabled:            true,
					RuleDescription:    fmt.Sprintf("%v", rawRule["ruleDescription"]),
					RequireAiAudit:     true,
					RequireManualAudit: true,
					RequireRiskCheck:   true,
					ApproverRole:       domain.RoleReviewer,
					AllowedPublishers:  string(allowedPubJSON),
					UpdatedAt:          time.Now(),
				}
				tx.Save(&rule)
				logger.Log.Info("Imported collaboration approval rules to MySQL")
			}
		}

		// 6. Permissions Matrix
		if pData, ok := root["permissionsMatrix"]; ok {
			var rawPerms []map[string]interface{}
			if err := json.Unmarshal(pData, &rawPerms); err == nil {
				for _, rp := range rawPerms {
					permJSON, _ := json.Marshal(rp["permissions"])
					rule := domain.ModulePermissionRule{
						OrgID:           "ent_default_001",
						ModuleID:        fmt.Sprintf("%v", rp["moduleId"]),
						ModuleName:      fmt.Sprintf("%v", rp["moduleName"]),
						Category:        fmt.Sprintf("%v", rp["category"]),
						PermissionsJSON: string(permJSON),
						UpdatedAt:       time.Now(),
					}
					tx.Save(&rule)
				}
				logger.Log.Infof("Imported %d module RBAC rules to MySQL", len(rawPerms))
			}
		}

		// 7. Accounts
		if aData, ok := root["accounts"]; ok {
			var rawAccs []map[string]interface{}
			if err := json.Unmarshal(aData, &rawAccs); err == nil {
				for _, ra := range rawAccs {
					orgID := fmt.Sprintf("%v", ra["orgId"])
					if orgID == "" || orgID == "<nil>" {
						orgID = "ent_default_001"
					}
					brandID := fmt.Sprintf("%v", ra["brandId"])
					if brandID == "<nil>" {
						brandID = ""
					}
					acc := domain.Account{
						ID:               fmt.Sprintf("%v", ra["id"]),
						OrgID:            orgID,
						BrandID:          brandID,
						Platform:         domain.PlatformID(fmt.Sprintf("%v", ra["platform"])),
						Name:             fmt.Sprintf("%v", ra["name"]),
						Nickname:         fmt.Sprintf("%v", ra["nickname"]),
						AvatarURL:        fmt.Sprintf("%v", ra["avatarUrl"]),
						Status:           fmt.Sprintf("%v", ra["status"]),
						Group:            fmt.Sprintf("%v", ra["group"]),
						EncryptedSession: fmt.Sprintf("%v", ra["encryptedSession"]),
						SessionPreview:   fmt.Sprintf("%v", ra["sessionPreview"]),
						LastVerifiedAt:   time.Now(),
						CreatedAt:        time.Now(),
						UpdatedAt:        time.Now(),
					}
					tx.Save(&acc)
				}
				logger.Log.Infof("Imported %d matrix accounts to MySQL", len(rawAccs))
			}
		}

		return nil
	})
}

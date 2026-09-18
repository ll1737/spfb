package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"zhiyu-backend/internal/config"
	"zhiyu-backend/internal/domain"
	"zhiyu-backend/internal/repository/mysql"
	"zhiyu-backend/internal/repository/redis"
	"zhiyu-backend/pkg/jwt"
	"zhiyu-backend/pkg/password"
)

type AuthService struct {
	userRepo *mysql.UserRepository
	entRepo  *mysql.EnterpriseRepository
	cfg      *config.Config
}

func NewAuthService(userRepo *mysql.UserRepository, entRepo *mysql.EnterpriseRepository, cfg *config.Config) *AuthService {
	return &AuthService{
		userRepo: userRepo,
		entRepo:  entRepo,
		cfg:      cfg,
	}
}

func (s *AuthService) Login(ctx context.Context, req domain.LoginRequest) (*domain.AuthResponse, error) {
	user, err := s.userRepo.FindByUsernameOrEmail(req.Account)
	if err != nil {
		return nil, fmt.Errorf("database query error: %w", err)
	}
	if user == nil {
		return nil, errors.New("用户名或密码错误")
	}

	if !password.VerifyPassword(req.Password, user.Salt, user.PasswordHash) {
		return nil, errors.New("用户名或密码错误")
	}

	now := time.Now()
	user.LastLoginAt = &now
	_ = s.userRepo.Update(user)

	// Generate JWT
	expireDuration := s.cfg.JWT.ExpireDuration()
	if req.RememberMe {
		expireDuration = 30 * 24 * time.Hour
	}

	claims := jwt.CustomClaims{
		UserID:         user.ID,
		Username:       user.Username,
		Role:           string(user.Role),
		EnterpriseID:   user.EnterpriseID,
		CurrentBrandID: user.CurrentBrandID,
	}

	token, err := jwt.GenerateToken(s.cfg.JWT.Secret, expireDuration, claims)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	// Cache Session in Redis
	_ = redis.SetSessionToken(ctx, token, user.ID, expireDuration)

	ent, _ := s.entRepo.GetEnterprise(user.EnterpriseID)

	return &domain.AuthResponse{
		Token:      token,
		User:       user,
		Enterprise: ent,
		Message:    "登录成功",
	}, nil
}

func (s *AuthService) Register(ctx context.Context, req domain.RegisterRequest) (*domain.AuthResponse, error) {
	// Check existing
	existing, _ := s.userRepo.FindByUsernameOrEmail(req.Username)
	if existing != nil {
		return nil, errors.New("该用户名已被注册")
	}

	existingEmail, _ := s.userRepo.FindByUsernameOrEmail(req.Email)
	if existingEmail != nil {
		return nil, errors.New("该邮箱已被注册")
	}

	salt := password.GenerateSalt(16)
	pwdHash := password.HashPassword(req.Password, salt)
	userID := fmt.Sprintf("usr_%d", time.Now().UnixNano()/1000000)

	role := req.Role
	if role == "" {
		role = domain.RoleAdmin
	}

	user := &domain.User{
		ID:           userID,
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: pwdHash,
		Salt:         salt,
		Nickname:     req.Nickname,
		AvatarURL:    fmt.Sprintf("https://api.dicebear.com/7.x/bottts/svg?seed=%s", req.Username),
		Role:         role,
		TeamName:     req.TeamName,
		Phone:        req.Phone,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	var ent *domain.EnterpriseInfo

	if req.RegisterMode == "join_org" {
		if req.InviteCode == "" {
			return nil, errors.New("请输入企业邀请码")
		}
		foundEnt, err := s.entRepo.GetEnterpriseByInviteCode(req.InviteCode)
		if err != nil || foundEnt == nil {
			return nil, errors.New("企业邀请码不存在或已失效，请向企业管理员索取有效邀请码")
		}
		ent = foundEnt
		orgID := ent.ID

		brands, _ := s.entRepo.GetBrands(orgID)
		brandID := ""
		brandName := ""
		if len(brands) > 0 {
			brandID = brands[0].ID
			brandName = brands[0].Name
		}

		user.EnterpriseID = orgID
		user.EnterpriseName = ent.Name
		user.CurrentBrandID = brandID
		user.CurrentBrandName = brandName
		if user.Role == "" || user.Role == domain.RoleOwner {
			user.Role = domain.RoleOperator
		}

		// Add as team member
		member := &domain.TeamMember{
			ID:               fmt.Sprintf("mem_%d", time.Now().UnixNano()/1000000),
			OrgID:            orgID,
			UserID:           user.ID,
			Name:             user.Nickname,
			Username:         user.Username,
			Email:            user.Email,
			Role:             user.Role,
			RoleLabel:        "矩阵运营专员",
			Badge:            "新成员",
			BadgeColor:       "bg-blue-100 text-blue-700",
			AvatarText:       string([]rune(user.Nickname)[:1]),
			AvatarURL:        user.AvatarURL,
			IsOwner:          false,
			AssignedBrandIDs: []string{brandID},
			JoinedAt:         time.Now().Format("2006-01-02"),
			Status:           "active",
			CreatedAt:        time.Now(),
			UpdatedAt:        time.Now(),
		}
		_ = s.entRepo.SaveMember(member)
	} else {
		// Default: create new isolated enterprise
		orgID := fmt.Sprintf("ent_%d", time.Now().UnixNano()/1000000)
		entName := req.EnterpriseName
		if entName == "" {
			entName = req.Nickname + " 的企业工作空间"
		}
		industry := req.EnterpriseIndustry
		if industry == "" {
			industry = "全域数字媒体 / AI 创作与分发"
		}
		location := req.EnterpriseLocation
		if location == "" {
			location = "中国"
		}

		ent = &domain.EnterpriseInfo{
			ID:             orgID,
			Name:           entName,
			Industry:       industry,
			Location:       location,
			Code:           fmt.Sprintf("ZY-%d", time.Now().Unix()%10000),
			Tier:           "Enterprise 旗舰版",
			Status:         "active",
			QuotaGenerated: "0 / 50,000 条",
			QuotaStorageGB: 500,
			UsedStorageGB:  0,
			LogoText:       string([]rune(entName)[:1]),
			LogoBg:         "from-indigo-600 to-purple-600",
			InviteCode:     fmt.Sprintf("ZY%d", time.Now().UnixNano()%100000),
			CreatedAt:      time.Now(),
			UpdatedAt:      time.Now(),
		}
		_ = s.entRepo.SaveEnterprise(ent)

		brandName := req.BrandName
		if brandName == "" {
			brandName = entName + " 主品牌"
		}
		brandID := fmt.Sprintf("brand_%d", time.Now().UnixNano()/1000000)
		brand := &domain.Brand{
			ID:        brandID,
			OrgID:     orgID,
			Name:      brandName,
			Type:      "main",
			IsCurrent: true,
			IconText:  string([]rune(brandName)[:1]),
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
		_ = s.entRepo.SaveBrand(brand)

		user.EnterpriseID = orgID
		user.EnterpriseName = ent.Name
		user.CurrentBrandID = brandID
		user.CurrentBrandName = brand.Name
		user.Role = domain.RoleOwner

		// Add owner team member
		member := &domain.TeamMember{
			ID:               fmt.Sprintf("mem_%d", time.Now().UnixNano()/1000000),
			OrgID:            orgID,
			UserID:           user.ID,
			Name:             user.Nickname,
			Username:         user.Username,
			Email:            user.Email,
			Role:             domain.RoleOwner,
			RoleLabel:        "企业主 / 超级管理员",
			Badge:            "创始人",
			BadgeColor:       "bg-amber-100 text-amber-700",
			AvatarText:       string([]rune(user.Nickname)[:1]),
			AvatarURL:        user.AvatarURL,
			IsOwner:          true,
			AssignedBrandIDs: []string{brandID},
			JoinedAt:         time.Now().Format("2006-01-02"),
			Status:           "active",
			CreatedAt:        time.Now(),
			UpdatedAt:        time.Now(),
		}
		_ = s.entRepo.SaveMember(member)

		// Create default collaboration rule
		rule := &domain.CollaborationRule{
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

		// Create default permissions matrix
		matrix := domain.DefaultModulePermissions(orgID)
		_ = s.entRepo.SavePermissionsMatrix(orgID, matrix)
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Generate JWT
	expireDuration := s.cfg.JWT.ExpireDuration()
	claims := jwt.CustomClaims{
		UserID:         user.ID,
		Username:       user.Username,
		Role:           string(user.Role),
		EnterpriseID:   user.EnterpriseID,
		CurrentBrandID: user.CurrentBrandID,
	}

	token, _ := jwt.GenerateToken(s.cfg.JWT.Secret, expireDuration, claims)
	_ = redis.SetSessionToken(ctx, token, user.ID, expireDuration)

	return &domain.AuthResponse{
		Token:      token,
		User:       user,
		Enterprise: ent,
		Message:    "注册并登录成功",
	}, nil
}

func (s *AuthService) GetUserByID(id string) (*domain.User, error) {
	return s.userRepo.FindByID(id)
}

func (s *AuthService) UpdateProfile(userID string, req domain.UpdateProfileRequest) (*domain.User, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil || user == nil {
		return nil, errors.New("用户不存在")
	}

	if req.Nickname != "" {
		user.Nickname = req.Nickname
	}
	if req.AvatarURL != "" {
		user.AvatarURL = req.AvatarURL
	}
	if req.Phone != "" {
		user.Phone = req.Phone
	}
	if req.Bio != "" {
		user.Bio = req.Bio
	}
	if req.TeamName != "" {
		user.TeamName = req.TeamName
	}
	user.UpdatedAt = time.Now()

	if err := s.userRepo.Update(user); err != nil {
		return nil, err
	}
	return user, nil
}

func (s *AuthService) ChangePassword(userID string, req domain.ChangePasswordRequest) error {
	user, err := s.userRepo.FindByID(userID)
	if err != nil || user == nil {
		return errors.New("用户不存在")
	}

	if !password.VerifyPassword(req.OldPassword, user.Salt, user.PasswordHash) {
		return errors.New("原密码错误")
	}

	user.Salt = password.GenerateSalt(16)
	user.PasswordHash = password.HashPassword(req.NewPassword, user.Salt)
	user.UpdatedAt = time.Now()

	return s.userRepo.Update(user)
}

func (s *AuthService) GetUserCount() (int64, error) {
	return s.userRepo.Count()
}

func (s *AuthService) Logout(ctx context.Context, token string) error {
	return redis.DeleteSessionToken(ctx, token)
}

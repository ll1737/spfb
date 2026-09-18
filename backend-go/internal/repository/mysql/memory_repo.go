package mysql

import (
	"encoding/json"

	"gorm.io/gorm"
	"zhiyu-backend/internal/domain"
)

type MemoryRepository struct {
	db *gorm.DB
}

func NewMemoryRepository(db *gorm.DB) *MemoryRepository {
	return &MemoryRepository{db: db}
}

func (r *MemoryRepository) ListCategories(orgID string) ([]domain.MemoryCategory, error) {
	cats := make([]domain.MemoryCategory, 0)
	if orgID == "" {
		return cats, nil
	}
	err := r.db.Where("org_id = ?", orgID).Find(&cats).Error
	return cats, err
}

func (r *MemoryRepository) SaveCategory(cat *domain.MemoryCategory) error {
	return r.db.Save(cat).Error
}

func (r *MemoryRepository) DeleteCategory(orgID, id string) error {
	return r.db.Where("org_id = ? AND id = ?", orgID, id).Delete(&domain.MemoryCategory{}).Error
}

func (r *MemoryRepository) ListItems(orgID, brandID, categoryID string) ([]domain.MemoryItem, error) {
	items := make([]domain.MemoryItem, 0)
	if orgID == "" {
		return items, nil
	}
	query := r.db.Where("org_id = ?", orgID).Order("created_at DESC")
	if brandID != "" {
		query = query.Where("brand_id = ? OR brand_id = '' OR brand_id IS NULL", brandID)
	}
	if categoryID != "" {
		query = query.Where("category_id = ?", categoryID)
	}
	err := query.Find(&items).Error
	for i := range items {
		if items[i].TagsJSON != "" {
			_ = json.Unmarshal([]byte(items[i].TagsJSON), &items[i].Tags)
		}
	}
	return items, err
}

func (r *MemoryRepository) SaveItem(item *domain.MemoryItem) error {
	if len(item.Tags) > 0 {
		bytes, _ := json.Marshal(item.Tags)
		item.TagsJSON = string(bytes)
	}
	return r.db.Save(item).Error
}

func (r *MemoryRepository) DeleteItem(id string) error {
	return r.db.Where("id = ?", id).Delete(&domain.MemoryItem{}).Error
}

func (r *MemoryRepository) DeleteItemForOrg(orgID, id string) error {
	return r.db.Where("org_id = ? AND id = ?", orgID, id).Delete(&domain.MemoryItem{}).Error
}

func (r *MemoryRepository) ListCreators(orgID, brandID string) ([]domain.CreatorPersona, error) {
	list := make([]domain.CreatorPersona, 0)
	if orgID == "" {
		return list, nil
	}
	query := r.db.Where("org_id = ?", orgID).Order("created_at DESC")
	if brandID != "" {
		query = query.Where("brand_id = ? OR brand_id = '' OR brand_id IS NULL", brandID)
	}
	err := query.Find(&list).Error
	return list, err
}

func (r *MemoryRepository) SaveCreator(creator *domain.CreatorPersona) error {
	return r.db.Save(creator).Error
}

func (r *MemoryRepository) FindCreator(orgID, brandID, id string) (*domain.CreatorPersona, error) {
	creator := &domain.CreatorPersona{}
	query := r.db.Where("org_id = ? AND id = ?", orgID, id)
	if brandID != "" {
		query = query.Where("brand_id = ? OR brand_id = '' OR brand_id IS NULL", brandID)
	}
	if err := query.First(creator).Error; err != nil {
		return nil, err
	}
	return creator, nil
}

func (r *MemoryRepository) DeleteCreator(orgID, brandID, id string) error {
	query := r.db.Where("org_id = ? AND id = ?", orgID, id)
	if brandID != "" {
		query = query.Where("brand_id = ? OR brand_id = '' OR brand_id IS NULL", brandID)
	}
	return query.Delete(&domain.CreatorPersona{}).Error
}

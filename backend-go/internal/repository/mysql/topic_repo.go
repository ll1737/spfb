package mysql

import (
	"encoding/json"

	"gorm.io/gorm"
	"zhiyu-backend/internal/domain"
)

type TopicRepository struct {
	db *gorm.DB
}

func NewTopicRepository(db *gorm.DB) *TopicRepository {
	return &TopicRepository{db: db}
}

func (r *TopicRepository) List(orgID, brandID, status string) ([]domain.Topic, error) {
	rows := make([]domain.Topic, 0)
	query := r.db.Where("org_id = ?", orgID).Order("created_at DESC")
	if brandID != "" {
		query = query.Where("brand_id = ? OR brand_id = '' OR brand_id IS NULL", brandID)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if err := query.Find(&rows).Error; err != nil {
		return nil, err
	}
	for i := range rows {
		if rows[i].TagsJSON != "" {
			_ = json.Unmarshal([]byte(rows[i].TagsJSON), &rows[i].Tags)
		}
		if rows[i].AnglesJSON != "" {
			_ = json.Unmarshal([]byte(rows[i].AnglesJSON), &rows[i].Angles)
		}
	}
	return rows, nil
}

func (r *TopicRepository) Save(topic *domain.Topic) error {
	if len(topic.Tags) > 0 {
		encoded, _ := json.Marshal(topic.Tags)
		topic.TagsJSON = string(encoded)
	}
	if len(topic.Angles) > 0 {
		encoded, _ := json.Marshal(topic.Angles)
		topic.AnglesJSON = string(encoded)
	}
	return r.db.Save(topic).Error
}

func (r *TopicRepository) Delete(orgID, brandID, id string) error {
	query := r.db.Where("org_id = ? AND id = ?", orgID, id)
	if brandID != "" {
		query = query.Where("brand_id = ? OR brand_id = '' OR brand_id IS NULL", brandID)
	}
	return query.Delete(&domain.Topic{}).Error
}

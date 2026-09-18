package mysql

import (
	"encoding/json"
	"time"

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

func (r *TopicRepository) GetByID(orgID, brandID, id string) (*domain.Topic, error) {
	var topic domain.Topic
	query := r.db.Where("org_id = ? AND id = ?", orgID, id)
	if brandID != "" {
		query = query.Where("brand_id = ? OR brand_id = '' OR brand_id IS NULL", brandID)
	}
	if err := query.First(&topic).Error; err != nil {
		return nil, err
	}
	if topic.TagsJSON != "" {
		_ = json.Unmarshal([]byte(topic.TagsJSON), &topic.Tags)
	}
	if topic.AnglesJSON != "" {
		_ = json.Unmarshal([]byte(topic.AnglesJSON), &topic.Angles)
	}
	return &topic, nil
}

func (r *TopicRepository) Delete(orgID, brandID, id string) error {
	query := r.db.Where("org_id = ? AND id = ?", orgID, id)
	if brandID != "" {
		query = query.Where("brand_id = ? OR brand_id = '' OR brand_id IS NULL", brandID)
	}
	return query.Delete(&domain.Topic{}).Error
}

func (r *TopicRepository) GetPreferences(orgID, brandID string) (*domain.TopicPreference, error) {
	var pref domain.TopicPreference
	err := r.db.Where("org_id = ? AND brand_id = ?", orgID, brandID).First(&pref).Error
	if err != nil {
		return nil, err
	}
	if pref.PlatformsJSON != "" {
		_ = json.Unmarshal([]byte(pref.PlatformsJSON), &pref.Platforms)
	}
	return &pref, nil
}

func (r *TopicRepository) SavePreferences(pref *domain.TopicPreference) error {
	if len(pref.Platforms) > 0 {
		encoded, _ := json.Marshal(pref.Platforms)
		pref.PlatformsJSON = string(encoded)
	}
	pref.UpdatedAt = time.Now()
	return r.db.Save(pref).Error
}


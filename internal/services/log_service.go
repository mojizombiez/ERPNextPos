package services

import (
	"MWinPOS/internal/database"
	"MWinPOS/internal/models"
	"time"

	"gorm.io/gorm"
)

type LogService struct {
	db *gorm.DB
}

func NewLogService() *LogService {
	return &LogService{db: database.DB}
}

func (s *LogService) AddLog(passcode string, detail string) error {
	log := models.AppLog{
		StartDate: time.Now(),
		EndDate:   time.Now(),
		Passcode:  passcode,
		Detail:    detail,
	}
	result := s.db.Create(&log)
	return result.Error
}

func (s *LogService) GetLogs() ([]models.AppLog, error) {
	var logs []models.AppLog
	result := s.db.Find(&logs)
	return logs, result.Error
}

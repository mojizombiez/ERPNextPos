package models

import "time"

type AppLog struct {
	Id        int       `json:"id" gorm:"primaryKey"`
	StartDate time.Time `json:"startDate"`
	EndDate   time.Time `json:"endDate"`
	Passcode  string    `json:"passcode"`
	Detail    string    `json:"detail"`
}

type SyncLog struct {
	Id        int       `json:"id" gorm:"primaryKey"`
	Timestamp time.Time `json:"timestamp" gorm:"autoCreateTime"`
	Level     string    `json:"level"` // "ERROR", "INFO", "WARNING"
	Title     string    `json:"title"`
	Message   string    `json:"message"`
	OrderId   string    `json:"orderId,omitempty"` // Link to order UUID if applicable
}

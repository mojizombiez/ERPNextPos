package models

import (
	"time"
)

// Customer model for standalone and future sync
type Customer struct {
	Id                int       `json:"id" gorm:"primaryKey"`
	Name              string    `json:"customer_name" gorm:"column:customer_name;uniqueIndex"`
	Phone             string    `json:"mobile_no" gorm:"index;column:mobile_no"`
	LoyaltyPoints     float64   `json:"loyalty_points" gorm:"column:loyalty_points"`
	Email             string    `json:"email_id" gorm:"column:email_id"`
	Address           string    `json:"primary_address" gorm:"column:primary_address"`
	CreditLimit       float64   `json:"credit_limit" gorm:"column:credit_limit"`
	OutstandingAmount float64   `json:"outstanding_amount" gorm:"column:outstanding_amount"`
	IsSync            bool      `json:"isSync" gorm:"default:false"`
	ExternalId        string    `json:"name" gorm:"index;column:name"` // ID on the main server (ERPNext string ID)
	CreatedAt         time.Time `json:"createdAt"`
	UpdatedAt         time.Time `json:"updatedAt"`
}

type ERPNextCustomerResponse struct {
	Message []Customer `json:"message"`
}

// CashDrawer session
type CashDrawer struct {
	Id              int       `json:"id" gorm:"primaryKey"`
	StartTime       time.Time `json:"startTime"`
	EndTime         string    `json:"endTime"`
	StartBalance    float64   `json:"startBalance"`
	EndBalance      float64   `json:"endBalance"`
	ActualCash      float64   `json:"actualCash"` // Counted by staff at end
	StaffId         int       `json:"staffId"`
	StaffName       string    `json:"staffName"`
	PosOpeningEntry string    `json:"pos_opening_entry" gorm:"column:pos_opening_entry"`
	IsOpen          bool      `json:"isOpen" gorm:"default:true"`
	IsSync          bool      `json:"isSync" gorm:"default:false"`
}

// CashTransaction represents every in/out from the drawer
type CashTransaction struct {
	Id           int       `json:"id" gorm:"primaryKey"`
	CashDrawerId int       `json:"cashDrawerId" gorm:"index"`
	Type         string    `json:"type"` // "SALE", "REFUND", "PAY_IN", "PAY_OUT"
	Amount       float64   `json:"amount"`
	Description  string    `json:"description"`
	CreatedAt    time.Time `json:"createdAt"`
}

// Promotion/Campaign model
type Promotion struct {
	Id          int     `json:"id" gorm:"primaryKey"`
	Name        string  `json:"name"`
	Code        string  `json:"code" gorm:"index"`
	Description string  `json:"description"`
	Type        string  `json:"type"` // "B1G1", "PERCENT", "AMOUNT", "POINTS"
	Value       float64 `json:"value"`
	MinSpend    float64 `json:"minSpend"`
	StartDate   string  `json:"startDate"`
	EndDate     string  `json:"endDate"`
	IsActive    bool    `json:"isActive" gorm:"default:true"`
	IsSync      bool    `json:"isSync" gorm:"default:false"`
}

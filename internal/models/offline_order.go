package models

import "time"

type OfflineOrder struct {
	Id              int       `json:"id" gorm:"primaryKey"`
	JsonData        string    `json:"jsonData"` // Stores serialized CheckoutOrderModel
	Uuid            string    `json:"uuid"`     // Guid in C# -> string in Go
	IsSyncComplete  bool      `json:"isSyncComplete"`
	SyncError       string    `json:"syncError"` // Stores reason for failure
	CreateDate      time.Time `json:"createDate"`
	IsReFundOrder   *bool     `json:"isRefundOrder"`
	OriginalOrderId *int      `json:"originalOrderId"`
	CashDrawerId    int       `json:"cashDrawerId" gorm:"index"`
	TotalPrice      float64   `json:"totalPrice"`
}

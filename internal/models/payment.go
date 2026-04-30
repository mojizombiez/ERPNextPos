package models

type PaymentMethod struct {
	Id         int    `json:"id" gorm:"primaryKey"`
	Name       string `json:"name" gorm:"uniqueIndex"`
	Type       string `json:"type"` // "cash", "card", "promptpay", "other"
	IsActive   bool   `json:"isActive" gorm:"default:true"`
	QrTemplate string `json:"qrTemplate,omitempty"` // For dynamic QR (e.g., PromptPay)
}

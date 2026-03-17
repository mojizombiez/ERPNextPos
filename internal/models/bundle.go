package models

type BundleItem struct {
	Id             int     `json:"id" gorm:"primaryKey"`
	ParentItemCode string  `json:"parent_item_code" gorm:"index;column:parent_item_code"`
	ItemCode       string  `json:"item_code" gorm:"column:item_code"`
	ItemName       string  `json:"item_name" gorm:"column:item_name"`
	Description    string  `json:"description" gorm:"column:description"`
	Qty            float64 `json:"qty" gorm:"column:qty"`
}

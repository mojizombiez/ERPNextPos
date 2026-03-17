package models

type ProductCategory struct {
	Id    int    `json:"id" gorm:"primaryKey"`
	Name  string `json:"name"`
	Index int    `json:"index"`
	Type  int    `json:"type"`
}

type ProductCategoryMapping struct {
	ProductId  int `json:"productId" gorm:"primaryKey"`
	CategoryId int `json:"categoryId" gorm:"primaryKey"`
}

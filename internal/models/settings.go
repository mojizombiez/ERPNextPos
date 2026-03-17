package models

type PosSettings struct {
	Id        int    `json:"id" gorm:"primaryKey"`
	Name      string `json:"name" gorm:"uniqueIndex"`
	JsonValue string `json:"jsonValue"`
	Value     string `json:"value"`
	DataType  int    `json:"dataType"`
}

package models

type Product struct {
	Id                int         `json:"id" gorm:"primaryKey;autoIncrement:false"`   // Use DB ID or hash if necessary
	ItemCode          string      `json:"itemCode" gorm:"column:ip_code;uniqueIndex"` // Map to existing ip_code column
	Barcode           string      `json:"barcode"`
	NameTH            string      `json:"nameTH" gorm:"column:name_th"` // Map to existing name_th column
	HeaderText        string      `json:"headerText"`
	HeaderTextEn      string      `json:"headerTextEn"`
	ItemGroup         string      `json:"itemGroup" gorm:"column:item_group"`
	Remain            int         `json:"remain"`
	Price             *float64    `json:"price" gorm:"column:price"` // Map to existing price column
	DiscountByPercent *bool       `json:"discountByPercent"`
	Cost              *float64    `json:"cost"`
	ShowPrice         *float64    `json:"showPrice"`
	Description       string      `json:"description"`
	IsAvailable       *bool       `json:"isAvailable"`
	IsOnlineShopping  *bool       `json:"isOnlineShopping"`
	IsPosSale         *bool       `json:"isPosSale"`
	IsVat             *bool       `json:"isVat"`
	NameEN            string      `json:"nameEN"`
	ThumbnailImage    interface{} `json:"thumbnailImage" gorm:"-"`
	ProductPictureUrl string      `json:"-" gorm:"column:product_picture_url"` // from ERPNext image
	LocalImagePath    string      `json:"localImagePath"`
	IsBundle          bool        `json:"isBundle" gorm:"column:is_bundle;default:false"`

	// Relation to categories
	Categories []ProductCategoryMapping `json:"categories" gorm:"foreignKey:ProductId"`

	// Relation to bundle items
	BundleItems []BundleItem `json:"bundleItems" gorm:"foreignKey:ParentItemCode;references:ItemCode"`
}

type ProductSearchResult struct {
	Results []Product `json:"results"`
}

type ERPNextItemResponse struct {
	Message []Product `json:"message"`
}

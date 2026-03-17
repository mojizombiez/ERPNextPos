package models

type OrderCommonModel struct {
	Branch              BranchOptionViewModel         `json:"branch"`
	Provinces           []ProvinceViewModel           `json:"provinces"`
	Partners            []PartnerViewModel            `json:"partners"`
	PaymentStatuses     []PaymentStatusViewModel      `json:"paymentStatuses"`
	CommunicationMethod []CommunicationMethodModel    `json:"communicationMethod"`
	TransportationTypes []TransportationTypeViewModel `json:"transportationTypes"`
	ProductCategory     []ProductCategoryViewModel    `json:"productCategory"`
	Promotion           []PromotionViewModel          `json:"promotion"`
	OrderStatus         []OrderStatusModel            `json:"orderStatus"`
	DeliveryTypes       []DeliveryTypeViewModel       `json:"deliveryTypes"`
	DeliveryStatuses    []DeliveryStatusViewModel     `json:"deliveryStatuses"`
	PaymentGateway      []PaymentGatewayModel         `json:"paymentGateway"`
	GiftItem            []GiftItemViewModel           `json:"giftItem"`
	Branches            []BranchOptionViewModel       `json:"branches"`
	SalesChannels       []SalesChannelViewModel       `json:"salesChannels"`
	BackgroundUrl       string                        `json:"backgroundUrl"`
}

type BranchOptionViewModel struct {
	Id                       int     `json:"id"`
	Name                     string  `json:"name"`
	AddressLine1             string  `json:"addressLine1"`
	AddressLine2             string  `json:"addressLine2"`
	Phone                    string  `json:"phone"`
	CanUseKsher              bool    `json:"canUseKsher"`
	DefaultCashStart         float64 `json:"defaultCashStart"`
	TaxId                    string  `json:"taxId"`
	HeadOfficePhone          string  `json:"headOfficePhone"`
	BCode                    string  `json:"bCode"`
	CompanyName              string  `json:"companyName"`
	IsFastService            bool    `json:"isFastService"`
	PaymentCode              string  `json:"paymentCode"`
	LogoUrl                  string  `json:"logoUrl"`
	ShowPointQr              bool    `json:"showPointQr"`
	CanAccessPOSOrderHistory bool    `json:"canAccessPOSOrderHistory"`
}

type ProvinceViewModel struct {
	Name       string `json:"name"`
	ProvinceID int    `json:"provinceID"`
	Upcountry  bool   `json:"upcountry"`
}

type PartnerViewModel struct {
	Id   int    `json:"id"`
	Name string `json:"name"`
}

type PaymentStatusViewModel struct {
	Id   int    `json:"id"`
	Name string `json:"name"`
}

type CommunicationMethodModel struct {
	Id   int    `json:"id"`
	Name string `json:"name"`
}

type TransportationTypeViewModel struct {
	Id   int    `json:"id"`
	Name string `json:"name"`
}

type ProductCategoryViewModel struct {
	Id    int    `json:"id"`
	Name  string `json:"name"`
	Index int    `json:"index"`
	Type  int    `json:"type"`
}

type PromotionViewModel struct {
	Id                int                                     `json:"id"`
	Name              string                                  `json:"name"`
	Quantity          *int                                    `json:"quantity"`
	Priority          int                                     `json:"priority"`
	Price             int                                     `json:"price"`
	UpcountryPrice    int                                     `json:"upcountryPrice"`
	MinQuantity       *int                                    `json:"minQuantity"`
	MaxQuantity       *int                                    `json:"maxQuantity"`
	SkipCalPrice      bool                                    `json:"skipCalPrice"`
	DiscountByPercent bool                                    `json:"discountByPercent"`
	NoPoint           bool                                    `json:"noPoint"`
	MinimumPayment    *float64                                `json:"minimumPayment"`
	Condition         []PromotionRestrictionCategoryViewModel `json:"condition"`
}

type PromotionRestrictionCategoryViewModel struct {
	ProductCategoryId int   `json:"productCategoryId"`
	MinTotal          int   `json:"minTotal"`
	MaxTotal          int   `json:"maxTotal"`
	Require           []int `json:"require"`
}

type OrderStatusModel struct {
	Id   int    `json:"id"`
	Name string `json:"name"`
}

type DeliveryTypeViewModel struct {
	Id                   int    `json:"id"`
	Name                 string `json:"name"`
	TransportationTypeId int    `json:"transportationTypeId"`
}

type DeliveryStatusViewModel struct {
	Id   int    `json:"id"`
	Name string `json:"name"`
}

type PaymentGatewayModel struct {
	Id    int                   `json:"id"`
	Name  string                `json:"name"`
	Index int                   `json:"index"`
	Menu  []PaymentGatewayModel `json:"menu,omitempty"`
}

type GiftItemViewModel struct {
	Id   int    `json:"id"`
	Name string `json:"name"`
}

type SalesChannelViewModel struct {
	Id   int    `json:"id"`
	Name string `json:"name"`
}

type Staff struct {
	Id       int    `json:"id" gorm:"primaryKey"`
	Name     string `json:"name"`
	NickName string `json:"nickName"`
	PassCode string `json:"passCode"`
	Role     string `json:"role"` // "Cashier" or "Manager"
	IsActive bool   `json:"isActive"`
}

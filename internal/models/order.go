package models

import "time"

type CheckoutOrderModel struct {
	Id               *int                    `json:"id"`
	RunningNumber    string                  `json:"runningNumber"`
	SubOrder         []CheckoutSubOrderModel `json:"subOrder"`
	OrderDate        string                  `json:"orderDate"`
	DiscountPrice    float64                 `json:"discountPrice"`
	DeliveryPrice    float64                 `json:"deliveryPrice"`
	OrderPrice       float64                 `json:"orderPrice"`
	VatPrice         float64                 `json:"vatPrice"`
	TotalPrice       float64                 `json:"totalPrice"`
	CustomerPaid     float64                 `json:"customerPaid"`
	BranchId         string                  `json:"branchId"`
	Warehouse        string                  `json:"warehouse"`
	Company          string                  `json:"company"`
	OrderPoint       int                     `json:"orderPoint"`
	PaymentGatewayId int                     `json:"paymentGatewayId"`
	OrderUUID        string                  `json:"orderUUID"`
	PaymentLink      string                  `json:"paymentLink"`
	PaymentQrCode    string                  `json:"paymentQrCode"`
	PassCode         string                  `json:"passCode"`
	RefOrderId       int                     `json:"refOrderId"`
	PointCode        string                  `json:"pointCode"`
	Cashier          string                  `json:"cashier"`
	ClaimPhoneNo     string                  `json:"claimPhoneNo"`
	PaymentGateway   string                  `json:"paymentGateway"`
	OrderStatusId    int                     `json:"orderStatusId"`
	VoucherCodeId    *int                    `json:"voucherCodeId"`
	IsRefundOrder    *bool                   `json:"isRefundOrder"`
	CashDrawerId     *int                    `json:"cashDrawerId"`
	SalesChannelId   *int                    `json:"salesChannelId"`
	ReferenceNo      string                  `json:"referenceNo"`
	CouponCode       string                  `json:"couponCode"`
	ERPNextName      string                  `json:"erpnextName"` // Tracks ERPNext ID (e.g., ACC-SINV-...)
	Payments         []CheckoutPaymentModel  `json:"payments"`
	RedeemedPoints   int                     `json:"redeemedPoints"`
	RedeemedAmount   float64                 `json:"redeemedAmount"`
}

type CheckoutPaymentModel struct {
	Method    string  `json:"method"`
	Amount    float64 `json:"amount"`
	Account   string  `json:"account"` // Optional: specific account if mapped
	Reference string  `json:"reference,omitempty"`
}

type CheckoutOrderModelOffline struct {
	CheckoutOrderModel
	IsSyncComplete bool   `json:"isSyncComplete"`
	SyncError      string `json:"syncError"`
}

type OrderFilteringModel struct {
	FilterText          string `json:"filterText"`
	IsFilterProductName *bool  `json:"isFilterProductName"`
	OnlyUnsynced        bool   `json:"onlyUnsynced"`
}

type OrderPosSearchResultModelOffline struct {
	Results          []CheckoutOrderModelOffline `json:"results"`
	SumTotalPrice    float64                     `json:"sumTotalPrice"`
	SumOrderPrice    float64                     `json:"sumOrderPrice"`
	SumDeliveryPrice float64                     `json:"sumDeliveryPrice"`
	SumDiscountPrice float64                     `json:"sumDiscountPrice"`
}

type CheckoutSubOrderModel struct {
	Id            *int             `json:"id"`
	Category      string           `json:"category"`
	SuborderGroup string           `json:"suborderGroup"`
	CategoryName  string           `json:"categoryName"`
	PromotionId   int              `json:"promotionId"`
	Detail        []CheckoutDetail `json:"detail"`
}

type CheckoutDetail struct {
	Id            *int    `json:"id"`
	ProductId     int     `json:"productId"`
	ProductName   string  `json:"productName"`
	ItemCode      string  `json:"itemCode"`
	Quantity      int     `json:"quantity"`
	Price         float64 `json:"price"`
	Number        int     `json:"number"`
	IsGiftItem    bool    `json:"isGiftItem"`
	IsRefund      bool    `json:"isRefund"`
	IsReturnStock bool    `json:"isReturnStock"`
}

// ERPNext related structs for order sync
type ERPNextSalesInvoiceItem struct {
	ItemCode string  `json:"item_code"`
	Qty      int     `json:"qty"`
	Rate     float64 `json:"rate"`
}

type ERPNextSalesInvoicePayment struct {
	ModeOfPayment string  `json:"mode_of_payment"`
	Account       string  `json:"account,omitempty"`
	Amount        float64 `json:"amount"`
	ReferenceNo   string  `json:"reference_no,omitempty"`
}

type ERPNextSalesInvoiceTax struct {
	ChargeType  string  `json:"charge_type"`
	AccountHead string  `json:"account_head"`
	Description string  `json:"description,omitempty"`
	Rate        float64 `json:"rate"`
}

type ERPNextSalesInvoice struct {
	Customer            string                       `json:"customer"`
	Company             string                       `json:"company"`
	PostingDate         string                       `json:"posting_date"`
	PostingTime         string                       `json:"posting_time"`
	PosProfile          string                       `json:"pos_profile,omitempty"`
	CostCenter          string                       `json:"cost_center,omitempty"`
	IsPos               int                          `json:"is_pos"`
	UpdateStock         int                          `json:"update_stock"`
	SetWarehouse        string                       `json:"set_warehouse,omitempty"`
	Items               []ERPNextSalesInvoiceItem    `json:"items"`
	Payments            []ERPNextSalesInvoicePayment `json:"payments"`
	Taxes               []ERPNextSalesInvoiceTax     `json:"taxes,omitempty"`
	WriteOffAmount      float64                      `json:"write_off_amount,omitempty"`
	WriteOffAccount     string                       `json:"write_off_account,omitempty"`
	CouponCode          string                       `json:"coupon_code,omitempty"`
	LoyaltyAmount       float64                      `json:"loyalty_amount,omitempty"`
	LoyaltyPoints       int                          `json:"loyalty_points,omitempty"`
	RedeemLoyaltyPoints int                          `json:"redeem_loyalty_points,omitempty"`
}

// ToERPNextSalesInvoice converts the internal CheckoutOrderModel to ERPNext format
func (o *CheckoutOrderModel) ToERPNextSalesInvoice(posProfile string, costCenter string, taxes []ERPNextSalesInvoiceTax, writeOffAccount string) ERPNextSalesInvoice {
	customerName := o.ReferenceNo // We use ReferenceNo to store Customer Name in this POS
	if customerName == "" {
		customerName = "Walkin Customer" // default ERPNext standard
	}

	// Parse the order date for posting_date — fall back to today
	now := time.Now()
	postingDate := now.Format("2006-01-02")
	postingTime := now.Format("15:04:05")
	if o.OrderDate != "" {
		if t, err := time.Parse(time.RFC3339, o.OrderDate); err == nil {
			postingDate = t.Format("2006-01-02")
			postingTime = t.Format("15:04:05")
		}
	}

	invoice := ERPNextSalesInvoice{
		Customer:     customerName,
		Company:      o.Company,
		PostingDate:  postingDate,
		PostingTime:  postingTime,
		PosProfile:   posProfile,
		CostCenter:   costCenter,
		IsPos:        1,
		UpdateStock:  1,
		SetWarehouse: o.Warehouse,
		Items:        make([]ERPNextSalesInvoiceItem, 0),
		Payments:     make([]ERPNextSalesInvoicePayment, 0),
		Taxes:        taxes,
		CouponCode:   o.CouponCode,
	}

	if o.RedeemedPoints > 0 {
		invoice.LoyaltyPoints = o.RedeemedPoints
		invoice.LoyaltyAmount = o.RedeemedAmount
		invoice.RedeemLoyaltyPoints = 1 // Standard ERPNext trigger for redemption
	}

	for _, sub := range o.SubOrder {
		for _, det := range sub.Detail {
			itemCode := det.ItemCode
			if itemCode == "" {
				itemCode = det.ProductName
			}
			invoice.Items = append(invoice.Items, ERPNextSalesInvoiceItem{
				ItemCode: itemCode,
				Qty:      det.Quantity,
				Rate:     float64(det.Price),
			})
		}
	}

	if len(o.Payments) > 0 {
		for _, p := range o.Payments {
			invoice.Payments = append(invoice.Payments, ERPNextSalesInvoicePayment{
				ModeOfPayment: p.Method,
				Account:       p.Account,
				Amount:        p.Amount,
				ReferenceNo:   p.Reference,
			})
		}
	} else {
		// Fallback to legacy single payment field
		paymentMode := o.PaymentGateway
		if paymentMode == "" {
			paymentMode = "Cash"
		}
		invoice.Payments = append(invoice.Payments, ERPNextSalesInvoicePayment{
			ModeOfPayment: paymentMode,
			Account:       o.PassCode, // HACK: We repurposed PassCode to store Payment Account for manual fixes
			Amount:        o.CustomerPaid,
		})
	}

	// Auto write-off: absorb small rounding differences between payment total and order total
	// This is common in Thai VAT-inclusive pricing where server-side recalculation may differ slightly.
	if writeOffAccount != "" {
		totalPaid := 0.0
		for _, p := range invoice.Payments {
			totalPaid += p.Amount
		}
		diff := totalPaid - o.TotalPrice // positive = overpaid (change); negative = needs write-off
		const maxWriteOff = 5.0          // ≤5 THB is safe to write off automatically
		if diff < 0 && diff > -maxWriteOff {
			// Slight underpayment due to rounding — write off the deficit
			invoice.WriteOffAmount = -diff // ERPNext expects positive amount
			invoice.WriteOffAccount = writeOffAccount
		}
	}

	return invoice
}

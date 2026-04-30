package models

type ReportStats struct {
	TotalSales     float64            `json:"totalSales"`
	TotalProfit    float64            `json:"totalProfit"`
	OrderCount     int                `json:"orderCount"`
	YesterdaySales float64            `json:"yesterdaySales"`
	HourlySales    []float64          `json:"hourlySales"`
	DailySales     []DailyEntry       `json:"dailySales"`
	CategorySales  []CategoryEntry    `json:"categorySales"`
	PaymentSales   []PaymentEntry     `json:"paymentSales"`
	TopProducts    []ProductEntry     `json:"topProducts"`
}

type DailyEntry struct {
	Date  string  `json:"date"`
	Value float64 `json:"value"`
}

type CategoryEntry struct {
	Name  string  `json:"name"`
	Value float64 `json:"value"`
}

type PaymentEntry struct {
	Name  string  `json:"name"`
	Value float64 `json:"value"`
}

type ProductEntry struct {
	Name string `json:"name"`
	Qty  int    `json:"qty"`
}

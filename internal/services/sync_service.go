package services

import (
	"MoltoPos/internal/config"
	"MoltoPos/internal/database"
	"MoltoPos/internal/models"
	"encoding/json"
	"errors"
	"fmt"
	"sort"
	"strings"
	"time"

	"sync"

	"io"
	"os"
	"path/filepath"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

func (s *SyncService) debugLog(format string, a ...interface{}) {
	if s.setting.IsDebug() {
		if len(a) > 0 {
			s.debugLog(format, a...)
		} else {
			s.debugLog(format)
		}
	}
}

type SyncService struct {
	db            *gorm.DB
	api           *ApiService
	setting       *SettingService
	mu            sync.Mutex
	isSyncing     bool
	syncStatus    string
	lastSyncError string
}

func (s *SyncService) GetSyncStatus() (bool, string, string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.isSyncing, s.syncStatus, s.lastSyncError
}

func NewSyncService() *SyncService {
	ss := NewSettingService()
	// Ensure settings exist
	ss.ensureSetting(SettingWarehouse, "", DataTypeSTRING)
	ss.ensureSetting(SettingCompany, "", DataTypeSTRING)

	apiUrl := config.GetEnvWithDefault(config.EnvErpApiUrl, ss.GetString("ApiUrl"))
	username := config.GetEnvWithDefault(config.EnvErpApiKey, ss.GetString("UserName"))
	password := config.GetEnvWithDefault(config.EnvErpApiSecret, ss.GetString("Password"))

	api := NewApiService(apiUrl)
	api.SetCredentials(username, password)

	s := &SyncService{
		db:      database.DB,
		api:     api,
		setting: ss,
	}

	// Run data maintenance on start
	go s.DataMaintenance()

	// Update API debug state
	s.api.debug = ss.IsDebug()

	return s
}

func (s *SyncService) DataMaintenance() {
	s.CleanupDuplicates()
	s.FixExistingDates()
}

func (s *SyncService) CleanupDuplicates() error {
	s.debugLog("[MAINTENANCE] Cleaning up potential duplicates...")

	// 1. Products by item_code
	var productDuplicates []struct {
		IpCode string
		Count  int
	}
	s.db.Table("products").Select("ip_code, count(*) as count").Group("ip_code").Having("count > 1").Scan(&productDuplicates)

	for _, d := range productDuplicates {
		if d.IpCode == "" {
			continue
		}
		var first models.Product
		if err := s.db.Where("ip_code = ?", d.IpCode).Order("id asc").First(&first).Error; err == nil {
			s.db.Unscoped().Where("ip_code = ? AND id != ?", d.IpCode, first.Id).Delete(&models.Product{})
			s.debugLog("[MAINTENANCE] Cleaned duplicates for product: %s\n", d.IpCode)
		}
	}

	// 2. Customers by name
	var customerDuplicates []struct {
		CustomerName string
		Count        int
	}
	s.db.Table("customers").Select("customer_name, count(*) as count").Group("customer_name").Having("count > 1").Scan(&customerDuplicates)

	for _, d := range customerDuplicates {
		if d.CustomerName == "" {
			continue
		}
		var first models.Customer
		if err := s.db.Where("customer_name = ?", d.CustomerName).Order("id asc").First(&first).Error; err == nil {
			s.db.Unscoped().Where("customer_name = ? AND id != ?", d.CustomerName, first.Id).Delete(&models.Customer{})
			s.debugLog("[MAINTENANCE] Cleaned duplicates for customer: %s\n", d.CustomerName)
		}
	}
	return nil
}

func (s *SyncService) Login(username, password string) error {
	s.api.baseUrl = s.setting.GetString("ApiUrl") // Ensure URL is current
	s.api.SetCredentials(username, password)
	err := s.api.Login()
	if err != nil {
		return err
	}

	// Save credentials to local DB if login pass
	s.setting.SaveSetting("UserName", username, DataTypeSTRING)
	s.setting.SaveSetting("Password", password, DataTypeSTRING)
	return nil
}

func (s *SyncService) GetWarehouses() ([]map[string]string, error) {
	return s.api.GetWarehouses()
}

func (s *SyncService) GetCompanies() ([]map[string]string, error) {
	return s.api.GetCompanies()
}

func (s *SyncService) GetModeOfPayments() ([]map[string]string, error) {
	if s.setting.GetString(SettingAppMode) == "standalone" {
		cached := s.setting.GetString("Cached_ModeOfPayments")
		if cached != "" {
			var modes []map[string]string
			if err := json.Unmarshal([]byte(cached), &modes); err == nil {
				return modes, nil
			}
		}
	}

	modes, err := s.api.GetModeOfPayments()
	if err != nil {
		// Fallback to cache if API fails
		cached := s.setting.GetString("Cached_ModeOfPayments")
		if cached != "" {
			var modes []map[string]string
			if err := json.Unmarshal([]byte(cached), &modes); err == nil {
				s.debugLog("API failed, using cached Mode of Payments.")
				return modes, nil
			}
		}
		return nil, err
	}
	return modes, nil
}

func (s *SyncService) GetAccounts() ([]map[string]string, error) {
	return s.api.GetAccounts()
}

func (s *SyncService) ValidateCouponCode(code string) (map[string]interface{}, error) {
	return s.api.ValidateCouponCode(code)
}

func (s *SyncService) ValidateGiftCard(code string) (map[string]interface{}, error) {
	return s.api.ValidateGiftCard(code)
}

func (s *SyncService) SendReceipt(orderUUID, method, recipient string) error {
	var order models.OfflineOrder
	if err := s.db.Where("uuid = ?", orderUUID).First(&order).Error; err != nil {
		return fmt.Errorf("order not found: %s", orderUUID)
	}

	if !order.IsSyncComplete {
		// Try to sync it now so we have the ERPNext name
		if err := s.ManualSyncOrder(orderUUID); err != nil {
			return fmt.Errorf("order not synced to ERPNext and manual sync failed: %v", err)
		}
		// Reload order after manual sync
		if err := s.db.Where("uuid = ?", orderUUID).First(&order).Error; err != nil {
			return err
		}
	}

	if !order.IsSyncComplete {
		return fmt.Errorf("order is not yet synced to ERPNext. please wait a moment.")
	}

	var checkoutOrder models.CheckoutOrderModel
	if err := json.Unmarshal([]byte(order.JsonData), &checkoutOrder); err != nil {
		return fmt.Errorf("failed to parse order data: %v", err)
	}

	if checkoutOrder.ERPNextName == "" {
		return fmt.Errorf("ERPNext document ID not found for this order")
	}

	return s.api.SendReceipt(checkoutOrder.ERPNextName, method, recipient)
}

func (s *SyncService) GetPosProfiles() ([]string, error) {
	return s.api.GetPosProfiles()
}

func (s *SyncService) GetPriceLists() ([]string, error) {
	return s.api.GetPriceLists()
}

func (s *SyncService) GetPosProfileDetails(name string) (map[string]string, error) {
	details, err := s.api.GetPosProfileDetails(name)
	if err != nil {
		// Fallback to cached profile details for this profile if it's the current one
		currentProfile := s.setting.GetString(SettingPosProfile)
		if name == currentProfile {
			cachedWh := s.setting.GetString("Cached_Warehouse")
			cachedCo := s.setting.GetString("Cached_Company")
			if cachedWh != "" && cachedCo != "" {
				s.debugLog("API failed, using cached POS Profile details.")
				return map[string]string{
					"warehouse": cachedWh,
					"company":   cachedCo,
				}, nil
			}
		}
		return nil, err
	}
	return details, nil
}

func (s *SyncService) SyncAllData() error {
	s.mu.Lock()
	if s.isSyncing {
		s.mu.Unlock()
		return fmt.Errorf("sync already in progress")
	}
	s.isSyncing = true
	s.mu.Unlock()

	defer func() {
		s.mu.Lock()
		s.isSyncing = false
		s.syncStatus = ""
		s.mu.Unlock()
	}()

	if s.setting.GetString(SettingAppMode) == "standalone" {
		s.debugLog("Standalone mode: Skipping SyncAllData.")
		return nil
	}

	// Always refresh credentials before a sync in case they were updated in Settings
	s.api.baseUrl = config.GetEnvWithDefault(config.EnvErpApiUrl, s.setting.GetString("ApiUrl"))
	s.api.SetCredentials(
		config.GetEnvWithDefault(config.EnvErpApiKey, s.setting.GetString("UserName")),
		config.GetEnvWithDefault(config.EnvErpApiSecret, s.setting.GetString("Password")),
	)
	s.api.debug = s.setting.IsDebug()

	posProfile := s.setting.GetString(SettingPosProfile)
	s.debugLog("Starting SyncAllData for POS Profile: %s at %s\n", posProfile, time.Now().Format(time.RFC822))
	s.syncStatus = "Initializing sync..."
	s.lastSyncError = ""

	// 1. Sync Products
	err := s.SyncProductsOnly()
	if err != nil {
		s.debugLog("SyncAllData: Product sync error: %v\n", err)
	}

	// 2. Sync Customers
	err = s.SyncCustomersOnly()
	if err != nil {
		s.debugLog("SyncAllData: Customer sync error: %v\n", err)
	}

	// 3. Sync Offline Resources (Background)
	go s.SyncOfflineResources()

	s.debugLog("SyncAllData background tasks started.")
	return nil
}

func (s *SyncService) SyncProductsOnly() error {
	s.debugLog("Syncing Products...")
	s.mu.Lock()
	s.syncStatus = "Syncing products..."
	// Fetch products from ERPNext
	priceList := s.setting.GetString("Cached_PriceList")
	products, err := s.api.GetProducts(priceList)
	s.mu.Unlock() // Unlock after setting status and before potential early return
	if err != nil {
		s.LogSyncError("", "Product Sync Failed", err.Error())
		return err
	}

	s.debugLog("Received %d products from API. Saving to database...\n", len(products))

	err = s.db.Transaction(func(tx *gorm.DB) error {
		// Identify item codes from API to remove local items no longer in ERPNext
		apiItemCodes := make([]string, len(products))
		for i, p := range products {
			apiItemCodes[i] = p.ItemCode
		}
		if err := tx.Unscoped().Where("ip_code NOT IN ?", apiItemCodes).Delete(&models.Product{}).Error; err != nil {
			return err
		}

		// Find current max ID for new entries
		var maxId int
		tx.Model(&models.Product{}).Select("IFNULL(MAX(id), 0)").Scan(&maxId)

		for i, product := range products {
			var existing models.Product
			// Match by unique ItemCode
			if err := tx.Where("ip_code = ?", product.ItemCode).First(&existing).Error; err == nil {
				// Update existing
				product.Id = existing.Id
				product.ProductPictureUrl = existing.ProductPictureUrl
				product.LocalImagePath = existing.LocalImagePath
			} else {
				// New item
				maxId++
				product.Id = maxId
			}
			products[i] = product
			if err := tx.Save(&product).Error; err != nil {
				return err
			}
		}
		return nil
	})

	if err != nil {
		s.debugLog("Failed to sync products: %v\n", err)
		return err
	}

	// 2. Sync Product Bundles
	s.debugLog("Syncing Product Bundles...")
	bundles, bErr := s.api.GetProductBundles()
	if bErr != nil {
		s.debugLog("Product Bundle Sync Failed: %v\n", bErr)
		s.LogSyncError("", "Bundle Sync Failed", bErr.Error())
	} else {
		err = s.db.Transaction(func(tx *gorm.DB) error {
			// Clear all old bundle items
			if err := tx.Session(&gorm.Session{AllowGlobalUpdate: true}).Unscoped().Where("1 = 1").Delete(&models.BundleItem{}).Error; err != nil {
				return err
			}

			// Reset IsBundle flag for all products first
			if err := tx.Model(&models.Product{}).Session(&gorm.Session{AllowGlobalUpdate: true}).Update("is_bundle", false).Error; err != nil {
				return err
			}

			// Save new bundle items and mark parents
			for parentCode, items := range bundles {
				// Mark parent as bundle
				tx.Model(&models.Product{}).Where("ip_code = ?", parentCode).Update("is_bundle", true)

				// Save children
				for _, item := range items {
					if err := tx.Create(&item).Error; err != nil {
						return err
					}
				}
			}
			return nil
		})
		if err != nil {
			s.debugLog("Failed to save product bundles to DB: %v\n", err)
		} else {
			s.debugLog("Synced %d product bundles.\n", len(bundles))
		}
	}

	s.debugLog("Products synced successfully.")
	go s.downloadImages(products)
	return nil
}

func (s *SyncService) SyncCustomersOnly() error {
	s.debugLog("Syncing Customers...")
	s.mu.Lock()
	s.syncStatus = "Syncing customers..."
	s.mu.Unlock()

	customers, err := s.api.GetCustomers()
	if err != nil {
		s.LogSyncError("", "Customer Sync Failed", err.Error())
		return err
	}

	s.debugLog("Received %d customers. Saving...\n", len(customers))
	return s.db.Transaction(func(tx *gorm.DB) error {
		for _, c := range customers {
			var existing models.Customer
			if err := tx.Where("customer_name = ?", c.Name).First(&existing).Error; err == nil {
				c.Id = existing.Id
			}
			if err := tx.Save(&c).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (s *SyncService) AddOrder(order models.CheckoutOrderModel) (string, error) {
	guid := uuid.New().String()
	order.OrderUUID = guid
	order.OrderDate = time.Now().UTC().Format(time.RFC3339)
	order.RunningNumber = fmt.Sprintf("%d", s.setting.GetRunningNumber())

	jsonData, err := json.Marshal(order)
	if err != nil {
		return "", err
	}

	// Set Drawer ID if not present
	if order.CashDrawerId == nil || *order.CashDrawerId == 0 {
		if currentDrawer, err := s.GetCurrentDrawer(); err == nil && currentDrawer != nil {
			order.CashDrawerId = &currentDrawer.Id
		}
	}

	newOrder := models.OfflineOrder{
		JsonData:       string(jsonData),
		Uuid:           guid,
		IsSyncComplete: false,
		CreateDate:     time.Now().UTC(),
		IsReFundOrder:  order.IsRefundOrder,
		CashDrawerId:   0,
		TotalPrice:     order.TotalPrice,
	}

	if order.CashDrawerId != nil {
		newOrder.CashDrawerId = *order.CashDrawerId
	}

	if err := s.db.Create(&newOrder).Error; err != nil {
		return "", err
	}

	// Only sync immediately if sync is enabled
	if s.setting.GetBool(SettingRequireSync) && s.setting.GetString(SettingAppMode) != "standalone" {
		go s.SyncOrders() // Try to sync in background
	}
	return guid, nil
}

func (s *SyncService) GetUnsyncedOrderCount() (int64, error) {
	var count int64
	err := s.db.Model(&models.OfflineOrder{}).Where("is_sync_complete = ?", false).Count(&count).Error
	return count, err
}

func (s *SyncService) StartBackgroundSync() {
	go func() {
		for {
			interval := s.setting.GetInt(SettingSyncIntervalSeconds)
			if interval <= 0 {
				interval = 5 // Default fallback
			}

			time.Sleep(time.Duration(interval) * time.Second)

			if s.setting.GetString(SettingAppMode) == "standalone" {
				continue
			}

			if s.setting.GetBool(SettingRequireSync) {
				s.debugLog("Background Sync Triggered...")
				s.SyncOrders()
			}
		}
	}()
}

func (s *SyncService) SyncOrders() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Check connectivity first
	if !s.api.IsOnline() {
		s.debugLog("Offline mode: Skipping order sync.")
		return nil
	}
	s.api.debug = s.setting.IsDebug()

	batchSize := s.setting.GetInt(SettingSyncBatchSize)
	if batchSize <= 0 {
		batchSize = 5
	}

	var orders []models.OfflineOrder
	s.db.Where("is_sync_complete = ?", false).Order("create_date asc").Limit(batchSize).Find(&orders)

	if len(orders) > 0 {
		// Ensure Walkin Customer exists before syncing orders that might need it
		if err := s.api.EnsureWalkinCustomerExists(); err != nil {
			s.debugLog("Warning: Could not ensure Walkin Customer exists: %v\n", err)
			s.LogSyncError("", "Walkin Customer Creation Failed", err.Error())
			// Continue anyway, it might already exist but we failed to verify
		}
	}

	// Get Payment Account Mapping from cache
	paymentMappingJson := s.setting.GetString("Cached_PosProfilePayments")
	var accountMap map[string]string
	if paymentMappingJson != "" {
		var mappings []struct {
			ModeOfPayment  string `json:"mode_of_payment"`
			DefaultAccount string `json:"default_account"`
		}
		if err := json.Unmarshal([]byte(paymentMappingJson), &mappings); err == nil {
			accountMap = make(map[string]string)
			for _, m := range mappings {
				accountMap[m.ModeOfPayment] = m.DefaultAccount
			}
		}
	}

	// Get Tax Template from cache
	taxJson := s.setting.GetString("Cached_PosProfileTaxes")
	var taxes []models.ERPNextSalesInvoiceTax
	if taxJson != "" {
		json.Unmarshal([]byte(taxJson), &taxes)
	}

	for _, order := range orders {
		var checkoutOrder models.CheckoutOrderModel
		json.Unmarshal([]byte(order.JsonData), &checkoutOrder)

		// Enrich payments with accounts if missing
		if len(checkoutOrder.Payments) > 0 {
			for i, p := range checkoutOrder.Payments {
				if p.Account == "" && accountMap != nil {
					if acc, ok := accountMap[p.Method]; ok {
						checkoutOrder.Payments[i].Account = acc
					}
				}
			}
		} else {
			// Legacy fallback: ensure the single payment has an account if possible
			if checkoutOrder.PassCode == "" && accountMap != nil {
				method := checkoutOrder.PaymentGateway
				if method == "" {
					method = "Cash"
				}
				if acc, ok := accountMap[method]; ok {
					checkoutOrder.PassCode = acc
				}
			}
		}

		posProfile := s.setting.GetString(SettingPosProfile)
		costCenter := s.setting.GetString("CostCenter")
		writeOffAccount := s.setting.GetString(SettingWriteOffAccount)
		res, err := s.api.CreateNewOrderDetail(checkoutOrder, posProfile, costCenter, taxes, writeOffAccount)
		if err == nil {
			if res != nil {
				jsonRes, _ := json.Marshal(res)
				order.JsonData = string(jsonRes)
			}
			order.IsSyncComplete = true
			order.SyncError = ""
			s.db.Save(&order)
		} else {
			s.debugLog("Failed to sync order %s: %v\n", order.Uuid, err)
			s.LogSyncError(order.Uuid, "Order Sync Failed", err.Error())
			order.SyncError = err.Error()
			s.db.Save(&order)
		}
	}
	return nil
}

func (s *SyncService) UpdateOrderMetadata(uuid string, warehouse string, company string, customer string, paymentsJson string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	var order models.OfflineOrder
	if err := s.db.Where("uuid = ?", uuid).First(&order).Error; err != nil {
		return err
	}

	var checkoutOrder models.CheckoutOrderModel
	if err := json.Unmarshal([]byte(order.JsonData), &checkoutOrder); err != nil {
		return err
	}

	// Update with provided values OR LATEST settings
	if warehouse != "" {
		checkoutOrder.Warehouse = warehouse
	}

	if company != "" {
		checkoutOrder.Company = company
	}

	if customer != "" {
		checkoutOrder.ReferenceNo = customer // We use ReferenceNo for Customer Name
	}

	// Update Payments if provided
	if paymentsJson != "" {
		var newPayments []models.CheckoutPaymentModel
		if err := json.Unmarshal([]byte(paymentsJson), &newPayments); err == nil {
			checkoutOrder.Payments = newPayments
			// Also update legacy fields for backward compatibility/fallback
			if len(newPayments) > 0 {
				checkoutOrder.PaymentGateway = newPayments[0].Method
				checkoutOrder.PassCode = newPayments[0].Account
			}
		}
	}

	// Enrich with ItemCode for legacy orders if missing
	for i, sub := range checkoutOrder.SubOrder {
		for j, det := range sub.Detail {
			if det.ItemCode == "" && det.ProductId > 0 {
				var p models.Product
				if err := s.db.First(&p, det.ProductId).Error; err == nil {
					checkoutOrder.SubOrder[i].Detail[j].ItemCode = p.ItemCode
				}
			}
		}
	}

	newData, _ := json.Marshal(checkoutOrder)
	order.JsonData = string(newData)
	order.SyncError = "" // Clear error as we are "fixing" it

	return s.db.Save(&order).Error
}

func (s *SyncService) ManualSyncOrder(uuid string) error {
	var order models.OfflineOrder
	if err := s.db.Where("uuid = ?", uuid).First(&order).Error; err != nil {
		return err
	}

	if order.IsSyncComplete {
		return fmt.Errorf("order already synced")
	}

	var checkoutOrder models.CheckoutOrderModel
	if err := json.Unmarshal([]byte(order.JsonData), &checkoutOrder); err != nil {
		return err
	}

	posProfile := s.setting.GetString(SettingPosProfile)
	costCenter := s.setting.GetString("CostCenter")
	taxJson := s.setting.GetString("Cached_PosProfileTaxes")
	var taxes []models.ERPNextSalesInvoiceTax
	if taxJson != "" {
		json.Unmarshal([]byte(taxJson), &taxes)
	}
	writeOffAccount := s.setting.GetString(SettingWriteOffAccount)
	res, err := s.api.CreateNewOrderDetail(checkoutOrder, posProfile, costCenter, taxes, writeOffAccount)
	s.mu.Lock()
	defer s.mu.Unlock()

	// Reload in case it changed
	s.db.Where("uuid = ?", uuid).First(&order)

	if err == nil {
		if res != nil {
			jsonRes, _ := json.Marshal(res)
			order.JsonData = string(jsonRes)
		}
		order.IsSyncComplete = true
		order.SyncError = ""
		s.db.Save(&order)
		return nil
	} else {
		s.LogSyncError(uuid, "Manual Sync Failed", err.Error())
		order.SyncError = err.Error()
		s.db.Save(&order)
		return err
	}
}

func (s *SyncService) GetStockLevel(itemCode string) (float64, error) {
	warehouse := s.setting.GetString(SettingWarehouse)

	// Check if this product is a bundle
	var product models.Product
	if err := s.db.Preload("BundleItems").Where("ip_code = ?", itemCode).First(&product).Error; err == nil {
		if product.IsBundle && len(product.BundleItems) > 0 {
			// It's a bundle, we need to check stock for EACH component and find the bottleneck
			minBundles := -1.0
			for _, item := range product.BundleItems {
				childStock, err := s.api.GetStockLevel(item.ItemCode, warehouse)
				if err != nil {
					return 0, fmt.Errorf("failed to check component stock (%s): %v", item.ItemCode, err)
				}

				if item.Qty > 0 {
					possible := childStock / item.Qty
					if minBundles < 0 || possible < minBundles {
						minBundles = possible
					}
				}
			}

			// If no components had Qty > 0 (unlikely), return 0
			if minBundles < 0 {
				return 0, nil
			}
			return minBundles, nil
		}
	}

	return s.api.GetStockLevel(itemCode, warehouse)
}



func (s *SyncService) GetProducts(priceList string) ([]models.Product, error) {
	return s.api.GetProducts(priceList)
}

func (s *SyncService) GetCustomerBalance(customerName string) (float64, float64, error) {
	return s.api.GetCustomerBalance(customerName)
}

func (s *SyncService) LoadProducts() ([]models.Product, error) {
	var products []models.Product
	result := s.db.Preload("Categories").Preload("BundleItems").Find(&products)
	return products, result.Error
}

func (s *SyncService) GetCategories() ([]models.ProductCategory, error) {
	var categories []models.ProductCategory
	err := s.db.Find(&categories).Error
	return categories, err
}

func (s *SyncService) AddCategory(name string) error {
	category := models.ProductCategory{
		Name: name,
	}
	return s.db.Create(&category).Error
}

func (s *SyncService) DeleteCategory(id int) error {
	return s.db.Delete(&models.ProductCategory{}, id).Error
}

func (s *SyncService) GetDashboardStats() (map[string]interface{}, error) {
	now := time.Now()
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location()).UTC()
	yesterdayStart := todayStart.AddDate(0, 0, -1)

	var ordersToday []models.OfflineOrder
	var ordersYesterday []models.OfflineOrder

	s.db.Where("create_date >= ?", todayStart).Find(&ordersToday)
	s.db.Where("create_date >= ? AND create_date < ?", yesterdayStart, todayStart).Find(&ordersYesterday)

	// Pre-load product costs
	var products []models.Product
	s.db.Find(&products)
	costs := make(map[int]float64)
	for _, p := range products {
		if p.Cost != nil {
			costs[p.Id] = *p.Cost
		}
	}

	todaySales := 0.0
	todayProfit := 0.0
	yesterdaySales := 0.0

	hourlySales := make([]float64, 24)
	categorySales := make(map[string]float64)
	productSales := make(map[string]int)

	for _, o := range ordersToday {
		var od models.CheckoutOrderModel
		if err := json.Unmarshal([]byte(o.JsonData), &od); err != nil {
			continue
		}
		todaySales += od.TotalPrice

		// Hourly distribution (using local time for the chart)
		createDateObj := o.CreateDate
		localTime := createDateObj.In(now.Location())
		hourlySales[localTime.Hour()] += od.TotalPrice

		for _, sub := range od.SubOrder {
			catName := sub.CategoryName
			if catName == "" {
				catName = "Other"
			}
			for _, det := range sub.Detail {
				// Category aggregation
				categorySales[catName] += det.Price * float64(det.Quantity)

				// Product aggregation
				productSales[det.ProductName] += det.Quantity

				// Profit calculation
				todayProfit += (det.Price - costs[det.ProductId]) * float64(det.Quantity)
			}
		}
	}

	for _, o := range ordersYesterday {
		var od models.CheckoutOrderModel
		if err := json.Unmarshal([]byte(o.JsonData), &od); err == nil {
			yesterdaySales += od.TotalPrice
		}
	}

	// Format category sales for frontend
	type Entry struct {
		Name  string  `json:"name"`
		Value float64 `json:"value"`
	}
	var cats []Entry
	for k, v := range categorySales {
		cats = append(cats, Entry{Name: k, Value: v})
	}

	// Format top products
	type ProdEntry struct {
		Name string `json:"name"`
		Qty  int    `json:"qty"`
	}
	var topProds []ProdEntry
	for k, v := range productSales {
		topProds = append(topProds, ProdEntry{Name: k, Qty: v})
	}
	// Sort topProds descending by Qty
	sort.Slice(topProds, func(i, j int) bool {
		return topProds[i].Qty > topProds[j].Qty
	})
	if len(topProds) > 5 {
		topProds = topProds[:5]
	}

	return map[string]interface{}{
		"totalSales":     todaySales,
		"totalProfit":    todayProfit,
		"orderCount":     len(ordersToday),
		"yesterdaySales": yesterdaySales,
		"hourlySales":    hourlySales,
		"categorySales":  cats,
		"topProducts":    topProds,
	}, nil
}

func (s *SyncService) GetDatabaseStats() (map[string]interface{}, error) {
	var productCount int64
	var customerCount int64
	var orderCount int64
	var categoryCount int64
	var logCount int64

	s.db.Model(&models.Product{}).Count(&productCount)
	s.db.Model(&models.Customer{}).Count(&customerCount)
	s.db.Model(&models.OfflineOrder{}).Count(&orderCount)
	s.db.Model(&models.ProductCategory{}).Count(&categoryCount)
	s.db.Model(&models.SyncLog{}).Count(&logCount)

	return map[string]interface{}{
		"products":   productCount,
		"customers":  customerCount,
		"orders":     orderCount,
		"categories": categoryCount,
		"logs":       logCount,
	}, nil
}

func (s *SyncService) GetOrders(fromDate, toDate time.Time, filter models.OrderFilteringModel) (*models.OrderPosSearchResultModelOffline, error) {
	s.debugLog("DEBUG GetOrders: Range [%v] to [%v], Filter: '%s'\n", fromDate, toDate, filter.FilterText)
	var orders []models.OfflineOrder
	query := s.db.Where("create_date >= ? AND create_date < ?", fromDate, toDate)
	query.Find(&orders)
	s.debugLog("DEBUG GetOrders: Found %d raw orders in DB\n", len(orders))

	var results models.OrderPosSearchResultModelOffline
	var filtered []models.CheckoutOrderModelOffline

	for _, o := range orders {
		// Filter by sync status if requested
		if filter.OnlyUnsynced && o.IsSyncComplete {
			continue
		}

		var co models.CheckoutOrderModel
		json.Unmarshal([]byte(o.JsonData), &co)

		// Filter
		match := true
		if filter.FilterText != "" {
			if filter.IsFilterProductName != nil && *filter.IsFilterProductName {
				// Check product names
				match = false
				for _, sub := range co.SubOrder {
					for _, d := range sub.Detail {
						if strings.Contains(strings.ToLower(d.ProductName), strings.ToLower(filter.FilterText)) {
							match = true
							break
						}
					}
					if match {
						break
					}
				}
			} else {
				// Check Order ID or Running Number
				idStr := ""
				if co.Id != nil {
					idStr = fmt.Sprintf("%d", *co.Id)
				}
				if !strings.Contains(strings.ToLower(co.RunningNumber), strings.ToLower(filter.FilterText)) &&
					!strings.Contains(strings.ToLower(idStr), strings.ToLower(filter.FilterText)) {
					match = false
				}
			}
		}

		if match {
			offline := models.CheckoutOrderModelOffline{
				CheckoutOrderModel: co,
				IsSyncComplete:     o.IsSyncComplete,
				SyncError:          o.SyncError,
			}
			filtered = append(filtered, offline)
			results.SumTotalPrice += co.TotalPrice
			results.SumOrderPrice += co.OrderPrice
			results.SumDiscountPrice += co.DiscountPrice
			results.SumDeliveryPrice += co.DeliveryPrice
		}
	}

	results.Results = filtered
	return &results, nil
}

func (s *SyncService) AddRefundOrder(order models.CheckoutOrderModel, refId int) (string, error) {
	order.IsRefundOrder = new(bool)
	*order.IsRefundOrder = true
	order.RefOrderId = refId
	order.TotalPrice = -order.TotalPrice
	order.OrderPrice = -order.OrderPrice
	order.Id = nil // New entry
	return s.AddOrder(order)
}

func (s *SyncService) CheckApiConnection(url string) error {
	return s.api.CheckConnection(url)
}

func (s *SyncService) SaveProduct(p models.Product) error {
	return s.db.Save(&p).Error
}

func (s *SyncService) DeleteProduct(id int) error {
	return s.db.Delete(&models.Product{}, id).Error
}

func (s *SyncService) UpdateProductAvailability(itemCode string, isAvailable bool) error {
	return s.db.Model(&models.Product{}).Where("ip_code = ?", itemCode).Update("is_available", isAvailable).Error
}

func (s *SyncService) GetStaffs() ([]models.Staff, error) {
	var staffs []models.Staff
	err := s.db.Find(&staffs).Error
	return staffs, err
}

func (s *SyncService) SaveStaff(staff models.Staff) error {
	return s.db.Save(&staff).Error
}

func (s *SyncService) DeleteStaff(id int) error {
	return s.db.Delete(&models.Staff{}, id).Error
}

// --- Customer Methods ---

func (s *SyncService) GetCustomers() ([]models.Customer, error) {
	var customers []models.Customer
	err := s.db.Order("name asc").Find(&customers).Error
	return customers, err
}

func (s *SyncService) GetCustomersMap() ([]map[string]string, error) {
	return s.api.GetCustomersMap()
}

func (s *SyncService) SaveCustomer(customer models.Customer) error {
	if customer.CreatedAt.IsZero() {
		customer.CreatedAt = time.Now()
	}
	customer.UpdatedAt = time.Now()
	return s.db.Save(&customer).Error
}

func (s *SyncService) DeleteCustomer(id int) error {
	return s.db.Delete(&models.Customer{}, id).Error
}

// --- Cash Drawer Methods ---

func (s *SyncService) GetCurrentDrawer() (*models.CashDrawer, error) {
	var drawer models.CashDrawer
	err := s.db.Where("is_open = ?", true).Order("start_time desc").First(&drawer).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &drawer, nil
}

func (s *SyncService) OpenDrawer(startBalance float64, staffId int, staffName string) error {
	// Close any previously open drawers just in case
	s.db.Model(&models.CashDrawer{}).Where("is_open = ?", true).Updates(map[string]interface{}{
		"is_open":  false,
		"end_time": time.Now(),
	})

	openingEntry := ""
	profile := s.setting.GetString(SettingPosProfile)
	if profile != "" && s.api.IsOnline() {
		s.debugLog("POS Integration: Creating Opening Entry for Profile: %s\n", profile)
		entry, err := s.api.CreatePosOpeningEntry(profile, startBalance)
		if err == nil {
			openingEntry = entry
			s.debugLog("POS Integration: Created Opening Entry: %s\n", openingEntry)
		} else {
			s.debugLog("POS Integration: Warning: Failed to create opening entry: %v\n", err)
		}
	}

	drawer := models.CashDrawer{
		StartTime:       time.Now(),
		StartBalance:    startBalance,
		StaffId:         staffId,
		StaffName:       staffName,
		PosOpeningEntry: openingEntry,
		IsOpen:          true,
	}
	return s.db.Create(&drawer).Error
}

func (s *SyncService) CloseDrawer(drawerId int, actualCash float64, endBalance float64) error {
	now := time.Now()

	var drawer models.CashDrawer
	if err := s.db.First(&drawer, drawerId).Error; err == nil {
		if drawer.PosOpeningEntry != "" && s.api.IsOnline() {
			s.debugLog("POS Integration: Creating Closing Entry for Opening Entry: %s\n", drawer.PosOpeningEntry)
			err := s.api.CreatePosClosingEntry(drawer.PosOpeningEntry, actualCash)
			if err != nil {
				s.debugLog("POS Integration: Warning: Failed to create closing entry: %v\n", err)
			} else {
				s.debugLog("POS Integration: Successfully created closing entry\n")
			}
		}
	}

	return s.db.Model(&models.CashDrawer{}).Where("id = ?", drawerId).Updates(map[string]interface{}{
		"is_open":     false,
		"end_time":    &now,
		"actual_cash": actualCash,
		"end_balance": endBalance,
	}).Error
}

func (s *SyncService) GetDrawerStats(drawerId int) (map[string]interface{}, error) {
	var results struct {
		TotalSales float64
		OrderCount int64
	}

	// Calculate total sales (excluding refunds for now, or including if they are negative)
	// Actually, let's just sum all TotalPrice for this drawer
	err := s.db.Model(&models.OfflineOrder{}).
		Where("cash_drawer_id = ?", drawerId).
		Select("COALESCE(SUM(total_price), 0) as total_sales, COUNT(*) as order_count").
		Scan(&results).Error

	return map[string]interface{}{
		"totalSales": results.TotalSales,
		"orderCount": results.OrderCount,
	}, err
}

// --- Promotion Methods ---

func (s *SyncService) GetPromotions() ([]models.Promotion, error) {
	var promotions []models.Promotion
	err := s.db.Where("is_active = ?", true).Find(&promotions).Error
	return promotions, err
}

func (s *SyncService) SavePromotion(promo models.Promotion) error {
	return s.db.Save(&promo).Error
}

func (s *SyncService) GetStaffByPasscode(passcode string) (*models.Staff, error) {
	var staff models.Staff
	err := s.db.Where("pass_code = ? AND is_active = ?", passcode, true).First(&staff).Error
	if err != nil {
		return nil, err
	}
	return &staff, nil
}

func (s *SyncService) GetNetworkPing() (int64, error) {
	// Ensure API URL is current
	apiUrl := s.setting.GetString(SettingApiUrl)
	if apiUrl != "" {
		s.api.SetBaseUrl(apiUrl)
	}

	return s.api.GetNetworkPing()
}

func (s *SyncService) downloadImages(products []models.Product) {
	appDataDir := os.Getenv("APPDATA")
	logPath := filepath.Join(appDataDir, "MoltoPos", "sync_log.txt")

	logFile, err := os.OpenFile(logPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		s.debugLog("Failed to open sync log file: %v\n", err)
		return
	}
	defer logFile.Close()

	logger := io.MultiWriter(os.Stdout, logFile)
	fmt.Fprintf(logger, "\n--- Starting Image Download for %d products at %s ---\n", len(products), time.Now().Format(time.RFC3339))

	imgFolder := filepath.Join(appDataDir, "MoltoPos", "images")
	if _, err := os.Stat(imgFolder); os.IsNotExist(err) {
		os.MkdirAll(imgFolder, 0755)
	}

	total := len(products)
	processed := 0

	// Use a buffered channel for tasks
	type task struct {
		p models.Product
	}
	taskChan := make(chan task, total)
	for _, p := range products {
		taskChan <- task{p: p}
	}
	close(taskChan)

	// Worker pool
	var wg sync.WaitGroup
	numWorkers := 5
	for i := 0; i < numWorkers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for t := range taskChan {
				p := t.p
				if p.ThumbnailImage == nil {
					s.mu.Lock()
					processed++
					s.syncStatus = fmt.Sprintf("Downloading images (%d/%d)", processed, total)
					s.mu.Unlock()
					continue
				}

				var imgUrl string
				if val, ok := p.ThumbnailImage.(map[string]interface{}); ok {
					for _, key := range []string{"url", "path", "fileName", "fullUrl"} {
						if v, ok := val[key].(string); ok && v != "" {
							imgUrl = v
							break
						}
					}
				} else if valStr, ok := p.ThumbnailImage.(string); ok {
					imgUrl = valStr
				}

				if imgUrl == "" {
					s.mu.Lock()
					processed++
					s.syncStatus = fmt.Sprintf("Downloading images (%d/%d)", processed, total)
					s.mu.Unlock()
					continue
				}

				// Save the raw URL to the DB field if it changed
				s.db.Model(&models.Product{}).Where("id = ?", p.Id).Update("product_picture_url", imgUrl)

				originalFileName := filepath.Base(imgUrl)
				originalFileName = strings.Split(originalFileName, "?")[0]

				localName := fmt.Sprintf("prod_%d_%s", p.Id, originalFileName)
				localPath := filepath.Join(imgFolder, localName)

				// Cleanup old images for this product
				files, _ := filepath.Glob(filepath.Join(imgFolder, fmt.Sprintf("prod_%d_*", p.Id)))
				for _, f := range files {
					if filepath.Base(f) != localName {
						os.Remove(f)
					}
				}

				downloadSuccess := false
				if _, err := os.Stat(localPath); os.IsNotExist(err) {
					data, err := s.api.DownloadFile(imgUrl)
					if err != nil {
						fmt.Fprintf(logger, "[ERROR] Product %d download failed: %v\n", p.Id, err)
					} else {
						if err := os.WriteFile(localPath, data, 0644); err != nil {
							fmt.Fprintf(logger, "[ERROR] Product %d: Failed to save file: %v\n", p.Id, err)
						} else {
							downloadSuccess = true
						}
					}
				} else {
					downloadSuccess = true
				}

				if downloadSuccess {
					s.db.Model(&models.Product{}).Where("id = ?", p.Id).Update("local_image_path", localName)
				}

				s.mu.Lock()
				processed++
				s.syncStatus = fmt.Sprintf("Downloading images (%d/%d)", processed, total)
				s.mu.Unlock()
			}
		}()
	}

	wg.Wait()
	fmt.Fprintf(logger, "--- Image Download complete at %s ---\n", time.Now().Format(time.RFC3339))
	s.mu.Lock()
	s.syncStatus = "Sync complete"
	s.mu.Unlock()
}

func (s *SyncService) SyncOfflineResources() error {
	s.debugLog("Syncing Offline Resources (POS Profile & Modes of Payment)...")

	// 1. POS Profile Settings
	posProfile := s.setting.GetString(SettingPosProfile)
	if posProfile != "" {
		details, err := s.api.GetPosProfileDetails(posProfile)
		if err == nil {
			s.setting.SaveSetting("Cached_Warehouse", details["warehouse"], DataTypeSTRING)
			s.setting.SaveSetting("Cached_Company", details["company"], DataTypeSTRING)
			s.setting.SaveSetting("Cached_PosProfilePayments", details["payments"], DataTypeJSON)
			s.debugLog("Local cache updated for POS Profile '%s' settings.\n", posProfile)
		} else {
			s.debugLog("Failed to get POS Profile details: %v\n", err)
		}
	}

	// 2. Mode of Payments (Global list as fallback)
	modes, err := s.api.GetModeOfPayments()
	if err == nil {
		data, _ := json.Marshal(modes)
		s.setting.SaveSetting("Cached_ModeOfPayments", string(data), DataTypeJSON)
		s.debugLog("Local cache updated for %d Global Modes of Payment.\n", len(modes))
	} else {
		s.debugLog("Failed to get Global Modes of Payment: %v\n", err)
	}

	return nil
}

func (s *SyncService) CreateCustomerQuick(name, phone string) error {
	// 1. Create in ERPNext
	externalId, err := s.api.CreateCustomerInERPNext(name, phone)
	if err != nil {
		return err
	}

	// 2. Save locally
	customer := models.Customer{
		Name:       name,
		Phone:      phone,
		ExternalId: externalId,
		IsSync:     true, // Mark as synced
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}

	return s.db.Create(&customer).Error
}

func (s *SyncService) ClearAllData() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.debugLog("[CLEAR] Initiating Clear All Data...")

	// 1. Delete transactional and master data from DB (excluding pos_settings)
	err := s.db.Transaction(func(tx *gorm.DB) error {
		// List of all tables to clear except settings
		tables := []interface{}{
			&models.Product{},
			&models.ProductCategory{},
			&models.ProductCategoryMapping{},
			&models.OfflineOrder{},
			&models.Customer{},
			&models.AppLog{},
			&models.CashDrawer{},
			&models.CashTransaction{},
			&models.Promotion{},
			&models.Staff{},
		}

		for _, table := range tables {
			// Unscoped() is required to delete permamently if gorm.Model is used (with Soft Deletes)
			if err := tx.Session(&gorm.Session{AllowGlobalUpdate: true}).Unscoped().Where("1 = 1").Delete(table).Error; err != nil {
				return err
			}
		}
		return nil
	})

	if err != nil {
		s.debugLog("[CLEAR] Error clearing database: %v\n", err)
		return err
	}

	// 2. Clear images folder
	appDataDir := os.Getenv("APPDATA")
	imageDir := filepath.Join(appDataDir, "MoltoPos", "images")
	if _, err := os.Stat(imageDir); err == nil {
		files, err := os.ReadDir(imageDir)
		if err == nil {
			for _, f := range files {
				os.Remove(filepath.Join(imageDir, f.Name()))
			}
		}
	}

	s.debugLog("[CLEAR] All data cleared successfully (settings preserved).")
	return nil
}
func (s *SyncService) GetSyncLogs() ([]models.SyncLog, error) {
	var logs []models.SyncLog
	err := s.db.Order("timestamp desc").Limit(100).Find(&logs).Error
	return logs, err
}

func (s *SyncService) ClearSyncLogs() error {
	return s.db.Session(&gorm.Session{AllowGlobalUpdate: true}).Delete(&models.SyncLog{}).Error
}

func (s *SyncService) LogSyncError(orderId string, title string, message string) {
	log := models.SyncLog{
		Level:   "ERROR",
		Title:   title,
		Message: message,
		OrderId: orderId,
	}
	s.db.Create(&log)
}

func (s *SyncService) LogSyncInfo(title string, message string) {
	log := models.SyncLog{
		Level:   "INFO",
		Title:   title,
		Message: message,
	}
	s.db.Create(&log)
}

func (s *SyncService) FixExistingDates() {
	// Find all orders that might have string-like dates in the DB
	// GORM will try to scan them into time.Time, which might fail or be inconsistent
	// We'll use a raw query to check and fix
	type RawOrder struct {
		Id         int
		CreateDate string
	}
	var rawOrders []RawOrder
	s.db.Table("offline_orders").Select("id, create_date").Scan(&rawOrders)

	for _, ro := range rawOrders {
		if ro.CreateDate == "" {
			continue
		}
		// Try to parse common formats we've seen
		var t time.Time
		var err error

		// Format 1: RFC3339 (T and Z)
		t, err = time.Parse(time.RFC3339, ro.CreateDate)
		if err != nil {
			// Format 2: Go's default time string with space
			t, err = time.Parse("2006-01-02 15:04:05.999999999-07:00", ro.CreateDate)
		}
		if err != nil {
			// Format 3: Without timezone
			t, err = time.Parse("2006-01-02 15:04:05.999999999", ro.CreateDate)
		}

		if err == nil {
			s.db.Model(&models.OfflineOrder{}).Where("id = ?", ro.Id).Update("create_date", t.UTC())
		}
	}
	s.debugLog("Finished migrating existing order dates.")
}

func (s *SyncService) GetReportStats(fromDateStr, toDateStr string, isCloud bool) (*models.ReportStats, error) {
	fromDate, _ := time.Parse(time.RFC3339, fromDateStr)
	toDate, _ := time.Parse(time.RFC3339, toDateStr)

	if isCloud && s.setting.GetString(SettingAppMode) != "standalone" {
		return s.GetCloudReportStats(fromDate, toDate)
	}
	return s.GetLocalReportStats(fromDate, toDate)
}

func (s *SyncService) GetLocalReportStats(fromDate, toDate time.Time) (*models.ReportStats, error) {
	// 1. Fetch orders from local DB
	var orders []models.OfflineOrder
	s.db.Where("create_date >= ? AND create_date <= ?", fromDate, toDate).Find(&orders)

	// 2. Aggregate
	stats := &models.ReportStats{
		HourlySales:   make([]float64, 24),
		CategorySales: []models.CategoryEntry{},
		PaymentSales:  []models.PaymentEntry{},
		TopProducts:   []models.ProductEntry{},
		DailySales:    []models.DailyEntry{},
	}

	catMap := make(map[string]float64)
	payMap := make(map[string]float64)
	prodMap := make(map[string]int)
	dailyMap := make(map[string]float64)

	// Pre-load products for cost calculation if needed
	var products []models.Product
	s.db.Find(&products)
	costs := make(map[int]float64)
	for _, p := range products {
		if p.Cost != nil {
			costs[p.Id] = *p.Cost
		}
	}

	for _, o := range orders {
		var od models.CheckoutOrderModel
		if err := json.Unmarshal([]byte(o.JsonData), &od); err != nil {
			continue
		}

		stats.TotalSales += od.TotalPrice
		stats.OrderCount++

		// Daily aggregation
		dayStr := o.CreateDate.Format("2006-01-02")
		dailyMap[dayStr] += od.TotalPrice

		// Hourly (if it's a single day or small range)
		stats.HourlySales[o.CreateDate.Hour()] += od.TotalPrice

		// Categories & Products
		for _, sub := range od.SubOrder {
			catName := sub.CategoryName
			if catName == "" {
				catName = "Other"
			}
			for _, det := range sub.Detail {
				catMap[catName] += det.Price * float64(det.Quantity)
				prodMap[det.ProductName] += det.Quantity
				stats.TotalProfit += (det.Price - costs[det.ProductId]) * float64(det.Quantity)
			}
		}

		// Payments
		if len(od.Payments) > 0 {
			for _, p := range od.Payments {
				payMap[p.Method] += p.Amount
			}
		} else {
			method := od.PaymentGateway
			if method == "" {
				method = "Cash"
			}
			payMap[method] += od.TotalPrice
		}
	}

	// 3. Format results
	for k, v := range catMap {
		stats.CategorySales = append(stats.CategorySales, models.CategoryEntry{Name: k, Value: v})
	}
	for k, v := range payMap {
		stats.PaymentSales = append(stats.PaymentSales, models.PaymentEntry{Name: k, Value: v})
	}
	for k, v := range prodMap {
		stats.TopProducts = append(stats.TopProducts, models.ProductEntry{Name: k, Qty: v})
	}
	
	// Sort top products
	sort.Slice(stats.TopProducts, func(i, j int) bool {
		return stats.TopProducts[i].Qty > stats.TopProducts[j].Qty
	})
	if len(stats.TopProducts) > 10 {
		stats.TopProducts = stats.TopProducts[:10]
	}

	// Daily entries sorted by date
	var dates []string
	for k := range dailyMap {
		dates = append(dates, k)
	}
	sort.Strings(dates)
	for _, d := range dates {
		stats.DailySales = append(stats.DailySales, models.DailyEntry{Date: d, Value: dailyMap[d]})
	}

	return stats, nil
}

func (s *SyncService) GetCloudReportStats(fromDate, toDate time.Time) (*models.ReportStats, error) {
	posProfile := s.setting.GetString(SettingPosProfile)
	orders, err := s.api.GetCloudSalesInvoices(fromDate, toDate, posProfile)
	if err != nil {
		return nil, err
	}

	stats := &models.ReportStats{
		OrderCount:    len(orders),
		DailySales:    []models.DailyEntry{},
		CategorySales: []models.CategoryEntry{}, // Cloud API might not return categories easily in one call
		PaymentSales:  []models.PaymentEntry{},
		TopProducts:   []models.ProductEntry{},
	}

	dailyMap := make(map[string]float64)
	for _, o := range orders {
		stats.TotalSales += o.TotalPrice
		dailyMap[o.OrderDate] += o.TotalPrice
	}

	var dates []string
	for k := range dailyMap {
		dates = append(dates, k)
	}
	sort.Strings(dates)
	for _, d := range dates {
		stats.DailySales = append(stats.DailySales, models.DailyEntry{Date: d, Value: dailyMap[d]})
	}

	return stats, nil
}

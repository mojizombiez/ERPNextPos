package main

import (
	"MWinPOS/internal/models"
	"MWinPOS/internal/services"
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx                context.Context
	syncService        *services.SyncService
	printService       *services.PrintService
	settingService     *services.SettingService
	logService         *services.LogService
	scannerService     *services.ScannerService
	updateService      *services.UpdateService
	customerDisplayCmd *exec.Cmd
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{
		syncService:    services.NewSyncService(),
		printService:   services.NewPrintService(),
		settingService: services.NewSettingService(),
		logService:     services.NewLogService(),
		scannerService: services.NewScannerService(),
		updateService:  services.NewUpdateService(),
	}
}

func (a *App) CheckBarcodeScanner() bool {
	return a.scannerService.CheckScannerPresence()
}

func (a *App) HardReset() error {
	fmt.Println("[RESET] Initiating Hard Reset...")

	// 1. Close database via service
	a.settingService.CloseDB()

	// 2. Identify data folder
	appDataDir := os.Getenv("APPDATA")
	dbFolder := filepath.Join(appDataDir, "MWinPOS")

	// 3. Remove the entire folder
	fmt.Printf("[RESET] Deleting data folder: %s\n", dbFolder)
	err := os.RemoveAll(dbFolder)
	if err != nil {
		fmt.Printf("[RESET] Error deleting folder: %v\n", err)
		return err
	}

	fmt.Println("[RESET] Reset successful. Exiting application...")

	// 4. Exit application
	// Use os.Exit(0) to ensure the entire process terminates for a clean reset
	os.Exit(0)
	return nil
}

func (a *App) ClearAllData() error {
	return a.syncService.ClearAllData()
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.settingService.InitSettings()
	a.syncService.StartBackgroundSync()

	// Check if this is the MAIN app (not the customer display child process)
	if !a.GetIsCustomerDisplay() {
		fsMode := a.settingService.GetString("FullScreenMode")
		enableDisp := a.settingService.GetString("EnableCustomerDisplay")
		fmt.Printf("Startup: FullScreenMode=%s, EnableCustomerDisplay=%s\n", fsMode, enableDisp)

		// Handle Full Screen Mode
		if fsMode == "true" {
			runtime.WindowFullscreen(ctx)
		}

		// Handle Customer Display Auto-Launch
		if enableDisp == "true" {
			// Small delay to ensure main window is positioned/visible
			go func() {
				fmt.Println("Startup: Waiting 2s before launching customer display...")
				time.Sleep(2 * time.Second)
				monitorStr := a.settingService.GetString("CustomerScreenNumber")
				monitorIdx := -1
				if monitorStr != "" {
					fmt.Sscanf(monitorStr, "%d", &monitorIdx)
				}
				fmt.Printf("Startup: Auto-launching on monitor %d\n", monitorIdx)
				err := a.OpenCustomerDisplay(monitorIdx)
				if err != nil {
					fmt.Printf("Startup: Failed to launch customer display: %v\n", err)
				} else {
					fmt.Println("Startup: Customer display launch triggered")
				}
			}()
		}
	}
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

func (a *App) AddOrder(order models.CheckoutOrderModel) (string, error) {
	return a.syncService.AddOrder(order)
}

func (a *App) GetProducts(priceList string) ([]models.Product, error) {
	return a.syncService.GetProducts(priceList)
}

func (a *App) LoadProducts() ([]models.Product, error) {
	return a.syncService.LoadProducts()
}

func (a *App) GetPriceLists() ([]string, error) {
	return a.syncService.GetPriceLists()
}

func (a *App) GetStockLevel(itemCode string) (float64, error) {
	return a.syncService.GetStockLevel(itemCode)
}

func (a *App) GetCustomerBalance(customerName string) (float64, float64, error) {
	return a.syncService.GetCustomerBalance(customerName)
}

func (a *App) SendReceipt(orderUUID, method, recipient string) error {
	return a.syncService.SendReceipt(orderUUID, method, recipient)
}

func (a *App) GetCategories() ([]models.ProductCategory, error) {
	return a.syncService.GetCategories()
}

func (a *App) AddCategory(name string) error {
	return a.syncService.AddCategory(name)
}

func (a *App) DeleteCategory(id int) error {
	return a.syncService.DeleteCategory(id)
}

func (a *App) GetAppMode() string {
	return a.settingService.GetString("AppMode")
}

func (a *App) GetDashboardStats() (map[string]interface{}, error) {
	return a.syncService.GetDashboardStats()
}

func (a *App) PrintSlip(order models.CheckoutOrderModel) error {
	printerName := a.settingService.GetString("PrinterName") // Need to add this to settings
	return a.printService.PrintSlip(printerName, order)
}

func (a *App) PrintKitchenBill(order models.CheckoutOrderModel) error {
	// Try to get KitchenPrinterName, fall back to PrinterName if not set
	printerName := a.settingService.GetString("KitchenPrinterName")
	if printerName == "" {
		printerName = a.settingService.GetString("PrinterName")
	}
	return a.printService.PrintKitchenBill(printerName, order)
}

func (a *App) SaveSetting(name string, value string, dataType int) {
	a.settingService.SaveSetting(name, value, services.DataType(dataType))
}

func (a *App) GetSetting(name string) string {
	return a.settingService.GetValue(name)
}

func (a *App) GetOrders(fromDateStr, toDateStr string, filter models.OrderFilteringModel) (*models.OrderPosSearchResultModelOffline, error) {
	fromDate, _ := time.Parse(time.RFC3339, fromDateStr)
	toDate, _ := time.Parse(time.RFC3339, toDateStr)
	return a.syncService.GetOrders(fromDate, toDate, filter)
}

func (a *App) SyncAllData() error {
	return a.syncService.SyncAllData()
}

func (a *App) GetSyncStatus() map[string]interface{} {
	isSyncing, status, lastError := a.syncService.GetSyncStatus()
	return map[string]interface{}{
		"isSyncing":     isSyncing,
		"syncStatus":    status,
		"lastSyncError": lastError,
	}
}

func (a *App) LogFrontend(msg string) {
	fmt.Printf("[FRONTEND] %s\n", msg)
}

func (a *App) AddRefundOrder(order models.CheckoutOrderModel, refId int) (string, error) {
	return a.syncService.AddRefundOrder(order, refId)
}

func (a *App) CheckApiUrl(url string) (string, error) {
	// We'll use the API service to check the connection
	// Note: syncService already has an api instance, but it's initialized with the saved baseUrl.
	// For testing a NEW URL, we can just use the internal check logic.
	err := a.syncService.CheckApiConnection(url)
	if err != nil {
		return "", err
	}
	return "Connection successful!", nil
}

func (a *App) SaveProduct(p models.Product) error {
	return a.syncService.SaveProduct(p)
}

func (a *App) DeleteProduct(id int) error {
	return a.syncService.DeleteProduct(id)
}

func (a *App) UpdateProductAvailability(itemCode string, isAvailable bool) error {
	return a.syncService.UpdateProductAvailability(itemCode, isAvailable)
}

func (a *App) GetStaffs() ([]models.Staff, error) {
	return a.syncService.GetStaffs()
}

func (a *App) SaveStaff(s models.Staff) error {
	return a.syncService.SaveStaff(s)
}

func (a *App) DeleteStaff(id int) error {
	return a.syncService.DeleteStaff(id)
}

func (a *App) ValidatePin(pin string) (*models.Staff, error) {
	return a.syncService.GetStaffByPasscode(pin)
}

func (a *App) Login(username, password string) (string, error) {
	err := a.syncService.Login(username, password)
	if err != nil {
		return "", err
	}
	return "Login successful!", nil
}

func (a *App) GetWarehouses() ([]map[string]string, error) {
	return a.syncService.GetWarehouses()
}

func (a *App) GetCompanies() ([]map[string]string, error) {
	return a.syncService.GetCompanies()
}

func (a *App) GetPosProfiles() ([]string, error) {
	return a.syncService.GetPosProfiles()
}

func (a *App) GetPosProfileDetails(name string) (map[string]string, error) {
	return a.syncService.GetPosProfileDetails(name)
}

func (a *App) GetAccounts() ([]map[string]string, error) {
	return a.syncService.GetAccounts()
}

func (a *App) GetModeOfPayments() ([]map[string]string, error) {
	return a.syncService.GetModeOfPayments()
}

// Removed GetBranchName

func (a *App) GetNetworkPing() (int64, error) {
	return a.syncService.GetNetworkPing()
}

func (a *App) GetUnsyncedOrderCount() (int64, error) {
	return a.syncService.GetUnsyncedOrderCount()
}

func (a *App) GetPrinters() ([]string, error) {
	return a.printService.GetPrinters()
}

func (a *App) CheckPrinterStatus(printerName string) (string, error) {
	return a.printService.CheckPrinterStatus(printerName)
}

func (a *App) OpenCashDrawer() error {
	printerName := a.settingService.GetString("PrinterName")
	return a.printService.OpenCashDrawer(printerName)
}

func (a *App) GetScreens() ([]runtime.Screen, error) {
	return runtime.ScreenGetAll(a.ctx)
}

func (a *App) getCurrentScreenIndex() int {
	x, y := runtime.WindowGetPosition(a.ctx)
	w, h := runtime.WindowGetSize(a.ctx)
	centerX := x + w/2
	centerY := y + h/2

	screens := GetWindowsScreens()
	for i, s := range screens {
		if centerX >= s.X && centerX < s.X+s.Width &&
			centerY >= s.Y && centerY < s.Y+s.Height {
			return i
		}
	}
	return 0 // Fallback to primary
}

func (a *App) OpenCustomerDisplay(monitorIndex int) error {
	// If already running, kill the old one first to avoid multiple displays
	if a.customerDisplayCmd != nil && a.customerDisplayCmd.Process != nil {
		_ = a.customerDisplayCmd.Process.Kill()
		a.customerDisplayCmd = nil
	}

	screens := GetWindowsScreens() // Use custom Screen helper for reliable coordinates
	currentScreenId := a.getCurrentScreenIndex()

	// If Auto (-1) or manual choice matches main window, find another screen
	if monitorIndex < 0 || (monitorIndex == currentScreenId && len(screens) > 1) {
		// Try to find the first screen that is NOT the current screen
		found := false
		for i := range screens {
			if i != currentScreenId {
				monitorIndex = i
				found = true
				break
			}
		}
		if !found {
			monitorIndex = 0 // Only one screen, have to overlap
		}
	}

	exe, err := os.Executable()
	if err != nil {
		fmt.Printf("OpenCustomerDisplay: Failed to get executable: %v\n", err)
		return err
	}

	fmt.Printf("OpenCustomerDisplay: Launching %s --customer --monitor %d\n", exe, monitorIndex)
	a.customerDisplayCmd = exec.Command(exe, "--customer", "--monitor", fmt.Sprintf("%d", monitorIndex))
	err = a.customerDisplayCmd.Start()
	if err != nil {
		fmt.Printf("OpenCustomerDisplay: Failed to start process: %v\n", err)
	}
	return err
}

func (a *App) CloseCustomerDisplay() error {
	if a.customerDisplayCmd != nil && a.customerDisplayCmd.Process != nil {
		err := a.customerDisplayCmd.Process.Kill()
		a.customerDisplayCmd = nil
		return err
	}
	return nil
}

func (a *App) GetIsCustomerDisplay() bool {
	for _, arg := range os.Args {
		if arg == "--customer" {
			return true
		}
	}
	return false
}

func (a *App) GetAppVersion() string {
	return a.updateService.GetCurrentVersion()
}

func (a *App) CheckForUpdate() (*services.UpdateInfo, error) {
	updateUrl := a.settingService.GetString(services.SettingUpdateUrl)
	posProfile := a.settingService.GetString(services.SettingPosProfile)
	return a.updateService.CheckForUpdates(updateUrl, posProfile)
}

func (a *App) DownloadAndInstallUpdate(url string) error {
	return a.updateService.DownloadAndInstall(url)
}

func (a *App) PrintPriceTag(product models.Product) error {
	printerName := a.settingService.GetString("PrinterName")
	return a.printService.PrintPriceTag(printerName, product)
}

// --- Customer Methods ---

func (a *App) GetCustomers() ([]models.Customer, error) {
	return a.syncService.GetCustomers()
}

func (a *App) SaveCustomer(customer models.Customer) error {
	return a.syncService.SaveCustomer(customer)
}

func (a *App) DeleteCustomer(id int) error {
	return a.syncService.DeleteCustomer(id)
}

func (a *App) CreateCustomerQuick(name, phone string) error {
	return a.syncService.CreateCustomerQuick(name, phone)
}

func (a *App) ValidateCouponCode(code string) (map[string]interface{}, error) {
	return a.syncService.ValidateCouponCode(code)
}

func (a *App) ValidateGiftCard(code string) (map[string]interface{}, error) {
	return a.syncService.ValidateGiftCard(code)
}

// --- Cash Drawer Methods ---

func (a *App) GetCurrentDrawer() (*models.CashDrawer, error) {
	return a.syncService.GetCurrentDrawer()
}

func (a *App) GetDrawerStats(drawerId int) (map[string]interface{}, error) {
	return a.syncService.GetDrawerStats(drawerId)
}

func (a *App) OpenDrawer(startBalance float64, staffId int, staffName string) error {
	return a.syncService.OpenDrawer(startBalance, staffId, staffName)
}

func (a *App) CloseDrawer(drawerId int, actualCash float64, endBalance float64) error {
	return a.syncService.CloseDrawer(drawerId, actualCash, endBalance)
}

// --- Promotion Methods ---

func (a *App) GetPromotions() ([]models.Promotion, error) {
	return a.syncService.GetPromotions()
}

func (a *App) SavePromotion(promo models.Promotion) error {
	return a.syncService.SavePromotion(promo)
}

func (a *App) GetDeliveryOrders() (*models.OrderPosSearchResultModelOffline, error) {
	// Filter orders that have delivery price or other delivery markers
	// For now, let's just return all orders but maybe in the future we use a specific flag
	now := time.Now()
	fromDate := now.AddDate(0, 0, -30) // Last 30 days
	return a.syncService.GetOrders(fromDate, now, models.OrderFilteringModel{})
}

func (a *App) UpdateOrderMetadata(uuid string, warehouse string, company string, customer string, paymentsJson string) error {
	return a.syncService.UpdateOrderMetadata(uuid, warehouse, company, customer, paymentsJson)
}

func (a *App) ManualSyncOrder(uuid string) error {
	return a.syncService.ManualSyncOrder(uuid)
}

func (a *App) GetCustomersMap() ([]map[string]string, error) {
	return a.syncService.GetCustomersMap()
}

func (a *App) GetSyncLogs() ([]models.SyncLog, error) {
	return a.syncService.GetSyncLogs()
}

func (a *App) ClearSyncLogs() error {
	return a.syncService.ClearSyncLogs()
}

func (a *App) GetDatabaseStats() (map[string]interface{}, error) {
	return a.syncService.GetDatabaseStats()
}

func (a *App) SyncProductsOnly() error {
	return a.syncService.SyncProductsOnly()
}

func (a *App) SyncCustomersOnly() error {
	return a.syncService.SyncCustomersOnly()
}

func (a *App) CleanupDuplicates() error {
	return a.syncService.CleanupDuplicates()
}

func (a *App) SelectAndSaveImage() (string, error) {
	// 1. Open File Dialog
	selection, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select Product Image",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "Image Files (*.jpg;*.jpeg;*.png;*.webp;*.gif)",
				Pattern:     "*.jpg;*.jpeg;*.png;*.webp;*.gif",
			},
		},
	})

	if err != nil {
		return "", err
	}

	if selection == "" {
		return "", nil // User cancelled
	}

	// 2. Prepare Destination
	appDataDir := os.Getenv("APPDATA")
	imageDir := filepath.Join(appDataDir, "MWinPOS", "images")

	// Ensure directory exists
	if _, err := os.Stat(imageDir); os.IsNotExist(err) {
		err = os.MkdirAll(imageDir, 0755)
		if err != nil {
			return "", fmt.Errorf("failed to create image directory: %v", err)
		}
	}

	// 3. Generate Unique Filename to avoid collisions
	ext := filepath.Ext(selection)
	fileName := fmt.Sprintf("img_%d%s", time.Now().UnixNano(), ext)
	dstPath := filepath.Join(imageDir, fileName)

	// 4. Copy File
	srcFile, err := os.Open(selection)
	if err != nil {
		return "", err
	}
	defer srcFile.Close()

	dstFile, err := os.Create(dstPath)
	if err != nil {
		return "", err
	}
	defer dstFile.Close()

	_, err = io.Copy(dstFile, srcFile)
	if err != nil {
		return "", err
	}

	return fileName, nil
}

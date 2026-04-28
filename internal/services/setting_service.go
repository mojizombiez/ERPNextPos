package services

import (
	"MWinPOS/internal/config"
	"MWinPOS/internal/database"
	"MWinPOS/internal/models"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type DataType int

const (
	DataTypeINT      DataType = 1
	DataTypeDOUBLE   DataType = 2
	DataTypeSTRING   DataType = 3
	DataTypeDATETIME DataType = 4
	DataTypeJSON     DataType = 5
	DataTypeBOOLEAN  DataType = 6
)

const (
	SettingWarehouse             = "Warehouse"
	SettingCompany               = "Company"
	SettingCommonPos             = "CommonPos"
	SettingProducts              = "Products"
	SettingRequireSync           = "RequireSync"
	SettingRequireDownloadSource = "RequireDownloadSource"
	SettingRequireUpdate         = "RequireUpdate"
	SettingStaffs                = "Staffs"
	SettingCustomerScreenNumber  = "CustomerScreenNumber"
	SettingBackendUrl            = "BackendUrl"
	SettingApiUrl                = "ApiUrl"
	SettingUserName              = "UserName"
	SettingPassword              = "Password"
	SettingRunningNumber         = "RunningNumber"
	SettingCurrentDate           = "CurrentDate"
	SettingSyncIntervalSeconds   = "SyncIntervalSeconds"
	SettingSyncBatchSize         = "SyncBatchSize"
	SettingAutoLockSeconds       = "AutoLockSeconds"
	SettingMasterPin             = "MasterPin"
	SettingPrinterName           = "PrinterName"
	SettingCashierPrinter        = "CashierPrinter"
	SettingKitchenPrinter        = "KitchenPrinter"
	SettingUseSamePrinter        = "UseSamePrinter"
	SettingActiveTheme           = "ActiveTheme"
	SettingAppMode               = "AppMode"
	SettingUpdateUrl             = "UpdateUrl"
	SettingEnableCustomerDisplay = "EnableCustomerDisplay"
	SettingFullScreenMode        = "FullScreenMode"
	SettingSkipUpdateCheck       = "SkipUpdateCheck"
	SettingPosProfile            = "PosProfile"
	SettingWriteOffAccount       = "WriteOffAccount"
	SettingDebugMode             = "DebugMode"
)

type SettingService struct {
	db *gorm.DB
}

func (s *SettingService) CloseDB() {
	database.CloseDB()
}

func NewSettingService() *SettingService {
	return &SettingService{db: database.DB}
}

func (s *SettingService) InitSettings() {
	s.ensureSetting(SettingWarehouse, "", DataTypeSTRING)
	s.ensureSetting(SettingCompany, "", DataTypeSTRING)
	s.ensureSetting(SettingCommonPos, "", DataTypeJSON)
	s.ensureSetting(SettingProducts, "", DataTypeJSON)
	s.ensureSetting(SettingRequireSync, "true", DataTypeBOOLEAN)
	s.ensureSetting(SettingRequireDownloadSource, "true", DataTypeBOOLEAN)
	s.ensureSetting(SettingRequireUpdate, "false", DataTypeBOOLEAN)
	s.ensureSetting(SettingStaffs, "", DataTypeJSON)
	s.ensureSetting(SettingCustomerScreenNumber, "", DataTypeSTRING)
	s.ensureSetting(SettingBackendUrl, "", DataTypeSTRING)
	s.ensureSetting(SettingApiUrl, config.GetEnvWithDefault(config.EnvErpApiUrl, ""), DataTypeSTRING)
	s.ensureSetting(SettingUserName, config.GetEnvWithDefault(config.EnvErpApiKey, ""), DataTypeSTRING)
	s.ensureSetting(SettingPassword, config.GetEnvWithDefault(config.EnvErpApiSecret, ""), DataTypeSTRING)
	s.ensureSetting(SettingRunningNumber, "0", DataTypeINT)
	s.ensureSetting(SettingCurrentDate, time.Now().Format(time.RFC3339), DataTypeDATETIME)
	s.ensureSetting(SettingSyncIntervalSeconds, "5", DataTypeINT)
	s.ensureSetting(SettingSyncBatchSize, "5", DataTypeINT)
	s.ensureSetting(SettingAutoLockSeconds, "300", DataTypeINT)
	s.ensureSetting(SettingMasterPin, "123456", DataTypeSTRING)
	s.ensureSetting(SettingPrinterName, "", DataTypeSTRING)
	s.ensureSetting(SettingCashierPrinter, "", DataTypeSTRING)
	s.ensureSetting(SettingKitchenPrinter, "", DataTypeSTRING)
	s.ensureSetting(SettingUseSamePrinter, "false", DataTypeBOOLEAN)
	s.ensureSetting(SettingActiveTheme, "theme-midnight", DataTypeSTRING)
	s.ensureSetting(SettingAppMode, "online", DataTypeSTRING)
	s.ensureSetting(SettingUpdateUrl, config.GetEnvWithDefault(config.EnvUpdateUrl, "https://nuget.moltothailand.com/erpnext/windows/update.json"), DataTypeSTRING)
	s.ensureSetting(SettingEnableCustomerDisplay, "false", DataTypeBOOLEAN)
	s.ensureSetting(SettingSkipUpdateCheck, "false", DataTypeBOOLEAN)
	s.ensureSetting(SettingFullScreenMode, "false", DataTypeBOOLEAN)
	s.ensureSetting(SettingPosProfile, "", DataTypeSTRING)
	s.ensureSetting(SettingWriteOffAccount, "", DataTypeSTRING)
	s.ensureSetting(SettingDebugMode, "false", DataTypeBOOLEAN)
}

func (s *SettingService) ensureSetting(name string, value string, dataType DataType) {
	var setting models.PosSettings
	result := s.db.Where("name = ?", name).First(&setting)
	if errors.Is(result.Error, gorm.ErrRecordNotFound) {
		if s.IsDebug() {
			fmt.Printf("SettingService: ensureSetting: %s not found, saving default: %s\n", name, value)
		}
		s.SaveSetting(name, value, dataType)
	} else {
		if s.IsDebug() {
			fmt.Printf("SettingService: ensureSetting: %s found: %s\n", name, setting.Value)
		}
	}
}

func (s *SettingService) SaveSetting(name string, value interface{}, dataType DataType) {
	var valStr string
	var jsonVal string

	if dataType == DataTypeJSON {
		switch v := value.(type) {
		case string:
			jsonVal = v
		default:
			// If not a string, try to marshal it
			b, err := json.Marshal(v)
			if err == nil {
				jsonVal = string(b)
			}
		}
	} else {
		valStr = models.ToString(value)
	}

	setting := models.PosSettings{
		Name:      name,
		DataType:  int(dataType),
		Value:     valStr,
		JsonValue: jsonVal,
	}

	s.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "name"}},
		DoUpdates: clause.AssignmentColumns([]string{"value", "json_value", "data_type"}),
	}).Create(&setting)
	if s.IsDebug() {
		fmt.Printf("SettingService: SaveSetting: %s = %s\n", name, valStr)
	}
}

func (s *SettingService) GetString(name string) string {
	var setting models.PosSettings
	s.db.Where("name = ?", name).Limit(1).Find(&setting)
	if setting.Name == "" {
		return ""
	}
	if s.IsDebug() {
		fmt.Printf("SettingService: GetString: %s = %s\n", name, setting.Value)
	}
	return setting.Value
}

func (s *SettingService) GetValue(name string) string {
	var setting models.PosSettings
	s.db.Where("name = ?", name).Limit(1).Find(&setting)
	if setting.Name == "" {
		return ""
	}
	if setting.DataType == int(DataTypeJSON) {
		return setting.JsonValue
	}
	return setting.Value
}

func (s *SettingService) GetJson(name string) string {
	var setting models.PosSettings
	s.db.Where("name = ?", name).First(&setting)
	return setting.JsonValue
}

func (s *SettingService) GetInt(name string) int {
	str := s.GetString(name)
	i, _ := strconv.Atoi(str)
	return i
}

func (s *SettingService) GetBool(name string) bool {
	str := s.GetString(name)
	b, _ := strconv.ParseBool(str)
	return b
}

func (s *SettingService) GetRunningNumber() int {
	runningStr := s.GetString(SettingRunningNumber)
	dateStr := s.GetString(SettingCurrentDate)

	now := time.Now().Format("2006-01-02")

	// Check if date has changed
	savedDate, _ := time.Parse(time.RFC3339, dateStr)
	if savedDate.Format("2006-01-02") != now {
		s.SaveSetting(SettingRunningNumber, "1", DataTypeINT)
		s.SaveSetting(SettingCurrentDate, time.Now().Format(time.RFC3339), DataTypeDATETIME)
		return 1
	}

	val, _ := strconv.Atoi(runningStr)
	newVal := val + 1
	s.SaveSetting(SettingRunningNumber, strconv.Itoa(newVal), DataTypeINT)
	return newVal
}

func (s *SettingService) IsDebug() bool {
	var setting models.PosSettings
	// Check DB directly to avoid recursion
	s.db.Where("name = ?", SettingDebugMode).Limit(1).Find(&setting)
	return setting.Value == "true"
}
func (s *SettingService) GetAllSettings() ([]models.PosSettings, error) {
	var settings []models.PosSettings
	err := s.db.Find(&settings).Error
	return settings, err
}

func (s *SettingService) BatchSaveSettings(settings []models.PosSettings) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		for _, setting := range settings {
			if err := tx.Clauses(clause.OnConflict{
				Columns:   []clause.Column{{Name: "name"}},
				DoUpdates: clause.AssignmentColumns([]string{"value", "json_value", "data_type"}),
			}).Create(&setting).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

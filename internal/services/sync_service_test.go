package services

import (
	"MoltoPos/internal/database"
	"MoltoPos/internal/models"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

func TestSyncAllData(t *testing.T) {
	// 1. Setup temporary database
	tempDB := filepath.Join(os.TempDir(), "test_sync.db")
	defer os.Remove(tempDB)

	db, err := gorm.Open(sqlite.Open(tempDB), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to connect database: %v", err)
	}
	database.DB = db

	err = db.AutoMigrate(
		&models.Product{},
		&models.PosSettings{},
	)
	if err != nil {
		t.Fatalf("failed to migrate database: %v", err)
	}

	// 2. Setup mock server
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api/Order/GetOrderCommonPos" {
			common := models.OrderCommonModel{
				BackgroundUrl: "http://example.com/bg.png",
			}
			json.NewEncoder(w).Encode(common)
		} else if r.URL.Path == "/api/Order/GetProductPos" {
			products := []models.Product{
				{Id: 1, NameTH: "Product 1"},
				{Id: 2, NameTH: "Product 2"},
			}
			json.NewEncoder(w).Encode(products)
		} else {
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	defer mockServer.Close()

	// 3. Initialize Services
	ss := NewSettingService()
	ss.SaveSetting("ApiUrl", mockServer.URL, DataTypeSTRING)
	ss.SaveSetting("BranchId", "1", DataTypeINT)

	syncSvc := &SyncService{
		db:      db,
		api:     NewApiService(mockServer.URL),
		setting: ss,
	}

	// 4. Run Sync
	err = syncSvc.SyncAllData()
	if err != nil {
		t.Fatalf("SyncAllData failed: %v", err)
	}

	// 5. Verify Database
	var count int64
	db.Model(&models.Product{}).Count(&count)
	fmt.Printf("Products count in DB: %d\n", count)
	if count != 2 {
		t.Errorf("Expected 2 products, got %d", count)
	}

	var setting models.PosSettings
	result := db.Where("name = ?", "CommonPos").First(&setting)
	if result.Error != nil {
		t.Errorf("Failed to find CommonPos setting: %v", result.Error)
	} else {
		fmt.Printf("CommonPos JsonValue length: %d\n", len(setting.JsonValue))
		if setting.JsonValue == "" {
			t.Error("CommonPos setting should not be empty")
		}
	}

	fmt.Println("SyncAllData test completed!")
}

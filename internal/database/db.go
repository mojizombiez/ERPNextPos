package database

import (
	"MoltoPos/internal/models"
	"log"
	"os"
	"path/filepath"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() {
	var err error

	// Ensure data directory exists
	appDataDir := os.Getenv("APPDATA")
	dbFolder := filepath.Join(appDataDir, "MoltoPos")
	if _, err := os.Stat(dbFolder); os.IsNotExist(err) {
		os.MkdirAll(dbFolder, 0755)
	}

	dbPath := filepath.Join(dbFolder, "m_offline.db")

	DB, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		log.Fatal("[101] Failed to connect to database:", err)
	}

	// Optimize for SQLite concurrency and stability
	sqlDB, _ := DB.DB()
	sqlDB.Exec("PRAGMA journal_mode=WAL;")
	sqlDB.Exec("PRAGMA synchronous=NORMAL;")
	sqlDB.Exec("PRAGMA busy_timeout=5000;")
	sqlDB.SetMaxOpenConns(1) // CRITICAL: Only one writer connection for SQLite stability

	// Clean up duplicates before migration to avoid UNIQUE constraint failures
	cleanDuplicates(DB)

	// Migrate the schema
	err = DB.AutoMigrate(
		&models.Product{},
		&models.OfflineOrder{},
		&models.PosSettings{},
		&models.AppLog{},
		&models.ProductCategory{},
		&models.ProductCategoryMapping{},
		&models.Staff{},
		&models.Customer{},
		&models.CashDrawer{},
		&models.CashTransaction{},
		&models.Promotion{},
		&models.SyncLog{},
		&models.BundleItem{},
	)
	if err != nil {
		log.Fatal("[102] Failed to migrate database schema:", err)
	}

	// Seed a default staff if none exist (prevents being locked out on first launch)
	var staffCount int64
	DB.Model(&models.Staff{}).Count(&staffCount)
	if staffCount == 0 {
		defaultStaff := models.Staff{
			Name:     "Admin",
			NickName: "Admin",
			PassCode: "123456",
			Role:     "Manager",
			IsActive: true,
		}
		DB.Create(&defaultStaff)
		log.Println("[DB] No staff found. Created default staff 'Admin' with PIN 123456")
	}
}

func cleanDuplicates(db *gorm.DB) {
	log.Println("[DB] Running pre-migration duplicate cleanup...")

	// 1. Products by ip_code
	db.Exec(`
		DELETE FROM products 
		WHERE id NOT IN (
			SELECT MIN(id) 
			FROM products 
			GROUP BY ip_code
		) AND ip_code IS NOT NULL AND ip_code != ''
	`)

	// 2. Customers by customer_name
	db.Exec(`
		DELETE FROM customers 
		WHERE id NOT IN (
			SELECT MIN(id) 
			FROM customers 
			GROUP BY customer_name
		) AND customer_name IS NOT NULL AND customer_name != ''
	`)

	log.Println("[DB] Duplicate cleanup completed.")
}

func CloseDB() {
	if DB != nil {
		sqlDB, err := DB.DB()
		if err == nil {
			sqlDB.Close()
		}
	}
}

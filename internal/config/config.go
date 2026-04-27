package config

import (
	"os"
)

const (
	EnvErpApiUrl    = "ERP_API_URL"
	EnvErpApiKey    = "ERP_API_KEY"
	EnvErpApiSecret = "ERP_API_SECRET"
	EnvUpdateUrl    = "UPDATE_URL"
)

// GetEnvWithDefault returns the value of an environment variable or a default value
func GetEnvWithDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

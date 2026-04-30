package main

import (
	"MoltoPos/internal/database"
	"context"
	"embed"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/joho/godotenv"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Load environment variables from .env file
	_ = godotenv.Load()

	database.InitDB()

	// Use environment variables for customer display mode (safer than flags in wails dev)
	isCustomer := os.Getenv("MOLTOPOS_CUSTOMER") == "true"
	monitorIndex := -1
	monitorStr := os.Getenv("MOLTOPOS_MONITOR")
	if monitorStr != "" {
		fmt.Sscanf(monitorStr, "%d", &monitorIndex)
	}

	// Start a dedicated video server on port 34999 to bypass all Wails/Vite proxy issues
	go func() {
		mux := http.NewServeMux()
		mux.HandleFunc("/stream-video", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Range")
			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}
			filePath := r.URL.Query().Get("path")
			if filePath != "" {
				cleanPath := filepath.Clean(filePath)
				if info, err := os.Stat(cleanPath); err == nil && !info.IsDir() {
					w.Header().Set("Content-Type", "video/mp4")
					http.ServeFile(w, r, cleanPath)
					return
				}
			}
			http.NotFound(w, r)
		})
		fmt.Println("Dedicated Video Server starting on :34999")
		http.ListenAndServe(":34999", mux)
	}()

	// Create an instance of the app structure
	app := NewApp()

	title := "MoltoPos"
	if isCustomer {
		title = "M Customer Display"
	}

	appOptions := &options.App{
		Title:  title,
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
			Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				fmt.Printf("AssetServer: Received request for: %s\n", r.URL.Path)
				// Handle /images/ requests by serving from APPDATA
				if len(r.URL.Path) > 8 && r.URL.Path[:8] == "/images/" {
					appDataDir := os.Getenv("APPDATA")
					imagePath := filepath.Join(appDataDir, "MoltoPos", "images", r.URL.Path[8:])
					if _, err := os.Stat(imagePath); err == nil {
						http.ServeFile(w, r, imagePath)
						return
					}
				}
				// Handle /stream-video requests
				if strings.HasPrefix(r.URL.Path, "/stream-video") {
					// Add CORS headers for direct access
					w.Header().Set("Access-Control-Allow-Origin", "*")
					w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
					w.Header().Set("Access-Control-Allow-Headers", "Range")
					
					if r.Method == "OPTIONS" {
						w.WriteHeader(http.StatusOK)
						return
					}

					fmt.Printf("AssetServer: Video request! Path=%s\n", r.URL.Path)
					filePath := r.URL.Query().Get("path")
					if filePath != "" {
						cleanPath := filepath.Clean(filePath)
						if info, err := os.Stat(cleanPath); err == nil && !info.IsDir() {
							fmt.Printf("AssetServer: Serving local file: %s (%d bytes)\n", cleanPath, info.Size())
							w.Header().Set("Content-Type", "video/mp4")
							http.ServeFile(w, r, cleanPath)
							return
						} else if err != nil {
							fmt.Printf("AssetServer: File access error: %v (path: %s)\n", err, cleanPath)
						} else {
							fmt.Printf("AssetServer: Path is a directory: %s\n", cleanPath)
						}
					}
				}
				// Pass through to default asset server for embedded files
				// By NOT calling http.NotFound here, Wails AssetServer will continue to search Assets FS
			}),
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup: func(ctx context.Context) {
			app.startup(ctx)
			if isCustomer {
				// Navigate to the customer page immediately
				runtime.WindowSetTitle(ctx, "Customer Display")
				runtime.WindowSetDarkTheme(ctx)

				// Handle monitor positioning if requested
				if monitorIndex >= 0 {
					winScreens := GetWindowsScreens()
					if monitorIndex < len(winScreens) {
						s := winScreens[monitorIndex]
						// Set position and then fullscreen
						runtime.WindowSetPosition(ctx, s.X, s.Y)
						runtime.WindowFullscreen(ctx)
					}
				}

				// Using runtime.EventsEmit or hash routing to switch views
				// Since it's a new process, the frontend will load index.html.
				// We can use a hash or an event to tell the frontend to show /customer.
				// In this app, we added /customer to the routes.
				// We can use runtime.BrowserOpenURL (wait, that opens external browser)
				// We'll use a custom event or just tell the frontend via a binding.
			}
		},
		OnShutdown: func(ctx context.Context) {
			app.CloseCustomerDisplay()
		},
		Bind: []interface{}{
			app,
		},
	}

	if isCustomer {
		appOptions.Frameless = true
		appOptions.StartHidden = false // Let it show once positioned?
	}

	// Create application with options
	err := wails.Run(appOptions)

	if err != nil {
		println("Error:", err.Error())
	}
}

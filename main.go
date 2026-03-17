package main

import (
	"MWinPOS/internal/database"
	"context"
	"embed"
	"fmt"
	"net/http"
	"os"
	"path/filepath"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	database.InitDB()

	// Parse flags for customer display mode
	isCustomer := false
	monitorIndex := -1
	for i, arg := range os.Args {
		if arg == "--customer" {
			isCustomer = true
		}
		if arg == "--monitor" && i+1 < len(os.Args) {
			fmt.Sscanf(os.Args[i+1], "%d", &monitorIndex)
		}
	}

	// Create an instance of the app structure
	app := NewApp()

	title := "MWinPOS"
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
				// Handle /images/ requests by serving from APPDATA
				if len(r.URL.Path) > 8 && r.URL.Path[:8] == "/images/" {
					appDataDir := os.Getenv("APPDATA")
					imagePath := filepath.Join(appDataDir, "MWinPOS", "images", r.URL.Path[8:])
					if _, err := os.Stat(imagePath); err == nil {
						http.ServeFile(w, r, imagePath)
						return
					}
				}
				http.NotFound(w, r)
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

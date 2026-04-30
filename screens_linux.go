package main

type WinScreen struct {
	X      int
	Y      int
	Width  int
	Height int
}

// GetWindowsScreens on Linux returns an empty slice for now.
// In the future, we can implement Linux-specific screen detection if needed.
func GetWindowsScreens() []WinScreen {
	return []WinScreen{}
}

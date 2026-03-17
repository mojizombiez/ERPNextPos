package main

import (
	"syscall"
	"unsafe"
)

var (
	user32              = syscall.NewLazyDLL("user32.dll")
	enumDisplayMonitors = user32.NewProc("EnumDisplayMonitors")
	getMonitorInfo      = user32.NewProc("GetMonitorInfoW")
)

type RECT struct {
	Left, Top, Right, Bottom int32
}

type MONITORINFO struct {
	Size    uint32
	Monitor RECT
	Work    RECT
	Flags   uint32
}

type WinScreen struct {
	X      int
	Y      int
	Width  int
	Height int
}

func GetWindowsScreens() []WinScreen {
	var screens []WinScreen
	enumDisplayMonitors.Call(0, 0, syscall.NewCallback(func(hMonitor uintptr, hdcMonitor uintptr, lprcMonitor *RECT, dwData uintptr) uintptr {
		var mi MONITORINFO
		mi.Size = uint32(unsafe.Sizeof(mi))
		getMonitorInfo.Call(hMonitor, uintptr(unsafe.Pointer(&mi)))

		screens = append(screens, WinScreen{
			X:      int(mi.Monitor.Left),
			Y:      int(mi.Monitor.Top),
			Width:  int(mi.Monitor.Right - mi.Monitor.Left),
			Height: int(mi.Monitor.Bottom - mi.Monitor.Top),
		})
		return 1
	}), 0)
	return screens
}

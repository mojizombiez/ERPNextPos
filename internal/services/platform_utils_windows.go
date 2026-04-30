package services

import "syscall"

// GetSysProcAttr returns platform-specific process attributes to hide the window on Windows.
func GetSysProcAttr() *syscall.SysProcAttr {
	return &syscall.SysProcAttr{
		HideWindow:    true,
		CreationFlags: 0x08000000,
	}
}

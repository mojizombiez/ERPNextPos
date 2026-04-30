package services

import "syscall"

// GetSysProcAttr returns platform-specific process attributes. On Linux, this is a blank struct.
func GetSysProcAttr() *syscall.SysProcAttr {
	return &syscall.SysProcAttr{}
}

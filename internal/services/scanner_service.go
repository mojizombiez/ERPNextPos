package services

import (
	"os/exec"
	"strings"
	"syscall"
)

type ScannerService struct{}

func NewScannerService() *ScannerService {
	return &ScannerService{}
}

// CheckScannerPresence returns true if a barcode scanner is detected on Windows
func (s *ScannerService) CheckScannerPresence() bool {
	// Look for common scanner identifiers in HID devices
	// Many scanners identify as "HID Keyboard Device" but some have specific manufacturer names
	// or "Scanner" in their description.

	// We check for:
	// 1. Devices with "Scanner" in name
	// 2. Devices from known manufacturers (Symbol, Zebra, Honeywell, Datalogic)
	// 3. POS Barcode specific classes

	cmd := exec.Command("powershell", "-WindowStyle", "Hidden", "-Command", "Get-PnpDevice -Class HIDClass, Keyboard, POS | Select-Object FriendlyName, Caption | Out-String")
	cmd.SysProcAttr = GetSysProcAttr()
	output, err := cmd.Output()
	if err != nil {
		return false
	}

	content := strings.ToLower(string(output))
	identifiers := []string{
		"scanner",
		"barcode",
		"symbol",
		"zebra",
		"honeywell",
		"datalogic",
		"motorola",
		"unitech",
		"yk2330g",
		"yk",
	}

	for _, id := range identifiers {
		if strings.Contains(content, id) {
			return true
		}
	}

	return false
}

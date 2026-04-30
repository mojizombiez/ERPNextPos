//go:build linux

package services

import (
	"fmt"
	"os/exec"
)

// SendRawToPrinter on Linux uses 'lp' or 'lpr' to send raw data to a printer.
func SendRawToPrinter(printerName string, data []byte) error {
	// On Linux, we typically pipe the data to 'lp -d printername'
	cmd := exec.Command("lp", "-d", printerName)
	
	stdin, err := cmd.StdinPipe()
	if err != nil {
		return fmt.Errorf("failed to get stdin pipe: %v", err)
	}

	go func() {
		defer stdin.Close()
		stdin.Write(data)
	}()

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("failed to run lp command: %v", err)
	}

	return nil
}

package services

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"syscall"
	"time"
)

const AppVersion = "1.2.0"

type UpdateHistoryEntry struct {
	Version     string `json:"version"`
	Date        string `json:"date"`
	Description string `json:"description"`
}

type UpdateInfo struct {
	Version         string               `json:"version"`
	URL             string               `json:"url"`
	Description     string               `json:"description"`
	IncludeBranches []string             `json:"includeBranches"` // Optional: only these branches
	ExcludeBranches []string             `json:"excludeBranches"` // Optional: skip these branches
	History         []UpdateHistoryEntry `json:"history"`         // Historical updates
}

type UpdateService struct {
}

func NewUpdateService() *UpdateService {
	return &UpdateService{}
}

func (s *UpdateService) GetCurrentVersion() string {
	return AppVersion
}

func (s *UpdateService) CheckForUpdates(updateUrl string, currentBranchId string) (*UpdateInfo, error) {
	if updateUrl == "" {
		return nil, fmt.Errorf("update URL is not configured")
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(updateUrl)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to check for updates: %s", resp.Status)
	}

	var info UpdateInfo
	if err := json.NewDecoder(resp.Body).Decode(&info); err != nil {
		return nil, err
	}

	// 1. Version Comparison
	if info.Version == AppVersion {
		return nil, nil // Up to date
	}

	// 2. Targeting Logic
	// If IncludeBranches is specified, the current branch MUST be in the list
	if len(info.IncludeBranches) > 0 {
		found := false
		for _, b := range info.IncludeBranches {
			if b == currentBranchId {
				found = true
				break
			}
		}
		if !found {
			return nil, nil // Not targeted for this branch
		}
	}

	// If ExcludeBranches is specified, the current branch MUST NOT be in the list
	if len(info.ExcludeBranches) > 0 {
		for _, b := range info.ExcludeBranches {
			if b == currentBranchId {
				return nil, nil // Targeted for exclusion
			}
		}
	}

	return &info, nil
}

func (s *UpdateService) DownloadAndInstall(updateUrl string) error {
	// 1. Download the file
	resp, err := http.Get(updateUrl)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	exePath, err := os.Executable()
	if err != nil {
		return err
	}
	newExePath := exePath + ".new"

	out, err := os.Create(newExePath)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, resp.Body)
	if err != nil {
		return err
	}
	out.Close()

	if runtime.GOOS == "windows" {
		// Windows specific: Use updater.bat
		updaterPath := filepath.Join(filepath.Dir(exePath), "updater.bat")
		updaterContent := fmt.Sprintf(`@echo off
timeout /t 2 /nobreak > nul
del "%s"
move "%s" "%s"
start "" "%s"
del "%%~f0"
`, exePath, newExePath, exePath, exePath)

		err = os.WriteFile(updaterPath, []byte(updaterContent), 0644)
		if err != nil {
			return err
		}

		cmd := exec.Command("cmd", "/c", "start", "/b", updaterPath)
		cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true, CreationFlags: 0x08000000}
		err = cmd.Start()
		if err != nil {
			return err
		}
	} else if runtime.GOOS == "linux" {
		// Linux specific: Rename running binary and overwrite
		oldExePath := exePath + ".old"

		// 1. Rename current binary (Linux allows this)
		err = os.Rename(exePath, oldExePath)
		if err != nil {
			return fmt.Errorf("failed to rename current binary: %w", err)
		}

		// 2. Move new binary to original path
		err = os.Rename(newExePath, exePath)
		if err != nil {
			return fmt.Errorf("failed to move new binary: %w", err)
		}

		// 3. Set executable permissions
		err = os.Chmod(exePath, 0755)
		if err != nil {
			return fmt.Errorf("failed to set permissions: %w", err)
		}

		// 4. Restart the app
		cmd := exec.Command(exePath, os.Args[1:]...)
		err = cmd.Start()
		if err != nil {
			return fmt.Errorf("failed to restart application: %w", err)
		}

		// Clean up old binary in background or next start?
		// For now we just exit and let the user know.
	} else {
		return fmt.Errorf("auto-update is not supported on %s", runtime.GOOS)
	}

	os.Exit(0)
	return nil
}

# M Maintenance Guide

This document explains how the auto-update mechanism works in this application and how to prepare and deploy a new version.

## 1. How the Update Process Works

The update system is a three-way communication between the **Frontend (React)**, the **Go Backend**, and your **Update Server**.

### Update Flow
1. **Check**: The Frontend calls `CheckForUpdate()`. The Backend fetches the `update.json` from the configured **Update URL**.
2. **Compare**: If the version in the JSON is higher than the current app version, it returns the update metadata to the user.
3. **Download**: When the user clicks "Update", the Backend downloads the binary from the provided URL.
4. **Replace & Restart**:
   - **Windows**: Downloads `app.exe.new`, creates a temporary `updater.bat`, and launches it. The batch script waits for the app to close, replaces the `.exe`, and restarts it.
   - **Linux**: Downloads renamed binary, renames the current active binary to `.old`, moves the new one into place, sets execution permissions, and restarts.

---

## 2. Preparing a New Version

To release an update, follow these steps:

### Step A: Build the Binaries
Build the application for your target platforms using Wails:

```bash
# Windows
wails build -platform windows/amd64

# Linux
wails build -platform linux/amd64
```

### Step B: Build and Upload Automatically
A PowerShell script is provided to automate the build, upload, and generation of `update.json`. Ensure you have populated your `.env` file with the correct FTP credentials, then run:

```powershell
# From the project root
.\scripts\deploy_update.ps1 -Description "Critical bug fixes and performance improvements."
```
This script will:
1. Parse `AppVersion` from `internal/services/update_service.go`
2. Build the Windows executable
3. Upload `MWinPOS-vX.X.X.exe` via FTP
4. Generate `update.json` locally and upload it via FTP

### Customizing the Download URL
If the publicly accessible HTTP URL is different from `https://{FTP_HOST}{FTP_DIR}`, you can define `DOWNLOAD_BASE_URL` in your `.env` file, for example:
`DOWNLOAD_BASE_URL=https://nuget.moltothailand.com/erpnext`

> [!IMPORTANT]
> The `version` string in the JSON must be higher than the current version defined in your Go code (check `AppVersion` in `app.go`) for the app to trigger the update notification.

## 3. Configuration
The **Update URL** can be configured in the application:
1. Go to **Settings** -> **Connectivity**.
2. Update the **Update Endpoint** field.
3. Click **Save**.

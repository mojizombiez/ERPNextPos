param (
    [string]$Description = "Auto-deployed update with bug fixes and improvements.",
    [ValidateSet("windows", "linux")]
    [string]$TargetOS = "windows"
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

Write-Host "Starting deployment process..."

# 1. Read the current version from the Go code
$versionFile = Join-Path $projectRoot "internal\services\update_service.go"
$version = $null

if (Test-Path $versionFile) {
    $content = Get-Content $versionFile
    foreach ($line in $content) {
        if ($line -match 'const AppVersion\s*=\s*"(.*?)"') {
            $version = $matches[1]
            break
        }
    }
}

if ([string]::IsNullOrWhiteSpace($version)) {
    Write-Host "ERROR: Could not find AppVersion in update_service.go." -ForegroundColor Red
    exit 1
}

Write-Host "Detected version: v$version" -ForegroundColor Cyan

# 2. Build the application
Write-Host "Building application via Wails..." -ForegroundColor Yellow
$process = Start-Process -FilePath "wails" -ArgumentList "build","-platform","windows/amd64" -NoNewWindow -Wait -PassThru

if ($process.ExitCode -ne 0) {
   Write-Host "ERROR: Build failed with Exit Code $($process.ExitCode)." -ForegroundColor Red
   exit 1
}

$buildBinary = Join-Path $projectRoot "build\bin\GoProject.exe"
if (!(Test-Path $buildBinary)) {
    Write-Host "ERROR: Build binary not found at $buildBinary." -ForegroundColor Red
    exit 1
}

# 3. Load FTP Credentials from .env
$envFile = Join-Path $projectRoot ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#]\S*?)\s*=\s*(.*)$') {
            Set-Item -Path "env:\$($matches[1])" -Value $matches[2]
        }
    }
} else {
    Write-Host "ERROR: .env file not found." -ForegroundColor Red
    exit 1
}

$ftpHost = $env:FTP_HOST -replace '^"|"$', ''
$ftpUser = $env:FTP_USER -replace '^"|"$', ''
$ftpPass = $env:FTP_PASSWORD -replace '^"|"$', ''
if ($TargetOS -eq "windows") {
    $ftpDir = $env:FTP_DIR_WINDOWS -replace '^"|"$', ''
    $downloadBaseUrl = $env:DOWNLOAD_BASE_URL_WINDOWS -replace '^"|"$', ''
} else {
    $ftpDir = $env:FTP_DIR_LINUX -replace '^"|"$', ''
    $downloadBaseUrl = $env:DOWNLOAD_BASE_URL_LINUX -replace '^"|"$', ''
}

# We will guess the download URL based on FTP host, assuming it serves HTTP
if ([string]::IsNullOrWhiteSpace($downloadBaseUrl)) {
    $downloadBaseUrl = "https://$ftpHost$ftpDir"
}

if ([string]::IsNullOrWhiteSpace($ftpHost) -or [string]::IsNullOrWhiteSpace($ftpUser)) {
    Write-Host "ERROR: Missing FTP credentials in .env file." -ForegroundColor Red
    exit 1
}

if (!$ftpDir.StartsWith("/")) {
    $ftpDir = "/$ftpDir"
}
if (!$ftpDir.EndsWith("/")) {
    $ftpDir = "$ftpDir/"
}

# Ensure directory exists
$dirUrl = "ftp://$ftpHost$ftpDir"
Write-Host "Ensuring directory $dirUrl exists..." -ForegroundColor Yellow
$dirReq = [System.Net.FtpWebRequest]::Create($dirUrl)
$dirReq.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
$dirReq.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
try {
    $dirReq.GetResponse().Close()
    Write-Host "Created directory $ftpDir" -ForegroundColor Green
} catch {
    # It might already exist, which is fine
}

# 4. Upload the Binary
if ($TargetOS -eq "windows") {
    $uploadFileName = "MWinPOS-v$version.exe"
} else {
    $uploadFileName = "MWinPOS-v$version-linux"
}

$ftpUrlBinary = "ftp://$ftpHost${ftpDir}$uploadFileName"

Write-Host "Uploading binary to $ftpUrlBinary..." -ForegroundColor Yellow

$webClient = New-Object System.Net.WebClient
$webClient.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)

try {
    $webClient.UploadFile($ftpUrlBinary, $buildBinary)
    Write-Host "Binary uploaded successfully." -ForegroundColor Green
} catch {
    Write-Host "ERROR uploading binary: $_" -ForegroundColor Red
    exit 1
}

# 5. Create and Upload update.json
$updateJsonPath = Join-Path $projectRoot "update.json"
$downloadUrl = "$downloadBaseUrl/$uploadFileName"

$updateData = @{
    version = $version
    url = $downloadUrl
    description = $Description
}

$jsonString = $updateData | ConvertTo-Json
[System.IO.File]::WriteAllText($updateJsonPath, $jsonString)

$ftpUrlJson = "ftp://$ftpHost${ftpDir}update.json"
Write-Host "Uploading update.json to $ftpUrlJson..." -ForegroundColor Yellow

try {
    $webClient.UploadFile($ftpUrlJson, $updateJsonPath)
    Write-Host "update.json uploaded successfully." -ForegroundColor Green
} catch {
    Write-Host "ERROR uploading update.json: $_" -ForegroundColor Red
    exit 1
}

Write-Host "Deployment completed successfully! Version v$version is now live." -ForegroundColor Green

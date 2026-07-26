# Tu Farmacia native — build + install debug APK
# Usage (from repo root or this folder):
#   .\pharmacy-ecommerce\apps\android-native\scripts\install-debug.ps1
#   .\install-debug.ps1 -SkipBuild
#   .\install-debug.ps1 -Serial emulator-5554

param(
    [switch]$SkipBuild,
    [string]$Serial = ""
)

$ErrorActionPreference = "Stop"
$AppRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$Apk = Join-Path $AppRoot "app\build\outputs\apk\debug\app-debug.apk"
$Package = "cl.tufarmacia.native"

function Find-Adb {
    $candidates = @(
        (Get-Command adb -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source),
        "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe",
        "$env:ANDROID_HOME\platform-tools\adb.exe",
        "$env:ANDROID_SDK_ROOT\platform-tools\adb.exe",
        "C:\Android\platform-tools\adb.exe",
        "D:\Android\Sdk\platform-tools\adb.exe"
    ) | Where-Object { $_ -and (Test-Path $_) }
    if ($candidates) { return $candidates[0] }
    return $null
}

$adb = Find-Adb
if (-not $adb) {
    Write-Host @"
[ERROR] adb.exe not found.

Install Android SDK Platform-Tools, then either:
  1) Add to PATH:  %LOCALAPPDATA%\Android\Sdk\platform-tools
  2) Or set ANDROID_HOME to your SDK root

Checklist: see SIDELOAD.md next to this script.
"@ -ForegroundColor Red
    exit 1
}

Write-Host "[ok] adb: $adb"

if (-not $SkipBuild) {
    Write-Host "[build] :app:assembleDebug …"
    Push-Location $AppRoot
    try {
        & .\gradlew.bat :app:assembleDebug --no-daemon
        if ($LASTEXITCODE -ne 0) { throw "Gradle assembleDebug failed ($LASTEXITCODE)" }
    } finally {
        Pop-Location
    }
}

if (-not (Test-Path $Apk)) {
    Write-Host "[ERROR] APK missing: $Apk" -ForegroundColor Red
    exit 1
}

$sizeMb = [math]::Round((Get-Item $Apk).Length / 1MB, 1)
Write-Host "[ok] APK $sizeMb MB → $Apk"

$adbArgs = @()
if ($Serial) { $adbArgs += @("-s", $Serial) }

Write-Host "[device] adb devices"
& $adb @adbArgs devices

$out = & $adb @adbArgs devices | Out-String
if ($out -notmatch "\tdevice\b") {
    Write-Host @"
[ERROR] No device in 'device' state.

Checklist:
  - USB debugging ON (Developer options)
  - Accept RSA fingerprint on phone
  - Cable / wireless: adb connect IP:5555
  - For wireless: pair first (Android 11+)

See SIDELOAD.md
"@ -ForegroundColor Red
    exit 1
}

Write-Host "[install] $Package (replace existing)"
& $adb @adbArgs install -r $Apk
if ($LASTEXITCODE -ne 0) {
    Write-Host "[warn] install -r failed; trying uninstall + install" -ForegroundColor Yellow
    & $adb @adbArgs uninstall $Package 2>$null
    & $adb @adbArgs install $Apk
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "[launch] $Package"
& $adb @adbArgs shell monkey -p $Package -c android.intent.category.LAUNCHER 1 2>$null

Write-Host "[done] installed + launched $Package" -ForegroundColor Green

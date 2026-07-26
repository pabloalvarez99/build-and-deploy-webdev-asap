# Tu Farmacia native — build + install debug APK
# Usage (from repo root or this folder):
#   .\pharmacy-ecommerce\apps\android-native\scripts\install-debug.ps1
#   .\install-debug.ps1 -SkipBuild
#   .\install-debug.ps1 -Serial emulator-5554

param(
    [switch]$SkipBuild,
    [string]$Serial = "",
    # Hyper-V often reserves 5037 (range 5018-5117). Use a free port.
    [int]$AdbPort = 15037,
    [switch]$StartEmulator,
    [string]$Avd = "rutbusiness",
    # Emulator console port (even). 5554 is often Hyper-V-blocked (5533-5632).
    [int]$EmuPort = 6000
)

$ErrorActionPreference = "Stop"
$AppRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$Apk = Join-Path $AppRoot "app\build\outputs\apk\debug\app-debug.apk"
$Package = "cl.tufarmacia.native"
$Activity = "cl.tufarmacia.native/cl.tufarmacia.app.MainActivity"

function Find-Adb {
    $candidates = @(
        (Get-Command adb -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source),
        "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe",
        "$env:USERPROFILE\Android\Sdk\platform-tools\adb.exe",
        "$env:ANDROID_HOME\platform-tools\adb.exe",
        "$env:ANDROID_SDK_ROOT\platform-tools\adb.exe",
        "C:\Android\platform-tools\adb.exe",
        "D:\Android\Sdk\platform-tools\adb.exe"
    ) | Where-Object { $_ -and (Test-Path $_) }
    if ($candidates) { return $candidates[0] }
    return $null
}

function Find-Emulator {
    $candidates = @(
        "$env:ANDROID_HOME\emulator\emulator.exe",
        "$env:USERPROFILE\Android\Sdk\emulator\emulator.exe",
        "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe"
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

$env:ANDROID_ADB_SERVER_PORT = "$AdbPort"
Write-Host "[ok] adb: $adb (server port $AdbPort)"
& $adb -P $AdbPort start-server | Out-Null

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

function Get-DeviceSerial {
    $lines = & $adb -P $AdbPort devices | Where-Object { $_ -match "\tdevice$" }
    if ($Serial) { return $Serial }
    # prefer emulator-* over 127.0.0.1 duplicates
    $emu = $lines | Where-Object { $_ -match "^emulator-" } | Select-Object -First 1
    if ($emu) { return ($emu -split "\s+")[0] }
    if ($lines) { return ($lines[0] -split "\s+")[0] }
    return $null
}

Write-Host "[device] adb devices"
& $adb -P $AdbPort devices

$serialNow = Get-DeviceSerial
if (-not $serialNow -and $StartEmulator) {
    $emuBin = Find-Emulator
    if (-not $emuBin) {
        Write-Host "[ERROR] emulator.exe not found; cannot -StartEmulator" -ForegroundColor Red
        exit 1
    }
    Write-Host "[emu] starting AVD=$Avd consolePort=$EmuPort (adb=$($EmuPort+1))"
    Start-Process -FilePath $emuBin -ArgumentList @(
        "-avd", $Avd, "-port", "$EmuPort",
        "-netdelay", "none", "-netspeed", "full", "-no-snapshot-save"
    ) -WindowStyle Normal
    $deadline = (Get-Date).AddMinutes(5)
    do {
        Start-Sleep 5
        & $adb -P $AdbPort connect "127.0.0.1:$($EmuPort+1)" 2>$null | Out-Null
        $serialNow = Get-DeviceSerial
        Write-Host "[wait] devices: $((& $adb -P $AdbPort devices | Out-String).Trim())"
    } while (-not $serialNow -and (Get-Date) -lt $deadline)
}

$serialNow = Get-DeviceSerial
if (-not $serialNow) {
    Write-Host @"
[ERROR] No device in 'device' state.

Tips on this machine (Hyper-V port exclusions):
  - adb server cannot bind 5037 → use -AdbPort 15037 (default)
  - emulator -port 5554 often blocked → use -EmuPort 6000
  - Start emulator: .\install-debug.ps1 -StartEmulator
  - USB phone: enable debugging, accept RSA

See SIDELOAD.md
"@ -ForegroundColor Red
    exit 1
}

$adbArgs = @("-P", "$AdbPort", "-s", $serialNow)
Write-Host "[ok] serial=$serialNow"

# wait boot if emulator
$bootDeadline = (Get-Date).AddMinutes(2)
do {
    $boot = (& $adb @adbArgs shell getprop sys.boot_completed 2>$null | Out-String).Trim()
    if ($boot -eq "1") { break }
    Start-Sleep 3
} while ((Get-Date) -lt $bootDeadline)

Write-Host "[install] $Package (replace existing)"
& $adb @adbArgs install -r $Apk
if ($LASTEXITCODE -ne 0) {
    Write-Host "[warn] install -r failed; trying uninstall + install" -ForegroundColor Yellow
    & $adb @adbArgs uninstall $Package 2>$null
    & $adb @adbArgs install $Apk
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "[launch] $Activity"
& $adb @adbArgs shell am start -n $Activity
Start-Sleep 2
$pidOf = (& $adb @adbArgs shell pidof $Package 2>$null | Out-String).Trim()
Write-Host "[done] installed + launched $Package pid=$pidOf" -ForegroundColor Green

# Sideload checklist — Tu Farmacia Android nativo

**Package:** `cl.tufarmacia.native`  
**Debug APK:** `app/build/outputs/apk/debug/app-debug.apk`

## 1. One-command install (recommended)

From repo root (PowerShell):

```powershell
.\pharmacy-ecommerce\apps\android-native\scripts\install-debug.ps1
```

Skip rebuild if APK already built:

```powershell
.\pharmacy-ecommerce\apps\android-native\scripts\install-debug.ps1 -SkipBuild
```

Specific device / emulator:

```powershell
.\pharmacy-ecommerce\apps\android-native\scripts\install-debug.ps1 -Serial emulator-5554
```

Git Bash / WSL:

```bash
./pharmacy-ecommerce/apps/android-native/scripts/install-debug.sh
```

## 2. Prerequisites

| Item | How |
|------|-----|
| Android SDK Platform-Tools | Android Studio → SDK Manager → Platform-Tools |
| `adb` on PATH | `%LOCALAPPDATA%\Android\Sdk\platform-tools` |
| Or env | `ANDROID_HOME` / `ANDROID_SDK_ROOT` = SDK root |
| JDK 17 | used by Gradle wrapper |

Verify:

```powershell
adb version
adb devices
```

## 3. Device setup

1. **Developer options** → enable **USB debugging**
2. Connect USB (file transfer mode, not charge-only)
3. Accept **Allow USB debugging?** (RSA fingerprint) on phone
4. Confirm: `adb devices` shows `device` (not `unauthorized` / `offline`)

### Wireless debugging (Android 11+)

```text
Developer options → Wireless debugging → Pair device with pairing code
adb pair IP:PORT
adb connect IP:PORT
adb devices
```

## 4. Manual install

```powershell
cd pharmacy-ecommerce\apps\android-native
.\gradlew.bat :app:assembleDebug --no-daemon
adb install -r app\build\outputs\apk\debug\app-debug.apk
adb shell monkey -p cl.tufarmacia.native -c android.intent.category.LAUNCHER 1
```

## 5. Common failures

| Symptom | Fix |
|---------|-----|
| `adb` not recognized | Add `platform-tools` to PATH; reopen terminal |
| `unauthorized` | Unlock phone, re-accept RSA; `adb kill-server` then `adb devices` |
| `INSTALL_FAILED_UPDATE_INCOMPATIBLE` | Uninstall store/TWA clash if any, or `adb uninstall cl.tufarmacia.native` |
| `INSTALL_FAILED_VERSION_DOWNGRADE` | Uninstall old build or bump `versionCode` |
| No devices | Cable, drivers (Google USB), wireless pair |
| Emulator only | `emulator -list-avds` then start AVD from Android Studio |

## 6. Note on TWA vs native

| App | ID |
|-----|-----|
| Bubblewrap TWA (web shell) | `cl.tufarmacia.app` |
| Native Compose ERP | `cl.tufarmacia.native` |

Both can be installed at once; they do not overwrite each other.

## 7. Login on device

Staff ERP needs Firebase account with admin/owner role on **tu-farmacia.cl** (same as web `/admin`).

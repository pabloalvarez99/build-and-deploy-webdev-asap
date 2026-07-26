#!/usr/bin/env bash
# Tu Farmacia native — build + install debug APK
# Usage:
#   ./scripts/install-debug.sh
#   ./scripts/install-debug.sh --skip-build
#   ./scripts/install-debug.sh -s emulator-5554

set -euo pipefail
APP_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APK="$APP_ROOT/app/build/outputs/apk/debug/app-debug.apk"
PACKAGE="cl.tufarmacia.native"
SKIP_BUILD=0
SERIAL=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-build) SKIP_BUILD=1; shift ;;
    -s|--serial) SERIAL="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

find_adb() {
  if command -v adb >/dev/null 2>&1; then command -v adb; return; fi
  for c in \
    "${ANDROID_HOME:-}/platform-tools/adb" \
    "${ANDROID_SDK_ROOT:-}/platform-tools/adb" \
    "$HOME/AppData/Local/Android/Sdk/platform-tools/adb.exe" \
    "/c/Users/$USER/AppData/Local/Android/Sdk/platform-tools/adb.exe"
  do
    [[ -n "$c" && -x "$c" ]] && { echo "$c"; return; }
  done
  return 1
}

ADB="$(find_adb)" || {
  cat <<'EOF' >&2
[ERROR] adb not found. Install SDK Platform-Tools and add to PATH.
See scripts/SIDELOAD.md
EOF
  exit 1
}

echo "[ok] adb: $ADB"
ADB_ARGS=()
[[ -n "$SERIAL" ]] && ADB_ARGS+=(-s "$SERIAL")

if [[ "$SKIP_BUILD" -eq 0 ]]; then
  echo "[build] assembleDebug …"
  (cd "$APP_ROOT" && ./gradlew :app:assembleDebug --no-daemon)
fi

[[ -f "$APK" ]] || { echo "[ERROR] missing $APK" >&2; exit 1; }
echo "[ok] APK $(du -h "$APK" | cut -f1)"

"$ADB" "${ADB_ARGS[@]}" devices
if ! "$ADB" "${ADB_ARGS[@]}" devices | grep -qE $'\tdevice$'; then
  cat <<'EOF' >&2
[ERROR] No device ready. Enable USB debugging / accept RSA / adb connect.
See scripts/SIDELOAD.md
EOF
  exit 1
fi

echo "[install] $PACKAGE"
if ! "$ADB" "${ADB_ARGS[@]}" install -r "$APK"; then
  "$ADB" "${ADB_ARGS[@]}" uninstall "$PACKAGE" || true
  "$ADB" "${ADB_ARGS[@]}" install "$APK"
fi

"$ADB" "${ADB_ARGS[@]}" shell monkey -p "$PACKAGE" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1 || true
echo "[done] installed + launched $PACKAGE"

# Tu Farmacia — Android Native (KMP)

Kotlin Multiplatform **shared** API/auth core + Jetpack Compose **composeApp**.

- Application ID: `cl.tufarmacia.native`
- API: `https://tu-farmacia.cl`
- Existing TWA shell remains in `../android` (`cl.tufarmacia.app`)

## Build

```bash
cd pharmacy-ecommerce/apps/android-native
./gradlew :composeApp:assembleDebug
```

APK: `composeApp/build/outputs/apk/debug/composeApp-debug.apk`

Requires Android SDK (`local.properties` → `sdk.dir`).

## Phase 1 features

- Home shell + bottom navigation
- Catalog list/search against production API
- Firebase email/password login (Identity Toolkit REST)
- Bearer token on authenticated routes (`/api/auth/me`)
- Admin tab placeholder for staff roles

## Project layout

```
shared/          commonMain API + Firebase Auth REST + models
composeApp/      Android UI (Compose Material 3)
```

iOS target can be added later to `shared` (Approach C).

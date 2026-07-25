# Tu Farmacia — Android nativo (Kotlin)

Pure Android **Kotlin + Jetpack Compose**. Separate natives path (iOS later = Swift only).

| | |
|--|--|
| Application ID | `cl.tufarmacia.native` |
| API | `https://tu-farmacia.cl` |
| Auth | Firebase Identity Toolkit + `Authorization: Bearer` |

## Features (current) — v0.2.1

- Home + top sellers + track shortcut
- Catalog: search, category chips, infinite scroll
- Product detail + add to cart
- Cart (DataStore) + qty + store pickup checkout
- Loyalty points on account + redeem at checkout
- Login / register / session restore
- My orders + order detail
- Public tracking by token
- Admin: orders filter/search + low-stock list

## Build

```bash
cd pharmacy-ecommerce/apps/android-native
./gradlew :app:assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

## Layout

```
app/src/main/kotlin/cl/tufarmacia/app/
  MainActivity.kt
  data/api|auth|cart|model
  ui/screens|theme
  util/Money.kt
```

## Learning / iOS

iOS = separate SwiftUI project using `docs/mobile/api-contract.md`. No shared code.

# Tu Farmacia — Android nativo (Kotlin)

**Separate natives learning path:** this is a **pure Android** app.  
iOS will be a **separate** Swift/SwiftUI project later — no shared KMP module.

| | |
|--|--|
| Application ID | `cl.tufarmacia.native` |
| Language | **Kotlin only** |
| UI | Jetpack Compose + Material 3 |
| Network | Ktor + OkHttp |
| Auth | Firebase Identity Toolkit REST + Bearer on API |
| Backend | `https://tu-farmacia.cl` |
| Old TWA (website shell) | `../android` — leave alone |

## Project layout (classic Android)

```
android-native/
  app/
    src/main/
      AndroidManifest.xml
      kotlin/cl/tufarmacia/app/
        MainActivity.kt          # entry
        TuFarmaciaApp.kt         # Application + DI container
        data/
          api/                   # TuFarmaciaApi, errors
          auth/                  # Firebase login, session
          model/                 # DTOs
          AppContainer.kt
          DataStoreSessionStore.kt
        ui/
          theme/
          screens/               # Compose screens
          AppViewModel.kt
          TuFarmaciaRoot.kt      # NavHost
      res/
  build.gradle.kts
  settings.gradle.kts            # only :app
```

## Build & install

```bash
cd pharmacy-ecommerce/apps/android-native
./gradlew :app:assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

## Learning map (separate natives)

### Android (this repo) — study order
1. `MainActivity` + Compose `setContent`
2. Navigation (`TuFarmaciaRoot`)
3. `AppViewModel` + `StateFlow` (UI state)
4. `TuFarmaciaApi` (HTTP + JSON)
5. `FirebaseAuthApi` + `SessionRepository` (tokens)
6. Screens: Catalog, Login, Account

### iOS (future, different folder)
- Xcode project, Swift + SwiftUI  
- Same API contract: `docs/mobile/api-contract.md`  
- Same Bearer auth + Firebase REST  
- **No code sharing** with this Android app — you reimplement deliberately to learn

### Shared only by contract (not code)
- `pharmacy-ecommerce/docs/mobile/api-contract.md`
- Production REST + Firebase project `tu-farmacia-prod`

## Why this shape for learning
- One language per platform (Kotlin here, Swift later)
- Standard single-module Android studio layout
- No multiplatform abstractions hiding Android APIs
- Real production backend, real native UI

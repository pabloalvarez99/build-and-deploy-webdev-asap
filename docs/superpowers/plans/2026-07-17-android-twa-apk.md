# App Android TWA (APK) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generar APK Android instalable (sideload) de tu-farmacia.cl vía TWA/Bubblewrap, fullscreen verificada con Digital Asset Links.

**Architecture:** TWA = Chrome fullscreen cargando https://tu-farmacia.cl. PWA ya desplegada (manifest.json estático en `public/`, icons 200, sw.js con offline+push, PWARegister en layout). Lo que falta: keystore de firma, assetlinks.json con SHA-256 real, tooling Android en máquina, proyecto Bubblewrap en `pharmacy-ecommerce/apps/android/`, build de APK firmada.

**Tech Stack:** Bubblewrap CLI, JDK 21 (ya instalado), Android SDK cmdline-tools + platform 34, keytool, Vercel (assetlinks deploy via git push).

## Global Constraints

- `applicationId`/`packageId`: `cl.tufarmacia.app` (ya está en `public/.well-known/assetlinks.json` — no cambiar).
- Keystore NUNCA dentro del repo. Ubicación: `C:\Users\Administrator\keys\tu-farmacia.keystore`.
- theme_color real en producción: `#0891b2` (cyan — ver `public/manifest.json`; el viejo emerald `#059669` fue reemplazado).
- Build web SIEMPRE: `cd pharmacy-ecommerce/apps/web && NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build`. NUNCA `npx next build`.
- Deploy = `git push origin main` → Vercel auto-deploy.
- Bash paths Unix (`/c/Users/Administrator/...`). Trabajar en Git Bash.
- MSYS rompe refs `origin/main:path` — ante duda usar `MSYS_NO_PATHCONV=1`.
- Bitácora dual: al final, append en `pharmacy-ecommerce/bitacora.md` Y `C:/Users/Administrator/Documents/obsidian-mind/work/active/tu-farmacia/bitacora.md`, luego actualizar `erp-log-index.md`.
- No hay tests unitarios aplicables (infra/tooling) — verificación = comandos con output esperado + prueba en dispositivo físico.

## Estado ya verificado (NO repetir)

- `https://tu-farmacia.cl/manifest.json` → 200, sirve el estático `public/manifest.json` (icons any+maskable, shortcuts, `id: "/"`).
- `/icon-192.png`, `/icon-512.png`, `/icon-512-maskable.png`, `/sw.js`, `/.well-known/assetlinks.json` → todos 200.
- `src/components/PWARegister.tsx` registra `/sw.js`; `/offline` page existe; middleware excluye `sw.js`/`manifest.json`.
- `public/.well-known/assetlinks.json` existe con placeholders `REPLACE_WITH_LOCAL_KEYSTORE_SHA256` y `REPLACE_WITH_PLAY_APP_SIGNING_SHA256`.
- Java 21.0.11 en PATH. `JAVA_HOME`/`ANDROID_HOME` vacíos. Bubblewrap NO instalado. Android SDK NO encontrado.
- `src/app/manifest.ts` existe pero es DEAD CODE (el estático `public/manifest.json` gana en producción — verificado con curl).

---

### Task 1: Eliminar `src/app/manifest.ts` (dead code, fuente de verdad duplicada)

**Files:**
- Delete: `pharmacy-ecommerce/apps/web/src/app/manifest.ts`

**Interfaces:**
- Produces: una sola fuente de manifest = `public/manifest.json` (los Tasks 5-6 apuntan Bubblewrap a `https://tu-farmacia.cl/manifest.json`).

- [ ] **Step 1: Borrar archivo**

```bash
cd /c/GitHub/build-and-deploy-webdev-asap  # ajustar: raíz del repo = D:\GitHub\build-and-deploy-webdev-asap
git rm pharmacy-ecommerce/apps/web/src/app/manifest.ts
```

Nota: en esta máquina la ruta bash es `/d/GitHub/build-and-deploy-webdev-asap` (disco D:). Verificar con `pwd` antes.

- [ ] **Step 2: Build local verifica que nada referencia manifest.ts**

```bash
cd pharmacy-ecommerce/apps/web
NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build
```

Expected: `✓ Compiled successfully`, sin errores de tipo ni rutas faltantes. (El `<link rel="manifest" href="/manifest.json">` en `layout.tsx:127` apunta a URL, no al módulo — no se rompe.)

- [ ] **Step 3: Commit + push**

```bash
cd /d/GitHub/build-and-deploy-webdev-asap
git add -A
git commit -m "chore: eliminar src/app/manifest.ts (dead code — public/manifest.json es la fuente servida)"
git push origin main
```

---

### Task 2: Instalar Android SDK + Bubblewrap

**Files:**
- Create (fuera del repo): `C:\Users\Administrator\Android\Sdk\cmdline-tools\latest\`

**Interfaces:**
- Produces: `sdkmanager`/`adb` en `C:\Users\Administrator\Android\Sdk`, `bubblewrap` en PATH global npm. Tasks 3-6 los consumen.

- [ ] **Step 1: Descargar command-line tools**

```bash
mkdir -p /c/Users/Administrator/Android/Sdk/cmdline-tools
cd /c/Users/Administrator/Android/Sdk/cmdline-tools
curl -L -o cmdtools.zip https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip
unzip -q cmdtools.zip
mv cmdline-tools latest
rm cmdtools.zip
```

Expected: existe `/c/Users/Administrator/Android/Sdk/cmdline-tools/latest/bin/sdkmanager.bat`.

- [ ] **Step 2: Instalar platform, build-tools, platform-tools + aceptar licencias**

```bash
export ANDROID_HOME="/c/Users/Administrator/Android/Sdk"
SDKMANAGER="$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager.bat"
yes | "$SDKMANAGER" --sdk_root="$ANDROID_HOME" --licenses
"$SDKMANAGER" --sdk_root="$ANDROID_HOME" "platforms;android-34" "build-tools;34.0.0" "platform-tools"
```

Expected final: `Installed Build Tools revision 34.0.0`, `Installed Android Platform 34`. (En Git Bash `yes |` alimenta los prompts de licencia.)

- [ ] **Step 3: Persistir ANDROID_HOME para sesiones futuras**

```powershell
# En PowerShell (una sola vez):
setx ANDROID_HOME "C:\Users\Administrator\Android\Sdk"
```

Expected: `SUCCESS: Specified value was saved.`

- [ ] **Step 4: Instalar Bubblewrap**

```bash
npm install -g @bubblewrap/cli
bubblewrap doctor
```

Expected: doctor reporta JDK encontrado y Android SDK (puede pedir paths — pasar `C:\Users\Administrator\Android\Sdk` y el java del PATH). Si doctor reclama versión JDK: Bubblewrap soporta JDK 17+; con JDK 21 y Gradle del template actual funciona — si el build (Task 6) falla por versión Java, instalar JDK 17: `winget install Microsoft.OpenJDK.17` y apuntar `JAVA_HOME` ahí.

---

### Task 3: Generar keystore + extraer SHA-256

**Files:**
- Create (fuera del repo): `C:\Users\Administrator\keys\tu-farmacia.keystore`

**Interfaces:**
- Produces: keystore (alias `tu-farmacia`) + fingerprint SHA-256 → consumido por Task 4 (assetlinks) y Task 5 (`twa-manifest.json.signingKey`).

- [ ] **Step 1: Generar keystore**

```bash
mkdir -p /c/Users/Administrator/keys
keytool -genkeypair -v \
  -keystore /c/Users/Administrator/keys/tu-farmacia.keystore \
  -alias tu-farmacia -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass <PASSWORD> -keypass <PASSWORD> \
  -dname "CN=Tu Farmacia, OU=Dev, O=Tu Farmacia, L=Coquimbo, ST=Coquimbo, C=CL"
```

`<PASSWORD>`: generar una fuerte (ej. `openssl rand -base64 24`) y guardarla en gestor de contraseñas del usuario. NO commitearla. El usuario la anota — necesaria en cada build de release.

- [ ] **Step 2: Backup del keystore (crítico — perderlo = no poder actualizar la app jamás)**

```bash
cp /c/Users/Administrator/keys/tu-farmacia.keystore /c/Users/Administrator/keys/tu-farmacia.keystore.bak
```

Avisar al usuario: copiar también a un segundo medio (USB/nube privada).

- [ ] **Step 3: Extraer SHA-256**

```bash
keytool -list -v -keystore /c/Users/Administrator/keys/tu-farmacia.keystore \
  -alias tu-farmacia -storepass <PASSWORD> | grep "SHA256:"
```

Expected output formato: `SHA256: AA:BB:CC:...:FF` (32 bytes hex separados por `:`). Copiar ese string exacto → variable `SHA256_FP` para Task 4.

---

### Task 4: assetlinks.json con fingerprint real → deploy

**Files:**
- Modify: `pharmacy-ecommerce/apps/web/public/.well-known/assetlinks.json`

**Interfaces:**
- Consumes: `SHA256_FP` de Task 3 Step 3.
- Produces: `https://tu-farmacia.cl/.well-known/assetlinks.json` válido — Task 7 lo verifica desde Android.

- [ ] **Step 1: Escribir archivo con fingerprint real**

Contenido final exacto (reemplazar `AA:BB:...:FF` por `SHA256_FP`; el placeholder de Play se deja fuera hasta tener la consola):

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "cl.tufarmacia.app",
      "sha256_cert_fingerprints": [
        "AA:BB:CC:...:FF"
      ]
    }
  }
]
```

- [ ] **Step 2: Build local + commit + push**

```bash
cd /d/GitHub/build-and-deploy-webdev-asap/pharmacy-ecommerce/apps/web
NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build
cd /d/GitHub/build-and-deploy-webdev-asap
git add pharmacy-ecommerce/apps/web/public/.well-known/assetlinks.json
git commit -m "feat(android): assetlinks.json con SHA-256 del keystore local — TWA fullscreen"
git push origin main
```

- [ ] **Step 3: Verificar deploy (esperar ~1 min a Vercel)**

```bash
curl -s https://tu-farmacia.cl/.well-known/assetlinks.json
curl -s "https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://tu-farmacia.cl&relation=delegate_permission/common.handle_all_urls"
```

Expected: primer curl muestra el SHA-256 real; segundo curl devuelve JSON con `"package_name": "cl.tufarmacia.app"` y el fingerprint (Google indexa el statement — puede tardar minutos; si falla, reintentar tras 5 min).

---

### Task 5: Proyecto TWA con Bubblewrap en `pharmacy-ecommerce/apps/android/`

**Files:**
- Create: `pharmacy-ecommerce/apps/android/` (proyecto generado)
- Create: `pharmacy-ecommerce/apps/android/.gitignore`

**Interfaces:**
- Consumes: manifest servido en producción (Task 1), SDK+bubblewrap (Task 2), keystore+alias (Task 3).
- Produces: `twa-manifest.json` definitivo + proyecto Gradle — Task 6 ejecuta `bubblewrap build`.

- [ ] **Step 1: Init interactivo**

```bash
cd /d/GitHub/build-and-deploy-webdev-asap/pharmacy-ecommerce/apps
mkdir android && cd android
bubblewrap init --manifest https://tu-farmacia.cl/manifest.json
```

Respuestas a prompts:
- Application ID: `cl.tufarmacia.app`
- (el resto se corrige en Step 2 editando `twa-manifest.json` — init es interactivo y sus defaults se sobrescriben ahí)

- [ ] **Step 2: Fijar `twa-manifest.json` exacto**

Editar `pharmacy-ecommerce/apps/android/twa-manifest.json` para que contenga (campos clave; conservar `generatorApp`, `webManifestUrl`, `shortcuts` generados):

```json
{
  "packageId": "cl.tufarmacia.app",
  "host": "tu-farmacia.cl",
  "name": "Tu Farmacia",
  "launcherName": "Tu Farmacia",
  "display": "standalone",
  "orientation": "portrait",
  "themeColor": "#0891b2",
  "navigationColor": "#000000",
  "backgroundColor": "#ffffff",
  "startUrl": "/",
  "iconUrl": "https://tu-farmacia.cl/icon-512.png",
  "maskableIconUrl": "https://tu-farmacia.cl/icon-512-maskable.png",
  "appVersionName": "1.0.0",
  "appVersionCode": 1,
  "minSdkVersion": 21,
  "fallbackType": "customtabs",
  "enableNotifications": false,
  "signingKey": {
    "path": "C:\\Users\\Administrator\\keys\\tu-farmacia.keystore",
    "alias": "tu-farmacia"
  },
  "webManifestUrl": "https://tu-farmacia.cl/manifest.json"
}
```

Notas: `enableNotifications: false` (push es fase futura; evita dependencia FCM/google-services.json). `fallbackType: customtabs` → si falla verificación assetlinks, abre como Custom Tab en vez de WebView.

- [ ] **Step 3: `.gitignore` del proyecto Android**

Crear `pharmacy-ecommerce/apps/android/.gitignore`:

```
app/build/
.gradle/
local.properties
*.keystore
*.jks
*.apk
*.aab
app-release*.apk
```

---

### Task 6: Build APK firmada

**Files:**
- Produce (no commitear): `pharmacy-ecommerce/apps/android/app/build/outputs/apk/release/app-release-signed.apk` (o `app-release-unsigned.apk` + `bubblewrap` firma según versión)

- [ ] **Step 1: Build**

```bash
cd /d/GitHub/build-and-deploy-webdev-asap/pharmacy-ecommerce/apps/android
bubblewrap build
```

Prompts: pedirá password del keystore (la de Task 3) y puede ofrecer instalar JDK/SDK — ya están (Task 2). Expected final: `BUILD SUCCESSFUL` y ruta al APK firmado.

Si falla con error de versión Java/Gradle → fallback documentado en Task 2 Step 4 (JDK 17 + JAVA_HOME).

- [ ] **Step 2: Verificar firma del APK**

```bash
"/c/Users/Administrator/Android/Sdk/build-tools/34.0.0/apksigner.bat" verify --print-certs \
  app/build/outputs/apk/release/app-release-signed.apk | grep SHA-256
```

Expected: el SHA-256 del certificado coincide con `SHA256_FP` de Task 3 (mismo string que está en assetlinks.json).

- [ ] **Step 3: Commit proyecto Android + push**

```bash
cd /d/GitHub/build-and-deploy-webdev-asap
git add pharmacy-ecommerce/apps/android
git status   # confirmar que NO entra ningún .keystore/.apk
git commit -m "feat(android): proyecto TWA Bubblewrap — cl.tufarmacia.app v1.0.0"
git push origin main
```

---

### Task 7: Prueba en dispositivo físico + bitácora

**Files:**
- Modify: `pharmacy-ecommerce/bitacora.md`
- Modify (vault): `C:/Users/Administrator/Documents/obsidian-mind/work/active/tu-farmacia/bitacora.md` + `erp-log-index.md`

- [ ] **Step 1: Instalar en dispositivo (usuario: habilitar Depuración USB en el teléfono)**

```bash
ADB="/c/Users/Administrator/Android/Sdk/platform-tools/adb.exe"
"$ADB" devices   # debe listar el dispositivo (autorizar en pantalla del teléfono)
"$ADB" install -r /d/GitHub/build-and-deploy-webdev-asap/pharmacy-ecommerce/apps/android/app/build/outputs/apk/release/app-release-signed.apk
```

Expected: `Success`.

- [ ] **Step 2: Checklist manual en el teléfono (con usuario)**

1. App "Tu Farmacia" abre SIN barra de URL (fullscreen = assetlinks verificado). Si sale barra → revisar Task 4 Step 3 (Google aún no indexa; esperar y reabrir).
2. Navegar catálogo → detalle producto → agregar al carrito.
3. Checkout: iniciar flujo Webpay → abre Transbank (Custom Tab) → cancelar → vuelve a la app a `/checkout/webpay/error`.
4. Checkout retiro en tienda: completa y muestra código de retiro.
5. Login Firebase → `/mis-pedidos` lista pedidos.
6. Modo avión → reabrir → shell offline (`/offline`) aparece (sw.js).

- [ ] **Step 3: Bitácora dual**

Append a `pharmacy-ecommerce/bitacora.md`:

```markdown
## 2026-07-17 — App Android TWA (APK sideload)
- Eliminado src/app/manifest.ts (dead code; public/manifest.json es la fuente servida).
- assetlinks.json con SHA-256 del keystore local → TWA fullscreen verificada.
- Proyecto Bubblewrap en apps/android (packageId cl.tufarmacia.app, v1.0.0, minSdk 21).
- Keystore FUERA del repo (C:\Users\Administrator\keys) con backup.
- APK release firmada generada e instalada en dispositivo físico.
```

Append equivalente en vault `work/active/tu-farmacia/bitacora.md` y agregar línea índice en `erp-log-index.md`.

- [ ] **Step 4: Commit final**

```bash
cd /d/GitHub/build-and-deploy-webdev-asap
git add pharmacy-ecommerce/bitacora.md
git commit -m "docs: bitácora app Android TWA v1.0.0"
git push origin main
```

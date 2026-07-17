# Spec: Tu Farmacia — App Android (TWA, APK sideload)

Fecha: 2026-07-17
Estado: Aprobado por usuario (diseño)

## Objetivo

Convertir tu-farmacia.cl en app Android instalable vía APK (sideload), usando TWA (Trusted Web Activity) generada con Bubblewrap. Tienda para clientes únicamente (catálogo, carrito, checkout Webpay, retiro tienda, mis pedidos). Admin/POS fuera de alcance.

## Decisiones clave

| Decisión | Elección | Razón |
|---|---|---|
| Tecnología | TWA vía Bubblewrap | Cero lógica duplicada (mismo principio que Electron). Push/offline resolubles del lado web después. |
| Distribución | APK primero, Play Store después | Cuenta developer ya comprada; listing queda para fase posterior. |
| Alcance funcional | Solo tienda clientes | Adultos mayores; admin/POS siguen en web/Electron. |
| `applicationId` | `cl.tufarmacia.app` | Dominio invertido estándar. |

## Arquitectura

```
┌─────────────────────┐      HTTPS       ┌──────────────────────────┐
│  App Android (TWA)  │ ───────────────► │  tu-farmacia.cl (Vercel) │
│  Chrome fullscreen  │                  │  Next.js 14 + API routes │
│  package: cl.tufarmacia.app            └──────────────────────────┘
└─────────────────────┘                            │
        verifica                                   │ sirve
        assetlinks                                 ▼
┌─────────────────────────────────────────────────────────┐
│  /.well-known/assetlinks.json  (SHA-256 del keystore)   │
└─────────────────────────────────────────────────────────┘
```

Sin backend nuevo. Sin duplicación de lógica. La app es Chrome en pantalla completa sobre la URL de producción.

## Componentes

### 1. Web app — íconos PWA (`apps/web`)

**Problema actual**: `src/app/manifest.ts` referencia `/icon-192.png` y `/icon-512.png` que NO existen en `public/` → 404, PWA rota.

Cambios:
- Generar `public/icon-192.png` (192×192), `public/icon-512.png` (512×512) desde logo de la farmacia.
- Generar `public/icon-maskable-512.png` (512×512, contenido dentro de safe zone central 80%, fondo `#059669` o blanco sólido — no transparente).
- Fuente de logo: solo existe `public/favicon.ico`. Si no hay SVG/PNG de alta resolución en el repo, generar ícono programático (script con `sharp`: fondo emerald-600 + texto/símbolo) — decisión tomada en implementación tras inspeccionar assets disponibles.
- Actualizar `manifest.ts`: agregar entry maskable (`purpose: 'maskable'`) y campo `id: '/'`.

### 2. Web app — Digital Asset Links (`apps/web`)

- Crear `public/.well-known/assetlinks.json`:
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "cl.tufarmacia.app",
    "sha256_cert_fingerprints": ["<SHA256_DEL_KEYSTORE>"]
  }
}]
```
- Se sirve estático vía Vercel. Content-Type `application/json` (Vercel lo infiere por extensión `.json`).
- El SHA-256 sale del keystore de firma (paso 3). Sin assetlinks válido, la TWA muestra barra de URL — con él, fullscreen incluso sideloaded.
- Deploy a producción ANTES de instalar la APK final para que la verificación pase en el primer arranque.

### 3. Proyecto Android (`pharmacy-ecommerce/apps/android/`)

- Generado con Bubblewrap CLI: `bubblewrap init --manifest https://tu-farmacia.cl/manifest.json`
- `twa-manifest.json` configurado:
  - `packageId`: `cl.tufarmacia.app`
  - `host`: `tu-farmacia.cl`
  - `startUrl`: `/`
  - `display`: `standalone` (fullscreen tras verificación assetlinks)
  - `orientation`: `portrait`
  - `themeColor`: `#059669`, `backgroundColor`: `#ffffff`
  - minSdkVersion 21+
- Commitear: `twa-manifest.json`, proyecto Gradle generado, gradle wrapper.
- `.gitignore` (en `apps/android/`): `app/build/`, `local.properties`, `*.keystore`, `*.jks`, `.gradle/`.

### 4. Firma y build

- Generar keystore UNA vez:
  ```
  keytool -genkeypair -v -keystore tu-farmacia.keystore -alias tu-farmacia -keyalg RSA -keysize 2048 -validity 10000
  ```
- Keystore guardado FUERA del repo (carpeta segura local + backup). NUNCA commiteado.
- Extraer SHA-256: `keytool -list -v -keystore tu-farmacia.keystore -alias tu-farmacia` → va a `assetlinks.json`.
- Build release: `bubblewrap build` → `app-release-signed.apk`.
- Passwords del keystore: archivo local no-versionado o variables de entorno en la máquina de build.

### 5. Prerequisitos máquina de build (verificar al implementar)

- JDK 17
- Android SDK command-line tools + platform 34 + build-tools
- `npm i -g @bubblewrap/cli`
- Bubblewrap doctor (`bubblewrap doctor`) valida entorno al iniciar.

## Flujo de datos

Idéntico al actual: la app consume la web de producción. Auth Firebase, carrito localStorage, Webpay — todo funciona igual que en Chrome móvil. Webpay redirect: Transbank retorna a `tu-farmacia.cl/api/webpay/return` → mismo dominio → permanece dentro de la TWA.

## Manejo de errores

| Caso | Comportamiento |
|---|---|
| Sin internet al abrir | Chrome muestra error estándar (no hay offline aún — fase futura) |
| assetlinks no desplegado aún | App abre con barra de URL visible; se resuelve solo al deployar y re-abrir |
| Link externo (ej. transbank.cl durante pago) | Se abre en Chrome Custom Tab encima; al volver a tu-farmacia.cl retorna a la TWA |
| Webpay cancela/error | Flujo web actual (`/checkout/webpay/error`) — sin cambios |

## Testing

1. Build local web (`next build`) pasa.
2. `https://tu-farmacia.cl/manifest.json` devuelve 200 con íconos 200 (no 404).
3. `https://tu-farmacia.cl/.well-known/assetlinks.json` devuelve 200 con SHA-256 correcto.
4. Verificación: Statement List Generator/tester de Google o `adb shell` dumpsys — confirma `delegate_permission/common.handle_all_urls` aprobado.
5. APK instalada en dispositivo físico Android: abre fullscreen (sin barra URL), flujo completo: navegar catálogo → carrito → checkout Webpay (transacción de prueba con tarjeta de prueba Transbank en ambiente producción — cancelar antes de pagar o monto mínimo) → retiro tienda → login Firebase → mis pedidos.
6. Link de pago Transbank vuelve correctamente a la app.

## Fuera de scope (fases futuras, no en este plan)

- Modo offline / service worker (next-pwa, cache catálogo)
- Push notifications (Web Push/FCM, triggers en cambio de estado de orden)
- Play Store listing + assetlinks de producción final
- Biometría (WebAuthn), share nativo
- Versión iOS

## Riesgos

- **Keystore perdido** → imposible actualizar la app (mismo packageId). Mitigación: backup inmediato del keystore en 2 ubicaciones.
- **Íconos de baja calidad** (favicon 32px escalado) → ícono pixelado. Mitigación: generar ícono programático limpio si no hay logo de alta resolución.
- **Webpay en WebView/TWA**: TWA es Chrome real, no WebView → cookies de terceros y redirects funcionan igual que en el navegador. Riesgo bajo, pero se valida en testing (paso 5).

# Tu Farmacia — Mobile API Contract

Base URL (production): `https://tu-farmacia.cl`

Android client (pure Kotlin): `pharmacy-ecommerce/apps/android-native/app`  
iOS client (future, separate Swift project): not created yet

## Authentication

| Client | Mechanism |
|--------|-----------|
| Web | `Cookie: session=<Firebase session cookie>` |
| Android / iOS | `Authorization: Bearer <Firebase ID token>` |

ID tokens come from Firebase Auth (email/password). Server verifies with `adminAuth.verifyIdToken` in `getAuthenticatedUser()`.

Custom claim `role` on the token: `user` \| `owner` \| `admin` \| `pharmacist` \| `seller`.

### Auth endpoints

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/api/auth/session` | body `idToken` | Web-only session cookie |
| DELETE | `/api/auth/session` | cookie | Logout web |
| GET | `/api/auth/me` | Bearer or cookie | `{ user: { uid, email, name, role, is_admin } }` |

### Firebase Identity Toolkit (client-side login)

- Sign-in: `POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=API_KEY`
- Refresh: `POST https://securetoken.googleapis.com/v1/token?key=API_KEY`

## Wired in Android app (`apps/android-native`)

| Method | Path | Auth | Response |
|--------|------|------|----------|
| GET | `/api/products` | no | `{ products, total, page, limit, total_pages }` |
| GET | `/api/products/{slug}` | no | product object |
| GET | `/api/products/top-sellers` | no | `TopSeller[]` |
| GET | `/api/categories` | no | `Category[]` |
| GET | `/api/search/suggest` | no | suggestions |
| GET | `/api/auth/me` | yes | current user |
| POST | `/api/auth/register` | no | create account |
| GET | `/api/orders` | yes | user orders |
| GET | `/api/orders/{id}` | yes | order detail |
| POST | `/api/store-pickup` | yes* | store reservation |
| POST | `/api/webpay/create` | yes | Webpay Plus token |
| GET | `/api/loyalty` | yes | points |
| GET | `/api/tracking/{token}` | no | public track |
| GET | `/api/admin/orders` | admin | staff orders |
| GET | `/api/admin/orders/{id}` | admin | order detail |
| PUT | `/api/admin/orders/{id}` | admin | approve/reject/refund/status |
| GET | `/api/admin/operaciones` | admin | dashboard KPIs |
| GET | `/api/admin/dashboard-extras` | admin | OCs / vencimientos |
| GET | `/api/admin/inventory` | admin | stock list |
| POST | `/api/admin/stock-movements/adjust` | admin | stock ± |
| POST | `/api/admin/pos/sale` | admin | POS sale (discount, mixed) |
| GET | `/api/admin/pos/pickup` | admin | 6-digit reservation lookup |
| GET | `/api/admin/pos/customer-history` | admin | phone/RUT history |
| GET | `/api/admin/clientes` | admin | clients |
| GET | `/api/admin/suppliers` | owner | suppliers |
| GET | `/api/admin/purchase-orders` | owner | POs |
| GET | `/api/admin/finanzas/dashboard` | owner | finance KPIs |
| GET/PUT | `/api/admin/tareas` | admin | tasks |
| GET | `/api/admin/turnos` | admin | cash shifts |
| GET | `/api/admin/faltas` | admin | stockouts |
| PATCH | `/api/admin/faltas/{id}` | admin | mark notified |
| POST | `/api/admin/faltas` | admin | create falta |
| GET | `/api/admin/arqueo` | admin | shift cash snapshot |
| GET | `/api/admin/cierre-dia` | admin | day close report |
| POST | `/api/admin/cierre-dia/email` | owner | email day summary |
| GET | `/api/admin/stock-movements` | admin | stock movement history |
| POST | `/api/admin/avisos` | owner | create announcement |
| GET/POST | `/api/admin/devoluciones` | admin | returns |
| GET/PUT | `/api/admin/products/{id}` | admin | product quick edit |
| GET | `/api/admin/barcodes/unknown` | admin | unknown scans |
| DELETE | `/api/admin/barcodes/unknown` | admin | dismiss barcode |
| GET | `/api/admin/finanzas/ap` | owner | accounts payable |
| POST | `/api/admin/finanzas/ap/{id}/pay` | owner | pay AP |
| GET/POST | `/api/admin/finanzas/gastos` | owner | expenses |
| GET | `/api/admin/purchase-orders/{id}` | owner | PO detail |
| POST | `/api/admin/purchase-orders/{id}/receive` | owner | receive stock |
| GET | `/api/admin/batches` | admin | expiry lots |
| GET | `/api/admin/inventory/reorder-suggestions` | admin | reorder |

\* Bearer optional on store-pickup server; app requires login for checkout.

Product query extras used by app: `barcode`, `sort_by`, `has_discount`, `in_stock`.

### Product query params

`page`, `limit`, `search`, `active_only`, `category`, `laboratory`, `sort_by`, `in_stock`, …

## Planned modules (ERP / storefront — not UI yet)

### Storefront

| Area | Paths |
|------|-------|
| Cart / orders | `/api/orders`, `/api/orders/{id}` |
| Checkout | `/api/webpay/create`, `/api/store-pickup` |
| Profile | `/api/profile` (PATCH) |
| Loyalty | `/api/loyalty/*` |
| Tracking | `/api/orders/track`, `/api/tracking/{token}` |

### Admin ERP (`/api/admin/*` — requires admin role)

Orders, products, stock, POS, inventory, purchases, suppliers, finance, clients, shifts, reports, users, settings, barcodes, prescriptions, etc.

Full route inventory lives under `apps/web/src/app/api/`.

## Error shape

```json
{ "error": "message", "code": "optional" }
```

HTTP 401 unauthenticated · 403 forbidden · 404 not found · 500 server.

## Clients (separate natives)

| Platform | Stack | Path |
|----------|--------|------|
| Android | Kotlin + Jetpack Compose | `apps/android-native` (`cl.tufarmacia.native`) |
| iOS | Swift + SwiftUI (later) | TBD — separate project, same API contract |
| TWA shell | Bubblewrap WebView | `apps/android` (`cl.tufarmacia.app`) — not the learning path |

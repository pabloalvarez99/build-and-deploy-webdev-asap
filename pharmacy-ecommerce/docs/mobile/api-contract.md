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

## Phase 1 (wired in Android app)

| Method | Path | Auth | Response |
|--------|------|------|----------|
| GET | `/api/products` | no | `{ products, total, page, limit, total_pages }` |
| GET | `/api/products/{slug}` | no | product object |
| GET | `/api/categories` | no | `Category[]` |
| GET | `/api/auth/me` | yes | current user |

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

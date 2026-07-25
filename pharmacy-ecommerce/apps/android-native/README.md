# Tu Farmacia — Android nativo Kotlin (Full ERP)

**Application ID:** `cl.tufarmacia.native` · **Version:** 1.1.0  
Pure Kotlin + Jetpack Compose. Separate natives (iOS later = Swift).

## Storefront
- Home, top sellers, catalog (debounced search/categories/infinite scroll)
- Product detail (qty picker), cart (DataStore), store pickup + Webpay
- Login/register, loyalty, orders, public tracking
- Auto refresh Firebase ID token before expiry

## ERP (staff tab)
| Module | API | Notes |
|--------|-----|--------|
| Dashboard | `/api/admin/operaciones`, `dashboard-extras` | KPIs, margen, reservas |
| Órdenes | `/api/admin/orders` | filter, approve/reject, mark paid |
| POS | `/api/admin/pos/sale` | cash/debit/credit · debounced search |
| Inventario | `/api/admin/inventory` + stock adjust | ±1 / +5 |
| Arqueo | `/api/admin/arqueo` | turno actual, efectivo esperado |
| Faltas | `/api/admin/faltas` | pending · mark notified |
| Clientes | `/api/admin/clientes` | registered + guests |
| Compras | `/api/admin/purchase-orders` | owner |
| Proveedores | `/api/admin/suppliers` | owner |
| Finanzas | `/api/admin/finanzas/dashboard` | owner |
| Tareas | `/api/admin/tareas` | complete open tasks |
| Turnos/Caja | `/api/admin/turnos` | cierres |

## Build
```bash
cd pharmacy-ecommerce/apps/android-native
./gradlew :app:assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

## Layout
```
app/src/main/kotlin/cl/tufarmacia/app/
  data/api|auth|cart|model
  ui/screens          # storefront
  ui/erp              # ErpViewModel + ErpScreens (Full ERP)
  ui/WebpayActivity.kt
```

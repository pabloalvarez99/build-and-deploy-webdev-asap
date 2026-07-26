# Tu Farmacia — Android nativo Kotlin (Full ERP)

**Application ID:** `cl.tufarmacia.native` · **Version:** 1.4.0  
Pure Kotlin + Jetpack Compose. Separate natives (iOS later = Swift).

## Storefront
- Home, top sellers, catalog (debounced search/categories/infinite scroll)
- Product detail (qty picker), cart (DataStore), store pickup + Webpay
- Login/register, loyalty, orders, public tracking
- Auto refresh Firebase ID token before expiry
- **v1.2:** Spanish order statuses, larger senior typography, Webpay keeps cart until payment success, CL phone/email validation

## ERP (staff tab)
| Module | API | Notes |
|--------|-----|--------|
| Dashboard | `/api/admin/operaciones`, `dashboard-extras` | KPIs, margen, reservas |
| Órdenes | `/api/admin/orders` | filter, approve/reject, mark paid, **refund/cancel**, open detail |
| POS | `/api/admin/pos/sale` | cash/debit/credit/**mixed** · barcode · discount · customer history · **pickup 6-digit** |
| Inventario | `/api/admin/inventory` + stock adjust | ±1/+5 · reason chips · barcode Δ · crear falta |
| Lotes | `/api/admin/batches` | expired / soon30 / soon90 |
| Reposición | `/api/admin/inventory/reorder-suggestions` | por proveedor |
| Arqueo | `/api/admin/arqueo` | turno actual, efectivo esperado |
| Faltas | `/api/admin/faltas` | pending · mark notified · create |
| Clientes | `/api/admin/clientes` | registered + guests |
| Compras | `/api/admin/purchase-orders` | owner · **detail + receive** |
| Proveedores | `/api/admin/suppliers` | owner |
| Finanzas | `/api/admin/finanzas/dashboard` | owner |
| Tareas | `/api/admin/tareas` | complete open tasks |
| Turnos/Caja | `/api/admin/turnos` | cierres |

### Counter + stock (v1.2–1.3)
- Barcode field → `GET /api/products?barcode=`
- Discount $ + mixed cash/card · pickup 6-digit · customer history
- PO receive → `POST …/purchase-orders/{id}/receive`

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
  util/               # OrderStatusLabels, ChileValidation, Money
```

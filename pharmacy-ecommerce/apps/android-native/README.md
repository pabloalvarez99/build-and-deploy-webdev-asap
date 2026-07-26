# Tu Farmacia — Android nativo Kotlin (Full ERP)

**Application ID:** `cl.tufarmacia.native` · **Version:** 1.5.1  
Pure Kotlin + Jetpack Compose. Separate natives (iOS later = Swift).

## Storefront
- Home, top sellers, catalog (debounced search/categories/infinite scroll)
- Product detail (qty picker), cart (DataStore), store pickup + Webpay
- Login/register, loyalty, orders, public tracking
- Auto refresh Firebase ID token before expiry
- Search suggest, en stock / descuento / sort, cart stock revalidate
- Spanish order statuses, senior typography, Webpay cart-safe, CL validation

## ERP (staff tab)
| Module | API | Notes |
|--------|-----|--------|
| Dashboard | `/api/admin/operaciones`, `dashboard-extras` | KPIs, margen, reservas |
| Órdenes | `/api/admin/orders` | filter, approve/reject, mark paid, refund/cancel |
| POS | `/api/admin/pos/sale` | mixed · barcode · discount · pickup · history |
| Inventario | inventory + stock adjust + products | adjust · reason · **edit price/stock** |
| Lotes | `/api/admin/batches` | expired / soon30 / soon90 |
| Reposición | reorder-suggestions | por proveedor |
| Devoluciones | `/api/admin/devoluciones` | list + create |
| Barcodes | `/api/admin/barcodes/unknown` | triage / dismiss |
| Arqueo | `/api/admin/arqueo` | turno actual |
| Faltas | `/api/admin/faltas` | pending · notify · create |
| Clientes | `/api/admin/clientes` | registered + guests |
| Compras | purchase-orders | detail + **receive** |
| Proveedores | `/api/admin/suppliers` | owner |
| Finanzas | dashboard + AP + gastos | **pay AP** · quick gasto |
| Tareas | `/api/admin/tareas` | complete |
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
  util/               # OrderStatusLabels, ChileValidation, Money
```

# Tu Farmacia — Android nativo Kotlin (Full ERP)

**Application ID:** `cl.tufarmacia.native` · **Version:** 1.7.1  
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
| Hub | `/api/admin/avisos` | avisos internos pinned |
| Dashboard | `/api/admin/operaciones`, `dashboard-extras` | KPIs · reservas → POS prefill |
| Órdenes | `/api/admin/orders` | filter · staff actions · **detail actions** |
| POS | `/api/admin/pos/sale` | confirm · notes · mixed · barcode · pickup |
| Inventario | inventory + stock adjust + products | adjust · reason · **edit price/stock** |
| Lotes | `/api/admin/batches` | expired / soon30 / soon90 |
| Reposición | reorder-suggestions + express | email express por proveedor |
| Devoluciones | `/api/admin/devoluciones` | list + create |
| Barcodes | `/api/admin/barcodes/unknown` | triage / dismiss |
| Arqueo | `/api/admin/arqueo` | **set_fondo · cerrar · farmacéutico** |
| Faltas | `/api/admin/faltas` | pending · notify · create |
| Clientes | `/api/admin/clientes` + detail | KPIs · historial |
| Compras | purchase-orders | detail + **receive** |
| Proveedores | `/api/admin/suppliers` | owner |
| Finanzas | dashboard + AP + gastos | **pay AP** · quick gasto |
| Tareas | `/api/admin/tareas` | **create** · complete |
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

## v1.7.1
- Clientes: búsqueda local nombre/email/tel
- POS: tarjeta última venta (total · medio · ítems)

## v1.7.0
- Arqueo write: fondo inicial, cerrar turno, turno farmacéutico
- Hub avisos; cliente detail (KPIs + pedidos)
- Order detail staff actions; POS confirm + notas + pickup prefill
- Crear tareas; reposición email express

## v1.6.0
- Camera barcode (ML Kit) on POS + inventory
- Forgot password (Firebase) + edit profile (name/phone)
- Offline banner when no network
- Accessibility: font Normal/Grande/Extra + high contrast (DataStore)

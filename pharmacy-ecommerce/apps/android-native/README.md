# Tu Farmacia — Android nativo Kotlin (Full ERP)

**Application ID:** `cl.tufarmacia.native` · **Version:** 1.8.1  
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
| POS | `/api/admin/pos/sale` | confirm · notes · **recientes** · **share ticket** |
| Inventario | inventory + stock adjust + products | adjust · reason · **edit price/stock** |
| Lotes | `/api/admin/batches` | expired / soon30 / soon90 |
| Reposición | reorder-suggestions + express + **OC draft** | crear OC · email express |
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

## Build / install
```powershell
# recommended (build + adb install + launch)
.\pharmacy-ecommerce\apps\android-native\scripts\install-debug.ps1

# or manual
cd pharmacy-ecommerce/apps/android-native
.\gradlew.bat :app:assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```
See `scripts/SIDELOAD.md` for USB/wireless debugging checklist.

## Layout
```
app/src/main/kotlin/cl/tufarmacia/app/
  data/api|auth|cart|model
  ui/screens          # storefront
  ui/erp              # ErpViewModel + split screens (Hub/POS/…)
  ui/WebpayActivity.kt
  util/
scripts/              # install-debug.ps1|.sh + SIDELOAD.md
```

## v1.8.1
- Design system: Theme tokens + UiKit (cards, buttons, pills, steppers, empty states)
- Home hero + quick tiles; catalog/PDP/cart/checkout/account polish
- Bottom nav colors; senior-friendly spacing & contrast

## v1.8.0
- POS: recientes del turno + compartir ticket (share sheet / WhatsApp)
- Reposición: crear OC draft (POST purchase-orders) + email express
- Split UI ERP en módulos (ErpPosScreen, ErpModules, …)
- install-debug.ps1 / .sh + SIDELOAD checklist

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

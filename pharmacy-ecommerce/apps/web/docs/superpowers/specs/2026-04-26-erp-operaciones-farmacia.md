# ERP Operaciones Farmacia — Diseño Completo

**Fecha:** 2026-04-26
**Foco:** Dueño + farmacéutico en turno
**Prioridad:** Legal primero, luego financiero, luego operacional

---

## Contexto

La farmacia ya vende productos con receta retenida sin registro digital → riesgo legal activo (ISP/Seremi, Decreto 466).
`cost_price` existe en BD pero nunca se usa para calcular ganancia en tiempo real.
El dueño no tiene visibilidad financiera sin entrar a la plataforma.

Stack existente relevante: Cloud SQL PostgreSQL 15, Prisma 7, Next.js 14, Resend (email), Vercel cron.

---

## Módulo 1 — P&L + Metas de Ventas (sin migración DB)

### Objetivo
El dueño ve en `/admin/operaciones` cuánto ganó hoy y si va en camino a su meta.

### API — `/api/admin/operaciones` (extensión)

Nuevas queries paralelas al `Promise.all` existente:

```sql
-- Costo de ventas hoy
SELECT COALESCE(SUM(oi.quantity * p.cost_price), 0) AS costo_hoy
FROM order_items oi
JOIN products p ON oi.product_id = p.id
JOIN orders o ON oi.order_id = o.id
WHERE o.created_at >= :today_start
  AND o.status IN ('paid', 'completed')
  AND p.cost_price > 0

-- Ventas mes actual
SELECT COALESCE(SUM(total), 0) AS ventas_mes, COUNT(id) AS ordenes_mes
FROM orders
WHERE created_at >= :month_start
  AND status IN ('paid', 'completed', 'reserved')
```

Plus: `admin_settings` lookup para keys `daily_sales_target` y `monthly_sales_target`.

Nuevos campos en response:
```ts
{
  pl: {
    costo_hoy: number,
    margen_bruto_hoy: number,      // ventas_hoy - costo_hoy
    margen_pct_hoy: number,        // margen / ventas * 100
    costo_calculable: boolean,     // false si no hay cost_price cargado
  },
  metas: {
    diaria: number | null,
    mensual: number | null,
    ventas_mes: number,
    ordenes_mes: number,
    pct_diario: number | null,     // ventas_hoy / meta_diaria * 100
    pct_mensual: number | null,
  }
}
```

### UI — `/admin/operaciones`

**Bloque metas** (solo si `metas.diaria` configurada):
```
┌─────────────────────────────────────────────────┐
│ Meta diaria  $450.000 / $600.000  ████████░░ 75%│
│             verde ≥80% · amber 50-79% · rojo <50%│
└─────────────────────────────────────────────────┘
```

**Bloque P&L** (solo si `pl.costo_calculable`):
```
┌──────────────────┐  ┌──────────────────┐
│ Margen bruto hoy │  │ Costo ventas hoy │
│ $180.000  (40%)  │  │ $270.000         │
└──────────────────┘  └──────────────────┘
```

Si `!pl.costo_calculable`: banner amber "Carga cost_price en productos para ver margen".

### Configuración — `/admin/configuracion`

Nueva sección "Metas de Ventas":
- Input: Meta diaria ($CLP)
- Input: Meta mensual ($CLP)
- Guarda con `PATCH /api/admin/settings` (ya existe)

---

## Módulo 2 — Libro de Recetas + Turno Farmacéutico

### Schema — 2 tablas nuevas

```prisma
model prescription_records {
  id                  String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  order_id            String?   @db.Uuid
  product_id          String?   @db.Uuid
  product_name        String    @db.VarChar(255)
  quantity            Int
  prescription_number String?   @db.VarChar(100)
  patient_name        String    @db.VarChar(255)
  patient_rut         String?   @db.VarChar(20)
  doctor_name         String?   @db.VarChar(255)
  medical_center      String?   @db.VarChar(255)
  prescription_date   DateTime? @db.Date
  is_controlled       Boolean   @default(false)
  dispensed_by        String?   @db.VarChar(255)
  dispensed_at        DateTime  @default(now()) @db.Timestamptz(6)
  orders              orders?   @relation(fields: [order_id], references: [id], onDelete: SetNull)
  products            products? @relation(fields: [product_id], references: [id], onDelete: SetNull)

  @@index([dispensed_at])
  @@index([patient_rut])
}

model pharmacist_shifts {
  id              String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  pharmacist_name String    @db.VarChar(255)
  pharmacist_rut  String    @db.VarChar(20)
  shift_start     DateTime  @db.Timestamptz(6)
  shift_end       DateTime? @db.Timestamptz(6)
  notes           String?
  created_at      DateTime  @default(now()) @db.Timestamptz(6)

  @@index([shift_start])
}
```

### POS — modal receta

Trigger: al confirmar venta, si algún item tiene `prescription_type IN ('retenida', 'magistral')`.

Modal obligatorio (no se puede skipear):
```
┌─ Receta retenida — [Nombre Producto] ──────────┐
│ Nro. Receta        [____________]              │
│ Nombre Paciente *  [____________]              │
│ RUT Paciente       [____________]              │
│ Médico             [____________]              │
│ Centro / Clínica   [____________]              │
│ Fecha Receta       [date picker]               │
│ ┌─────────────────────────────────────────┐   │
│ │ ⚠ Psicotrópico/Estupefaciente          │   │ ← si is_controlled
│ └─────────────────────────────────────────┘   │
│                    [Cancelar] [Confirmar venta]│
└────────────────────────────────────────────────┘
```

API: `POST /api/admin/pos/sale` → si hay items con receta, también `POST /api/admin/prescriptions`.

`is_controlled`: determinado por lista hardcodeada de principios activos (clonazepam, alprazolam, lorazepam, morfina, codeína, etc.) o campo `is_controlled` en products (a agregar en schema).

### Página `/admin/libro-recetas`

- Tabla: fecha, producto, paciente, RUT, médico, nro receta, farmacéutico, tipo
- Filtros: rango fechas, producto, is_controlled
- Export PDF: formato tabla A4 para presentar a ISP
- KPI header: recetas hoy / mes
- Badge sidebar con count del día

### API routes

```
GET  /api/admin/prescriptions          → lista paginada con filtros
POST /api/admin/prescriptions          → crear registro (llamado desde POS)
GET  /api/admin/prescriptions/export   → PDF o CSV
```

### Arqueo — turno farmacéutico

En `/admin/arqueo`, al iniciar turno (botón "Iniciar turno"):
- Modal: Nombre farmacéutico + RUT
- Guarda en `pharmacist_shifts`
- El nombre queda en localStorage para pre-llenar `dispensed_by` en recetas

Al cerrar turno: muestra el farmacéutico activo, opción de agregar notas de turno.

---

## Módulo 3 — Resumen Nocturno (Email Automático)

### Cron

Nueva entrada en `vercel.json`:
```json
{ "path": "/api/cron/daily-summary", "schedule": "0 2 * * *" }
```
(02:00 UTC = 22:00 Chile invierno / 23:00 verano — aceptable)

Ruta protegida con `CRON_SECRET` (ya existe).

### Email vía Resend

Destinatario: `admin_settings.alert_email`

Contenido (HTML template):
1. **Resumen del día**: ventas totales, nro órdenes, vs ayer (delta %)
2. **Margen bruto estimado** (si hay cost_price)
3. **Meta**: % alcanzado de meta diaria
4. **Caja**: diferencia del último arqueo cerrado del día
5. **Top 5 productos** vendidos hoy (nombre + cantidad + total)
6. **Alertas mañana**:
   - Reservas por expirar en < 12h
   - Productos que vencen en < 7 días
   - Stock en 0 (count)
   - Faltas pendientes con stock ya disponible

---

## Módulo 4 — Pedido Express Proveedor

### Flujo

En `/admin/reposicion` → botón **"Enviar pedido"** en sección de proveedor.

Modal:
1. Proveedor pre-seleccionado (del grupo de reposición)
2. Lista de productos con cantidades sugeridas (editables)
3. Botón **"Crear OC + Copiar para WhatsApp"**
   - Crea `purchase_order` en estado `draft` con los items
   - Copia al clipboard texto formateado:
     ```
     Pedido Tu Farmacia — [fecha]
     Proveedor: Mediven

     - Paracetamol 500mg x 100 — Qty: 50
     - Ibuprofeno 400mg x 30 — Qty: 30
     ...
     Total ítems: N
     ```
4. Botón alternativo **"Enviar por email"** → `mailto:` con el mismo contenido (si el proveedor tiene email en BD)

---

## Orden de Implementación

| # | Tarea | DB change | Tiempo est. |
|---|-------|-----------|-------------|
| 1 | P&L + metas en operaciones | No | 2-3h |
| 2 | Metas en configuración | No | 1h |
| 3 | Schema migration (2 tablas) | Sí | 30m |
| 4 | Modal receta en POS | No | 2h |
| 5 | API + página libro-recetas | No | 3h |
| 6 | Turno farmacéutico en arqueo | No | 2h |
| 7 | Cron resumen nocturno + email | No | 2h |
| 8 | Pedido express proveedor | No | 2h |

Total estimado: ~15h de implementación

---

## Decisiones de Diseño

- **P&L solo ganancia bruta**: overhead no se deduce aquí (ya está en `/admin/costos`). Mezclar confunde.
- **`is_controlled` hardcodeado**: lista de principios activos en `lib/controlled-substances.ts`. No requiere campo DB extra inicialmente.
- **Modal receta no skipeable**: si el farmacéutico cierra el modal, la venta no se confirma. Sin excepción.
- **Turno en localStorage**: `pharmacist_name` se guarda en localStorage para pre-llenar recetas del turno. Se limpia al cerrar turno.
- **Cron 02:00 UTC**: corresponde a 22:00-23:00 Chile según horario de verano/invierno. Aceptable para resumen nocturno.
- **DTE boleta electrónica**: fuera de scope de esta fase. Requiere proveedor externo (Bsale, Acepta). Se diseña en spec separado.
- **PDF libro-recetas**: implementado con `window.print()` + CSS `@media print`. Sin librería externa. El usuario imprime desde el browser.

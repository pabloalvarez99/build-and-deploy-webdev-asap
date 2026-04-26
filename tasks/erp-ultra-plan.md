# ERP Ultra-Profesional — Plan Maestro

**Fecha**: 2026-04-25  
**Estado actual**: ~50 API routes, 20+ páginas admin, schema 18 modelos  
**Objetivo**: ERP de nivel enterprise para farmacia chilena

---

## Estado Actual (ya implementado)
- ✅ POS con pagos mixtos (efectivo/débito/crédito)
- ✅ Proveedores + Órdenes de Compra + OCR facturas
- ✅ Stock movements + ajustes + reposición
- ✅ Vencimientos por lote (product_batches)
- ✅ Inventario valorizado
- ✅ Reportes (ventas/financiero/clientes/compras/fidelidad)
- ✅ Arqueo de caja
- ✅ Fidelidad / loyalty points
- ✅ Faltas / lista de productos sin stock
- ✅ Descuentos configurables
- ✅ Costos + precio proveedor comparado
- ✅ Catálogo con barcodes
- ✅ Clientes (registrados + guests)
- ✅ Import/export Excel masivo

---

## FASE 2 — Devoluciones (PRIORIDAD MÁXIMA)

### Por qué primero
Sin devoluciones, el sistema no cumple normativa mínima. Cualquier error de POS o venta online sin retiro genera inconsistencia de stock.

### Schema nuevo
```sql
-- devoluciones: registra devolución de venta
CREATE TABLE devoluciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  tipo VARCHAR(20) NOT NULL, -- 'venta' | 'compra'
  motivo VARCHAR(255) NOT NULL,
  notas TEXT,
  total_devuelto DECIMAL(10,2) NOT NULL,
  metodo_reembolso VARCHAR(50), -- 'efectivo' | 'credito_tienda' | 'webpay'
  procesado_por VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE devolucion_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  devolucion_id UUID REFERENCES devoluciones(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  restock BOOLEAN DEFAULT true
);
```

### APIs
- `POST /api/admin/devoluciones` — crear devolución, restaurar stock (si restock=true), crear stock_movement reason='return'
- `GET /api/admin/devoluciones` — lista con filtros (fecha, tipo, orden)
- `GET /api/admin/devoluciones/[id]` — detalle

### Página
- `/admin/ordenes/[id]` — botón "Devolver" → modal con items seleccionables + cantidad + motivo
- `/admin/devoluciones` — lista de todas las devoluciones

---

## FASE 3 — Análisis ABC + Rotación Inventario

### Por qué
Permite identificar qué productos merecen inversión vs. cuáles descontinuar. Clave para farmacia con 1482 productos.

### Lógica ABC
- **Clase A**: top 20% productos → 80% revenue (Pareto)
- **Clase B**: siguientes 30% → 15% revenue
- **Clase C**: restantes 50% → 5% revenue

### Rotación
- `rotacion = unidades_vendidas_30d / stock_actual`
- `dias_stock = stock_actual / (unidades_vendidas_30d / 30)`

### Implementación
- Tab "ABC" en `/admin/inventario`
- API: `GET /api/admin/inventory?tab=abc&days=90` — query SQL con SUM(quantity) por product, calcular % acumulado, asignar clase
- Tabla exportable: producto, clase A/B/C, revenue, % acumulado, días stock, rotación
- Badge de color: verde (A), amarillo (B), rojo (C)

---

## FASE 4 — Auditoría de Cambios

### Por qué
Requisito legal y operacional. Saber quién cambió qué precio, qué stock, qué orden.

### Schema
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email VARCHAR(255) NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'create' | 'update' | 'delete'
  entity VARCHAR(100) NOT NULL, -- 'product' | 'order' | 'supplier' | etc.
  entity_id VARCHAR(255),
  entity_name VARCHAR(255),
  changes JSONB, -- { field: { old, new } }
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_entity ON audit_log(entity, entity_id);
CREATE INDEX idx_audit_user ON audit_log(user_email);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);
```

### Integración
- Helper `logAudit(email, action, entity, entityId, changes)` en `lib/audit.ts`
- Llamar en: PUT products/[id], PUT orders/[id], price updates, stock adjusts
- Página `/admin/configuracion` → tab "Auditoría" con tabla filtrable

---

## FASE 5 — Dashboard Home Mejorado

### Problema actual
`/admin/page.tsx` (737 líneas) muestra stats básicas pero no tiene:
- Comparativa real vs. período anterior en gráfico
- Alertas consolidadas (stock + vencimientos + OCs pendientes)
- Margen bruto del día
- Flujo de caja en tiempo real

### Mejoras
1. **Widget "Hoy vs Ayer"** — revenue, órdenes, margen, con % cambio y flecha
2. **Widget "Alertas Activas"** — consolidado: stock bajo, vencimientos <30d, OCs draft >3d
3. **Widget "Top 5 Hoy"** — productos más vendidos del día actual
4. **Widget "Caja del día"** — efectivo/débito/crédito separado, total arqueo pendiente
5. **Calendario de vencimientos** — mini-heatmap próximos 60 días

---

## FASE 6 — Bioequivalentes en POS

### Por qué
Normativa ISP Chile obliga a ofrecer bioequivalente. Multa si no se ofrece.

### Schema
```sql
CREATE TABLE product_bioequivalents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  equivalent_id UUID REFERENCES products(id) ON DELETE CASCADE,
  is_cheaper BOOLEAN GENERATED ALWAYS AS (true) STORED,
  UNIQUE(product_id, equivalent_id)
);
```

### POS integration
- Al agregar producto al carrito → API check `GET /api/admin/bioequivalents/[id]`
- Si hay equivalente más barato → toast "Bioequivalente disponible: [nombre] $X menos"
- Click → sustituir en carrito o agregar ambos

### Admin
- `/admin/catalogo` → columna "Bioequivalentes" con badge + botón asignar
- Modal de asignación con búsqueda de producto equivalente

---

## FASE 7 — Predicción de Demanda Simple

### Algoritmo
Moving average exponencial (EMA) 30 días:
```
demanda_estimada = α * ventas_recientes + (1-α) * demanda_anterior
```
Con α = 0.3

### Implementación
- Calcular en `/api/admin/inventory/reorder-suggestions` (ya existe)
- Agregar campo `forecast_30d` y `stockout_date` (fecha estimada agotamiento)
- Mostrar en `/admin/reposicion` → columna "Agotamiento estimado" con semáforo

---

## FASE 8 — Facturación Electrónica SII (DTE)

### Contexto
Obligatorio en Chile para contribuyentes. Requiere:
- Certificado digital del SII (.p12)
- Clave privada para firma XML
- Folios CAF (autorización de folio)
- Generación XML formato SII + firma
- Envío SOAP a SII

### Complejidad: ALTA (2-3 días)
### Opciones
1. **Propio**: implementar generación XML + firma PKCS#1 (muy complejo)
2. **Proveedor**: integrar Bsale, Defontana, o API de tercero (~$30K CLP/mes)
3. **Middleware**: usar `sii-dte` npm package (open source, activo)

### Plan
- Usar `facturacion-electronica-sii` o `node-dte-sii` npm
- Schema: `dte_documents` (tipo, folio, rut_receptor, monto, xml, timestamp, sii_trackid)
- Generar boleta electrónica en POS al cerrar venta
- Generar factura electrónica en compras al recibir OC
- PDF/HTML de boleta para imprimir/enviar por WhatsApp

---

## FASE 9 — Módulo de Recetas Médicas

### Contexto
~20% productos farmacia = receta médica retenida. Sin control → multa ISP.

### Schema
```sql
CREATE TABLE prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  product_id UUID REFERENCES products(id),
  patient_name VARCHAR(255) NOT NULL,
  patient_rut VARCHAR(20),
  doctor_name VARCHAR(255),
  doctor_registration VARCHAR(50), -- N° registro profesional
  diagnosis_code VARCHAR(20), -- CIE-10
  issue_date DATE NOT NULL,
  dispensed_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  image_url TEXT -- foto receta
);
```

### POS integration
- Productos con `prescription_type = 'retenida'` → bloquear sin receta cargada
- Modal de captura de receta al agregar al carrito
- OCR de receta (Google Vision API ya disponible)

### Admin
- `/admin/recetas` — lista de recetas despachadas, búsqueda por RUT/producto
- Exportar libro de recetas retenidas (PDF)

---

## FASE 10 — Notificaciones Automáticas

### Tipos
1. **Stock bajo** → email diario a las 8AM con productos bajo umbral
2. **Vencimientos** → email semanal con lotes que vencen en <30 días
3. **OCs en draft >48h** → email al admin
4. **Ventas > meta diaria** → email celebración (opcional)

### Implementación
- Ampliar `/api/cron/cleanup-orders` → separar en múltiples crons
- Nuevo cron: `GET /api/cron/daily-report` → genera email HTML con Resend
- Nuevo cron: `GET /api/cron/weekly-alerts` → vencimientos + faltas

### Cron schedule (Vercel)
```json
{
  "crons": [
    { "path": "/api/cron/cleanup-orders", "schedule": "0 3 * * *" },
    { "path": "/api/cron/daily-report", "schedule": "0 8 * * *" },
    { "path": "/api/cron/weekly-alerts", "schedule": "0 9 * * 1" }
  ]
}
```

---

## Orden de Ejecución

| Fase | Módulo | Impacto | Dificultad | Días |
|------|--------|---------|------------|------|
| 2 | Devoluciones | 🔴 Crítico | Media | 1 |
| 3 | ABC + Rotación | 🟠 Alto | Baja | 0.5 |
| 4 | Auditoría | 🟠 Alto | Baja | 0.5 |
| 5 | Dashboard mejorado | 🟡 Medio | Media | 1 |
| 6 | Bioequivalentes | 🟠 Alto (legal) | Media | 1 |
| 10 | Notificaciones cron | 🟡 Medio | Baja | 0.5 |
| 7 | Predicción demanda | 🟡 Medio | Media | 1 |
| 8 | SII/DTE | 🔴 Crítico (legal) | Alta | 3 |
| 9 | Recetas médicas | 🟠 Alto (legal) | Alta | 2 |

**Empezar ahora**: Fases 2, 3, 4 (máximo impacto / mínima complejidad)

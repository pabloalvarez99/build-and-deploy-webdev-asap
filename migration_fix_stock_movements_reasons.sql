-- Fix: stock_movements_reason_check demasiado estrecho → bloqueaba POS, ajustes
-- manuales, devoluciones, reembolsos y agotado_excel.
--
-- Causa raíz: migration_ventas_historicas.sql redefinió el CHECK con solo el set
-- español (reposicion/correccion/merma/inventario/venta/import_excel/ventas_historicas),
-- omitiendo los reasons que la app realmente escribe en stock_movements:
--   sale_pos (POS), adjustment/damage/transfer/count_correction (ajuste manual),
--   return (devoluciones), devolucion (reembolso online), agotado_excel (import),
--   y los del display config (sale/purchase/cancelled).
--
-- Solución: ampliar el CHECK a la UNIÓN auditada de todos los reasons que escribe
-- la app. Sin cambios de código, sin borrar datos. Append-only audit log.

ALTER TABLE stock_movements DROP CONSTRAINT IF EXISTS stock_movements_reason_check;
ALTER TABLE stock_movements ADD CONSTRAINT stock_movements_reason_check
  CHECK (reason = ANY (ARRAY[
    -- set español original (no tocar, datos existentes)
    'reposicion','correccion','merma','inventario','venta','import_excel','ventas_historicas',
    -- escritos por la app (inglés)
    'sale_pos',          -- /api/admin/pos/sale
    'adjustment',        -- /api/admin/stock-movements/adjust + import
    'damage','transfer','count_correction',  -- /api/admin/stock-movements/adjust
    'return',            -- /api/admin/devoluciones
    'devolucion',        -- /api/admin/orders/[id] (reembolso)
    'agotado_excel',     -- /api/admin/products/import (producto a 0)
    -- vocabulario del display (stock/page.tsx) — futuro-proof
    'sale','purchase','cancelled'
  ]));
